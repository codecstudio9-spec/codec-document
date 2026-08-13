import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { MOV } from '../../styles/contador-theme';

/**
 * El cajón que se abre por la derecha.
 *
 * ── Por qué existe ──────────────────────────────────────────────────────
 * Las cuatro herramientas grandes —descargar de la DIAN, el auditor, las
 * plantillas y el detalle de un documento— abrían cada una su propio div
 * copiado y pegado: aparecían de golpe, sin animación, con esquinas rectas y
 * pegadas al borde de la ventana. Se veían como una ventana ajena montada
 * encima de la aplicación, no como una parte de ella.
 *
 * Cuatro copias del mismo envoltorio también significaban que arreglar una
 * —cerrar con Escape, por ejemplo— dejaba las otras tres igual. De hecho
 * pasó: el detalle de documento no cerraba con Escape porque esa tecla sólo
 * estaba atada en otro sitio.
 *
 * ── Lo que aporta sobre un div suelto ───────────────────────────────────
 * · Entra deslizándose y sale igual, así el ojo sigue de dónde vino.
 * · Esquinas redondeadas a la izquierda y un margen contra el borde: el
 *   cajón se apoya SOBRE la aplicación en vez de tapar media pantalla.
 * · Escape cierra, y el fondo también.
 * · Bloquea el scroll del cuerpo mientras está abierto. Sin eso, rodar la
 *   rueda dentro del cajón terminaba moviendo la página de detrás.
 */
export function CajonDerecho({
  abierto, onCerrar, children, ancho = 'max-w-xl', etiqueta,
}: {
  abierto: boolean;
  onCerrar: () => void;
  children: ReactNode;
  /** Clase de anchura máxima. El auditor y las plantillas piden más sitio
   *  que el detalle de un documento. */
  ancho?: string;
  etiqueta?: string;
}) {
  useEffect(() => {
    if (!abierto) return;

    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alTeclear);

    // Se guarda lo que hubiera antes en vez de asumir `''`: con dos cajones
    // encadenados, el segundo al cerrarse devolvía el scroll al cuerpo
    // mientras el primero seguía abierto.
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = previo;
    };
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOV.suave}
          onClick={onCerrar}
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-[2px] sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-label={etiqueta}
        >
          <motion.div
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={MOV.entrada}
            onClick={(ev) => ev.stopPropagation()}
            className={`h-full w-full ${ancho} overflow-y-auto overscroll-contain bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)] sm:rounded-3xl`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
