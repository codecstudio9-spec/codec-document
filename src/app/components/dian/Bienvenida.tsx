import { motion } from 'framer-motion';
import { Menu, HelpCircle } from 'lucide-react';
import { CRISTAL } from '../../styles/contador-theme';

/**
 * Cabecera del panel para contadores.
 *
 * ── Es la misma cabecera del dashboard principal ────────────────────────
 * Misma altura (80), mismo blanco translúcido con desenfoque, mismo borde
 * inferior, mismo saludo por hora del día, y los mismos cuadros redondeados
 * de 44 px a la derecha con la sombra larga y suave de la casa.
 *
 * Hubo una versión con franja azul y las cifras del mes flotando dentro. Se
 * veía bien en un mockup y mal en el producto: era el único sitio de todo
 * Codec Document con un bloque de color saturado arriba, y entrar aquí desde
 * el dashboard se sentía como cambiar de aplicación. Las cifras se movieron a
 * las cuatro tarjetas blancas del cuerpo, que es donde el dashboard las pone.
 *
 * ── Por qué no reutiliza `DesktopHeader` ────────────────────────────────
 * Aquél trae la campana de notificaciones, que cuenta documentos firmados sin
 * abrir — algo que en el módulo del contador no existe. Enseñar una campana
 * que nunca puede tener nada es peor que no tenerla.
 */

function saludo(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function Bienvenida({
  nombre, foto, onAbrirMenu, onAyuda, onPerfil, campana,
}: {
  nombre?: string;
  foto?: string;
  onAbrirMenu: () => void;
  onAyuda?: () => void;
  onPerfil?: () => void;
  /** La campana de avisos. Se recibe ya montada en vez de recibir la lista y
   *  dibujarla aquí: así la cabecera no se vuelve a renderizar cada vez que
   *  entra un aviso, y sólo se repinta la campana. */
  campana?: React.ReactNode;
}) {
  const inicial = (nombre ?? '?').charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200/70 bg-white/70 px-5 sm:px-8"
      style={CRISTAL}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onAbrirMenu}
          className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-lg font-black text-slate-900">
            {saludo()}{nombre ? `, ${nombre}` : ''}
          </p>
          <p translate="no" className="notranslate truncate text-xs text-slate-400">
            Codec Document · Contadores
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {campana}

        {onAyuda && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={onAyuda}
            className="flex size-11 items-center justify-center rounded-2xl bg-white"
            style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
            aria-label="Ayuda"
          >
            <HelpCircle className="size-4.5 text-slate-500" />
          </motion.button>
        )}

        <button
          type="button"
          onClick={onPerfil}
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white"
          style={{ boxShadow: '0 10px 30px rgba(15,23,42,0.06)' }}
          aria-label="Mi cuenta"
        >
          {foto ? (
            <img
              src={foto}
              alt={nombre ?? 'Mi cuenta'}
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-sm font-black text-slate-400">{inicial}</span>
          )}
        </button>
      </div>
    </header>
  );
}
