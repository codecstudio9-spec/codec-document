// Service worker de la extensión.
//
// ── Por qué existe esta extensión ───────────────────────────────────────
// Se verificó en vivo (2026-08-14) que la DIAN ata el token de acceso a la
// IP que lo solicitó: el mismo enlace, con el mismo token, autentica sin
// problema abierto en el Chrome del contador y falla siempre por el proxy
// del servidor (IPs de Supabase, compartidas entre todos los clientes).
// La única forma de que la petición "sea" el contador es que salga
// literalmente de su navegador. De ahí esto.
//
// ── Por qué YA NO se descarga con fetch() directo a una URL adivinada ──
// Se verificó en vivo (2026-08-18) que la descarga real de la DIAN no es
// sólo "pega un CUFE en una URL": el botón de descargar del propio portal
// llama a `Document/DownloadZipFiles?trackId=<CUFE>&captcha=<token>`, y ese
// `captcha` es un token de Cloudflare Turnstile que la página resuelve SOLA
// al cargar (widget invisible/administrado). No hay forma de fabricar ese
// token desde un service worker — no tiene DOM, no puede cargar el script
// de Turnstile, y reconstruirlo a mano sería evadir a propósito su
// protección anti-bot, algo que esta extensión no debe hacer.
//
// La solución que SÍ es legítima: dejar que la propia página de la DIAN
// haga el trabajo. Se abre una pestaña real (oculta) sobre "Documentos
// recibidos", se busca cada CUFE por su campo "Código único" (que ya
// existe en el formulario del portal) y se hace clic en EL BOTÓN REAL de
// descargar de esa fila. Es exactamente lo que haría un contador a mano,
// sólo que automatizado — el Turnstile se resuelve solo, una vez por
// pestaña, igual que le pasa a un humano.
//
// Es más lento que un fetch() (cada CUFE es una búsqueda real en el
// portal), pero es lo único que no depende de romper ni de adivinar nada.

import { CUFE_RE, HOSTS_PERMITIDOS, validarHost } from './dian.js';

const TIMEOUT_MS = 30_000; // autenticación inicial
const DESCARGA_TIMEOUT_MS = 20_000; // clic en "descargar" -> archivo o error
const RITMO_MS = 700; // pausa entre CUFEs
const CLAVE_ESTADO = 'lote_actual';
const HOST_RECIBIDOS = 'https://catalogo-vpfe.dian.gov.co/Document/Received';

/** @type {{
 *   urlDian: string, cufes: string[],
 *   resultados: Record<string, {ok: boolean, detalle?: string, muestra?: string, url?: string}>,
 *   corriendo: boolean, cancelado: boolean, cufeEnCurso: string | null,
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
 * ni falsearlas. Cuando SÍ se abrió el mismo enlace como pestaña de verdad,
 * nunca falló.
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

/**
 * Abre una pestaña oculta sobre "Documentos recibidos" y espera a que
 * termine de cargar (incluye la verificación de Cloudflare, que se resuelve
 * sola). Se deja UNA sola pestaña abierta para todo el lote — repetir esto
 * por cada CUFE forzaría a resolver el Turnstile una y otra vez.
 */
async function abrirPestanaRecibidos() {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: HOST_RECIBIDOS, active: false }, (tab) => {
      if (chrome.runtime.lastError || !tab?.id) {
        reject(new Error('No se pudo abrir la pestaña de "Documentos recibidos" de la DIAN.'));
        return;
      }
      const tabId = tab.id;
      const escuchar = (id, info) => {
        if (id !== tabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(escuchar);
        resolve(tabId);
      };
      chrome.tabs.onUpdated.addListener(escuchar);
    });
  });
}

// ── Funciones que se inyectan en la pestaña real de la DIAN ─────────────
// Corren en el contexto de la página (no del service worker): tienen DOM,
// pueden disparar los mismos eventos que un clic humano, y el Turnstile de
// esa página ya está resuelto porque la pestaña terminó de cargar.

function scriptBuscarCufe(cufe) {
  return new Promise((resolve) => {
    const campo = document.querySelector('#DocumentKey');
    const boton = document.querySelector('.btn-search');
    if (!campo || !boton) {
      resolve({ ok: false, motivo: 'No encontré el formulario de búsqueda — la DIAN pudo haber cambiado el portal.' });
      return;
    }
    campo.value = cufe;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
    boton.click();

    const vence = Date.now() + 15000;
    const intento = () => {
      if (document.querySelector('.download-document')) {
        resolve({ ok: true, encontrado: true });
        return;
      }
      if (Date.now() > vence) {
        resolve({ ok: true, encontrado: false });
        return;
      }
      setTimeout(intento, 500);
    };
    setTimeout(intento, 1200);
  });
}

function scriptClicDescargar() {
  const boton = document.querySelector('.download-document');
  if (!boton) return { ok: false, motivo: 'El botón de descargar de esa fila desapareció.' };
  boton.click();
  return { ok: true };
}

function scriptLeerPagina() {
  return {
    url: location.href,
    texto: (document.body?.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 400),
  };
}

async function ejecutarEnPestana(tabId, func, args = []) {
  const [inyeccion] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  return inyeccion?.result;
}

/** Vuelve a "Documentos recibidos" para poder buscar el siguiente CUFE. */
async function volverABusqueda(tabId) {
  await new Promise((resolve) => {
    const escuchar = (id, info) => {
      if (id !== tabId || info.status !== 'complete') return;
      chrome.tabs.onUpdated.removeListener(escuchar);
      resolve();
    };
    chrome.tabs.onUpdated.addListener(escuchar);
    chrome.tabs.update(tabId, { url: HOST_RECIBIDOS }).catch(() => resolve());
  });
}

/** Espera a que chrome.downloads confirme que el archivo terminó de bajar. */
function esperarDescarga(downloadId) {
  return new Promise((resolve) => {
    const vencido = setTimeout(() => {
      limpiar();
      resolve({ ok: true, detalle: 'Descargado (no se confirmó el final a tiempo, pero el archivo debería estar).' });
    }, DESCARGA_TIMEOUT_MS);
    const onChanged = (delta) => {
      if (delta.id !== downloadId) return;
      if (delta.state?.current === 'complete') { limpiar(); resolve({ ok: true }); }
      if (delta.state?.current === 'interrupted') { limpiar(); resolve({ ok: false, detalle: 'La descarga se interrumpió.' }); }
    };
    function limpiar() {
      clearTimeout(vencido);
      chrome.downloads.onChanged.removeListener(onChanged);
    }
    chrome.downloads.onChanged.addListener(onChanged);
  });
}

// Le pone nombre al archivo ANTES de que se guarde: DIAN/<cufe>.<ext>, en
// vez del nombre que le ponga la DIAN. `estado.cufeEnCurso` identifica de
// qué CUFE es la descarga que está en marcha justo ahora.
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  const cufe = estado?.cufeEnCurso;
  if (!cufe) { suggest(); return; }
  const esZip = /\.zip($|\?)/i.test(item.filename) || item.mime === 'application/zip';
  suggest({ filename: `DIAN/${cufe}.${esZip ? 'zip' : 'xml'}`, conflictAction: 'overwrite' });
});

/**
 * Busca un CUFE en el portal y, si aparece, hace clic en su botón real de
 * descargar. El resultado se decide con una carrera: o `chrome.downloads`
 * confirma que empezó a bajar un archivo (éxito — la DIAN mandó un
 * documento de verdad), o la pestaña termina navegando a otra URL sin que
 * haya descarga (la respuesta no era un archivo: sesión vencida, error del
 * servidor, etc.).
 */
async function descargarUno(tabId, cufe) {
  let busqueda;
  try {
    busqueda = await ejecutarEnPestana(tabId, scriptBuscarCufe, [cufe]);
  } catch {
    return { ok: false, detalle: 'Se perdió la conexión con la pestaña de la DIAN al buscar. Reintenta.' };
  }
  if (!busqueda) return { ok: false, detalle: 'La pestaña de la DIAN no respondió al buscar.' };
  if (!busqueda.ok) return { ok: false, detalle: busqueda.motivo };
  if (!busqueda.encontrado) {
    return { ok: false, detalle: 'La DIAN no muestra este CUFE en "Documentos recibidos" (o la sesión venció).' };
  }

  const resultado = await new Promise((resolve) => {
    let terminado = false;

    const vencido = setTimeout(() => {
      if (terminado) return;
      terminado = true;
      limpiar();
      resolve({ ok: false, detalle: 'La DIAN no entregó nada tras hacer clic en descargar (tiempo agotado).' });
    }, DESCARGA_TIMEOUT_MS);

    const onCreated = (item) => {
      if (terminado) return;
      terminado = true;
      limpiar();
      resolve({ ok: true, downloadId: item.id });
    };

    // Si la pestaña navega a la URL de descarga sin que chrome.downloads
    // dispare nada, es que la respuesta no era un archivo adjunto (típico
    // de un error del servidor devuelto como página HTML).
    const onNavegado = (id, info, tab) => {
      if (id !== tabId || info.status !== 'complete') return;
      if (!tab.url || !tab.url.includes('/Document/DownloadZipFiles')) return;
      if (terminado) return;
      terminado = true;
      limpiar();
      resolve({ ok: false, navegoAError: true });
    };

    function limpiar() {
      clearTimeout(vencido);
      chrome.downloads.onCreated.removeListener(onCreated);
      chrome.tabs.onUpdated.removeListener(onNavegado);
    }

    chrome.downloads.onCreated.addListener(onCreated);
    chrome.tabs.onUpdated.addListener(onNavegado);

    ejecutarEnPestana(tabId, scriptClicDescargar).then((r) => {
      if (terminado) return;
      if (!r?.ok) {
        terminado = true;
        limpiar();
        resolve({ ok: false, detalle: r?.motivo || 'No se pudo hacer clic en el botón de descargar.' });
      }
    }).catch(() => {
      if (terminado) return;
      terminado = true;
      limpiar();
      resolve({ ok: false, detalle: 'Se perdió la conexión con la pestaña al hacer clic en descargar.' });
    });
  });

  if (resultado.navegoAError) {
    let diagnostico;
    try { diagnostico = await ejecutarEnPestana(tabId, scriptLeerPagina); } catch { /* puede seguir cargando */ }
    await volverABusqueda(tabId);
    return {
      ok: false,
      detalle: 'La DIAN no entregó el archivo (probablemente un error temporal del servidor — no del CUFE).',
      muestra: diagnostico?.texto,
      url: diagnostico?.url,
    };
  }

  if (resultado.ok) {
    const final = await esperarDescarga(resultado.downloadId);
    if (!final.ok) await volverABusqueda(tabId);
    return final;
  }

  return resultado;
}

async function correrLote() {
  const total = estado.cufes.length;

  const auth = await abrirSesion(estado.urlDian);
  if (!auth.ok) {
    estado.corriendo = false;
    await guardarEstado();
    emitir('terminado', { ok: 0, errores: total, fatal: auth.error });
    return;
  }

  let tabId;
  try {
    tabId = await abrirPestanaRecibidos();
  } catch (err) {
    estado.corriendo = false;
    await guardarEstado();
    emitir('terminado', { ok: 0, errores: total, fatal: err.message });
    return;
  }

  for (const cufe of estado.cufes) {
    if (estado.cancelado) break;
    if (estado.resultados[cufe]?.ok) continue; // ya bajado en una corrida anterior

    estado.cufeEnCurso = cufe;
    let r;
    try {
      r = await descargarUno(tabId, cufe);
    } catch (err) {
      r = { ok: false, detalle: `Error inesperado: ${err?.message ?? err}` };
    }
    estado.cufeEnCurso = null;

    estado.resultados[cufe] = { ok: r.ok, detalle: r.detalle, muestra: r.muestra, url: r.url };
    await guardarEstado();
    emitir('progreso', {
      cufe, ok: r.ok, detalle: r.detalle, muestra: r.muestra, url: r.url,
      hechos: Object.keys(estado.resultados).length, total,
    });

    await dormir(RITMO_MS);
  }

  try { await chrome.tabs.remove(tabId); } catch { /* puede que ya se haya cerrado */ }

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

/** null si el enlace es válido; si no, el mensaje de error para mostrar. */
function errorDeEnlace(urlDian) {
  let url;
  try { url = new URL(urlDian); } catch { return 'Ese enlace no parece una URL válida.'; }
  return validarHost(url) && `Ese enlace no es de la DIAN. Sólo se permiten: ${HOSTS_PERMITIDOS.join(', ')}.`;
}

chrome.runtime.onMessage.addListener((msg, _sender, responder) => {
  (async () => {
    if (msg.tipo === 'probar') {
      const error = errorDeEnlace(msg.urlDian);
      if (error) { responder({ ok: false, error }); return; }
      const r = await abrirSesion(msg.urlDian);
      responder(r);
      return;
    }

    if (msg.tipo === 'iniciar') {
      const errorEnlace = errorDeEnlace(msg.urlDian);
      if (errorEnlace) { responder({ ok: false, error: errorEnlace }); return; }

      const cufesValidos = msg.cufes.filter((c) => CUFE_RE.test(c));

      const guardado = (await chrome.storage.local.get(CLAVE_ESTADO))[CLAVE_ESTADO];
      const mismaLista = guardado
        && guardado.cufes.length === cufesValidos.length
        && guardado.cufes.every((c, i) => c === cufesValidos[i]);

      estado = {
        urlDian: msg.urlDian,
        cufes: cufesValidos,
        resultados: mismaLista ? guardado.resultados : {},
        corriendo: true,
        cancelado: false,
        cufeEnCurso: null,
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
