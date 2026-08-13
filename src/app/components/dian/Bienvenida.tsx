import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Menu, HelpCircle, ChevronRight } from 'lucide-react';
import { MOV, PULSACION } from '../../styles/contador-theme';

/**
 * Encabezado y los cuatro pasos del recorrido.
 *
 * ── Por qué van NUMERADOS ───────────────────────────────────────────────
 * Antes eran cuatro tarjetas sueltas y se leían como un menú: cuatro cosas
 * distintas que hacer, sin decir cuál primero. Numeradas cuentan una historia
 * —traer, analizar, cruzar, entregar— y un contador que abre esto por primera
 * vez entiende el flujo entero sin que nadie se lo explique.
 *
 * Cada paso lleva su propio color, y el color es el mismo que usa el resto de
 * la pantalla para esa etapa. No es decoración: es lo que permite mirar el
 * panel de progreso y saber en qué paso estás sin leer.
 *
 * ── El encabezado va en blanco ──────────────────────────────────────────
 * Se probó con una franja azul de lado a lado y competía con la barra lateral,
 * que ya es azul. Dos bloques de color saturado en la misma esquina hacen que
 * el ojo no sepa dónde posarse. En blanco, el único azul de la parte de arriba
 * es el menú, y el saludo se lee como contenido.
 */

export interface PasoPrincipal {
  id: string;
  numero: number;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  /** Color de la etapa. Se comparte con el resto de la pantalla. */
  color: string;
  onClick: () => void;
  activo?: boolean;
  bloqueado?: boolean;
}

export function Bienvenida({
  nombre, rol, onAbrirMenu, onAyuda, pasos,
}: {
  nombre?: string;
  rol?: string;
  onAbrirMenu: () => void;
  onAyuda?: () => void;
  pasos: PasoPrincipal[];
}) {
  const iniciales = (nombre ?? 'C').slice(0, 2).toUpperCase();

  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-5 pt-4 sm:px-6">
        {/* Saludo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAbrirMenu}
            className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
            style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.05)' }}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[19px] font-black leading-tight text-slate-900">
              {nombre ? `¡Hola, ${nombre}!` : '¡Hola!'} <span aria-hidden>👋</span>
            </p>
            <p className="truncate text-[12.5px] text-slate-500">
              Automatiza tu trabajo con la DIAN y ahorra horas cada mes.
            </p>
          </div>

          {onAyuda && (
            <button
              type="button"
              onClick={onAyuda}
              className="hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12.5px] font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700 sm:flex"
              style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.05)' }}
            >
              <HelpCircle className="size-4" />
              ¿Necesitas ayuda?
            </button>
          )}

          <div className="hidden shrink-0 items-center gap-2.5 sm:flex">
            <div
              className="flex size-9 items-center justify-center rounded-full text-[12px] font-black text-white"
              style={{ background: 'linear-gradient(180deg, #2563EB 0%, #1D4ED8 100%)' }}
            >
              {iniciales}
            </div>
            <div className="hidden leading-tight lg:block">
              <p className="text-[12.5px] font-bold text-slate-800">{nombre ?? 'Mi cuenta'}</p>
              <p className="text-[11px] text-slate-400">{rol ?? 'Contador'}</p>
            </div>
          </div>
        </div>

        {/* Los cuatro pasos */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((p, i) => {
            const Icono = p.icono;
            return (
              <motion.button
                key={p.id}
                type="button"
                onClick={p.onClick}
                disabled={p.bloqueado}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...MOV.entrada, delay: i * 0.05 }}
                whileTap={p.bloqueado ? undefined : PULSACION}
                className="group flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-55"
                style={{
                  border: `1px solid ${p.activo ? `${p.color}59` : '#E8EDF5'}`,
                  boxShadow: p.activo
                    ? `0 1px 2px rgba(15,23,42,0.04), 0 10px 26px ${p.color}24`
                    : '0 1px 2px rgba(15,23,42,0.03), 0 6px 18px rgba(15,23,42,0.05)',
                }}
              >
                {/* El número, en el color de la etapa. Es lo que convierte
                    cuatro botones en un recorrido. */}
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-black text-white"
                  style={{
                    background: `linear-gradient(180deg, ${p.color} 0%, ${p.color}D9 100%)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.30), 0 3px 8px ${p.color}40`,
                  }}
                >
                  {p.numero}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[13.5px] font-bold leading-tight"
                     style={{ color: p.color }}>
                    <Icono className="size-3.5 shrink-0" />
                    {p.titulo}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{p.descripcion}</p>
                </div>

                <ChevronRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-400" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
