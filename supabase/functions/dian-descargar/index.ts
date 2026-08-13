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
const UA = 'CodecDocument/1.0 (+https://www.codecdocument.com)';

const CUFE_RE = /^[0-9a-fA-F]{90,100}$/;

/**
 * Sesiones abiertas con la DIAN, en memoria de la función.
 *
 * El enlace que llega al correo ("Token Acceso DIAN" → "Ingrese aquí") NO
 * descarga nada: AUTENTICA. Al pedirlo, la DIAN responde con una cookie de
 * sesión, y es esa cookie la que autoriza las descargas siguientes.
 *
 * Por eso el proceso son dos pasos y no uno. Abrir sesión en cada CUFE
 * multiplicaría por dos las peticiones contra la DIAN para no obtener nada
 * nuevo — justo lo que hay que evitar.
 *
 * Se guarda por token y no por usuario: el token es lo que caduca (60
 * minutos), y así dos pestañas del mismo contador reutilizan la sesión.
 */
const sesiones = new Map<string, { cookie: string; creada: number }>();
const SESION_TTL_MS = 55 * 60 * 1000; // algo menos que los 60 del token

function limpiarSesiones() {
  const ahora = Date.now();
  for (const [k, v] of sesiones) {
    if (ahora - v.creada > SESION_TTL_MS) sesiones.delete(k);
  }
}

/** Junta las cookies de un Set-Cookie múltiple en una cabecera Cookie. */
function extraerCookies(res: Response): string {
  const crudas = res.headers.getSetCookie?.() ?? [];
  const pares = crudas
    .map((c) => c.split(';')[0].trim())
    .filter((c) => c.includes('='));
  return pares.join('; ');
}

/**
 * Abre sesión con la URL del correo y devuelve la cookie.
 *
 * Se cachea: el token dura una hora y una descarga de 2000 documentos
 * tarda media, así que la misma sesión sirve para todo el lote.
 */
/**
 * Resultado de abrir sesión.
 *
 * `culpaDeLaDian` decide si el fallo alimenta al cortacircuitos, y esa
 * distinción resultó ser el fallo más caro de este módulo:
 *
 * El cortacircuitos existe para retirarnos cuando la DIAN nos está
 * rechazando, y es GLOBAL —una sola fila para todos los contadores—: tres
 * fallos seguidos pausan a todo el mundo un minuto, diez lo pausan cinco.
 *
 * Pero contaba también los tokens vencidos. Y un token vencido no es la DIAN
 * portándose mal: es lo más normal del mundo, dura 60 minutos y sólo sirve
 * una vez. Bastaba con que alguien probara tres enlaces caducados —tres
 * intentos, algo que se hace en veinte segundos— para dejar la herramienta
 * pausada para todos, incluido él mismo con un token recién pedido.
 */
/**
 * Lo que la DIAN respondió de verdad, sin interpretar.
 *
 * Existe para poder responder a la única pregunta que importa cuando algo
 * falla: ¿el problema es de la DIAN o nuestro? Sin esto sólo había un
 * mensaje redactado por nosotros, que es una conclusión, no una prueba.
 */
interface DetalleDian {
  status: number;
  urlFinal: string;
  acaboEnLogin: boolean;
  cookiesRecibidas: number;
  tieneCookieSesion: boolean;
  cookieSesionViva: boolean;
  azureRef: string | null;
  /** Primeros caracteres del cuerpo, para ver si es la pantalla de acceso,
   *  un error del portal o una página inesperada. */
  muestra?: string;
}

type ResultadoSesion =
  | { cookie: string; detalle: DetalleDian }
  | { error: string; culpaDeLaDian: boolean; detalle?: DetalleDian };

async function abrirSesion(urlAuth: string, conDetalle = false): Promise<ResultadoSesion> {
  limpiarSesiones();
  const clave = urlAuth;
  const guardada = sesiones.get(clave);
  if (guardada && Date.now() - guardada.creada < SESION_TTL_MS) {
    return {
      cookie: guardada.cookie,
      detalle: {
        status: 200, urlFinal: '(sesión reutilizada de la caché)', acaboEnLogin: false,
        cookiesRecibidas: guardada.cookie.split(';').length,
        tieneCookieSesion: /AspNet\.ApplicationCookie=/i.test(guardada.cookie),
        cookieSesionViva: true, azureRef: null,
        muestra: 'La sesión se abrió antes y sigue viva; no se volvió a pedir a la DIAN.',
      },
    };
  }

  let url: URL;
  try { url = new URL(urlAuth); } catch { return { error: 'La URL de la DIAN no es válida.', culpaDeLaDian: false }; }
  const problema = validarHost(url);
  if (problema) return { error: problema, culpaDeLaDian: false };

  const control = new AbortController();
  const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      signal: control.signal,
      redirect: 'follow',
      // Cabeceras de navegador real.
      //
      // `catalogo-vpfe.dian.gov.co` no es la DIAN directamente: resuelve a
      // Azure Front Door, un WAF por delante. Comprobado contra el portal:
      // devuelve 403 a clientes que no parecen un navegador (un `curl/8.x`
      // pelado lo recibe), y 200 en cuanto la petición trae el aspecto
      // habitual de una navegación. Estas cabeceras no engañan a nadie sobre
      // quiénes somos —el User-Agent sigue identificando a Codec Document—,
      // sólo evitan que el WAF nos clasifique como script suelto.
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
    });
    const cookie = extraerCookies(res);

    // Comprobado contra el portal real: cuando el token esta vencido o ya
    // se uso, la DIAN NO devuelve un error. Responde 200, entrega cookies
    // igual, y redirige a /User/Login. Fiarse del codigo de estado haria
    // que el contador viera "el enlace funciona", lanzara 2000 descargas y
    // recibiera 2000 fallos.
    //
    // Se comprueba sólo la pantalla de acceso, no AuthToken: ésa es la URL
    // de PARTIDA, así que si la DIAN autenticara sin redirigir estaríamos
    // marcando como fallo una sesión perfectamente buena.
    const acaboEnLogin = res.url.toLowerCase().includes('/user/login');

    // Y la cookie de sesion tiene que estar viva: la DIAN a veces la emite
    // y la borra en la misma respuesta (expires en 1970).
    const crudas = res.headers.getSetCookie?.() ?? [];
    const sesionViva = crudas.some((c) =>
      /AspNet\.ApplicationCookie=/i.test(c)
      && !/expires=[^;]*1970/i.test(c)
      && c.split(';')[0].split('=').slice(1).join('=').length > 20
    );

    // Un 500 en /User/AuthToken es lo que la DIAN devuelve ante un token mal
    // formado o incompleto — comprobado contra el portal real. Va con los
    // tokens agotados, no con los fallos de la DIAN.
    const tokenAgotado = acaboEnLogin || !sesionViva || res.status === 500;

    const detalle: DetalleDian = {
      status: res.status,
      urlFinal: res.url,
      acaboEnLogin,
      cookiesRecibidas: crudas.length,
      tieneCookieSesion: crudas.some((c) => /AspNet\.ApplicationCookie=/i.test(c)),
      cookieSesionViva: sesionViva,
      azureRef: res.headers.get('x-azure-ref'),
      muestra: conDetalle
        ? (await res.clone().text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 400)
        : undefined,
    };

    if (!res.ok || !cookie || acaboEnLogin || !sesionViva) {
      return {
        error: tokenAgotado
          ? 'La DIAN no aceptó el enlace. El token dura 60 minutos y sólo sirve una vez: pide uno nuevo, y pégalo aquí ANTES de abrirlo en el navegador.'
          : `La DIAN respondió ${res.status} al abrir la sesión.`,
        culpaDeLaDian: !tokenAgotado,
        detalle,
      };
    }
    sesiones.set(clave, { cookie, creada: Date.now() });
    return { cookie, detalle };
  } catch (err) {
    // Antes este catch devolvía «No se pudo abrir sesión con la DIAN.» y
    // tiraba la causa a la basura. Ese mensaje es indistinguible entre un
    // token vencido, la DIAN caída, un corte de red y un fallo de TLS — y
    // sin saber cuál es, ni el contador ni nosotros podemos hacer nada.
    //
    // Llegar hasta aquí significa que el fetch REVENTÓ: no hubo respuesta.
    // Un token vencido no cae aquí, cae más arriba con una respuesta 200 que
    // redirige a la pantalla de acceso.
    const e = err as { name?: string; message?: string };
    const abortado = e?.name === 'AbortError' || control.signal.aborted;
    console.error('[dian-descargar] fallo al abrir sesión:', e?.name, e?.message);

    return {
      error: abortado
        ? `La DIAN no respondió en ${TIMEOUT_MS / 1000} segundos. Suele ser el portal saturado; espera un minuto y vuelve a intentarlo con el mismo enlace.`
        : `No se pudo conectar con la DIAN (${e?.name ?? 'error'}: ${e?.message ?? 'sin detalle'}). El enlace es correcto; el problema está en la conexión con el portal.`,
      culpaDeLaDian: true,
    };
  } finally {
    clearTimeout(alarma);
  }
}

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

  // Quién puede usar la descarga masiva. Esto NO es una preferencia de
  // interfaz: mientras se prueba, la herramienta está abierta sólo al
  // propietario y a las personas que él autorice por correo.
  //
  // Ocultar el botón en el navegador no cerraba nada — la función seguía
  // atendiendo a cualquiera con sesión que conociera su URL. Y aquí importa
  // más que en otras funciones: todo el tráfico sale por las IPs de Supabase,
  // compartidas por todos los clientes, así que un desconocido abusando de
  // esto hace que la DIAN bloquee la IP de todos a la vez.
  const { data: permitida, error: errPermitida } = await supabase.rpc('ed_descarga_permitida');
  if (errPermitida) return json({ error: errPermitida.message }, 403, origin);
  if (permitida !== true) {
    return json({
      error: 'La descarga masiva desde la DIAN está en pruebas y todavía no está abierta a tu cuenta.',
      code: 'NO_AUTORIZADO',
    }, 403, origin);
  }

  let cuerpo: {
    /** Enlace del correo "Token Acceso DIAN". Autentica; no descarga. */
    url?: string;
    /** Endpoint de descarga, si se conoce. Si falta, se usa `url`. */
    urlDescarga?: string;
    cufe?: string;
    param?: string;
    diagnostico?: boolean;
    /** Sólo abre sesión y reporta. Permite validar el enlace del contador
     *  antes de lanzar 2000 descargas, y averiguar qué responde la DIAN
     *  sin conocer todavía el endpoint de descarga. */
    soloSesion?: boolean;
  };
  try {
    cuerpo = await req.json();
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400, origin);
  }

  const { url: base, urlDescarga, cufe, param = 'documentKey', diagnostico = false, soloSesion = false } = cuerpo;
  if (!base) return json({ error: 'Falta la URL de la DIAN' }, 400, origin);

  // El host se valida ANTES de pedir turno: rechazar una URL ajena no debe
  // gastar una ficha del gobernador, y así el error que ve el usuario es el
  // de verdad ("esa no es una dirección de la DIAN") y no uno de ritmo.
  try {
    const problemaBase = validarHost(new URL(base));
    if (problemaBase) return json({ error: problemaBase }, 400, origin);
  } catch {
    return json({ error: 'La URL de la DIAN no es válida.' }, 400, origin);
  }

  // Paso 1: abrir sesión. El enlace del correo autentica, no descarga.
  // Se pide turno también para esto: es una petición real a la DIAN.
  const { data: permisoSesion, error: errPS } = await supabase.rpc('ed_dian_permiso');
  if (errPS) return json({ error: errPS.message }, 403, origin);
  if (permisoSesion && !permisoSesion.permitido) {
    return json({ espera: true, esperar_ms: permisoSesion.esperar_ms, motivo: permisoSesion.motivo }, 429, origin);
  }

  // El detalle se pide sólo al probar el enlace: es una lectura extra del
  // cuerpo de la respuesta, y en un lote de 2000 descargas no aporta nada.
  const sesion = await abrirSesion(base, soloSesion);
  if ('error' in sesion) {
    // Sólo alimenta al cortacircuitos lo que de verdad es la DIAN fallando.
    // Un enlace caducado no puede pausar la herramienta para todo el mundo.
    if (sesion.culpaDeLaDian) await supabase.rpc('ed_dian_resultado', { p_ok: false });
    return json({
      error: sesion.error,
      tokenVencido: !sesion.culpaDeLaDian,
      // La evidencia cruda de lo que contestó la DIAN. Va sólo al probar,
      // que es cuando alguien está intentando averiguar qué pasa.
      dian: soloSesion ? sesion.detalle : undefined,
    }, 502, origin);
  }
  await supabase.rpc('ed_dian_resultado', { p_ok: true });

  if (soloSesion) {
    // No se devuelve la cookie: identifica la sesión del contador con la
    // DIAN y no tiene por qué salir de aquí.
    return json({
      ok: true, sesion: true,
      cookies: sesion.cookie.split(';').length,
      dian: sesion.detalle,
    }, 200, origin);
  }

  if (!cufe) return json({ error: 'Falta el cufe' }, 400, origin);
  if (!CUFE_RE.test(cufe)) return json({ error: 'El CUFE no tiene el formato esperado' }, 400, origin);

  let destino: URL;
  try {
    destino = construirUrl(urlDescarga || base, cufe, param);
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
        'User-Agent': UA,
        Accept: '*/*',
        // La cookie del paso 1 es lo que autoriza la descarga.
        Cookie: sesion.cookie,
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
