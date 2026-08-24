/**
 * El botón que abre el dictado por voz.
 *
 * Vive aparte y no incrustado en cada formulario porque aparece en sitios
 * distintos —el generador de plantillas propias y el de plantillas de Word— y
 * tiene que verse idéntico en los dos: es la puerta de entrada a lo que más
 * tiempo ahorra del producto, y si en una pantalla se ve premium y en otra
 * como un aviso más, deja de leerse como una función y pasa a leerse como
 * ruido.
 *
 * El acabado es azul metalizado: un degradado con el claro fuera del centro
 * —como la luz sobre metal curvado, que nunca reflejaría justo en el medio—,
 * una línea clara arriba y otra oscura abajo que simulan el canto de una pieza
 * biselada, y un destello que lo recorre cada pocos segundos. El destello es
 * lo que hace que se lea como metal y no como un rectángulo azul.
 *
 * Todo el movimiento se apaga con `prefers-reduced-motion`. Un botón que
 * brilla solo, en bucle, es exactamente lo que esa preferencia existe para
 * evitar.
 */

import { motion, useReducedMotion } from 'motion/react';
import { Mic, Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
  language: 'en' | 'es';
  /** Cuántos campos puede rellenar. Concreta la promesa: «rellena los 17
   *  campos» dice mucho más que «rellena los campos». */
  cuantosCampos?: number;
  className?: string;
}

export function BotonDictado({ onClick, language, cuantosCampos, className }: Props) {
  const es = language === 'es';
  const sinMovimiento = useReducedMotion();

  const subtitulo = cuantosCampos && cuantosCampos > 0
    ? (es ? `Habla o pega un texto (un correo, notas) y la IA rellena los ${cuantosCampos} campos.`
          : `Speak or paste a text (an email, notes) and the AI fills in the ${cuantosCampos} fields.`)
    : (es ? 'Habla o pega un texto y la IA rellena los campos.'
          : 'Speak or paste a text and the AI fills in the fields.');

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={sinMovimiento ? undefined : { y: -2 }}
      whileTap={{ scale: 0.985 }}
      className={`group relative w-full overflow-hidden rounded-2xl px-4 py-3.5 text-left ${className ?? ''}`}
      style={{
        background: 'linear-gradient(135deg, #0B1B38 0%, #16346B 26%, #2E6BD6 48%, #16356E 72%, #0A1730 100%)',
        boxShadow: '0 14px 32px rgba(23,58,122,0.38), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.35)',
      }}
    >
      {/* Destello. Va inclinado y más ancho que alto para que cruce en
          diagonal, como la luz al girar una pieza de metal. Con una pausa
          larga entre pasadas: en bucle continuo distrae en vez de atraer. */}
      {!sinMovimiento && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            left: '-40%',
            transform: 'skewX(-18deg)',
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%)',
          }}
          animate={{ x: ['0%', '460%'] }}
          transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4.2 }}
        />
      )}

      {/* Brillo superior: la banda de luz que tiene cualquier superficie
          metálica pulida en su borde de arriba. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.16) 0%, transparent 100%)' }}
      />

      <span className="relative flex items-center gap-3.5">
        <span
          className="relative flex size-11 shrink-0 items-center justify-center rounded-full"
          style={{
            background: 'rgba(255,255,255,0.16)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 4px 12px rgba(0,0,0,0.25)',
          }}
        >
          {/* Onda que sale del micrófono. Dice «esto escucha» sin escribirlo. */}
          {!sinMovimiento && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{ border: '1.5px solid rgba(255,255,255,0.55)' }}
              animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
              transition={{ duration: 2.1, ease: 'easeOut', repeat: Infinity, repeatDelay: 0.6 }}
            />
          )}
          <Mic className="size-[19px] text-white" strokeWidth={2.2} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-black tracking-tight text-white">
            {es ? 'Dicta el documento' : 'Dictate the document'}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-blue-100/80">
            {subtitulo}
          </span>
        </span>

        <motion.span
          aria-hidden="true"
          className="shrink-0"
          animate={sinMovimiento ? undefined : { opacity: [0.55, 1, 0.55], scale: [1, 1.12, 1] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Sparkles className="size-[18px] text-blue-200" />
        </motion.span>
      </span>
    </motion.button>
  );
}
