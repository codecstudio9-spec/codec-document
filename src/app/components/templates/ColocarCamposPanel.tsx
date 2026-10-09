import { useMemo, useState, type DragEvent, type MouseEvent as ReactMouseEvent, type ReactElement } from 'react';
import { GripVertical, Hand, X, User, IdCard, CalendarDays, Mail, MapPin, Phone, Type, DollarSign } from 'lucide-react';
import type { DetectedField, DetectedFieldType } from '../../../lib/docxTemplateEngine';
import type { PosicionEnDocumento, RangoEnDocumento } from '../../../lib/docxPlaceholders';

/**
 * La segunda forma de armar una plantilla, al estilo de Dropbox Sign: se ve
 * el documento y se arrastran los campos al punto exacto donde van, o se
 * mueve uno que quedó mal puesto. La primera forma —que la app los encuentre
 * sola y marcar el texto con el mouse— sigue en MarcarCamposPanel.
 *
 * Con mouse se arrastra. En el celular, donde arrastrar no funciona, se toca
 * el campo y luego se toca la palabra después de la cual va.
 */

type Arrastrado =
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

const TAG_RE = /(\{\{[^}]+\}\})/g;
const claveDeTag = (tag: string) => /^\{\{\s*([^}:]+?)\s*(?::[^}]*)?\}\}$/.exec(tag)?.[1] ?? null;

export function ColocarCamposPanel({
  parrafos, campos, language, parrafoAdmiteCampo, onInsertar, onMover, onQuitar,
}: {
  parrafos: string[];
  campos: DetectedField[];
  language: 'en' | 'es';
  parrafoAdmiteCampo: (parrafo: number) => boolean;
  onInsertar: (en: PosicionEnDocumento, campo: { claveExistente?: string; etiqueta?: string; tipo?: DetectedFieldType }) => void;
  onMover: (desde: RangoEnDocumento, hasta: PosicionEnDocumento) => void;
  onQuitar: (rango: RangoEnDocumento) => void;
}) {
  const es = language === 'es';
  const [enMano, setEnMano] = useState<Arrastrado | null>(null);
  const [destino, setDestino] = useState<PosicionEnDocumento | null>(null);
  const etiquetaDe = useMemo(() => new Map(campos.map((c) => [c.key, c.label])), [campos]);
  const datos = campos.filter((c) => c.type !== 'section');

  const soltar = (en: PosicionEnDocumento) => {
    const item = enMano;
    setEnMano(null);
    setDestino(null);
    if (!item || !parrafoAdmiteCampo(en.parrafo)) return;
    if (item.tipo === 'mover') onMover(item.rango, en);
    else if (item.tipo === 'existente') onInsertar(en, { claveExistente: item.clave });
    else onInsertar(en, { etiqueta: item.etiqueta, tipo: item.tipoCampo });
  };

  const empezarArrastre = (item: Arrastrado) => (e: DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'campo');
    setEnMano(item);
  };

  /** Posición dentro del párrafo según en qué mitad de la palabra está el
   *  puntero: mitad izquierda = antes de la palabra, derecha = después. */
  const posicionSobrePalabra = (e: DragEvent | ReactMouseEvent, parrafo: number, inicio: number, fin: number): PosicionEnDocumento => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { parrafo, offset: e.clientX < r.left + r.width / 2 ? inicio : fin };
  };

  const pintarParrafo = (texto: string, p: number) => {
    if (!texto.trim()) return <div key={p} className="h-3" />;
    const nodos: Array<ReactElement | null> = [];
    let cursor = 0;
    const caret = (offset: number) => destino && destino.parrafo === p && destino.offset === offset
      ? <span key={`c${offset}`} className="mx-px inline-block h-[1.1em] w-0.5 animate-pulse rounded bg-indigo-600 align-middle" />
      : null;

    for (const parte of texto.split(TAG_RE)) {
      if (!parte) continue;
      const inicio = cursor;
      const fin = cursor + parte.length;
      cursor = fin;
      const clave = claveDeTag(parte);
      if (clave) {
        const rango = { parrafo: p, start: inicio, end: fin };
        const moviendoEste = enMano?.tipo === 'mover' && enMano.rango.parrafo === p && enMano.rango.start === inicio;
        nodos.push(caret(inicio));
        nodos.push(
          <span
            key={`t${inicio}`}
            draggable
            onDragStart={empezarArrastre({ tipo: 'mover', rango })}
            onDragEnd={() => { setEnMano(null); setDestino(null); }}
            onClick={() => setEnMano(moviendoEste ? null : { tipo: 'mover', rango })}
            className={`group mx-0.5 inline-flex cursor-grab select-none items-center gap-1 rounded-md border px-1.5 py-0.5 align-baseline font-sans text-[11px] font-bold transition active:cursor-grabbing ${moviendoEste ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-indigo-200 bg-indigo-100 text-indigo-700 hover:border-indigo-400'}`}
            title={es ? 'Arrástralo para moverlo' : 'Drag it to move it'}
          >
            <GripVertical className="size-3 opacity-60" />
            {etiquetaDe.get(clave) ?? clave}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onQuitar(rango); }}
              className={`ml-0.5 rounded p-px ${moviendoEste ? 'hover:bg-indigo-500' : 'hover:bg-indigo-200'}`}
              title={es ? 'Quitar de aquí' : 'Remove from here'}
            >
              <X className="size-3" />
            </button>
          </span>,
        );
        continue;
      }
      // Texto normal: cada palabra es un punto donde se puede soltar.
      let local = inicio;
      for (const trozo of parte.split(/(\s+)/)) {
        if (!trozo) continue;
        const a = local;
        const b = local + trozo.length;
        local = b;
        if (/^\s+$/.test(trozo)) { nodos.push(<span key={`s${a}`}>{trozo}</span>); continue; }
        nodos.push(caret(a));
        nodos.push(
          <span
            key={`w${a}`}
            onDragOver={(e) => { e.preventDefault(); setDestino(posicionSobrePalabra(e, p, a, b)); }}
            onDrop={(e) => { e.preventDefault(); soltar(posicionSobrePalabra(e, p, a, b)); }}
            onClick={(e) => { if (enMano) soltar(posicionSobrePalabra(e, p, a, b)); }}
            className={enMano ? 'cursor-copy rounded hover:bg-indigo-50' : ''}
          >
            {trozo}
          </span>,
        );
      }
    }
    nodos.push(caret(texto.length));
    return <p key={p} className="whitespace-pre-wrap">{nodos}</p>;
  };

  const chip = (key: string, contenido: ReactElement, item: Arrastrado, activo: boolean) => (
    <button
      key={key}
      type="button"
      draggable
      onDragStart={empezarArrastre(item)}
      onDragEnd={() => { setEnMano(null); setDestino(null); }}
      onClick={() => setEnMano(activo ? null : item)}
      className={`flex w-full cursor-grab items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition active:cursor-grabbing ${activo ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'}`}
    >
      <GripVertical className="size-3.5 shrink-0 opacity-50" />
      {contenido}
    </button>
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 p-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
          <Hand className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">
            {es ? 'Arrastra cada dato al lugar donde va' : 'Drag each detail to where it goes'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {es
              ? 'Arrastra un campo de la izquierda hasta el documento, o mueve uno que quedó mal puesto. En el celular: toca el campo y luego toca la palabra donde va.'
              : 'Drag a field from the left onto the document, or move one that landed in the wrong spot. On a phone: tap the field, then tap the word where it goes.'}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr]">
        <aside className="space-y-4 border-b border-slate-100 bg-slate-50/70 p-4 md:border-b-0 md:border-r">
          <div>
            <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{es ? 'Campo nuevo' : 'New field'}</p>
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-1">
              {PALETA.map((c) => {
                const etiqueta = es ? c.es : c.en;
                const activo = enMano?.tipo === 'nuevo' && enMano.etiqueta === etiqueta;
                const Icono = c.icono;
                return chip(`n-${c.es}`, <><Icono className="size-3.5 shrink-0" />{etiqueta}</>, { tipo: 'nuevo', etiqueta, tipoCampo: c.tipo }, activo);
              })}
            </div>
          </div>
          {datos.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-slate-400">{es ? 'Repetir un dato que ya existe' : 'Reuse an existing detail'}</p>
              <div className="max-h-56 space-y-1.5 overflow-y-auto">
                {datos.map((c) => chip(
                  `e-${c.key}`,
                  <span className="truncate">{c.label}</span>,
                  { tipo: 'existente', clave: c.key },
                  enMano?.tipo === 'existente' && enMano.clave === c.key,
                ))}
              </div>
            </div>
          )}
        </aside>

        <div className="relative bg-slate-100/70 p-3 sm:p-6">
          {enMano && (
            // Flotando encima, no dentro del flujo: si empujara el documento
            // hacia abajo, el texto saltaría justo cuando la persona va a tocar
            // el lugar donde quiere el campo.
            <p className="pointer-events-auto absolute inset-x-3 top-3 z-10 rounded-xl bg-indigo-600 px-3 py-2 text-center text-xs font-bold text-white shadow-lg sm:inset-x-6">
              {es ? 'Suelta (o toca) la palabra donde va el campo' : 'Drop on (or tap) the word where the field goes'}
              <button type="button" onClick={() => setEnMano(null)} className="ml-2 underline">{es ? 'Cancelar' : 'Cancel'}</button>
            </p>
          )}
          <div
            className="mx-auto max-h-[560px] max-w-[720px] space-y-2 overflow-y-auto rounded-sm bg-white px-6 py-8 font-serif text-[13.5px] leading-relaxed text-slate-800 shadow-md sm:px-12"
            onDragLeave={(e) => { if (e.currentTarget === e.target) setDestino(null); }}
          >
            {parrafos.map(pintarParrafo)}
          </div>
        </div>
      </div>
    </section>
  );
}
