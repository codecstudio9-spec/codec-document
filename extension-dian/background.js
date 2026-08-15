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
 * Abre sesión con el enlace del correo. Igual que abrirSesion() del proxy,
 * salvo que aquí no hay cookie que capturar a mano: el navegador la guarda
 * sola en cuanto llega el Set-Cookie de la respuesta.
 */
async function abrirSesion(urlAuth, { conMuestra = false } = {}) {
  const control = new AbortController();
  const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(urlAuth, {
      credentials: 'include',
      redirect: 'follow',
      signal: control.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9',
      },
    });

    const acaboEnLogin = res.url.toLowerCase().includes('/user/login');
    const texto = conMuestra || acaboEnLogin
      ? await res.clone().text().catch(() => '')
      : '';

    // La cookie real vive en el almacén del navegador, no en la respuesta:
    // se consulta aparte para poder mostrar el mismo diagnóstico que tenía
    // el panel web ("¿la sesión quedó viva?"), no para reenviarla — eso lo
    // hace el navegador solo en la próxima petición.
    let sesionViva = false;
    try {
      const cookies = await chrome.cookies.getAll({ url: urlAuth });
      sesionViva = cookies.some((c) => /AspNet\.ApplicationCookie/i.test(c.name) && c.value?.length > 20);
    } catch { /* permiso "cookies" ausente en una build vieja; no es crítico */ }

    const ok = res.ok && !acaboEnLogin && sesionViva;
    return {
      ok,
      status: res.status,
      urlFinal: res.url,
      acaboEnLogin,
      sesionViva,
      muestra: conMuestra ? texto.replace(/\s+/g, ' ').slice(0, 400) : undefined,
      error: ok
        ? undefined
        : (acaboEnLogin || !sesionViva)
          ? 'La DIAN no aceptó el enlace. El token dura 60 minutos y sólo sirve una vez: pide uno nuevo.'
          : `La DIAN respondió ${res.status} al abrir la sesión.`,
    };
  } catch (err) {
    const abortado = err?.name === 'AbortError';
    return {
      ok: false,
      error: abortado
        ? `La DIAN no respondió en ${TIMEOUT_MS / 1000} segundos. Espera un minuto y reintenta con el mismo enlace.`
        : `No se pudo conectar con la DIAN (${err?.message ?? 'error de red'}).`,
    };
  } finally {
    clearTimeout(alarma);
  }
}

/** Descarga un documento. Misma validación de bytes que el proxy: un ZIP
 *  empieza por "PK"; si la DIAN devolvió HTML (sesión vencida a mitad de
 *  lote), no se guarda como si fuera un documento válido. */
async function descargarUno(destino, cufe) {
  const control = new AbortController();
  const alarma = setTimeout(() => control.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(destino.toString(), {
      credentials: 'include',
      redirect: 'follow',
      signal: control.signal,
      headers: { Accept: '*/*' },
    });
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const tipo = res.headers.get('content-type') ?? '';

    const esZip = bytes.length > 1 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    const esXml = tipo.includes('xml') || (bytes.length > 5 && bytes[0] === 0x3c);
    const ok = res.ok && (esZip || esXml);

    if (!ok) {
      const muestra = new TextDecoder().decode(bytes.slice(0, 300)).replace(/\s+/g, ' ').trim();
      return {
        ok: false,
        detalle: res.ok
          ? 'La DIAN respondió algo que no es un documento. El token puede haber vencido.'
          : `La DIAN respondió ${res.status}.`,
        muestra,
      };
    }

    let binario = '';
    const trozo = 0x8000;
    for (let i = 0; i < bytes.length; i += trozo) {
      binario += String.fromCharCode(...bytes.subarray(i, i + trozo));
    }
    const extension = esZip ? 'zip' : 'xml';
    await chrome.downloads.download({
      url: `data:application/octet-stream;base64,${btoa(binario)}`,
      filename: `DIAN/${cufe}.${extension}`,
      conflictAction: 'overwrite',
      saveAs: false,
    });
    return { ok: true };
  } catch (err) {
    const abortado = err?.name === 'AbortError';
    return { ok: false, detalle: abortado ? 'La DIAN no respondió a tiempo.' : 'No se pudo contactar con la DIAN.' };
  } finally {
    clearTimeout(alarma);
  }
}

async function correrLote() {
  const total = estado.cufes.length;
  for (const cufe of estado.cufes) {
    if (estado.cancelado) break;
    if (estado.resultados[cufe]?.ok) continue; // ya bajado en una corrida anterior

    let destino;
    try {
      destino = construirUrl(estado.endpoint || estado.urlDian, cufe, 'documentKey');
      const problema = validarHost(destino);
      if (problema) throw new Error(problema);
    } catch (e) {
      estado.resultados[cufe] = { ok: false, detalle: e.message };
      await guardarEstado();
      emitir('progreso', { cufe, ok: false, detalle: e.message, hechos: Object.keys(estado.resultados).length, total });
      continue;
    }

    const r = await descargarUno(destino, cufe);
    estado.resultados[cufe] = { ok: r.ok, detalle: r.detalle };
    await guardarEstado();
    emitir('progreso', {
      cufe, ok: r.ok, detalle: r.detalle, muestra: r.muestra,
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

chrome.runtime.onMessage.addListener((msg, _sender, responder) => {
  (async () => {
    if (msg.tipo === 'probar') {
      const r = await abrirSesion(msg.urlDian, { conMuestra: true });
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
