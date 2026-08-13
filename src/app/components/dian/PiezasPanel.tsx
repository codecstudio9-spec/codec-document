import type { ReactNode, CSSProperties } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { CARD, MOV, PULSACION, aparecer } from '../../styles/contador-theme';

/**
 * Piezas sueltas del panel para contadores.
 *
 * Están juntas y no repartidas por la página porque son el vocabulario visual
 * de la herramienta: si la tarjeta de una sección se dibuja distinta de la de
 * otra, deja de leerse como un producto y pasa a leerse como pantallas
 * pegadas. Un contador nota eso aunque no sepa nombrarlo.
 */

// ── Cabecera de sección ───────────────────────────────────────────────────

export function Cabecera({
  titulo, descripcion, icono: Icono, acciones, color = '#2563EB',
}: {
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  acciones?: ReactNode;
  color?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icono && (
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${color}1F 0%, ${color}0F 100%)`,
              border: `1px solid ${color}26`,
            }}
          >
            <Icono className="size-5" style={{ color }} />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-black tracking-tight text-slate-900">{titulo}</h2>
          {descripcion && (
            <p className="mt-0.5 max-w-2xl text-[13px] leading-relaxed text-slate-500">
              {descripcion}
            </p>
          )}
        </div>
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

// ── Tarjeta ───────────────────────────────────────────────────────────────

export function Tarjeta({
  children, className = '', style, indice = 0, sinAnimar = false,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  indice?: number;
  sinAnimar?: boolean;
}) {
  if (sinAnimar) {
    return (
      <div className={className} style={{ ...CARD, ...style }}>{children}</div>
    );
  }
  return (
    <motion.div {...aparecer(indice)} className={className} style={{ ...CARD, ...style }}>
      {children}
    </motion.div>
  );
}

// ── Botón con relieve ─────────────────────────────────────────────────────

export function Boton({
  children, onClick, estilo, disabled, className = '', icono: Icono, tipo = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  /** Uno de los BOTON_* del tema. */
  estilo: CSSProperties;
  disabled?: boolean;
  className?: string;
  icono?: LucideIcon;
  tipo?: 'button' | 'submit';
}) {
  return (
    <motion.button
      type={tipo}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : PULSACION}
      transition={MOV.suave}
      style={estilo}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-[filter,opacity] hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:brightness-100 ${className}`}
    >
      {Icono && <Icono className="size-4 shrink-0" />}
      {children}
    </motion.button>
  );
}

// ── Cifra destacada ───────────────────────────────────────────────────────

/**
 * Una cifra del panel de resumen.
 *
 * `resalta` es para lo que exige acción del contador. Sólo debe encenderse
 * cuando de verdad hay algo que hacer: si tres de cuatro tarjetas gritan, el
 * ojo deja de distinguir cuál importa y la señal se pierde.
 */
export function Cifra({
  etiqueta, valor, sufijo, icono: Icono, color = '#2563EB', indice = 0, resalta = false, pie,
}: {
  etiqueta: string;
  valor: string | number;
  sufijo?: string;
  icono?: LucideIcon;
  color?: string;
  indice?: number;
  resalta?: boolean;
  pie?: string;
}) {
  return (
    <motion.div
      {...aparecer(indice)}
      className="relative overflow-hidden p-4"
      style={{
        ...CARD,
        ...(resalta
          ? { borderColor: `${color}40`, boxShadow: `0 1px 2px rgba(15,23,42,0.04), 0 12px 32px ${color}1A` }
          : null),
      }}
    >
      {/* Resplandor de esquina: da profundidad sin meter un borde de color
          que compita con el contenido. */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}1A, transparent 70%)` }}
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {etiqueta}
          </p>
          <p className="mt-1.5 text-2xl font-black leading-none tabular-nums text-slate-900">
            {typeof valor === 'number' ? valor.toLocaleString('es-CO') : valor}
            {sufijo && <span className="ml-1 text-sm font-bold text-slate-400">{sufijo}</span>}
          </p>
          {pie && <p className="mt-1.5 text-[11px] leading-snug text-slate-400">{pie}</p>}
        </div>
        {Icono && (
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${color}14` }}
          >
            <Icono className="size-4" style={{ color }} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Estado vacío ──────────────────────────────────────────────────────────

/**
 * Un hueco en blanco parece que la pantalla se rompió. Siempre se dice qué
 * falta y qué hacer — y si hay una acción, se pone aquí y no en otro sitio al
 * que haya que ir a buscarla.
 */
export function Vacio({
  icono: Icono, titulo, descripcion, accion,
}: {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={MOV.entrada}
      className="flex flex-col items-center px-6 py-14 text-center"
    >
      <div
        className="mb-4 flex size-14 items-center justify-center rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)' }}
      >
        <Icono className="size-6 text-slate-400" />
      </div>
      <p className="text-sm font-bold text-slate-700">{titulo}</p>
      {descripcion && (
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
          {descripcion}
        </p>
      )}
      {accion && <div className="mt-5">{accion}</div>}
    </motion.div>
  );
}
