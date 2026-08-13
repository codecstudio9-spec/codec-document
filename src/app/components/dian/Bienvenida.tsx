import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Menu, HelpCircle } from 'lucide-react';
import { BANNER_BG, MOV, PULSACION } from '../../styles/contador-theme';

/**
 * Franja de bienvenida y las acciones principales.
 *
 * ── Por qué tarjetas y no botones ───────────────────────────────────────
 * Cada acción lleva título y una línea de explicación. Un botón que sólo dice
 * «Cruzar contabilidad» obliga al contador a adivinar o a probarlo; con
 * «Comparar y validar» debajo, sabe qué va a pasar antes de pulsar. Son cuatro
 * y caben en una fila: más habrían obligado a esconder algunas.
 *
 * ── Y por qué están arriba del todo ─────────────────────────────────────
 * Es el flujo entero de la herramienta en una fila: traer documentos,
 * llevárselos, cruzarlos, o recibirlos por correo. El contador ve de qué es
 * capaz esto sin abrir un menú.
 */

export interface AccionPrincipal {
  id: string;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  onClick: () => void;
  /** La que corresponde a lo que está haciendo ahora. */
  activa?: boolean;
  bloqueada?: boolean;
}

export function Bienvenida({
  nombre, onAbrirMenu, onAyuda, acciones,
}: {
  nombre?: string;
  onAbrirMenu: () => void;
  onAyuda?: () => void;
  acciones: AccionPrincipal[];
}) {
  return (
    <>
      <div
        className="relative overflow-hidden px-5 py-4 text-white sm:px-6"
        style={{ background: BANNER_BG }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <button
            type="button"
            onClick={onAbrirMenu}
            className="shrink-0 rounded-xl bg-white/15 p-2 text-white transition hover:bg-white/25"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-black leading-tight">
              {nombre ? `¡Hola, ${nombre}!` : '¡Hola!'}
            </p>
            <p className="truncate text-[12.5px] text-white/75">
              Automatiza tu trabajo con la DIAN y ahorra horas cada mes.
            </p>
          </div>

          {onAyuda && (
            <button
              type="button"
              onClick={onAyuda}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-[12.5px] font-bold transition hover:bg-white/25 sm:flex"
            >
              <HelpCircle className="size-4" />
              Necesito ayuda
            </button>
          )}
        </div>
      </div>

      {/* Las cuatro acciones. Van sobre el fondo claro y montadas un poco
          sobre la franja, para que se lean como lo primero del área de
          trabajo y no como parte del encabezado. */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-1 grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {acciones.map((a, i) => {
            const Icono = a.icono;
            return (
              <motion.button
                key={a.id}
                type="button"
                onClick={a.onClick}
                disabled={a.bloqueada}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...MOV.entrada, delay: i * 0.05 }}
                whileTap={a.bloqueada ? undefined : PULSACION}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${
                  a.activa
                    ? 'text-white'
                    : 'bg-white text-slate-900 hover:border-blue-200 hover:shadow-[0_8px_24px_rgba(37,99,235,0.10)]'
                }`}
                style={
                  a.activa
                    ? {
                        background: 'linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)',
                        border: '1px solid #1D4ED8',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.22), 0 8px 22px rgba(37,99,235,0.30)',
                      }
                    : {
                        border: '1px solid #E3EAF5',
                        boxShadow: '0 1px 2px rgba(15,23,42,0.03), 0 6px 18px rgba(15,23,42,0.05)',
                      }
                }
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    a.activa ? 'bg-white/20' : 'bg-blue-50'
                  }`}
                >
                  <Icono className={`size-5 ${a.activa ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold leading-tight">{a.titulo}</p>
                  <p className={`truncate text-[11.5px] ${a.activa ? 'text-white/75' : 'text-slate-500'}`}>
                    {a.descripcion}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </>
  );
}
