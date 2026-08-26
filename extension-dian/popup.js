import { cufesDeTexto } from './dian.js';

const $ = (id) => document.getElementById(id);
const urlDianEl = $('urlDian');
const cufesEl = $('cufes');
const carpetaEl = $('carpeta');
const workersEl = $('workers');
const btnProbar = $('btnProbar');
const btnIniciar = $('btnIniciar');
const btnDetener = $('btnDetener');
const btnBorrar = $('btnBorrar');
const btnAbrirCarpeta = $('btnAbrirCarpeta');
const btnExportar = $('btnExportar');
const btnContinuarValidacion = $('btnContinuarValidacion');
const estadoEnlaceEl = $('estadoEnlace');
const detalleEl = $('detalle');
const conteoCufesEl = $('conteoCufes');
const barraEl = $('barraRelleno');
const resumenTextoEl = $('resumenTexto');
const resumenBadgesEl = $('resumenBadges');
const registroEl = $('registro');
const reanudarEl = $('reanudar');
const enCursoEl = $('enCurso');
const bloqueoEl = $('bloqueo');
const bloqueoTextoEl = $('bloqueoTexto');
const metricasEl = $('metricas');
const mVelocidadEl = $('mVelocidad');
const mPromedioEl = $('mPromedio');
const mEtaEl = $('mEta');

let corriendo = false;

function pintarConteo() {
  const n = cufesDeTexto(cufesEl.value).length;
  conteoCufesEl.textContent = n > 0 ? `${n} CUFEs válidos` : '';
}

// El popup se recrea de cero cada vez que se abre — sin esto, cerrar la
// ventana para hacer otra cosa borraba el enlace, los CUFEs y la carpeta.
const guardarCampo = (clave, valor) => chrome.storage.local.set({ [clave]: valor });
urlDianEl.addEventListener('input', () => guardarCampo('campo_urlDian', urlDianEl.value));
carpetaEl.addEventListener('input', () => guardarCampo('config_carpeta', carpetaEl.value));
workersEl.addEventListener('input', () => guardarCampo('config_workers', workersEl.value));
cufesEl.addEventListener('input', () => { pintarConteo(); guardarCampo('campo_cufes', cufesEl.value); });

btnProbar.addEventListener('click', async () => {
  const urlDian = urlDianEl.value.trim();
  if (!urlDian) { estadoEnlaceEl.textContent = 'Pega primero el enlace del correo'; estadoEnlaceEl.className = 'error'; return; }

  btnProbar.disabled = true;
  estadoEnlaceEl.textContent = 'Probando…';
  estadoEnlaceEl.className = '';
  detalleEl.style.display = 'none';

  const r = await chrome.runtime.sendMessage({ tipo: 'probar', urlDian });

  btnProbar.disabled = false;
  if (r.ok) {
    estadoEnlaceEl.textContent = 'El enlace funciona: la DIAN abrió sesión.';
    estadoEnlaceEl.className = 'ok';
  } else {
    estadoEnlaceEl.textContent = r.error ?? 'No se pudo probar el enlace.';
    estadoEnlaceEl.className = 'error';
  }
  if (r.urlFinal !== undefined) {
    detalleEl.style.display = 'block';
    detalleEl.textContent = [
      `Terminó en: ${r.urlFinal || '(?)'}`,
      `Sesión: ${r.sesionViva ? 'viva' : 'no la emitió'}`,
    ].join('\n');
  }
});

btnIniciar.addEventListener('click', async () => {
  const urlDian = urlDianEl.value.trim();
  const cufes = cufesDeTexto(cufesEl.value);
  if (!urlDian) { estadoEnlaceEl.textContent = 'Falta el enlace de la DIAN'; estadoEnlaceEl.className = 'error'; return; }
  if (cufes.length === 0) { conteoCufesEl.textContent = 'No encontré CUFEs válidos'; return; }
  if (btnIniciar.disabled) return; // ya se mandó un clic, no duplicar el mensaje 'iniciar'

  btnIniciar.disabled = true; // antes de esperar la respuesta — un doble clic rápido llegó a mandar dos 'iniciar' y corrompió el estado del gestor (2026-08-19)

  const carpeta = carpetaEl.value.trim() || 'DIAN';
  const numWorkers = Math.min(Math.max(1, parseInt(workersEl.value, 10) || 1), 5);
  workersEl.value = numWorkers;

  registroEl.innerHTML = '';
  reanudarEl.style.display = 'none';
  bloqueoEl.style.display = 'none';
  const r = await chrome.runtime.sendMessage({ tipo: 'iniciar', urlDian, cufes, carpeta, numWorkers });
  if (!r.ok) {
    estadoEnlaceEl.textContent = r.error ?? 'No se pudo iniciar.';
    estadoEnlaceEl.className = 'error';
    btnIniciar.disabled = false;
    return;
  }
  ponerCorriendo(true);
});

btnDetener.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ tipo: 'detener' });
});

btnContinuarValidacion.addEventListener('click', async () => {
  bloqueoEl.style.display = 'none';
  await chrome.runtime.sendMessage({ tipo: 'reanudarValidacion' });
});

btnAbrirCarpeta.addEventListener('click', () => {
  chrome.runtime.sendMessage({ tipo: 'abrirCarpeta' });
});

btnExportar.addEventListener('click', async () => {
  const { csv } = await chrome.runtime.sendMessage({ tipo: 'exportarLog' });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: `dian-log-${Date.now()}.csv`, saveAs: false });
});

btnBorrar.addEventListener('click', async () => {
  if (corriendo && !confirm('Hay una descarga en curso. ¿Detenerla y borrar todo (enlace, CUFEs y registro)?')) return;
  if (!corriendo && registroEl.children.length > 0 && !confirm('¿Borrar el enlace, los CUFEs y el registro?')) return;

  await chrome.runtime.sendMessage({ tipo: 'borrar' });

  urlDianEl.value = '';
  cufesEl.value = '';
  pintarConteo();
  registroEl.innerHTML = '';
  estadoEnlaceEl.textContent = '';
  estadoEnlaceEl.className = '';
  detalleEl.style.display = 'none';
  reanudarEl.style.display = 'none';
  bloqueoEl.style.display = 'none';
  enCursoEl.style.display = 'none';
  metricasEl.style.display = 'none';
  ponerCorriendo(false);
  actualizarMetricas({ total: 0, completados: 0, errores: 0 });
});

function ponerCorriendo(v) {
  corriendo = v;
  btnIniciar.disabled = v;
  btnDetener.style.display = v ? 'inline-block' : 'none';
}

function formatearDuracion(seg) {
  if (seg < 60) return `${Math.round(seg)} s`;
  const min = Math.floor(seg / 60);
  const rem = Math.round(seg % 60);
  return `${min} min ${rem}s`;
}

/** Una insignia redondeada de color ("12 ok", "3 reintentando"...) — de un
 *  vistazo se ve si algo se está acumulando, sin tener que leer una frase. */
function insignia(clase, texto) {
  const span = document.createElement('span');
  span.className = `insignia ${clase}`;
  span.textContent = texto;
  return span;
}

function actualizarMetricas(m) {
  const completados = m.completados ?? 0;
  const errores = m.errores ?? 0;
  const reintentando = m.reintentando ?? 0;
  const total = m.total ?? 0;
  const hechos = completados + errores;
  const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;
  barraEl.style.width = `${pct}%`;

  resumenTextoEl.textContent = total > 0 ? `${hechos} de ${total}` : '';
  resumenBadgesEl.innerHTML = '';
  if (total > 0) {
    resumenBadgesEl.appendChild(insignia('ok', `${completados} ok`));
    if (reintentando > 0) resumenBadgesEl.appendChild(insignia('reintentando', `${reintentando} reintentando`));
    if (errores > 0) resumenBadgesEl.appendChild(insignia('error', `${errores} con error`));
  }

  if (total > 0) {
    metricasEl.style.display = 'block';
    mVelocidadEl.textContent = `${m.velocidadPorMin ?? 0} doc/min`;
    mPromedioEl.textContent = m.promedioSeg != null ? `${m.promedioSeg.toFixed(1)} s/doc` : '—';
    mEtaEl.textContent = m.etaSeg != null ? formatearDuracion(m.etaSeg) : '—';
  } else {
    metricasEl.style.display = 'none';
  }

  if (m.pausadoPorValidacion) {
    bloqueoEl.style.display = 'block';
    bloqueoTextoEl.textContent = m.ultimoBloqueo?.detalle || 'La DIAN pidió una comprobación humana en la pestaña que se abrió.';
  }

  if (m.numWorkersEfectivo != null && m.numWorkers != null && m.numWorkersEfectivo < m.numWorkers) {
    resumenTextoEl.textContent += ` — bajé a ${m.numWorkersEfectivo} worker por una verificación humana previa`;
  }
}

// Un color por código de error (PARTE 3 del pedido: nunca un único "ERROR"
// genérico) — de un vistazo, sin leer la frase completa, se ve en qué paso
// de la tubería se rompió cada CUFE. Ver CODIGOS_ERROR en download-worker.js.
const ESTILO_CODIGO = {
  ERROR_PAGINA:    { bg: '#f1f5f9', color: '#475569' },
  ERROR_SEGURIDAD: { bg: '#fef3c7', color: '#92400e' },
  ERROR_BUSQUEDA:  { bg: '#fee2e2', color: '#991b1b' },
  ERROR_RESULTADO: { bg: '#e0e7ff', color: '#3730a3' },
  ERROR_DESCARGA:  { bg: '#ffedd5', color: '#9a3412' },
  ERROR_ARCHIVO:   { bg: '#fce7f3', color: '#9d174d' },
  ERROR_TIMEOUT:   { bg: '#e2e8f0', color: '#334155' },
  ERROR_BLOQUEO:   { bg: '#fecaca', color: '#7f1d1d' },
};

/**
 * Una fila del registro. Cuando falla, trae plegada la URL exacta y lo que
 * respondió la DIAN — sin esto no se sabe si es captcha/bloqueo/sesión
 * vencida o algo distinto.
 */
function filaRegistro(r) {
  const ok = r.estado === 'COMPLETADO';
  const fila = document.createElement('div');
  fila.className = ok ? 'entrada' : 'entrada err';
  const dur = r.duracionMs != null ? ` (${(r.duracionMs / 1000).toFixed(1)}s)` : '';
  const worker = r.workerId != null ? ` [w${r.workerId}]` : '';

  const linea = document.createElement('span');
  linea.textContent = `${r.cufe.slice(0, 20)}…${worker} ${ok ? 'ok' : '— '}`;
  fila.appendChild(linea);

  if (!ok && r.codigoError) {
    const estilo = ESTILO_CODIGO[r.codigoError];
    const chip = document.createElement('span');
    chip.className = 'chip-codigo';
    if (estilo) { chip.style.background = estilo.bg; chip.style.color = estilo.color; }
    chip.textContent = r.codigoError;
    fila.appendChild(chip);
  }

  const resto = document.createElement('span');
  resto.textContent = `${ok ? '' : (r.detalle ?? r.estado)}${dur}`;
  fila.appendChild(resto);

  if (!ok && (r.url || r.muestra)) {
    const detalles = document.createElement('details');
    detalles.style.marginTop = '2px';
    const resumen = document.createElement('summary');
    resumen.style.cursor = 'pointer';
    resumen.style.fontSize = '10px';
    resumen.style.color = '#94a3b8';
    resumen.textContent = 'Ver URL y respuesta';
    detalles.appendChild(resumen);

    const cuerpo = document.createElement('div');
    cuerpo.style.marginTop = '3px';
    cuerpo.style.padding = '6px';
    cuerpo.style.background = '#f8fafc';
    cuerpo.style.borderRadius = '6px';
    cuerpo.style.fontFamily = 'ui-monospace, monospace';
    cuerpo.style.fontSize = '9.5px';
    cuerpo.style.wordBreak = 'break-all';
    cuerpo.style.whiteSpace = 'pre-wrap';
    cuerpo.textContent = [r.url, r.muestra].filter(Boolean).join('\n\n');
    detalles.appendChild(cuerpo);

    fila.appendChild(detalles);
  }
  return fila;
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.tipo === 'intento') {
    enCursoEl.style.display = 'block';
    const sufijo = msg.intentosMax > 1 ? ` (intento ${msg.intento} de ${msg.intentosMax})` : '';
    enCursoEl.textContent = `[w${msg.workerId}] Buscando ${msg.cufe.slice(0, 20)}…${sufijo}`;
    actualizarMetricas(msg);
  }
  if (msg.tipo === 'progreso') {
    enCursoEl.style.display = 'none';
    registroEl.prepend(filaRegistro(msg));
    actualizarMetricas(msg);
  }
  if (msg.tipo === 'bloqueo') {
    bloqueoEl.style.display = 'block';
    bloqueoTextoEl.textContent = msg.detalle || 'La DIAN pidió una comprobación humana en la pestaña que se abrió.';
  }
  if (msg.tipo === 'terminado') {
    ponerCorriendo(false);
    enCursoEl.style.display = 'none';
    actualizarMetricas(msg);
    if (msg.fatal) {
      resumenTextoEl.textContent = `No se pudo iniciar: ${msg.fatal}`;
      resumenBadgesEl.innerHTML = '';
    }
  }
});

// Al abrir el popup: restaura lo que se pegó la última vez y el estado real
// del lote (corriendo, métricas, pausado por validación, registro) — nunca
// un formulario vacío que hace parecer que no pasó nada.
(async () => {
  const datos = await chrome.storage.local.get(['campo_urlDian', 'campo_cufes', 'config_carpeta', 'config_workers']);
  if (datos.campo_urlDian) urlDianEl.value = datos.campo_urlDian;
  if (datos.campo_cufes) cufesEl.value = datos.campo_cufes;
  carpetaEl.value = datos.config_carpeta || 'DIAN';
  workersEl.value = datos.config_workers || '1';
  pintarConteo();

  const { filas } = await chrome.runtime.sendMessage({ tipo: 'registro' });
  registroEl.innerHTML = '';
  filas
    .filter((r) => r.estado === 'COMPLETADO' || r.estado === 'ERROR_DEFINITIVO')
    .forEach((r) => registroEl.appendChild(filaRegistro(r)));

  const m = await chrome.runtime.sendMessage({ tipo: 'estado' });
  actualizarMetricas(m);
  if (m.corriendo) {
    ponerCorriendo(true);
  } else if (m.reanudable) {
    reanudarEl.style.display = 'block';
    reanudarEl.textContent = `Quedó una descarga a medias: ${m.completados} de ${m.total} lograron bajarse. Si el enlace venció, pide uno nuevo (los CUFEs ya están pegados arriba) y dale a Iniciar — sigue donde se quedó, no repite lo ya bajado.`;
  }
})();
