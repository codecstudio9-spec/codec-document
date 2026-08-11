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
  Search, Download, HelpCircle, ChevronRight, Lock, Sparkles, ListChecks, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';
import { Logo } from '../components/brand/Logo';
import {
  CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT, DARK_GRADIENT,
  MOBILE_BG_GRADIENT, GLOW_TOP_RIGHT,
} from '../styles/mobile-theme';
import { isAdminEmail } from '../utils/admin-access';
import {
  importarArchivos, listarDocumentos, obtenerTotales, datosParaReporte,
  estadoBeta, configurarBeta, BetaCerradaError, type EstadoBeta,
  cruzarCufes, obtenerDocumento, type CruceCufes,
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

  // Panel de CUFEs
  // Abierta por defecto: verificar por CUFEs es la mitad del trabajo del
  // contador, no un extra. Plegada, casi nadie la encontraba.
  const [panelCufes, setPanelCufes] = useState(true);
  const [textoCufes, setTextoCufes] = useState('');
  const [cruce, setCruce] = useState<CruceCufes | null>(null);
  const [cruzando, setCruzando] = useState(false);

  // Detalle del documento
  const [detalle, setDetalle] = useState<Awaited<ReturnType<typeof obtenerDocumento>> | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const abrirDetalle = async (id: string) => {
    setCargandoDetalle(true);
    try { setDetalle(await obtenerDocumento(id)); }
    catch (e) { toast.error((e as Error).message); }
    finally { setCargandoDetalle(false); }
  };

  const ejecutarCruce = async () => {
    if (!textoCufes.trim()) { toast.error('Pega primero la lista de CUFEs'); return; }
    setCruzando(true);
    try {
      const r = await cruzarCufes(textoCufes);
      setCruce(r);
      speak({
        es: r.faltantes.length === 0
          ? `Revisé ${r.encontrados.length} documentos y los tienes todos.`
          : `De tu lista, tienes ${r.encontrados.length} documentos y te faltan ${r.faltantes.length}.`,
        en: r.faltantes.length === 0
          ? `I checked ${r.encontrados.length} documents and you have all of them.`
          : `From your list, you have ${r.encontrados.length} documents and ${r.faltantes.length} are missing.`,
      });
    } catch (e) { toast.error((e as Error).message); }
    finally { setCruzando(false); }
  };
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
      es: 'Bienvenido a Codec Document para contadores. Puedes trabajar de dos formas. La primera: suelta aquí el archivo comprimido tal como te lo entregó la DIAN, y yo lo leo y organizo la información. La segunda: si tienes el Excel de la DIAN, copia la columna de CUFEs y pégala en el recuadro verde de arriba; te digo al instante cuáles documentos ya tienes cargados y cuáles te faltan, sin que revises uno por uno.',
      en: 'Welcome to Codec Document for accountants. You can work in two ways. First: drop the ZIP file here, just as DIAN gave it to you, and I will read it and organize the information. Second: if you have the DIAN spreadsheet, copy the CUFE column and paste it in the green box above; I will tell you right away which documents you already have and which ones are missing, without checking them one by one.',
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
    <div className="min-h-screen pb-24" style={{ background: MOBILE_BG_GRADIENT }}>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">

        <div className="mb-6 flex items-center justify-between pt-2">
          <Logo size="sm" tagline="Documentos electrónicos · DIAN" href="/dashboard" />
        </div>

        <header
          className="relative mb-6 overflow-hidden px-6 py-6 text-white"
          style={{ background: DARK_GRADIENT, borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
        >
          <div className="pointer-events-none absolute inset-0" style={{ background: GLOW_TOP_RIGHT }} />
          <div className="relative flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight">Documentos Electrónicos</h1>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/90">
              Beta
            </span>
            {beta && !beta.ilimitado && (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums ring-1 ${
                beta.restantesPersona === 0
                  ? 'bg-rose-500/20 text-rose-200 ring-rose-400/30'
                  : beta.restantesPersona <= 20
                    ? 'bg-amber-500/20 text-amber-100 ring-amber-400/30'
                    : 'bg-white/10 text-white/70 ring-white/15'
              }`}>
                {beta.restantesPersona} de {beta.limitePersona} documentos disponibles
              </span>
            )}
          </div>
          <p className="relative mt-1.5 max-w-xl text-sm leading-relaxed text-white/70">
            Convierte los XML de la DIAN en información contable lista para usar.
            Sin abrir archivos, sin copiar CUFEs, sin armar el Excel a mano.
          </p>
        </header>

        {/* ── Guía paso a paso, dentro de la propia herramienta ───────── */}
        <section className="mb-6 overflow-hidden bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
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
        <section className="mb-6 p-5 text-white" style={{ background: DARK_GRADIENT, borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
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

        {/* ── Verificar por lista de CUFEs ─────────────────────────────
            Responde la pregunta que el contador resuelve hoy a mano: de lo
            que la DIAN dice que tengo, ¿qué ya está cargado y qué me falta?
            No descarga nada de la DIAN: cruza contra lo que ya está aquí. */}
        <section className="mb-6 overflow-hidden bg-emerald-50/50 ring-2 ring-emerald-200"
          style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <button
            type="button"
            onClick={() => setPanelCufes((v) => !v)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
              <ListChecks className="size-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 text-base font-bold text-slate-900">
                ¿Te faltan documentos? Pega aquí tus CUFEs
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Nuevo
                </span>
              </span>
              <span className="mt-0.5 block text-xs text-slate-600">
                Copia la columna de CUFEs del Excel de la DIAN y te digo al instante cuáles ya
                tienes cargados y cuáles te faltan. Sin revisar uno por uno.
              </span>
            </div>
            <ChevronRight className={`size-4 shrink-0 text-slate-400 transition ${panelCufes ? 'rotate-90' : ''}`} />
          </button>

          {panelCufes && (
            <div className="border-t border-emerald-200 bg-white px-5 py-5">
              <textarea
                value={textoCufes}
                onChange={(e) => setTextoCufes(e.target.value)}
                rows={5}
                placeholder="Pega aquí los CUFEs, uno por línea. También funciona copiando la columna directamente del Excel."
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs outline-none transition focus:border-emerald-400 focus:bg-white"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void ejecutarCruce()}
                  disabled={cruzando}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {cruzando ? 'Verificando…' : 'Verificar'}
                </button>
                {cruce && (
                  <button
                    type="button"
                    onClick={() => { setCruce(null); setTextoCufes(''); }}
                    className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {cruce && (
                <div className="mt-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { l: 'En tu lista', v: cruce.total, c: 'text-slate-900' },
                      { l: 'Ya los tienes', v: cruce.encontrados.length, c: 'text-emerald-600' },
                      { l: 'Te faltan', v: cruce.faltantes.length, c: 'text-amber-600' },
                      { l: 'Mal copiados', v: cruce.invalidos.length, c: 'text-rose-600' },
                    ].map((x) => (
                      <div key={x.l} className="rounded-xl bg-slate-50 px-3 py-3">
                        <div className={`text-xl font-bold tabular-nums ${x.c}`}>{x.v}</div>
                        <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{x.l}</div>
                      </div>
                    ))}
                  </div>

                  {cruce.repetidosEnLista > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      {cruce.repetidosEnLista} estaban repetidos en tu lista; se contaron una sola vez.
                    </p>
                  )}

                  {cruce.faltantes.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Los que te faltan</span>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(cruce.faltantes.join(String.fromCharCode(10)));
                            toast.success('Copiados. Búscalos en el portal de la DIAN y súbelos aquí.');
                          }}
                          className="flex items-center gap-1 text-xs font-semibold text-emerald-600"
                        >
                          <Copy className="size-3" /> Copiar los {cruce.faltantes.length}
                        </button>
                      </div>
                      <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-50 p-3">
                        {cruce.faltantes.map((c) => (
                          <div key={c} className="truncate font-mono text-[11px] text-slate-500">{c}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cruce.invalidos.length > 0 && (
                    <p className="mt-3 rounded-xl bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-700 ring-1 ring-rose-200">
                      {cruce.invalidos.length} línea(s) no tienen forma de CUFE. Un CUFE son 96 caracteres
                      entre números y letras de la a a la f. Revisa que copiaste la columna completa.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

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
                className="px-6 py-3 text-sm font-bold text-white transition"
                style={{ background: BLUE_GRADIENT, borderRadius: 14, boxShadow: '0 12px 24px rgba(37,99,235,0.30)' }}
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
          <section className="mb-6 bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
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
              <div key={c.l} className="bg-white px-4 py-3.5" style={{ borderRadius: 18, boxShadow: CARD_SHADOW }}>
                <div className="truncate text-lg font-bold tabular-nums text-slate-900">{c.v}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{c.l}</div>
              </div>
            ))}
          </section>
        )}

        {/* ── Tabla ───────────────────────────────────────────────────── */}
        <section className="bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
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
                      <tr key={d.id} onClick={() => void abrirDetalle(d.id)} className="cursor-pointer border-b border-slate-50 transition hover:bg-slate-50/60">
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

      {(detalle || cargandoDetalle) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setDetalle(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
            {cargandoDetalle || !detalle ? (
              <div className="flex h-full items-center justify-center"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
            ) : (
              <DetalleDocumento datos={detalle} onCerrar={() => setDetalle(null)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Panel de detalle. Muestra el modelo ya normalizado, no el XML: el
 *  contador no tiene por que leer namespaces. Se separa del componente
 *  principal para que el cuerpo de la pagina siga siendo legible. */
function DetalleDocumento({ datos, onCerrar }: { datos: any; onCerrar: () => void }) {
  const d = datos.documento as Record<string, any>;
  const lineas = (datos.lineas ?? []) as Array<Record<string, any>>;
  const impuestos = (datos.impuestos ?? []) as Array<Record<string, any>>;
  const excepciones = (datos.excepciones ?? []) as Array<Record<string, any>>;
  const e = ESTADO[d.status] ?? { texto: d.status, clase: 'bg-slate-100 text-slate-600 ring-slate-200' };

  const Fila = ({ k, v }: { k: string; v: React.ReactNode }) => (
    <div className="flex justify-between gap-4 border-b border-slate-50 py-2 text-sm">
      <span className="shrink-0 text-slate-400">{k}</span>
      <span className="min-w-0 break-words text-right font-medium text-slate-800">{v || '—'}</span>
    </div>
  );

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-100 bg-white px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-slate-900">{d.full_number}</h2>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${e.clase}`}>{e.texto}</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{ETIQUETA_TIPO[d.doc_type] ?? d.doc_type} · {d.issue_date}</p>
        </div>
        <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100">
          <X className="size-5" />
        </button>
      </div>

      <div className="px-5 py-4">
        {excepciones.length > 0 && (
          <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">Que debes revisar</p>
            {excepciones.map((x, i) => (
              <p key={x.id ?? i} className="text-sm leading-relaxed text-amber-900">
                {x.message}
                {x.expected && (
                  <span className="mt-0.5 block text-xs text-amber-700">
                    El documento dice {x.expected}; segun sus propias cifras deberia ser {x.found}.
                  </span>
                )}
              </p>
            ))}
          </div>
        )}

        <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Proveedor</h3>
        <Fila k="Razon social" v={d.issuer_name} />
        <Fila k="NIT" v={d.issuer_dv ? `${d.issuer_nit}-${d.issuer_dv}` : d.issuer_nit} />
        <Fila k="Cliente" v={d.receiver_name} />

        <h3 className="mb-1 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">Documento</h3>
        <Fila k="Emision" v={d.issue_date} />
        <Fila k="Vencimiento" v={d.due_date} />
        <Fila k="Validado por la DIAN" v={d.dian_validated ? `Si, ${d.dian_validated_at ?? ''}` : 'No viene el acuse'} />
        <Fila k="CUFE" v={<span className="font-mono text-[10px] leading-tight">{d.cufe}</span>} />

        <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">Lineas ({lineas.length})</h3>
        <div className="space-y-2">
          {lineas.map((l, i) => (
            <div key={l.id ?? i} className="rounded-xl bg-slate-50 px-3.5 py-3">
              <p className="text-sm font-medium text-slate-800">{l.description || 'Sin descripcion'}</p>
              <p className="mt-1 text-xs tabular-nums text-slate-500">
                {Number(l.quantity)} × {pesos(Number(l.unit_price))} = {pesos(Number(l.line_total))}
              </p>
            </div>
          ))}
        </div>

        <h3 className="mb-1 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">Impuestos</h3>
        {impuestos.filter((t) => t.scope === 'document').map((t, i) => (
          <Fila
            key={t.id ?? i}
            k={`${t.tax_name || t.tax_code}${Number(t.rate) ? ` ${Number(t.rate)}%` : ''}${t.is_withholding ? ' (retencion)' : ''}`}
            v={pesos(Number(t.amount))}
          />
        ))}

        <h3 className="mb-1 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">Totales</h3>
        <Fila k="Subtotal" v={pesos(Number(d.line_total))} />
        <Fila k="Base gravable" v={pesos(Number(d.taxable_base))} />
        <Fila k="IVA" v={pesos(Number(d.total_iva))} />
        {Number(d.total_retenciones) > 0 && <Fila k="Retenciones" v={pesos(Number(d.total_retenciones))} />}
        <div className="mt-2 flex justify-between border-t-2 border-slate-900 pt-2">
          <span className="text-sm font-bold text-slate-900">Total</span>
          <span className="text-base font-bold tabular-nums text-slate-900">{pesos(Number(d.total))}</span>
        </div>

        <h3 className="mb-1 mt-6 text-xs font-bold uppercase tracking-wide text-slate-400">Autorizacion DIAN</h3>
        <Fila k="Resolucion" v={d.dian_resolution} />
        <Fila k="Rango" v={d.dian_range_from ? `${d.dian_range_from} – ${d.dian_range_to}` : ''} />
        <div className="h-8" />
      </div>
    </div>
  );
}
