import { motion } from 'framer-motion';
import { FileText, DollarSign, CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ResumenMes as Datos } from '../../services/dian-service';
import { CARD, MOV, aparecer } from '../../styles/contador-theme';

/**
 * Las cifras del mes y el reparto por tipo de documento.
 *
 * ── Por qué están partidos en dos componentes ───────────────────────────
 * Las cuatro cifras viven ahora dentro de la franja azul de bienvenida y el
 * reparto por tipo vive en la columna derecha del área de trabajo. Son sitios
 * distintos de la pantalla, pero comparten los colores y los nombres de los
 * tipos, y tenerlos en dos archivos terminaría con «Nota crédito» en ámbar en
 * un lado y en naranja en el otro. Por eso siguen en el mismo archivo aunque
 * ya no se dibujen juntos.
 *
 * ── Por qué la comparación con el mes anterior ──────────────────────────
 * «1.250 documentos» no dice si fue un buen mes. «1.250, un 12 % más que el
 * anterior» sí. Y para un contador esa variación es además una señal de
 * trabajo: si un cliente le manda de golpe el doble, quiere enterarse antes de
 * cerrar el periodo, no después.
 *
 * Cuando el mes anterior está vacío no se enseña variación. Un «+100 %» sobre
 * cero es una cifra inventada.
 */

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Colores por tipo. Los mismos que usa la tabla, para que la dona y las
 *  filas se lean como lo mismo. */
export const COLOR_TIPO: Record<string, string> = {
  factura: '#2563EB',
  documento_equivalente: '#0EA5E9',
  nota_credito: '#F59E0B',
  nota_debito: '#8B5CF6',
  documento_soporte: '#10B981',
  nomina: '#EC4899',
  desconocido: '#94A3B8',
};

export const NOMBRE_TIPO: Record<string, string> = {
  factura: 'Factura',
  documento_equivalente: 'Documento equivalente',
  nota_credito: 'Nota crédito',
  nota_debito: 'Nota débito',
  documento_soporte: 'Documento soporte',
  nomina: 'Nómina',
  desconocido: 'Sin identificar',
};

function Variacion({ valor, sufijo }: { valor: number | null; sufijo?: string }) {
  if (valor === null) {
    return <span className="text-[11px] text-slate-400">Sin mes anterior que comparar</span>;
  }
  const sube = valor >= 0;
  const Icono = sube ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${sube ? 'text-emerald-600' : 'text-rose-600'}`}>
      <Icono className="size-3" />
      {sube ? '+' : ''}{valor}%{sufijo ? ` ${sufijo}` : ' vs. mes anterior'}
    </span>
  );
}

/**
 * Una casilla de la tarjeta de cifras.
 *
 * Va sin recuadro propio y separada de la siguiente por una línea fina: las
 * cuatro son una sola lectura —«así va el mes»—, y cuatro tarjetas sueltas
 * dentro de otra tarjeta se leerían como cuatro cosas distintas.
 */
function Casilla({
  etiqueta, valor, icono: Icono, color, indice, pie,
}: {
  etiqueta: string; valor: string; icono: LucideIcon; color: string; indice: number; pie?: React.ReactNode;
}) {
  return (
    <motion.div
      {...aparecer(indice)}
      className="min-w-0 px-4 py-3.5 sm:border-l sm:border-slate-100 sm:first:border-l-0"
    >
      <div className="flex items-center gap-1.5">
        <Icono className="size-3.5 shrink-0" style={{ color }} />
        <p className="truncate text-[11px] font-semibold text-slate-500">{etiqueta}</p>
      </div>
      <p className="mt-1 truncate text-[21px] font-black leading-tight tabular-nums text-slate-900">
        {valor}
      </p>
      {pie && <div className="mt-0.5 truncate">{pie}</div>}
    </motion.div>
  );
}

/**
 * Las cuatro cifras del mes, para la franja de bienvenida.
 *
 * Es lo primero que ve el contador al entrar, y por eso son éstas cuatro y no
 * otras: cuánto se procesó, qué proporción salió limpia, cuánto tiempo se
 * ahorró y cuánto dinero pasó por ahí. Las tres primeras dicen si la
 * herramienta está haciendo su trabajo; la cuarta es la que él necesita para
 * cuadrar.
 */
export function CifrasMes({ datos }: { datos: Datos }) {
  return (
    <div className="grid grid-cols-2 divide-y divide-slate-100 rounded-2xl bg-white shadow-[0_2px_4px_rgba(15,23,42,0.06),0_18px_40px_rgba(12,35,110,0.28)] ring-1 ring-white/60 sm:grid-cols-4 sm:divide-y-0">
      <Casilla
        etiqueta="Procesados"
        valor={datos.documentos.toLocaleString('es-CO')}
        icono={FileText} color="#2563EB" indice={0}
        pie={<Variacion valor={datos.variacionDocs} sufijo="vs. mes anterior" />}
      />
      <Casilla
        etiqueta="Sin observaciones"
        valor={datos.sinErroresPct === null ? '—' : `${datos.sinErroresPct}%`}
        icono={CheckCircle2} color="#0EA5E9" indice={1}
        pie={
          <span className="text-[11px] text-slate-400">
            {datos.sinErroresPct === null ? 'Todavía no hay documentos' : 'Del total del mes'}
          </span>
        }
      />
      <Casilla
        etiqueta="Tiempo ahorrado"
        // Dos minutos por documento: es lo que tarda abrir el XML, leerlo
        // y teclear las cifras en el programa contable. Se dice de dónde
        // sale, porque una cifra de ahorro sin explicar no se cree.
        valor={`${Math.round((datos.documentos * 2) / 60)} h`}
        icono={Clock} color="#8B5CF6" indice={2}
        pie={<span className="text-[11px] text-slate-400">A 2 min por documento</span>}
      />
      <Casilla
        etiqueta="Valor total"
        valor={pesos(datos.valorTotal)}
        icono={DollarSign} color="#10B981" indice={3}
        pie={<Variacion valor={datos.variacionValor} sufijo="vs. mes anterior" />}
      />
    </div>
  );
}

/** Dona por tipo. SVG puro: para cuatro segmentos, una librería de gráficas
 *  serían 40 KB de JavaScript a cambio de nada. */
function Dona({ datos, total }: { datos: Datos['porTipo']; total: number }) {
  const tamano = 128;
  const grosor = 22;
  const radio = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * radio;

  let acumulado = 0;

  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90">
        {datos.map((d) => {
          const fraccion = total > 0 ? d.cantidad / total : 0;
          const largo = circ * fraccion;
          const offset = circ * acumulado;
          acumulado += fraccion;
          return (
            <motion.circle
              key={d.tipo}
              cx={tamano / 2}
              cy={tamano / 2}
              r={radio}
              fill="none"
              stroke={COLOR_TIPO[d.tipo] ?? COLOR_TIPO.desconocido}
              strokeWidth={grosor}
              strokeDasharray={`${largo} ${circ - largo}`}
              initial={{ strokeDashoffset: 0, opacity: 0 }}
              animate={{ strokeDashoffset: -offset, opacity: 1 }}
              transition={MOV.lenta}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[20px] font-black leading-none tabular-nums text-slate-900">
          {total.toLocaleString('es-CO')}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">Total</span>
      </div>
    </div>
  );
}

/**
 * Reparto por tipo de documento.
 *
 * Ocupa la columna derecha cuando no hay nada analizándose. Es el sitio que
 * en el mockup enseña el avance del análisis: dejarlo vacío el 95 % del
 * tiempo —que es cuando el contador no está subiendo nada— habría hecho que
 * media pantalla no dijera nada.
 */
export function RepartoPorTipo({ datos }: { datos: Datos }) {
  const mes = datos.mes
    ? new Date(`${datos.mes}T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="flex h-full flex-col p-5" style={CARD}>
      <div className="mb-4 flex flex-wrap items-baseline gap-2">
        <h3 className="text-[15px] font-black text-slate-900">Documentos por tipo</h3>
        {/* `first-letter`, no `capitalize`: en español el mes se escribe
            «junio de 2026», y `capitalize` lo convierte en «Junio De 2026». */}
        {mes && (
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 first-letter:uppercase">
            {mes}
          </span>
        )}
      </div>

      {datos.porTipo.length === 0 ? (
        <p className="flex flex-1 items-center justify-center py-10 text-center text-[12.5px] text-slate-400">
          Sin documentos este mes todavía.
        </p>
      ) : (
        <div className="flex flex-1 flex-wrap items-center gap-5">
          <Dona datos={datos.porTipo} total={datos.documentos} />
          <div className="min-w-[180px] flex-1 space-y-2">
            {datos.porTipo.map((d) => {
              const pct = datos.documentos > 0
                ? Math.round((d.cantidad / datos.documentos) * 100) : 0;
              return (
                <div key={d.tipo} className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full"
                        style={{ background: COLOR_TIPO[d.tipo] ?? COLOR_TIPO.desconocido }} />
                  <span className="min-w-0 flex-1 truncate text-[12px] text-slate-600">
                    {NOMBRE_TIPO[d.tipo] ?? d.tipo}
                  </span>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums text-slate-800">
                    {d.cantidad.toLocaleString('es-CO')}
                  </span>
                  <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
