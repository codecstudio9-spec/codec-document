/**
 * Documentos Electrónicos — módulo DIAN para contadores (Colombia).
 *
 * ── Visibilidad ─────────────────────────────────────────────────────────
 * Publicado en acceso restringido: la ruta existe y se ve exactamente como
 * la vería un contador, pero sólo la abre el propietario (isAdminEmail).
 * Cualquier otro usuario ve la pantalla de "no disponible" en vez de un
 * 404, para poder enseñarla sin exponerla.
 *
 * ── Por qué se procesa en el navegador ──────────────────────────────────
 * En esta etapa el parseo corre aquí y no en el servidor: no depende de
 * límites de tiempo de ejecución, no cuesta invocaciones y deja ver el
 * avance documento a documento. El motor (src/lib/dian/) no importa nada
 * de la aplicación, así que cuando el volumen lo pida el mismo parser se
 * ejecuta en un worker sin cambiar una línea.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FileUp, FileText, AlertTriangle, CheckCircle2, Copy, XCircle, Loader2,
  Search, Download, HelpCircle, ChevronRight, Lock, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { isAdminEmail } from '../utils/admin-access';
import {
  importarArchivos, listarDocumentos, obtenerTotales,
  type DocumentoListado, type EventoProgreso, type ResumenImportacion, type TotalesPanel,
} from '../services/dian-service';

const pesos = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const ETIQUETA_TIPO: Record<string, string> = {
  factura: 'Factura',
  nota_credito: 'Nota crédito',
  nota_debito: 'Nota débito',
  documento_equivalente: 'Doc. equivalente',
  documento_soporte: 'Doc. soporte',
  nomina: 'Nómina',
  evento: 'Evento',
  desconocido: 'Sin identificar',
};

const ESTADO: Record<string, { texto: string; clase: string }> = {
  PROCESSED: { texto: 'Procesado', clase: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  REVIEW_REQUIRED: { texto: 'Requiere revisión', clase: 'bg-amber-50 text-amber-700 ring-amber-200' },
  DUPLICATE: { texto: 'Duplicado', clase: 'bg-slate-100 text-slate-600 ring-slate-200' },
  INVALID: { texto: 'Inválido', clase: 'bg-rose-50 text-rose-700 ring-rose-200' },
  ERROR: { texto: 'Error', clase: 'bg-rose-50 text-rose-700 ring-rose-200' },
};

export default function DianDocumentsPage() {
  const { user, loading: cargandoSesion } = useAuth();
  const permitido = isAdminEmail(user?.email);

  const [totales, setTotales] = useState<TotalesPanel | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoListado[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState<EventoProgreso | null>(null);
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
  const [feed, setFeed] = useState<NonNullable<EventoProgreso['ultimo']>[]>([]);
  const [ayudaAbierta, setAyudaAbierta] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const refrescar = useCallback(async () => {
    if (!permitido) return;
    try {
      const [t, d] = await Promise.all([
        obtenerTotales(),
        listarDocumentos({ busqueda: busqueda || undefined, estado: filtroEstado || undefined }),
      ]);
      setTotales(t);
      setDocumentos(d);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [permitido, busqueda, filtroEstado]);

  useEffect(() => { void refrescar(); }, [refrescar]);

  const procesar = async (archivos: FileList | File[] | null) => {
    if (!archivos || archivos.length === 0) return;
    setCargando(true);
    setResumen(null);
    setFeed([]);
    try {
      const r = await importarArchivos(Array.from(archivos), (e) => {
        setProgreso(e);
        if (e.ultimo) setFeed((prev) => [e.ultimo!, ...prev].slice(0, 8));
      });
      setResumen(r);
      setAyudaAbierta(false);
      toast.success(`${r.procesados} documento(s) procesados`);
      await refrescar();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCargando(false);
      setProgreso(null);
    }
  };

  const descargarCsv = () => {
    if (documentos.length === 0) { toast.error('No hay documentos para exportar'); return; }
    const cab = ['Tipo', 'Número', 'Fecha', 'Proveedor', 'NIT', 'Subtotal', 'IVA', 'Retenciones', 'Total', 'Estado', 'CUFE'];
    const filas = documentos.map((d) => [
      ETIQUETA_TIPO[d.doc_type] ?? d.doc_type, d.full_number ?? '', d.issue_date ?? '',
      d.issuer_name ?? '', d.issuer_nit ?? '', d.line_total, d.total_iva, d.total_retenciones,
      d.total, ESTADO[d.status]?.texto ?? d.status, d.cufe ?? '',
    ]);
    // El BOM hace que Excel en español abra el archivo con los acentos bien.
    const csv = '﻿' + [cab, ...filas]
      .map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentos-electronicos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const porcentaje = useMemo(
    () => (progreso && progreso.total > 0 ? Math.round((progreso.hechos / progreso.total) * 100) : 0),
    [progreso],
  );

  if (cargandoSesion) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="size-6 animate-spin text-slate-400" /></div>;
  }

  if (!permitido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <Lock className="mx-auto mb-4 size-8 text-slate-300" />
          <h1 className="mb-2 text-lg font-semibold text-slate-800">Documentos Electrónicos</h1>
          <p className="text-sm text-slate-500">
            Esta herramienta está en pruebas con un grupo cerrado de contadores.
            Escríbenos si quieres participar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">

        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Documentos Electrónicos</h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600 ring-1 ring-indigo-100">
              Vista previa privada
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Convierte los XML de la DIAN en información contable lista para usar.
          </p>
        </header>

        {/* ── Guía paso a paso, dentro de la propia herramienta ───────── */}
        <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <button
            type="button"
            onClick={() => setAyudaAbierta((v) => !v)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <HelpCircle className="size-4 text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-800">Cómo funciona</span>
              <span className="block text-xs text-slate-400">Tres pasos. No necesitas saber nada técnico.</span>
            </div>
            <ChevronRight className={`size-4 shrink-0 text-slate-400 transition ${ayudaAbierta ? 'rotate-90' : ''}`} />
          </button>

          {ayudaAbierta && (
            <div className="border-t border-slate-100 px-5 py-5">
              <ol className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    n: '1',
                    t: 'Descarga tus documentos de la DIAN',
                    d: 'Entra al portal de la DIAN, busca tus documentos recibidos del periodo y descárgalos. Te queda un ZIP, o varios XML sueltos.',
                  },
                  {
                    n: '2',
                    t: 'Suéltalos aquí',
                    d: 'Arrastra el ZIP tal como te lo dio la DIAN. No hace falta descomprimirlo ni renombrar nada. También sirven XML sueltos.',
                  },
                  {
                    n: '3',
                    t: 'Revisa y exporta',
                    d: 'Codec lee cada documento y arma la tabla. Tú solo revisas lo que quedó marcado y descargas el reporte.',
                  },
                ].map((p) => (
                  <li key={p.n} className="flex gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                      {p.n}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">{p.t}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{p.d}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
                <Sparkles className="mt-0.5 size-3.5 shrink-0 text-indigo-500" />
                <span>
                  Tus archivos se procesan en tu propio navegador. El XML original
                  se conserva porque es el documento con validez legal, no el PDF.
                </span>
              </p>
            </div>
          )}
        </section>

        {/* ── Importar ────────────────────────────────────────────────── */}
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void procesar(e.dataTransfer.files); }}
          className="mb-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center transition hover:border-indigo-300"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xml,.zip"
            multiple
            className="hidden"
            onChange={(e) => { void procesar(e.target.files); e.target.value = ''; }}
          />

          {!cargando ? (
            <>
              <FileUp className="mx-auto mb-3 size-8 text-slate-300" />
              <p className="mb-1 text-sm font-semibold text-slate-800">
                Arrastra aquí el ZIP de la DIAN
              </p>
              <p className="mb-4 text-xs text-slate-400">o los XML sueltos, si los tienes por separado</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                Seleccionar archivos
              </button>
            </>
          ) : (
            <div className="mx-auto max-w-md text-left">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800">
                  {progreso?.fase === 'leyendo' ? 'Abriendo el archivo…' : 'Leyendo tus documentos…'}
                </span>
                <span className="tabular-nums text-slate-500">{porcentaje}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${porcentaje}%` }} />
              </div>
              <p className="mt-2 text-xs tabular-nums text-slate-400">
                {progreso?.hechos ?? 0} de {progreso?.total ?? 0}
              </p>

              {feed.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {feed.map((f, i) => (
                    <li key={`${f.nombre}-${i}`} className="flex items-center gap-2 text-xs text-slate-500">
                      {f.estado === 'ok' && <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />}
                      {f.estado === 'revision' && <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />}
                      {f.estado === 'duplicado' && <Copy className="size-3.5 shrink-0 text-slate-400" />}
                      {f.estado === 'error' && <XCircle className="size-3.5 shrink-0 text-rose-500" />}
                      <span className="truncate">{f.nombre}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        {/* ── Resultado de la última importación ──────────────────────── */}
        {resumen && (
          <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Resultado</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { l: 'Encontrados', v: resumen.encontrados, c: 'text-slate-900' },
                { l: 'Procesados', v: resumen.procesados, c: 'text-emerald-600' },
                { l: 'Duplicados', v: resumen.duplicados, c: 'text-slate-500' },
                { l: 'Requieren revisión', v: resumen.revision, c: 'text-amber-600' },
                { l: 'Con error', v: resumen.errores, c: 'text-rose-600' },
              ].map((x) => (
                <div key={x.l} className="rounded-xl bg-slate-50 px-3 py-3">
                  <div className={`text-xl font-bold tabular-nums ${x.c}`}>{x.v}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{x.l}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Tarjetas ────────────────────────────────────────────────── */}
        {totales && totales.documentos > 0 && (
          <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              { l: 'Documentos', v: String(totales.documentos) },
              { l: 'Requieren revisión', v: String(totales.revision) },
              { l: 'Con error', v: String(totales.errores) },
              { l: 'Total compras', v: pesos(totales.compras) },
              { l: 'IVA', v: pesos(totales.iva) },
              { l: 'Retenciones', v: pesos(totales.retenciones) },
            ].map((c) => (
              <div key={c.l} className="rounded-2xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-100">
                <div className="truncate text-lg font-bold tabular-nums text-slate-900">{c.v}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{c.l}</div>
              </div>
            ))}
          </section>
        )}

        {/* ── Tabla ───────────────────────────────────────────────────── */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por número, proveedor o NIT"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="PROCESSED">Procesados</option>
              <option value="REVIEW_REQUIRED">Requieren revisión</option>
              <option value="INVALID">Inválidos</option>
            </select>
            <button
              type="button"
              onClick={descargarCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="size-4" />
              Exportar
            </button>
          </div>

          {documentos.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="mx-auto mb-3 size-8 text-slate-200" />
              <p className="text-sm font-semibold text-slate-700">Todavía no hay documentos</p>
              <p className="mt-1 text-xs text-slate-400">
                Sube tu primer ZIP de la DIAN y aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm" translate="no">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 text-left font-bold">Tipo</th>
                    <th className="px-4 py-3 text-left font-bold">Número</th>
                    <th className="px-4 py-3 text-left font-bold">Fecha</th>
                    <th className="px-4 py-3 text-left font-bold">Proveedor</th>
                    <th className="px-4 py-3 text-right font-bold">Subtotal</th>
                    <th className="px-4 py-3 text-right font-bold">IVA</th>
                    <th className="px-4 py-3 text-right font-bold">Total</th>
                    <th className="px-4 py-3 text-left font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((d) => {
                    const e = ESTADO[d.status] ?? { texto: d.status, clase: 'bg-slate-100 text-slate-600 ring-slate-200' };
                    return (
                      <tr key={d.id} className="border-b border-slate-50 transition hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-600">{ETIQUETA_TIPO[d.doc_type] ?? d.doc_type}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{d.full_number}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-500">{d.issue_date}</td>
                        <td className="max-w-[220px] px-4 py-3">
                          <span className="block truncate text-slate-800">{d.issuer_name}</span>
                          <span className="block truncate text-xs tabular-nums text-slate-400">{d.issuer_nit}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{pesos(Number(d.line_total))}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{pesos(Number(d.total_iva))}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{pesos(Number(d.total))}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${e.clase}`}>
                            {e.texto}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
