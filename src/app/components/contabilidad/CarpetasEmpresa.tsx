import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Receipt, FileMinus, FileSignature, BookOpen, Store, Paperclip, ChevronLeft, Loader2,
  Download, Upload, Trash2, FileText, Search, BookOpenCheck, Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Tarjeta, Boton, Vacio, Cifra } from '../dian/PiezasPanel';
import { BOTON_PRIMARIO, BOTON_NEUTRO, CARD } from '../../styles/contador-theme';
import {
  documentosEmpresa, listarComprobantes, listarArchivos, subirArchivo, urlArchivo, borrarArchivo, urlXmlOriginal,
  vinculoPos, posRecibiendo,
  type Empresa, type DocumentoEmpresa, type Comprobante, type ArchivoEmpresa, type VinculoPos,
} from '../../services/contabilidad-service';
import { CarpetaCodecPos } from './CarpetaCodecPos';

/**
 * Las carpetas de una empresa.
 *
 * Arriba el periodo (año y mes, como las carpetas que el contador ya tiene en
 * su computador). Debajo, una fila de carpetas grandes con su conteo:
 * compras, ventas, notas, documento soporte, comprobantes, Codec POS y los
 * archivos propios (RUT, extractos…). Al abrir una carpeta se ve su lista,
 * con lo que se puede hacer ahí mismo: bajar el XML o mandarlo a causar.
 */

type IdCarpeta = 'compras' | 'ventas' | 'notas' | 'soporte' | 'nomina' | 'comprobantes' | 'pos' | 'archivos';

interface DefCarpeta {
  id: IdCarpeta;
  nombre: string;
  icono: LucideIcon;
  color: string;
}

const CARPETAS: DefCarpeta[] = [
  { id: 'compras', nombre: 'Compras', icono: ShoppingCart, color: '#2563EB' },
  { id: 'ventas', nombre: 'Ventas', icono: Receipt, color: '#059669' },
  { id: 'notas', nombre: 'Notas crédito y débito', icono: FileMinus, color: '#D97706' },
  { id: 'soporte', nombre: 'Documento soporte', icono: FileSignature, color: '#7C3AED' },
  { id: 'nomina', nombre: 'Nómina electrónica', icono: Users, color: '#DB2777' },
  { id: 'comprobantes', nombre: 'Comprobantes contables', icono: BookOpen, color: '#0F172A' },
  { id: 'pos', nombre: 'Codec POS', icono: Store, color: '#EA580C' },
  { id: 'archivos', nombre: 'Mis archivos', icono: Paperclip, color: '#0891B2' },
];

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const pesos = (v: number) => v.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function finDeMes(periodo: string): string {
  const [a, m] = periodo.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).toISOString().slice(0, 10);
}

/** A qué carpeta va un XML, visto desde ESTA empresa. */
export function carpetaDe(d: DocumentoEmpresa, nit: string): IdCarpeta | null {
  const rec = String(d.receiver_nit ?? '').replace(/[^0-9]/g, '');
  const emi = String(d.issuer_nit ?? '').replace(/[^0-9]/g, '');
  if (d.doc_type === 'nota_credito' || d.doc_type === 'nota_debito') return 'notas';
  if (d.doc_type === 'documento_soporte') return 'soporte';
  if (d.doc_type === 'nomina') return 'nomina';
  if (d.doc_type === 'factura' || d.doc_type === 'documento_equivalente') {
    if (rec === nit) return 'compras';
    if (emi === nit) return 'ventas';
  }
  return null;
}

export function CarpetasEmpresa({
  empresa, periodos, puedeEditar, onCausar,
}: {
  empresa: Empresa;
  periodos: string[];
  puedeEditar: boolean;
  onCausar: () => void;
}) {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const [periodo, setPeriodo] = useState(periodos[0] ?? mesActual);
  const [abierta, setAbierta] = useState<IdCarpeta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [docs, setDocs] = useState<DocumentoEmpresa[]>([]);
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [archivos, setArchivos] = useState<ArchivoEmpresa[]>([]);

  const anio = periodo.slice(0, 4);
  const anios = useMemo(() => {
    const s = new Set(periodos.map((p) => p.slice(0, 4)));
    s.add(String(hoy.getFullYear()));
    return [...s].sort().reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodos]);
  const conDatos = useMemo(() => new Set(periodos), [periodos]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const desde = `${periodo}-01`;
      const hasta = finDeMes(periodo);
      const [d, c, a] = await Promise.all([
        documentosEmpresa(empresa, desde, hasta),
        listarComprobantes(empresa.id, desde, hasta),
        listarArchivos(empresa.id),
      ]);
      setDocs(d);
      setComprobantes(c);
      setArchivos(a);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude abrir las carpetas');
    } finally {
      setCargando(false);
    }
  }, [empresa, periodo]);

  useEffect(() => { void cargar(); }, [cargar]);
  useEffect(() => { setAbierta(null); }, [empresa.id]);

  // El estado de Codec POS se vuelve a leer al volver de su carpeta: ahí es
  // donde el contador genera el código y ve cómo se conecta.
  const [pos, setPos] = useState<VinculoPos | null>(null);
  useEffect(() => {
    if (abierta) return;
    vinculoPos(empresa.id).then(setPos).catch(() => setPos(null));
  }, [empresa.id, abierta]);

  const porCarpeta = useMemo(() => {
    const m = new Map<IdCarpeta, DocumentoEmpresa[]>();
    for (const d of docs) {
      const c = carpetaDe(d, empresa.nit);
      if (!c) continue;
      const l = m.get(c) ?? [];
      l.push(d);
      m.set(c, l);
    }
    return m;
  }, [docs, empresa.nit]);

  const archivosPeriodo = archivos.filter((a) => !a.periodo || a.periodo === periodo || a.periodo === anio);
  const conteo = (id: IdCarpeta) =>
    id === 'comprobantes' ? comprobantes.filter((c) => !c.anulado).length
      : id === 'archivos' ? archivosPeriodo.length
        : id === 'pos' ? 0
          : porCarpeta.get(id)?.length ?? 0;

  const compras = porCarpeta.get('compras') ?? [];
  const ventas = porCarpeta.get('ventas') ?? [];
  const porCausar = docs.filter((d) => d.accounting_status === 'pendiente' && carpetaDe(d, empresa.nit) && carpetaDe(d, empresa.nit) !== 'nomina').length;
  const visibles = CARPETAS.filter((c) => c.id !== 'nomina' || conteo('nomina') > 0);

  return (
    <div>
      {/* ── Periodo: año y meses ─────────────────────────────────────── */}
      <Tarjeta className="mb-5 p-4" sinAnimar>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={anio}
            onChange={(e) => {
              const a = e.target.value;
              const ultimo = periodos.find((p) => p.startsWith(a));
              setPeriodo(ultimo ?? `${a}-01`);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none"
          >
            {anios.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="flex flex-1 flex-wrap gap-1.5">
            {MESES.map((m, i) => {
              const p = `${anio}-${String(i + 1).padStart(2, '0')}`;
              const activo = p === periodo;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodo(p)}
                  className={`relative rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                    activo ? 'bg-blue-600 text-white shadow' : conDatos.has(p) ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {m}
                  {conDatos.has(p) && !activo && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-blue-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </Tarjeta>

      {cargando ? (
        <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
      ) : abierta ? (
        <ContenidoCarpeta
          def={CARPETAS.find((c) => c.id === abierta)!}
          empresa={empresa}
          periodo={periodo}
          docs={porCarpeta.get(abierta) ?? []}
          comprobantes={comprobantes}
          archivos={archivosPeriodo}
          puedeEditar={puedeEditar}
          onVolver={() => setAbierta(null)}
          onCausar={onCausar}
          onRecargar={cargar}
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Cifra etiqueta="Compras del mes" valor={pesos(compras.reduce((v, d) => v + Number(d.total), 0))} icono={ShoppingCart} indice={0} />
            <Cifra etiqueta="Ventas del mes" valor={pesos(ventas.reduce((v, d) => v + Number(d.total), 0))} icono={Receipt} color="#059669" indice={1} />
            <Cifra etiqueta="XML del mes" valor={docs.length} icono={FileText} color="#7C3AED" indice={2} />
            <Cifra
              etiqueta="Por causar"
              valor={porCausar}
              icono={BookOpenCheck}
              color="#D97706"
              indice={3}
              resalta={porCausar > 0}
              pie={porCausar > 0 ? 'Ábrelos en «Causar XML»' : 'Todo contabilizado'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibles.map((c, i) => {
              const n = conteo(c.id);
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAbierta(c.id)}
                  className="flex flex-col items-start gap-3 p-4 text-left"
                  style={CARD}
                >
                  <div className="relative">
                    {c.id === 'pos' ? (
                      <div className={`flex size-12 items-center justify-center rounded-2xl bg-white p-1.5 ring-1 ${pos?.estado === 'activo' ? 'ring-2 ring-emerald-400' : 'ring-slate-200'}`}>
                        <img src="/brand/codec-pos.png" alt="Codec POS" className="size-full object-contain" style={{ mixBlendMode: 'multiply' }} />
                        {pos?.estado === 'activo' && (
                          <span className="absolute -right-1 -top-1 flex size-3.5">
                            {posRecibiendo(pos.ultimo_envio_at) && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                            <span className="relative inline-flex size-3.5 rounded-full border-2 border-white bg-emerald-500" />
                          </span>
                        )}
                      </div>
                    ) : (
                    <div
                      className="flex size-12 items-center justify-center rounded-2xl"
                      style={{ background: `linear-gradient(135deg, ${c.color}22, ${c.color}10)`, border: `1px solid ${c.color}30` }}
                    >
                      <c.icono className="size-5.5" style={{ color: c.color }} />
                    </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight text-slate-900">{c.nombre}</p>
                    {c.id === 'pos' ? (
                      <p className={`mt-0.5 text-xs ${pos?.estado === 'activo' ? 'font-bold text-emerald-600' : pos?.estado === 'pendiente' ? 'font-semibold text-orange-600' : 'text-slate-400'}`}>
                        {pos?.estado === 'activo'
                          ? (posRecibiendo(pos.ultimo_envio_at) ? 'Conectada · recibiendo' : 'Conectada')
                          : pos?.estado === 'pendiente' ? 'Código pendiente' : 'Conectar'}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-slate-400">{`${n.toLocaleString('es-CO')} ${n === 1 ? 'elemento' : 'elementos'}`}</p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ContenidoCarpeta({
  def, empresa, periodo, docs, comprobantes, archivos, puedeEditar, onVolver, onCausar, onRecargar,
}: {
  def: DefCarpeta;
  empresa: Empresa;
  periodo: string;
  docs: DocumentoEmpresa[];
  comprobantes: Comprobante[];
  archivos: ArchivoEmpresa[];
  puedeEditar: boolean;
  onVolver: () => void;
  onCausar: () => void;
  onRecargar: () => Promise<void> | void;
}) {
  const [q, setQ] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const filtrados = docs.filter((d) => {
    const t = q.trim().toLowerCase();
    if (!t) return true;
    return [d.full_number, d.issuer_name, d.receiver_name, d.issuer_nit, d.receiver_nit].some((v) => (v ?? '').toLowerCase().includes(t));
  });

  const bajarXml = async (d: DocumentoEmpresa) => {
    const url = await urlXmlOriginal(d.id);
    if (!url) { toast.error('Ese XML no quedó guardado como archivo (se cargó antes de que se conservaran)'); return; }
    window.open(url, '_blank', 'noopener');
  };

  const subir = async (files: FileList | null) => {
    if (!files?.length) return;
    setSubiendo(true);
    try {
      for (const f of Array.from(files)) await subirArchivo(empresa.id, f, 'general', periodo);
      toast.success(files.length === 1 ? 'Archivo guardado' : `${files.length} archivos guardados`);
      await onRecargar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No pude subir el archivo');
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <Tarjeta className="p-5" sinAnimar>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onVolver} className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-100">
          <ChevronLeft className="size-4" /> Carpetas
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {def.id === 'pos'
            ? <img src="/brand/codec-pos.png" alt="" className="size-6 shrink-0 object-contain" style={{ mixBlendMode: 'multiply' }} />
            : <def.icono className="size-5 shrink-0" style={{ color: def.color }} />}
          <p className="truncate text-base font-black text-slate-900">{def.nombre}</p>
          <span className="text-xs text-slate-400">· {MESES[Number(periodo.slice(5, 7)) - 1]} {periodo.slice(0, 4)}</span>
        </div>
        {def.id === 'archivos' && puedeEditar && (
          <>
            <input ref={input} type="file" multiple className="hidden" onChange={(e) => void subir(e.target.files)} />
            <Boton estilo={BOTON_PRIMARIO} className="text-white" icono={subiendo ? Loader2 : Upload} disabled={subiendo} onClick={() => input.current?.click()}>
              Subir archivos
            </Boton>
          </>
        )}
        {['compras', 'ventas', 'notas', 'soporte'].includes(def.id) && docs.some((d) => d.accounting_status === 'pendiente') && puedeEditar && (
          <Boton estilo={BOTON_NEUTRO} className="text-slate-700" icono={BookOpenCheck} onClick={onCausar}>Causar estos XML</Boton>
        )}
      </div>

      {def.id === 'pos' ? (
        <CarpetaCodecPos empresa={empresa} periodo={periodo} puedeEditar={puedeEditar} />
      ) : def.id === 'archivos' ? (
        archivos.length === 0 ? (
          <Vacio icono={Paperclip} titulo="Sin archivos en este periodo" descripcion="Guarda aquí el RUT, la cámara de comercio, extractos bancarios o lo que quieras tener a mano de esta empresa." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {archivos.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <FileText className="size-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.nombre}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(a.created_at).toLocaleDateString('es-CO')}{a.tamano ? ` · ${(a.tamano / 1024).toFixed(0)} KB` : ''}{a.periodo ? '' : ' · General'}
                  </p>
                </div>
                <button type="button" onClick={() => void urlArchivo(a).then((u) => window.open(u, '_blank', 'noopener')).catch((e) => toast.error(e.message))} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Descargar">
                  <Download className="size-4" />
                </button>
                {puedeEditar && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`¿Borrar ${a.nombre}?`)) return;
                      void borrarArchivo(a).then(onRecargar).catch((e) => toast.error(e.message));
                    }}
                    className="rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Borrar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )
      ) : def.id === 'comprobantes' ? (
        comprobantes.length === 0 ? (
          <Vacio icono={BookOpen} titulo="Sin comprobantes este mes" descripcion="Se crean al causar los XML o desde la sección Comprobantes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" translate="no">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="py-2 pr-3 font-bold">Comprobante</th><th className="py-2 pr-3 font-bold">Fecha</th>
                  <th className="py-2 pr-3 font-bold">Descripción</th><th className="py-2 text-right font-bold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {comprobantes.map((c) => (
                  <tr key={c.id} className={`border-t border-slate-100 ${c.anulado ? 'text-slate-300 line-through' : ''}`}>
                    <td className="py-2 pr-3 font-mono font-bold">{c.tipo}-{c.numero}</td>
                    <td className="py-2 pr-3 text-slate-500">{c.fecha}</td>
                    <td className="max-w-[320px] truncate py-2 pr-3">{c.descripcion}</td>
                    <td className="py-2 text-right tabular-nums">{pesos(Number(c.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : docs.length === 0 ? (
        <Vacio icono={def.icono} titulo="Esta carpeta está vacía" descripcion="Cuando traigas los XML del mes (subiéndolos, por correo o desde la DIAN) aparecen aquí solos." />
      ) : (
        <>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número, tercero o NIT" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" translate="no">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="py-2 pr-3 font-bold">Número</th>
                  <th className="py-2 pr-3 font-bold">Fecha</th>
                  <th className="py-2 pr-3 font-bold">{def.id === 'ventas' ? 'Cliente' : 'Tercero'}</th>
                  <th className="py-2 pr-3 text-right font-bold">IVA</th>
                  <th className="py-2 pr-3 text-right font-bold">Total</th>
                  <th className="py-2 pr-3 font-bold">Contabilidad</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((d) => {
                  const esCompra = String(d.receiver_nit ?? '').replace(/[^0-9]/g, '') === empresa.nit;
                  const tercero = esCompra ? d.issuer_name : d.receiver_name;
                  return (
                    <tr key={d.id} className="border-t border-slate-100">
                      <td className="py-2 pr-3 font-mono text-[13px] font-bold text-slate-800">{d.full_number ?? 'Sin número'}</td>
                      <td className="py-2 pr-3 text-slate-500">{d.issue_date}</td>
                      <td className="max-w-[240px] truncate py-2 pr-3">{tercero ?? ''}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-500">{pesos(Number(d.total_iva))}</td>
                      <td className="py-2 pr-3 text-right font-semibold tabular-nums">{pesos(Number(d.total))}</td>
                      <td className="py-2 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                          d.accounting_status === 'aprobado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {d.accounting_status === 'aprobado' ? 'Contabilizado' : 'Por causar'}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <button type="button" onClick={() => void bajarXml(d)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Descargar XML" title="Descargar XML">
                          <Download className="size-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Tarjeta>
  );
}
