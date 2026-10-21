import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen, Plus, Loader2, ChevronDown, Trash2, X, CheckCircle2, AlertTriangle, Ban, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Cabecera, Tarjeta, Boton, Vacio } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_NEUTRO } from '../../styles/contador-theme';
import {
  listarComprobantes, movimientosDe, guardarComprobante, anularComprobante, TIPOS_COMPROBANTE,
  type Empresa, type Comprobante, type Movimiento, type MovimientoEntrada,
} from '../../services/contabilidad-service';
import { nombreCuenta, type Cuenta } from '../../../lib/contabilidad/puc';
import { generarXlsx, type ValorCelda } from '../../../lib/dian/xlsx';
import { triggerDownload } from '../../utils/download';

/**
 * Comprobantes contables de la empresa: la lista del periodo y el editor.
 *
 * El editor valida en vivo lo mismo que valida la base (que cuadre, que cada
 * renglón tenga cuenta y sólo débito o crédito), para que el contador no se
 * entere del error hasta pulsar Guardar. La base vuelve a comprobarlo de
 * todos modos: la pantalla se puede saltar, la base no.
 */

const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 2 });
const hoyIso = () => new Date().toISOString().slice(0, 10);

export function ComprobantesEmpresa({
  empresa, plan, puedeEditar, inicial,
}: {
  empresa: Empresa;
  plan: Cuenta[];
  puedeEditar: boolean;
  /** Abrir directamente el editor de saldos iniciales. */
  inicial?: 'saldos';
}) {
  const hoy = new Date();
  const [desde, setDesde] = useState(`${hoy.getFullYear()}-01-01`);
  const [hasta, setHasta] = useState(hoyIso());
  const [lista, setLista] = useState<Comprobante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [movs, setMovs] = useState<Map<string, Movimiento[]>>(new Map());
  const [editor, setEditor] = useState<{ tipo: string; id?: string; inicial?: Movimiento[]; fecha?: string; descripcion?: string } | null>(
    inicial === 'saldos' ? { tipo: 'SI' } : null,
  );
  const [tipoFiltro, setTipoFiltro] = useState('');

  const mapaPlan = useMemo(() => new Map(plan.map((c) => [c.codigo, c])), [plan]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setLista(await listarComprobantes(empresa.id, desde, hasta));
      setMovs(new Map());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude cargar los comprobantes');
    } finally {
      setCargando(false);
    }
  }, [empresa.id, desde, hasta]);

  useEffect(() => { void cargar(); }, [cargar]);

  const abrir = async (c: Comprobante) => {
    if (abierto === c.id) { setAbierto(null); return; }
    setAbierto(c.id);
    if (!movs.has(c.id)) {
      const m = await movimientosDe([c.id]);
      setMovs((prev) => new Map(prev).set(c.id, m));
    }
  };

  const anular = async (c: Comprobante) => {
    if (!window.confirm(`¿Anular ${c.tipo}-${c.numero}? El número se conserva y sus movimientos se quitan.`)) return;
    try {
      await anularComprobante(c.id);
      toast.success('Comprobante anulado');
      await cargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude anular');
    }
  };

  const exportar = async () => {
    const vivos = lista.filter((c) => !c.anulado && (!tipoFiltro || c.tipo === tipoFiltro));
    const m = await movimientosDe(vivos.map((c) => c.id));
    const porId = new Map(vivos.map((c) => [c.id, c]));
    const bytes = generarXlsx([{
      nombre: 'Comprobantes',
      encabezados: ['Tipo', 'Número', 'Fecha', 'Cuenta', 'Nombre cuenta', 'NIT tercero', 'Tercero', 'Documento', 'Detalle', 'Débito', 'Crédito', 'Base', 'Centro de costo'],
      filas: m.map((x) => {
        const c = porId.get(x.comprobante_id)!;
        return [c.tipo, c.numero, x.fecha, x.cuenta, nombreCuenta(x.cuenta, mapaPlan), x.tercero_nit ?? '', x.tercero_nombre ?? '',
          x.documento ?? '', x.detalle ?? '', Number(x.debito), Number(x.credito), Number(x.base ?? 0), x.centro_costo ?? ''] as ValorCelda[];
      }),
      anchos: [6, 8, 12, 10, 34, 14, 30, 16, 40, 15, 15, 15, 12],
    }]);
    void triggerDownload(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `Comprobantes ${empresa.nombre_comercial || empresa.razon_social} ${desde} a ${hasta}.xlsx`.replace(/[\\/:*?"<>|]/g, ''));
  };

  const visibles = lista.filter((c) => !tipoFiltro || c.tipo === tipoFiltro);

  return (
    <div>
      <Cabecera
        titulo="Comprobantes"
        descripcion="Los asientos de la empresa con su consecutivo por tipo. Los de causación se crean solos desde los XML."
        icono={BookOpen}
        acciones={(
          <>
            <Boton estilo={BOTON_NEUTRO} className="text-slate-700" icono={Download} onClick={() => void exportar()} disabled={visibles.length === 0}>
              Excel
            </Boton>
            {puedeEditar && (
              <Boton estilo={BOTON_PRIMARIO} className="text-white" icono={Plus} onClick={() => setEditor({ tipo: 'NC' })}>
                Nuevo comprobante
              </Boton>
            )}
          </>
        )}
      />

      <Tarjeta className="mb-4 flex flex-wrap items-end gap-3 p-4" sinAnimar>
        <label className="text-xs font-semibold text-slate-500">Desde
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-500">Hasta
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold text-slate-500">Tipo
          <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm">
            <option value="">Todos</option>
            {TIPOS_COMPROBANTE.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.nombre}</option>)}
          </select>
        </label>
        {puedeEditar && (
          <button type="button" onClick={() => setEditor({ tipo: 'SI' })} className="ml-auto text-xs font-bold text-blue-600 hover:underline">
            Registrar saldos iniciales
          </button>
        )}
      </Tarjeta>

      {cargando ? (
        <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
      ) : visibles.length === 0 ? (
        <Tarjeta><Vacio icono={BookOpen} titulo="Sin comprobantes en estas fechas" descripcion="Causa los XML de la empresa o crea un comprobante manual." /></Tarjeta>
      ) : (
        <Tarjeta className="divide-y divide-slate-100 overflow-hidden" sinAnimar>
          {visibles.map((c) => (
            <div key={c.id}>
              <button type="button" onClick={() => void abrir(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                <span className={`w-20 shrink-0 font-mono text-sm font-black ${c.anulado ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{c.tipo}-{c.numero}</span>
                <span className="w-24 shrink-0 text-xs text-slate-500">{c.fecha}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{c.descripcion}</span>
                {c.origen !== 'manual' && (
                  <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold uppercase text-slate-500 sm:inline">
                    {c.origen === 'xml' ? 'XML' : c.origen === 'pos' ? 'POS' : c.origen === 'saldos' ? 'Saldos' : c.origen}
                  </span>
                )}
                <span className="w-32 shrink-0 text-right text-sm font-semibold tabular-nums">{pesos(Number(c.total))}</span>
                <ChevronDown className={`size-4 shrink-0 text-slate-300 transition ${abierto === c.id ? 'rotate-180' : ''}`} />
              </button>
              {abierto === c.id && (
                <div className="bg-slate-50/60 px-4 pb-4">
                  {!movs.has(c.id) ? (
                    <Loader2 className="mx-auto my-3 size-5 animate-spin text-slate-300" />
                  ) : (
                    <>
                      <TablaMovimientos movs={movs.get(c.id)!} plan={mapaPlan} />
                      {puedeEditar && !c.anulado && (
                        <div className="mt-3 flex gap-2">
                          {c.origen === 'manual' || c.origen === 'saldos' ? (
                            <Boton
                              estilo={BOTON_NEUTRO}
                              className="text-slate-700"
                              onClick={() => setEditor({ tipo: c.tipo, id: c.id, inicial: movs.get(c.id), fecha: c.fecha, descripcion: c.descripcion ?? '' })}
                            >
                              Editar
                            </Boton>
                          ) : null}
                          <Boton estilo={BOTON_NEUTRO} className="text-rose-600" icono={Ban} onClick={() => void anular(c)}>Anular</Boton>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </Tarjeta>
      )}

      {editor && (
        <EditorComprobante
          empresa={empresa}
          plan={plan}
          tipoInicial={editor.tipo}
          id={editor.id}
          inicial={editor.inicial}
          fechaInicial={editor.fecha}
          descripcionInicial={editor.descripcion}
          onCerrar={() => setEditor(null)}
          onGuardado={() => { setEditor(null); void cargar(); }}
        />
      )}
    </div>
  );
}

function TablaMovimientos({ movs, plan }: { movs: Movimiento[]; plan: Map<string, Cuenta> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-[12px]" translate="no">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-500">
            <th className="px-3 py-2">Cuenta</th><th className="px-3 py-2">Tercero</th><th className="px-3 py-2">Detalle</th>
            <th className="px-3 py-2 text-right">Débito</th><th className="px-3 py-2 text-right">Crédito</th>
          </tr>
        </thead>
        <tbody>
          {movs.map((m) => (
            <tr key={m.id} className="border-t border-slate-100">
              <td className="px-3 py-1.5"><span className="font-mono font-bold">{m.cuenta}</span> <span className="text-slate-400">{nombreCuenta(m.cuenta, plan)}</span></td>
              <td className="px-3 py-1.5 text-slate-600">{m.tercero_nombre || m.tercero_nit || ''}</td>
              <td className="max-w-[220px] truncate px-3 py-1.5 text-slate-500">{m.detalle || m.documento || ''}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{Number(m.debito) ? pesos(Number(m.debito)) : ''}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{Number(m.credito) ? pesos(Number(m.credito)) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Renglon = { cuenta: string; tercero_nit: string; tercero_nombre: string; detalle: string; debito: string; credito: string };
const vacio = (): Renglon => ({ cuenta: '', tercero_nit: '', tercero_nombre: '', detalle: '', debito: '', credito: '' });
const num = (v: string) => Number(v.replace(/\./g, '').replace(',', '.')) || 0;

function EditorComprobante({
  empresa, plan, tipoInicial, id, inicial, fechaInicial, descripcionInicial, onCerrar, onGuardado,
}: {
  empresa: Empresa;
  plan: Cuenta[];
  tipoInicial: string;
  id?: string;
  inicial?: Movimiento[];
  fechaInicial?: string;
  descripcionInicial?: string;
  onCerrar: () => void;
  onGuardado: () => void;
}) {
  const [tipo, setTipo] = useState(tipoInicial);
  const [fecha, setFecha] = useState(fechaInicial ?? hoyIso());
  const [descripcion, setDescripcion] = useState(descripcionInicial ?? (tipoInicial === 'SI' ? 'Saldos iniciales' : ''));
  const [renglones, setRenglones] = useState<Renglon[]>(() =>
    inicial?.length
      ? inicial.map((m) => ({
        cuenta: m.cuenta, tercero_nit: m.tercero_nit ?? '', tercero_nombre: m.tercero_nombre ?? '', detalle: m.detalle ?? '',
        // Coma decimal, como se escribe en Colombia: `num` toma el punto como
        // separador de miles.
        debito: Number(m.debito) ? String(Number(m.debito)).replace('.', ',') : '',
        credito: Number(m.credito) ? String(Number(m.credito)).replace('.', ',') : '',
      }))
      : [vacio(), vacio()]);
  const [guardando, setGuardando] = useState(false);

  const mapa = useMemo(() => new Map(plan.map((c) => [c.codigo, c])), [plan]);
  const auxiliares = useMemo(() => plan.filter((c) => c.codigo.length >= 4 && c.activa !== false), [plan]);
  const db = renglones.reduce((v, r) => v + num(r.debito), 0);
  const cr = renglones.reduce((v, r) => v + num(r.credito), 0);
  const diferencia = Math.round((db - cr) * 100) / 100;
  const problemas = renglones.filter((r) => (num(r.debito) || num(r.credito)) && (!/^\d{4,12}$/.test(r.cuenta) || (num(r.debito) && num(r.credito))));

  const set = (i: number, k: keyof Renglon, v: string) =>
    setRenglones((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const guardar = async () => {
    const movimientos: MovimientoEntrada[] = renglones
      .filter((r) => num(r.debito) || num(r.credito))
      .map((r) => ({
        cuenta: r.cuenta, tercero_nit: r.tercero_nit, tercero_nombre: r.tercero_nombre, detalle: r.detalle || descripcion,
        debito: num(r.debito), credito: num(r.credito),
      }));
    setGuardando(true);
    try {
      const res = await guardarComprobante({
        empresaId: empresa.id, tipo, fecha, descripcion, movimientos, id,
        origen: tipo === 'SI' ? 'saldos' : 'manual',
      });
      toast.success(`${tipo}-${res.numero} guardado`);
      onGuardado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude guardar');
    } finally {
      setGuardando(false);
    }
  };

  const celda = 'w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[12.5px] outline-none focus:border-blue-400';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={onCerrar}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto bg-white p-5 sm:rounded-3xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">
            {id ? 'Editar comprobante' : tipo === 'SI' ? 'Saldos iniciales' : 'Nuevo comprobante'}
          </h3>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button>
        </div>

        {tipo === 'SI' && !id && (
          <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-900">
            Registra el saldo con que arranca cada cuenta (el balance de cierre del sistema anterior), con la fecha del día
            anterior al primer mes que llevarás aquí. Las cuentas de clientes y proveedores, con su tercero.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-[160px_160px_1fr]">
          <label className="text-xs font-semibold text-slate-500">Tipo
            <select value={tipo} disabled={Boolean(id)} onChange={(e) => setTipo(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              {TIPOS_COMPROBANTE.map((t) => <option key={t.id} value={t.id}>{t.id} · {t.nombre}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-semibold text-slate-500">Descripción
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </label>
        </div>

        <datalist id="cuentas-puc">
          {auxiliares.map((c) => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
        </datalist>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px]" translate="no">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <th className="px-1 pb-1.5">Cuenta</th><th className="px-1 pb-1.5">NIT tercero</th><th className="px-1 pb-1.5">Nombre tercero</th>
                <th className="px-1 pb-1.5">Detalle</th><th className="px-1 pb-1.5 text-right">Débito</th><th className="px-1 pb-1.5 text-right">Crédito</th><th />
              </tr>
            </thead>
            <tbody>
              {renglones.map((r, i) => (
                <tr key={i} className="align-top">
                  <td className="w-44 px-1 py-1">
                    <input list="cuentas-puc" value={r.cuenta} inputMode="numeric" onChange={(e) => set(i, 'cuenta', e.target.value.replace(/[^0-9]/g, ''))} className={`${celda} font-mono`} placeholder="110505" />
                    {r.cuenta && <p className="mt-0.5 truncate text-[10.5px] text-slate-400">{nombreCuenta(r.cuenta, mapa)}</p>}
                  </td>
                  <td className="w-32 px-1 py-1"><input value={r.tercero_nit} onChange={(e) => set(i, 'tercero_nit', e.target.value)} className={celda} /></td>
                  <td className="px-1 py-1"><input value={r.tercero_nombre} onChange={(e) => set(i, 'tercero_nombre', e.target.value)} className={celda} /></td>
                  <td className="px-1 py-1"><input value={r.detalle} onChange={(e) => set(i, 'detalle', e.target.value)} className={celda} /></td>
                  <td className="w-32 px-1 py-1"><input value={r.debito} inputMode="decimal" onChange={(e) => set(i, 'debito', e.target.value)} className={`${celda} text-right`} /></td>
                  <td className="w-32 px-1 py-1"><input value={r.credito} inputMode="decimal" onChange={(e) => set(i, 'credito', e.target.value)} className={`${celda} text-right`} /></td>
                  <td className="w-8 px-1 py-1">
                    {renglones.length > 2 && (
                      <button type="button" onClick={() => setRenglones((rs) => rs.filter((_, j) => j !== i))} className="rounded p-1 text-slate-300 hover:text-rose-500" aria-label="Quitar renglón">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setRenglones((rs) => [...rs, vacio()])} className="mt-2 flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
          <Plus className="size-3.5" /> Agregar renglón
        </button>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap gap-5 text-sm">
            <span>Débitos <strong className="tabular-nums">{pesos(db)}</strong></span>
            <span>Créditos <strong className="tabular-nums">{pesos(cr)}</strong></span>
            {diferencia === 0 && db > 0 ? (
              <span className="flex items-center gap-1 font-bold text-emerald-700"><CheckCircle2 className="size-4" /> Cuadra</span>
            ) : (
              <span className="flex items-center gap-1 font-bold text-rose-600"><AlertTriangle className="size-4" /> Diferencia {pesos(diferencia)}</span>
            )}
          </div>
          <Boton
            estilo={BOTON_PRIMARIO}
            className="text-white"
            disabled={guardando || diferencia !== 0 || db === 0 || problemas.length > 0}
            onClick={() => void guardar()}
          >
            {guardando ? <Loader2 className="size-4 animate-spin" /> : null}
            Guardar comprobante
          </Boton>
        </div>
        {problemas.length > 0 && (
          <p className="mt-2 text-xs text-rose-600">Revisa los renglones: cada uno necesita una cuenta de al menos 4 dígitos y sólo débito o sólo crédito.</p>
        )}
      </motion.div>
    </div>
  );
}
