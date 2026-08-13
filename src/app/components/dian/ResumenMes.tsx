import { motion } from 'framer-motion';
import { FileText, DollarSign, CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ResumenMes as Datos } from '../../services/dian-service';
import { CARD, MOV, aparecer } from '../../styles/contador-theme';

/**
 * Resumen del mes y reparto por tipo de documento.
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
const COLOR_TIPO: Record<string, string> = {
  factura: '#2563EB',
  documento_equivalente: '#0EA5E9',
  nota_credito: '#F59E0B',
  nota_debito: '#8B5CF6',
  documento_soporte: '#10B981',
  nomina: '#EC4899',
  desconocido: '#94A3B8',
};

const NOMBRE_TIPO: Record<string, string> = {
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

function Metrica({
  etiqueta, valor, icono: Icono, color, indice, pie,
}: {
  etiqueta: string; valor: string; icono: LucideIcon; color: string; indice: number; pie?: React.ReactNode;
}) {
  return (
    <motion.div {...aparecer(indice)} className="p-3.5" style={CARD}>
      <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: `${color}14` }}>
        <Icono className="size-4" style={{ color }} />
      </div>
      <p className="mt-2.5 text-[11px] font-semibold text-slate-500">{etiqueta}</p>
      <p className="mt-0.5 truncate text-[19px] font-black leading-tight tabular-nums text-slate-900">
        {valor}
      </p>
      {pie && <div className="mt-1">{pie}</div>}
    </motion.div>
  );
}

/** Dona por tipo. SVG puro: para cuatro segmentos, una librería de gráficas
 *  serían 40 KB de JavaScript a cambio de nada. */
function Dona({ datos, total }: { datos: Datos['porTipo']; total: number }) {
  const tamano = 148;
  const grosor = 26;
  const radio = (tamano - grosor) / 2;
  const circ = 2 * Math.PI * radio;

  let acumulado = 0;

  return (
    <div className="relative shrink-0" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90">
        <circle cx={tamano / 2} cy={tamano / 2} r={radio} fill="none"
                stroke="rgba(15,23,42,0.05)" strokeWidth={grosor} />
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
        <span className="text-[22px] font-black leading-none tabular-nums text-slate-900">
          {total.toLocaleString('es-CO')}
        </span>
        <span className="text-[11px] font-semibold text-slate-400">Total</span>
      </div>
    </div>
  );
}

export function ResumenMes({ datos }: { datos: Datos }) {
  const mes = datos.mes
    ? new Date(`${datos.mes}T12:00:00`).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Cifras del mes */}
      <div>
        <div className="mb-3 flex flex-wrap items-baseline gap-2">
          <h3 className="text-[15px] font-black text-slate-900">Resumen del mes</h3>
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-slate-500">
            {mes}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metrica
            etiqueta="Documentos procesados"
            valor={datos.documentos.toLocaleString('es-CO')}
            icono={FileText} color="#2563EB" indice={0}
            pie={<Variacion valor={datos.variacionDocs} />}
          />
          <Metrica
            etiqueta="Valor total"
            valor={pesos(datos.valorTotal)}
            icono={DollarSign} color="#10B981" indice={1}
            pie={<Variacion valor={datos.variacionValor} />}
          />
          <Metrica
            etiqueta="Sin observaciones"
            valor={datos.sinErroresPct === null ? '—' : `${datos.sinErroresPct}%`}
            icono={CheckCircle2} color="#0EA5E9" indice={2}
            pie={
              <span className="text-[11px] text-slate-400">
                {datos.sinErroresPct === null
                  ? 'Todavía no hay documentos'
                  : 'Del total del mes'}
              </span>
            }
          />
          <Metrica
            etiqueta="Tiempo ahorrado"
            // Dos minutos por documento: es lo que tarda abrir el XML, leerlo
            // y teclear las cifras en el programa contable. Se dice de dónde
            // sale, porque una cifra de ahorro sin explicar no se cree.
            valor={`${Math.round((datos.documentos * 2) / 60)} h`}
            icono={Clock} color="#8B5CF6" indice={3}
            pie={<span className="text-[11px] text-slate-400">A 2 min por documento</span>}
          />
        </div>
      </div>

      {/* Reparto por tipo */}
      <motion.div {...aparecer(4)} className="p-4" style={CARD}>
        <h3 className="mb-3 text-[15px] font-black text-slate-900">Documentos por tipo</h3>
        {datos.porTipo.length === 0 ? (
          <p className="py-8 text-center text-[12.5px] text-slate-400">
            Sin documentos este mes todavía.
          </p>
        ) : (
          <div className="flex items-center gap-4">
            <Dona datos={datos.porTipo} total={datos.documentos} />
            <div className="min-w-0 flex-1 space-y-2">
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
      </motion.div>
    </div>
  );
}
