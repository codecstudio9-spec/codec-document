// Service worker de la extensión — sólo enruta mensajes. Toda la lógica
// real vive en módulos separados a propósito (ver comentarios de cada uno):
//   dian-session.js    → "¿tengo sesión con la DIAN?"
//   download-worker.js → "bajar UN documento" (una pestaña, un CUFE)
//   download-manager.js→ cola + grupo de workers + persistencia + métricas
//
// ── Por qué existe esta extensión ───────────────────────────────────────
// Se verificó en vivo (2026-08-14) que la DIAN ata el token de acceso a la
// IP que lo solicitó: el mismo enlace, con el mismo token, autentica sin
// problema abierto en el Chrome del contador y falla siempre por un proxy
// de servidor (IPs compartidas). La única forma de que la petición "sea" el
// contador es que salga literalmente de su navegador. De ahí esto.
//
// ── Por qué no se descarga con fetch() directo a una URL adivinada ─────
// Se verificó en vivo (2026-08-18) que el botón de descargar del portal
// llama a `Document/DownloadZipFiles?trackId=<CUFE>&captcha=<token>`, y ese
// `captcha` es un token de Cloudflare Turnstile de un solo uso (Cloudflare
// documenta: expira a los 300s, no se puede reutilizar). No hay forma
// legítima de fabricar o reciclar ese token — la única vía correcta es
// dejar que la propia página de la DIAN lo resuelva, con un clic real sobre
// el botón real. Ver download-worker.js para el detalle de cómo.
//
// ── Por qué no se automatiza la comprobación humana ─────────────────────
// Desde el 28-07-2026 la DIAN puede responder "Solicitud bloqueada por
// controles de seguridad" ante patrones de robot y pedir una comprobación.
// Cuando eso pasa, el DownloadManager PAUSA toda la cola, enfoca la pestaña
// para que el humano la resuelva, y espera — nunca intenta resolverla sola.

import { CUFE_RE, HOSTS_PERMITIDOS, validarHost } from './dian.js';
import { abrirSesion } from './dian-session.js';
import { DownloadManager } from './download-manager.js';

const gestor = new DownloadManager();

/** null si el enlace es válido; si no, el mensaje de error para mostrar. */
function errorDeEnlace(urlDian) {
  let url;
  try { url = new URL(urlDian); } catch { return 'Ese enlace no parece una URL válida.'; }
  return validarHost(url) && `Ese enlace no es de la DIAN. Sólo se permiten: ${HOSTS_PERMITIDOS.join(', ')}.`;
}

// Le permite a codecdocument.com preguntar "¿está instalada la extensión?"
// sin depender de que el contador sepa explicarlo. Sólo responde — nunca
// inicia nada por su cuenta ni acepta mensajes de otro origen: eso ya lo
// filtra `externally_connectable` en el manifest antes de que esto se
// ejecute siquiera.
chrome.runtime.onMessageExternal.addListener((msg, _sender, responder) => {
  (async () => {
    switch (msg?.tipo) {
      case 'ping':
        responder({ ok: true, version: chrome.runtime.getManifest().version, rango: true });
        return;
      // Desde la v3.0 Codec maneja la descarga por rango desde su propio
      // panel (barra de progreso y registro en la página). Sólo
      // codecdocument.com llega aquí: lo filtra externally_connectable.
      case 'iniciarRango': {
        if (msg.urlDian) {
          const error = errorDeEnlace(msg.urlDian);
          if (error) { responder({ ok: false, error }); return; }
        }
        responder(await gestor.iniciarRango({ urlDian: msg.urlDian, desde: msg.desde, hasta: msg.hasta, listado: msg.listado }));
        return;
      }
      case 'estado':
        responder(gestor.estado());
        return;
      case 'detener':
        gestor.detener();
        responder({ ok: true });
        return;
      case 'reanudarValidacion':
        await gestor.reanudarTrasValidacion();
        responder({ ok: true });
        return;
      case 'abrirCarpeta':
        await gestor.abrirCarpeta();
        responder({ ok: true });
        return;
      // Detalle por documento (estado, motivo del fallo y una muestra corta
      // de la página) para mostrarlo en el registro de Codec.
      case 'registro':
        responder({ filas: gestor.registroCompleto().map((d) => ({
          cufe: d.cufe, estado: d.estado, intentos: d.intentos, detalle: d.detalle,
          codigoError: d.codigoError, muestra: typeof d.muestra === 'string' ? d.muestra.slice(0, 600) : undefined,
          numero: d.info?.numero, emisor: d.info?.emisor,
        })) });
        return;
      default:
        responder({ ok: false, error: 'Mensaje no reconocido' });
    }
  })();
  return true;
});

chrome.runtime.onMessage.addListener((msg, _sender, responder) => {
  (async () => {
    switch (msg.tipo) {
      case 'probar': {
        const error = errorDeEnlace(msg.urlDian);
        if (error) { responder({ ok: false, error }); return; }
        responder(await abrirSesion(msg.urlDian));
        return;
      }

      case 'iniciar': {
        const error = errorDeEnlace(msg.urlDian);
        if (error) { responder({ ok: false, error }); return; }
        const cufesValidos = (msg.cufes || []).filter((c) => CUFE_RE.test(c));
        responder(await gestor.iniciar({
          urlDian: msg.urlDian,
          cufes: cufesValidos,
          carpeta: msg.carpeta,
          numWorkers: msg.numWorkers,
        }));
        return;
      }

      case 'iniciarRango': {
        if (msg.urlDian) {
          const error = errorDeEnlace(msg.urlDian);
          if (error) { responder({ ok: false, error }); return; }
        }
        responder(await gestor.iniciarRango({ urlDian: msg.urlDian, desde: msg.desde, hasta: msg.hasta, listado: msg.listado }));
        return;
      }

      case 'detener':
        gestor.detener();
        responder({ ok: true });
        return;

      case 'reanudarValidacion':
        await gestor.reanudarTrasValidacion();
        responder({ ok: true });
        return;

      case 'estado':
        responder(gestor.estado());
        return;

      case 'registro':
        responder({ filas: gestor.registroCompleto() });
        return;

      case 'exportarLog':
        responder({ csv: gestor.exportarCSV() });
        return;

      case 'abrirCarpeta':
        await gestor.abrirCarpeta();
        responder({ ok: true });
        return;

      case 'borrar':
        await gestor.borrar();
        responder({ ok: true });
        return;

      default:
        responder({ error: 'Mensaje no reconocido' });
    }
  })();
  return true; // respuesta asíncrona
});
