import { useRef, useState } from 'react';
import { MousePointerClick, Plus, X } from 'lucide-react';
import type { DetectedField } from '../../../lib/docxTemplateEngine';

/**
 * Vista del Word donde el cliente selecciona con el mouse (o mantiene
 * presionado en el celular) el dato que cambia cada vez —«Juan Pérez»,
 * «15 de marzo de 2026»— y le pone nombre. Es el equivalente, para un Word,
 * de arrastrar un campo encima del documento en Dropbox Sign: nadie tiene
 * que aprender a escribir {{variables}}.
 *
 * Los campos ya creados se ven como etiquetas de color dentro del texto, así
 * el cliente ve de un vistazo qué falta.
 */
export function MarcarCamposPanel({
  parrafos, campos, language, onMarcar,
}: {
  parrafos: string[];
  campos: DetectedField[];
  language: 'en' | 'es';
  /** Devuelve cuántas veces se reemplazó (0 = no se encontró el texto). */
  onMarcar: (texto: string, etiqueta: string) => number;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [etiqueta, setEtiqueta] = useState('');
  const [aviso, setAviso] = useState('');
  const es = language === 'es';
  const etiquetaDe = new Map(campos.map((c) => [c.key, c.label]));

  const leerSeleccion = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !contenedor.current) return;
    if (!contenedor.current.contains(sel.anchorNode) || !contenedor.current.contains(sel.focusNode)) return;
    const texto = sel.toString().replace(/\s+/g, ' ').trim();
    if (!texto) return;
    if (texto.length > 120) {
      setAviso(es ? 'Selecciona solo el dato (un nombre, una fecha, un valor), no un párrafo entero.' : 'Select just the detail (a name, a date, an amount), not a whole paragraph.');
      return;
    }
    setAviso('');
    setSeleccion(texto);
    setEtiqueta('');
  };

  const confirmar = () => {
    if (!seleccion) return;
    const veces = onMarcar(seleccion, etiqueta.trim() || seleccion);
    if (veces === 0) {
      setAviso(es
        ? 'No pudimos ubicar ese texto exacto. Prueba seleccionando solo una parte dentro de una misma línea.'
        : "We couldn't find that exact text. Try selecting a shorter part within one line.");
    } else {
      setAviso(es
        ? `Listo: «${seleccion}» ahora es un campo${veces > 1 ? ` (aparecía ${veces} veces)` : ''}.`
        : `Done: "${seleccion}" is now a field${veces > 1 ? ` (it appeared ${veces} times)` : ''}.`);
    }
    setSeleccion(null);
    setEtiqueta('');
    window.getSelection()?.removeAllRanges();
  };

  const pintarParrafo = (texto: string, i: number) => {
    const partes = texto.split(/(\{\{[^}]+\}\})/g);
    return (
      <p key={i} className="min-h-[1em] whitespace-pre-wrap">
        {partes.map((parte, j) => {
          const m = /^\{\{\s*([^}:]+?)\s*(?::[^}]*)?\}\}$/.exec(parte);
          if (!m) return <span key={j}>{parte}</span>;
          return (
            <span key={j} contentEditable={false} className="mx-0.5 inline-flex select-none items-center rounded-md bg-indigo-100 px-1.5 py-0.5 align-baseline text-[11px] font-bold text-indigo-700">
              {etiquetaDe.get(m[1]) ?? m[1]}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-100 p-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
          <MousePointerClick className="size-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-black text-slate-800">
            {es ? '¿Falta algún dato? Márcalo en el documento' : 'Missing a detail? Mark it in the document'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {es
              ? 'Selecciona con el mouse lo que cambia cada vez (un nombre, una cédula, una fecha, un valor) y ponle un nombre. Las etiquetas moradas son los campos que ya tiene tu plantilla.'
              : 'Select with your mouse what changes each time (a name, an ID, a date, an amount) and name it. Purple tags are the fields your template already has.'}
          </p>
        </div>
      </div>

      <div
        ref={contenedor}
        onMouseUp={leerSeleccion}
        onTouchEnd={() => setTimeout(leerSeleccion, 50)}
        onKeyUp={leerSeleccion}
        className="max-h-[420px] space-y-2 overflow-y-auto bg-slate-50/60 px-6 py-5 font-serif text-[13px] leading-relaxed text-slate-800 selection:bg-amber-200"
      >
        {parrafos.map(pintarParrafo)}
      </div>

      {(seleccion || aviso) && (
        <div className="sticky bottom-0 border-t border-slate-100 bg-white p-4">
          {seleccion ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="min-w-0 truncate text-xs text-slate-500 sm:max-w-[38%]">
                «<strong className="text-slate-800">{seleccion}</strong>»
              </p>
              <input
                autoFocus
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
                placeholder={es ? '¿Qué dato es? Ej.: Nombre del cliente' : 'What is it? e.g. Client name'}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
              <div className="flex gap-2">
                <button type="button" onClick={confirmar}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500">
                  <Plus className="size-4" /> {es ? 'Convertir en campo' : 'Make it a field'}
                </button>
                <button type="button" onClick={() => { setSeleccion(null); window.getSelection()?.removeAllRanges(); }}
                  className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200" title={es ? 'Cancelar' : 'Cancel'}>
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs font-semibold text-slate-600">{aviso}</p>
          )}
        </div>
      )}
    </section>
  );
}
