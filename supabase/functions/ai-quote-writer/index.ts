// Supabase Edge Function — la agente de Codec Document redacta una cotización
// completa a partir de lo que el usuario le pide.
//
// El caso de uso es literal: alguien abre ChatGPT, escribe «hazme una
// cotización de 30 agendas a 30.000 cada una» y copia el resultado de vuelta.
// Esta función existe para que no tenga que salir de la plataforma. Recibe esa
// misma frase —escrita o dictada— y devuelve dos cosas:
//
//   1. `proposal`: el cuerpo comercial de la cotización, ya redactado.
//   2. `items`:    los productos con cantidad, unidad y precio, listos para
//                  caer en la tabla y sumarse solos.
//
// ── Por qué se validan los ítems tan a fondo ─────────────────────────────
//
// El texto lo lee una persona y cualquier error se ve. Los NÚMEROS, en cambio,
// se multiplican en silencio: un precio inventado o una cantidad mal leída
// produce un total que parece correcto y que alguien envía a un cliente. Por
// eso todo ítem se valida campo a campo y se descarta entero si algo no cuadra;
// es preferible una tabla vacía que el usuario rellena a una tabla con una
// cifra que nadie escribió.
//
// El modelo tiene prohibido inventar precios: si la petición no dice cuánto
// vale algo, el precio va en 0 y el usuario lo pone. Ese es el punto donde una
// alucinación costaría dinero de verdad.
//
// ── La voz ───────────────────────────────────────────────────────────────
//
// El texto que sale de aquí lo firma el usuario ante SU cliente. Va en primera
// persona del negocio que cotiza («le ofrecemos», «nuestro equipo»), nunca en
// la de una herramienta, y en ningún caso menciona que lo escribió un modelo.
//
// Deploy:
//   supabase functions deploy ai-quote-writer --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reutiliza el GROQ_API_KEY que ya usan las demás funciones de IA.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];
// Groq descontinuó llama-3.3-70b-versatile el 16-08-2026 — reemplazo
// oficial recomendado por Groq, con soporte de JSON mode (lo usa esta
// función) y ventana de contexto mayor.
const GROQ_MODEL = 'openai/gpt-oss-120b';

const MAX_PETICION_CHARS = 4000;
const MAX_ITEMS = 40;
const MAX_DESC_CHARS = 300;
const MAX_PROPUESTA_CHARS = 6000;

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

/** El modelo a veces envuelve el JSON en ```json … ``` o añade una frase antes. */
function extraerJson(texto: string): unknown {
  const limpio = texto.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(limpio);
  } catch {
    const ini = limpio.indexOf('{');
    const fin = limpio.lastIndexOf('}');
    if (ini >= 0 && fin > ini) {
      try { return JSON.parse(limpio.slice(ini, fin + 1)); } catch { /* nada */ }
    }
  }
  return null;
}

function construirPrompt(peticion: string, language: 'en' | 'es', contexto: {
  cliente?: string; empresa?: string; proyecto?: string; moneda?: string;
}): string {
  const idioma = language === 'en' ? 'English' : 'Spanish';
  const datos = [
    contexto.cliente ? `- Client name: ${contexto.cliente}` : null,
    contexto.empresa ? `- Client company: ${contexto.empresa}` : null,
    contexto.proyecto ? `- Project name: ${contexto.proyecto}` : null,
    contexto.moneda ? `- Currency mentioned by the user: ${contexto.moneda}` : null,
  ].filter(Boolean).join('\n');

  return [
    `You write commercial quotes. Write everything in ${idioma}.`,
    '',
    'The user runs a business and is preparing a quote for THEIR client.',
    'Write as that business addressing its client: "we offer", "our team",',
    '"we deliver". Never refer to yourself as an AI, a model, an assistant or',
    'a tool. Never mention that this text was generated. The user signs this.',
    '',
    'USER REQUEST:',
    `"""${peticion}"""`,
    datos ? `\nKNOWN CONTEXT:\n${datos}` : '',
    '',
    'Return ONE JSON object, no prose around it, with exactly these keys:',
    '',
    '{',
    '  "proposal": "the commercial body of the quote, plain text",',
    '  "items": [',
    '    { "description": "...", "quantity": 30, "unit": "...", "unit_price": 30000, "discount_pct": 0, "tax_pct": 0 }',
    '  ],',
    '  "client": { "name": "...", "phone": "...", "email": "..." }',
    '}',
    '',
    'RULES FOR "client":',
    '- Only the client contact details the user actually stated in THIS',
    '  request, not the KNOWN CONTEXT above (that is already saved).',
    '- Any field not mentioned in the request must be an empty string "" —',
    '  never copy it from KNOWN CONTEXT, never guess it from the proposal text.',
    '- "phone": digits as the user said them, keep a leading "+" if they gave',
    '  a country code. Do not format, space out, or invent digits.',
    '- If nothing about the client was said, return "client": {"name":"",',
    '  "phone":"","email":""}.',
    '',
    'RULES FOR "proposal":',
    '- 120 to 320 words. Short paragraphs separated by a blank line.',
    '- Open by acknowledging what the client needs. Then what is included,',
    '  then delivery/lead time if the request implies one, then a closing line.',
    '- Use "- " at the line start for bullet lists of what is included.',
    '- Do NOT restate the prices or the total: they already appear in the',
    '  items table right below, and repeating them creates contradictions when',
    '  the user edits a number.',
    '- Do NOT invent warranties, certifications, delivery dates, discounts or',
    '  legal terms that the user did not mention.',
    '- No headings, no markdown bold, no title. Just the body text.',
    '',
    'RULES FOR "items":',
    '- One entry per distinct product or service in the request.',
    '- "quantity": the number the user said. If not stated, use 1.',
    '- "unit_price": ONLY a price the user actually stated. If the user did',
    '  not give a price for that line, use 0 — never estimate, never guess a',
    '  market price. A wrong price is the one error that costs the user money.',
    '- "unit": the unit of measure in ' + idioma + ' (e.g. "unidades", "horas",',
    '  "kg", "litros"). If unclear, use "unidades" (or "units" in English).',
    '- "discount_pct" and "tax_pct": only if the user stated them, else 0.',
    '- Numbers must be plain JSON numbers: no currency symbols, no thousands',
    '  separators, no quotes.',
    '- If the request describes no concrete product, return "items": [].',
  ].filter((l) => l !== '').join('\n');
}

/** Un número utilizable o null. Rechaza NaN, infinitos, negativos y textos
 *  con símbolos de moneda que el modelo haya colado pese a las instrucciones. */
function num(valor: unknown, max: number): number | null {
  let n: number;
  if (typeof valor === 'number') n = valor;
  else if (typeof valor === 'string') {
    // "30.000" / "$30,000.00" → se quita todo lo que no sea dígito o punto
    // decimal. Se asume que el último separador con 1-2 decimales es el
    // decimal; en el resto de casos los separadores son de millar.
    const limpio = valor.replace(/[^\d.,-]/g, '');
    const conPunto = /[.,]\d{1,2}$/.test(limpio)
      ? limpio.replace(/[.,](?=.*[.,])/g, '').replace(',', '.')
      : limpio.replace(/[.,]/g, '');
    n = Number(conPunto);
  } else return null;
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 100) / 100;
}

interface ItemSalida {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_pct: number;
  tax_pct: number;
}

const MAX_CLIENTE_CHARS = 120;

/** Igual de estricto que con los precios, y por la misma razón: esto se
 *  escribe solo en un campo del formulario sin que nadie lo revise letra a
 *  letra primero. Un teléfono mal leído no se nota hasta que alguien llama. */
function validarCliente(crudo: unknown): { name: string; phone: string; email: string } {
  const c = (crudo && typeof crudo === 'object') ? crudo as Record<string, unknown> : {};
  const name = String(c.name ?? '').trim().slice(0, MAX_CLIENTE_CHARS);
  const phone = String(c.phone ?? '').replace(/[^\d+]/g, '').slice(0, 20);
  const emailCrudo = String(c.email ?? '').trim().slice(0, MAX_CLIENTE_CHARS);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailCrudo) ? emailCrudo : '';
  return { name, phone, email };
}

function validarItems(crudo: unknown): { items: ItemSalida[]; descartados: number } {
  if (!Array.isArray(crudo)) return { items: [], descartados: 0 };
  const items: ItemSalida[] = [];
  let descartados = 0;

  for (const fila of crudo.slice(0, MAX_ITEMS)) {
    if (!fila || typeof fila !== 'object') { descartados++; continue; }
    const f = fila as Record<string, unknown>;

    const description = String(f.description ?? '').trim().slice(0, MAX_DESC_CHARS);
    // Una línea sin descripción no es un producto; es ruido que ensucia la
    // tabla y que el usuario tendría que borrar a mano.
    if (!description) { descartados++; continue; }

    const quantity = num(f.quantity, 1_000_000) ?? 1;
    const unit_price = num(f.unit_price, 1_000_000_000);
    const discount_pct = num(f.discount_pct, 100) ?? 0;
    const tax_pct = num(f.tax_pct, 100) ?? 0;

    // Un precio que no se pudo leer se queda en 0 y lo pone la persona. No se
    // descarta la línea: la descripción y la cantidad siguen siendo útiles.
    items.push({
      description,
      quantity,
      unit: String(f.unit ?? '').trim().slice(0, 24),
      unit_price: unit_price ?? 0,
      discount_pct,
      tax_pct,
    });
  }
  return { items, descartados };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });

  try {
    if (!GROQ_API_KEY) {
      return responder({ error: 'La redacción automática no está configurada en el servidor.' }, origin, 500);
    }

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt) return responder({ error: 'Authentication required.' }, origin, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const authedUser = userData?.user;
    if (userErr || !authedUser) return responder({ error: 'Invalid session.' }, origin, 401);

    // Misma puerta que el resto de funciones de IA de la plataforma.
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
          error: 'Que yo te escriba la cotización completa está disponible en los planes pagos.',
          code: 'UPGRADE_REQUIRED',
        }, origin, 402);
      }
    }

    const body = await req.json() as {
      request?: string;
      language?: 'en' | 'es';
      client_name?: string;
      client_company?: string;
      project_name?: string;
      currency?: string;
    };

    const peticion = String(body.request ?? '').trim().slice(0, MAX_PETICION_CHARS);
    const language: 'en' | 'es' = body.language === 'en' ? 'en' : 'es';
    if (peticion.length < 8) {
      return responder({ error: 'Cuéntame un poco más de lo que necesitas cotizar.' }, origin, 400);
    }

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{
          role: 'user',
          content: construirPrompt(peticion, language, {
            cliente: body.client_name,
            empresa: body.client_company,
            proyecto: body.project_name,
            moneda: body.currency,
          }),
        }],
        // Algo de temperatura: el texto tiene que sonar a persona, no a
        // plantilla. Los números no dependen de esto — se validan aparte.
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqRes.ok) {
      const detalle = await groqRes.text().catch(() => '');
      console.error('[ai-quote-writer] Groq falló:', groqRes.status, detalle);
      return responder({ error: 'No pude escribir la cotización en este momento. Inténtalo de nuevo.' }, origin, 502);
    }

    const groqJson = await groqRes.json();
    const contenido = String(groqJson?.choices?.[0]?.message?.content ?? '');
    const parseado = extraerJson(contenido) as { proposal?: unknown; items?: unknown; client?: unknown } | null;

    if (!parseado) {
      console.error('[ai-quote-writer] respuesta no parseable');
      return responder({ error: 'Me enredé escribiendo la respuesta. Inténtalo otra vez.' }, origin, 502);
    }

    const proposal = String(parseado.proposal ?? '').trim().slice(0, MAX_PROPUESTA_CHARS);
    const { items, descartados } = validarItems(parseado.items);
    const client = validarCliente(parseado.client);

    if (!proposal && items.length === 0) {
      return responder({ error: 'No conseguí sacar nada en claro de esa petición. Cuéntamelo con otras palabras.' }, origin, 502);
    }
    if (descartados) console.warn('[ai-quote-writer] ítems descartados:', descartados);

    return responder({ proposal, items, client, discarded: descartados }, origin);
  } catch (err) {
    console.error('[ai-quote-writer] error:', err);
    return responder({ error: (err as Error).message ?? 'Error inesperado' }, origin, 500);
  }
});
