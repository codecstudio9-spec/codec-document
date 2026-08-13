import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { X, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { SIDEBAR_BG, MOV } from '../../styles/contador-theme';
import { Logo } from '../brand/Logo';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';

/**
 * Barra lateral del panel para contadores.
 *
 * ── Fija en escritorio, cajón en móvil ──────────────────────────────────
 * Una versión anterior la tenía oculta detrás de un botón también en
 * escritorio, para no robarle 250 px de ancho a la tabla. El precio fue peor
 * que el problema: media docena de funciones —el conector de correo, el
 * auditor, las plantillas— quedaban invisibles para quien no abría el menú, y
 * el contador no puede querer algo que no sabe que existe. Fija se ve todo de
 * un vistazo, y la tabla recupera el ancho haciéndose scrollable en su propia
 * caja en vez de estirar la página.
 *
 * En móvil no hay ancho que repartir, así que ahí sigue siendo un cajón con
 * capa oscura.
 *
 * ── En azul, no en oscuro ───────────────────────────────────────────────
 * La primera versión era casi negra y partía la pantalla en dos productos
 * distintos: un panel oscuro pegado a un área blanca no se lee como una sola
 * herramienta. El azul de la marca mantiene la jerarquía sin ese corte, y
 * ahora además enlaza con la franja de bienvenida.
 */

/** Ancho de la barra. Lo exporta para que la página desplace su contenido
 *  exactamente lo mismo: dos números sueltos que hay que acordarse de cambiar
 *  a la vez acaban desalineados. */
export const ANCHO_LATERAL = 264;

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
  nombre?: string;
  correo?: string;
  /** Tarjeta de plan del pie. Sin datos, no se dibuja. */
  plan?: { nombre: string; limite: number | null; usados: number };
  onVerPlan?: () => void;
  onAyuda?: () => void;
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

/**
 * El contenido, sin envoltorio.
 *
 * Se dibuja dos veces —fijo en escritorio y dentro del cajón en móvil— y por
 * eso está aquí y no repetido: dos copias del menú acabarían con una opción
 * nueva visible sólo en una de las dos.
 *
 * `capaActiva` distingue las dos instancias. Sin eso, el recuadro blanco del
 * elemento activo se anima entre la copia de escritorio y la del móvil, que
 * están en sitios distintos de la pantalla, y cruza la ventana en diagonal al
 * abrir el cajón.
 */
function Contenido({
  grupos, activo, onSeleccionar, nombre, correo, plan, onVerPlan, onAyuda, onCerrar,
  conCierre, capaActiva,
}: Omit<Props, 'abierta'> & { conCierre: boolean; capaActiva: string }) {
  const pct = plan && plan.limite
    ? Math.min(100, Math.round((plan.usados / plan.limite) * 100))
    : null;

  const iniciales = (nombre ?? correo ?? 'C').slice(0, 2).toUpperCase();

  return (
    <>
      <div className="flex items-center justify-between px-5 pb-5 pt-5">
        <Logo size="sm" tagline="Contadores" href="/dashboard" dark />
        {conCierre && (
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/15 hover:text-white"
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        )}
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
                        layoutId={`lateral-activo-${capaActiva}`}
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

        {onAyuda && (
          <div className="border-t border-white/15 pt-4">
            <button
              type="button"
              onClick={() => { onAyuda(); onCerrar(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/85 transition hover:bg-white/12"
            >
              <HelpCircle className="size-[18px] shrink-0" />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                Ayuda y soporte
              </span>
            </button>
            <InterruptorVoz />
          </div>
        )}
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

        {/* Quién está dentro. Un contador que lleva varias firmas suele tener
            más de una cuenta abierta; ver el correo evita subirle a un cliente
            los documentos de otro. */}
        {(nombre || correo) && (
          <div className="flex items-center gap-2.5 border-t border-white/15 px-2 pt-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-black text-white ring-1 ring-white/25">
              {iniciales}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              {nombre && <p className="truncate text-[12.5px] font-bold text-white">{nombre}</p>}
              {correo && <p className="truncate text-[11px] text-white/55">{correo}</p>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function PanelLateral(props: Props) {
  const { abierta, onCerrar } = props;

  return (
    <>
      {/* Escritorio: siempre puesta. */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden flex-col lg:flex"
        style={{ width: ANCHO_LATERAL, background: SIDEBAR_BG }}
      >
        <Contenido {...props} conCierre={false} capaActiva="fija" onCerrar={() => {}} />
      </aside>

      {/* Móvil: cajón. */}
      <AnimatePresence>
        {abierta && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={MOV.suave}
              onClick={onCerrar}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] lg:hidden"
            />

            <motion.aside
              initial={{ x: -ANCHO_LATERAL - 8 }}
              animate={{ x: 0 }}
              exit={{ x: -ANCHO_LATERAL - 8 }}
              transition={MOV.suave}
              className="fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden"
              style={{ width: ANCHO_LATERAL, background: SIDEBAR_BG }}
            >
              <Contenido {...props} conCierre capaActiva="cajon" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
