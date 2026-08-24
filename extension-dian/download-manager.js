// DownloadManager — la cola real (punto 6-9 del pedido) y el grupo de
// workers (punto 4-5). No sabe cómo se procesa un CUFE por dentro (eso es
// download-worker.js) ni cómo se abre sesión (dian-session.js); sólo
// reparte trabajo, persiste progreso, calcula métricas y decide cuándo
// pausar por un bloqueo de la DIAN.
//
// ── Rediseño 2026-08-23 — pensado para lotes de miles de CUFEs ──────────
// Objetivo explícito: 5.000 CUFEs → 5.000 intentos controlados → 0
// documentos perdidos, aunque tarde horas. Prioridad: integridad y
// continuidad por encima de velocidad. Cambios de fondo respecto a la
// versión anterior:
//  1. Correlación de descargas por callback síncrono del worker
//     (downloadId → cufe conocido en el instante en que Chrome confirma que
//     empezó a bajar el archivo), no por adivinar el trackId de la URL ni
//     por "cuál está en vuelo" — ver PARTE 7 del pedido.
//  2. Reintentos con espera creciente (backoff) por CUFE, no reintento
//     inmediato — evita martillar a la DIAN con el mismo documento roto.
//  3. Si la DIAN bloquea, además de pausar toda la cola se REDUCE la
//     concurrencia para el resto de la corrida — no vuelve a intentar al
//     mismo ritmo que probablemente causó el bloqueo.
//  4. Late (chrome.alarms) mientras hay trabajo pendiente para que Chrome
//     reviva el service worker si lo mata por inactividad a mitad de un
//     lote largo, y al revivir reconstruye la cola sola desde
//     chrome.storage — el popup puede estar cerrado horas.
//
// Sobre "no cargar los 5.000 en memoria si no es necesario" (PARTE 10): con
// `unlimitedStorage` ya concedido, 5.000 registros (~150-200 bytes cada
// uno) son ~1MB — no es un problema de memoria real para una extensión de
// Chrome. Trocear la persistencia en páginas de 100 no compraría nada aquí;
// en cambio sí se throttlea CUÁNDO se escribe a disco (sólo en eventos que
// cambian estado, nunca en cada sub-paso transitorio).

import { DianDownloadWorker, ESTADOS, extraerCufeDeUrl } from './download-worker.js';
import { abrirSesion } from './dian-session.js';

const CLAVE_ESTADO = 'lote_v2';
const CARPETA_DEFECTO = 'DIAN';
const INTENTOS_MAX = 5;
export const MAX_WORKERS = 5; // rail de seguridad: no queremos parecer un ataque, ver punto 19
const RITMO_ARRANQUE_WORKER_MS = 400;
const RITMO_ENTRE_CUFES_MS = 300;
const RITMO_ESPERA_SIN_TRABAJO_LISTO_MS = 1000; // hay cola pero todo está en backoff: no ocupar CPU en un bucle vacío
const ALARMA_LATIDO = 'dian_latido';
// Chrome no deja periodos menores a 1 minuto para alarmas periódicas — no
// sirve para impedir que el service worker muera por inactividad a mitad de
// una espera (de eso ya se encarga el latido de `download-worker.js`
// durante una descarga activa). Lo que sí garantiza: si el service worker
// muere entre CUFEs, esta alarma lo revive en menos de un minuto y
// `_registrarLatido` reconstruye la cola sola desde chrome.storage — un
// lote de horas no depende de que el popup siga abierto.
const ALARMA_MINUTOS = 1;

// Backoff exponencial por CUFE (no por lote completo): un error temporal en
// el intento 1 reintenta pronto, pero si insiste se espacía más — sin esto,
// un CUFE roto puede pegarle a la DIAN 5 veces en segundos.
const BACKOFF_MS = [3_000, 10_000, 30_000, 60_000, 120_000];

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export class DownloadManager {
  constructor() {
    this._reset();
    this._registrarListenerDescargas();
    this._registrarLatido();
  }

  _reset() {
    this.urlDian = null;
    this.carpeta = CARPETA_DEFECTO;
    this.cufes = [];
    this.documentos = {};
    this._cola = [];
    this.workers = [];
    this.numWorkers = 1;
    this.numWorkersEfectivo = 1; // puede bajar sola tras un bloqueo, sin tocar la preferencia del usuario
    this.corriendo = false;
    this.cancelado = false;
    this.pausadoPorValidacion = false;
    this.ultimoBloqueo = null;
    this.cufesEnVuelo = new Map(); // cufe -> carpeta, para el listener global de nombres
    this._downloadIdPorCufe = new Map(); // downloadId -> cufe, poblado por el worker en cuanto empieza a bajar
    this.borradoPendiente = false;
    this.iniciadoEn = null;
    this.terminadoEn = null;
    this.ultimoDescargaId = null;
    this._velocidadMuestras = [];
  }

  _registrarListenerDescargas() {
    // UN solo listener global (no uno por worker) — cada descarga se
    // atribuye por el downloadId que el propio worker reportó al crearse
    // (ver `onDescargaIniciada` en download-worker.js), así que funciona
    // igual con 1 worker que con 5 corriendo a la vez sin confundir cuál es
    // cuál. El parseo de trackId en la URL queda sólo como último recurso
    // para una descarga que, por lo que sea, no pasó por ese callback.
    chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
      let cufe = this._downloadIdPorCufe.get(item.id) ?? extraerCufeDeUrl(item.url);
      if (!cufe || !this.cufesEnVuelo.has(cufe)) {
        if (this.cufesEnVuelo.size === 1) cufe = [...this.cufesEnVuelo.keys()][0];
        else { suggest(); return; }
      }
      const carpeta = (this.cufesEnVuelo.get(cufe) || CARPETA_DEFECTO).replace(/[\\/:*?"<>|]+/g, '').trim() || CARPETA_DEFECTO;
      const esZip = /\.zip($|\?)/i.test(item.filename) || item.mime === 'application/zip';
      suggest({ filename: `${carpeta}/${cufe}.${esZip ? 'zip' : 'xml'}`, conflictAction: 'overwrite' });
    });
  }

  /**
   * Mantiene vivo el service worker mientras hay trabajo pendiente, y — más
   * importante — permite RECONSTRUIR la cola sola si Chrome mató el service
   * worker a mitad de un lote largo y luego lo revive por esta misma
   * alarma. Sin esto, un lote de 5.000 que tarda horas depende de que el
   * popup se quede abierto todo ese tiempo, algo que el pedido prohíbe
   * explícitamente (PARTE 19/21).
   */
  _registrarLatido() {
    chrome.alarms.onAlarm.addListener(async (alarma) => {
      if (alarma.name !== ALARMA_LATIDO) return;
      if (this.corriendo) return; // esta misma instancia ya está trabajando, no hay nada que reconstruir
      const previo = (await chrome.storage.local.get(CLAVE_ESTADO))[CLAVE_ESTADO];
      if (!previo?.corriendo) { chrome.alarms.clear(ALARMA_LATIDO); return; }
      await this._reanudarAutomaticamente(previo);
    });
  }

  async _reanudarAutomaticamente(previo) {
    this.urlDian = previo.urlDian;
    this.carpeta = previo.carpeta || CARPETA_DEFECTO;
    this.cufes = previo.cufes;
    this.numWorkers = previo.numWorkers || 1;
    this.numWorkersEfectivo = this.numWorkers;
    this.documentos = previo.documentos || {};
    this.iniciadoEn = previo.iniciadoEn || Date.now();
    this.cancelado = false;
    this.pausadoPorValidacion = false;
    this._reconstruirColaPreservandoIntentos();
    this._emitir('log', { texto: 'El service worker se reinició; retomando la descarga donde iba.' });
    this._correr();
  }

  _emitir(tipo, datos = {}) {
    chrome.runtime.sendMessage({ tipo, ...datos }).catch(() => {
      // Nadie escuchando (popup cerrado). El progreso sigue en
      // chrome.storage.local; el popup lo recupera al reabrir con 'estado'.
    });
  }

  async _guardar() {
    if (this.borradoPendiente) return;
    await chrome.storage.local.set({
      [CLAVE_ESTADO]: {
        urlDian: this.urlDian,
        carpeta: this.carpeta,
        numWorkers: this.numWorkers,
        cufes: this.cufes,
        documentos: this.documentos,
        iniciadoEn: this.iniciadoEn,
        terminadoEn: this.terminadoEn,
        corriendo: this.corriendo,
      },
    });
  }

  // ── API pública (llamada desde background.js) ──────────────────────────

  async iniciar({ urlDian, cufes, carpeta, numWorkers }) {
    // Sin esto, un doble clic (o "Iniciar" justo cuando la corrida anterior
    // no había terminado de cerrar) reemplaza this.documentos MIENTRAS el
    // bucle viejo lo sigue usando — visto en vivo (2026-08-19):
    // "Cannot set properties of undefined (setting 'estado')" x2 en el
    // panel de errores de la extensión.
    if (this.corriendo) {
      return { ok: false, error: 'Ya hay una descarga en curso. Dale a Detener primero.' };
    }

    const previo = (await chrome.storage.local.get(CLAVE_ESTADO))[CLAVE_ESTADO];
    const mismaLista = previo && previo.cufes.length === cufes.length && previo.cufes.every((c, i) => c === cufes[i]);

    this.borradoPendiente = false;
    this.urlDian = urlDian;
    this.carpeta = (carpeta || CARPETA_DEFECTO).trim() || CARPETA_DEFECTO;
    this.cufes = cufes;
    this.numWorkers = Math.min(Math.max(1, Number(numWorkers) || 1), MAX_WORKERS);
    this.numWorkersEfectivo = this.numWorkers;
    this.documentos = mismaLista ? previo.documentos : {};
    this.cancelado = false;
    this.pausadoPorValidacion = false;
    this.ultimoBloqueo = null;

    this._reconstruirCola();
    await this._guardar();
    this._correr(); // fire-and-forget
    return { ok: true, total: this.cufes.length };
  }

  detener() {
    this.cancelado = true;
    this.pausadoPorValidacion = false; // no dejarlo colgado esperando validación al cancelar
  }

  async reanudarTrasValidacion() {
    this.pausadoPorValidacion = false;
    this.ultimoBloqueo = null;
    await this._guardar();
  }

  async borrar() {
    this.cancelado = true;
    this.borradoPendiente = true;
    const workersAntiguos = this.workers;
    this.workers = [];
    await chrome.storage.local.remove([CLAVE_ESTADO, 'campo_urlDian', 'campo_cufes']);
    chrome.alarms.clear(ALARMA_LATIDO);
    for (const w of workersAntiguos) await w.detener().catch(() => {});
    this._reset();
  }

  async abrirCarpeta() {
    if (this.ultimoDescargaId != null) {
      chrome.downloads.show(this.ultimoDescargaId);
    } else {
      const guardado = (await chrome.storage.local.get('ultima_descarga_id')).ultima_descarga_id;
      if (guardado != null) chrome.downloads.show(guardado);
      else chrome.downloads.showDefaultFolder();
    }
  }

  estado() {
    return this._resumen();
  }

  exportarCSV() {
    const filas = [['cufe', 'estado', 'intentos', 'inicio', 'fin', 'duracion_ms', 'worker', 'mime', 'tamano', 'detalle', 'downloadId']];
    for (const cufe of this.cufes) {
      const d = this.documentos[cufe] || {};
      filas.push([
        cufe,
        d.estado ?? '',
        d.intentos ?? 0,
        d.inicio ? new Date(d.inicio).toISOString() : '',
        d.fin ? new Date(d.fin).toISOString() : '',
        d.duracionMs ?? '',
        d.workerId ?? '',
        d.mime ?? '',
        d.tamano ?? '',
        d.detalle ?? '',
        d.downloadId ?? '',
      ]);
    }
    return filas.map((f) => f.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  }

  registroCompleto() {
    return this.cufes.map((cufe) => ({ cufe, ...(this.documentos[cufe] || {}) }));
  }

  // ── Motor interno ───────────────────────────────────────────────────────

  _reconstruirCola() {
    for (const cufe of this.cufes) {
      const doc = this.documentos[cufe];
      if (!doc) { this.documentos[cufe] = { estado: ESTADOS.PENDIENTE, intentos: 0 }; continue; }
      if (doc.estado !== ESTADOS.COMPLETADO) { doc.estado = ESTADOS.PENDIENTE; doc.intentos = 0; doc.proximoIntentoEn = 0; }
    }
    this._cola = this.cufes.filter((c) => this.documentos[c].estado !== ESTADOS.COMPLETADO);
  }

  /** Como `_reconstruirCola`, pero sin resetear intentos/backoff — sólo para el auto-resumen tras un reinicio del service worker, nunca para un "Iniciar" explícito del usuario. */
  _reconstruirColaPreservandoIntentos() {
    for (const cufe of this.cufes) {
      const doc = this.documentos[cufe];
      if (!doc) { this.documentos[cufe] = { estado: ESTADOS.PENDIENTE, intentos: 0 }; continue; }
      if (doc.estado !== ESTADOS.COMPLETADO && doc.estado !== ESTADOS.ERROR_DEFINITIVO) doc.estado = ESTADOS.PENDIENTE;
    }
    this._cola = this.cufes.filter((c) => {
      const e = this.documentos[c].estado;
      return e !== ESTADOS.COMPLETADO && e !== ESTADOS.ERROR_DEFINITIVO;
    });
  }

  /** Primer CUFE de la cola cuyo backoff ya venció; null si la cola está vacía o todo sigue en espera. */
  _tomarSiguiente() {
    let i = 0;
    const ahora = Date.now();
    while (i < this._cola.length) {
      const cufe = this._cola[i];
      const doc = this.documentos[cufe];
      if (!doc || doc.estado === ESTADOS.COMPLETADO || doc.estado === ESTADOS.ERROR_DEFINITIVO) {
        this._cola.splice(i, 1); // ya lo resolvió otro worker
        continue;
      }
      if ((doc.proximoIntentoEn || 0) > ahora) { i++; continue; }
      this._cola.splice(i, 1);
      return cufe;
    }
    return null;
  }

  _hayTrabajoEnEspera() {
    return this._cola.some((c) => {
      const doc = this.documentos[c];
      return doc && doc.estado !== ESTADOS.COMPLETADO && doc.estado !== ESTADOS.ERROR_DEFINITIVO;
    });
  }

  async _correr() {
    this.corriendo = true;
    this.iniciadoEn = this.iniciadoEn || Date.now();
    await this._guardar();
    chrome.alarms.create(ALARMA_LATIDO, { periodInMinutes: ALARMA_MINUTOS });

    const auth = await abrirSesion(this.urlDian);
    if (!auth.ok) {
      this.corriendo = false;
      chrome.alarms.clear(ALARMA_LATIDO);
      await this._guardar();
      this._emitir('terminado', { fatal: auth.error, ...this._resumen() });
      return;
    }

    this.workers = [];
    for (let i = 0; i < this.numWorkersEfectivo; i++) {
      if (this.cancelado) break;
      const w = new DianDownloadWorker(i + 1, { carpeta: this.carpeta });
      try {
        await w.iniciar();
        this.workers.push(w);
      } catch (err) {
        this._emitir('log', { texto: `Worker ${i + 1} no pudo abrir su pestaña: ${err.message}` });
      }
      await dormir(RITMO_ARRANQUE_WORKER_MS);
    }

    if (this.workers.length === 0) {
      this.corriendo = false;
      chrome.alarms.clear(ALARMA_LATIDO);
      await this._guardar();
      this._emitir('terminado', { fatal: 'Ningún worker pudo iniciar su pestaña.', ...this._resumen() });
      return;
    }

    await Promise.all(this.workers.map((w) => this._bucleWorker(w)));

    for (const w of this.workers) await w.detener().catch(() => {});
    this.workers = [];

    this.corriendo = false;
    this.terminadoEn = Date.now();
    chrome.alarms.clear(ALARMA_LATIDO);
    await this._guardar();
    this._emitir('terminado', this._resumen());
  }

  async _bucleWorker(worker) {
    while (true) {
      if (this.cancelado) return;
      while (this.pausadoPorValidacion && !this.cancelado) await dormir(1000);
      if (this.cancelado) return;

      // El bloqueo pudo haber bajado `numWorkersEfectivo` mientras este
      // worker esperaba pausado. Los workers "de más" (id por encima del
      // nuevo tope) se retiran aquí en vez de seguir tomando trabajo — así
      // el derate de _pausarPorValidacion sí reduce la concurrencia REAL de
      // esta corrida, no sólo la de la próxima vez que se inicie.
      if (worker.id > this.numWorkersEfectivo) {
        await worker.detener().catch(() => {});
        return;
      }

      const cufe = this._tomarSiguiente();
      if (cufe == null) {
        if (!this._hayTrabajoEnEspera()) return; // cola realmente vacía: este worker termina
        await dormir(RITMO_ESPERA_SIN_TRABAJO_LISTO_MS); // todo lo que queda está en backoff — esperar sin ocupar CPU
        continue;
      }

      this.cufesEnVuelo.set(cufe, this.carpeta);
      // Autoreparación: si por cualquier motivo this.documentos ya no
      // tiene este CUFE (p.ej. se reemplazó por debajo mientras corría),
      // se recrea en vez de tronar con "Cannot set properties of
      // undefined". El guard de arriba (this.corriendo) evita que esto
      // pase en el caso normal — esto es sólo una red de seguridad.
      const doc = this.documentos[cufe] || (this.documentos[cufe] = { estado: ESTADOS.PENDIENTE, intentos: 0 });
      doc.estado = ESTADOS.ASIGNADO;
      doc.workerId = worker.id;
      doc.intentos = (doc.intentos || 0) + 1;
      doc.inicio = doc.inicio || Date.now();
      this._emitir('intento', { cufe, workerId: worker.id, intento: doc.intentos, intentosMax: INTENTOS_MAX, ...this._resumen() });

      const onDescargaIniciada = (downloadId) => { this._downloadIdPorCufe.set(downloadId, cufe); };

      let r;
      try {
        r = await worker.procesarCufe(cufe, onDescargaIniciada);
      } catch (err) {
        r = { estado: ESTADOS.ERROR_REINTENTABLE, detalle: `Error inesperado: ${err?.message ?? err}` };
      }
      this.cufesEnVuelo.delete(cufe);

      await this._registrarResultado(cufe, r, doc, worker);
      await dormir(RITMO_ENTRE_CUFES_MS);
    }
  }

  async _registrarResultado(cufe, r, doc, worker) {
    doc.fin = Date.now();
    doc.duracionMs = doc.fin - doc.inicio;
    doc.detalle = r.detalle;
    doc.muestra = r.muestra;
    doc.url = r.url;
    if (r.downloadId != null) doc.downloadId = r.downloadId;
    doc.mime = r.mime;
    doc.tamano = r.tamano;

    if (r.estado === ESTADOS.COMPLETADO) {
      doc.estado = ESTADOS.COMPLETADO;
      doc.proximoIntentoEn = 0;
      this.ultimoDescargaId = r.downloadId ?? this.ultimoDescargaId;
      if (r.downloadId != null) await chrome.storage.local.set({ ultima_descarga_id: r.downloadId });
      this._velocidadMuestras.push(Date.now());
    } else if (r.estado === ESTADOS.REQUIERE_VALIDACION || r.estado === ESTADOS.BLOQUEO_DIAN) {
      // No cuenta contra su cupo de reintentos — no fue su culpa. Vuelve al
      // frente de la cola para intentarse primero en cuanto se reanude.
      doc.estado = ESTADOS.PENDIENTE;
      doc.intentos = Math.max(0, doc.intentos - 1);
      doc.proximoIntentoEn = 0;
      this._cola.unshift(cufe);
      await this._pausarPorValidacion(r, worker);
    } else if (r.estado === ESTADOS.ERROR_DEFINITIVO || doc.intentos >= INTENTOS_MAX) {
      doc.estado = ESTADOS.ERROR_DEFINITIVO;
    } else {
      doc.estado = ESTADOS.PENDIENTE;
      doc.proximoIntentoEn = Date.now() + BACKOFF_MS[Math.min(doc.intentos - 1, BACKOFF_MS.length - 1)];
      this._cola.push(cufe);
    }

    this._emitir('progreso', { cufe, ...doc, ...this._resumen() });
    await this._guardar();
  }

  async _pausarPorValidacion(r, worker) {
    if (this.pausadoPorValidacion) return;
    this.pausadoPorValidacion = true;
    this.ultimoBloqueo = { detalle: r.detalle, muestra: r.muestra, url: r.url, en: Date.now(), workerId: worker?.id };

    // Un bloqueo casi siempre es consecuencia de haber ido demasiado rápido
    // o en paralelo — reanudar al mismo ritmo que probablemente lo causó
    // es pedir el mismo bloqueo otra vez. Se reduce la concurrencia
    // efectiva para el resto de esta corrida (nunca la preferencia guardada
    // del usuario, que vuelve a aplicarse en la próxima corrida).
    if (this.numWorkersEfectivo > 1) {
      this.numWorkersEfectivo = 1;
      this._emitir('log', { texto: 'La DIAN pidió verificación humana: se bajó la concurrencia a 1 worker para el resto de esta descarga.' });
    }

    // Enfoca la pestaña que topó con el bloqueo para que el humano la vea y
    // pueda resolverla — nunca se automatiza este paso (punto 20).
    if (worker?.tabId != null) {
      try {
        await chrome.tabs.update(worker.tabId, { active: true });
        const tab = await chrome.tabs.get(worker.tabId);
        if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
      } catch { /* no crítico */ }
    }
    this._emitir('bloqueo', this.ultimoBloqueo);
    await this._guardar();
  }

  _resumen() {
    const valores = Object.values(this.documentos);
    const completados = valores.filter((d) => d.estado === ESTADOS.COMPLETADO).length;
    const errores = valores.filter((d) => d.estado === ESTADOS.ERROR_DEFINITIVO).length;
    const reintentando = valores.filter((d) => d.estado === ESTADOS.PENDIENTE && (d.intentos || 0) > 0).length;
    const total = this.cufes.length;
    const pendientes = Math.max(0, total - completados - errores - reintentando);

    const ahora = Date.now();
    this._velocidadMuestras = this._velocidadMuestras.filter((t) => ahora - t <= 60_000);
    const velocidadPorMin = this._velocidadMuestras.length;

    const transcurridoSeg = this.iniciadoEn ? (ahora - this.iniciadoEn) / 1000 : 0;
    const promedioSeg = completados > 0 ? transcurridoSeg / completados : null;
    const etaSeg = velocidadPorMin > 0 && (pendientes + reintentando) > 0 ? ((pendientes + reintentando) / velocidadPorMin) * 60 : null;

    return {
      total, completados, pendientes, errores, reintentando,
      velocidadPorMin, promedioSeg, etaSeg,
      corriendo: this.corriendo,
      pausadoPorValidacion: this.pausadoPorValidacion,
      ultimoBloqueo: this.ultimoBloqueo,
      numWorkers: this.numWorkers,
      numWorkersEfectivo: this.numWorkersEfectivo,
      reanudable: !this.corriendo && total > 0 && (completados + errores) < total,
    };
  }
}
