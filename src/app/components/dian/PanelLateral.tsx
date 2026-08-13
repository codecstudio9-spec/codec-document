import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { SIDEBAR_BG, MOV } from '../../styles/contador-theme';
import { Logo } from '../brand/Logo';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';

/**
 * Barra lateral del panel para contadores.
 *
 * ── Por qué a la izquierda y siempre visible ────────────────────────────
 * Antes todo vivía en una sola columna: para llegar al auditor había que
 * pasar por delante de la importación, los CUFEs y la tabla. Con una barra
 * fija, cada cosa está a un clic desde cualquier punto y —más importante— el
 * contador VE de un vistazo todo lo que la herramienta sabe hacer. Media
 * docena de funciones enterradas bajo un scroll no existen para quien no
 * baja.
 *
 * ── El contador de pendientes ───────────────────────────────────────────
 * Los números al lado de «Revisión» y «Correo» son el motor del recorrido:
 * un contador abre esto para saber qué le falta, y la respuesta tiene que
 * estar en pantalla antes de que pregunte.
 */

export interface ItemLateral {
  id: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Número en la insignia. 0 o undefined no dibuja nada. */
  pendientes?: number;
  /** Insignia de texto, para lo que no es una cuenta ("Nuevo", "Plan"). */
  marca?: string;
  /** Los items bloqueados se ven, pero apagados. Esconder una función hace
   *  que nadie la descubra — y quien no sabe que existe no paga por ella. */
  bloqueado?: boolean;
}

export interface GrupoLateral {
  titulo?: string;
  items: ItemLateral[];
}

interface Props {
  grupos: GrupoLateral[];
  activo: string;
  onSeleccionar: (id: string) => void;
  /** Pie: identidad del contador y su plan. */
  correo?: string;
  plan?: string;
  /** Panel desplegable en móvil. */
  abiertoMovil: boolean;
  onCerrarMovil: () => void;
}

/**
 * El interruptor de voz vive en su propio componente a propósito.
 *
 * `useVoiceGuide()` se suscribe al estado del asistente, y suscribirse desde
 * la página —que es enorme— haría que cada encendido y apagado la volviera a
 * renderizar entera. Aquí el re-render se queda en esta fila. Es la propia
 * recomendación del hook, y el motivo por el que existe `useVoiceSpeak()`
 * aparte.
 */
function InterruptorVoz() {
  const { enabled, setEnabled } = useVoiceGuide();
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className="mb-2.5 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-white/50 transition hover:bg-white/[0.06] hover:text-white/80"
    >
      {enabled ? <Volume2 className="size-4 text-sky-300" /> : <VolumeX className="size-4" />}
      <span className="text-[12px] font-semibold">
        {enabled ? 'Guía por voz activa' : 'Guía por voz en silencio'}
      </span>
    </button>
  );
}

export function PanelLateral({
  grupos, activo, onSeleccionar, correo, plan,
  abiertoMovil, onCerrarMovil,
}: Props) {
  const contenido = (
    <div className="flex h-full flex-col" style={{ background: SIDEBAR_BG }}>
      {/* Cabecera */}
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <Logo size="sm" tagline="Contadores · Colombia" href="/dashboard" dark />
        <button
          type="button"
          onClick={onCerrarMovil}
          className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Cerrar menú"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {grupos.map((grupo, gi) => (
          <div key={grupo.titulo ?? gi}>
            {grupo.titulo && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-white/25">
                {grupo.titulo}
              </p>
            )}
            <div className="space-y-0.5">
              {grupo.items.map((item) => {
                const Icono = item.icono;
                const esActivo = item.id === activo;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { onSeleccionar(item.id); onCerrarMovil(); }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      esActivo ? 'text-white' : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'
                    }`}
                  >
                    {/* El fondo del activo es un elemento animado compartido:
                        se desliza entre opciones en vez de parpadear. */}
                    {esActivo && (
                      <motion.span
                        layoutId="lateral-activo"
                        transition={MOV.suave}
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.14) 100%)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
                          border: '1px solid rgba(96,165,250,0.22)',
                        }}
                      />
                    )}

                    <Icono
                      className={`relative size-[18px] shrink-0 transition ${
                        esActivo ? 'text-sky-300' : 'text-white/45 group-hover:text-white/70'
                      }`}
                    />
                    <span className="relative min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {item.etiqueta}
                    </span>

                    {item.pendientes ? (
                      <span className="relative shrink-0 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-black tabular-nums text-amber-950">
                        {item.pendientes > 99 ? '99+' : item.pendientes}
                      </span>
                    ) : item.marca ? (
                      <span className={`relative shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        item.bloqueado
                          ? 'bg-white/10 text-white/40'
                          : 'bg-sky-400/20 text-sky-200'
                      }`}>
                        {item.marca}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Pie */}
      <div className="border-t border-white/[0.07] px-4 py-3.5">
        <InterruptorVoz />

        {correo && (
          <div className="px-2.5">
            <p className="truncate text-[11px] font-semibold text-white/70">{correo}</p>
            <p className="text-[10px] text-white/35">Plan {plan ?? 'Gratis'}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Fija en escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block">
        {contenido}
      </aside>

      {/* Desplegable en móvil */}
      <AnimatePresence>
        {abiertoMovil && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MOV.suave}
              onClick={onCerrarMovil}
              className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={MOV.suave}
              className="fixed inset-y-0 left-0 z-50 w-[248px] lg:hidden"
            >
              {contenido}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
