import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { renderAsync } from 'docx-preview';
import {
  GripVertical, User, IdCard, CalendarDays, Mail, MapPin, Phone, Type, DollarSign, Loader, Check, Hand,
} from 'lucide-react';
import type { DetectedField, DetectedFieldType } from '../../../lib/docxTemplateEngine';
import { parrafosParaMarcar, type PosicionEnDocumento, type RangoEnDocumento } from '../../../lib/docxPlaceholders';
import { useVoiceSpeak } from '../../hooks/useVoiceGuide';

/**
 * Editor de campos a pantalla completa, al estilo de Dropbox Sign: a la
 * derecha el documento REAL —dibujado desde el propio Word con docx-preview,
 * con sus fuentes, negritas, márgenes y páginas— y a la izquierda los campos
 * para arrastrar encima. La otra forma de armar la plantilla (que la app los
 * encuentre sola y marcar el texto) sigue en MarcarCamposPanel.
 *
 * Cada párrafo dibujado se empareja con su párrafo del Word (mismo orden y
 * mismo texto que parrafosParaMarcar), y el punto donde se suelta un campo se
 * traduce a (párrafo, carácter) con caretRangeFromPoint: el campo cae en la
 * letra exacta bajo el puntero, no en la palabra más cercana.
 *
 * Con mouse se arrastra. En el celular, donde arrastrar no funciona, se toca
 * el campo y luego se toca el lugar del documento donde va.
 */

type EnMano =
  | { tipo: 'nuevo'; etiqueta: string; tipoCampo: DetectedFieldType }
  | { tipo: 'existente'; clave: string }
  | { tipo: 'mover'; rango: RangoEnDocumento };

const PALETA: Array<{ es: string; en: string; tipo: DetectedFieldType; icono: typeof User }> = [
  { es: 'Nombre completo', en: 'Full name', tipo: 'text', icono: User },
  { es: 'Cédula', en: 'ID number', tipo: 'text', icono: IdCard },
  { es: 'Fecha', en: 'Date', tipo: 'date', icono: CalendarDays },
  { es: 'Correo', en: 'Email', tipo: 'text', icono: Mail },
  { es: 'Dirección', en: 'Address', tipo: 'text', icono: MapPin },
  { es: 'Teléfono', en: 'Phone', tipo: 'text', icono: Phone },
  { es: 'Valor', en: 'Amount', tipo: 'number', icono: DollarSign },
  { es: 'Otro dato', en: 'Other', tipo: 'text', icono: Type },
];

const TAG_RE = /\{\{\s*([^}:]+?)\s*(?::[^}]*)?\}\}/g;
const CHIP = 'cd-campo';

/** Nodos de texto de un párrafo dibujado, en orden. */
function nodosDeTexto(p: HTMLElement): Text[] {
  const out: Text[] = [];
  const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) out.push(n as Text);
  return out;
}

/** Caracteres antes de (nodo, offset) dentro del párrafo. Un campo ya puesto
 *  cuenta lo que mide su {{etiqueta}} en el Word, no lo que muestra. */
function offsetEnParrafo(p: HTMLElement, nodo: Node, offset: number): number {
  let total = 0;
  for (const t of nodosDeTexto(p)) {
    const chip = t.parentElement?.closest<HTMLElement>(`.${CHIP}`);
    if (chip) {
      if (chip.dataset.contado !== '1') { total += Number(chip.dataset.largo ?? 0); chip.dataset.contado = '1'; }
      continue;
    }
    if (t === nodo) { limpiarContados(p); return total + offset; }
    total += t.data.length;
  }
  limpiarContados(p);
  // El caret cayó en el propio párrafo (no en un texto): al final.
  return total;
}
function limpiarContados(p: HTMLElement) {
  p.querySelectorAll<HTMLElement>(`.${CHIP}`).forEach((c) => { delete c.dataset.contado; });
}

/** El borde de palabra más cercano a `offset` dentro de un texto. */
function bordeDePalabra(texto: string, offset: number): number {
  // Borde = junto a un espacio, o justo antes de un signo que cierra («.», «,»,
  // «:»…): soltar al final de «asignadas» debe quedar antes del punto.
  const esBorde = (i: number) => i <= 0 || i >= texto.length || /\s/.test(texto[i - 1]) || /[\s.,;:!?)»”"']/.test(texto[i]);
  if (esBorde(offset)) return offset;
  let izq = offset; while (!esBorde(izq)) izq--;
  let der = offset; while (!esBorde(der)) der++;
  return offset - izq <= der - offset ? izq : der;
}

function caretEnPunto(x: number, y: number): { nodo: Node; offset: number } | null {
  const d = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  if (typeof d.caretRangeFromPoint === 'function') {
    const r = d.caretRangeFromPoint(x, y);
    return r ? { nodo: r.startContainer, offset: r.startOffset } : null;
  }
  const pos = d.caretPositionFromPoint?.(x, y);
  return pos ? { nodo: pos.offsetNode, offset: pos.offset } : null;
}

export function ColocarCamposPanel({
  buffer, campos, language, parrafoAdmiteCampo, onInsertar, onMover, onQuitar, onCerrar,
}: {
  buffer: ArrayBuffer;
  campos: DetectedField[];
  language: 'en' | 'es';
  parrafoAdmiteCampo: (parrafo: number) => boolean;
  onInsertar: (en: PosicionEnDocumento, campo: { claveExistente?: string; etiqueta?: string; tipo?: DetectedFieldType }) => void;
  onMover: (desde: RangoEnDocumento, hasta: PosicionEnDocumento) => void;
  onQuitar: (rango: RangoEnDocumento) => void;
  onCerrar: () => void;
}) {
  const es = language === 'es';
  const lienzo = useRef<HTMLDivElement>(null);
  const hoja = useRef<HTMLDivElement>(null);
  const [cargando, setCargando] = useState(true);
  const [falloVista, setFalloVista] = useState(false);
  const [enMano, setEnMano] = useState<EnMano | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; h: number } | null>(null);
  const enManoRef = useRef<EnMano | null>(null);
  enManoRef.current = enMano;
  const etiquetaDe = useMemo(() => new Map(campos.map((c) => [c.key, c.label])), [campos]);
  const etiquetaRef = useRef(etiquetaDe);
  etiquetaRef.current = etiquetaDe;
  const datos = campos.filter((c) => c.type !== 'section');
  const { speak } = useVoiceSpeak();

  useEffect(() => {
    speak({
      es: 'Este es tu documento tal como se ve. A la izquierda están los campos: arrástralos hasta el lugar exacto del texto donde va cada dato. En el celular, toca el campo y luego toca el lugar. Para mover uno, arrástralo; para quitarlo, toca la equis. Cuando termines, toca Listo.',
      en: 'This is your document as it looks. The fields are on the left: drag each one to the exact spot in the text where that detail goes. On a phone, tap the field and then tap the spot. To move one, drag it; to remove it, tap the x. When you are done, tap Done.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al tomar un campo (sobre todo con toques, donde no se ve el arrastre),
  // se dice qué hacer a continuación.
  const tipoEnMano = enMano?.tipo ?? null;
  useEffect(() => {
    if (!tipoEnMano) return;
    speak(tipoEnMano === 'mover'
      ? { es: 'Ahora toca el nuevo lugar del texto donde va este campo.', en: 'Now tap the new spot in the text where this field goes.' }
      : { es: 'Ahora toca o suelta el campo en el lugar del texto donde va.', en: 'Now tap or drop the field on the spot in the text where it goes.' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoEnMano]);

  // Las acciones más recientes, para los oyentes puestos a mano en el DOM
  // que dibuja docx-preview (fuera de React).
  const acciones = useRef({ onInsertar, onMover, onQuitar, parrafoAdmiteCampo });
  acciones.current = { onInsertar, onMover, onQuitar, parrafoAdmiteCampo };

  function crearChip(clave: string, parrafo: number, start: number, end: number): HTMLElement {
    const rango: RangoEnDocumento = { parrafo, start, end };
    const chip = document.createElement('span');
    chip.className = CHIP;
    chip.contentEditable = 'false';
    chip.draggable = true;
    chip.dataset.clave = clave;
    chip.dataset.largo = String(end - start);
    chip.title = es ? 'Arrástralo para moverlo' : 'Drag it to move it';
    const nombre = document.createElement('span');
    nombre.dataset.nombre = '';
    nombre.textContent = etiquetaRef.current.get(clave) ?? clave;
    const quitar = document.createElement('button');
    quitar.type = 'button';
    quitar.textContent = '×';
    quitar.title = es ? 'Quitar de aquí' : 'Remove from here';
    quitar.addEventListener('click', (e) => { e.stopPropagation(); acciones.current.onQuitar(rango); });
    chip.append(nombre, quitar);
    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', 'campo');
      setEnMano({ tipo: 'mover', rango });
    });
    chip.addEventListener('dragend', () => { setEnMano(null); setCursor(null); });
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      setEnMano((prev) => (prev?.tipo === 'mover' && prev.rango.parrafo === parrafo && prev.rango.start === start ? null : { tipo: 'mover', rango }));
    });
    return chip;
  }

  function envolverCampos(p: HTMLElement, parrafo: number) {
    const completo = nodosDeTexto(p).map((t) => t.data).join('');
    const tags = [...completo.matchAll(TAG_RE)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, clave: m[1] }));
    // De atrás hacia adelante: las posiciones de los anteriores no se mueven.
    for (const tag of tags.reverse()) {
      const ubicar = (pos: number, esFin: boolean) => {
        let acum = 0;
        for (const t of nodosDeTexto(p)) {
          if (t.parentElement?.closest(`.${CHIP}`)) continue;
          const len = t.data.length;
          if (esFin ? pos <= acum + len : pos < acum + len) return { nodo: t, off: pos - acum };
          acum += len;
        }
        return null;
      };
      const a = ubicar(tag.start, false);
      const b = ubicar(tag.end, true);
      if (!a || !b) continue;
      const rango = document.createRange();
      rango.setStart(a.nodo, a.off);
      rango.setEnd(b.nodo, b.off);
      rango.deleteContents();
      rango.insertNode(crearChip(tag.clave, parrafo, tag.start, tag.end));
    }
  }

  // Dibuja el Word y convierte cada {{campo}} en una etiqueta movible.
  useEffect(() => {
    const destino = hoja.current;
    if (!destino) return;
    let vivo = true;
    const scroll = lienzo.current?.scrollTop ?? 0;
    setFalloVista(false);
    renderAsync(buffer, destino, undefined, {
      className: 'docx',
      inWrapper: true,
      breakPages: true,
      ignoreLastRenderedPageBreak: true,
      renderHeaders: true,
      renderFooters: true,
      useBase64URL: true,
    })
      .then(() => {
        if (!vivo) return;
        const parrafos = parrafosParaMarcar(buffer);
        // Sólo el cuerpo: los encabezados y pies no están en parrafosParaMarcar.
        let i = 0;
        for (const p of destino.querySelectorAll<HTMLElement>('article p')) {
          const texto = nodosDeTexto(p).map((t) => t.data).join('');
          if (!texto) continue;
          // Emparejar por texto, con margen por si docx-preview omite o agrega
          // algún párrafo vacío.
          let j = i;
          while (j < parrafos.length && j < i + 8 && parrafos[j] !== texto) j++;
          if (parrafos[j] !== texto) continue;
          p.dataset.parrafo = String(j);
          i = j + 1;
          envolverCampos(p, j);
        }
        if (lienzo.current) lienzo.current.scrollTop = scroll;
        setCargando(false);
      })
      .catch(() => { if (vivo) { setFalloVista(true); setCargando(false); } });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buffer]);

  // Renombrar un campo en la lista no cambia el Word: sólo su etiqueta.
  useEffect(() => {
    hoja.current?.querySelectorAll<HTMLElement>(`.${CHIP}`).forEach((chip) => {
      const nombre = chip.querySelector<HTMLElement>('[data-nombre]');
      if (nombre) nombre.textContent = etiquetaDe.get(chip.dataset.clave ?? '') ?? chip.dataset.clave ?? '';
    });
  }, [etiquetaDe]);

  /** Dónde caería un campo soltado en (x, y), o null si ahí no se puede. */
  const posicionEn = (x: number, y: number): (PosicionEnDocumento & { rect: DOMRect }) | null => {
    const c = caretEnPunto(x, y);
    if (!c) return null;
    const el = c.nodo.nodeType === Node.TEXT_NODE ? c.nodo.parentElement : (c.nodo as HTMLElement);
    if (!el || el.closest(`.${CHIP}`)) return null;
    const p = el.closest<HTMLElement>('p[data-parrafo]');
    if (!p) return null;
    const parrafo = Number(p.dataset.parrafo);
    if (!acciones.current.parrafoAdmiteCampo(parrafo)) return null;
    // Al borde de palabra más cercano: soltar en medio de «identificado» no
    // debe partirla en «identifica [Cédula] do».
    if (c.nodo.nodeType === Node.TEXT_NODE) c.offset = bordeDePalabra((c.nodo as Text).data, c.offset);
    const r = document.createRange();
    r.setStart(c.nodo, c.offset);
    r.collapse(true);
    return { parrafo, offset: offsetEnParrafo(p, c.nodo, c.offset), rect: r.getBoundingClientRect() };
  };

  const soltarEn = (x: number, y: number) => {
    const item = enManoRef.current;
    const pos = posicionEn(x, y);
    setEnMano(null);
    setCursor(null);
    if (!item || !pos) return;
    const en = { parrafo: pos.parrafo, offset: pos.offset };
    speak(item.tipo === 'mover'
      ? { es: 'Listo, movimos el campo.', en: 'Done, the field was moved.' }
      : { es: 'Listo, el campo quedó en tu documento.', en: 'Done, the field is now in your document.' });
    if (item.tipo === 'mover') acciones.current.onMover(item.rango, en);
    else if (item.tipo === 'existente') acciones.current.onInsertar(en, { claveExistente: item.clave });
    else acciones.current.onInsertar(en, { etiqueta: item.etiqueta, tipo: item.tipoCampo });
  };

  const mostrarCursor = (x: number, y: number) => {
    const pos = posicionEn(x, y);
    const base = lienzo.current?.getBoundingClientRect();
    if (!pos || !base || !pos.rect.height) { setCursor(null); return; }
    setCursor({
      x: pos.rect.left - base.left + (lienzo.current?.scrollLeft ?? 0),
      y: pos.rect.top - base.top + (lienzo.current?.scrollTop ?? 0),
      h: pos.rect.height,
    });
  };

  const empezarArrastre = (item: EnMano) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'campo');
    setEnMano(item);
  };

  const chipPaleta = (key: string, contenido: ReactElement, item: EnMano, activo: boolean) => (
    <button
      key={key}
      type="button"
      draggable
      onDragStart={empezarArrastre(item)}
      onDragEnd={() => { setEnMano(null); setCursor(null); }}
      onClick={() => setEnMano(activo ? null : item)}
      className={`flex shrink-0 cursor-grab items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition active:cursor-grabbing md:w-full ${activo ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
    >
      <GripVertical className="size-3.5 shrink-0 opacity-50" />
      {contenido}
    </button>
  );

  // Escape suelta lo que se tiene en la mano; con nada en la mano, cierra.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (enManoRef.current) setEnMano(null); else onCerrar();
    };
    window.addEventListener('keydown', tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', tecla); document.body.style.overflow = overflow; };
  }, [onCerrar]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      <style>{`
        .${CHIP}{display:inline-flex;align-items:center;gap:3px;margin:0 1px;padding:0 3px 0 7px;border-radius:6px;
          background:#e0e7ff;border:1px solid #a5b4fc;color:#3730a3;font:700 11px/1.6 ui-sans-serif,system-ui,sans-serif!important;
          cursor:grab;vertical-align:baseline;white-space:nowrap;user-select:none;text-indent:0}
        .${CHIP}:hover{border-color:#6366f1;background:#c7d2fe}
        .${CHIP} span{font:inherit!important;color:inherit!important}
        .${CHIP} button{border:0;background:transparent;color:inherit;font:700 14px/1 sans-serif;padding:0 3px;border-radius:4px;cursor:pointer}
        .${CHIP} button:hover{background:#a5b4fc}
        .cd-hoja .docx-wrapper{background:transparent!important;padding:24px 12px!important}
        .cd-hoja .docx-wrapper>section.docx{box-shadow:0 2px 12px rgba(15,23,42,.18)!important;margin-bottom:24px!important}
        .cd-hoja.cd-apuntando p[data-parrafo]{cursor:text}
      `}</style>

      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
          <Hand className="size-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900">{es ? 'Coloca los campos en tu documento' : 'Place the fields on your document'}</p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {es
              ? 'Arrastra un campo hasta el punto exacto del texto, o mueve uno que ya está. En el celular: toca el campo y luego toca el lugar.'
              : 'Drag a field to the exact spot in the text, or move one that is already there. On a phone: tap the field, then tap the spot.'}
          </p>
        </div>
        <button type="button" onClick={onCerrar} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500">
          <Check className="size-4" /> {es ? 'Listo' : 'Done'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-200 bg-slate-50 p-3 md:w-64 md:flex-col md:gap-4 md:overflow-y-auto md:overflow-x-visible md:border-b-0 md:border-r md:p-4">
          <div className="flex gap-1.5 md:flex-col">
            <p className="hidden text-[11px] font-black uppercase tracking-wide text-slate-400 md:mb-1 md:block">{es ? 'Campo nuevo' : 'New field'}</p>
            {PALETA.map((c) => {
              const etiqueta = es ? c.es : c.en;
              const Icono = c.icono;
              return chipPaleta(`n-${c.es}`, <><Icono className="size-3.5 shrink-0" />{etiqueta}</>, { tipo: 'nuevo', etiqueta, tipoCampo: c.tipo }, enMano?.tipo === 'nuevo' && enMano.etiqueta === etiqueta);
            })}
          </div>
          {datos.length > 0 && (
            <div className="flex gap-1.5 md:flex-col">
              <p className="hidden text-[11px] font-black uppercase tracking-wide text-slate-400 md:mb-1 md:block">{es ? 'Repetir un dato que ya existe' : 'Reuse an existing detail'}</p>
              {datos.map((c) => chipPaleta(
                `e-${c.key}`,
                <span className="max-w-[160px] truncate">{c.label}</span>,
                { tipo: 'existente', clave: c.key },
                enMano?.tipo === 'existente' && enMano.clave === c.key,
              ))}
            </div>
          )}
        </aside>

        <div
          ref={lienzo}
          className="relative min-h-0 flex-1 overflow-auto bg-slate-200/70"
          onDragOver={(e) => { e.preventDefault(); mostrarCursor(e.clientX, e.clientY); }}
          onDragLeave={(e) => { if (e.currentTarget === e.target) setCursor(null); }}
          onDrop={(e) => { e.preventDefault(); soltarEn(e.clientX, e.clientY); }}
          onMouseMove={(e) => { if (enMano) mostrarCursor(e.clientX, e.clientY); }}
          onClick={(e) => { if (enMano) soltarEn(e.clientX, e.clientY); }}
        >
          {/* Altura 0: el aviso flota sobre la hoja sin empujarla. Si la
              empujara, el texto saltaría justo cuando la persona va a tocar
              el lugar donde quiere el campo. */}
          <div className="pointer-events-none sticky top-3 z-20 flex h-0 justify-center">
            {enMano && (
              <p className="pointer-events-auto mt-0 h-fit max-w-[90%] rounded-xl bg-indigo-600 px-4 py-2 text-center text-xs font-bold text-white shadow-lg">
                {es ? 'Suelta (o toca) el lugar del texto donde va el campo' : 'Drop on (or tap) the spot in the text where the field goes'}
                <button type="button" onClick={(e) => { e.stopPropagation(); setEnMano(null); }} className="ml-2 underline">{es ? 'Cancelar' : 'Cancel'}</button>
              </p>
            )}
          </div>
          {cursor && (
            <span
              className="pointer-events-none absolute z-10 w-0.5 animate-pulse rounded bg-indigo-600"
              style={{ left: cursor.x - 1, top: cursor.y, height: cursor.h }}
            />
          )}
          {cargando && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Loader className="size-6 animate-spin text-slate-500" />
            </div>
          )}
          {falloVista && (
            <p className="m-6 rounded-xl bg-white p-4 text-center text-sm text-slate-600">
              {es ? 'No pudimos dibujar este Word. Usa «Seleccionar el texto» para marcar los campos.' : "We couldn't draw this Word file. Use \"Select the text\" to mark the fields."}
            </p>
          )}
          <div ref={hoja} className={`cd-hoja ${enMano ? 'cd-apuntando' : ''}`} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
