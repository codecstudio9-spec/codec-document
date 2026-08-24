// DianDownloadWorker — todo lo relacionado con "bajar UN documento" vive
// aquí. No sabe nada de sesión (eso es dian-session.js) ni de cola/otros
// workers (eso es download-manager.js): sólo sabe procesar un CUFE en SU
// PROPIA pestaña, de principio a fin, con topes de tiempo reales en cada
// paso. Varios workers pueden correr esta misma clase en paralelo, cada uno
// con su propia pestaña — la sesión (cookie) ya es compartida por el
// navegador, así que no hace falta volver a autenticar por worker.
//
// ── Rediseño 2026-08-23: por qué el CUFE 1 bajaba bien y el 2 fallaba ────
// La versión anterior sólo recargaba "Documentos recibidos" en las rutas de
// ERROR. Si la descarga del CUFE 1 no navegaba la pestaña (el archivo se
// guarda por Content-Disposition sin abandonar la página de resultados), la
// fila `.download-document` del CUFE 1 seguía viva en el DOM cuando
// arrancaba la búsqueda del CUFE 2 — y `scriptComprobarBusqueda` sólo
// comprobaba que ESE selector existiera, no que perteneciera al CUFE recién
// buscado. No hay forma de confirmar esto en vivo sin una sesión real de la
// DIAN, así que en vez de apostar a un diagnóstico no verificable se
// elimina la clase entera de bug: CADA CUFE arranca con una recarga
// completa de la página de búsqueda (nunca AJAX, nunca DOM heredado), así
// que `.download-document` NO PUEDE existir hasta que el CUFE actual
// produzca un resultado nuevo. Ver `_prepararPestanaLimpia`.

import { HOSTS_PERMITIDOS } from './dian.js';

export const ESTADOS = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  ASIGNADO: 'ASIGNADO',
  PREPARANDO_PESTANA: 'PREPARANDO_PESTANA',
  CONSULTANDO: 'CONSULTANDO',
  ESPERANDO_RESULTADO: 'ESPERANDO_RESULTADO',
  LISTO_PARA_DESCARGAR: 'LISTO_PARA_DESCARGAR',
  DESCARGANDO: 'DESCARGANDO',
  VERIFICANDO_ARCHIVO: 'VERIFICANDO_ARCHIVO',
  COMPLETADO: 'COMPLETADO',
  ERROR_REINTENTABLE: 'ERROR_REINTENTABLE',
  ERROR_DEFINITIVO: 'ERROR_DEFINITIVO',
  BLOQUEO_DIAN: 'BLOQUEO_DIAN',
  REQUIERE_VALIDACION: 'REQUIERE_VALIDACION',
});

const HOST_RECIBIDOS = 'https://catalogo-vpfe.dian.gov.co/Document/Received';
const TIMEOUT_NAVEGACION_MS = 30_000;
const TIMEOUT_BUSQUEDA_MS = 15_000;
const TIMEOUT_DESCARGA_MS = 20_000;
const TIMEOUT_LLAMADA_MS = 8_000; // tope por cada llamada individual a la pestaña
const TIMEOUT_TOTAL_CUFE_MS = 55_000; // red de seguridad final: ninguna combinación de pasos puede colgar más que esto

// Tamaño mínimo plausible para un XML/ZIP de la DIAN real. Una página de
// bloqueo o un error servido con MIME "correcto" por accidente casi siempre
// pesa unos pocos cientos de bytes o menos.
const TAMANO_MINIMO_BYTES = 300;

// Frases que la propia DIAN muestra cuando activa su control de seguridad
// (confirmado por el usuario: desde el 28-07-2026 "Buscar documento" puede
// responder "Solicitud bloqueada por controles de seguridad" ante patrones
// de robot). No dependemos de un único selector — varias señales a la vez.
const FRASES_BLOQUEO = [
  'bloqueada por controles de seguridad',
  'verificación humana',
  'verifica que eres humano',
  'verifica que no eres un robot',
  'access denied',
  'sorry, you have been blocked',
  'solicitud bloqueada',
];

function esPestanaDian(url) {
  if (!url) return false;
  try { return HOSTS_PERMITIDOS.includes(new URL(url).hostname); } catch { return false; }
}

export function extraerCufeDeUrl(url) {
  if (!url) return null;
  try { return new URL(url).searchParams.get('trackId')?.toLowerCase() ?? null; } catch { return null; }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function conLimite(promesa, ms, mensaje) {
  let idLimite;
  const limite = new Promise((_, reject) => { idLimite = setTimeout(() => reject(new Error(mensaje)), ms); });
  try {
    return await Promise.race([promesa, limite]);
  } finally {
    clearTimeout(idLimite);
  }
}

// ── Funciones que se inyectan en la pestaña real de la DIAN ─────────────
// Síncronas y sin esperas propias a propósito: cualquier espera vive en el
// worker (fuera de la pestaña), nunca aquí — un temporizador dentro de una
// pestaña en segundo plano no es confiable (Chrome lo estrangula).

function scriptClicBuscar(cufe) {
  const campo = document.querySelector('#DocumentKey');
  const boton = document.querySelector('.btn-search');
  if (!campo || !boton) {
    return { ok: false, motivo: 'No encontré el formulario de búsqueda — la DIAN pudo haber cambiado el portal.' };
  }
  campo.value = cufe;
  campo.dispatchEvent(new Event('input', { bubbles: true }));
  campo.dispatchEvent(new Event('change', { bubbles: true }));
  boton.click();
  return { ok: true };
}

function scriptComprobarBusqueda() {
  return { encontrado: !!document.querySelector('.download-document') };
}

function scriptClicDescargar() {
  const boton = document.querySelector('.download-document');
  if (!boton) return { ok: false, motivo: 'El botón de descargar de esa fila desapareció.' };
  // Portales ASP.NET suelen usar target="_blank" en el enlace de descarga
  // para no perder la página de resultados — eso abre una pestaña nueva por
  // cada clic. Se quita antes de hacer clic para que navegue en ESTA misma
  // pestaña (download-manager.js también cierra cualquiera que se cuele).
  boton.removeAttribute('target');
  boton.click();
  return { ok: true };
}

function scriptDiagnosticoPagina() {
  const texto = (document.body?.innerText ?? '').toLowerCase();
  const retoVisible = !!document.querySelector('iframe[src*="challenges.cloudflare.com"]');
  return {
    url: location.href,
    texto: (document.body?.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 400),
    textoLower: texto,
    retoVisible,
    tieneFormulario: !!document.querySelector('#DocumentKey'),
  };
}

export class DianDownloadWorker {
  /**
   * @param {number} id
   * @param {{ carpeta: string }} opciones
   */
  constructor(id, opciones) {
    this.id = id;
    this.carpeta = opciones.carpeta;
    this.tabId = null;
    this.cufeActual = null;
    this.estado = 'inactivo';
    this.inicioCufe = null;
    // Si un CUFE se agotó por el tope TOTAL (no por un tope de paso
    // individual), la pestaña puede haber quedado en un estado que ningún
    // selector conocido describe. Más seguro recrearla de cero que
    // confiar en que un simple reload la arregle.
    this._pestanaSospechosa = false;
  }

  /** Abre su propia pestaña oculta sobre "Documentos recibidos". */
  async iniciar() {
    this.estado = 'abriendo';
    this.tabId = await this._crearPestana();
    this.estado = 'listo';
  }

  _crearPestana() {
    return new Promise((resolve, reject) => {
      let terminado = false;
      const vencido = setTimeout(() => {
        if (terminado) return;
        terminado = true;
        chrome.tabs.onUpdated.removeListener(escuchar);
        reject(new Error(`Worker ${this.id}: "Documentos recibidos" no terminó de cargar en ${TIMEOUT_NAVEGACION_MS / 1000}s.`));
      }, TIMEOUT_NAVEGACION_MS);
      let tabId = null;
      const escuchar = (id, info) => {
        if (terminado || id !== tabId || info.status !== 'complete') return;
        terminado = true;
        clearTimeout(vencido);
        chrome.tabs.onUpdated.removeListener(escuchar);
        resolve(tabId);
      };
      chrome.tabs.onUpdated.addListener(escuchar);
      chrome.tabs.create({ url: HOST_RECIBIDOS, active: false }, (tab) => {
        if (terminado) return;
        if (chrome.runtime.lastError || !tab?.id) {
          terminado = true;
          clearTimeout(vencido);
          chrome.tabs.onUpdated.removeListener(escuchar);
          reject(new Error(`Worker ${this.id}: no se pudo abrir la pestaña de la DIAN.`));
          return;
        }
        tabId = tab.id;
      });
    });
  }

  async detener() {
    if (this.tabId != null) {
      try { await chrome.tabs.remove(this.tabId); } catch { /* puede que ya se haya cerrado */ }
    }
    this.tabId = null;
    this.estado = 'detenido';
  }

  /**
   * Deja la pestaña en un estado 100% conocido antes de procesar un CUFE:
   * "Documentos recibidos" recién cargado, sin ningún resultado de búsqueda
   * anterior en el DOM. Se llama SIEMPRE, no sólo tras un error — es la raíz
   * de que un CUFE no pueda "heredar" el resultado del anterior. Si la
   * pestaña ya no existe (el usuario la cerró a mano, o Chrome la mató) o
   * quedó sospechosa por un timeout total, se recrea entera.
   */
  async _prepararPestanaLimpia() {
    if (this.tabId != null && !this._pestanaSospechosa) {
      try {
        await chrome.tabs.get(this.tabId);
      } catch {
        this.tabId = null; // la pestaña ya no existe
      }
    }
    if (this.tabId == null || this._pestanaSospechosa) {
      if (this.tabId != null) { try { await chrome.tabs.remove(this.tabId); } catch { /* ya cerrada */ } }
      this.tabId = await this._crearPestana();
      this._pestanaSospechosa = false;
      return;
    }
    await new Promise((resolve) => {
      let resuelto = false;
      const listo = () => { if (resuelto) return; resuelto = true; resolve(); };
      const escuchar = (id, info) => {
        if (id !== this.tabId || info.status !== 'complete') return;
        chrome.tabs.onUpdated.removeListener(escuchar);
        listo();
      };
      chrome.tabs.onUpdated.addListener(escuchar);
      chrome.tabs.update(this.tabId, { url: HOST_RECIBIDOS }).catch(() => {
        chrome.tabs.onUpdated.removeListener(escuchar);
        listo();
      });
      setTimeout(() => { chrome.tabs.onUpdated.removeListener(escuchar); listo(); }, TIMEOUT_NAVEGACION_MS); // red de seguridad
    });
  }

  /**
   * `chrome.scripting.executeScript` no tiene tope de tiempo propio — cada
   * llamada individual compite contra el suyo. Si pierde, se rechaza igual
   * que cualquier otro fallo de conexión (el llamador ya sabe manejarlo).
   */
  async _ejecutar(func, args = [], timeoutMs = TIMEOUT_LLAMADA_MS) {
    const ejecucion = chrome.scripting.executeScript({ target: { tabId: this.tabId }, func, args })
      .then(([inyeccion]) => inyeccion?.result);
    ejecucion.catch(() => {});
    return conLimite(ejecucion, timeoutMs, 'La pestaña no respondió a tiempo.');
  }

  async _diagnostico() {
    try {
      return await this._ejecutar(scriptDiagnosticoPagina, [], 5000);
    } catch {
      return null;
    }
  }

  /**
   * Procesa UN CUFE de principio a fin en la pestaña de este worker.
   * `onDescargaIniciada(downloadId)` se llama de forma SÍNCRONA en cuanto
   * Chrome confirma que empezó a bajar un archivo — antes de esperar a que
   * termine — para que el manager pueda asociar ese downloadId al CUFE de
   * este job sin tener que adivinar por la URL ni por "cuál está en vuelo"
   * (ver PARTE 7 del pedido: nunca determinar el documento sólo por "la
   * última descarga creada").
   *
   * Devuelve { estado, detalle, muestra, url, downloadId, mime, tamano }.
   * `estado` es siempre uno de ESTADOS — nunca lanza.
   */
  async procesarCufe(cufe, onDescargaIniciada) {
    this.cufeActual = cufe;
    this.inicioCufe = Date.now();
    this.estado = ESTADOS.ASIGNADO;

    try {
      return await conLimite(
        this._procesarInterno(cufe, onDescargaIniciada),
        TIMEOUT_TOTAL_CUFE_MS,
        'El CUFE no terminó de procesarse dentro del tope total (se recreará la pestaña antes del siguiente).',
      );
    } catch (err) {
      this._pestanaSospechosa = true;
      return { estado: ESTADOS.ERROR_REINTENTABLE, detalle: err.message };
    } finally {
      this.cufeActual = null;
      this.estado = 'listo';
    }
  }

  async _procesarInterno(cufe, onDescargaIniciada) {
    this.estado = ESTADOS.PREPARANDO_PESTANA;
    try {
      await this._prepararPestanaLimpia();
    } catch (err) {
      return { estado: ESTADOS.ERROR_REINTENTABLE, detalle: `No se pudo preparar la pestaña: ${err.message}` };
    }

    this.estado = ESTADOS.CONSULTANDO;
    let clic;
    try {
      clic = await this._ejecutar(scriptClicBuscar, [cufe], TIMEOUT_LLAMADA_MS);
    } catch {
      return { estado: ESTADOS.ERROR_REINTENTABLE, detalle: 'Se perdió la conexión con la pestaña al buscar.' };
    }
    if (!clic) return { estado: ESTADOS.ERROR_REINTENTABLE, detalle: 'La pestaña no respondió al buscar.' };
    if (!clic.ok) return { estado: ESTADOS.ERROR_DEFINITIVO, detalle: clic.motivo };

    this.estado = ESTADOS.ESPERANDO_RESULTADO;
    // Presupuesto de 15s, pero revisado con llamadas cortas y acotadas —
    // así un cuelgue puntual (p.ej. la pestaña resolviendo un reto nuevo de
    // Cloudflare) no bloquea el reloj para siempre. Como la pestaña siempre
    // arrancó en blanco (_prepararPestanaLimpia), CUALQUIER aparición de
    // `.download-document` aquí es necesariamente del CUFE actual — no hay
    // resultado previo que pueda confundirse con éste.
    const vence = Date.now() + TIMEOUT_BUSQUEDA_MS;
    await dormir(1200);
    let encontrado = false;
    while (Date.now() < vence) {
      let r;
      try {
        r = await this._ejecutar(scriptComprobarBusqueda, [], 4000);
      } catch {
        r = undefined;
      }
      if (r?.encontrado) { encontrado = true; break; }
      await dormir(500);
    }

    if (!encontrado) {
      const diag = await this._diagnostico();
      if (diag?.retoVisible || (diag?.textoLower && FRASES_BLOQUEO.some((f) => diag.textoLower.includes(f)))) {
        return {
          estado: ESTADOS.REQUIERE_VALIDACION,
          detalle: 'La DIAN pidió una comprobación humana en esta pestaña.',
          muestra: diag?.texto,
          url: diag?.url,
        };
      }
      return {
        estado: ESTADOS.ERROR_REINTENTABLE,
        detalle: 'La DIAN no muestra este CUFE en "Documentos recibidos" (o la sesión venció).',
        muestra: diag?.texto,
        url: diag?.url,
      };
    }

    this.estado = ESTADOS.LISTO_PARA_DESCARGAR;
    this.estado = ESTADOS.DESCARGANDO;
    return this._descargar(cufe, onDescargaIniciada);
  }

  async _descargar(cufe, onDescargaIniciada) {
    const tabId = this.tabId;
    const resultado = await new Promise((resolve) => {
      let terminado = false;

      const vencido = setTimeout(() => {
        if (terminado) return;
        terminado = true;
        limpiar();
        resolve({ ok: false, detalle: 'La DIAN no entregó nada tras hacer clic en descargar (tiempo agotado).' });
      }, TIMEOUT_DESCARGA_MS);

      // Única espera larga del flujo sin llamadas reales a la API de por
      // medio — Manifest V3 puede matar el service worker por inactividad a
      // mitad de esta espera. Este latido no hace nada útil por sí mismo,
      // sólo genera actividad real cada 5s para que no se dé por terminada.
      const latido = setInterval(() => { chrome.tabs.get(tabId).catch(() => {}); }, 5000);

      const onCreated = (item) => {
        // Sólo se rechaza cuando SÍ se pudo leer un trackId de la URL y no
        // coincide con este CUFE (es de otro worker, con certeza). Si no se
        // pudo leer nada, se acepta igual — el manager ya no depende de
        // este parseo para atribuir el archivo (ver onDescargaIniciada):
        // esto sólo evita que ESTE worker robe una descarga ajena.
        const cufeDetectado = extraerCufeDeUrl(item.url);
        if (cufeDetectado != null && cufeDetectado !== cufe) return;
        if (terminado) return;
        terminado = true;
        limpiar();
        onDescargaIniciada?.(item.id);
        resolve({ ok: true, downloadId: item.id });
      };

      const onNavegado = (id, info, tab) => {
        if (id !== tabId || info.status !== 'complete') return;
        if (!tab.url || !tab.url.includes('/Document/DownloadZipFiles')) return;
        if (terminado) return;
        terminado = true;
        limpiar();
        resolve({ ok: false, navegoAError: true });
      };

      // Red de seguridad si quitarle el target al botón no alcanzó a
      // tiempo, o el sitio abre la pestaña con window.open(): el archivo ya
      // se captura por chrome.downloads sin importar en qué pestaña se
      // disparó, así que cualquier pestaña nueva de la DIAN que aparezca
      // aquí no sirve para nada — se cierra sola. Nunca se toca una pestaña
      // que no sea de la DIAN (podría ser algo que el usuario abrió a mano).
      const onPestanaNueva = (tab) => {
        if (tab.id === tabId) return;
        const idNueva = tab.id;
        const revisar = (id, info, t) => {
          if (id !== idNueva || info.status !== 'complete') return;
          chrome.tabs.onUpdated.removeListener(revisar);
          if (esPestanaDian(t.url)) chrome.tabs.remove(idNueva).catch(() => {});
        };
        chrome.tabs.onUpdated.addListener(revisar);
      };

      function limpiar() {
        clearTimeout(vencido);
        clearInterval(latido);
        chrome.downloads.onCreated.removeListener(onCreated);
        chrome.tabs.onUpdated.removeListener(onNavegado);
        chrome.tabs.onCreated.removeListener(onPestanaNueva);
      }

      chrome.downloads.onCreated.addListener(onCreated);
      chrome.tabs.onUpdated.addListener(onNavegado);
      chrome.tabs.onCreated.addListener(onPestanaNueva);

      this._ejecutar(scriptClicDescargar, [], TIMEOUT_LLAMADA_MS).then((r) => {
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
      const diag = await this._diagnostico();
      if (diag?.retoVisible || (diag?.textoLower && FRASES_BLOQUEO.some((f) => diag.textoLower.includes(f)))) {
        return { estado: ESTADOS.REQUIERE_VALIDACION, detalle: 'La DIAN pidió una comprobación humana al descargar.', muestra: diag?.texto, url: diag?.url };
      }
      return {
        estado: ESTADOS.ERROR_REINTENTABLE,
        detalle: 'La DIAN no entregó el archivo (probablemente un error temporal del servidor — no del CUFE).',
        muestra: diag?.texto,
        url: diag?.url,
      };
    }

    if (!resultado.ok) {
      return { estado: ESTADOS.ERROR_REINTENTABLE, detalle: resultado.detalle };
    }

    this.estado = ESTADOS.VERIFICANDO_ARCHIVO;
    return this._verificarDescarga(resultado.downloadId);
  }

  /**
   * "Chrome creó un archivo" no es lo mismo que "el archivo es el XML/ZIP
   * esperado" — si la DIAN devuelve una página HTML de bloqueo, Chrome la
   * puede guardar igual. No leemos el contenido del archivo (una extensión
   * MV3 no puede leer del disco lo que ella misma acaba de guardar sin
   * permisos nativos adicionales — File System Access API sólo existe en
   * páginas, no en el service worker), pero `chrome.downloads.search()` sí
   * da el MIME real que devolvió el servidor y el tamaño en bytes — un
   * bloqueo casi siempre llega como `text/html` y/o unos pocos cientos de
   * bytes, nunca como un zip/xml de tamaño real. Ese chequeo, sin leer
   * bytes, descarta el caso más común sin inventar un parser de ZIP a
   * ciegas (no hay forma de probarlo contra una respuesta real de la DIAN
   * en este entorno — ver README para el porqué no se implementó algo más
   * fuerte todavía).
   */
  async _verificarDescarga(downloadId) {
    const final = await new Promise((resolve) => {
      const vencido = setTimeout(() => { limpiar(); resolve({ ok: true, sinConfirmar: true }); }, TIMEOUT_DESCARGA_MS);
      const onChanged = (delta) => {
        if (delta.id !== downloadId) return;
        if (delta.state?.current === 'complete') { limpiar(); resolve({ ok: true }); }
        if (delta.state?.current === 'interrupted') { limpiar(); resolve({ ok: false, detalle: 'La descarga se interrumpió.' }); }
      };
      function limpiar() { clearTimeout(vencido); chrome.downloads.onChanged.removeListener(onChanged); }
      chrome.downloads.onChanged.addListener(onChanged);
    });

    if (!final.ok) {
      return { estado: ESTADOS.ERROR_REINTENTABLE, detalle: final.detalle, downloadId };
    }

    let mime = null;
    let tamano = null;
    try {
      const [item] = await chrome.downloads.search({ id: downloadId });
      mime = item?.mime ?? null;
      tamano = item?.fileSize ?? null;
    } catch { /* no crítico */ }

    const pareceBloqueo = mime != null && /text\/html/i.test(mime);
    if (pareceBloqueo) {
      return {
        estado: ESTADOS.ERROR_REINTENTABLE,
        detalle: `La DIAN devolvió ${mime} en vez de un archivo — probablemente una página de bloqueo guardada como si fuera el documento.`,
        downloadId,
        mime,
      };
    }

    if (tamano != null && tamano > 0 && tamano < TAMANO_MINIMO_BYTES) {
      return {
        estado: ESTADOS.ERROR_REINTENTABLE,
        detalle: `El archivo pesa sólo ${tamano} bytes — demasiado pequeño para ser un documento real, probablemente una respuesta de error.`,
        downloadId,
        mime,
        tamano,
      };
    }

    return { estado: ESTADOS.COMPLETADO, downloadId, mime, tamano };
  }
}
