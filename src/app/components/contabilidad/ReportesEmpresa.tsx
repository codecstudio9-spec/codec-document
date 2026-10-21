import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, ChevronLeft, Loader2, Download, Scale, BookText, Library, Landmark, TrendingUp,
  HandCoins, Truck, Percent, ListOrdered, UserSearch, ChevronRight, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Cabecera, Tarjeta, Boton, Vacio } from '../dian/PiezasPanel';
import { BOTON_EXITO, CARD } from '../../styles/contador-theme';
import { saldos, movimientosPeriodo, listarComprobantes, type Empresa, type Movimiento } from '../../services/contabilidad-service';
import { nombreCuenta, type Cuenta } from '../../../lib/contabilidad/puc';
import {
  balanceDePrueba, totalesBalance, estadoDeResultados, estadoDeSituacion, saldosPorTercero, resumenImpuestos,
  hojaBalance, hojaEstado, type FilaBalance, type LineaEstado, type FilaTercero,
} from '../../../lib/contabilidad/reportes';
import { generarXlsx, type Hoja, type ValorCelda } from '../../../lib/dian/xlsx';
import { triggerDownload } from '../../utils/download';

/**
 * Reportes de la empresa, agrupados como los agrupa el contador (y como los
 * tiene Siigo): contables, libros oficiales, financieros, terceros e
 * impuestos. Cada uno se ve en pantalla y se baja en Excel.
 */

type IdReporte =
  | 'balance' | 'diario' | 'auxiliar' | 'auxiliar_tercero' | 'mayor'
  | 'situacion' | 'resultados' | 'cartera' | 'proveedores' | 'impuestos';

const GRUPOS: Array<{ titulo: string; items: Array<{ id: IdReporte; nombre: string; icono: LucideIcon; texto: string }> }> = [
  {
    titulo: 'Contables',
    items: [
      { id: 'balance', nombre: 'Balance de prueba', icono: Scale, texto: 'Saldo anterior, débitos, créditos y saldo final por cuenta' },
      { id: 'auxiliar', nombre: 'Movimiento auxiliar por cuenta', icono: ListOrdered, texto: 'Cada movimiento de una cuenta con su saldo' },
      { id: 'auxiliar_tercero', nombre: 'Auxiliar por tercero', icono: UserSearch, texto: 'Todo lo de un cliente o proveedor' },
    ],
  },
  {
    titulo: 'Libros oficiales',
    items: [
      { id: 'diario', nombre: 'Libro diario', icono: BookText, texto: 'Los comprobantes en orden de fecha' },
      { id: 'mayor', nombre: 'Libro mayor y balance', icono: Library, texto: 'Saldos por cuenta de mayor (4 dígitos)' },
    ],
  },
  {
    titulo: 'Financieros',
    items: [
      { id: 'situacion', nombre: 'Estado de situación financiera', icono: Landmark, texto: 'Activo, pasivo y patrimonio al corte' },
      { id: 'resultados', nombre: 'Estado de resultados', icono: TrendingUp, texto: 'Ingresos, costos, gastos y utilidad del periodo' },
    ],
  },
  {
    titulo: 'Clientes y proveedores',
    items: [
      { id: 'cartera', nombre: 'Cuánto me deben (clientes)', icono: HandCoins, texto: 'Saldo por cliente en cuentas 13' },
      { id: 'proveedores', nombre: 'Cuánto debo (proveedores)', icono: Truck, texto: 'Saldo por proveedor en cuentas 22 y 23' },
    ],
  },
  {
    titulo: 'Tributario',
    items: [
      { id: 'impuestos', nombre: 'Impuestos del periodo', icono: Percent, texto: 'IVA generado y descontable, retenciones por pagar' },
    ],
  },
];

const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const XLSX_TIPO = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function ReportesEmpresa({ empresa, plan }: { empresa: Empresa; plan: Cuenta[] }) {
  const [abierto, setAbierto] = useState<IdReporte | null>(null);
  const def = GRUPOS.flatMap((g) => g.items).find((i) => i.id === abierto);

  if (abierto && def) {
    return <VistaReporte id={abierto} nombre={def.nombre} empresa={empresa} plan={plan} onVolver={() => setAbierto(null)} />;
  }

  return (
    <div>
      <Cabecera titulo="Reportes" descripcion="Todos salen de los comprobantes de la empresa. Elige uno, ajusta las fechas y descárgalo en Excel." icono={BarChart3} />
      <div className="space-y-5">
        {GRUPOS.map((g, gi) => (
          <div key={g.titulo}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{g.titulo}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it, i) => (
                <motion.button
                  key={it.id}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (gi * 3 + i) * 0.02 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setAbierto(it.id)}
                  className="flex items-center gap-3 p-4 text-left"
                  style={CARD}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <it.icono className="size-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">{it.nombre}</p>
                    <p className="text-[12px] leading-snug text-slate-500">{it.texto}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-slate-300" />
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VistaReporte({
  id, nombre, empresa, plan, onVolver,
}: {
  id: IdReporte; nombre: string; empresa: Empresa; plan: Cuenta[]; onVolver: () => void;
}) {
  const hoy = new Date();
  const [desde, setDesde] = useState(`${hoy.getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(hoy.toISOString().slice(0, 10));
  const [nivel, setNivel] = useState(id === 'mayor' ? 4 : 6);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(false);
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [vista, setVista] = useState<ReactNode>(null);

  const mapa = useMemo(() => new Map(plan.map((c) => [c.codigo, c])), [plan]);
  const nombreEmpresa = empresa.nombre_comercial || empresa.razon_social;
  const encabezado = `${empresa.razon_social} · NIT ${empresa.nit}${empresa.dv ? `-${empresa.dv}` : ''} · ${nombre} · ${desde} a ${hasta}`;
  const necesitaFiltro = id === 'auxiliar' || id === 'auxiliar_tercero';

  const generar = async () => {
    if (necesitaFiltro && !filtro.trim()) {
      toast.error(id === 'auxiliar' ? 'Escribe la cuenta (o el inicio del código)' : 'Escribe el NIT del tercero');
      return;
    }
    setCargando(true);
    try {
      if (id === 'balance' || id === 'mayor') {
        const s = await saldos(empresa.id, desde, hasta);
        const filas = balanceDePrueba(s, mapa, id === 'mayor' ? 4 : nivel);
        const t = totalesBalance(s);
        setHoja(hojaBalance(nombre.slice(0, 31), filas, encabezado));
        setVista(<TablaBalance filas={filas} totales={t} />);
      } else if (id === 'situacion') {
        const s = await saldos(empresa.id, '1900-01-01', hasta);
        const r = estadoDeSituacion(s, mapa);
        setHoja(hojaEstado('Situación financiera', r.lineas, encabezado));
        setVista(<TablaEstado lineas={r.lineas} pie={r.cuadra ? 'Activo = pasivo + patrimonio' : 'Activo y pasivo + patrimonio no coinciden: revisa los saldos iniciales'} ok={r.cuadra} />);
      } else if (id === 'resultados') {
        const s = await saldos(empresa.id, desde, hasta);
        const r = estadoDeResultados(s, mapa);
        setHoja(hojaEstado('Estado de resultados', r.lineas, encabezado));
        setVista(<TablaEstado lineas={r.lineas} />);
      } else if (id === 'cartera' || id === 'proveedores') {
        const s = await saldos(empresa.id, desde, hasta, true);
        const filas = saldosPorTercero(s, id === 'cartera' ? ['13'] : ['22', '23']);
        setHoja({
          nombre: id === 'cartera' ? 'Cartera' : 'Proveedores',
          encabezados: ['NIT', 'Tercero', 'Cuentas', 'Saldo'],
          filas: [[encabezado, '', '', ''], ...filas.map((f) => [f.nit, f.nombre, f.cuentas.join(', '), f.saldo] as ValorCelda[])],
          anchos: [14, 44, 24, 18],
        });
        setVista(<TablaTerceros filas={filas} />);
      } else if (id === 'impuestos') {
        const s = await saldos(empresa.id, desde, hasta);
        const filas = resumenImpuestos(s);
        setHoja({
          nombre: 'Impuestos',
          encabezados: ['Concepto', 'Cuenta', 'Valor'],
          filas: [[encabezado, '', ''], ...filas.map((f) => [f.concepto, f.cuenta, f.valor] as ValorCelda[])],
          anchos: [52, 12, 18],
        });
        setVista(
          <table className="w-full text-sm" translate="no">
            <tbody>
              {filas.map((f) => (
                <tr key={f.concepto} className="border-t border-slate-100">
                  <td className="py-2.5 pr-3">{f.concepto}</td>
                  <td className="py-2.5 pr-3 font-mono text-xs text-slate-400">{f.cuenta}</td>
                  <td className="py-2.5 text-right font-semibold tabular-nums">{pesos(f.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>,
        );
      } else if (id === 'diario') {
        const [m, comps] = await Promise.all([movimientosPeriodo(empresa.id, desde, hasta), listarComprobantes(empresa.id, desde, hasta)]);
        setDiario(m, comps.reduce((acc, c) => acc.set(c.id, `${c.tipo}-${c.numero}`), new Map<string, string>()));
      } else {
        const filtroLimpio = filtro.replace(/[^0-9A-Za-z]/g, '');
        const m = await movimientosPeriodo(empresa.id, desde, hasta, id === 'auxiliar' ? { cuenta: filtroLimpio } : { tercero: filtroLimpio });
        // El saldo anterior al periodo, para que el auxiliar arranque donde
        // de verdad estaba la cuenta y no en cero.
        const s = await saldos(empresa.id, desde, hasta, id === 'auxiliar_tercero');
        const anterior = s
          .filter((x) => (id === 'auxiliar' ? x.cuenta.startsWith(filtroLimpio) : x.tercero_nit === filtroLimpio))
          .reduce((v, x) => v + x.anterior, 0);
        setAuxiliar(m, anterior);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude generar el reporte');
    } finally {
      setCargando(false);
    }
  };

  const setDiario = (m: Movimiento[], numeros: Map<string, string>) => {
    setHoja({
      nombre: 'Libro diario',
      encabezados: ['Fecha', 'Comprobante', 'Cuenta', 'Nombre cuenta', 'Tercero', 'Detalle', 'Débito', 'Crédito'],
      filas: [[encabezado, '', '', '', '', '', '', ''], ...m.map((x) => [x.fecha, numeros.get(x.comprobante_id) ?? '', x.cuenta, nombreCuenta(x.cuenta, mapa),
        x.tercero_nombre || x.tercero_nit || '', x.detalle ?? '', Number(x.debito), Number(x.credito)] as ValorCelda[])],
      anchos: [12, 12, 10, 34, 30, 40, 15, 15],
    });
    setVista(<TablaMovs movs={m} mapa={mapa} numeros={numeros} />);
  };

  const setAuxiliar = (m: Movimiento[], anterior: number) => {
    let saldo = anterior;
    const filas = m.map((x) => {
      saldo += Number(x.debito) - Number(x.credito);
      return { ...x, saldo };
    });
    setHoja({
      nombre: 'Auxiliar',
      encabezados: ['Fecha', 'Cuenta', 'Nombre cuenta', 'Tercero', 'Detalle', 'Débito', 'Crédito', 'Saldo (Db − Cr)'],
      filas: [
        [encabezado, '', '', '', '', '', '', ''],
        ['', '', '', '', 'Saldo anterior', '', '', anterior],
        ...filas.map((x) => [x.fecha, x.cuenta, nombreCuenta(x.cuenta, mapa), x.tercero_nombre || x.tercero_nit || '', x.detalle ?? '',
          Number(x.debito), Number(x.credito), Math.round(x.saldo * 100) / 100] as ValorCelda[]),
      ],
      anchos: [12, 10, 34, 30, 40, 15, 15, 16],
    });
    setVista(<TablaMovs movs={filas} mapa={mapa} anterior={anterior} />);
  };

  useEffect(() => { if (!necesitaFiltro) void generar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const descargar = () => {
    if (!hoja) return;
    void triggerDownload(new Blob([generarXlsx([hoja])], { type: XLSX_TIPO }),
      `${nombre} ${nombreEmpresa} ${desde} a ${hasta}.xlsx`.replace(/[\\/:*?"<>|]/g, ''));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onVolver} className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-bold text-slate-500 hover:bg-white">
          <ChevronLeft className="size-4" /> Reportes
        </button>
        <h2 className="text-lg font-black text-slate-900">{nombre}</h2>
      </div>
      <Tarjeta className="mb-4 flex flex-wrap items-end gap-3 p-4" sinAnimar>
        {id !== 'situacion' && (
          <label className="text-xs font-semibold text-slate-500">Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </label>
        )}
        <label className="text-xs font-semibold text-slate-500">{id === 'situacion' ? 'Corte a' : 'Hasta'}
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </label>
        {id === 'balance' && (
          <label className="text-xs font-semibold text-slate-500">Nivel
            <select value={nivel} onChange={(e) => setNivel(Number(e.target.value))} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value={1}>Clase</option><option value={2}>Grupo</option><option value={4}>Cuenta</option>
              <option value={6}>Subcuenta</option><option value={0}>Auxiliar (todo)</option>
            </select>
          </label>
        )}
        {necesitaFiltro && (
          <label className="text-xs font-semibold text-slate-500">{id === 'auxiliar' ? 'Cuenta' : 'NIT del tercero'}
            <input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder={id === 'auxiliar' ? '1105' : '900123456'} className="mt-1 block w-40 rounded-xl border border-slate-200 px-3 py-2 font-mono text-sm" />
          </label>
        )}
        <Boton estilo={BOTON_EXITO} className="text-white" disabled={cargando} onClick={() => void generar()}>
          {cargando ? <Loader2 className="size-4 animate-spin" /> : null} Generar
        </Boton>
        {hoja && (
          <button type="button" onClick={descargar} className="ml-auto flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
            <Download className="size-4" /> Descargar Excel
          </button>
        )}
      </Tarjeta>
      <Tarjeta className="overflow-x-auto p-5" sinAnimar>
        {cargando ? (
          <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
        ) : vista ?? (
          <Vacio icono={BarChart3} titulo="Elige las fechas y pulsa Generar" />
        )}
      </Tarjeta>
    </div>
  );
}

function TablaBalance({ filas, totales }: { filas: FilaBalance[]; totales: { debitos: number; creditos: number; cuadra: boolean } }) {
  if (filas.length === 0) return <Vacio icono={Scale} titulo="Sin movimientos en estas fechas" />;
  return (
    <>
      <table className="w-full min-w-[720px] text-[13px]" translate="no">
        <thead>
          <tr className="text-left text-xs text-slate-400">
            <th className="py-2 pr-3">Código</th><th className="py-2 pr-3">Cuenta</th><th className="py-2 pr-3 text-right">Saldo anterior</th>
            <th className="py-2 pr-3 text-right">Débitos</th><th className="py-2 pr-3 text-right">Créditos</th><th className="py-2 text-right">Saldo final</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.codigo} className={`border-t border-slate-100 ${f.nivel <= 2 ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
              <td className="py-1.5 pr-3 font-mono" style={{ paddingLeft: Math.min(f.nivel, 8) * 2 }}>{f.codigo}</td>
              <td className="max-w-[280px] truncate py-1.5 pr-3">{f.nombre}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{pesos(f.anterior)}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{pesos(f.debitos)}</td>
              <td className="py-1.5 pr-3 text-right tabular-nums">{pesos(f.creditos)}</td>
              <td className="py-1.5 text-right tabular-nums">{pesos(f.final)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={`mt-4 flex items-center gap-2 text-sm font-bold ${totales.cuadra ? 'text-emerald-700' : 'text-rose-600'}`}>
        {totales.cuadra ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
        Movimiento del periodo: débitos {pesos(totales.debitos)} · créditos {pesos(totales.creditos)}
      </p>
    </>
  );
}

function TablaEstado({ lineas, pie, ok }: { lineas: LineaEstado[]; pie?: string; ok?: boolean }) {
  return (
    <>
      <table className="w-full text-sm" translate="no">
        <tbody>
          {lineas.map((l, i) => (
            <tr
              key={i}
              className={l.tipo === 'titulo' ? 'border-t-2 border-slate-200' : l.tipo === 'total' || l.tipo === 'resultado' ? 'border-t border-slate-300 bg-slate-50' : 'border-t border-slate-100'}
            >
              <td className="py-2 pr-3 font-mono text-xs text-slate-400" style={{ width: 80 }}>{l.codigo ?? ''}</td>
              <td className={`py-2 pr-3 ${l.tipo === 'cuenta' ? 'pl-4 text-slate-600' : l.tipo === 'grupo' ? 'font-semibold text-slate-800' : 'font-black text-slate-900'}`}>{l.nombre}</td>
              <td className={`py-2 text-right tabular-nums ${l.tipo === 'cuenta' ? 'text-slate-600' : 'font-bold'} ${l.valor < 0 ? 'text-rose-600' : ''}`}>{pesos(l.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pie && <p className={`mt-4 text-sm font-bold ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>{pie}</p>}
    </>
  );
}

function TablaTerceros({ filas }: { filas: FilaTercero[] }) {
  if (filas.length === 0) return <Vacio icono={HandCoins} titulo="No hay saldos pendientes con terceros" />;
  const total = filas.reduce((v, f) => v + f.saldo, 0);
  return (
    <table className="w-full text-sm" translate="no">
      <thead><tr className="text-left text-xs text-slate-400"><th className="py-2 pr-3">NIT</th><th className="py-2 pr-3">Tercero</th><th className="py-2 text-right">Saldo</th></tr></thead>
      <tbody>
        {filas.map((f) => (
          <tr key={f.nit} className="border-t border-slate-100">
            <td className="py-2 pr-3 font-mono text-xs">{f.nit}</td>
            <td className="py-2 pr-3">{f.nombre}</td>
            <td className="py-2 text-right font-semibold tabular-nums">{pesos(f.saldo)}</td>
          </tr>
        ))}
        <tr className="border-t-2 border-slate-200 font-black"><td /><td className="py-2">Total</td><td className="py-2 text-right tabular-nums">{pesos(total)}</td></tr>
      </tbody>
    </table>
  );
}

function TablaMovs({ movs, mapa, numeros, anterior }: {
  movs: Array<Movimiento & { saldo?: number }>; mapa: Map<string, Cuenta>; numeros?: Map<string, string>; anterior?: number;
}) {
  if (movs.length === 0) return <Vacio icono={BookText} titulo="Sin movimientos en estas fechas" />;
  return (
    <table className="w-full min-w-[760px] text-[12.5px]" translate="no">
      <thead>
        <tr className="text-left text-xs text-slate-400">
          <th className="py-2 pr-3">Fecha</th>{numeros && <th className="py-2 pr-3">Comp.</th>}<th className="py-2 pr-3">Cuenta</th>
          <th className="py-2 pr-3">Tercero</th><th className="py-2 pr-3">Detalle</th><th className="py-2 pr-3 text-right">Débito</th>
          <th className="py-2 pr-3 text-right">Crédito</th>{anterior !== undefined && <th className="py-2 text-right">Saldo</th>}
        </tr>
      </thead>
      <tbody>
        {anterior !== undefined && (
          <tr className="border-t border-slate-100 bg-slate-50 font-semibold">
            <td colSpan={6} className="py-1.5 pr-3">Saldo anterior</td><td className="py-1.5 text-right tabular-nums">{pesos(anterior)}</td>
          </tr>
        )}
        {movs.slice(0, 3000).map((m) => (
          <tr key={m.id} className="border-t border-slate-100">
            <td className="py-1.5 pr-3 text-slate-500">{m.fecha}</td>
            {numeros && <td className="py-1.5 pr-3 font-mono font-bold">{numeros.get(m.comprobante_id)}</td>}
            <td className="py-1.5 pr-3"><span className="font-mono font-bold">{m.cuenta}</span> <span className="text-slate-400">{nombreCuenta(m.cuenta, mapa)}</span></td>
            <td className="max-w-[160px] truncate py-1.5 pr-3">{m.tercero_nombre || m.tercero_nit || ''}</td>
            <td className="max-w-[200px] truncate py-1.5 pr-3 text-slate-500">{m.detalle ?? ''}</td>
            <td className="py-1.5 pr-3 text-right tabular-nums">{Number(m.debito) ? pesos(Number(m.debito)) : ''}</td>
            <td className="py-1.5 pr-3 text-right tabular-nums">{Number(m.credito) ? pesos(Number(m.credito)) : ''}</td>
            {m.saldo !== undefined && <td className="py-1.5 text-right tabular-nums">{pesos(m.saldo)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
