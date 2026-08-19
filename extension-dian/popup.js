import { cufesDeTexto } from './dian.js';

const CLAVE_ESTADO = 'lote_actual'; // debe coincidir con background.js

const $ = (id) => document.getElementById(id);
const urlDianEl = $('urlDian');
const cufesEl = $('cufes');
const carpetaEl = $('carpeta');
const btnProbar = $('btnProbar');
const btnIniciar = $('btnIniciar');
const btnDetener = $('btnDetener');
const btnBorrar = $('btnBorrar');
const btnAbrirCarpeta = $('btnAbrirCarpeta');
const estadoEnlaceEl = $('estadoEnlace');
const detalleEl = $('detalle');
const conteoCufesEl = $('conteoCufes');
const barraEl = $('barraRelleno');
const resumenEl = $('resumen');
const registroEl = $('registro');
const reanudarEl = $('reanudar');
const enCursoEl = $('enCurso');

let corriendo = false;

function pintarConteo() {
  const n = cufesDeTexto(cufesEl.value).length;
  conteoCufesEl.textContent = n > 0 ? `${n} CUFEs válidos` : '';
}

// El popup de una extensión se recrea de cero cada vez que se abre — sin
// esto, cerrar la ventana para hacer otra cosa borraba el enlace, la lista
// de CUFEs y el registro, y parecía que no había pasado nada.
const guardarCampo = (clave, valor) => chrome.storage.local.set({ [clave]: valor });
urlDianEl.addEventListener('input', () => guardarCampo('campo_urlDian', urlDianEl.value));
carpetaEl.addEventListener('input', () => guardarCampo('config_carpeta', carpetaEl.value));
cufesEl.addEventListener('input', () => {
  pintarConteo();
  guardarCampo('campo_cufes', cufesEl.value);
});

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
  registroEl.innerHTML = '';
  reanudarEl.style.display = 'none';
  const r = await chrome.runtime.sendMessage({ tipo: 'iniciar', urlDian, cufes, carpeta });
  if (!r.ok) {
    estadoEnlaceEl.textContent = r.error ?? 'No se pudo iniciar.';
    estadoEnlaceEl.className = 'error';
    return;
  }
  ponerCorriendo(true);
  actualizarBarra(0, r.total);
});

btnDetener.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ tipo: 'detener' });
});

btnAbrirCarpeta.addEventListener('click', () => {
  chrome.runtime.sendMessage({ tipo: 'abrirCarpeta' });
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
  enCursoEl.style.display = 'none';
  ponerCorriendo(false);
  actualizarBarra(0, 0);
});

function ponerCorriendo(v) {
  corriendo = v;
  btnIniciar.disabled = v;
  btnDetener.style.display = v ? 'inline-block' : 'none';
}

function actualizarBarra(hechos, total) {
  const pct = total > 0 ? Math.round((hechos / total) * 100) : 0;
  barraEl.style.width = `${pct}%`;
  resumenEl.textContent = total > 0 ? `${hechos} de ${total}` : '';
}

/**
 * Una fila del registro. Cuando falla, trae plegada la URL exacta que se
 * intentó y lo que respondió la DIAN — sin esto, un 404 no dice si la ruta
 * del endpoint está mal o si es ese documento puntual el que falla.
 */
function filaRegistro(r) {
  const fila = document.createElement('div');
  fila.className = r.ok ? '' : 'err';
  fila.textContent = `${r.cufe.slice(0, 20)}… ${r.ok ? 'ok' : `— ${r.detalle ?? 'error'}`}`;

  if (!r.ok && (r.url || r.muestra)) {
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
    enCursoEl.textContent = `Buscando ${msg.cufe.slice(0, 20)}…${sufijo}`;
  }
  if (msg.tipo === 'progreso') {
    enCursoEl.style.display = 'none';
    actualizarBarra(msg.hechos, msg.total);
    registroEl.prepend(filaRegistro(msg));
  }
  if (msg.tipo === 'terminado') {
    ponerCorriendo(false);
    enCursoEl.style.display = 'none';
    resumenEl.textContent = msg.fatal
      ? `No se pudo iniciar: ${msg.fatal}`
      : `Listo — ${msg.ok} ok${msg.errores > 0 ? `, ${msg.errores} con problema` : ''}`;
  }
});

// Al abrir el popup: restaura lo que se pegó la última vez (el enlace, los
// CUFEs, la carpeta) y el registro de lo ya intentado, en vez de mostrar un
// formulario vacío que hace parecer que no pasó nada.
(async () => {
  const datos = await chrome.storage.local.get(['campo_urlDian', 'campo_cufes', 'config_carpeta', CLAVE_ESTADO]);
  if (datos.campo_urlDian) urlDianEl.value = datos.campo_urlDian;
  if (datos.campo_cufes) cufesEl.value = datos.campo_cufes;
  carpetaEl.value = datos.config_carpeta || 'DIAN';
  pintarConteo();

  const lote = datos[CLAVE_ESTADO];
  if (lote?.resultados) {
    registroEl.innerHTML = '';
    Object.entries(lote.resultados)
      .reverse() // más reciente arriba, igual que el prepend() en vivo
      .forEach(([cufe, r]) => registroEl.appendChild(filaRegistro({ cufe, ...r })));
  }

  const r = await chrome.runtime.sendMessage({ tipo: 'estado' });
  if (r.corriendo) {
    ponerCorriendo(true);
    actualizarBarra(r.hechos, r.total);
  } else if (r.reanudable && r.hechos < r.total) {
    actualizarBarra(r.hechos, r.total);
    reanudarEl.style.display = 'block';
    reanudarEl.textContent = `Quedó una descarga a medias: ${r.hechos} de ${r.total}. Si el enlace venció, pide uno nuevo (los CUFEs ya están pegados arriba) y dale a Iniciar — sigue donde se quedó, no repite lo ya bajado.`;
  } else if (r.hechos > 0 && r.hechos === r.total) {
    actualizarBarra(r.hechos, r.total);
  }
})();
