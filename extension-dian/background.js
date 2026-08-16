// Service worker de la extensión: hace exactamente lo que hacía
// `dian-descargar` (supabase/functions/dian-descargar/index.ts), pero desde
// AQUÍ — el navegador real del contador — en vez de un servidor compartido.
//
// ── Por qué existe esta extensión ───────────────────────────────────────
// Se verificó en vivo (2026-08-14) que la DIAN ata el token de acceso a la
// IP que lo solicitó: el mismo enlace, con el mismo token, autentica sin
// problema abierto en el Chrome del contador y falla siempre por el proxy
// del servidor (IPs de Supabase, compartidas entre todos los clientes). No
// es un problema de cabeceras — eso ya se probó y arregló, y aun así falla.
// Es la IP. La única forma de que la petición "sea" el contador es que
// salga literalmente de su navegador. De ahí esto.
//
// ── Por qué no hace falta manejar cookies a mano ────────────────────────
// El proxy del servidor SÍ tenía que capturar el Set-Cookie de la respuesta
// y reenviarlo a mano en cada petición siguiente, porque Deno no comparte
// almacén de cookies con nadie. Aquí no: `fetch(..., {credentials:
// 'include'})` desde una extensión con host_permissions sobre el dominio de
// la DIAN usa el almacén de cookies REAL del navegador — la cookie de sesión
// que la DIAN emite al abrir el enlace del token queda guardada ahí sola, y
// la siguiente petición a esa misma extensión de dominio la manda sola. Es
// justo lo que hace un navegador normal al navegar de una página a otra.

import { CUFE_RE, validarHost, construirUrl } from './dian.js';

const TIMEOUT_MS = 30_000;
const RITMO_MS = 950; // ~1 petición/segundo — el ritmo que se midió como seguro
const CLAVE_ESTADO = 'lote_actual';

/** @type {{
 *   urlDian: string, endpoint: string, cufes: string[],
 *   resultados: Record<string, {ok: boolean, detalle?: string}>,
 *   corriendo: boolean, cancelado: boolean,
 * } | null} */
let estado = null;

function emitir(tipo, datos = {}) {
  chrome.runtime.sendMessage({ tipo, ...datos }).catch(() => {
    // Nadie escuchando (el popup está cerrado). No es un error: el progreso
    // sigue guardándose en chrome.storage.local y el popup lo recupera al
    // reabrir con el mensaje 'estado'.
  });
}

async function guardarEstado() {
  if (!estado) return;
  await chrome.storage.local.set({
    [CLAVE_ESTADO]: {
      urlDian: estado.urlDian,
      endpoint: estado.endpoint,
      cufes: estado.cufes,
      resultados: estado.resultados,
    },
  });
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Abre sesión con el enlace del correo.
 *
 * NO usa fetch() — se probó en vivo (2026-08-15) y falla de forma
 * intermitente: la DIAN a veces responde 200 con la pantalla de login sin
 * emitir la cookie de sesión, exactamente igual que cuando el proxy del
 * servidor fallaba por IP. Pero esta vez la IP SÍ es la del contador — lo
 * que cambia es que un fetch() de un service worker nunca puede llevar las
 * cabeceras de una navegación real (Sec-Fetch-Dest: document, etc.); Chrome
 * las fija él mismo según el tipo de petición y un script no puede pedirlas
 * ni falsearlas. Cuando SÍ se abrió el mismo enlace como pestaña de verdad
 * (a mano, o navegando con la extensión de automatización), nunca falló.
 *
 * Por eso esto abre una pestaña real (oculta, sin robar el foco) en vez de
 * pedir la URL desde el script. Es más lento —una pestaña tarda más que un
 * fetch()— pero es lo que de verdad funciona.
 */
async function abrirSesion(urlAuth) {
  return new Promise((resolve) => {
    let terminado = false;
    let tabId = null;

    const escuchar = (id, info, tab) => {
      if (id !== tabId || info.status !== 'complete') return;
      finalizar(tab.url ?? '');
    };

    const vencido = setTimeout(() => {
      if (terminado) return;
      terminado = true;
      chrome.tabs.onUpdated.removeListener(escuchar);
      if (tabId != null) chrome.tabs.remove(tabId).catch(() => {});
      resolve({
        ok: false,
        error: `La DIAN no respondió en ${TIMEOUT_MS / 1000} segundos. Espera un minuto y reintenta con el mismo enlace.`,
      });
    }, TIMEOUT_MS);

    async function finalizar(urlFinal) {
      if (terminado) return;
      terminado = true;
      clearTimeout(vencido);
      chrome.tabs.onUpdated.removeListener(escuchar);

      const acaboEnLogin = urlFinal.toLowerCase().includes('/user/login');

      // La cookie real vive en el almacén del navegador, no hay que
      // capturarla a mano: se consulta aparte sólo para poder decir si la
      // sesión quedó viva o si la DIAN la emitió y la anuló.
      let sesionViva = false;
      try {
        const cookies = await chrome.cookies.getAll({ url: urlAuth });
        sesionViva = cookies.some((c) => /AspNet\.ApplicationCookie/i.test(c.name) && c.value?.length > 20);
      } catch { /* permiso "cookies" ausente en una build vieja; no es crítico */ }

      if (tabId != null) chrome.tabs.remove(tabId).catch(() => {});

      const ok = !acaboEnLogin && sesionViva;
      resolve({
        ok,
        status: 200,
        urlFinal,
        acaboEnLogin,
        sesionViva,
        error: ok
          ? undefined
          : 'La DIAN no aceptó el enlace. El token dura 60 minutos y sólo sirve una vez: pide uno nuevo.',
      });
    }

    chrome.tabs.onUpdated.addListener(escuchar);
    chrome.tabs.create({ url: urlAuth, active: false }, (tab) => {
      if (chrome.runtime.lastError || !tab?.id) {
        clearTimeout(vencido);
        chrome.tabs.onUpdated.removeListener(escuchar);
        terminado = true;
        resolve({ ok: false, error: 'No se pudo abrir la pestaña para autenticar con la DIAN.' });
        return;
      }
      tabId = tab.id;
    });
  });
}

const HOST_BASE = 'https://catalogo-vpfe.dian.gov.co';

/**
 * Trae los bytes de una URL y los clasifica. No decide éxito/fracaso del
 * lote — sólo mide qué llegó, para que quien llama pruebe la siguiente URL
 * si ésta no era un documento.
 */
async function probarUrl(url, control) {
  const res = await fetch(url, {
    credentials: 'include',
    redirect: 'follow',
    signal: control.signal,
    headers: { Accept: '*/*' },
  });
  const bytes = new Uint8Array(await res.arrayBuffer());
  const tipo = res.headers.get('content-type') ?? '';
  const esZip = bytes.length > 1 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  const esXml = tipo.includes('xml') || (bytes.length > 5 && bytes[0] === 0x3c);
  return { ok: res.ok && (esZip || esXml), status: res.status, resOk: res.ok, bytes, esZip, esXml };
}

/**
 * Busca en el HTML de una página un enlace que de verdad diga "descargar",
 * en vez de seguir adivinando el nombre del endpoint. Regex y no DOMParser
 * a propósito: DOMParser no es fiable en todos los service workers, y aquí
 * sólo hace falta un href, no un árbol DOM completo.
 */
function extraerEnlaceDescarga(html, origin) {
  const hrefs = [...html.matchAll(/href\s*=\s*"([^"]+)"/gi)].map((m) => m[1]);
  const candidato = hrefs.find((h) =>
    /download/i.test(h) && !/\.(css|js|ico|png|jpe?g|svg|woff2?|ttf)(\?|$)/i.test(h));
  if (!candidato) return null;
  try { return new URL(candidato, origin).toString(); } catch { return null; }
}

async function guardarBytes(r, cufe) {
  let binario = '';
  const trozo = 0x8000;
  for (let i = 0; i < r.bytes.length; i += trozo) {
    binario += String.fromCharCode(...r.bytes.subarray(i, i + trozo));
  }
  await chrome.downloads.download({
    url: `data:application/octet-stream;base64,${btoa(binario)}`,
    filename: `DIAN/${cufe}.${r.esZip ? 'zip' : 'xml'}`,
    conflictAction: 'overwrite',
    saveAs: false,
  });
}

/**
 * Descarga un documento probando VARIAS rutas conocidas en cascada, en vez
 * de apostar a una sola adivinada.
 *
 * Se verificó en vivo (2026-08-15) que `Document/DownloadZipFile` —el
 * endpoint que se usaba desde el principio— NO EXISTE: la DIAN responde
 * con la página de error genérica de IIS ("The resource cannot be
 * found"), no con un error de la aplicación. O sea, la ruta está mal, no
 * el CUFE.
 *
 * Gosocket Corp SpA (el proveedor detrás de este portal, según el propio
 * HTML) documenta públicamente endpoints llamados `DownloadDocumentXml` /
 * `DownloadDocumentPdf` — nombres bien distintos. Se prueban esos, y como
 * último recurso se lee la página pública de detalle del documento
 * (`ShowDocumentToPublic`, también documentada) y se le pregunta a ELLA
 * misma cuál es su enlace de descarga real, en vez de seguir adivinando.
 *
 * Ninguno de estos candidatos se pudo confirmar contra el portal real
 * todavía — no había más tokens disponibles el día que se escribió esto.
 * El primero que se pruebe es siempre el configurado en "Opciones
 * avanzadas", así que si algo de esto falla, corregir ahí no requiere
 * tocar el código.
 */
async function descargarUno(base, cufe) {
  const control = new AbortController();
  const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const candidatos = [];
    try {
      const u = construirUrl(base, cufe, 'documentKey');
      if (!validarHost(u)) candidatos.push(u.toString());
    } catch { /* endpoint configurado inválido: se ignora, quedan los demás */ }
    candidatos.push(`${HOST_BASE}/Document/DownloadDocumentXml?trackId=${cufe}`);
    candidatos.push(`${HOST_BASE}/Document/DownloadDocumentXml/${cufe}`);

    let ultimaUrl = candidatos[0];
    let ultimoResultado = null;
    for (const url of candidatos) {
      if (control.signal.aborted) break;
      ultimaUrl = url;
      try {
        ultimoResultado = await probarUrl(url, control);
      } catch (err) {
        ultimoResultado = { error: err };
        continue;
      }
      if (ultimoResultado.ok) {
        await guardarBytes(ultimoResultado, cufe);
        return { ok: true };
      }
      await dormir(400); // cada intento extra es una petición real a la DIAN
    }

    // Ninguno de los nombres adivinados funcionó: se lee la página pública
    // de detalle y se busca ahí su propio enlace de descarga.
    try {
      const detalle = `${HOST_BASE}/Document/ShowDocumentToPublic/${cufe}`;
      const resDet = await fetch(detalle, {
        credentials: 'include', redirect: 'follow', signal: control.signal,
        headers: { Accept: 'text/html' },
      });
      const html = await resDet.text();
      const real = extraerEnlaceDescarga(html, HOST_BASE);
      if (real) {
        const u = new URL(real);
        if (!validarHost(u)) {
          ultimaUrl = real;
          ultimoResultado = await probarUrl(real, control);
          if (ultimoResultado.ok) {
            await guardarBytes(ultimoResultado, cufe);
            return { ok: true };
          }
        }
      }
    } catch { /* se queda con el último resultado ya capturado arriba */ }

    if (ultimoResultado?.error) {
      const abortado = ultimoResultado.error?.name === 'AbortError';
      return {
        ok: false,
        detalle: abortado ? 'La DIAN no respondió a tiempo.' : 'No se pudo contactar con la DIAN.',
        url: ultimaUrl,
      };
    }
    const muestra = ultimoResultado
      ? new TextDecoder().decode(ultimoResultado.bytes.slice(0, 500)).replace(/\s+/g, ' ').trim()
      : undefined;
    return {
      ok: false,
      detalle: ultimoResultado?.resOk
        ? 'La DIAN respondió algo que no es un documento. El token puede haber vencido.'
        : `La DIAN respondió ${ultimoResultado?.status ?? '(sin conexión)'}.`,
      muestra, url: ultimaUrl, status: ultimoResultado?.status,
    };
  } finally {
    clearTimeout(alarma);
  }
}

async function correrLote() {
  const total = estado.cufes.length;
  for (const cufe of estado.cufes) {
    if (estado.cancelado) break;
    if (estado.resultados[cufe]?.ok) continue; // ya bajado en una corrida anterior

    // La construcción de la URL ya no pasa por aquí: descargarUno() prueba
    // varios candidatos en cascada (ver su comentario), empezando por el
    // configurado en "Opciones avanzadas".
    const r = await descargarUno(estado.endpoint || estado.urlDian, cufe);
    // La URL y la muestra quedan también en el estado guardado, no sólo en
    // el mensaje en vivo: si se reabre el popup después, el registro tiene
    // que poder mostrar lo mismo, no sólo "hechos: N".
    estado.resultados[cufe] = { ok: r.ok, detalle: r.detalle, muestra: r.muestra, url: r.url };
    await guardarEstado();
    emitir('progreso', {
      cufe, ok: r.ok, detalle: r.detalle, muestra: r.muestra, url: r.url,
      hechos: Object.keys(estado.resultados).length, total,
    });

    await dormir(RITMO_MS);
  }

  estado.corriendo = false;
  await guardarEstado();
  const ok = Object.values(estado.resultados).filter((r) => r.ok).length;
  const errores = Object.values(estado.resultados).filter((r) => !r.ok).length;
  emitir('terminado', { ok, errores });
}

// Le permite a codecdocument.com preguntar "¿está instalada la extensión?"
// sin depender de que el contador sepa explicarlo. Sólo responde — nunca
// inicia nada por su cuenta ni acepta mensajes de otro origen: eso ya lo
// filtra `externally_connectable` en el manifest antes de que esto se
// ejecute siquiera.
chrome.runtime.onMessageExternal.addListener((msg, _sender, responder) => {
  if (msg?.tipo === 'ping') {
    responder({ ok: true, version: chrome.runtime.getManifest().version });
  }
  return true;
});

chrome.runtime.onMessage.addListener((msg, _sender, responder) => {
  (async () => {
    if (msg.tipo === 'probar') {
      const r = await abrirSesion(msg.urlDian);
      responder(r);
      return;
    }

    if (msg.tipo === 'iniciar') {
      const cufesValidos = msg.cufes.filter((c) => CUFE_RE.test(c));

      // Reanudar se identifica por la LISTA de CUFEs, no por el enlace: al
      // reanudar, el enlace SIEMPRE es nuevo (token distinto), pero la lista
      // de documentos pendientes es la misma. Comparar por urlDian habría
      // hecho que cada "pide otro token y continúa" perdiera el progreso.
      const guardado = (await chrome.storage.local.get(CLAVE_ESTADO))[CLAVE_ESTADO];
      const mismaLista = guardado
        && guardado.cufes.length === cufesValidos.length
        && guardado.cufes.every((c, i) => c === cufesValidos[i]);

      estado = {
        urlDian: msg.urlDian,
        endpoint: msg.endpoint || msg.urlDian,
        cufes: cufesValidos,
        resultados: mismaLista ? guardado.resultados : {},
        corriendo: true,
        cancelado: false,
      };
      await guardarEstado();
      responder({ ok: true, total: cufesValidos.length });
      correrLote();
      return;
    }

    if (msg.tipo === 'detener') {
      if (estado) estado.cancelado = true;
      responder({ ok: true });
      return;
    }

    if (msg.tipo === 'estado') {
      if (estado) {
        responder({
          corriendo: estado.corriendo,
          hechos: Object.keys(estado.resultados).length,
          total: estado.cufes.length,
        });
        return;
      }
      const guardado = (await chrome.storage.local.get(CLAVE_ESTADO))[CLAVE_ESTADO];
      responder(guardado
        ? { corriendo: false, hechos: Object.keys(guardado.resultados).length, total: guardado.cufes.length, reanudable: true }
        : { corriendo: false, hechos: 0, total: 0 });
      return;
    }

    responder({ error: 'Mensaje no reconocido' });
  })();
  return true; // respuesta asíncrona
});
