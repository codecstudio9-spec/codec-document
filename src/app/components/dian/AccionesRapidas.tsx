import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  CARD_RADIUS, CARD_SHADOW, DEGRADADO_MARCA, accionRelieve,
} from '../../styles/contador-theme';

/**
 * La fila de acciones rápidas y el banner oscuro de abajo.
 *
 * ── Por qué existen ─────────────────────────────────────────────────────
 * Son la pieza más reconocible del dashboard principal: una fila de botones
 * grandes con relieve donde los dos o tres importantes van en color y el
 * resto en blanco. Funciona porque contesta la pregunta con la que se entra
 * —«¿qué hago ahora?»— antes de que haya que leer nada.
 *
 * Aquí las cinco acciones son el recorrido del contador de punta a punta:
 * traer los XML, bajarlos de la DIAN, cruzarlos con su contabilidad y
 * llevarse el Excel. Vistas juntas cuentan lo que la herramienta hace; ése
 * era el trabajo de los cuatro pasos numerados que hubo antes, hecho ahora
 * con botones que además sirven para algo.
 *
 * ── Sobre los colores ───────────────────────────────────────────────────
 * Sólo van en color las que MUEVEN documentos. Cinco botones de colores
 * distintos son cinco cosas gritando a la vez y ninguna destaca; en blanco,
 * las secundarias siguen estando a un clic sin competir.
 */

export type VarianteAccion = 'principal' | 'descarga' | 'auditor' | 'excel' | 'neutra';

export interface Accion {
  id: string;
  etiqueta: string;
  icono: LucideIcon;
  variante: VarianteAccion;
  onClick: () => void;
  /** Insignia en la esquina, como el «NUEVO» de Cotizaciones. */
  insignia?: string;
  bloqueada?: boolean;
}

/**
 * El relieve por variante.
 *
 * Los cuatro colores son los de su etapa en el resto de la pantalla, no una
 * paleta decorativa: el azul es traer documentos, el violeta es la DIAN, el
 * ámbar es revisar y el verde es entregar —el mismo verde del botón
 * «Descargar Excel» de la tabla y del botón DIAN del dashboard principal—.
 *
 * La fila entera va en color a propósito. Se probó con las dos últimas en
 * blanco y no se leían como parte del recorrido: parecían dos botones
 * secundarios pegados detrás de dos importantes, cuando cruzar la
 * contabilidad y sacar el Excel son justo el final del trabajo del mes.
 */
function fondo(v: VarianteAccion) {
  if (v === 'principal') {
    return { background: DEGRADADO_MARCA, boxShadow: '0 14px 28px rgba(37,99,235,0.30)' };
  }
  if (v === 'descarga') return accionRelieve('#4338CA', '#6366F1', '67,56,202');
  if (v === 'auditor') return accionRelieve('#B45309', '#F59E0B', '180,83,9');
  if (v === 'excel') return accionRelieve('#047857', '#10B981', '5,150,105');
  return { background: '#FFFFFF', boxShadow: CARD_SHADOW };
}

export function AccionesRapidas({ acciones }: { acciones: Accion[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {acciones.map((a) => {
        const Icono = a.icono;
        const esNeutra = a.variante === 'neutra';
        return (
          <motion.button
            key={a.id}
            whileHover={a.bloqueada ? undefined : { y: -2 }}
            whileTap={a.bloqueada ? undefined : { scale: 0.98 }}
            type="button"
            onClick={a.onClick}
            disabled={a.bloqueada}
            className="relative flex items-center gap-3 overflow-hidden p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
            style={{ borderRadius: CARD_RADIUS, ...fondo(a.variante) }}
          >
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: esNeutra ? '#EFF6FF' : 'rgba(255,255,255,0.18)',
                boxShadow: esNeutra ? undefined : 'inset 0 1px 0 rgba(255,255,255,0.45)',
              }}
            >
              <Icono className="size-4.5" style={{ color: esNeutra ? '#2563EB' : '#fff' }} />
            </div>
            <span
              className="min-w-0 flex-1 text-sm font-bold"
              style={{
                color: esNeutra ? '#111827' : '#fff',
                // Sombra bajo el texto: lo despega del fondo y remata el
                // efecto de relieve.
                textShadow: esNeutra ? undefined : '0 1px 2px rgba(0,0,0,0.28)',
              }}
            >
              {a.etiqueta}
            </span>
            {a.insignia && (
              <span className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                esNeutra ? 'bg-blue-50 text-blue-700' : 'bg-white/20 text-white'
              }`}>
                <Sparkles className="size-2.5" /> {a.insignia}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Banner oscuro de ancho completo, el mismo de «Sube tus propias plantillas»
 * del dashboard principal.
 *
 * Sirve para lo que hay que contar, no sólo ofrecer: una función que el
 * contador no sabe que existe y que cambia cómo trabaja. En la fila de
 * botones sería un botón más entre cinco; aquí ocupa el ancho y tiene sitio
 * para explicar en una frase por qué le conviene.
 */
export function BannerOscuro({
  icono: Icono, titulo, descripcion, onClick,
}: {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-5 p-6 text-left"
      style={{
        borderRadius: CARD_RADIUS,
        background: 'linear-gradient(120deg,#312e81,#1e1b4b 60%,#111827)',
        boxShadow: '0 20px 40px rgba(30,27,75,0.28)',
      }}
    >
      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
        <Icono className="size-6 text-indigo-200" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-white">{titulo}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/50">{descripcion}</p>
      </div>
      <ArrowRight className="size-5 shrink-0 text-white/40" />
    </motion.button>
  );
}
