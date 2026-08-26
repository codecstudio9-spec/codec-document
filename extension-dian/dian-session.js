// DianSessionManager — todo lo relacionado con "¿tengo sesión con la DIAN?"
// vive aquí, separado a propósito de la descarga en sí (download-worker.js).
// Nunca mezclar: esto no sabe qué es un CUFE, y download-worker.js no sabe
// cómo se abre una sesión.

const TIMEOUT_MS = 30_000;

/**
 * Abre sesión con el enlace del correo del token. Abre una pestaña REAL
 * (no fetch()) porque un fetch() de service worker nunca lleva las
 * cabeceras de una navegación real (Sec-Fetch-Dest: document, etc.) que
 * Chrome fija él mismo — se probó en vivo (2026-08-15) que sin eso la DIAN
 * responde 200 con la pantalla de login sin emitir la cookie de sesión.
 */
export async function abrirSesion(urlAuth) {
  return new Promise((resolve) => {
    let terminado = false;
    let tabId = null;
    let windowId = null;

    const cerrarVentana = () => {
      if (windowId != null) chrome.windows.remove(windowId).catch(() => {});
      else if (tabId != null) chrome.tabs.remove(tabId).catch(() => {});
    };

    const escuchar = (id, info, tab) => {
      if (id !== tabId || info.status !== 'complete') return;
      finalizar(tab.url ?? '');
    };

    const vencido = setTimeout(() => {
      if (terminado) return;
      terminado = true;
      chrome.tabs.onUpdated.removeListener(escuchar);
      cerrarVentana();
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

      cerrarVentana();

      const ok = !acaboEnLogin && sesionViva;
      resolve({
        ok,
        urlFinal,
        acaboEnLogin,
        sesionViva,
        error: ok
          ? undefined
          : 'La DIAN no aceptó el enlace. El token dura 60 minutos y sólo sirve una vez: pide uno nuevo.',
      });
    }

    chrome.tabs.onUpdated.addListener(escuchar);
    // Ventana propia, NO oculta (`active: false`) dentro de la ventana
    // principal — mismo cambio e hipótesis que download-worker.js (ver su
    // comentario grande de auditoría 2026-08-25): si el filtro de
    // seguridad de la DIAN necesita que Chrome marque la pestaña como
    // visible para completarse, esto también podría afectar el propio
    // paso de autenticación, no sólo la búsqueda de cada CUFE.
    chrome.windows.create({ url: urlAuth, type: 'normal', focused: false, width: 480, height: 640, left: 20, top: 20 }, (win) => {
      const tab = win?.tabs?.[0];
      if (chrome.runtime.lastError || !win?.id || !tab?.id) {
        clearTimeout(vencido);
        chrome.tabs.onUpdated.removeListener(escuchar);
        terminado = true;
        resolve({ ok: false, error: 'No se pudo abrir la ventana para autenticar con la DIAN.' });
        return;
      }
      windowId = win.id;
      tabId = tab.id;
      if (tab.status === 'complete') finalizar(tab.url ?? '');
    });
  });
}

/**
 * Cualquier pestaña abierta sobre el dominio de la DIAN comparte la misma
 * sesión (las cookies son del navegador, no de una pestaña en particular) —
 * por eso `abrirSesion` se llama UNA sola vez para todo el lote, sin
 * importar cuántos workers/pestañas de descarga se abran después. Esta
 * función sólo confirma que la cookie de sesión sigue viva, sin abrir nada.
 */
export async function sesionSigueViva(urlAuth) {
  try {
    const cookies = await chrome.cookies.getAll({ url: urlAuth });
    return cookies.some((c) => /AspNet\.ApplicationCookie/i.test(c.name) && c.value?.length > 20);
  } catch {
    return true; // sin el permiso "cookies" no podemos saberlo; no bloquear por eso
  }
}
