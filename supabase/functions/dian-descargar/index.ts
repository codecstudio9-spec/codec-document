// Proxy de descarga de documentos electrónicos de la DIAN.
//
// ── Por qué existe ──────────────────────────────────────────────────────
// El navegador NO puede pedirle archivos a catalogo-vpfe.dian.gov.co: la
// DIAN no envía las cabeceras CORS que autorizarían a codecdocument.com, y
// eso es una regla del navegador, no algo que se pueda programar alrededor.
// Por eso la petición sale de aquí.
//
// ── Lo que eso implica, dicho sin rodeos ────────────────────────────────
// El tráfico de todos los contadores sale por las mismas IPs de Supabase.
// Del "Descargador Masivo DIAN v1.2" se midió el ritmo de una herramienta
// de escritorio que lleva tiempo funcionando sin bloqueos: 2000 CUFEs en
// ~30 minutos, o sea 1,1 peticiones por segundo. Ese es el ritmo que la
// DIAN tolera. Por eso cada petición pide turno a ed_dian_permiso() antes
// de salir, y el resultado se reporta a ed_dian_resultado() para que el
// cortacircuitos aprenda.
//
// ── SSRF ────────────────────────────────────────────────────────────────
// La URL la aporta el usuario. Sin restricciones, cualquiera podría hacer
// que NUESTRO servidor pidiera direcciones internas o cualquier host de
// internet, usándonos de trampolín. Por eso hay lista blanca de dominios y
// se rechaza todo lo demás antes de tocar la red.
//
// Deploy:
//   supabase functions deploy dian-descargar --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

/** Sólo la DIAN. Cualquier otro host se rechaza sin siquiera resolverlo. */
const HOSTS_PERMITIDOS = [
  'catalogo-vpfe.dian.gov.co',
  'catalogo-vpfe-hab.dian.gov.co',
  'vpfe.dian.gov.co',
  'vpfe-hab.dian.gov.co',
];

/** Un documento son decenas de KB. 25 MB es un techo generoso que a la vez
 *  impide que una respuesta inesperada agote la memoria de la función. */
const MAX_BYTES = 25 * 1024 * 1024;
const TIMEOUT_MS = 30_000;

const CUFE_RE = /^[0-9a-fA-F]{90,100}$/;

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  });
}

/**
 * Construye la URL de descarga de un CUFE a partir de la que pegó el
 * contador.
 *
 * No se cablea ningún endpoint a propósito: la URL sale del correo que la
 * DIAN envía al solicitar el token, y su forma puede cambiar. Se cubren
 * tres casos, del más explícito al más general:
 *
 *   1. La URL trae {CUFE} escrito  → se sustituye ahí
 *   2. Algún parámetro ya contiene un CUFE → se reemplaza su valor
 *   3. Ninguno de los dos → se añade el parámetro indicado por el cliente
 *
 * El caso 2 es el que hace que esto funcione sin saber el nombre del
 * parámetro: basta con que el contador pegue la URL de UN documento.
 */
function construirUrl(base: string, cufe: string, nombreParam: string): URL {
  if (base.includes('{CUFE}')) {
    return new URL(base.replaceAll('{CUFE}', cufe));
  }

  const url = new URL(base);
  for (const [clave, valor] of url.searchParams.entries()) {
    if (CUFE_RE.test(valor)) {
      url.searchParams.set(clave, cufe);
      return url;
    }
  }

  url.searchParams.set(nombreParam || 'documentKey', cufe);
  return url;
}

function validarHost(url: URL): string | null {
  if (url.protocol !== 'https:') return 'Solo se permiten direcciones https.';
  if (!HOSTS_PERMITIDOS.includes(url.hostname)) {
    return `Solo se permiten direcciones de la DIAN. Recibí "${url.hostname}".`;
  }
  return null;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405, origin);

  // La sesión del usuario, no la llave de servicio: quien descarga tiene
  // que estar autenticado, y las funciones del gobernador lo comprueban.
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return json({ error: 'Sin sesión' }, 401, origin);

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });

  let cuerpo: { url?: string; cufe?: string; param?: string; diagnostico?: boolean };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400, origin);
  }

  const { url: base, cufe, param = 'documentKey', diagnostico = false } = cuerpo;
  if (!base || !cufe) return json({ error: 'Faltan url o cufe' }, 400, origin);
  if (!CUFE_RE.test(cufe)) return json({ error: 'El CUFE no tiene el formato esperado' }, 400, origin);

  let destino: URL;
  try {
    destino = construirUrl(base, cufe, param);
  } catch {
    return json({ error: 'La URL de la DIAN no es válida' }, 400, origin);
  }

  const problemaHost = validarHost(destino);
  if (problemaHost) return json({ error: problemaHost }, 400, origin);

  // Turno. Si no toca todavía, se devuelve cuánto esperar en vez de un
  // error: una descarga de 2000 documentos no puede romperse porque otro
  // contador estaba descargando al mismo tiempo.
  const { data: permiso, error: errPermiso } = await supabase.rpc('ed_dian_permiso');
  if (errPermiso) return json({ error: errPermiso.message }, 403, origin);
  if (permiso && !permiso.permitido) {
    return json({ espera: true, esperar_ms: permiso.esperar_ms, motivo: permiso.motivo }, 429, origin);
  }

  const control = new AbortController();
  const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);

  try {
    const respuesta = await fetch(destino.toString(), {
      signal: control.signal,
      redirect: 'follow',
      headers: {
        // Identificarse es lo correcto: permite a la DIAN distinguir un
        // cliente legítimo y contactarnos antes que bloquearnos.
        'User-Agent': 'CodecDocument/1.0 (+https://www.codecdocument.com)',
        Accept: '*/*',
      },
    });

    const tipo = respuesta.headers.get('content-type') ?? '';
    const buffer = await respuesta.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (bytes.length > MAX_BYTES) {
      await supabase.rpc('ed_dian_resultado', { p_ok: false });
      return json({ error: 'La respuesta es demasiado grande' }, 502, origin);
    }

    // Un ZIP empieza por "PK". Si la DIAN devuelve HTML con 200 -- una
    // pantalla de sesión vencida o de captcha -- el archivo guardado sería
    // basura con nombre de factura, y el contador no se enteraría hasta
    // intentar procesarlo. Se detecta aquí.
    const esZip = bytes.length > 1 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    const esXml = tipo.includes('xml') || (bytes.length > 5 && bytes[0] === 0x3c);
    const ok = respuesta.ok && (esZip || esXml);

    await supabase.rpc('ed_dian_resultado', { p_ok: ok });

    if (!ok) {
      // En diagnóstico se devuelve un fragmento del cuerpo para poder ver
      // qué respondió de verdad. NUNCA se devuelve la URL: lleva el token.
      const muestra = diagnostico
        ? new TextDecoder().decode(bytes.slice(0, 900))
        : undefined;
      return json({
        error: respuesta.ok
          ? 'La DIAN respondió algo que no es un documento. Puede que el token haya vencido.'
          : `La DIAN respondió ${respuesta.status}.`,
        status: respuesta.status,
        content_type: tipo,
        bytes: bytes.length,
        muestra,
      }, 502, origin);
    }

    let binario = '';
    const trozo = 0x8000;
    for (let i = 0; i < bytes.length; i += trozo) {
      binario += String.fromCharCode(...bytes.subarray(i, i + trozo));
    }

    return json({
      ok: true,
      content_type: tipo,
      es_zip: esZip,
      bytes: bytes.length,
      contenido_b64: btoa(binario),
    }, 200, origin);
  } catch (e) {
    await supabase.rpc('ed_dian_resultado', { p_ok: false });
    const msg = (e as Error).name === 'AbortError'
      ? 'La DIAN no respondió a tiempo.'
      : 'No se pudo contactar con la DIAN.';
    return json({ error: msg }, 504, origin);
  } finally {
    clearTimeout(alarma);
  }
});
