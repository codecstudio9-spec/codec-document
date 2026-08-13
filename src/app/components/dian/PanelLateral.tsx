import { motion, AnimatePresence } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { X, Volume2, VolumeX, HelpCircle, LogOut, User } from 'lucide-react';
import { ANCHO_LATERAL, DEGRADADO_MARCA, CRISTAL, MOV } from '../../styles/contador-theme';
import { Logo } from '../brand/Logo';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';

/**
 * Barra lateral del panel para contadores.
 *
 * ── Es la del dashboard principal, con otro menú ────────────────────────
 * Misma anchura (280), mismo blanco translúcido con desenfoque, mismo borde
 * derecho, y el elemento activo en la misma pastilla azul con su sombra. Se
 * probó una versión propia en azul saturado y el efecto era el contrario del
 * buscado: el contador salía del dashboard, entraba aquí y parecía otro
 * producto, con otra cuenta. Es el mismo Codec Document.
 *
 * Lo único que cambia es el contenido: aquí el menú no son rutas sino
 * secciones de esta pantalla, y por eso no usa `DesktopSidebar` tal cual —
 * aquél navega con `<Link>` y decide el activo por `pathname`.
 *
 * ── Fija en escritorio, cajón en móvil ──────────────────────────────────
 * Una versión anterior la escondía tras un botón también en escritorio, para
 * no robarle ancho a la tabla. El precio fue peor que el problema: el
 * conector de correo, el auditor y las plantillas quedaban invisibles para
 * quien no abría el menú, y nadie puede querer algo que no sabe que existe.
 */

export { ANCHO_LATERAL };

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
  /** Foto de la cuenta de Google, si la hay. La misma que enseña el
   *  dashboard principal — una inicial donde el resto del producto pone una
   *  cara se nota. */
  foto?: string;
  /** Tarjeta de plan del pie. Sin datos, no se dibuja. */
  plan?: { nombre: string; limite: number | null; usados: number };
  onVerPlan?: () => void;
  onAyuda?: () => void;
  onSalir?: () => void;
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
      className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
    >
      {enabled ? <Volume2 className="size-4.5 shrink-0" /> : <VolumeX className="size-4.5 shrink-0" />}
      <span className="truncate">{enabled ? 'Guía por voz activa' : 'Activar guía por voz'}</span>
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
 * `capaActiva` distingue las dos instancias. Sin eso, la pastilla azul del
 * elemento activo se anima entre la copia de escritorio y la del móvil, que
 * están en sitios distintos de la pantalla, y cruza la ventana en diagonal al
 * abrir el cajón.
 */
function Contenido({
  grupos, activo, onSeleccionar, nombre, correo, foto, plan, onVerPlan, onAyuda, onSalir,
  onCerrar, conCierre, capaActiva,
}: Omit<Props, 'abierta'> & { conCierre: boolean; capaActiva: string }) {
  const pct = plan && plan.limite
    ? Math.min(100, Math.round((plan.usados / plan.limite) * 100))
    : null;

  return (
    <>
      <div className="flex items-start justify-between px-6 pb-5 pt-7">
        <Logo size="md" tagline="Contadores" href="" />
        {conCierre && (
          <button
            type="button"
            onClick={onCerrar}
            className="-mr-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
              <p className="mb-1.5 px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                    className="relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors"
                    style={esActivo ? { color: '#fff' } : { color: '#475569' }}
                  >
                    {/* La pastilla azul es la misma del dashboard: degradado
                        de marca y sombra proyectada del propio azul. */}
                    {esActivo && (
                      <motion.span
                        layoutId={`lateral-activo-${capaActiva}`}
                        transition={MOV.suave}
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: DEGRADADO_MARCA,
                          boxShadow: '0 8px 20px rgba(37,99,235,0.28)',
                        }}
                      />
                    )}
                    <Icono className="relative size-4.5 shrink-0" />
                    <span className="relative min-w-0 flex-1 truncate">{item.etiqueta}</span>
                    {item.pendientes ? (
                      <span className={`relative shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                        esActivo ? 'bg-white/25 text-white' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {item.pendientes > 99 ? '99+' : item.pendientes}
                      </span>
                    ) : item.marca ? (
                      <span className={`relative shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        esActivo ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
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
        {/* Ayuda y voz van DENTRO del área que hace scroll, no en el pie
            fijo. Estaban abajo y en una pantalla de portátil el pie medía casi
            300 px: el menú se quedaba con sitio para tres opciones y «Por
            correo», «Verificar CUFEs» y «Descargar de la DIAN» caían bajo un
            scroll que nadie ve. Justo lo que la barra fija venía a evitar. */}
        <div className="space-y-1 border-t border-slate-100 pt-4">
          {onAyuda && (
            <button
              type="button"
              onClick={() => { onAyuda(); onCerrar(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <HelpCircle className="size-4.5 shrink-0" />
              <span className="truncate">Ayuda y soporte</span>
            </button>
          )}
          <InterruptorVoz />
        </div>
      </nav>

      <div className="space-y-1 border-t border-slate-100 px-3 py-3">
        {/* Tarjeta de plan: el consumo va donde el contador ya está mirando
            cuando piensa en su cuenta, no escondido tras un clic más.

            Toda la tarjeta es el botón. Antes llevaba dentro un «Ver mi plan»
            aparte que sumaba 40 px de alto para hacer lo mismo que hace ahora
            pulsar donde el ojo ya está. */}
        {plan && (
          <button
            type="button"
            onClick={() => { onVerPlan?.(); onCerrar(); }}
            disabled={!onVerPlan}
            className="w-full rounded-2xl bg-slate-50 p-3 text-left ring-1 ring-slate-200/70 transition enabled:hover:bg-blue-50 enabled:hover:ring-blue-200"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[12px] font-black text-slate-900">Plan {plan.nombre}</span>
              <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                {plan.limite === null
                  ? 'Sin límite'
                  : `${plan.usados.toLocaleString('es-CO')} / ${plan.limite.toLocaleString('es-CO')}`}
              </span>
            </div>
            {pct !== null && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={MOV.lenta}
                  className="h-full rounded-full"
                  style={{
                    background: pct >= 100 ? '#F43F5E' : pct >= 85 ? '#F59E0B' : DEGRADADO_MARCA,
                  }}
                />
              </div>
            )}
          </button>
        )}

        {/* Quién está dentro. Un contador que lleva varias firmas suele tener
            más de una cuenta abierta; ver el correo evita subirle a un cliente
            los documentos de otro. */}
        {(nombre || correo) && (
          <div className="flex items-center gap-3 rounded-xl px-3.5 py-2">
            {foto ? (
              <img
                src={foto}
                alt={nombre ?? 'Mi cuenta'}
                referrerPolicy="no-referrer"
                className="size-6 shrink-0 rounded-full object-cover"
              />
            ) : (
              <User className="size-4.5 shrink-0 text-slate-500" />
            )}
            <div className="min-w-0 flex-1 leading-tight">
              {nombre && <p className="truncate text-sm font-semibold text-slate-700">{nombre}</p>}
              {correo && <p className="truncate text-[11px] text-slate-400">{correo}</p>}
            </div>
          </div>
        )}

        {onSalir && (
          <button
            type="button"
            onClick={() => void onSalir()}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
          >
            <LogOut className="size-4.5 shrink-0" />
            Cerrar sesión
          </button>
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
        className="fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-slate-200/70 bg-white/90 lg:flex"
        style={{ width: ANCHO_LATERAL, ...CRISTAL }}
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
              className="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/70 bg-white lg:hidden"
              style={{ width: ANCHO_LATERAL }}
            >
              <Contenido {...props} conCierre capaActiva="cajon" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
