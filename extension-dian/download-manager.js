// DownloadManager — la cola real (punto 6-9 del pedido) y el grupo de
// workers (punto 4-5). No sabe cómo se procesa un CUFE por dentro (eso es
// download-worker.js) ni cómo se abre sesión (dian-session.js); sólo
// reparte trabajo, persiste progreso, calcula métricas y decide cuándo
// pausar por un bloqueo de la DIAN.

import { DianDownloadWorker, ESTADOS, extraerCufeDeUrl } from './download-worker.js';
import { abrirSesion } from './dian-session.js';

const CLAVE_ESTADO = 'lote_v2';
const CARPETA_DEFECTO = 'DIAN';
const INTENTOS_MAX = 3;
export const MAX_WORKERS = 5; // rail de seguridad: no queremos parecer un ataque, ver punto 19
const RITMO_ARRANQUE_WORKER_MS = 400;
const RITMO_ENTRE_CUFES_MS = 300;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export class DownloadManager {
  constructor() {
    this._reset();
    this._registrarListenerDescargas();
  }

  _reset() {
    this.urlDian = null;
    this.carpeta = CARPETA_DEFECTO;
    this.cufes = [];
    this.documentos = {};
    this._cola = [];
    this.workers = [];
    this.numWorkers = 1;
    this.corriendo = false;
    this.cancelado = false;
    this.pausadoPorValidacion = false;
    this.ultimoBloqueo = null;
    this.cufesEnVuelo = new Map(); // cufe -> carpeta, para el listener global de nombres
    this.borradoPendiente = false;
    this.iniciadoEn = null;
    this.terminadoEn = null;
    this.ultimoDescargaId = null;
    this._velocidadMuestras = [];
  }

  _registrarListenerDescargas() {
    // UN solo listener global (no uno por worker) — cada descarga se
    // atribuye por el trackId de su propia URL, así que funciona igual con
    // 1 worker que con 5 corriendo a la vez sin confundir cuál es cuál.
    chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
      const cufe = extraerCufeDeUrl(item.url);
      if (!cufe || !this.cufesEnVuelo.has(cufe)) { suggest(); return; }
      const carpeta = (this.cufesEnVuelo.get(cufe) || CARPETA_DEFECTO).replace(/[\\/:*?"<>|]+/g, '').trim() || CARPETA_DEFECTO;
      const esZip = /\.zip($|\?)/i.test(item.filename) || item.mime === 'application/zip';
      suggest({ filename: `${carpeta}/${cufe}.${esZip ? 'zip' : 'xml'}`, conflictAction: 'overwrite' });
    });
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
      },
    });
  }

  // ── API pública (llamada desde background.js) ──────────────────────────

  async iniciar({ urlDian, cufes, carpeta, numWorkers }) {
    const previo = (await chrome.storage.local.get(CLAVE_ESTADO))[CLAVE_ESTADO];
    const mismaLista = previo && previo.cufes.length === cufes.length && previo.cufes.every((c, i) => c === cufes[i]);

    this.borradoPendiente = false;
    this.urlDian = urlDian;
    this.carpeta = (carpeta || CARPETA_DEFECTO).trim() || CARPETA_DEFECTO;
    this.cufes = cufes;
    this.numWorkers = Math.min(Math.max(1, Number(numWorkers) || 1), MAX_WORKERS);
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
      if (doc.estado !== ESTADOS.COMPLETADO) { doc.estado = ESTADOS.PENDIENTE; doc.intentos = 0; }
    }
    this._cola = this.cufes.filter((c) => this.documentos[c].estado !== ESTADOS.COMPLETADO);
  }

  _tomarSiguiente() {
    while (this._cola.length > 0) {
      const cufe = this._cola.shift();
      if (this.documentos[cufe]?.estado === ESTADOS.COMPLETADO) continue; // ya lo bajó otro worker
      return cufe;
    }
    return null;
  }

  async _correr() {
    this.corriendo = true;
    this.iniciadoEn = this.iniciadoEn || Date.now();
    await this._guardar();

    const auth = await abrirSesion(this.urlDian);
    if (!auth.ok) {
      this.corriendo = false;
      await this._guardar();
      this._emitir('terminado', { fatal: auth.error, ...this._resumen() });
      return;
    }

    this.workers = [];
    for (let i = 0; i < this.numWorkers; i++) {
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
      await this._guardar();
      this._emitir('terminado', { fatal: 'Ningún worker pudo iniciar su pestaña.', ...this._resumen() });
      return;
    }

    await Promise.all(this.workers.map((w) => this._bucleWorker(w)));

    for (const w of this.workers) await w.detener().catch(() => {});
    this.workers = [];

    this.corriendo = false;
    this.terminadoEn = Date.now();
    await this._guardar();
    this._emitir('terminado', this._resumen());
  }

  async _bucleWorker(worker) {
    while (true) {
      if (this.cancelado) return;
      while (this.pausadoPorValidacion && !this.cancelado) await dormir(1000);
      if (this.cancelado) return;

      const cufe = this._tomarSiguiente();
      if (cufe == null) return;

      this.cufesEnVuelo.set(cufe, this.carpeta);
      const doc = this.documentos[cufe];
      doc.estado = ESTADOS.ASIGNADO;
      doc.workerId = worker.id;
      doc.intentos = (doc.intentos || 0) + 1;
      doc.inicio = doc.inicio || Date.now();
      this._emitir('intento', { cufe, workerId: worker.id, intento: doc.intentos, intentosMax: INTENTOS_MAX, ...this._resumen() });

      let r;
      try {
        r = await worker.procesarCufe(cufe);
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
      this.ultimoDescargaId = r.downloadId ?? this.ultimoDescargaId;
      if (r.downloadId != null) await chrome.storage.local.set({ ultima_descarga_id: r.downloadId });
      this._velocidadMuestras.push(Date.now());
    } else if (r.estado === ESTADOS.REQUIERE_VALIDACION || r.estado === ESTADOS.BLOQUEO_DIAN) {
      // No cuenta contra su cupo de reintentos — no fue su culpa. Vuelve al
      // frente de la cola para intentarse primero en cuanto se reanude.
      doc.estado = ESTADOS.PENDIENTE;
      doc.intentos = Math.max(0, doc.intentos - 1);
      this._cola.unshift(cufe);
      await this._pausarPorValidacion(r, worker);
    } else if (r.estado === ESTADOS.ERROR_DEFINITIVO || doc.intentos >= INTENTOS_MAX) {
      doc.estado = ESTADOS.ERROR_DEFINITIVO;
    } else {
      doc.estado = ESTADOS.PENDIENTE;
      this._cola.push(cufe);
    }

    this._emitir('progreso', { cufe, ...doc, ...this._resumen() });
    await this._guardar();
  }

  async _pausarPorValidacion(r, worker) {
    if (this.pausadoPorValidacion) return;
    this.pausadoPorValidacion = true;
    this.ultimoBloqueo = { detalle: r.detalle, muestra: r.muestra, url: r.url, en: Date.now(), workerId: worker?.id };

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
    const total = this.cufes.length;
    const pendientes = Math.max(0, total - completados - errores);

    const ahora = Date.now();
    this._velocidadMuestras = this._velocidadMuestras.filter((t) => ahora - t <= 60_000);
    const velocidadPorMin = this._velocidadMuestras.length;

    const transcurridoSeg = this.iniciadoEn ? (ahora - this.iniciadoEn) / 1000 : 0;
    const promedioSeg = completados > 0 ? transcurridoSeg / completados : null;
    const etaSeg = velocidadPorMin > 0 && pendientes > 0 ? (pendientes / velocidadPorMin) * 60 : null;

    return {
      total, completados, pendientes, errores,
      velocidadPorMin, promedioSeg, etaSeg,
      corriendo: this.corriendo,
      pausadoPorValidacion: this.pausadoPorValidacion,
      ultimoBloqueo: this.ultimoBloqueo,
      numWorkers: this.numWorkers,
      reanudable: !this.corriendo && total > 0 && (completados + errores) < total,
    };
  }
}
