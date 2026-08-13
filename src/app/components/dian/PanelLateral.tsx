import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { SIDEBAR_BG, MOV } from '../../styles/contador-theme';
import { Logo } from '../brand/Logo';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';

/**
 * Barra lateral del panel para contadores.
 *
 * ── Oculta por defecto ──────────────────────────────────────────────────
 * Se abre con el botón del encabezado y se recuerda la elección. La razón es
 * que el recorrido normal del contador cabe entero en la pantalla principal
 * —soltar los archivos, ver el avance, mirar la tabla— y el menú sólo hace
 * falta para ir a una herramienta concreta. Tenerlo siempre puesto le robaba
 * 250 px de ancho a la tabla, que es lo que de verdad mira.
 *
 * ── En azul, no en oscuro ───────────────────────────────────────────────
 * La primera versión era casi negra y partía la pantalla en dos productos
 * distintos: un panel oscuro pegado a un área blanca no se lee como una sola
 * herramienta. El azul de la marca mantiene la jerarquía sin ese corte.
 */

export interface ItemLateral {
  id: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Número en la insignia. 0 o undefined no dibuja nada. */
  pendientes?: number;
  marca?: string;
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
  correo?: string;
  /** Tarjeta de plan del pie. Sin datos, no se dibuja. */
  plan?: { nombre: string; limite: number | null; usados: number };
  onVerPlan?: () => void;
  abierta: boolean;
  onCerrar: () => void;
}

/**
 * El interruptor de voz vive en su propio componente a propósito.
 *
 * `useVoiceGuide()` se suscribe al estado del asistente, y suscribirse desde
 * la página —que es enorme— haría que cada encendido y apagado la volviera a
 * renderizar entera. Aquí el re-render se queda en esta fila.
 */
function InterruptorVoz() {
  const { enabled, setEnabled } = useVoiceGuide();
  return (
    <button
      type="button"
      onClick={() => setEnabled(!enabled)}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-white/70 transition hover:bg-white/10 hover:text-white"
    >
      {enabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      <span className="text-[12px] font-semibold">
        {enabled ? 'Guía por voz activa' : 'Activar guía por voz'}
      </span>
    </button>
  );
}

export function PanelLateral({
  grupos, activo, onSeleccionar, correo, plan, onVerPlan, abierta, onCerrar,
}: Props) {
  const pct = plan && plan.limite
    ? Math.min(100, Math.round((plan.usados / plan.limite) * 100))
    : null;

  return (
    <AnimatePresence>
      {abierta && (
        <>
          {/* La capa oscura cubre TODO, también en escritorio. Con el menú
              oculto por defecto, abrirlo es un gesto puntual: se elige algo y
              se cierra. Dejar el fondo activo invitaría a trabajar con él
              abierto, que es justo lo que se quiso evitar. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOV.suave}
            onClick={onCerrar}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: -272 }}
            animate={{ x: 0 }}
            exit={{ x: -272 }}
            transition={MOV.suave}
            className="fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col"
            style={{ background: SIDEBAR_BG }}
          >
            <div className="flex items-center justify-between px-5 pb-5 pt-5">
              <Logo size="sm" tagline="Contadores" href="/dashboard" dark />
              <button
                type="button"
                onClick={onCerrar}
                className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/15 hover:text-white"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
              {grupos.map((grupo, gi) => (
                <div key={grupo.titulo ?? gi}>
                  {grupo.titulo && (
                    <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-white/45">
                      {grupo.titulo}
                    </p>
                  )}
                  <div className="space-y-1">
                    {grupo.items.map((item) => {
                      const Icono = item.icono;
                      const esActivo = item.id === activo;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { onSeleccionar(item.id); onCerrar(); }}
                          className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            esActivo ? 'text-blue-700' : 'text-white/85 hover:bg-white/12'
                          }`}
                        >
                          {/* Activo en BLANCO sobre el azul: es el contraste
                              más fuerte disponible y no hace falta ningún
                              adorno más para saber dónde estás. */}
                          {esActivo && (
                            <motion.span
                              layoutId="lateral-activo"
                              transition={MOV.suave}
                              className="absolute inset-0 rounded-xl bg-white shadow-[0_2px_8px_rgba(15,23,42,0.14)]"
                            />
                          )}
                          <Icono className="relative size-[18px] shrink-0" />
                          <span className="relative min-w-0 flex-1 truncate text-[13px] font-semibold">
                            {item.etiqueta}
                          </span>
                          {item.pendientes ? (
                            <span className={`relative shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                              esActivo ? 'bg-blue-600 text-white' : 'bg-white text-blue-700'
                            }`}>
                              {item.pendientes > 99 ? '99+' : item.pendientes}
                            </span>
                          ) : item.marca ? (
                            <span className="relative shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/80">
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

            <div className="px-3 pb-4">
              {/* Tarjeta de plan: el consumo va donde el contador ya está
                  mirando cuando piensa en su cuenta, no escondido tras un
                  clic más. */}
              {plan && (
                <div className="mb-3 rounded-2xl bg-white/12 p-3.5 ring-1 ring-white/15">
                  <p className="text-[12px] font-bold text-white">Plan {plan.nombre}</p>
                  <p className="mt-0.5 text-[11px] text-white/65">
                    {plan.limite === null
                      ? 'Documentos sin límite'
                      : `${plan.limite.toLocaleString('es-CO')} XML / mes`}
                  </p>
                  {pct !== null && (
                    <>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/20">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={MOV.lenta}
                          className={`h-full rounded-full ${pct >= 100 ? 'bg-rose-300' : pct >= 85 ? 'bg-amber-300' : 'bg-white'}`}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-white/65">
                        Usados: {plan.usados.toLocaleString('es-CO')} ({pct}%)
                      </p>
                    </>
                  )}
                  {onVerPlan && (
                    <button
                      type="button"
                      onClick={() => { onVerPlan(); onCerrar(); }}
                      className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-[12px] font-bold text-blue-700 transition hover:bg-blue-50"
                    >
                      Ver mi plan
                    </button>
                  )}
                </div>
              )}

              <InterruptorVoz />

              {correo && (
                <p className="mt-2 truncate px-3 text-[11px] text-white/55">{correo}</p>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
