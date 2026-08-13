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
  Trash2, Inbox, CheckCheck, FileSpreadsheet, MessageSquare, Scale, CloudDownload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';
import { Logo } from '../components/brand/Logo';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { PlantillaContable } from '../components/dian/PlantillaContable';
import { AuditorFiscal } from '../components/dian/AuditorFiscal';
import { DescargarDeDian } from '../components/dian/DescargarDeDian';
import type { DocumentoDian } from '../../lib/dian/auditoria';
import {
  CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT, DARK_GRADIENT,
  MOBILE_BG_GRADIENT, GLOW_TOP_RIGHT,
} from '../styles/mobile-theme';
import { isAdminEmail } from '../utils/admin-access';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
  importarArchivos, listarDocumentos, obtenerTotales, datosParaReporte,
  estadoBeta, configurarBeta, BetaCerradaError, type EstadoBeta,
  cruzarCufes, obtenerDocumento, type CruceCufes,
  enviarFeedback, listarFeedback, guardarPermitidosDescarga, type Feedback,
  listarExcepciones, resolverExcepcion, borrarDocumentos, type ExcepcionListada,
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

/**
 * La pantalla, envuelta en su propia frontera de errores.
 *
 * Sin ella, cualquier fallo de render aquí sube hasta la frontera de la ruta y
 * cambia la página entera por «Ocurrió un inconveniente»: el contador pierde
 * los CUFEs pegados y la carpeta elegida, y no queda ni rastro de qué falló.
 * Con ella el error se ve, se puede copiar y se puede reintentar sin recargar.
 */
export default function DianDocumentsPage() {
  return (
    <ErrorBoundary zona="Automatización para Contadores">
      <ContenidoDian />
    </ErrorBoundary>
  );
}

function ContenidoDian() {
  const { user, loading: cargandoSesion, signInWithMagicLink } = useAuth();
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
  // Quién ve la descarga masiva. Lo decide el servidor y llega en `beta`;
  // `ilimitado` es sólo el respaldo mientras esa consulta va y vuelve, para
  // que al propietario no le parpadee el botón al entrar.
  //
  // Va DESPUÉS del useState de `beta`, no junto a `ilimitado` arriba: leerlo
  // antes de declararlo es un error de zona muerta temporal que tumba la
  // página entera al montar, y en producción sale como «Ocurrió un
  // inconveniente» sin más pistas.
  const puedeDescargar = beta?.puedeDescargar ?? ilimitado;
  const { speak } = useVoiceSpeak();
  const [panelPlantilla, setPanelPlantilla] = useState(false);
  const [correo, setCorreo] = useState('');
  const [enviandoEnlace, setEnviandoEnlace] = useState(false);
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);

  const pedirEnlace = async () => {
    const e = correo.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      toast.error('Escribe un correo válido');
      return;
    }
    setEnviandoEnlace(true);
    try {
      // Vuelve a ESTA pantalla, no al destino por defecto: quien llegó por
      // un enlace compartido a la herramienta espera aterrizar en ella.
      await signInWithMagicLink(e, '/documentos-electronicos');
      setEnlaceEnviado(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setEnviandoEnlace(false);
    }
  };
  const [panelAuditor, setPanelAuditor] = useState(false);
  const [panelDescarga, setPanelDescarga] = useState(false);

  // ── Panel del propietario: quién prueba la descarga, y qué respondieron ──
  const [nuevoTester, setNuevoTester] = useState('');
  const [guardandoTesters, setGuardandoTesters] = useState(false);
  const [respuestas, setRespuestas] = useState<Record<string, unknown>[] | null>(null);
  const [cargandoRespuestas, setCargandoRespuestas] = useState(false);

  const guardarTesters = async (correos: string[], aviso: string) => {
    setGuardandoTesters(true);
    try {
      await guardarPermitidosDescarga(correos);
      await refrescar();
      toast.success(aviso);
    } catch (e) { toast.error((e as Error).message); }
    finally { setGuardandoTesters(false); }
  };

  const agregarTester = async () => {
    const correo = nuevoTester.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
      toast.error('Escribe un correo válido');
      return;
    }
    const actuales = beta?.descargaPermitidos ?? [];
    if (actuales.includes(correo)) {
      toast.error('Esa persona ya tiene acceso');
      return;
    }
    await guardarTesters([...actuales, correo], `${correo} ya puede usar la descarga`);
    setNuevoTester('');
  };

  const quitarTester = async (correo: string) => {
    const actuales = beta?.descargaPermitidos ?? [];
    await guardarTesters(actuales.filter((c) => c !== correo), `Se le quitó el acceso a ${correo}`);
  };

  const cargarRespuestas = async () => {
    setCargandoRespuestas(true);
    try {
      setRespuestas(await listarFeedback() as Record<string, unknown>[]);
    } catch (e) { toast.error((e as Error).message); }
    finally { setCargandoRespuestas(false); }
  };

  /** Las respuestas en CSV, para poder cruzarlas en una hoja de cálculo con
   *  los correos a los que hay que volver a escribir. */
  const descargarRespuestas = () => {
    if (!respuestas?.length) return;
    const columnas = ['created_at', 'email', 'xml_manuales', 'clientes', 'precio', 'sistema_contable', 'falta'];
    const escapar = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [
      columnas.join(';'),
      ...respuestas.map((r) => columnas.map((c) => escapar(r[c])).join(';')),
    ].join('\n');
    // El BOM es lo que hace que Excel en español abra las tildes bien.
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `encuesta-dian-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** Atajo para narrar. El asistente decide solo si suena: si el contador
   *  tiene la guía apagada, speak() no hace nada, así que no hay que
   *  consultar su estado en cada llamada. */
  const narrar = useCallback((es: string, en: string) => speak({ es, en }), [speak]);

  // Bandeja de excepciones y limpieza
  const [vista, setVista] = useState<'documentos' | 'revision'>('documentos');
  const [excepciones, setExcepciones] = useState<ExcepcionListada[] | null>(null);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [borrando, setBorrando] = useState(false);

  const cargarExcepciones = useCallback(async () => {
    try { setExcepciones(await listarExcepciones()); }
    catch (e) { toast.error((e as Error).message); }
  }, []);

  const resolver = async (ex: ExcepcionListada) => {
    try {
      await resolverExcepcion(ex.id);
      await Promise.all([cargarExcepciones(), refrescar()]);
      toast.success('Marcada como revisada');
    } catch (e) { toast.error((e as Error).message); }
  };

  const alternarSeleccion = (id: string) => {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const borrar = async (ids?: string[]) => {
    const cuantos = ids ? ids.length : documentos.length;
    const mensaje = ids
      ? `¿Borrar ${cuantos} documento(s)? No se puede deshacer.`
      : '¿Borrar TODOS tus documentos? No se puede deshacer.';
    if (!window.confirm(mensaje)) return;

    setBorrando(true);
    try {
      const n = await borrarDocumentos(ids);
      setSeleccion(new Set());
      await Promise.all([refrescar(), cargarExcepciones()]);
      toast.success(`${n} documento(s) borrados`);
    } catch (e) { toast.error((e as Error).message); }
    finally { setBorrando(false); }
  };

  // Encuesta. Se muestra tras la primera importación: es el momento en que
  // el contador acaba de ver el resultado y sabe si le sirvió — preguntarle
  // antes sería pedirle una opinión que todavía no tiene.
  const [encuesta, setEncuesta] = useState<Feedback>({
    xml_manuales: '', clientes: '', precio: '', falta: '', sistema_contable: '',
  });
  const [encuestaEnviada, setEncuestaEnviada] = useState(false);
  // Se recuerda el cierre para no volver a interrumpirlo en cada
  // importación. El enlace de abajo queda siempre, por si cambia de idea.
  const [encuestaAbierta, setEncuestaAbierta] = useState(false);
  const [encuestaCerrada, setEncuestaCerrada] = useState(
    () => localStorage.getItem('codec_dian_encuesta') === 'cerrada',
  );

  const cerrarEncuesta = () => {
    setEncuestaAbierta(false);
    setEncuestaCerrada(true);
    localStorage.setItem('codec_dian_encuesta', 'cerrada');
  };
  const [enviandoEncuesta, setEnviandoEncuesta] = useState(false);

  const mandarEncuesta = async () => {
    if (!encuesta.precio && !encuesta.falta.trim()) {
      toast.error('Cuéntanos al menos cuánto pagarías o qué te falta');
      return;
    }
    setEnviandoEncuesta(true);
    try {
      await enviarFeedback(encuesta, user?.email);
      setEncuestaEnviada(true);
      toast.success('¡Gracias! Lo leemos todo.');
    } catch (e) { toast.error((e as Error).message); }
    finally { setEnviandoEncuesta(false); }
  };

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
    try {
      const d = await obtenerDocumento(id);
      setDetalle(d);
      const doc = d.documento as Record<string, unknown>;
      const obs = (d.excepciones ?? []).length;
      if (obs > 0) {
        narrar(
          `Este documento tiene ${obs === 1 ? 'una observación' : `${obs} observaciones`}. Te las puse arriba del todo, explicadas con las cifras del propio documento.`,
          `This document has ${obs === 1 ? 'one issue' : `${obs} issues`}. I put them at the top, explained with the document's own figures.`,
        );
      } else {
        narrar(
          `Factura ${String(doc.full_number ?? '')} de ${String(doc.issuer_name ?? '')}. Está correcta: los totales cuadran con sus líneas y sus impuestos.`,
          `Invoice ${String(doc.full_number ?? '')} from ${String(doc.issuer_name ?? '')}. It is correct: the totals match its lines and taxes.`,
        );
      }
    }
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
  useEffect(() => {
    if (vista !== 'revision') return;
    void cargarExcepciones();
    narrar(
      'Estos son los documentos donde encontré algo que no cuadra. Son los únicos que necesitas mirar: el resto ya quedó listo. Cuando revises uno, dale a Ya la revisé y desaparece de la lista.',
      'These are the documents where I found something that does not add up. They are the only ones you need to look at; the rest are done. When you check one, click I reviewed it and it disappears from the list.',
    );
  }, [vista, cargarExcepciones, narrar]);

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

  /** Saca los archivos de lo que el usuario soltó, incluidas las carpetas.
   *
   *  Arrastrar la carpeta con los treinta comprimidos dentro es el gesto
   *  natural, pero `dataTransfer.files` viene VACÍO para una carpeta: hay
   *  que recorrerla con la API de entradas. Sin esto, soltar una carpeta no
   *  hacía absolutamente nada y parecía que la herramienta estaba rota. */
  const archivosDeSoltar = async (dt: DataTransfer): Promise<File[]> => {
    const items = Array.from(dt.items ?? []);
    const raices = items
      .map((i) => (typeof i.webkitGetAsEntry === 'function' ? i.webkitGetAsEntry() : null))
      .filter(Boolean) as FileSystemEntry[];

    if (raices.length === 0) return Array.from(dt.files);

    const salida: File[] = [];
    const recorrer = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const f = await new Promise<File | null>((res) =>
          (entry as FileSystemFileEntry).file((x) => res(x), () => res(null)),
        );
        if (f) salida.push(f);
        return;
      }
      if (!entry.isDirectory) return;
      const lector = (entry as FileSystemDirectoryEntry).createReader();
      // readEntries devuelve por tandas: hay que insistir hasta que venga
      // vacío, o una carpeta con muchos archivos se lee a medias.
      for (;;) {
        const tanda = await new Promise<FileSystemEntry[]>((res) =>
          lector.readEntries((e) => res(e), () => res([])),
        );
        if (tanda.length === 0) break;
        for (const e of tanda) await recorrer(e);
      }
    };

    for (const r of raices) await recorrer(r);
    return salida;
  };

  const procesar = async (archivos: FileList | File[] | null) => {
    if (!archivos || archivos.length === 0) return;
    setCargando(true);
    setResumen(null);
    setFeed([]);
    narrar(
      'Voy a leer tus documentos. No cierres esta pestaña; te aviso en cuanto termine.',
      'I am going to read your documents. Do not close this tab; I will let you know as soon as I finish.',
    );
    try {
      const r = await importarArchivos(Array.from(archivos), (e) => {
        setProgreso(e);
        if (e.ultimo) setFeed((prev) => [e.ultimo!, ...prev].slice(0, 8));
      });
      setResumen(r);
      setAyudaAbierta(false);
      if (!encuestaEnviada && !encuestaCerrada) {
        // Un respiro tras el resumen: abrirla encima del resultado le
        // taparía justo lo que acaba de esperar.
        setTimeout(() => setEncuestaAbierta(true), 2500);
      }
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
      narrar(
        `Tu Excel se está descargando con ${docs.length} documentos. Trae cuatro hojas: un resumen con los totales del periodo, el detalle línea por línea de cada producto, una hoja con un renglón por documento, y las retenciones aparte. Ábrelo con Excel y ya lo puedes trabajar.`,
        `Your Excel is downloading with ${docs.length} documents. It has four sheets: a summary with the period totals, the line by line detail of each product, one row per document, and withholdings separately. Open it in Excel and it is ready to work with.`,
      );
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
      <div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: MOBILE_BG_GRADIENT }}>
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Logo size="sm" tagline="Automatización para contadores · DIAN" href="/" />
          </div>

          <div className="overflow-hidden bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <div className="relative px-7 pb-6 pt-7 text-white" style={{ background: DARK_GRADIENT }}>
              <div className="pointer-events-none absolute inset-0" style={{ background: GLOW_TOP_RIGHT }} />
              <h1 className="relative text-xl font-black tracking-tight">Automatización para Contadores</h1>
              <p className="relative mt-1.5 text-sm leading-relaxed text-white/70">
                Suelta el ZIP de la DIAN y te devuelvo el Excel armado, con los duplicados
                detectados y solo los documentos que necesitas revisar.
              </p>
            </div>

            <div className="px-7 py-6">
              {enlaceEnviado ? (
                <div className="text-center">
                  <CheckCircle2 className="mx-auto mb-3 size-9 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-900">Revisa tu correo</p>
                  <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-slate-500">
                    Te envié un enlace a <strong className="text-slate-700">{correo.trim()}</strong>.
                    Ábrelo <strong>desde este mismo dispositivo</strong> y entras directo, sin
                    contraseña.
                  </p>
                  <button
                    type="button"
                    onClick={() => setEnlaceEnviado(false)}
                    className="mt-4 text-xs font-semibold text-slate-400 underline"
                  >
                    Usar otro correo
                  </button>
                </div>
              ) : (
                <>
                  <p className="mb-4 text-center text-sm font-semibold text-slate-800">
                    Entra para empezar. Es gratis.
                  </p>

                  {/* Google primero: es un clic y no exige recordar nada. */}
                  <div className="flex justify-center">
                    <GoogleSignInButton width={300} />
                  </div>

                  <div className="my-5 flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-100" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-300">o</span>
                    <span className="h-px flex-1 bg-slate-100" />
                  </div>

                  <label className="block text-xs font-semibold text-slate-600">
                    Con tu correo, sin contraseña
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') void pedirEnlace(); }}
                      placeholder="tucorreo@ejemplo.com"
                      className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void pedirEnlace()}
                    disabled={enviandoEnlace}
                    className="mt-3 flex w-full items-center justify-center gap-2 py-3 text-sm font-bold text-white transition disabled:opacity-50"
                    style={{ background: BLUE_GRADIENT, borderRadius: 14, boxShadow: '0 12px 24px rgba(37,99,235,0.28)' }}
                  >
                    {enviandoEnlace ? <Loader2 className="size-4 animate-spin" /> : null}
                    Enviarme el enlace de acceso
                  </button>
                  <p className="mt-2.5 text-center text-[11px] leading-relaxed text-slate-400">
                    Te llega un enlace al correo. Lo abres y ya estás dentro — no hay que
                    crear contraseña ni recordar nada.
                  </p>
                </>
              )}
            </div>
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
            Pedimos el correo para guardar tus documentos separados de los de otros contadores.
            Nada de lo que subas es visible para nadie más.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: MOBILE_BG_GRADIENT }}>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">

        <div className="mb-6 flex items-center justify-between pt-2">
          <Logo size="sm" tagline="Automatización para contadores · DIAN" href="/dashboard" />
        </div>

        <header
          className="relative mb-6 overflow-hidden px-6 py-6 text-white"
          style={{ background: DARK_GRADIENT, borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
        >
          <div className="pointer-events-none absolute inset-0" style={{ background: GLOW_TOP_RIGHT }} />
          <div className="relative flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight">Automatización para Contadores</h1>
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

          {/* Acción de salida. Va en el encabezado y no enterrada entre las
              secciones porque es el final del recorrido del contador: lo que
              vino a buscar es llevarse los datos a su programa. */}
          {/* Descargar XML de la DIAN — todavía no abierta a todo el mundo.
              El endpoint de descarga por documento no se ha confirmado contra
              el portal real, y abrirla antes daría fallos justo en la función
              que el contador más espera, que es la peor primera impresión
              posible.
              Quién la ve lo decide el servidor (ed_descarga_permitida): el
              propietario y los correos que él autorice desde el panel. Este
              `if` sólo evita mostrar un botón que no va a funcionar; el
              cierre de verdad está en la Edge Function `dian-descargar`,
              porque esconder un botón no cierra nada. */}
          {puedeDescargar && (
            <button
              type="button"
              onClick={() => setPanelDescarga(true)}
              className="relative mr-2 mt-4 inline-flex items-center gap-2.5 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
                borderRadius: 14,
                boxShadow: '0 12px 26px rgba(2,132,199,0.35)',
              }}
            >
              <CloudDownload className="size-4" />
              Descargar XML de la DIAN
              {/* La insignia dice el estado REAL, no quién eres. Decía «solo
                  tú» a cualquiera que fuera el propietario, así que después de
                  abrir la herramienta a todo el mundo seguía anunciando que
                  estaba cerrada — y no había forma de saber desde la pantalla
                  si el cambio había surtido efecto. */}
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                {beta?.descargaAbierta ? 'beta abierta' : ilimitado ? 'solo tú' : 'en pruebas'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPanelPlantilla(true)}
            className="relative mt-4 inline-flex items-center gap-2.5 px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
              borderRadius: 14,
              boxShadow: '0 12px 26px rgba(124,58,237,0.35)',
            }}
          >
            <FileSpreadsheet className="size-4" />
            Llevar a mi programa contable
          </button>

          <button
            type="button"
            onClick={() => setPanelAuditor(true)}
            className="relative ml-2 mt-4 inline-flex items-center gap-2.5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
            style={{ background: 'rgba(255,255,255,0.10)', borderRadius: 14 }}
          >
            <Scale className="size-4" />
            Comparar con mi contabilidad
          </button>
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

          {/* ── Quién puede probar la descarga masiva ─────────────────────
              La descarga sale por las IPs de Supabase, compartidas con el
              resto de la plataforma: si la DIAN bloquea esa IP por abuso, la
              bloquea para todos. Por eso se abre persona por persona y no
              con un interruptor de «todos». */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <h3 className="text-xs font-bold text-white/80">Acceso a «Descargar XML de la DIAN»</h3>

            {/* Abrir y cerrar en un clic, sin desplegar. Todo el tráfico sale
                por las IPs de Supabase, compartidas con el resto de la
                plataforma: si la DIAN bloquea esa IP por abuso, la bloquea
                para todos los clientes a la vez. */}
            <label className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2.5">
              <input
                type="checkbox"
                checked={Boolean(beta.descargaAbierta)}
                onChange={(e) => {
                  const abrir = e.target.checked;
                  void configurarBeta('dian_descarga_abierta', abrir ? 'true' : 'false')
                    .then(() => { toast.success(abrir ? 'Abierta para todos' : 'Cerrada: sólo tú y los autorizados'); void refrescar(); })
                    .catch((err) => toast.error(err.message));
                }}
                className="size-4 accent-emerald-400"
              />
              <span className="text-xs">
                <span className="block font-bold">Abierta para todos</span>
                <span className="block text-white/40">
                  {beta.descargaAbierta
                    ? 'Cualquier usuario con sesión puede descargar. Siguen vigentes el cierre por fecha, el tope global y el ritmo de 2 peticiones por segundo.'
                    : 'Sólo tú y los correos de abajo.'}
                </span>
              </span>
            </label>

            <p className="mt-0.5 text-[11px] leading-relaxed text-white/40">
              Escribe el correo con el que la persona entra a Codec. Tendrá acceso
              en cuanto recargue; tú siempre lo tienes.
            </p>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <input
                value={nuevoTester}
                onChange={(e) => setNuevoTester(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void agregarTester(); } }}
                placeholder="contador@correo.com"
                className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:bg-white/15"
              />
              <button
                type="button"
                onClick={() => void agregarTester()}
                disabled={guardandoTesters}
                className="rounded-lg bg-white/15 px-3.5 py-2 text-xs font-bold transition hover:bg-white/25 disabled:opacity-50"
              >
                {guardandoTesters ? <Loader2 className="size-3.5 animate-spin" /> : 'Dar acceso'}
              </button>
            </div>

            {beta.descargaPermitidos && beta.descargaPermitidos.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {beta.descargaPermitidos.map((correo) => (
                  <li key={correo} className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-1.5 text-xs">
                    <span className="max-w-[220px] truncate">{correo}</span>
                    <button
                      type="button"
                      onClick={() => void quitarTester(correo)}
                      disabled={guardandoTesters}
                      title={`Quitar acceso a ${correo}`}
                      className="rounded-full p-0.5 text-white/50 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-white/30">
                Nadie más tiene acceso todavía.
              </p>
            )}
          </div>

          {/* ── Respuestas de la encuesta ─────────────────────────────────
              Se guardaban desde el primer día pero no había dónde leerlas,
              que es como no haberlas pedido. */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-white/80">Respuestas de la encuesta</h3>
              <button
                type="button"
                onClick={() => void cargarRespuestas()}
                disabled={cargandoRespuestas}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/20 disabled:opacity-50"
              >
                {cargandoRespuestas
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : respuestas === null ? 'Ver respuestas' : 'Actualizar'}
              </button>
              {respuestas !== null && respuestas.length > 0 && (
                <button
                  type="button"
                  onClick={descargarRespuestas}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-bold transition hover:bg-white/20"
                >
                  Descargar CSV
                </button>
              )}
            </div>

            {respuestas !== null && (
              respuestas.length === 0 ? (
                <p className="mt-2 text-[11px] text-white/30">
                  Todavía nadie ha respondido. La encuesta aparece cuando alguien
                  termina su primera importación.
                </p>
              ) : (
                <div className="mt-2.5 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {respuestas.map((r) => (
                    <div key={String(r.id)} className="rounded-xl bg-white/5 px-3 py-2.5 text-[11px] leading-relaxed">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-white/50">
                        <span className="font-semibold text-white/80">{String(r.email ?? 'sin correo')}</span>
                        <span>·</span>
                        <span>{new Date(String(r.created_at)).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <div className="mt-1.5 grid gap-1 sm:grid-cols-2">
                        {([
                          ['XML al mes a mano', r.xml_manuales],
                          ['Clientes', r.clientes],
                          ['Pagaría', r.precio],
                          ['Sistema contable', r.sistema_contable],
                        ] as const).map(([etiqueta, valor]) => (
                          valor ? (
                            <div key={etiqueta}>
                              <span className="text-white/40">{etiqueta}: </span>
                              <span className="text-white/85">{String(valor)}</span>
                            </div>
                          ) : null
                        ))}
                      </div>
                      {r.falta ? (
                        <p className="mt-1.5 border-l-2 border-white/20 pl-2 text-white/70">
                          «{String(r.falta)}»
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
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
                onPaste={() => {
                  // Al pegar, no al teclear: narrar en cada pulsación sería
                  // insufrible, y pegar es el gesto real del contador.
                  setTimeout(() => narrar(
                    'Ya tengo tu lista. Dale al botón Verificar y te digo cuáles de esos documentos ya están cargados aquí y cuáles te faltan por subir.',
                    'I have your list. Click Verify and I will tell you which of those documents are already loaded here and which ones you still need to upload.',
                  ), 250);
                }}
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
          onDrop={(e) => {
            e.preventDefault();
            void archivosDeSoltar(e.dataTransfer).then((fs) => procesar(fs));
          }}
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
              <p className="mb-4 text-xs text-slate-400">
                Puedes soltar varios a la vez, o la carpeta entera. También sirven los XML sueltos.
              </p>
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
            {resumen.rechazados.length > 0 && (
              <div className="mb-3 rounded-xl bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-800 ring-1 ring-rose-200">
                <p className="mb-1 font-bold">
                  {resumen.rechazados.length} archivo(s) no se pudieron abrir. El resto sí se procesó.
                </p>
                {resumen.rechazados.slice(0, 6).map((r) => (
                  <p key={r.nombre} className="truncate">· {r.nombre} — {r.motivo}</p>
                ))}
                {resumen.rechazados.length > 6 && <p>· y {resumen.rechazados.length - 6} más</p>}
              </div>
            )}
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


        {/* Llamado anclado: si cerró la encuesta, el acceso no desaparece.
            Pedir opinión una vez y rendirse deja fuera a quien la habría
            dado más tarde, cuando ya usó la herramienta de verdad. */}
        {resumen && !encuestaEnviada && (
          <button
            type="button"
            onClick={() => setEncuestaAbierta(true)}
            className="mb-6 flex w-full items-center gap-3 bg-white px-5 py-4 text-left transition hover:bg-slate-50"
            style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: BLUE_GRADIENT }}>
              <MessageSquare className="size-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900">Ayúdame con esta encuesta</span>
              <span className="block text-xs text-slate-500">
                Cinco preguntas de treinta segundos. Decides qué construimos después.
              </span>
            </div>
            <span className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold text-white" style={{ background: BLUE_GRADIENT }}>
              Responder
            </span>
          </button>
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
          <div className="flex items-center gap-1 border-b border-slate-100 px-4 pt-3">
            {([
              ['documentos', 'Documentos', documentos.length],
              ['revision', 'Requieren revisión', totales?.revision ?? 0],
            ] as const).map(([v, l, n]) => (
              <button
                key={v}
                type="button"
                onClick={() => setVista(v)}
                className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${
                  vista === v
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {v === 'revision' && <Inbox className="size-4" />}
                {l}
                {n > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                    v === 'revision' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {n}
                  </span>
                )}
              </button>
            ))}
          </div>

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
            {seleccion.size > 0 && (
              <button
                type="button"
                onClick={() => void borrar([...seleccion])}
                disabled={borrando}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                Borrar {seleccion.size}
              </button>
            )}
            {documentos.length > 0 && seleccion.size === 0 && (
              <button
                type="button"
                onClick={() => void borrar()}
                disabled={borrando}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-3.5 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                Borrar todo
              </button>
            )}
          </div>

          {vista === 'revision' ? (
            excepciones === null ? (
              <div className="flex justify-center py-16"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
            ) : excepciones.length === 0 ? (
              /* Dos vacíos que parecían el mismo y no lo son.
                 Si hay documentos marcados «Requiere revisión» pero ninguna
                 observación guardada, decir «no hay nada que revisar»
                 contradice la insignia y deja al contador sin saber a quién
                 creer. Se distingue y se explica. */
              (() => {
                const marcados = documentos.filter((d) => d.status === 'REVIEW_REQUIRED').length;
                if (marcados === 0) {
                  return (
                    <div className="px-6 py-16 text-center">
                      <CheckCheck className="mx-auto mb-3 size-8 text-emerald-400" />
                      <p className="text-sm font-semibold text-slate-700">No hay nada que revisar</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Codec no encontró observaciones en tus documentos.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="px-6 py-12 text-center">
                    <AlertTriangle className="mx-auto mb-3 size-8 text-amber-400" />
                    <p className="text-sm font-semibold text-slate-700">
                      {marcados === 1
                        ? 'Hay 1 documento marcado, pero su motivo no quedó guardado'
                        : `Hay ${marcados} documentos marcados, pero su motivo no quedó guardado`}
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
                      Fue un fallo nuestro: el motivo se calculaba al leer el XML y no llegaba a
                      guardarse, así que el documento quedaba marcado sin nada que enseñar. Ya está
                      corregido. Para recuperar el motivo de{' '}
                      {marcados === 1 ? 'este documento' : 'estos documentos'}, vuelve a importar
                      {marcados === 1 ? ' ese XML' : ' esos XML'} — los nuevos ya llegan con su
                      explicación.
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="divide-y divide-slate-50">
                {excepciones.map((ex) => (
                  <div key={ex.id} className="flex flex-wrap items-start gap-3 px-4 py-4">
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${ex.severity === 'error' ? 'text-rose-500' : 'text-amber-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {ex.documento?.full_number && (
                          <button
                            type="button"
                            onClick={() => ex.document_id && void abrirDetalle(ex.document_id)}
                            className="text-sm font-bold text-slate-900 underline decoration-slate-300 underline-offset-2"
                          >
                            {ex.documento.full_number}
                          </button>
                        )}
                        {ex.documento?.issuer_name && (
                          <span className="truncate text-xs text-slate-500">{ex.documento.issuer_name}</span>
                        )}
                        {ex.documento?.issue_date && (
                          <span className="text-xs tabular-nums text-slate-400">{ex.documento.issue_date}</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">{ex.message}</p>
                      {ex.expected && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          El documento dice <strong className="tabular-nums">{ex.expected}</strong>;
                          según sus propias cifras debería ser <strong className="tabular-nums">{ex.found}</strong>.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void resolver(ex)}
                      className="shrink-0 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ya la revisé
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : documentos.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="mx-auto mb-3 size-8 text-slate-200" />
              <p className="text-sm font-semibold text-slate-700">Todavía no hay documentos</p>
              <p className="mt-1 text-xs text-slate-400">
                Sube tu primer ZIP de la DIAN y aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-sm" translate="no">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos"
                        checked={documentos.length > 0 && seleccion.size === documentos.length}
                        onChange={(e) => setSeleccion(e.target.checked ? new Set(documentos.map((d) => d.id)) : new Set())}
                        className="size-4 accent-slate-900"
                      />
                    </th>
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
                        <td className="px-4 py-3" onClick={(ev) => ev.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar ${d.full_number ?? ''}`}
                            checked={seleccion.has(d.id)}
                            onChange={() => alternarSeleccion(d.id)}
                            className="size-4 accent-slate-900"
                          />
                        </td>
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
                          {/* La insignia dice el estado, pero no el porqué, y
                              «Requiere revisión» sin motivo deja al contador
                              adivinando. Se marca como pulsable y abre el
                              detalle, donde está «Qué debes revisar». */}
                          <span
                            title={
                              d.status === 'REVIEW_REQUIRED' || d.status === 'INVALID'
                                ? 'Clic para ver por qué'
                                : undefined
                            }
                            className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${e.clase}${
                              d.status === 'REVIEW_REQUIRED' || d.status === 'INVALID'
                                ? ' cursor-pointer underline decoration-dotted underline-offset-2'
                                : ''
                            }`}
                          >
                            {e.texto}
                            {(d.status === 'REVIEW_REQUIRED' || d.status === 'INVALID') && ' ›'}
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


      {/* ── Encuesta ─────────────────────────────────────────────────────
          En modal y no en la página: pedirla en línea la volvía una sección
          más entre otras, y se saltaba sin verla. */}
      {encuestaAbierta && !encuestaEnviada && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4" onClick={cerrarEncuesta}>
          <div
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto bg-white"
            style={{ borderRadius: 22, boxShadow: '0 30px 60px rgba(15,23,42,0.30)' }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="relative px-7 pb-5 pt-7 text-white" style={{ background: DARK_GRADIENT }}>
              <div className="pointer-events-none absolute inset-0" style={{ background: GLOW_TOP_RIGHT }} />
              <button
                type="button"
                onClick={cerrarEncuesta}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-4" />
              </button>
              <h2 className="relative text-xl font-black tracking-tight">Ayúdanos a terminarla</h2>
              <p className="relative mt-1 text-sm leading-relaxed text-white/60">
                Acabas de ver lo que hace. Cinco preguntas de treinta segundos —
                las leemos todas y deciden qué construimos después.
              </p>
            </div>

            <div className="space-y-6 px-7 py-6">
              <Pregunta
                n={1}
                titulo="¿Cuántos XML pasas a Excel a mano cada mes?"
                opciones={['Menos de 100', '100 a 500', '500 a 2.000', 'Más de 2.000']}
                valor={encuesta.xml_manuales}
                onElegir={(v) => setEncuesta((p) => ({ ...p, xml_manuales: v }))}
              />
              <Pregunta
                n={2}
                titulo="¿Cuántas empresas o clientes manejas?"
                opciones={['1 a 5', '6 a 20', '21 a 50', 'Más de 50']}
                valor={encuesta.clientes}
                onElegir={(v) => setEncuesta((p) => ({ ...p, clientes: v }))}
              />
              <Pregunta
                n={3}
                titulo="¿Cuánto pagarías al mes por esta herramienta?"
                ayuda="Ilimitada: sin límite de documentos ni de empresas."
                opciones={['$50.000', '$60.000', '$70.000', '$80.000', 'Más de $80.000', 'No pagaría']}
                valor={encuesta.precio}
                onElegir={(v) => setEncuesta((p) => ({ ...p, precio: v }))}
                destacada
              />
              <Pregunta
                n={4}
                titulo="¿Qué programa contable usas?"
                opciones={['Siigo', 'Alegra', 'World Office', 'Helisa', 'ContaPyme', 'Otro']}
                valor={encuesta.sistema_contable}
                onElegir={(v) => setEncuesta((p) => ({ ...p, sistema_contable: v }))}
              />

              <div>
                <p className="mb-2 flex items-baseline gap-2 text-sm font-bold text-slate-900">
                  <span className="text-xs font-black text-slate-300">05</span>
                  ¿Qué le falta para que la uses todos los meses?
                </p>
                <textarea
                  rows={3}
                  value={encuesta.falta}
                  onChange={(e) => setEncuesta((p) => ({ ...p, falta: e.target.value }))}
                  placeholder="Lo que sea. Mientras más concreto, mejor."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-slate-100 px-7 py-5">
              <button
                type="button"
                onClick={() => void mandarEncuesta()}
                disabled={enviandoEncuesta}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-50"
                style={{ background: BLUE_GRADIENT, borderRadius: 14, boxShadow: '0 12px 24px rgba(37,99,235,0.28)' }}
              >
                {enviandoEncuesta ? <Loader2 className="size-4 animate-spin" /> : null}
                Enviar respuestas
              </button>
              <button
                type="button"
                onClick={cerrarEncuesta}
                className="text-sm font-semibold text-slate-400 transition hover:text-slate-600"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}

      {panelDescarga && puedeDescargar && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setPanelDescarga(false)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
            <DescargarDeDian onCerrar={() => setPanelDescarga(false)} narrar={narrar} />
          </div>
        </div>
      )}

      {panelAuditor && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setPanelAuditor(false)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
            <AuditorFiscal
              onCerrar={() => setPanelAuditor(false)}
              narrar={narrar}
              cargarDocumentos={async () => {
                const { documentos: docs } = await datosParaReporte({});
                return docs as unknown as DocumentoDian[];
              }}
            />
          </div>
        </div>
      )}

      {panelPlantilla && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" onClick={() => setPanelPlantilla(false)}>
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl" onClick={(ev) => ev.stopPropagation()}>
            <PlantillaContable
              onCerrar={() => setPanelPlantilla(false)}
              narrar={narrar}
              cargarDatos={async () => {
                const { documentos: docs, lineas } = await datosParaReporte({
                  estado: filtroEstado || undefined,
                });
                return {
                  documentos: docs as Record<string, unknown>[],
                  lineas: lineas as Record<string, unknown>[],
                };
              }}
            />
          </div>
        </div>
      )}

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

/** Una pregunta de opción múltiple de la encuesta. Se extrae porque las
 *  cuatro son iguales salvo el contenido, y repetir el marcado haría el
 *  modal ilegible. */
function Pregunta({
  n, titulo, ayuda, opciones, valor, onElegir, destacada,
}: {
  n: number;
  titulo: string;
  ayuda?: string;
  opciones: string[];
  valor: string;
  onElegir: (v: string) => void;
  destacada?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 flex items-baseline gap-2 text-sm font-bold text-slate-900">
        <span className="text-xs font-black text-slate-300">{String(n).padStart(2, '0')}</span>
        {titulo}
      </p>
      {ayuda && <p className="mb-2 pl-6 text-xs text-slate-400">{ayuda}</p>}
      <div className={`flex flex-wrap gap-2 ${ayuda ? '' : 'mt-2'}`}>
        {opciones.map((o) => {
          const activa = valor === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onElegir(o)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold ring-1 transition ${
                activa
                  ? destacada
                    ? 'bg-blue-600 text-white ring-blue-600'
                    : 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
