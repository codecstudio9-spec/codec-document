// Supabase Edge Function — convierte lo que el usuario DICTÓ en valores para
// los campos del formulario de una plantilla.
//
// El micrófono no pasa por aquí. El reconocimiento de voz ocurre en el
// navegador (SpeechRecognition), que es gratis y no gasta la clave de la IA;
// aquí sólo llega el texto ya transcrito. Eso además evita subir audio a
// ningún servidor.
//
// Lo que hace el modelo es una sola cosa: repartir ese texto entre los campos
// que se le pasan. NO redacta el documento, NO inventa datos y NO decide qué
// campos existen — la lista de campos viene del cliente y la respuesta se
// valida contra ella antes de devolverla.
//
// Esa validación es el corazón de la función, no un detalle. Un modelo puede
// devolver una fecha mal formada, una opción de lista que no existe o un campo
// inventado, y cualquiera de las tres cosas metida en un documento que alguien
// va a firmar es peor que no rellenar nada. Todo lo que no supere la
// validación se descarta en silencio y el campo se queda vacío, que es el
// estado honesto.
//
// Deploy:
//   supabase functions deploy ai-fill-form --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reutiliza el GROQ_API_KEY que ya usan ai-document-review y
// ai-improve-clause.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const MAX_TRANSCRIPT_CHARS = 6000;
const MAX_CAMPOS = 60;
const MAX_VALOR_CHARS = 2000;

interface CampoEntrada {
  id: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
}

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

const responder = (cuerpo: unknown, origin: string | null, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: corsHeaders(origin) });

function construirPrompt(campos: CampoEntrada[], transcripcion: string, language: 'en' | 'es', hoy: string): string {
  const idioma = language === 'en' ? 'English' : 'Spanish';

  const descripcion = campos.map((c) => {
    const partes = [`- "${c.id}" (${c.type}): ${c.label}`];
    if (c.options?.length) {
      partes.push(`  allowed values (copy one EXACTLY): ${c.options.map((o) => JSON.stringify(o)).join(' | ')}`);
    }
    return partes.join('\n');
  }).join('\n');

  return [
    `You extract form values from a person speaking out loud in ${idioma}. Today is ${hoy}.`,
    ``,
    `FIELDS:`,
    descripcion,
    ``,
    `WHAT THE PERSON SAID:`,
    `"""`,
    transcripcion,
    `"""`,
    ``,
    `Rules:`,
    `1. Return ONLY a JSON object of the form {"values": {"field_id": "value", ...}}. No prose, no markdown.`,
    `2. Include a field ONLY if the person actually stated it. Never guess a name, an ID number, an amount or a date that was not said. Omitting a field is always better than inventing it — a wrong value goes into a document someone signs.`,
    `3. date fields: output strictly YYYY-MM-DD. Resolve relative expressions ("next Friday", "end of the month", "in two weeks") against today's date, ${hoy}. If it cannot be resolved to a precise day, omit the field.`,
    `4. Fields with allowed values: copy one of them character for character. If nothing said matches one clearly, omit the field.`,
    `5. number and currency fields: digits only, no thousands separators, no currency symbol. "eight and a half million" becomes 8500000.`,
    `6. checkbox fields: true or false.`,
    `7. Long text fields (textarea): write what the person said in clean, well-punctuated ${idioma}, keeping their meaning and their voice. Do not add facts they did not say.`,
    `8. Every other field: keep it short and literal, in ${idioma}. Proper names and places keep their capitalisation.`,
    `9. A field asking for the NAME of a company, employer or organisation takes the name as spoken ("Centro de Idiomas Universal"). Never put a tax id, NIT, registration number or any bare number there, even if the person said it right next to the name.`,
    `10. A field asking HOW LONG someone has worked somewhere takes a duration ("6 meses", "2 años y 4 meses"). Never a date, and never an ID number.`,
    `11. Do not reuse the same number in two different fields. An ID number belongs only in the ID field; a phone number only in the phone field. If you are unsure which field a number belongs to, omit it.`,
  ].join('\n');
}

/** Deja pasar sólo lo que encaja con el campo que dice ser. Devuelve el valor
 *  ya normalizado, o null si hay que descartarlo. */
function validarValor(campo: CampoEntrada, crudo: unknown): string | number | boolean | null {
  if (crudo === null || crudo === undefined) return null;

  if (campo.type === 'checkbox') {
    if (typeof crudo === 'boolean') return crudo;
    const s = String(crudo).trim().toLowerCase();
    if (['true', 'sí', 'si', 'yes', '1'].includes(s)) return true;
    if (['false', 'no', '0'].includes(s)) return false;
    return null;
  }

  const texto = String(crudo).trim();
  if (!texto || texto.length > MAX_VALOR_CHARS) return null;

  // Un modelo que no sabe algo a veces devuelve el hueco en vez de callarse.
  if (/^(n\/?a|none|null|undefined|unknown|desconocido|no especificado|no dice|-{1,3})$/i.test(texto)) return null;

  if (campo.options?.length) {
    const exacta = campo.options.find((o) => o === texto);
    if (exacta) return exacta;
    // Una diferencia de mayúsculas o de espacios no debería tirar el valor,
    // pero cualquier otra cosa sí: la opción tiene que ser una de la lista.
    const laxa = campo.options.find(
      (o) => o.trim().toLowerCase() === texto.trim().toLowerCase(),
    );
    return laxa ?? null;
  }

  if (campo.type === 'date') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    // Rechaza un 31 de febrero, que pasa el patrón pero no es una fecha.
    if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return null;
    return texto;
  }

  if (campo.type === 'number' || campo.type === 'currency') {
    const limpio = texto.replace(/[^\d.]/g, '');
    if (!limpio || !/^\d+(\.\d+)?$/.test(limpio)) return null;
    return limpio;
  }

  if (campo.type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto) ? texto : null;
  }

  // Una cifra sola donde se esperaba texto casi siempre es un número que el
  // modelo colocó en la casilla equivocada. Pasó en una carta real: el NIT de
  // la empresa acabó en «nombre de la empresa» y la cédula en «tiempo que
  // llevas en la empresa», así que la carta decía «renuncio al cargo que vengo
  // desempeñando en 900500536, completando a la fecha 1022925002 de servicio».
  //
  // Se descarta salvo que el campo sea de los que sí llevan un número escrito
  // como texto: cédula, NIT, teléfono, códigos. Al usuario se le dice cuántos
  // valores se descartaron para que los escriba a mano — vacío es recuperable,
  // un dato plausible en el sitio equivocado pasa desapercibido y se firma.
  if (PIDE_NUMERO.test(campo.id) === false && PIDE_NUMERO.test(campo.label) === false) {
    const soloCifras = texto.replace(/[\s.\-()]/g, '');
    if (/^\d{5,}$/.test(soloCifras)) return null;
  }

  return texto;
}

/** Campos donde un número escrito como texto es exactamente lo esperado. */
const PIDE_NUMERO = /\b(id|c[eé]dula|cedula|nit|documento|document|dni|rut|curp|rfc|tel|phone|celular|m[oó]vil|n[uú]mero|number|c[oó]digo|code|cuenta|account|matr[ií]cula|placa|vin|zip|postal)\b/i;

/** El modelo devuelve JSON, pero a veces envuelto en ```json o con una frase
 *  delante. Se recorta al primer objeto equilibrado antes de parsear. */
function extraerJson(bruto: string): unknown {
  const texto = bruto.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const inicio = texto.indexOf('{');
  if (inicio < 0) return null;
  let nivel = 0;
  let enCadena = false;
  let escapado = false;
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];
    if (enCadena) {
      if (escapado) escapado = false;
      else if (c === '\\') escapado = true;
      else if (c === '"') enCadena = false;
      continue;
    }
    if (c === '"') enCadena = true;
    else if (c === '{') nivel++;
    else if (c === '}') {
      nivel--;
      if (nivel === 0) {
        try { return JSON.parse(texto.slice(inicio, i + 1)); } catch { return null; }
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });

  try {
    if (!GROQ_API_KEY) {
      return responder({ error: 'El dictado con IA no está configurado en el servidor.' }, origin, 500);
    }

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt) return responder({ error: 'Authentication required.' }, origin, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const authedUser = userData?.user;
    if (userErr || !authedUser) return responder({ error: 'Invalid session.' }, origin, 401);

    // Misma puerta que ai-document-review y ai-improve-clause.
    const email = (authedUser.email ?? '').toLowerCase().trim();
    if (!ADMIN_EMAILS.includes(email)) {
      const { data: profile } = await admin
        .from('users')
        .select('plan_status, plan_expires_at, role')
        .eq('id', authedUser.id)
        .maybeSingle();

      const vigente = !profile?.plan_expires_at || new Date(profile.plan_expires_at as string) > new Date();
      const planActivo = profile?.plan_status === 'active' && vigente;
      if (!planActivo && profile?.role !== 'admin') {
        return responder({
          error: 'Rellenar el formulario dictando está disponible en los planes pagos.',
          code: 'UPGRADE_REQUIRED',
        }, origin, 402);
      }
    }

    const body = await req.json() as {
      transcript?: string;
      language?: 'en' | 'es';
      fields?: CampoEntrada[];
    };

    const transcripcion = String(body.transcript ?? '').trim().slice(0, MAX_TRANSCRIPT_CHARS);
    const language: 'en' | 'es' = body.language === 'en' ? 'en' : 'es';
    const campos = (Array.isArray(body.fields) ? body.fields : [])
      .filter((c) => c && typeof c.id === 'string' && typeof c.label === 'string')
      .slice(0, MAX_CAMPOS);

    if (!transcripcion) return responder({ error: 'No se recibió texto dictado.' }, origin, 400);
    if (campos.length === 0) return responder({ error: 'No se recibieron campos.' }, origin, 400);

    const hoy = new Date().toISOString().slice(0, 10);

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: construirPrompt(campos, transcripcion, language, hoy) }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const detalle = await groqRes.text().catch(() => '');
      console.error('[ai-fill-form] Groq falló:', groqRes.status, detalle);
      return responder({ error: 'El servicio de IA no está disponible en este momento.' }, origin, 502);
    }

    const groqJson = await groqRes.json();
    const contenido = String(groqJson?.choices?.[0]?.message?.content ?? '');
    const parseado = extraerJson(contenido) as { values?: Record<string, unknown> } | null;

    if (!parseado || typeof parseado.values !== 'object' || parseado.values === null) {
      console.error('[ai-fill-form] respuesta no parseable');
      return responder({ error: 'La IA respondió en un formato que no se pudo leer. Intenta de nuevo.' }, origin, 502);
    }

    const porId = new Map(campos.map((c) => [c.id, c]));
    const valores: Record<string, string | number | boolean> = {};
    const descartados: string[] = [];

    for (const [id, crudo] of Object.entries(parseado.values)) {
      const campo = porId.get(id);
      // Un id que no estaba en la lista es una alucinación, no un campo.
      if (!campo) { descartados.push(id); continue; }
      const valor = validarValor(campo, crudo);
      if (valor === null) { descartados.push(id); continue; }
      valores[id] = valor;
    }

    if (descartados.length) console.warn('[ai-fill-form] descartados:', descartados.join(', '));

    return responder({ values: valores, discarded: descartados.length }, origin);
  } catch (err) {
    console.error('[ai-fill-form] error:', err);
    return responder({ error: (err as Error).message ?? 'Error inesperado' }, origin, 500);
  }
});
