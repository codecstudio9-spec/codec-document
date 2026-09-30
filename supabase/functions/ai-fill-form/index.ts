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
// Secrets: reutiliza el OPENROUTER_API_KEY que ya usan las demás funciones
// ai-* (https://openrouter.ai/keys).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';

const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];
// Cambiado de Groq a OpenRouter el 19-09-2026 (ver el comentario de esta
// misma constante en ai-draft-clause) — mismo id de modelo, con soporte
// de JSON mode (lo usa esta función) y ventana de contexto mayor.
const AI_MODEL = 'openai/gpt-oss-120b';

const MAX_TRANSCRIPT_CHARS = 6000;
const MAX_CAMPOS = 120;
const MAX_VALOR_CHARS = 2000;

interface CampoEntrada {
  id: string;
  label: string;
  type: string;
  options?: string[];
  required?: boolean;
  /** Sección del formulario («Datos del estudiante»). Distingue campos con la
   *  misma etiqueta en bloques distintos. */
  section?: string;
}

/** Lo que dice alguien cuando un dato no corresponde. Sólo si aparece algo así
 *  en lo dictado se acepta un «N/A» del modelo: sin esta comprobación, el
 *  modelo podría rellenar con N/A cualquier campo del que no se habló. */
const DIJO_NO_APLICA = /\b(no\s+aplica|no\s+aplican|no\s+tiene|no\s+tengo|no\s+hay|ninguno|ninguna|n\s*\/\s*a|not\s+applicable|does\s+not\s+apply|doesn'?t\s+apply|none)\b/i;
const VALOR_NA = 'N/A';

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

  // Agrupados por sección, en el orden del documento. La persona suele dictar
  // bloque por bloque («los datos del acudiente son…»), y con la sección
  // delante el modelo sabe a qué «Celular» o «Email» va cada dato.
  let seccionActual: string | undefined;
  const lineas: string[] = [];
  for (const c of campos) {
    if ((c.section ?? '') !== (seccionActual ?? '')) {
      seccionActual = c.section;
      lineas.push(c.section ? `\nSECTION "${c.section}":` : '\nOTHER FIELDS:');
    }
    lineas.push(`- "${c.id}" (${c.type}): ${c.label}`);
    if (c.options?.length) {
      lineas.push(`  allowed values (copy one EXACTLY): ${c.options.map((o) => JSON.stringify(o)).join(' | ')}`);
    }
  }
  const descripcion = lineas.join('\n').trim();

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
    `12. Fields are grouped by SECTION, in document order. Several sections can contain fields with the same label (e.g. "Celular" for the student and "Celular" for the family reference). Use what the person said about WHO or WHICH PART the data belongs to (e.g. "la referencia familiar es…", "los datos del acudiente…", "de la oficina…") to put each value in the field of the right section. If the person dictates in order, data follows the order of the sections.`,
    `13. If the person explicitly says a field does not apply ("no aplica", "no tiene", "ninguno", "not applicable"), set that field to exactly "${VALOR_NA}" — for text fields, and for fields with allowed values only if one of them means not applicable. Never use "${VALOR_NA}" for a field the person did not mention. When they say a whole group does not apply ("todo lo de la oficina no aplica"), set every field of that group to "${VALOR_NA}".`,
    `14. Email addresses are spoken: join the words, lowercase, turn "arroba" into "@" and "punto" into ".", and remove spaces ("douglas taborda sanchez arroba gmail punto com" → "douglastabordasanchez@gmail.com"). Remove accents inside an email.`,
    `15. Phone numbers: digits only, no spaces ("311 272 6359" → "3112726359").`,
    `16. A text field whose label is a date ("Fecha", "Date", "Fecha de nacimiento") takes the date written as DD/MM/YYYY. "Today", "hoy", "la fecha de hoy" means ${hoy}.`,
    `17. Before answering, go through EVERY section and EVERY field in order and check whether the person said something for it. Do not stop after the first sections.`,
  ].join('\n');
}

/** Deja pasar sólo lo que encaja con el campo que dice ser. Devuelve el valor
 *  ya normalizado, o null si hay que descartarlo. */
function validarValor(campo: CampoEntrada, crudo: unknown, dijoNoAplica: boolean): string | number | boolean | null {
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

  // «N/A» sólo vale si la persona dijo de verdad que algo no aplica (lo
  // comprueba quien llama con DIJO_NO_APLICA) y el campo admite texto libre o
  // tiene una opción que signifique «no aplica».
  if (/^(n\/?a|no aplica|not applicable)$/i.test(texto)) {
    if (!dijoNoAplica) return null;
    if (campo.options?.length) {
      return campo.options.find((o) => /^(n\/?a|no aplica|ninguno|ninguna|not applicable|none)$/i.test(o.trim())) ?? null;
    }
    if (['date', 'number', 'currency', 'email', 'checkbox'].includes(campo.type)) return null;
    return VALOR_NA;
  }
  // Un modelo que no sabe algo a veces devuelve el hueco en vez de callarse.
  if (/^(none|null|undefined|unknown|desconocido|no especificado|no dice|-{1,3})$/i.test(texto)) return null;

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
    if (!OPENROUTER_API_KEY) {
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

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://codecdocument.com',
        'X-Title': 'Codec Document',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: construirPrompt(campos, transcripcion, language, hoy) }],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const detalle = await aiRes.text().catch(() => '');
      console.error('[ai-fill-form] OpenRouter falló:', aiRes.status, detalle);
      return responder({ error: 'El servicio de IA no está disponible en este momento.' }, origin, 502);
    }

    const aiJson = await aiRes.json();
    const contenido = String(aiJson?.choices?.[0]?.message?.content ?? '');
    const parseado = extraerJson(contenido) as { values?: Record<string, unknown> } | null;

    if (!parseado || typeof parseado.values !== 'object' || parseado.values === null) {
      console.error('[ai-fill-form] respuesta no parseable');
      return responder({ error: 'La IA respondió en un formato que no se pudo leer. Intenta de nuevo.' }, origin, 502);
    }

    const porId = new Map(campos.map((c) => [c.id, c]));
    const dijoNoAplica = DIJO_NO_APLICA.test(transcripcion);
    const valores: Record<string, string | number | boolean> = {};
    const descartados: string[] = [];

    for (const [id, crudo] of Object.entries(parseado.values)) {
      const campo = porId.get(id);
      // Un id que no estaba en la lista es una alucinación, no un campo.
      if (!campo) { descartados.push(id); continue; }
      const valor = validarValor(campo, crudo, dijoNoAplica);
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
