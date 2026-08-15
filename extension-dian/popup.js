import { cufesDeTexto, ENDPOINT_POR_DEFECTO } from './dian.js';

const $ = (id) => document.getElementById(id);
const urlDianEl = $('urlDian');
const endpointEl = $('endpoint');
const cufesEl = $('cufes');
const btnProbar = $('btnProbar');
const btnIniciar = $('btnIniciar');
const btnDetener = $('btnDetener');
const estadoEnlaceEl = $('estadoEnlace');
const detalleEl = $('detalle');
const conteoCufesEl = $('conteoCufes');
const barraEl = $('barraRelleno');
const resumenEl = $('resumen');
const registroEl = $('registro');
const reanudarEl = $('reanudar');

let corriendo = false;
endpointEl.value = ENDPOINT_POR_DEFECTO;

function pintarConteo() {
  const n = cufesDeTexto(cufesEl.value).length;
  conteoCufesEl.textContent = n > 0 ? `${n} CUFEs válidos` : '';
}
cufesEl.addEventListener('input', pintarConteo);

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

  registroEl.innerHTML = '';
  reanudarEl.style.display = 'none';
  const r = await chrome.runtime.sendMessage({
    tipo: 'iniciar', urlDian, endpoint: endpointEl.value.trim() || ENDPOINT_POR_DEFECTO, cufes,
  });
  ponerCorriendo(true);
  actualizarBarra(0, r.total);
});

btnDetener.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ tipo: 'detener' });
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
  if (msg.tipo === 'progreso') {
    actualizarBarra(msg.hechos, msg.total);
    registroEl.prepend(filaRegistro(msg));
  }
  if (msg.tipo === 'terminado') {
    ponerCorriendo(false);
    resumenEl.textContent = `Listo — ${msg.ok} ok${msg.errores > 0 ? `, ${msg.errores} con problema` : ''}`;
  }
});

// Al abrir el popup: si había un lote corriendo o a medias (el service
// worker sigue vivo, o quedó guardado en disco), se refleja en pantalla en
// vez de mostrar un formulario vacío que hace parecer que no pasó nada.
(async () => {
  const r = await chrome.runtime.sendMessage({ tipo: 'estado' });
  if (r.corriendo) {
    ponerCorriendo(true);
    actualizarBarra(r.hechos, r.total);
  } else if (r.reanudable && r.hechos < r.total) {
    reanudarEl.style.display = 'block';
    reanudarEl.textContent = `Quedó una descarga a medias: ${r.hechos} de ${r.total}. Pega un enlace nuevo de la DIAN y la misma lista de CUFEs, y dale a Iniciar — sigue donde se quedó.`;
  }
})();
