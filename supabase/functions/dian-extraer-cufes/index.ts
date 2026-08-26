// Supabase Edge Function — saca CUFEs de un texto pegado que NO es una
// lista limpia (un correo reenviado, una tabla copiada de Excel con más
// columnas, texto con saltos de línea raros).
//
// La extensión ya extrae CUFEs con una expresión regular simple (ver
// extension-dian/dian.js → cufesDeTexto) que funciona bien con una lista de
// un CUFE por línea. Esto es un refuerzo para cuando el texto viene más
// sucio y el regex por sí solo se queda corto.
//
// Todo lo que devuelve la IA se vuelve a validar aquí mismo con la MISMA
// expresión regular que usa la extensión — nunca se confía en que la IA
// devolvió strings bien formados. Si la IA falla, no está configurada, o el
// límite de tasa se excedió, se cae de vuelta a la extracción por regex
// sobre el texto crudo: esta función nunca deja al contador peor que sin
// ella.
//
// Pública a propósito (sin JWT) — mismo razonamiento que
// dian-explicar-error: la extensión no tiene sesión de Supabase, y lo único
// que recibe es texto que el propio contador ya tenía pegado.
//
// Deploy:
//   supabase functions deploy dian-extraer-cufes --no-verify-jwt --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reusa GROQ_API_KEY.

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';
const GROQ_MODEL = 'openai/gpt-oss-120b';
// Calcado del mismo regex de extension-dian/dian.js — no puede importarse
// desde ahí (esto corre en Deno, aquello en el navegador), así que se
// duplica a propósito y debe mantenerse igual si uno cambia.
const CUFE_RE = /^[0-9a-fA-F]{90,100}$/;
const MAX_TEXTO = 20000;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

const peticionesPorIp = new Map<string, number[]>();
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 20;

function excedeLimite(ip: string): boolean {
  const ahora = Date.now();
  const previas = (peticionesPorIp.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  previas.push(ahora);
  peticionesPorIp.set(ip, previas);
  return previas.length > MAX_POR_VENTANA;
}

function porRegex(texto: string): string[] {
  const vistos = new Set<string>();
  for (const t of texto.split(/[\s,;]+/)) {
    const limpio = t.trim().toLowerCase();
    if (CUFE_RE.test(limpio)) vistos.add(limpio);
  }
  return [...vistos];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405, headers: corsHeaders() });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers: corsHeaders() });
  }

  const texto = String(body.texto ?? '').slice(0, MAX_TEXTO);
  if (!texto.trim()) {
    return new Response(JSON.stringify({ cufes: [], conIa: false }), { headers: corsHeaders() });
  }

  const porRegexBase = porRegex(texto);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'desconocida';
  if (!GROQ_API_KEY || excedeLimite(ip)) {
    // Sin IA disponible (no configurada o límite de tasa alcanzado): se
    // devuelve lo que ya encontraba el regex, nunca un error duro por esto.
    return new Response(JSON.stringify({ cufes: porRegexBase, conIa: false }), { headers: corsHeaders() });
  }

  try {
    const prompt = [
      'El siguiente texto puede ser un correo reenviado, una tabla copiada de Excel, o texto pegado con formato irregular. Contiene, mezclados con otro texto, uno o más CUFE/CUDE de documentos electrónicos de la DIAN de Colombia: cadenas hexadecimales (sólo 0-9 y a-f) de entre 90 y 100 caracteres.',
      'Devuelve SOLO un array JSON de strings con cada CUFE que encuentres, sin texto adicional, sin explicación, sin markdown. Si no encuentras ninguno, devuelve [].',
      '',
      'TEXTO:',
      texto,
    ].join('\n');

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
      }),
    });

    if (!groqRes.ok) {
      console.error('[dian-extraer-cufes] Groq falló:', groqRes.status);
      return new Response(JSON.stringify({ cufes: porRegexBase, conIa: false }), { headers: corsHeaders() });
    }

    const json = await groqRes.json();
    const bruto = String(json?.choices?.[0]?.message?.content ?? '').trim()
      .replace(/^```(json)?/i, '').replace(/```$/, '').trim();

    let candidatos: unknown;
    try { candidatos = JSON.parse(bruto); } catch { candidatos = null; }

    const deIa = Array.isArray(candidatos)
      ? candidatos.map((c) => String(c).trim().toLowerCase()).filter((c) => CUFE_RE.test(c))
      : [];

    const combinados = [...new Set([...porRegexBase, ...deIa])];
    const nuevosPorIa = deIa.filter((c) => !porRegexBase.includes(c)).length;

    return new Response(JSON.stringify({ cufes: combinados, conIa: true, nuevosPorIa }), { headers: corsHeaders() });
  } catch (err) {
    console.error('[dian-extraer-cufes] error:', err);
    return new Response(JSON.stringify({ cufes: porRegexBase, conIa: false }), { headers: corsHeaders() });
  }
});
