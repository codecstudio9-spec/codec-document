/**
 * Documentos Electrónicos — módulo DIAN para contadores (Colombia).
 *
 * ── Acceso y cuota ──────────────────────────────────────────────────────
 * Abierta a cualquier usuario autenticado. Quien limita no es el correo
 * sino la cuota: 200 documentos por mes calendario en el plan gratuito.
 * El propietario (isAdminEmail) va sin límite.
 *
 * La cuota se cuenta sobre las filas realmente guardadas, así que un
 * duplicado o un archivo que falló no la consumen — que es lo que el
 * contador espera.
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
import { useVoiceSpeak } from '../hooks/useVoiceGuide';
import { isAdminEmail } from '../utils/admin-access';
import {
  importarArchivos, listarDocumentos, obtenerTotales, datosParaReporte,
  estadoBeta, configurarBeta, BetaCerradaError, type EstadoBeta,
  type DocumentoListado, type EventoProgreso, type ResumenImportacion, type TotalesPanel,
} from '../services/dian-service';
import { construirReporte, type DocumentoReporte, type ImpuestoReporte, type LineaReporte } from '../../lib/dian/reporte';

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
  const permitido = Boolean(user);
  const ilimitado = isAdminEmail(user?.email);

  const [totales, setTotales] = useState<TotalesPanel | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoListado[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState<EventoProgreso | null>(null);
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
  const [feed, setFeed] = useState<NonNullable<EventoProgreso['ultimo']>[]>([]);
  const [ayudaAbierta, setAyudaAbierta] = useState(true);
  const [beta, setBeta] = useState<EstadoBeta | null>(null);
  const { speak } = useVoiceSpeak();
  const inputRef = useRef<HTMLInputElement>(null);

  const refrescar = useCallback(async () => {
    if (!permitido) return;
    try {
      const [t, d, c] = await Promise.all([
        obtenerTotales(),
        listarDocumentos({ busqueda: busqueda || undefined, estado: filtroEstado || undefined }),
        estadoBeta(),
      ]);
      setTotales(t);
      setDocumentos(d);
      setBeta(c);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [permitido, busqueda, filtroEstado, ilimitado]);

  useEffect(() => { void refrescar(); }, [refrescar]);

  // Bienvenida hablada, una sola vez por visita. El asistente decide solo
  // si suena: si el usuario tiene la guía apagada, speak() no hace nada.
  const bienvenidaDada = useRef(false);
  useEffect(() => {
    if (!permitido || bienvenidaDada.current) return;
    bienvenidaDada.current = true;
    speak({
      es: 'Bienvenido a Documentos Electrónicos. Descarga tus documentos del portal de la DIAN y suelta aquí el archivo comprimido, tal como te lo entregó la DIAN. Yo lo leo, organizo la información y te aviso si algo necesita tu revisión.',
      en: 'Welcome to Electronic Documents. Download your documents from the DIAN portal and drop the ZIP file here, just as DIAN gave it to you. I will read it, organize the information and let you know if anything needs your review.',
    });
  }, [permitido, speak]);

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

      // Se narra el resultado en el lenguaje del contador. Lo importante no
      // es cuántos se procesaron sino cuántos necesitan que él intervenga:
      // ése es el trabajo que le queda.
      const pendientes = r.revision + r.errores;
      speak({
        es: `Listo. Procesé ${r.procesados} documentos.`
          + (r.duplicados > 0 ? ` ${r.duplicados} ya los tenías.` : '')
          + (pendientes > 0
              ? ` ${pendientes} necesitan que los revises. Los encuentras filtrando por Requiere revisión.`
              : ' Todos quedaron correctos, no hay nada que revisar.')
          + ' Puedes descargar el reporte en Excel cuando quieras.',
        en: `Done. I processed ${r.procesados} documents.`
          + (r.duplicados > 0 ? ` ${r.duplicados} were already here.` : '')
          + (pendientes > 0
              ? ` ${pendientes} need your review. Filter by Needs review to find them.`
              : ' All of them are correct, nothing to review.')
          + ' You can download the Excel report whenever you want.',
      });

      await refrescar();
    } catch (e) {
      // El límite no es un fallo del sistema: se explica, no se reporta
      // como error rojo genérico.
      if (e instanceof BetaCerradaError) toast.error(e.message, { duration: 9000 });
      else toast.error((e as Error).message);
    } finally {
      setCargando(false);
      setProgreso(null);
    }
  };

  const [exportando, setExportando] = useState(false);

  const descargarExcel = async () => {
    setExportando(true);
    try {
      const { documentos: docs, lineas, impuestos } = await datosParaReporte({
        estado: filtroEstado || undefined,
      });
      if (docs.length === 0) { toast.error('No hay documentos para exportar'); return; }

      const bytes = construirReporte(
        docs as DocumentoReporte[],
        lineas as LineaReporte[],
        impuestos as ImpuestoReporte[],
      );
      const url = URL.createObjectURL(
        new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte documentos electronicos ${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${docs.length} documento(s) exportados en 4 hojas`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExportando(false);
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
            Inicia sesión con tu correo para procesar tus documentos
            electrónicos de la DIAN.
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
              Beta
            </span>
            {beta && !beta.ilimitado && (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ring-1 ${
                beta.restantesPersona === 0
                  ? 'bg-rose-50 text-rose-700 ring-rose-200'
                  : beta.restantesPersona <= 20
                    ? 'bg-amber-50 text-amber-700 ring-amber-200'
                    : 'bg-slate-100 text-slate-600 ring-slate-200'
              }`}>
                {beta.restantesPersona} de {beta.limitePersona} documentos disponibles
              </span>
            )}
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

        {/* ── Panel del propietario: medir la prueba y ajustar los topes ──
          Va aquí y no en la sección de analítica porque es donde el
          propietario ya está mirando la herramienta; si el consumo se
          dispara, lo ve en el mismo sitio donde puede subir el tope. */}
      {beta?.ilimitado && (
        <section className="mb-6 rounded-2xl bg-slate-900 p-5 text-white">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-bold">Control de la prueba</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">
              solo tú ves esto
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: 'Documentos generados', v: `${beta.usadosGlobal} / ${beta.limiteGlobal}` },
              { l: 'Contadores que la usaron', v: String(beta.personas) },
              { l: 'Cupo por persona', v: String(beta.limitePersona) },
              {
                l: 'La prueba cierra',
                v: beta.cierre
                  ? new Date(beta.cierre).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
                  : 'sin fecha',
              },
            ].map((x) => (
              <div key={x.l} className="rounded-xl bg-white/5 px-3 py-3">
                <div className="truncate text-base font-bold tabular-nums">{x.v}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-white/50">{x.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${
                beta.usadosGlobal / beta.limiteGlobal > 0.85 ? 'bg-rose-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, (beta.usadosGlobal / Math.max(1, beta.limiteGlobal)) * 100)}%` }}
            />
          </div>
          {beta.llena && (
            <p className="mt-2 text-xs font-semibold text-rose-300">
              Tope alcanzado. La herramienta está bloqueada para todos hasta que lo subas.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-xs text-white/60">
              Tope global
              <input
                type="number"
                defaultValue={beta.limiteGlobal}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (!v || Number(v) === beta.limiteGlobal) return;
                  void configurarBeta('dian_beta_limite_global', v)
                    .then(() => { toast.success(`Tope global: ${v}`); void refrescar(); })
                    .catch((err) => toast.error(err.message));
                }}
                className="mt-1 block w-28 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white outline-none focus:bg-white/15"
              />
            </label>
            <label className="text-xs text-white/60">
              Cupo por persona
              <input
                type="number"
                defaultValue={beta.limitePersona}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (!v || Number(v) === beta.limitePersona) return;
                  void configurarBeta('dian_beta_limite_persona', v)
                    .then(() => { toast.success(`Cupo por persona: ${v}`); void refrescar(); })
                    .catch((err) => toast.error(err.message));
                }}
                className="mt-1 block w-28 rounded-lg bg-white/10 px-2.5 py-1.5 text-sm font-semibold text-white outline-none focus:bg-white/15"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 3);
                void configurarBeta('dian_beta_cierre', d.toISOString())
                  .then(() => { toast.success('Prueba extendida 3 días más'); void refrescar(); })
                  .catch((err) => toast.error(err.message));
              }}
              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold transition hover:bg-white/20"
            >
              +3 días
            </button>
            <button
              type="button"
              onClick={() => {
                void configurarBeta('dian_beta_cierre', new Date().toISOString())
                  .then(() => { toast.success('Prueba cerrada'); void refrescar(); })
                  .catch((err) => toast.error(err.message));
              }}
              className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30"
            >
              Cerrar ahora
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-white/40">
            Los cambios aplican de inmediato para todos, sin desplegar nada.
          </p>
        </section>
      )}

      {/* ── Importar ────────────────────────────────────────────────── */}
        {beta && !beta.ilimitado && (beta.cerrada || beta.llena) && (
          <section className="mb-6 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-100">
            <Lock className="mx-auto mb-3 size-7 text-slate-300" />
            <p className="text-sm font-semibold text-slate-800">
              {beta.cerrada ? 'El periodo de prueba terminó' : 'La prueba alcanzó su capacidad'}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Gracias por participar. Tus documentos siguen aquí y puedes consultarlos
              y exportarlos; sólo no se pueden procesar nuevos por ahora.
            </p>
          </section>
        )}

        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); void procesar(e.dataTransfer.files); }}
          className={`mb-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center transition hover:border-indigo-300 ${
            beta && !beta.ilimitado && (beta.cerrada || beta.llena) ? 'pointer-events-none opacity-40' : ''
          }`}
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
            {resumen.sinProcesarPorCuota > 0 && (
              <p className="mb-3 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
                Quedaron <strong>{resumen.sinProcesarPorCuota}</strong> documento(s) sin procesar
                porque llegaste a tu cupo de {beta?.limitePersona ?? 100}. No se perdieron:
                vuelve a subir el mismo archivo cuando tengas cupo y Codec continúa donde quedó.
              </p>
            )}
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
              onClick={() => void descargarExcel()}
              disabled={exportando}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {exportando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Descargar Excel
            </button>
            <button
              type="button"
              onClick={descargarCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              CSV
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
