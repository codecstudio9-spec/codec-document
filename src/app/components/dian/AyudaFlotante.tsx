import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Sparkles } from 'lucide-react';
import { CARD_RADIUS, DEGRADADO_MARCA, MOV } from '../../styles/contador-theme';
import { useDraggablePosition } from '../../hooks/use-draggable-position';

/**
 * «Cómo funciona», como botón flotante que se puede mover.
 *
 * ── Por qué salió del cuerpo de la pantalla ─────────────────────────────
 * Era un panel desplegable que ocupaba el primer tercio de la pantalla de
 * inicio y venía abierto de fábrica. El contador que ya sabe usar esto —o
 * sea, el mismo contador a partir del segundo mes— tenía que pasar por
 * encima de tres párrafos que ya se sabía para llegar a lo que venía a
 * hacer. Y cerrarlo no bastaba: al recargar volvía a salir.
 *
 * Como botón flotante sigue estando siempre a un clic, no le quita sitio a
 * nada, y quien no lo necesita simplemente no lo abre.
 *
 * ── Dónde aparece la primera vez ────────────────────────────────────────
 * Abajo a la derecha, sobre la tabla. Es la esquina que en esta pantalla no
 * tiene nada que estorbar —el menú está a la izquierda y las acciones
 * arriba— y es donde la costumbre pone la ayuda en cualquier aplicación. A
 * partir de ahí, el contador lo deja donde quiera y ahí se queda.
 */

const CLAVE_POSICION = 'codec_dian_ayuda_pos';

const PASOS = [
  {
    n: '1',
    t: 'Descarga tus documentos de la DIAN',
    d: 'Entra al portal de la DIAN, busca tus documentos recibidos del periodo y descárgalos. Te queda un ZIP, o varios XML sueltos.',
  },
  {
    n: '2',
    t: 'Suéltalos aquí',
    d: 'Arrastra el ZIP tal como te lo dio la DIAN. No hace falta descomprimirlo ni renombrar nada. También sirven XML sueltos.',
  },
  {
    n: '3',
    t: 'Revisa y exporta',
    d: 'Codec lee cada documento y arma la tabla. Tú solo revisas lo que quedó marcado y descargas el reporte.',
  },
];

export function AyudaFlotante({
  abierta, onAbrir, onCerrar,
}: {
  abierta: boolean;
  onAbrir: () => void;
  onCerrar: () => void;
}) {
  const [pulsado, setPulsado] = useState(false);
  const arrastre = useDraggablePosition(CLAVE_POSICION);

  const posicion: React.CSSProperties = arrastre.pos
    ? { left: arrastre.pos.left, top: arrastre.pos.top, right: 'auto', bottom: 'auto' }
    : { right: 24, bottom: 24 };

  return (
    <>
      {/* El botón. `touch-none` es lo que impide que el navegador se quede el
          gesto para hacer scroll en móvil y el arrastre no llegue a ocurrir. */}
      <motion.button
        type="button"
        onPointerDown={(e) => { setPulsado(true); arrastre.onPointerDown(e); }}
        onPointerMove={arrastre.onPointerMove}
        onPointerUp={() => { setPulsado(false); arrastre.onPointerUp(); }}
        onClick={() => { if (!arrastre.wasDragged()) onAbrir(); }}
        animate={{ scale: pulsado ? 0.94 : 1 }}
        transition={MOV.suave}
        style={{ ...posicion, background: DEGRADADO_MARCA }}
        className="fixed z-40 flex touch-none cursor-grab items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(37,99,235,0.42)] active:cursor-grabbing"
        aria-label="Cómo funciona"
      >
        <HelpCircle className="size-4.5 shrink-0" />
        <span className="hidden sm:inline">¿Cómo funciona?</span>
      </motion.button>

      <AnimatePresence>
        {abierta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOV.suave}
            onClick={onCerrar}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={MOV.entrada}
              onClick={(ev) => ev.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
              style={{ borderRadius: CARD_RADIUS }}
            >
              <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                  <HelpCircle className="size-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-black text-slate-900">Cómo funciona</h2>
                  <p className="mt-0.5 text-[12.5px] text-slate-400">
                    Tres pasos. No necesitas saber nada técnico.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCerrar}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Cerrar"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="px-6 py-6">
                <ol className="grid gap-5 sm:grid-cols-3">
                  {PASOS.map((p, i) => (
                    <motion.li
                      key={p.n}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...MOV.entrada, delay: 0.05 + i * 0.06 }}
                      className="flex gap-3"
                    >
                      <span
                        className="flex size-7 shrink-0 items-center justify-center rounded-xl text-[12px] font-black text-white"
                        style={{ background: DEGRADADO_MARCA }}
                      >
                        {p.n}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900">{p.t}</span>
                        <span className="mt-1 block text-[12.5px] leading-relaxed text-slate-500">{p.d}</span>
                      </div>
                    </motion.li>
                  ))}
                </ol>

                <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-slate-50 px-4 py-3.5 text-[12.5px] leading-relaxed text-slate-500">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-500" />
                  <span>
                    Tus archivos se procesan en tu propio navegador. El XML original
                    se conserva porque es el documento con validez legal, no el PDF.
                  </span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
