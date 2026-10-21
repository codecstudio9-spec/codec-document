import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, FolderOpen, BellRing, BookOpenCheck, BarChart3, Store, Check, Loader2, Gift, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tarjeta, Boton } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_EXITO, BOTON_NEUTRO, DEGRADADO_MARCA } from '../../styles/contador-theme';
import {
  iniciarPrueba, pagarContabilidad, type EstadoContabilidad, type PlanContabilidad,
} from '../../services/contabilidad-service';

/**
 * Lo que ve quien todavía no tiene Contabilidad (o quiere cambiar de plan).
 *
 * Arriba, la prueba gratis: es lo único que hay que decidir para empezar, y
 * no pide tarjeta. Abajo, los planes en dos filas: «sólo contabilidad» y
 * «todo en uno» (contabilidad + XML). Separarlos así evita la tabla de diez
 * columnas que nadie lee.
 */

const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const BENEFICIOS = [
  { icono: Building2, titulo: 'Todas tus empresas por NIT', texto: 'Cada cliente en su carpeta, con su color y su plan de cuentas.' },
  { icono: BellRing, titulo: 'Avisos automáticos', texto: 'Al bajar los XML, el sistema los reparte por NIT y te dice cuántos llegaron a cada empresa.' },
  { icono: FolderOpen, titulo: 'Carpetas por mes', texto: 'Compras, ventas, notas, comprobantes y tus archivos, ordenados por periodo.' },
  { icono: BookOpenCheck, titulo: 'Contabilidad completa', texto: 'Causación desde el XML, comprobantes con consecutivo y saldos iniciales.' },
  { icono: BarChart3, titulo: 'Reportes', texto: 'Balance de prueba, libro diario, mayor, estados financieros, cartera e impuestos en Excel.' },
  { icono: Store, titulo: 'Conectado con Codec POS', texto: 'Las ventas y facturas de tus clientes que usan Codec POS llegan solas a su carpeta.' },
];

export function OfertaContabilidad({
  estado, onActualizado, vencido, modo = 'completo', onVerPlanes,
}: {
  estado: EstadoContabilidad;
  onActualizado: (e: EstadoContabilidad) => void;
  /** Tuvo plan y se le venció: su información sigue guardada. */
  vencido?: boolean;
  /** «planes»: sólo el estado y las tarjetas de precios (va dentro de
   *  «Planes y consumo» de Documentos DIAN, el único lugar con precios).
   *  «presentacion»: qué hace y la prueba gratis, sin precios; el botón
   *  «Ver planes y precios» lleva a ese lugar único. */
  modo?: 'completo' | 'planes' | 'presentacion';
  onVerPlanes?: () => void;
}) {
  const [anual, setAnual] = useState(false);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  const probar = async () => {
    setTrabajando('prueba');
    try {
      const e = await iniciarPrueba();
      toast.success('Listo: tienes 15 días de Contabilidad gratis');
      onActualizado(e);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude activar la prueba');
    } finally {
      setTrabajando(null);
    }
  };

  const comprar = async (p: PlanContabilidad) => {
    setTrabajando(p.code);
    try {
      window.location.href = await pagarContabilidad(p.code, anual ? 12 : 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude abrir el pago');
      setTrabajando(null);
    }
  };

  const solo = estado.planes.filter((p) => !p.incluyeDian);
  const combos = estado.planes.filter((p) => p.incluyeDian);
  const activo = estado.activo && !estado.enPrueba;

  return (
    <div className="space-y-6">
      {!activo && modo !== 'planes' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 text-white sm:p-8"
          style={{ background: DEGRADADO_MARCA, boxShadow: '0 24px 56px rgba(37,99,235,0.30)' }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
            <Sparkles className="size-3.5" /> Nuevo para contadores
          </p>
          <h2 className="mt-3 max-w-2xl text-2xl font-black leading-tight sm:text-3xl">
            {vencido ? 'Tu plan de Contabilidad venció' : 'Lleva la contabilidad de todas tus empresas en un solo lugar'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-50">
            {vencido
              ? 'Tu información sigue guardada y la puedes consultar. Para seguir agregando y contabilizando, elige un plan.'
              : 'Cada cliente por su NIT, los XML repartidos solos, carpetas por mes, comprobantes y reportes. Sin instalar nada.'}
          </p>
          {estado.pruebaDisponible ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void probar()}
                disabled={trabajando !== null}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-700 shadow-lg transition hover:brightness-95 disabled:opacity-60"
              >
                {trabajando === 'prueba' ? <Loader2 className="size-4 animate-spin" /> : <Gift className="size-4" />}
                Probar gratis 15 días
              </button>
              <span className="text-xs text-blue-100">Sin tarjeta. Hasta 30 empresas durante la prueba.</span>
            </div>
          ) : estado.enPrueba && estado.hasta ? (
            <p className="mt-4 text-sm font-bold">
              Estás en la prueba gratis hasta el {new Date(estado.hasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}.
            </p>
          ) : null}
        </motion.div>
      )}

      {!estado.activo && modo !== 'planes' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((b, i) => (
            <Tarjeta key={b.titulo} indice={i} className="flex items-start gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <b.icono className="size-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{b.titulo}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">{b.texto}</p>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}

      {modo === 'presentacion' ? (
        <div className="flex justify-center">
          <Boton estilo={BOTON_NEUTRO} className="text-slate-700" onClick={onVerPlanes}>Ver planes y precios</Boton>
        </div>
      ) : (
      <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-slate-900">{modo === 'planes' ? 'Planes de Contabilidad (Mis empresas)' : activo ? 'Cambiar o renovar plan' : 'Planes'}</h3>
        <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
          {[false, true].map((a) => (
            <button
              key={String(a)}
              type="button"
              onClick={() => setAnual(a)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${anual === a ? 'bg-blue-600 text-white' : 'text-slate-500'}`}
            >
              {a ? 'Anual' : 'Mensual'}
            </button>
          ))}
        </div>
      </div>

      {modo === 'planes' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-slate-200">
          <span className="text-slate-700">
            {estado.activo
              ? estado.enPrueba
                ? <>Estás en la <strong>prueba gratis</strong> hasta el {estado.hasta ? new Date(estado.hasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : ''}.</>
                : estado.admin && !estado.planNombre
                  ? <>Acceso de administrador, sin límite de empresas. Tienes {estado.empresasUsadas} {estado.empresasUsadas === 1 ? 'empresa' : 'empresas'}.</>
                  : <>Tu plan: <strong>{estado.planNombre}</strong>{estado.hasta ? `, vigente hasta el ${new Date(estado.hasta).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}. {estado.empresasUsadas}{estado.maxEmpresas !== null ? ` de ${estado.maxEmpresas}` : ''} {estado.empresasUsadas === 1 && estado.maxEmpresas === null ? 'empresa' : 'empresas'}.</>
              : 'Todavía no tienes Contabilidad.'}
          </span>
          {estado.pruebaDisponible && (
            <button
              type="button"
              onClick={() => void probar()}
              disabled={trabajando !== null}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {trabajando === 'prueba' ? <Loader2 className="size-3.5 animate-spin" /> : <Gift className="size-3.5" />}
              Probar gratis 15 días
            </button>
          )}
        </div>
      )}
      <FilaPlanes titulo="Sólo contabilidad" planes={solo} anual={anual} estado={estado} trabajando={trabajando} onComprar={comprar} />
      <FilaPlanes
        titulo="Todo en uno: contabilidad + XML de la DIAN"
        planes={combos}
        anual={anual}
        estado={estado}
        trabajando={trabajando}
        onComprar={comprar}
        destacado
      />
      <p className="text-center text-xs leading-relaxed text-slate-400">
        Pagas con Wompi (tarjeta, PSE, Nequi o Bancolombia). Precios en pesos colombianos, sin cobro automático:
        al terminar el periodo eliges si renuevas.
      </p>
      </>
      )}
    </div>
  );
}

function FilaPlanes({
  titulo, planes, anual, estado, trabajando, onComprar, destacado,
}: {
  titulo: string;
  planes: PlanContabilidad[];
  anual: boolean;
  estado: EstadoContabilidad;
  trabajando: string | null;
  onComprar: (p: PlanContabilidad) => void;
  destacado?: boolean;
}) {
  if (planes.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</p>
      <div className={`grid gap-4 ${planes.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {planes.map((p, i) => {
          const precio = anual ? p.precioAnual : p.precioMes;
          const actual = estado.planCode === p.code && estado.activo && !estado.enPrueba;
          return (
            <Tarjeta key={p.code} indice={i} className="flex flex-col p-5" style={destacado ? { outline: '2px solid #10B98133' } : undefined}>
              <p className="text-base font-black text-slate-900">{p.nombre}</p>
              <p className="mt-0.5 text-xs text-slate-500">{p.descripcion}</p>
              <p className="mt-4 text-2xl font-black tabular-nums text-slate-900">
                {precio ? pesos(precio) : 'No disponible'}
                <span className="ml-1 text-xs font-bold text-slate-400">/{anual ? 'año' : 'mes'}</span>
              </p>
              {anual && p.precioMes && p.precioAnual && (
                <p className="text-[11px] font-semibold text-emerald-600">
                  Equivale a {pesos(Math.round(p.precioAnual / 12))} al mes. Ahorras {pesos(p.precioMes * 12 - p.precioAnual)}
                </p>
              )}
              <ul className="mt-4 flex-1 space-y-1.5 text-[12.5px] text-slate-600">
                <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Hasta {p.maxEmpresas} empresas</li>
                {p.incluyeDian && (
                  <li className="flex gap-2">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    Plan XML {p.dianNombre}: {p.dianLimite?.toLocaleString('es-CO')} XML al mes
                  </li>
                )}
                <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Avisos y carpetas por NIT</li>
                <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Comprobantes y reportes en Excel</li>
                <li className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />Conexión con Codec POS</li>
              </ul>
              <Boton
                estilo={actual ? BOTON_NEUTRO : destacado ? BOTON_EXITO : BOTON_PRIMARIO}
                className={`mt-5 w-full ${actual ? 'text-slate-700' : 'text-white'}`}
                disabled={!precio || trabajando !== null}
                onClick={() => onComprar(p)}
              >
                {trabajando === p.code ? <Loader2 className="size-4 animate-spin" /> : null}
                {actual ? 'Renovar' : 'Elegir'}
              </Boton>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
