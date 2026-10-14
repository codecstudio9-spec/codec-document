/**
 * Causación contable: de los XML al asiento, sin digitar.
 *
 * Tres pasos en una sola pantalla:
 *   1. Empresa y mes   — se detecta sola entre los NIT de los documentos
 *   2. Terceros         — a qué cuenta va cada proveedor/cliente y qué
 *                         retención se le practica (sugerido la primera vez,
 *                         recordado las siguientes)
 *   3. Generar          — asiento por documento, cuadre y Excel
 *
 * Las cuentas y lo aprendido se guardan por empresa: el segundo mes el
 * contador sólo confirma los proveedores nuevos. Ese es el ahorro real.
 *
 * Todo el cálculo vive en lib/dian/causacion.ts (determinista, sin IA).
 */

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck, X, Loader2, Download, CheckCircle2, AlertTriangle, ChevronDown, Sparkles, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CUENTAS_POR_DEFECTO, ETIQUETA_CUENTA, TARIFA_SUGERIDA, causar, empresasDetectadas, rolDelDocumento, tercerosDelPeriodo,
  type ConceptoRetencion, type CuentasEmpresa, type DocCausable, type LineaCausable, type ReglaTercero,
  type ResultadoCausacion, type Sugerencia,
} from '../../../lib/dian/causacion';
import { construirExcelCausacion } from '../../../lib/dian/causacion-excel';
import {
  obtenerConfigCausacion, guardarConfigCausacion, listarReglasCausacion, guardarReglasCausacion,
} from '../../services/dian-service';
import { triggerDownload } from '../../utils/download';

interface Props {
  cargarDatos: () => Promise<{ documentos: DocCausable[]; lineas: LineaCausable[] }>;
  narrar?: (es: string, en: string) => void;
  onCerrar: () => void;
}

const pesos = (v: number) =>
  v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const CONCEPTOS: Array<{ id: ConceptoRetencion; etiqueta: string }> = [
  { id: 'ninguno', etiqueta: 'Sin retención' },
  { id: 'compras', etiqueta: 'Compras (2,5%)' },
  { id: 'servicios', etiqueta: 'Servicios (4%)' },
  { id: 'honorarios', etiqueta: 'Honorarios (11%)' },
  { id: 'arrendamientos', etiqueta: 'Arriendo inmuebles (3,5%)' },
];

type ReglaEditable = ReglaTercero & { rol: 'compra' | 'venta'; documentos: number; valor: number; sugerencia: Sugerencia | null; traeRet: boolean; confirmada: boolean };

export function CausacionContable({ cargarDatos, narrar, onCerrar }: Props) {
  const [cargando, setCargando] = useState(true);
  const [docs, setDocs] = useState<DocCausable[]>([]);
  const [lineas, setLineas] = useState<LineaCausable[]>([]);
  const [empresaNit, setEmpresaNit] = useState('');
  const [mes, setMes] = useState('');
  const [cuentas, setCuentas] = useState<CuentasEmpresa>(CUENTAS_POR_DEFECTO);
  const [verCuentas, setVerCuentas] = useState(false);
  const [reglas, setReglas] = useState<ReglaEditable[]>([]);
  const [cargandoEmpresa, setCargandoEmpresa] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCausacion | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  const [primeraVez, setPrimeraVez] = useState(false);

  useEffect(() => {
    narrar?.(
      'Aquí causo tus facturas. Elige la empresa y el mes, revisa a qué cuenta va cada proveedor y qué retención le practicas, y te entrego el comprobante contable cuadrado, listo para tu programa. Lo que confirmes queda guardado para el próximo mes.',
      'Here I post your invoices to the books. Pick the company and month, check the account and withholding for each supplier, and I will give you a balanced journal voucher ready for your accounting software.',
    );
    (async () => {
      try {
        const d = await cargarDatos();
        setDocs(d.documentos);
        setLineas(d.lineas);
        const emp = empresasDetectadas(d.documentos);
        if (emp[0]) setEmpresaNit(emp[0].nit);
        // El mes por defecto es el último en que ESTA empresa tiene
        // documentos, no el último de todo lo subido: si el más reciente es
        // de otro cliente, abrir en un mes vacío parece un fallo.
        const mesesEmpresa = [...new Set(d.documentos
          .filter((x) => emp[0] && rolDelDocumento(x, emp[0].nit))
          .map((x) => (x.issue_date ?? '').slice(0, 7)).filter(Boolean))].sort().reverse();
        if (mesesEmpresa[0]) setMes(mesesEmpresa[0]);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No pude cargar los documentos');
      } finally {
        setCargando(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const empresas = useMemo(() => empresasDetectadas(docs), [docs]);
  const meses = useMemo(
    () => [...new Set(docs.map((x) => (x.issue_date ?? '').slice(0, 7)).filter(Boolean))].sort().reverse(),
    [docs],
  );
  const docsMes = useMemo(
    () => docs.filter((d) => !mes || (d.issue_date ?? '').startsWith(mes)),
    [docs, mes],
  );
  const empresaNombre = empresas.find((e) => e.nit === empresaNit)?.nombre ?? '';

  // Al cambiar de empresa o mes: cuentas guardadas + reglas guardadas +
  // sugerencias para los terceros nuevos.
  useEffect(() => {
    if (!empresaNit) return;
    let vivo = true;
    setResultado(null);
    setCargandoEmpresa(true);
    (async () => {
      try {
        const [cfg, guardadas] = await Promise.all([obtenerConfigCausacion(empresaNit), listarReglasCausacion(empresaNit)]);
        if (!vivo) return;
        setPrimeraVez(!cfg);
        setCuentas({ ...CUENTAS_POR_DEFECTO, ...(cfg?.cuentas ?? {}) });
        const porNit = new Map(guardadas.map((r) => [r.tercero_nit, r]));
        const terceros = tercerosDelPeriodo(docsMes, lineas, empresaNit);
        setReglas(terceros.map((t) => {
          const g = porNit.get(t.nit);
          const concepto = (g?.concepto_retencion ?? t.sugerencia?.concepto ?? 'ninguno') as ConceptoRetencion;
          return {
            tercero_nit: t.nit,
            tercero_nombre: t.nombre,
            rol: t.rol,
            documentos: t.documentos,
            valor: t.valor,
            sugerencia: t.sugerencia,
            traeRet: t.traeRetencionesEnXml,
            confirmada: Boolean(g?.cuenta),
            cuenta: g?.cuenta ?? (t.rol === 'compra' ? t.sugerencia?.cuenta ?? '' : ''),
            centro_costo: g?.centro_costo ?? '',
            concepto_retencion: concepto,
            retefuente_pct: g?.retefuente_pct ?? (t.rol === 'compra' ? TARIFA_SUGERIDA[concepto] : 0),
            reteiva_pct: g?.reteiva_pct ?? 0,
            reteica_xmil: g?.reteica_xmil ?? 0,
            iva_al_gasto: g?.iva_al_gasto ?? false,
          };
        }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'No pude cargar la configuración');
      } finally {
        if (vivo) setCargandoEmpresa(false);
      }
    })();
    return () => { vivo = false; };
  }, [empresaNit, docsMes, lineas]);

  const editar = (nit: string, rol: string, cambio: Partial<ReglaEditable>) =>
    setReglas((rs) => rs.map((r) => (r.tercero_nit === nit && r.rol === rol ? { ...r, ...cambio } : r)));

  const generar = async () => {
    setTrabajando(true);
    try {
      await guardarConfigCausacion(empresaNit, empresaNombre, cuentas);
      // Se guarda por NIT: si un tercero es proveedor y cliente a la vez,
      // manda la configuración de compra (es la que lleva cuenta de gasto).
      const porNit = new Map<string, ReglaEditable>();
      for (const r of reglas) if (!porNit.has(r.tercero_nit) || r.rol === 'compra') porNit.set(r.tercero_nit, r);
      await guardarReglasCausacion(empresaNit, [...porNit.values()].map((r) => ({
        tercero_nit: r.tercero_nit,
        tercero_nombre: r.tercero_nombre,
        cuenta: r.cuenta?.trim() || null,
        centro_costo: r.centro_costo?.trim() || null,
        concepto_retencion: r.concepto_retencion ?? null,
        retefuente_pct: r.retefuente_pct ?? null,
        reteiva_pct: r.reteiva_pct ?? null,
        reteica_xmil: r.reteica_xmil ?? null,
        iva_al_gasto: r.iva_al_gasto,
      })));
      const mapa = new Map<string, ReglaTercero>([...porNit.entries()].map(([k, r]) => [k, r]));
      const res = causar(docsMes, empresaNit, cuentas, mapa);
      setResultado(res);
      setReglas((rs) => rs.map((r) => ({ ...r, confirmada: Boolean(r.cuenta?.trim()) || r.rol === 'venta' })));
      toast.success(`Listo: ${res.causados} documento(s) causados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude generar la causación');
    } finally {
      setTrabajando(false);
    }
  };

  const descargar = () => {
    if (!resultado) return;
    const bytes = construirExcelCausacion(resultado, { nit: empresaNit, nombre: empresaNombre });
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    void triggerDownload(blob, `Causacion ${empresaNombre || empresaNit} ${mes || ''}.xlsx`.replace(/[\\/:*?"<>|]/g, ''));
  };

  const compras = reglas.filter((r) => r.rol === 'compra');
  const ventas = reglas.filter((r) => r.rol === 'venta');
  const nuevos = compras.filter((r) => !r.confirmada).length;
  const primerAsiento = resultado?.movimientos.filter((m) => m.comprobante === 1) ?? [];
  const cuadra = resultado ? Math.abs(resultado.totalDebito - resultado.totalCredito) < 0.01 : false;

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
          <BookOpenCheck className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Causar facturas</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            El asiento de cada factura de compra y de venta, cuadrado y listo para tu programa contable
          </p>
        </div>
        <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        {cargando ? (
          <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
        ) : empresas.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Primero sube los XML del mes. Con los documentos cargados te armo los asientos.
          </p>
        ) : (
          <>
            {/* 1. Empresa y mes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-slate-600">
                Empresa que estás causando
                <select
                  value={empresaNit}
                  onChange={(e) => setEmpresaNit(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                >
                  {empresas.slice(0, 40).map((e) => (
                    <option key={e.nit} value={e.nit}>{e.nombre || 'Sin nombre'}, NIT {e.nit} ({e.documentos} doc.)</option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Mes
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                >
                  <option value="">Todos los meses</option>
                  {meses.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>

            {primeraVez && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs leading-relaxed text-emerald-900 ring-1 ring-emerald-200">
                <Building2 className="mt-0.5 size-4 shrink-0" />
                <span>
                  <strong>Primera vez con esta empresa.</strong> Revisa las cuentas (abajo) para que coincidan con su
                  plan de cuentas. Lo que confirmes queda guardado: el próximo mes sólo tendrás que revisar los
                  proveedores nuevos.
                </span>
              </div>
            )}

            {/* Cuentas de la empresa */}
            <div className="rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setVerCuentas((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-800"
              >
                Cuentas de esta empresa (PUC)
                <ChevronDown className={`size-4 text-slate-400 transition ${verCuentas ? 'rotate-180' : ''}`} />
              </button>
              {verCuentas && (
                <div className="grid gap-2 border-t border-slate-100 px-4 py-3 sm:grid-cols-2">
                  {(Object.keys(ETIQUETA_CUENTA) as Array<keyof CuentasEmpresa>).map((k) => (
                    <label key={k} className="block text-[11px] font-semibold text-slate-500">
                      {ETIQUETA_CUENTA[k]}
                      <input
                        value={cuentas[k]}
                        inputMode="numeric"
                        onChange={(e) => setCuentas((c) => ({ ...c, [k]: e.target.value.replace(/[^0-9]/g, '') }))}
                        className="mt-0.5 block w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-sm text-slate-800 outline-none focus:border-emerald-400"
                      />
                    </label>
                  ))}
                  <p className="text-[11px] leading-relaxed text-slate-400 sm:col-span-2">
                    Vienen con subcuentas habituales del PUC (Decreto 2650 de 1993). Cámbialas por las de tu plan de cuentas.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Terceros */}
            {cargandoEmpresa ? (
              <div className="flex justify-center py-6"><Loader2 className="size-5 animate-spin text-slate-300" /></div>
            ) : (
              <>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Proveedores ({compras.length})
                    </p>
                    {nuevos > 0 && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                        {nuevos} por confirmar
                      </span>
                    )}
                  </div>
                  {compras.length === 0 ? (
                    <p className="text-xs text-slate-400">No hay facturas de compra en este periodo.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-[11.5px]" translate="no">
                        <thead>
                          <tr className="bg-slate-50 text-left text-slate-500">
                            <th className="px-2.5 py-2 font-bold">Proveedor</th>
                            <th className="px-2 py-2 font-bold">Cuenta gasto</th>
                            <th className="px-2 py-2 font-bold">Retención</th>
                            <th className="px-2 py-2 font-bold">% Fte</th>
                            <th className="px-2 py-2 font-bold">% ReteIVA</th>
                            <th className="px-2 py-2 font-bold">‰ ICA</th>
                            <th className="px-2 py-2 font-bold">C. costo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compras.map((r) => (
                            <tr key={r.tercero_nit} className={`border-t border-slate-100 ${r.confirmada ? '' : 'bg-amber-50/40'}`}>
                              <td className="max-w-[200px] px-2.5 py-2">
                                <p className="truncate font-semibold text-slate-800">{r.tercero_nombre || r.tercero_nit}</p>
                                <p className="text-[10.5px] text-slate-400">
                                  {r.tercero_nit} · {r.documentos} doc. · {pesos(r.valor)}
                                </p>
                                {!r.confirmada && r.sugerencia && (
                                  <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-emerald-700">
                                    <Sparkles className="size-3" /> Sugerida: {r.sugerencia.nombre} ({r.sugerencia.motivo})
                                  </p>
                                )}
                                {r.traeRet && (
                                  <p className="text-[10.5px] text-indigo-600">El XML trae retenciones: se usan esas.</p>
                                )}
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  value={r.cuenta ?? ''}
                                  placeholder={cuentas.gasto_defecto}
                                  inputMode="numeric"
                                  onChange={(e) => editar(r.tercero_nit, r.rol, { cuenta: e.target.value.replace(/[^0-9]/g, '') })}
                                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 font-mono outline-none focus:border-emerald-400"
                                />
                                <label className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(r.iva_al_gasto)}
                                    onChange={(e) => editar(r.tercero_nit, r.rol, { iva_al_gasto: e.target.checked })}
                                  />
                                  IVA al gasto
                                </label>
                              </td>
                              <td className="px-2 py-2">
                                <select
                                  value={r.concepto_retencion ?? 'ninguno'}
                                  onChange={(e) => {
                                    const c = e.target.value as ConceptoRetencion;
                                    editar(r.tercero_nit, r.rol, { concepto_retencion: c, retefuente_pct: TARIFA_SUGERIDA[c] });
                                  }}
                                  className="rounded-lg border border-slate-200 px-1.5 py-1 outline-none"
                                >
                                  {CONCEPTOS.map((c) => <option key={c.id} value={c.id}>{c.etiqueta}</option>)}
                                </select>
                              </td>
                              {(['retefuente_pct', 'reteiva_pct', 'reteica_xmil'] as const).map((campo) => (
                                <td key={campo} className="px-2 py-2">
                                  <input
                                    value={r[campo] ?? 0}
                                    inputMode="decimal"
                                    onChange={(e) => editar(r.tercero_nit, r.rol, { [campo]: Number(e.target.value.replace(',', '.')) || 0 })}
                                    className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-right outline-none focus:border-emerald-400"
                                  />
                                </td>
                              ))}
                              <td className="px-2 py-2">
                                <input
                                  value={r.centro_costo ?? ''}
                                  onChange={(e) => editar(r.tercero_nit, r.rol, { centro_costo: e.target.value })}
                                  className="w-16 rounded-lg border border-slate-200 px-2 py-1 outline-none focus:border-emerald-400"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    Las tarifas son las generales para declarantes. La base mínima en UVT no se aplica sola: si un
                    pago no supera la base, deja la retención en 0 para ese proveedor.
                  </p>
                </div>

                {ventas.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Clientes ({ventas.length})</p>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-[11.5px]" translate="no">
                        <thead>
                          <tr className="bg-slate-50 text-left text-slate-500">
                            <th className="px-2.5 py-2 font-bold">Cliente</th>
                            <th className="px-2 py-2 font-bold">Cuenta ingreso</th>
                            <th className="px-2 py-2 font-bold">% Fte que te retiene</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ventas.map((r) => (
                            <tr key={r.tercero_nit} className="border-t border-slate-100">
                              <td className="max-w-[220px] px-2.5 py-2">
                                <p className="truncate font-semibold text-slate-800">{r.tercero_nombre || r.tercero_nit}</p>
                                <p className="text-[10.5px] text-slate-400">{r.tercero_nit} · {r.documentos} doc. · {pesos(r.valor)}</p>
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  value={r.cuenta ?? ''}
                                  placeholder={cuentas.ingresos}
                                  inputMode="numeric"
                                  onChange={(e) => editar(r.tercero_nit, r.rol, { cuenta: e.target.value.replace(/[^0-9]/g, '') })}
                                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 font-mono outline-none focus:border-emerald-400"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  value={r.retefuente_pct ?? 0}
                                  inputMode="decimal"
                                  onChange={(e) => editar(r.tercero_nit, r.rol, { retefuente_pct: Number(e.target.value.replace(',', '.')) || 0 })}
                                  className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-right outline-none focus:border-emerald-400"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. Generar */}
                <button
                  type="button"
                  disabled={trabajando || reglas.length === 0}
                  onClick={() => void generar()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {trabajando ? <Loader2 className="size-4 animate-spin" /> : <BookOpenCheck className="size-4" />}
                  Guardar y causar {docsMes.length > 0 ? `(${mes || 'todo'})` : ''}
                </button>
              </>
            )}

            {resultado && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Cifra titulo="Documentos causados" valor={String(resultado.causados)} />
                  <Cifra titulo="Movimientos" valor={String(resultado.movimientos.length)} />
                  <Cifra titulo="Débitos" valor={pesos(resultado.totalDebito)} />
                  <Cifra titulo="Créditos" valor={pesos(resultado.totalCredito)} />
                </div>
                <p className={`flex items-center gap-2 text-sm font-bold ${cuadra ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {cuadra ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                  {cuadra ? 'Débitos y créditos cuadran' : 'Hay diferencia entre débitos y créditos: revisa la hoja Cuadre'}
                </p>
                {resultado.avisos.filter((a) => a.nivel === 'revisar').length > 0 && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    {resultado.avisos.filter((a) => a.nivel === 'revisar').length} punto(s) para revisar. Están en la hoja «Revisar» del Excel.
                  </p>
                )}

                {primerAsiento.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                      Ejemplo: asiento de {primerAsiento[0].documento}
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <table className="w-full text-[11px]" translate="no">
                        <thead>
                          <tr className="bg-slate-50 text-left text-slate-500">
                            <th className="px-2 py-1.5">Cuenta</th><th className="px-2 py-1.5">Nombre</th>
                            <th className="px-2 py-1.5 text-right">Débito</th><th className="px-2 py-1.5 text-right">Crédito</th>
                          </tr>
                        </thead>
                        <tbody>
                          {primerAsiento.map((m, i) => (
                            <tr key={i} className="border-t border-slate-100">
                              <td className="px-2 py-1.5 font-mono">{m.cuenta}</td>
                              <td className="px-2 py-1.5 text-slate-500">{m.nombreCuenta}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">{m.debito ? pesos(m.debito) : ''}</td>
                              <td className="px-2 py-1.5 text-right tabular-nums">{m.credito ? pesos(m.credito) : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={descargar}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Download className="size-4" />
                  Descargar comprobante en Excel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Cifra({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[10.5px] font-semibold text-slate-400">{titulo}</p>
      <p className="truncate text-sm font-black tabular-nums text-slate-900">{valor}</p>
    </div>
  );
}
