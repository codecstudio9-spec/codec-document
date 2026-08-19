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
const resumenEl = $('resumen');
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

function actualizarMetricas(m) {
  const completados = m.completados ?? 0;
  const errores = m.errores ?? 0;
  const total = m.total ?? 0;
  const hechos = completados + errores;
  const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;
  barraEl.style.width = `${pct}%`;
  resumenEl.textContent = total > 0
    ? `${hechos} de ${total} (${completados} ok${errores > 0 ? `, ${errores} con error` : ''})`
    : '';

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
}

/**
 * Una fila del registro. Cuando falla, trae plegada la URL exacta y lo que
 * respondió la DIAN — sin esto no se sabe si es captcha/bloqueo/sesión
 * vencida o algo distinto.
 */
function filaRegistro(r) {
  const ok = r.estado === 'COMPLETADO';
  const fila = document.createElement('div');
  fila.className = ok ? '' : 'err';
  const dur = r.duracionMs != null ? ` (${(r.duracionMs / 1000).toFixed(1)}s)` : '';
  const worker = r.workerId != null ? ` [w${r.workerId}]` : '';
  fila.textContent = `${r.cufe.slice(0, 20)}…${worker} ${ok ? 'ok' : `— ${r.detalle ?? r.estado}`}${dur}`;

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
      resumenEl.textContent = `No se pudo iniciar: ${msg.fatal}`;
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
