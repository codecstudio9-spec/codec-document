// Supabase Edge Function — traduce un fallo técnico de la extensión de
// descarga DIAN a una explicación simple para el contador.
//
// La extensión (extension-dian/) no tiene sesión de Supabase: es un
// programa aparte que corre en el navegador del contador y nunca antes
// hablaba con este backend. Esta función es pública a propósito (sin JWT)
// porque no hay forma de autenticar al llamador sin pedirle que pegue una
// clave — y lo único que recibe es texto técnico que el contador ya puede
// ver con sus propios ojos en la pantalla de la DIAN (código de error,
// fragmento de página), nunca un CUFE ni un dato fiscal. El límite de tasa
// de abajo es defensa suficiente para el riesgo real de dejarla pública:
// gastar tokens de la IA, no exponer nada sensible.
//
// Deploy (sin JWT: la llama la extensión sin sesión):
//   supabase functions deploy dian-explicar-error --no-verify-jwt --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reusa OPENROUTER_API_KEY ya configurado para las otras funciones de IA.

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';
// Mismo modelo que el resto de funciones de IA de la plataforma, servido
// vía OpenRouter (cambiado de Groq directo el 19-09-2026 — ver el
// comentario de esta misma constante en ai-draft-clause).
const AI_MODEL = 'openai/gpt-oss-120b';

const MAX_CAMPO = 600;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

// Límite de tasa best-effort en memoria: se reinicia con cada cold start de
// la función. No es una defensa perimetral seria, pero alcanza para el
// riesgo real — frenar un lote descontrolado de una sola instalación de la
// extensión, no un ataque distribuido.
const peticionesPorIp = new Map<string, number[]>();
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 30;

function excedeLimite(ip: string): boolean {
  const ahora = Date.now();
  const previas = (peticionesPorIp.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  previas.push(ahora);
  peticionesPorIp.set(ip, previas);
  return previas.length > MAX_POR_VENTANA;
}

function buildPrompt(codigoError: string, detalle: string, muestra: string, url: string): string {
  return [
    'Eres un asistente que ayuda a un contador colombiano, sin conocimientos técnicos, a entender por qué falló la descarga automática de un documento electrónico desde el portal de la DIAN.',
    'Se te da SOLO información técnica cruda capturada por la herramienta. NO inventes causas que no estén respaldadas por estos datos. Si los datos no alcanzan para saber la causa exacta, dilo con honestidad en vez de adivinar.',
    'Responde en español, en 2 o 3 frases cortas, directas, sin jerga técnica. Termina con una sugerencia concreta de qué hacer (reintentar, esperar unos minutos, pedir un enlace nuevo, revisar el CUFE, resolver la verificación humana a mano, etc.).',
    '',
    `Código de error: ${codigoError || '(sin código)'}`,
    `Detalle técnico: ${detalle || '(sin detalle)'}`,
    `Fragmento de la página de la DIAN en el momento del fallo: ${muestra || '(sin muestra)'}`,
    `Dirección en la que se quedó el navegador: ${url || '(sin registrar)'}`,
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405, headers: corsHeaders() });

  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: 'La explicación con IA no está configurada en el servidor.' }), {
      status: 500, headers: corsHeaders(),
    });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida';
  if (excedeLimite(ip)) {
    return new Response(JSON.stringify({ error: 'Demasiadas solicitudes seguidas — espera unos minutos.' }), {
      status: 429, headers: corsHeaders(),
    });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers: corsHeaders() });
  }

  const codigoError = String(body.codigoError ?? '').slice(0, 60);
  const detalle = String(body.detalle ?? '').slice(0, MAX_CAMPO);
  const muestra = String(body.muestra ?? '').slice(0, MAX_CAMPO);
  const url = String(body.url ?? '').slice(0, 300);

  if (!codigoError && !detalle && !muestra) {
    return new Response(JSON.stringify({ error: 'No hay nada que explicar.' }), { status: 400, headers: corsHeaders() });
  }

  try {
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
        messages: [{ role: 'user', content: buildPrompt(codigoError, detalle, muestra, url) }],
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      console.error('[dian-explicar-error] OpenRouter falló:', aiRes.status, await aiRes.text().catch(() => ''));
      return new Response(JSON.stringify({ error: 'La explicación con IA no está disponible ahora mismo.' }), {
        status: 502, headers: corsHeaders(),
      });
    }

    const json = await aiRes.json();
    const explicacion = String(json?.choices?.[0]?.message?.content ?? '').trim();
    if (!explicacion) {
      return new Response(JSON.stringify({ error: 'La IA no devolvió nada.' }), { status: 502, headers: corsHeaders() });
    }

    return new Response(JSON.stringify({ explicacion }), { headers: corsHeaders() });
  } catch (err) {
    console.error('[dian-explicar-error] error:', err);
    return new Response(JSON.stringify({ error: 'Error inesperado.' }), { status: 500, headers: corsHeaders() });
  }
});
