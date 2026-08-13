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

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  FileUp, FileText, AlertTriangle, CheckCircle2, Copy, XCircle, Loader2,
  Search, Download, HelpCircle, ChevronRight, Lock, Sparkles, ListChecks, X,
  Trash2, Inbox, CheckCheck, FileSpreadsheet, MessageSquare, Scale, CloudDownload,
  Mail, Menu, LayoutDashboard, Table2, CreditCard, BarChart3, SlidersHorizontal,
  FolderOpen, ChevronLeft, ArrowRight, Clock3,
} from 'lucide-react';
import {
  PanelLateral, ANCHO_LATERAL, ANCHO_LATERAL_PLEGADA, type GrupoLateral,
} from '../components/dian/PanelLateral';
import { Bienvenida } from '../components/dian/Bienvenida';
import { RepartoPorTipo, CifrasMes, COLOR_TIPO } from '../components/dian/ResumenMes';
import { AccionesRapidas, type Accion } from '../components/dian/AccionesRapidas';
import { CajonDerecho } from '../components/dian/CajonDerecho';
import { AyudaFlotante } from '../components/dian/AyudaFlotante';
import { AnilloProgreso } from '../components/dian/AnilloProgreso';
import { VistaAnalitica } from '../components/dian/VistaAnalitica';
import { Cabecera, Tarjeta, Boton, Cifra } from '../components/dian/PiezasPanel';
import {
  FONDO_APP, RESPLANDOR_DERECHA, RESPLANDOR_IZQUIERDA,
  BOTON_PRIMARIO, BOTON_EXITO, BOTON_CORREO, BOTON_PLANTILLA,
  BOTON_NEUTRO, MOV, CARD, aparecer,
} from '../styles/contador-theme';
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
  importarArchivos, listarDocumentos, DOCS_POR_PAGINA, obtenerTotales, datosParaReporte,
  estadoBeta, configurarBeta, BetaCerradaError, type EstadoBeta,
  estadoCuota, listarPlanes, iniciarPagoPlan, LimiteDelPlanError,
  type EstadoCuota, type PlanCatalogo,
  estadoCorreo, activarCorreo, importarBandeja, listarBandeja, resumenMes,
  type EstadoCorreo, type ArchivoBandeja, type ResumenMes as ResumenMesDatos,
  cruzarCufes, obtenerDocumento, type CruceCufes,
  enviarFeedback, listarFeedback, guardarPermitidosDescarga, type Feedback,
  listarExcepciones, resolverExcepcion, borrarDocumentos, type ExcepcionListada,
  type DocumentoListado, type EventoProgreso, type ResumenImportacion, type TotalesPanel,
} from '../services/dian-service';
import { construirReporte, type DocumentoReporte, type ImpuestoReporte, type LineaReporte } from '../../lib/dian/reporte';

/** Cómo se NOMBRA cada tipo al hablarlo. Aparte de las etiquetas del Excel
 *  porque aquí encabezan una frase leída en voz alta: «Nota crédito 1234 de
 *  Distribuidora…». Un contador distingue perfectamente los tipos, y oír
 *  «factura» sobre una nota crédito le hace desconfiar del resto. */
const ETIQUETA_TIPO_VOZ: Record<string, string> = {
  factura: 'Factura',
  nota_credito: 'Nota crédito',
  nota_debito: 'Nota débito',
  documento_equivalente: 'Documento equivalente',
  documento_soporte: 'Documento soporte',
  nomina: 'Nómina electrónica',
};

const ETIQUETA_TIPO_VOZ_EN: Record<string, string> = {
  factura: 'Invoice',
  nota_credito: 'Credit note',
  nota_debito: 'Debit note',
  documento_equivalente: 'Equivalent document',
  documento_soporte: 'Supporting document',
  nomina: 'Payroll document',
};

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

/**
 * Estado de un documento, con la misma pastilla de punto + texto que usa
 * «Actividad reciente» en el dashboard principal.
 *
 * El punto no es adorno: es lo que se ve al recorrer la columna con la vista
 * sin leer, y por eso lleva un tono más saturado que el texto.
 */
/** Dónde se recuerda si el contador dejó la barra lateral plegada. */
const CLAVE_LATERAL_PLEGADA = 'codec_dian_lateral_plegada';

/**
 * Lo que dice la voz en cada sección.
 *
 * ── Por qué en una constante y no repartido por la pantalla ─────────────
 * Los guiones describen DÓNDE están las cosas, así que cada vez que se mueve
 * un botón hay que revisarlos. Repartidos por las secciones se quedan viejos
 * sin que nadie se dé cuenta: pasó con la bienvenida, que siguió mandando al
 * «recuadro azul» del correo y al «recuadro verde» de los CUFEs meses después
 * de que los dos se convirtieran en secciones del menú de la izquierda. Quien
 * se guiara por la voz buscaba dos recuadros que ya no existían.
 *
 * Juntos se releen de un vistazo cuando cambia la disposición.
 *
 * ── Por qué son cortos ──────────────────────────────────────────────────
 * Esto se ESCUCHA. Una lista de nueve funciones no se retiene: cada guion
 * dice qué es esta pantalla, qué hacer ahora mismo y qué se saca de ahí. Lo
 * demás se descubre al usarlo, que para eso cada sección tiene la suya.
 */
const GUION_SECCION: Record<string, { es: string; en: string }> = {
  inicio: {
    es: 'Bienvenido a Codec Document para contadores. Esto convierte los XML de la DIAN en información contable lista para usar, sin que abras un solo archivo. '
      + 'Para empezar ahora mismo, suelta el comprimido tal como te lo entregó la DIAN en el recuadro del centro. '
      + 'Arriba tienes los cuatro pasos del mes en orden: subir tus XML, bajarlos de la DIAN, cruzarlos con tu contabilidad y sacar el Excel. '
      + 'Cuando termine te doy el Excel de cuatro hojas y te señalo únicamente los documentos que no cuadran, que suelen ser un puñado: el resto no lo tienes que mirar.',
    en: 'Welcome to Codec Document for accountants. This turns DIAN XML files into accounting data ready to use, without you opening a single file. '
      + 'To start right now, drop the ZIP just as DIAN gave it to you into the box in the middle. '
      + 'At the top you have the four steps of the month in order: upload your XML files, download them from DIAN, cross-check them against your books, and export the spreadsheet. '
      + 'When I finish I give you the four sheet Excel and point out only the documents that do not add up, usually a handful: you can ignore the rest.',
  },
  documentos: {
    es: 'Aquí está todo lo que llevas procesado. Arriba, cómo va el mes: cuántos documentos, cuántos salieron limpios y cuánto suman. '
      + 'En la tabla puedes buscar por número, por proveedor o por NIT, y abrir cualquier documento para ver su detalle. '
      + 'Si tienes muchos, van de cincuenta en cincuenta: el total real está siempre al pie de la tabla.',
    en: 'This is everything you have processed. At the top, how the month is going: how many documents, how many came out clean and what they add up to. '
      + 'In the table you can search by number, supplier or tax ID, and open any document to see its detail. '
      + 'If you have many, they come fifty at a time: the real total is always at the foot of the table.',
  },
  correo: {
    es: 'Esta es la forma de no volver a descargar facturas. Te damos una dirección de correo sólo tuya; tus proveedores mandan ahí el XML, que la ley ya los obliga a mandarte, y entra aquí solo. '
      + 'No te pedimos la contraseña de tu correo: tú creas una regla de reenvío o le pasas la dirección a tus proveedores. '
      + 'Es la única función que necesita un plan de pago, porque cada cuenta lleva su propio buzón.',
    en: 'This is how you stop downloading invoices. We give you an email address of your own; your suppliers send the XML there, which the law already requires them to send you, and it comes in by itself. '
      + 'We do not ask for your email password: you create a forwarding rule or give the address to your suppliers. '
      + 'It is the only feature that needs a paid plan, because each account gets its own mailbox.',
  },
  cufes: {
    es: 'Esto contesta la pregunta de si te falta algún documento. Entra al portal de la DIAN, exporta el listado del periodo y copia la columna de CUFEs completa; pégala en el recuadro de la izquierda y dale a Verificar. '
      + 'Te digo cuáles ya tienes cargados y cuáles te faltan. No descarga nada: cruza tu lista contra lo que ya está aquí.',
    en: 'This answers whether you are missing any document. Go into the DIAN portal, export the period listing and copy the whole CUFE column; paste it in the box on the left and click Verify. '
      + 'I tell you which ones you already have loaded and which ones are missing. It downloads nothing: it cross-checks your list against what is already here.',
  },
  reportes: {
    es: 'Aquí te llevas los datos, de dos formas. El Excel de cuatro hojas sale de un clic y ya viene con las notas crédito restadas, listo para declarar. '
      + 'Y si prefieres el formato de tu propio programa contable, sube tu plantilla vacía y te la devuelvo llena; el mapeo queda guardado para el mes siguiente.',
    en: 'Here you take the data with you, in two ways. The four sheet spreadsheet is one click away and already has credit notes subtracted, ready to file. '
      + 'And if you prefer your own accounting software format, upload your empty template and I return it filled in; the mapping is saved for next month.',
  },
  planes: {
    es: 'Aquí ves tu consumo del mes y los planes. Todos los planes traen lo mismo —subir, descargar de la DIAN, verificar CUFEs, el Excel, las plantillas y el cruce con tu contabilidad—: lo que cambia es cuántos documentos al mes, y que recibir facturas por correo necesita un plan de pago. '
      + 'Sólo cuentan los documentos que se procesan bien; los duplicados y los que fallan no gastan cupo.',
    en: 'Here you see your usage for the month and the plans. Every plan includes the same things — upload, download from DIAN, verify CUFEs, the spreadsheet, the templates and the cross-check against your books. What changes is how many documents per month, and that receiving invoices by email needs a paid plan. '
      + 'Only documents that process correctly count; duplicates and failures do not use up your quota.',
  },
};

const ESTADO: Record<string, { texto: string; color: string; fondo: string; punto: string }> = {
  PROCESSED: { texto: 'Procesado', color: '#059669', fondo: '#ECFDF5', punto: '#10B981' },
  REVIEW_REQUIRED: { texto: 'Requiere revisión', color: '#B45309', fondo: '#FFFBEB', punto: '#F59E0B' },
  DUPLICATE: { texto: 'Duplicado', color: '#475569', fondo: '#F1F5F9', punto: '#94A3B8' },
  INVALID: { texto: 'Inválido', color: '#BE123C', fondo: '#FFF1F2', punto: '#F43F5E' },
  ERROR: { texto: 'Error', color: '#BE123C', fondo: '#FFF1F2', punto: '#F43F5E' },
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
  const { user, loading: cargandoSesion, signInWithMagicLink, logout } = useAuth();
  const navegar = useNavigate();
  const permitido = Boolean(user);
  const ilimitado = isAdminEmail(user?.email);

  const [totales, setTotales] = useState<TotalesPanel | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoListado[]>([]);
  /** Cuántos documentos cumplen el filtro actual, no cuántos se ven. Es lo
   *  que permite decir «1 a 50 de 1.250» en vez de dejar creer que 50 es
   *  todo lo que hay. */
  const [totalFiltrado, setTotalFiltrado] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState<EventoProgreso | null>(null);
  const [resumen, setResumen] = useState<ResumenImportacion | null>(null);
  const [feed, setFeed] = useState<NonNullable<EventoProgreso['ultimo']>[]>([]);
  /** Cerrada de fábrica. Antes venía abierta y ocupaba el primer tercio de la
   *  pantalla: el contador que ya sabe usar esto —o sea, el mismo contador a
   *  partir del segundo mes— tenía que pasar por encima de tres párrafos que
   *  ya se sabía. Ahora vive en el botón flotante. */
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [beta, setBeta] = useState<EstadoBeta | null>(null);
  const [cuota, setCuota] = useState<EstadoCuota | null>(null);
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [pagando, setPagando] = useState('');
  /** Se abre solo al chocar con el límite, y se puede abrir a mano. */
  const [panelPlanes, setPanelPlanes] = useState(false);
  // `buzon`, no `correo`: en esta pantalla `correo` ya es el que se teclea
  // para pedir el enlace de acceso, y son dos cosas distintas.
  const [buzon, setBuzon] = useState<EstadoCorreo | null>(null);
  const [panelCorreo, setPanelCorreo] = useState(false);
  /** Lo que llegó por correo y aún no se ha procesado. Se lista, no sólo se
   *  cuenta: un «3 sin procesar» no dice si son los de tu cliente o el
   *  reenvío repetido de otro, y cuando algo falla no hay forma de saber qué. */
  const [bandeja, setBandeja] = useState<ArchivoBandeja[]>([]);
  const [resMes, setResMes] = useState<ResumenMesDatos | null>(null);
  // Quién ve la descarga masiva. Lo decide el servidor y llega en `beta`;
  // `ilimitado` es sólo el respaldo mientras esa consulta va y vuelve, para
  // que al propietario no le parpadee el botón al entrar.
  //
  // Va DESPUÉS del useState de `beta`, no junto a `ilimitado` arriba: leerlo
  // antes de declararlo es un error de zona muerta temporal que tumba la
  // página entera al montar, y en producción sale como «Ocurrió un
  // inconveniente» sin más pistas.
  const puedeDescargar = beta?.puedeDescargar ?? ilimitado;
  // Siempre en español. Este módulo existe sólo para Colombia y su interfaz
  // está escrita en español fijo: con un navegador en inglés, la voz explicaba
  // en inglés lo que se estaba viendo en español.
  const { speak } = useVoiceSpeak('es');
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

  /** Sección del panel. Es la navegación principal desde que esto dejó de ser
   *  una columna única: antes, para llegar al auditor había que pasar por
   *  delante de la importación, los CUFEs y la tabla entera. */
  const [seccion, setSeccion] = useState<string>('inicio');
  /** El menú arranca OCULTO y recuerda la elección.
   *
   *  El recorrido normal cabe entero en Inicio —soltar, ver el avance, mirar
   *  la tabla—, así que el menú sólo hace falta para ir a una herramienta
   *  concreta. Tenerlo siempre puesto le robaba ancho a la tabla, que es lo
   *  que el contador de verdad mira. */
  const [menuAbierto, setMenuAbierto] = useState(false);

  /**
   * Barra lateral plegada a sólo iconos.
   *
   * Se recuerda porque es una preferencia de sitio de trabajo, no una decisión
   * de esta visita: quien la pliega para ganar ancho en la tabla no quiere
   * volver a plegarla cada vez que entra. Se lee de forma perezosa —dentro del
   * `useState`— para que no haya un primer render con la barra desplegada y un
   * salto en cuanto el efecto la corrija.
   */
  const [lateralPlegada, setLateralPlegada] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_LATERAL_PLEGADA) === '1';
    } catch {
      // Safari en privado tira al leer localStorage. Que la barra salga
      // desplegada es un detalle; que la pantalla no cargue, no.
      return false;
    }
  });

  const alternarPlegado = useCallback(() => {
    setLateralPlegada((v) => {
      try { localStorage.setItem(CLAVE_LATERAL_PLEGADA, v ? '0' : '1'); } catch { /* da igual */ }
      return !v;
    });
  }, []);

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
        // Se nombra el tipo REAL. Decía «Factura» a todo, y llamarle factura a
        // una nota crédito delante de un contador es un error de bulto: son
        // documentos que se comportan al revés en su contabilidad.
        const tipo = ETIQUETA_TIPO_VOZ[String(doc.doc_type ?? '')] ?? 'Documento';
        const tipoEn = ETIQUETA_TIPO_VOZ_EN[String(doc.doc_type ?? '')] ?? 'Document';
        narrar(
          `${tipo} ${String(doc.full_number ?? '')} de ${String(doc.issuer_name ?? '')}. Está correcto: los totales cuadran con sus líneas y sus impuestos.`,
          `${tipoEn} ${String(doc.full_number ?? '')} from ${String(doc.issuer_name ?? '')}. It is correct: the totals match its lines and taxes.`,
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
      const [t, d, c, q, m, pl, rm] = await Promise.all([
        obtenerTotales(),
        listarDocumentos({
          busqueda: busqueda || undefined,
          estado: filtroEstado || undefined,
          pagina,
        }),
        estadoBeta(),
        estadoCuota(),
        estadoCorreo(),
        listarPlanes(),
        resumenMes(),
      ]);
      setTotales(t);
      setDocumentos(d.filas);
      setTotalFiltrado(d.total);
      setBeta(c);
      setCuota(q);
      setBuzon(m);
      setPlanes(pl);
      setResMes(rm);

      // La bandeja sólo se pide si hay algo y el plan lo permite: una consulta
      // más en cada refresco, para casi todo el mundo, sin nada que mostrar.
      setBandeja(m.disponible && m.pendientes > 0 ? await listarBandeja() : []);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }, [permitido, busqueda, filtroEstado, pagina, ilimitado]);

  useEffect(() => { void refrescar(); }, [refrescar]);

  /** Al cambiar el filtro hay que volver a la primera página. Quedarse en la
   *  9 después de buscar algo que sólo tiene dos páginas enseña una tabla
   *  vacía y parece que la búsqueda no encontró nada. */
  useEffect(() => { setPagina(1); }, [busqueda, filtroEstado]);

  /** Lleva al Checkout de Wompi. El importe y la firma los pone el servidor;
   *  aquí sólo viaja el código del plan. */
  const pagarPlan = async (planCode: string) => {
    setPagando(planCode);
    try {
      const url = await iniciarPagoPlan(planCode);
      // Misma pestaña: Wompi devuelve aquí al terminar, y con una pestaña
      // nueva el contador se queda mirando la vieja sin enterarse de que ya
      // pagó.
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setPagando('');
    }
  };
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
    // El guion dice lo que la herramienta hace HOY, y en el orden en que el
    // contador lo va a necesitar. Decía «puedes trabajar de dos formas» y
    // describía dos, cuando ya son cuatro maneras de meter documentos más el
    // Excel, el auditor y la plantilla contable: quien se guiara por la voz
    // nunca se enteraba de que existían.
    //
    // Aun así no se enumeran las nueve cosas. Esto se ESCUCHA, y una lista
    // larga no se retiene: se dice qué hace, cómo empezar ahora mismo, qué se
    // lleva al final, y que hay atajos. Lo demás se descubre al usarlo, que
    // para eso cada sección tiene su propia voz.
    speak(GUION_SECCION.inicio);
  }, [permitido, speak]);

  /**
   * Cada sección se presenta sola al entrar.
   *
   * Antes sólo hablaban la bienvenida y la bandeja de revisión: quien se
   * guiaba por la voz entraba a «Por correo» o a «Verificar CUFEs» y se
   * encontraba con silencio, justo en las dos pantallas donde hay algo que
   * explicar antes de tocar nada.
   *
   * No hace falta callar a la anterior a mano: `speak()` cancela lo que esté
   * sonando antes de empezar la frase nueva (ver `voice-assistant-service`),
   * así que cambiar de sección a media explicación corta la vieja y arranca
   * la que toca, en vez de encolarse detrás.
   *
   * `inicio` se salta en el primer render porque la bienvenida ya lo cubre;
   * volver a Inicio desde otra sección sí lo repite, que es cuando el
   * contador necesita que le recuerden dónde está.
   */
  const seccionPrevia = useRef<string | null>(null);
  useEffect(() => {
    if (!permitido) return;
    if (seccionPrevia.current === null) { seccionPrevia.current = seccion; return; }
    if (seccionPrevia.current === seccion) return;
    seccionPrevia.current = seccion;

    const guion = GUION_SECCION[seccion];
    if (guion) speak(guion);
  }, [seccion, permitido, speak]);

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
      if (e instanceof LimiteDelPlanError) {
        toast.error(e.message, { duration: 14000 });
        // Y se le pone delante lo que puede hacer. Explicar el tope sin
        // enseñar la salida deja a la persona igual de atascada, sólo que
        // mejor informada.
        setPanelPlanes(true);
        speak({
          es: e.message,
          en: `You reached your ${e.cuota.planNombre} plan limit for this month.`,
        });
      } else if (e instanceof BetaCerradaError) {
        toast.error(e.message, { duration: 9000 });
      } else {
        toast.error((e as Error).message);
      }
    } finally {
      setCargando(false);
      setProgreso(null);
    }
  };

  /** Procesa lo que llegó por correo. Comparte con `procesar` el estado de
   *  progreso y el resumen: para el contador es la misma operación, sólo que
   *  no tuvo que ir a buscar los archivos. */
  const procesarCorreo = async () => {
    setCargando(true);
    setResumen(null);
    setFeed([]);
    try {
      const r = await importarBandeja((e) => {
        setProgreso(e);
        if (e.ultimo) setFeed((prev) => [e.ultimo!, ...prev].slice(0, 8));
      });
      setResumen(r);
      setAyudaAbierta(false);
      toast.success(`${r.procesados} documento(s) procesados desde tu correo`);
      speak({
        es: `Listo. Bajé ${r.desdeCorreo} documentos de tu correo y procesé ${r.procesados}.`
          + (r.duplicados > 0 ? ` ${r.duplicados} ya los tenías.` : ''),
        en: `Done. I pulled ${r.desdeCorreo} documents from your email and processed ${r.procesados}.`
          + (r.duplicados > 0 ? ` ${r.duplicados} were already here.` : ''),
      });
      await refrescar();
      setBuzon(await estadoCorreo());
    } catch (e) {
      if (e instanceof BetaCerradaError) toast.error(e.message, { duration: 9000 });
      else toast.error((e as Error).message);
    } finally {
      setCargando(false);
      setProgreso(null);
    }
  };

  const activarBuzon = async () => {
    try {
      const dir = await activarCorreo();
      setBuzon((c) => (c ? { ...c, direccion: dir, activo: true } : c));
      toast.success('Tu dirección quedó lista');
      narrar(
        'Ya tienes tu dirección. Copia esa dirección y crea una regla en tu correo que reenvíe ahí las facturas de tus proveedores. Desde ese momento los documentos entran solos.',
        'Your address is ready. Copy it and create a rule in your email that forwards your suppliers invoices there. From then on the documents come in on their own.',
      );
    } catch (e) { toast.error((e as Error).message); }
  };

  /**
   * El menú lateral.
   *
   * El orden no es decorativo: sigue el recorrido real del contador. Primero
   * meter documentos, luego mirarlos, luego lo que no cuadra, y al final
   * llevárselos a su programa. «Planes» va abajo con lo administrativo
   * porque cobrar no es la tarea que vino a hacer.
   */
  const menuLateral: GrupoLateral[] = useMemo(() => {
    const grupos: GrupoLateral[] = [
      {
        items: [
          { id: 'inicio', etiqueta: 'Inicio', icono: LayoutDashboard },
          { id: 'documentos', etiqueta: 'Documentos', icono: Table2 },
          {
            id: 'revision', etiqueta: 'Requieren revisión', icono: AlertTriangle,
            pendientes: totales?.revision ?? 0,
          },
        ],
      },
      {
        titulo: 'Traer documentos',
        items: [
          {
            id: 'correo', etiqueta: 'Por correo', icono: Mail,
            pendientes: buzon?.disponible ? buzon.pendientes : 0,
            marca: buzon && !buzon.disponible ? 'Plan' : undefined,
            bloqueado: buzon ? !buzon.disponible : false,
          },
          { id: 'cufes', etiqueta: 'Verificar CUFEs', icono: ListChecks },
          ...(puedeDescargar
            ? [{ id: 'descargar', etiqueta: 'Descargar de la DIAN', icono: CloudDownload }]
            : []),
        ],
      },
      {
        titulo: 'Llevarme los datos',
        items: [
          { id: 'reportes', etiqueta: 'Excel y plantillas', icono: FileSpreadsheet },
          { id: 'auditor', etiqueta: 'Cruzar contabilidad', icono: Scale },
        ],
      },
      {
        titulo: 'Cuenta',
        items: [{ id: 'planes', etiqueta: 'Planes y consumo', icono: CreditCard }],
      },
    ];

    // Sólo el dueño. El componente ni se monta para nadie más, pero eso es
    // cortesía: cada función de esa vista comprueba is_admin_user() en la
    // base. Esconder una opción del menú no protege ningún dato.
    if (ilimitado) {
      grupos.push({
        titulo: 'Sólo tú',
        // Una sola entrada. «Ajustes de la prueba» era otra opción aparte y
        // obligaba a saltar de pestaña para mirar el consumo y luego subir el
        // tope, que es lo mismo que uno quiere hacer seguido.
        items: [
          { id: 'analitica', etiqueta: 'Analítica', icono: BarChart3 },
        ],
      });
    }
    return grupos;
  }, [totales?.revision, buzon, puedeDescargar, ilimitado]);

  /**
   * Primer nombre para el saludo.
   *
   * Primero el nombre real de la cuenta, que es lo que hace el dashboard
   * principal. Esto faltaba y se notaba: con un correo sin separadores como
   * «douglastabordasanchez@», el dashboard decía «Buenas tardes, Douglas» y
   * esta pantalla, un clic después, decía «Buenas tardes» a secas — como si
   * no supiera quién había entrado.
   *
   * Sólo si no hay nombre se recurre al correo: lo de antes de la arroba,
   * cortado en el primer punto o guion («douglas.taborda» → Douglas). Y si
   * de ahí no sale nada legible se saluda sin nombre, que es mejor que
   * soltarle un identificador.
   */
  const nombreCorto = useMemo(() => {
    const deCuenta = (user?.name ?? '').trim().split(/\s+/)[0] ?? '';
    if (deCuenta.length >= 2) {
      return deCuenta.charAt(0).toUpperCase() + deCuenta.slice(1);
    }

    const local = (user?.email ?? '').split('@')[0] ?? '';
    const trozo = local.split(/[._-]/)[0] ?? '';
    // Se descarta lo que no parece un nombre: muy corto, con dígitos, o
    // demasiado largo. «Douglastabordasanchez» es peor que no saludar.
    if (trozo.length < 2 || trozo.length > 12 || /\d/.test(trozo)) return undefined;
    return trozo.charAt(0).toUpperCase() + trozo.slice(1).toLowerCase();
  }, [user?.name, user?.email]);

  /**
   * Las cuatro acciones de la fila principal.
   *
   * El orden es el del recorrido real —traer, bajar, cruzar, entregar—, no el
   * de importancia: un contador que abre esto por primera vez lee la fila de
   * izquierda a derecha y entiende el flujo entero.
   *
   * «Descargar de la DIAN» sólo aparece a quien la tiene abierta. Un botón
   * deshabilitado con un candado invita a pulsarlo y a preguntar por qué no
   * funciona; uno que no está no genera esa pregunta.
   */
  const accionesRapidas: Accion[] = useMemo(() => [
    {
      id: 'subir',
      etiqueta: 'Subir mis XML',
      icono: FileUp,
      variante: 'principal',
      onClick: () => { setSeccion('inicio'); inputRef.current?.click(); },
    },
    ...(puedeDescargar
      ? [{
          id: 'descargar',
          etiqueta: 'Descargar de la DIAN',
          icono: CloudDownload,
          variante: 'descarga' as const,
          onClick: () => setPanelDescarga(true),
        }]
      : []),
    {
      id: 'auditor',
      etiqueta: 'Cruzar contabilidad',
      icono: Scale,
      variante: 'auditor',
      onClick: () => setPanelAuditor(true),
    },
    {
      id: 'reportes',
      etiqueta: 'Excel y plantillas',
      icono: FileSpreadsheet,
      variante: 'excel',
      onClick: () => setSeccion('reportes'),
    },
  ], [puedeDescargar]);

  const totalPaginas = Math.max(1, Math.ceil(totalFiltrado / DOCS_POR_PAGINA));

  /**
   * Los números que se dibujan en el paginador.
   *
   * Con 1.250 documentos hay 25 páginas y con 12.000 hay 240: pintarlas todas
   * llenaría el pie de la tabla de números diminutos. Se enseña la primera, la
   * última, la actual y una vecina a cada lado; los saltos van como `null` y
   * se dibujan como puntos suspensivos.
   */
  const paginasVisibles = useMemo<(number | null)[]>(() => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    }
    const cerca = new Set([1, totalPaginas, pagina, pagina - 1, pagina + 1]);
    const salida: (number | null)[] = [];
    let hueco = false;
    for (let p = 1; p <= totalPaginas; p++) {
      if (cerca.has(p)) {
        salida.push(p);
        hueco = false;
      } else if (!hueco) {
        salida.push(null);
        hueco = true;
      }
    }
    return salida;
  }, [pagina, totalPaginas]);

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
      // Se avisa de las notas crédito ANTES de que abra el archivo. En la hoja
      // de resumen restan, como debe ser; en las de detalle salen en positivo,
      // tal como las emitió el proveedor. Quien no lo sepa suma la columna a
      // mano, le da distinto, y desconfía del Excel entero — cuando el Excel
      // es el que está bien.
      const creditos = docs.filter((d) => d.doc_type === 'nota_credito').length;
      narrar(
        `Tu Excel se está descargando con ${docs.length} documentos. Trae cuatro hojas: un resumen con los totales del periodo, el detalle línea por línea de cada producto, una hoja con un renglón por documento, y las retenciones aparte.`
          + (creditos > 0
              ? ` Ojo con una cosa: en el resumen ${creditos === 1 ? 'la nota crédito resta' : `las ${creditos} notas crédito restan`}, porque así es como afectan tu base y tu IVA descontable. En las hojas de detalle ${creditos === 1 ? 'aparece' : 'aparecen'} en positivo, tal como ${creditos === 1 ? 'la emitió el proveedor' : 'las emitió el proveedor'}.`
              : '')
          + ' Ábrelo con Excel y ya lo puedes trabajar.',
        `Your Excel is downloading with ${docs.length} documents. It has four sheets: a summary with the period totals, the line by line detail of each product, one row per document, and withholdings separately.`
          + (creditos > 0
              ? ` One thing to watch: in the summary ${creditos === 1 ? 'the credit note subtracts' : `the ${creditos} credit notes subtract`}, because that is how they affect your base and your deductible VAT. In the detail sheets they appear as positive, exactly as the supplier issued them.`
              : '')
          + ' Open it in Excel and it is ready to work with.',
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
    /* El fondo y los dos resplandores son los de `DesktopAppShell`: un
       lavanda muy suave con luz en las dos esquinas de arriba. Es lo que hace
       que las tarjetas blancas se lean como piezas apoyadas y no como recortes
       sobre papel, y es lo que el contador ya vio en el dashboard un segundo
       antes de entrar aquí. */
    <div className="relative min-h-screen" style={{ background: FONDO_APP }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: RESPLANDOR_DERECHA }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: RESPLANDOR_IZQUIERDA }} />

      {/* ── Barra lateral ─────────────────────────────────────────────
          Todo a un clic desde cualquier punto, y —más importante— el
          contador VE de un vistazo todo lo que la herramienta sabe hacer.
          Media docena de funciones enterradas bajo un scroll no existen
          para quien no baja. */}
      <PanelLateral
        grupos={menuLateral}
        activo={seccion}
        onSeleccionar={(id) => {
          // Dos entradas del menú no son destinos sino herramientas: abren su
          // cajón encima de donde estés, sin moverte de sitio. Antes cada una
          // llevaba a una pantalla intermedia cuyo único contenido era un
          // botón para abrir ese mismo cajón — un clic para llegar a un clic.
          if (id === 'descargar') { setPanelDescarga(true); return; }
          if (id === 'auditor') { setPanelAuditor(true); return; }

          setSeccion(id);
          if (id === 'revision') setVista('revision');
          if (id === 'documentos') setVista('documentos');
        }}
        nombre={nombreCorto}
        correo={user?.email ?? undefined}
        foto={user?.picture ?? undefined}
        plan={cuota ? { nombre: cuota.planNombre, limite: cuota.limite, usados: cuota.usados } : undefined}
        onVerPlan={() => setSeccion('planes')}
        onAyuda={() => { setSeccion('inicio'); setAyudaAbierta(true); }}
        onSalir={() => { void logout().then(() => navegar('/', { replace: true })); }}
        abierta={menuAbierto}
        onCerrar={() => setMenuAbierto(false)}
        plegada={lateralPlegada}
        onAlternarPlegado={alternarPlegado}
      />

      {/* Sin z-index aquí a propósito: emparejar `relative` con un z-index
          explícito crea un contexto de apilamiento que limita a TODOS los
          descendientes, incluidos los modales a pantalla completa, y los
          dejaría por debajo de la barra lateral aunque su z-index sea mayor.
          Es el mismo motivo documentado en `DesktopAppShell`. */}
      {/* El desplazamiento sigue al ancho real de la barra, plegada o no.
          `transition-[padding]` con la misma curva que la barra: si el
          contenido saltara de golpe mientras la barra se desliza, el plegado
          se vería como un fallo en vez de como un movimiento. */}
      <div
        className="relative transition-[padding] duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-[var(--lateral)]"
        style={{
          '--lateral': `${lateralPlegada ? ANCHO_LATERAL_PLEGADA : ANCHO_LATERAL}px`,
        } as CSSProperties}
      >
        <Bienvenida
          nombre={nombreCorto}
          foto={user?.picture ?? undefined}
          onAbrirMenu={() => setMenuAbierto(true)}
          onAyuda={() => { setSeccion('inicio'); setAyudaAbierta(true); }}
          onPerfil={() => setSeccion('planes')}
        />

        <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 sm:px-8">

        {/* ── Acciones rápidas ─────────────────────────────────────────
            Encabezan la pantalla. Es lo primero que se ve al entrar y contesta
            la única pregunta que el contador trae —«¿qué hago ahora?»— antes
            de que tenga que leer nada.

            Aquí estuvieron las cuatro cifras del mes y estaban de más: mirar
            cuánto se procesó es algo que se hace DESPUÉS de procesar, no al
            abrir. Se fueron a la pestaña Documentos, que es donde el contador
            va cuando quiere revisar. El banner del conector de correo también
            salió: está en el menú de la izquierda, que es donde vive. */}
        {seccion === 'inicio' && (
          <div className="mb-5">
            <AccionesRapidas acciones={accionesRapidas} />
          </div>
        )}

        {/* ── Analítica (sólo el dueño) ─────────────────────────────────
            El componente ni se monta para nadie más, pero eso es cortesía:
            cada función que consulta comprueba is_admin_user() en la base.
            Esconder un componente no protege datos. */}
        {seccion === 'analitica' && ilimitado && <VistaAnalitica />}

        {/* ── Llevarme los datos ────────────────────────────────────────
            Las dos salidas del recorrido en un sitio: el Excel de cuatro
            hojas y la plantilla del propio programa contable. */}
        {seccion === 'reportes' && (
          <div>
            <Cabecera
              titulo="Llevarme los datos"
              descripcion="El Excel de cuatro hojas, o directamente la plantilla de tu programa contable."
              icono={FileSpreadsheet}
              color="#7C3AED"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Tarjeta className="p-5" indice={0}>
                <FileSpreadsheet className="mb-3 size-6 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Excel de cuatro hojas</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                  Resumen del periodo, detalle línea por línea, un renglón por documento y las
                  retenciones aparte. En el resumen las notas crédito ya van restadas.
                </p>
                <Boton
                  estilo={BOTON_EXITO}
                  icono={Download}
                  className="mt-4"
                  disabled={exportando || (totales?.documentos ?? 0) === 0}
                  onClick={() => void descargarExcel()}
                >
                  {exportando ? 'Armando el Excel…' : 'Descargar Excel'}
                </Boton>
                {(totales?.documentos ?? 0) === 0 && (
                  <p className="mt-2 text-[11px] text-slate-400">
                    Todavía no hay documentos que exportar.
                  </p>
                )}
              </Tarjeta>

              <Tarjeta className="p-5" indice={1}>
                <Sparkles className="mb-3 size-6 text-violet-600" />
                <h3 className="text-sm font-bold text-slate-900">Tu propia plantilla</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">
                  Sube la plantilla vacía de tu programa —Siigo, Alegra, World Office, la que
                  sea— y te la devuelvo llena. El mapeo queda guardado para el mes siguiente.
                </p>
                <Boton estilo={BOTON_PLANTILLA} icono={FileSpreadsheet} className="mt-4"
                       onClick={() => setPanelPlantilla(true)}>
                  Abrir plantillas
                </Boton>
              </Tarjeta>
            </div>
          </div>
        )}

        {/* «Cruzar contabilidad» y «Descargar de la DIAN» tenían aquí una
            pantalla propia cuyo único contenido era un párrafo y un botón para
            abrir el cajón de la derecha. Un clic para llegar a un clic.

            Ya no existen: ahora son HERRAMIENTAS, no destinos. Pulsarlas en el
            menú abre el cajón directamente encima de donde estés, y al cerrarlo
            sigues donde estabas. El párrafo que explicaba cada una vive dentro
            del propio cajón, que es donde hace falta leerlo. */}

        {/* ── Control de la prueba, dentro de Analítica ──────────────────
            Era su propia sección, «Ajustes de la prueba», y encima en oscuro:
            el único bloque negro de toda la herramienta, en una aplicación
            que es blanca y azul de principio a fin. Se leía como una consola
            de otra cosa pegada dentro.

            Ahora va debajo de la analítica, que es su sitio natural: las dos
            responden la misma pregunta del dueño —cómo va la prueba— y tenerlas
            separadas obligaba a saltar de pestaña para mirar el consumo y
            luego subir el tope. */}
      {beta?.ilimitado && seccion === 'analitica' && (
        <section className="mb-6 mt-6 p-6" style={CARD}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black text-slate-900">Control de la prueba</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
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
              <div key={x.l} className="rounded-xl bg-slate-50 px-3 py-3">
                <div className="truncate text-base font-bold tabular-nums">{x.v}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-slate-400">{x.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                beta.usadosGlobal / beta.limiteGlobal > 0.85 ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (beta.usadosGlobal / Math.max(1, beta.limiteGlobal)) * 100)}%` }}
            />
          </div>
          {beta.llena && (
            <p className="mt-2 text-xs font-semibold text-rose-600">
              Tope alcanzado. La herramienta está bloqueada para todos hasta que lo subas.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="text-xs text-slate-500">
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
                className="mt-1 block w-28 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:bg-slate-200"
              />
            </label>
            <label className="text-xs text-slate-500">
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
                className="mt-1 block w-28 rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:bg-slate-200"
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
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold transition hover:bg-slate-200"
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
              className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
            >
              Cerrar ahora
            </button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
            Los cambios aplican de inmediato para todos, sin desplegar nada.
          </p>

          {/* ── Quién puede probar la descarga masiva ─────────────────────
              La descarga sale por las IPs de Supabase, compartidas con el
              resto de la plataforma: si la DIAN bloquea esa IP por abuso, la
              bloquea para todos. Por eso se abre persona por persona y no
              con un interruptor de «todos». */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-700">Acceso a «Descargar XML de la DIAN»</h3>

            {/* Abrir y cerrar en un clic, sin desplegar. Todo el tráfico sale
                por las IPs de Supabase, compartidas con el resto de la
                plataforma: si la DIAN bloquea esa IP por abuso, la bloquea
                para todos los clientes a la vez. */}
            <label className="mt-2 flex cursor-pointer items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
              <input
                type="checkbox"
                checked={Boolean(beta.descargaAbierta)}
                onChange={(e) => {
                  const abrir = e.target.checked;
                  void configurarBeta('dian_descarga_abierta', abrir ? 'true' : 'false')
                    .then(() => { toast.success(abrir ? 'Abierta para todos' : 'Cerrada: sólo tú y los autorizados'); void refrescar(); })
                    .catch((err) => toast.error(err.message));
                }}
                className="size-4 accent-emerald-600"
              />
              <span className="text-xs">
                <span className="block font-bold">Abierta para todos</span>
                <span className="block text-slate-400">
                  {beta.descargaAbierta
                    ? 'Cualquier usuario con sesión puede descargar. Siguen vigentes el cierre por fecha, el tope global y el ritmo de 2 peticiones por segundo.'
                    : 'Sólo tú y los correos de abajo.'}
                </span>
              </span>
            </label>

            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
              Escribe el correo con el que la persona entra a Codec. Tendrá acceso
              en cuanto recargue; tú siempre lo tienes.
            </p>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <input
                value={nuevoTester}
                onChange={(e) => setNuevoTester(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void agregarTester(); } }}
                placeholder="contador@correo.com"
                className="min-w-0 flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:bg-slate-200"
              />
              <button
                type="button"
                onClick={() => void agregarTester()}
                disabled={guardandoTesters}
                className="rounded-lg bg-slate-200 px-3.5 py-2 text-xs font-bold transition hover:bg-slate-300 disabled:opacity-50"
              >
                {guardandoTesters ? <Loader2 className="size-3.5 animate-spin" /> : 'Dar acceso'}
              </button>
            </div>

            {beta.descargaPermitidos && beta.descargaPermitidos.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {beta.descargaPermitidos.map((correo) => (
                  <li key={correo} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs">
                    <span className="max-w-[220px] truncate">{correo}</span>
                    <button
                      type="button"
                      onClick={() => void quitarTester(correo)}
                      disabled={guardandoTesters}
                      title={`Quitar acceso a ${correo}`}
                      className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[11px] text-slate-300">
                Nadie más tiene acceso todavía.
              </p>
            )}
          </div>

          {/* ── Respuestas de la encuesta ─────────────────────────────────
              Se guardaban desde el primer día pero no había dónde leerlas,
              que es como no haberlas pedido. */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-slate-700">Respuestas de la encuesta</h3>
              <button
                type="button"
                onClick={() => void cargarRespuestas()}
                disabled={cargandoRespuestas}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold transition hover:bg-slate-200 disabled:opacity-50"
              >
                {cargandoRespuestas
                  ? <Loader2 className="size-3.5 animate-spin" />
                  : respuestas === null ? 'Ver respuestas' : 'Actualizar'}
              </button>
              {respuestas !== null && respuestas.length > 0 && (
                <button
                  type="button"
                  onClick={descargarRespuestas}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-bold transition hover:bg-slate-200"
                >
                  Descargar CSV
                </button>
              )}
            </div>

            {respuestas !== null && (
              respuestas.length === 0 ? (
                <p className="mt-2 text-[11px] text-slate-300">
                  Todavía nadie ha respondido. La encuesta aparece cuando alguien
                  termina su primera importación.
                </p>
              ) : (
                <div className="mt-2.5 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {respuestas.map((r) => (
                    <div key={String(r.id)} className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-slate-400">
                        <span className="font-semibold text-slate-700">{String(r.email ?? 'sin correo')}</span>
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
                              <span className="text-slate-400">{etiqueta}: </span>
                              <span className="text-slate-800">{String(valor)}</span>
                            </div>
                          ) : null
                        ))}
                      </div>
                      {r.falta ? (
                        <p className="mt-1.5 border-l-2 border-slate-200 pl-2 text-slate-600">
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
        {/* Se acabó el cupo → aquí está la salida.
            Antes esta pantalla decía «se acabó» y «escríbenos», sin nada que
            pulsar. Dejar a alguien pidiéndole algo que no puede hacer desde
            donde está ya costó un ciclo en el login de esta misma herramienta;
            no se repite. Ahora el bloqueo y su solución están en el mismo
            sitio. */}
        {/* Los topes de CAPACIDAD de la plataforma. No se resuelven pagando,
            así que aquí no se ofrece ningún plan: hacerlo sería cobrar por
            algo que no se puede entregar todavía. */}
        {seccion === 'inicio' && beta && !beta.exentoGlobal && (beta.cerrada || beta.llena) && (
          <section
            className="mb-6 overflow-hidden bg-white p-6 text-center ring-1 ring-slate-100"
            style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
          >
            <Lock className="mx-auto mb-3 size-7 text-slate-300" />
            <p className="text-sm font-semibold text-slate-800">
              {beta.cerrada ? 'El periodo de prueba terminó' : 'La plataforma llegó a su capacidad'}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Tus documentos siguen aquí: puedes consultarlos y exportarlos. Lo único
              que se detuvo es procesar nuevos. Escríbenos y te damos acceso ampliado.
            </p>
          </section>
        )}

        {/* ── Tu cupo del mes, y los planes ──────────────────────────────
            El contador tiene que ver su límite ANTES de chocar con él, no
            enterarse por un mensaje rojo a mitad de una importación de mil
            documentos.

            Los planes YA NO van detrás de un «Ver planes y precios» cerrado de
            fábrica. Entrar a una pantalla que se llama «Planes y consumo» y no
            ver ningún plan es exactamente lo contrario de lo que uno espera, y
            un botón menos entre el contador y la decisión de pagar no le hace
            daño a nadie. */}
        {seccion === 'planes' && cuota && (
        <div>
          <Cabecera
            titulo="Planes y consumo"
            descripcion="Sólo cuentan los documentos que se procesan bien. Los duplicados y los que fallan no gastan cupo."
            icono={CreditCard}
            color="#7C3AED"
          />

          {/* Tu consumo, en grande. Es lo primero que se mira al entrar. */}
          {!cuota.ilimitado && (
            <Tarjeta className="mb-4 p-6" indice={0}>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Tu plan actual
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {cuota.planNombre}
                    {cuota.planPrecio ? (
                      <span className="ml-2 text-sm font-bold text-slate-400">
                        {pesos(cuota.planPrecio)}/mes
                      </span>
                    ) : null}
                  </p>
                </div>
                <p className="text-sm font-bold tabular-nums text-slate-500">
                  {cuota.usados.toLocaleString('es-CO')} de {(cuota.limite ?? 0).toLocaleString('es-CO')} documentos este mes
                </p>
              </div>

              {/* La barra dice de un vistazo lo que la cifra dice exacto. */}
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(100, Math.round((cuota.usados / Math.max(1, cuota.limite ?? 1)) * 100))}%`,
                  }}
                  transition={MOV.lenta}
                  style={{
                    background: (cuota.restantes ?? 0) === 0
                      ? '#F43F5E'
                      : (cuota.restantes ?? 0) <= (cuota.limite ?? 1) * 0.15
                        ? '#F59E0B'
                        : 'linear-gradient(90deg,#10B981,#059669)',
                  }}
                />
              </div>

              <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-500">
                {(cuota.restantes ?? 0) === 0
                  ? 'Llegaste al límite de tu plan.'
                  : `Te quedan ${(cuota.restantes ?? 0).toLocaleString('es-CO')} documentos.`}
                {cuota.renuevaEl && (
                  <> Tu cupo se repone el{' '}
                    {new Date(cuota.renuevaEl).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}.
                  </>
                )}
              </p>
            </Tarjeta>
          )}

          {/* El catálogo, siempre a la vista. */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {planes.map((p, i) => {
              const actual = p.code === cuota.planCode;
              const esDePago = p.precio !== null && p.precio > 0;
              // El plan que se quiere vender es el más barato de los que sí
              // están a la venta y superan al actual. Marcarlos todos como
              // «recomendado» es no recomendar ninguno.
              const recomendado = !actual
                && p.aLaVenta
                && p.precio !== null && p.precio > 0
                && planes.filter((o) => o.aLaVenta && (o.precio ?? 0) > 0)
                  .sort((a, b) => (a.precio ?? 0) - (b.precio ?? 0))[0]?.code === p.code;

              return (
                <motion.div
                  key={p.code}
                  {...aparecer(i)}
                  whileHover={{ y: -3 }}
                  className="relative flex flex-col overflow-hidden bg-white p-6"
                  style={{
                    borderRadius: CARD_RADIUS,
                    boxShadow: actual
                      ? '0 2px 4px rgba(16,185,129,0.10), 0 20px 44px rgba(16,185,129,0.22)'
                      : recomendado
                        ? '0 2px 4px rgba(37,99,235,0.10), 0 20px 44px rgba(37,99,235,0.20)'
                        : CARD_SHADOW,
                    outline: actual
                      ? '2px solid #10B981'
                      : recomendado ? '2px solid #2563EB' : 'none',
                    outlineOffset: -2,
                  }}
                >
                  {/* Resplandor de esquina: da profundidad sin meter un borde
                      de color que compita con el precio. */}
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${
                        actual ? 'rgba(16,185,129,0.16)' : recomendado ? 'rgba(37,99,235,0.16)' : 'rgba(148,163,184,0.10)'
                      }, transparent 70%)`,
                    }}
                  />

                  <div className="relative flex items-center justify-between gap-2">
                    <p className="text-base font-black text-slate-900">{p.nombre}</p>
                    {actual ? (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                        Tu plan
                      </span>
                    ) : recomendado ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-blue-700">
                        <Sparkles className="size-2.5" /> Recomendado
                      </span>
                    ) : null}
                  </div>

                  <p className="relative mt-3 text-3xl font-black tabular-nums text-slate-900">
                    {p.precio === null
                      ? <span className="text-base font-bold text-slate-400">Precio por definir</span>
                      : p.precio === 0
                        ? 'Gratis'
                        : <>{pesos(p.precio)}<span className="text-sm font-bold text-slate-400">/mes</span></>}
                  </p>

                  {/* El límite se dice SIEMPRE y con el número. Es la cifra
                      por la que se está pagando. */}
                  {/* Todo lo que incluye, plan por plan.
                      Antes sólo se decía el tope, y con eso un contador no
                      puede comparar nada: no sabía si el Gratis traía el
                      auditor, si el Excel era de pago, ni qué gana de verdad
                      al subir. La lista es la MISMA para todos salvo el
                      correo, y eso es exactamente lo que hay que dejar claro
                      — lo que se compra es cupo, no funciones a medias. */}
                  <ul className="relative mt-4 space-y-2">
                    <li className="flex items-start gap-2 text-[13px] font-bold text-slate-800">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      {p.limite === null
                        ? 'Documentos sin límite'
                        : `${p.limite.toLocaleString('es-CO')} documentos al mes`}
                    </li>

                    {[
                      'Subir ZIP o XML sueltos, sin descomprimir',
                      'Descargar de la DIAN con tu token',
                      'Verificar por lista de CUFEs',
                      'Excel de cuatro hojas listo para declarar',
                      'Plantillas de tu programa contable',
                      'Cruzar con tu contabilidad',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-500">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}

                    {/* La única diferencia real entre gratis y de pago. Se
                        dibuja en las dos, tachada donde no la hay: un contador
                        que sólo ve la lista del plan gratis no puede saber qué
                        le falta. */}
                    <li className={`flex items-start gap-2 text-[12.5px] ${
                      esDePago ? 'font-bold text-slate-800' : 'text-slate-300'
                    }`}>
                      {esDePago
                        ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        : <Lock className="mt-0.5 size-4 shrink-0 text-slate-300" />}
                      Facturas por correo, sin ir a buscarlas
                    </li>
                  </ul>

                  {p.usoJusto && (
                    <p className="relative mt-3 text-[11.5px] leading-relaxed text-slate-400">{p.usoJusto}</p>
                  )}

                  <div className="relative mt-auto pt-5">
                    {actual ? (
                      <p className="rounded-2xl bg-emerald-50 px-4 py-2.5 text-center text-[12px] font-bold text-emerald-700">
                        Es el que tienes activo
                      </p>
                    ) : p.aLaVenta ? (
                      <Boton
                        estilo={recomendado ? BOTON_PRIMARIO : BOTON_EXITO}
                        className="w-full"
                        disabled={pagando !== ''}
                        onClick={() => void pagarPlan(p.code)}
                      >
                        {pagando === p.code ? 'Abriendo el pago…' : `Pasar a ${p.nombre}`}
                      </Boton>
                    ) : p.precio === null ? (
                      <p className="rounded-2xl bg-slate-50 px-4 py-2.5 text-center text-[11.5px] text-slate-500">
                        Todavía no está a la venta. Escríbenos si lo necesitas.
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Se nombra el medio de pago antes de salir de la app. Llegar a una
              pasarela sin saber si acepta lo que uno usa es la forma más tonta
              de perder un pago. */}
          <p className="mt-5 flex items-center justify-center gap-2 text-[12px] leading-relaxed text-slate-400">
            <Lock className="size-3.5 shrink-0" />
            Pago seguro con Wompi: Nequi, PSE, tarjeta o corresponsal. Se cancela cuando quieras.
          </p>
        </div>
        )}

        {/* ── Recibir por correo ────────────────────────────────────────
            El token de la DIAN dura 60 minutos y hay que pedirlo a mano, así
            que no existe forma de sincronizar de noche por ahí. El correo sí:
            la ley obliga al emisor a mandar el XML por email, o sea que los
            documentos YA están llegando a un buzón todos los días.

            Ya no es un desplegable suelto en medio de una pantalla vacía.
            Ahora es una sección de verdad: cabecera propia, la acción a la
            izquierda y a la derecha el porqué. Antes esta pantalla eran dos
            frases y un botón flotando sobre un metro de blanco, y el contador
            no tenía forma de entender que ésta es la función que le quita el
            trabajo repetitivo del mes. */}
        {seccion === 'correo' && buzon && (
        <div>
          <Cabecera
            titulo="Que las facturas lleguen solas"
            descripcion="Tus proveedores ya te mandan el XML por correo: la ley los obliga. Esto convierte esos correos en documentos procesados, sin que descargues ni arrastres nada."
            icono={Mail}
            color="#0284C7"
            acciones={
              buzon.disponible ? (
                buzon.pendientes > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    {buzon.pendientes} sin procesar
                  </span>
                ) : undefined
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                  <Lock className="size-3" />
                  Plan {buzon.planMinimo?.nombre ?? 'de pago'}
                </span>
              )
            }
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            {/* Columna de la acción */}
            <Tarjeta className="p-6" indice={0}>
              {/* Sin plan: se muestra bloqueado, NO se esconde. Una función
                  invisible no se descubre nunca, y quien no sabe que existe
                  tampoco la echa de menos ni paga por ella. */}
              {!buzon.disponible ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
                      <Lock className="size-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900">
                        Se abre con el plan {buzon.planMinimo?.nombre ?? 'Básico'}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                        Estás en el plan <strong className="text-slate-700">{buzon.planActual}</strong>.
                        Recibir por correo es lo único que necesita un plan de pago, porque cada
                        cuenta lleva su propio buzón y su almacenamiento.
                      </p>
                    </div>
                  </div>

                  {buzon.planMinimo && (
                    <Boton
                      estilo={BOTON_CORREO}
                      icono={Mail}
                      className="mt-5"
                      disabled={pagando !== ''}
                      onClick={() => void pagarPlan(buzon.planMinimo!.code)}
                    >
                      {pagando === buzon.planMinimo.code
                        ? 'Abriendo el pago…'
                        : `Pasar a ${buzon.planMinimo.nombre} · ${pesos(buzon.planMinimo.precio)}/mes`}
                    </Boton>
                  )}

                  {/* Que no se quede pensando que sin pagar no puede hacer
                      nada: los otros tres caminos siguen abiertos. */}
                  <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-[12px] leading-relaxed text-slate-500">
                    Mientras tanto puedes seguir subiendo el ZIP, descargando desde la DIAN y
                    verificando por CUFEs. Nada de eso tiene restricción.
                  </p>
                </>
              ) : !buzon.direccion ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50">
                      <Mail className="size-5 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900">Crea tu dirección</h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
                        Te damos una dirección sólo tuya. <strong className="text-slate-700">No
                        pedimos la contraseña de tu correo</strong>: tú creas una regla de
                        reenvío, o le pasas la dirección a tus proveedores.
                      </p>
                    </div>
                  </div>
                  <Boton estilo={BOTON_CORREO} icono={Mail} className="mt-5"
                         onClick={() => void activarBuzon()}>
                    Crear mi dirección
                  </Boton>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Tu dirección
                  </p>
                  {/* Copiable de un toque: esta dirección se va a pegar en la
                      configuración de otro programa, y teclear veinte
                      caracteres aleatorios a mano se equivoca siempre. */}
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(buzon.direccion!);
                      toast.success('Dirección copiada');
                    }}
                    className="mt-1.5 flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-left font-mono text-[12.5px] text-slate-800 transition hover:border-sky-300 hover:bg-white"
                  >
                    <span className="min-w-0 flex-1 truncate">{buzon.direccion}</span>
                    <Copy className="size-4 shrink-0 text-slate-400" />
                  </button>

                  <p className="mt-3 text-[12.5px] leading-relaxed text-slate-500">
                    Crea en tu correo una regla que reenvíe ahí los mensajes con facturas.
                    Guardamos el XML, que es el documento con validez legal; el PDF no hace falta.
                  </p>

                  {buzon.pendientes > 0 ? (
                    <Boton
                      estilo={BOTON_CORREO}
                      icono={Sparkles}
                      className="mt-5"
                      disabled={cargando}
                      onClick={() => void procesarCorreo()}
                    >
                      {cargando ? 'Procesando…' : `Procesar los ${buzon.pendientes} que llegaron`}
                    </Boton>
                  ) : (
                    // Decir que no hay nada es información. Un hueco en blanco
                    // parece que la pantalla se rompió.
                    <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
                      {buzon.ultimoCorreo
                        ? `Sin documentos nuevos. El último correo llegó el ${new Date(buzon.ultimoCorreo).toLocaleDateString('es-CO')}.`
                        : 'Todavía no ha llegado ningún correo a esta dirección.'}
                    </p>
                  )}

                  {/* Lo que llegó, con nombre y remitente.
                      Un contador que ve «3 sin procesar» y nada más no puede
                      saber si son los de su cliente o el reenvío repetido de
                      otro. Y cuando algo falla, sin esta lista no hay forma de
                      saber QUÉ falló ni a quién reclamarle el archivo. */}
                  {bandeja.length > 0 && (
                    <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-slate-200">
                      <p className="bg-slate-50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Esperando a que los proceses
                      </p>
                      <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                        {bandeja.map((a, i) => (
                          <motion.div
                            key={a.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...MOV.entrada, delay: Math.min(i, 6) * 0.04 }}
                            className="flex items-start gap-2.5 px-4 py-3"
                          >
                            <FileText className="mt-0.5 size-3.5 shrink-0 text-sky-500" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12.5px] font-semibold text-slate-800">
                                {a.filename}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {a.from_address ?? 'remitente desconocido'}
                                {a.subject ? ` · ${a.subject}` : ''}
                              </p>
                            </div>
                            <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                              {new Date(a.received_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Tarjeta>

            {/* Columna del porqué. Es lo que llenaba de blanco esta pantalla:
                la función estaba, pero nada explicaba qué cambia en el mes del
                contador si la enciende. */}
            <Tarjeta className="p-6" indice={1}>
              <h3 className="text-base font-black text-slate-900">Qué cambia en tu mes</h3>
              <ul className="mt-4 space-y-4">
                {[
                  {
                    icono: Clock3,
                    titulo: 'Dejas de ir a buscarlos',
                    texto: 'El portal de la DIAN pide un token que dura una hora y hay que pedirlo a mano. Por correo no hay que pedir nada: llegan.',
                  },
                  {
                    icono: CheckCheck,
                    titulo: 'No se te pierde ninguno',
                    texto: 'Lo que entra queda listado con remitente y fecha. Si un proveedor no mandó la factura, se ve — y sabes a quién reclamarle.',
                  },
                  {
                    icono: Lock,
                    titulo: 'Sin darnos tu contraseña',
                    texto: 'Es una dirección aparte, sólo tuya. Tú decides qué se reenvía ahí; nosotros no entramos a tu correo.',
                  },
                ].map((b, i) => {
                  const Icono = b.icono;
                  return (
                    <motion.li
                      key={b.titulo}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...MOV.entrada, delay: 0.1 + i * 0.07 }}
                      className="flex gap-3"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                        <Icono className="size-4 text-sky-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800">{b.titulo}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{b.texto}</p>
                      </div>
                    </motion.li>
                  );
                })}
              </ul>

              {!buzon.disponible && (
                <button
                  type="button"
                  onClick={() => setSeccion('planes')}
                  className="mt-5 flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-blue-50"
                >
                  <span className="min-w-0 text-[12.5px] font-bold text-slate-700">
                    Ver todos los planes
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-slate-400" />
                </button>
              )}
            </Tarjeta>
          </div>
        </div>
        )}

        {/* ── Verificar por lista de CUFEs ─────────────────────────────
            Responde la pregunta que el contador resuelve hoy a mano: de lo
            que la DIAN dice que tengo, ¿qué ya está cargado y qué me falta?
            No descarga nada de la DIAN: cruza contra lo que ya está aquí. */}
        {/* Integrado como sección, no como una tarjeta flotando en medio de
            una pantalla vacía. El desplegable tampoco tenía sentido: si el
            contador entró a «Verificar CUFEs» es exactamente lo que quiere
            hacer, y le tocaba dar un clic más para que apareciera el campo. */}
        {seccion === 'cufes' && (
        <div>
          <Cabecera
            titulo="¿Te faltan documentos?"
            descripcion="Copia la columna de CUFEs del Excel de la DIAN y te digo al instante cuáles ya tienes cargados y cuáles te faltan. Sin revisar uno por uno."
            icono={ListChecks}
            color="#059669"
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <Tarjeta className="p-6" indice={0}>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Lista de CUFEs
              </label>
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
                rows={7}
                placeholder="Pega aquí los CUFEs, uno por línea. También funciona copiando la columna directamente del Excel."
                className="mt-1.5 w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-mono text-xs outline-none transition focus:border-emerald-400 focus:bg-white"
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Boton
                  estilo={BOTON_EXITO}
                  icono={ListChecks}
                  disabled={cruzando}
                  onClick={() => void ejecutarCruce()}
                >
                  {cruzando ? 'Verificando…' : 'Verificar'}
                </Boton>
                {cruce && (
                  <Boton
                    estilo={BOTON_NEUTRO}
                    onClick={() => { setCruce(null); setTextoCufes(''); }}
                  >
                    Limpiar
                  </Boton>
                )}
              </div>

              {cruce && (
                <div className="mt-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { l: 'En tu lista', v: cruce.total, c: 'text-slate-900' },
                      { l: 'Ya los tienes', v: cruce.encontrados.length, c: 'text-emerald-600' },
                      { l: 'Te faltan', v: cruce.faltantes.length, c: 'text-amber-600' },
                      { l: 'Mal copiados', v: cruce.invalidos.length, c: 'text-rose-600' },
                    ].map((x, i) => (
                      <motion.div
                        key={x.l}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...MOV.entrada, delay: i * 0.05 }}
                        className="rounded-2xl bg-slate-50 px-3 py-3"
                      >
                        <div className={`text-xl font-black tabular-nums ${x.c}`}>{x.v}</div>
                        <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{x.l}</div>
                      </motion.div>
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
                      {/* El puente que faltaba.
                          Saber cuáles faltan no servía de mucho: había que
                          copiarlos, abrir el descargador, pegarlos, elegir una
                          carpeta, esperar, ir a buscar esa carpeta y arrastrar
                          los archivos de vuelta a esta misma pantalla. Todo
                          eso para mover unos bytes que el navegador ya tenía.
                          Ahora los baja y los analiza sin salir de aquí. */}
                      {puedeDescargar && (
                        <button
                          type="button"
                          onClick={() => setPanelDescarga(true)}
                          className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                          <Download className="size-4" />
                          Descargar de la DIAN y analizar {cruce.faltantes.length === 1 ? 'el que falta' : `los ${cruce.faltantes.length}`}
                        </button>
                      )}

                      <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-50 p-3">
                        {cruce.faltantes.map((c) => (
                          <div key={c} className="truncate font-mono text-[11px] text-slate-500">{c}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {cruce.invalidos.length > 0 && (
                    <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-700 ring-1 ring-rose-200">
                      {cruce.invalidos.length} línea(s) no tienen forma de CUFE. Un CUFE son 96 caracteres
                      entre números y letras de la a a la f. Revisa que copiaste la columna completa.
                    </p>
                  )}
                </div>
              )}
            </Tarjeta>

            {/* De dónde sale la lista. Es la parte que el contador no sabe si
                nadie se la cuenta: la columna de CUFEs no está a la vista en
                el portal, hay que exportar el listado del periodo. */}
            <Tarjeta className="p-6" indice={1}>
              <h3 className="text-base font-black text-slate-900">De dónde sacas la lista</h3>
              <ol className="mt-4 space-y-4">
                {[
                  'Entra al portal de la DIAN y busca tus documentos recibidos del periodo.',
                  'Exporta el listado. Te descarga un Excel con una columna CUFE/CUDE.',
                  'Copia esa columna entera y pégala aquí. No hace falta limpiarla.',
                ].map((t, i) => (
                  <motion.li
                    key={t}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOV.entrada, delay: 0.1 + i * 0.07 }}
                    className="flex gap-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[12px] font-black text-emerald-700">
                      {i + 1}
                    </span>
                    <p className="min-w-0 text-[12.5px] leading-relaxed text-slate-500">{t}</p>
                  </motion.li>
                ))}
              </ol>

              <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-[12px] leading-relaxed text-slate-500">
                Esto no descarga nada de la DIAN: cruza tu lista contra lo que ya está aquí.
                Para bajar los que falten, usa <strong className="text-slate-700">Descargar de
                la DIAN</strong>.
              </p>
            </Tarjeta>
          </div>
        </div>
        )}

        {/* ── Zona de trabajo: traer a la izquierda, ver a la derecha ───
            Antes el recuadro de soltar ocupaba todo el ancho y el avance
            aparecía DENTRO de él, empujando el botón fuera de la pantalla
            justo cuando el contador quería soltar el siguiente archivo. En
            dos columnas cada cosa tiene su sitio fijo y nada salta.

            La columna derecha nunca está vacía: mientras se analiza enseña el
            avance, al terminar el resultado de esa importación, y en reposo
            el reparto por tipo del mes. Media pantalla en blanco el 95 % del
            tiempo no la merece nadie. */}
        {seccion === 'inicio' && (
        <div className="mb-6 grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <section
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void archivosDeSoltar(e.dataTransfer).then((fs) => procesar(fs));
            }}
            className={`flex min-h-[300px] flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-white p-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40 ${
              beta && !beta.ilimitado && (beta.cerrada || beta.llena) ? 'pointer-events-none opacity-40' : ''
            }`}
            style={{ borderRadius: CARD_RADIUS }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xml,.zip"
              multiple
              className="hidden"
              onChange={(e) => { void procesar(e.target.files); e.target.value = ''; }}
            />

            {/* Hoja con la etiqueta XML. Dice de un vistazo qué se espera
                aquí; un icono de nube genérico serviría para subir cualquier
                cosa, y aquí no vale cualquier cosa. */}
            <div className="relative mb-4">
              <FileUp className="size-12 text-blue-200" strokeWidth={1.5} />
              <span className="absolute -bottom-1 -left-2 rounded-md bg-blue-600 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-white shadow-sm">
                XML
              </span>
            </div>

            <p className="mb-1.5 text-[15px] font-black text-slate-900">
              Arrastra aquí tus XML de la DIAN
            </p>
            <p className="mb-5 max-w-sm text-[12.5px] leading-relaxed text-slate-500">
              O selecciona los archivos desde tu computador. Puedes soltar varios ZIP a la vez,
              o la carpeta entera; también sirven los XML sueltos.
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={cargando}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition disabled:opacity-60"
              style={{ background: BLUE_GRADIENT, borderRadius: 14, boxShadow: '0 12px 24px rgba(37,99,235,0.30)' }}
            >
              {cargando ? <Loader2 className="size-4 animate-spin" /> : <FolderOpen className="size-4" />}
              {cargando ? 'Analizando…' : 'Seleccionar archivos'}
            </button>

            <p className="mt-4 text-[11.5px] text-slate-400">
              Formatos permitidos: .zip, .xml
            </p>
          </section>

          {cargando ? (
            <section className="flex flex-col p-5" style={CARD}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-black text-slate-900">Análisis en progreso</h3>
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {progreso?.fase === 'leyendo'
                    ? 'Abriendo el archivo'
                    : `Analizando ${progreso?.hechos ?? 0} de ${progreso?.total ?? 0} archivos`}
                </span>
                <span className="ml-auto text-[19px] font-black tabular-nums text-blue-700">
                  {porcentaje}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: BLUE_GRADIENT }}
                  animate={{ width: `${porcentaje}%` }}
                  transition={MOV.suave}
                />
              </div>

              {/* La lista crece hacia abajo y con muchos archivos empujaría la
                  tabla fuera de la pantalla. Va en su propia caja con scroll:
                  el panel mide siempre lo mismo pase lo que pase. */}
              {feed.length > 0 && (
                <ul className="mt-4 max-h-[240px] space-y-2 overflow-y-auto pr-1">
                  {feed.map((f, i) => (
                    <li key={`${f.nombre}-${i}`} className="flex items-center gap-2.5 text-[12px]">
                      <FileText className="size-3.5 shrink-0 text-slate-300" />
                      <span className="min-w-0 flex-1 truncate text-slate-600">{f.nombre}</span>
                      {f.estado === 'ok' && (
                        <span className="flex shrink-0 items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3.5" /> Leído
                        </span>
                      )}
                      {f.estado === 'revision' && (
                        <span className="flex shrink-0 items-center gap-1 font-semibold text-amber-600">
                          <AlertTriangle className="size-3.5" /> Revisar
                        </span>
                      )}
                      {f.estado === 'duplicado' && (
                        <span className="flex shrink-0 items-center gap-1 text-slate-400">
                          <Copy className="size-3.5" /> Repetido
                        </span>
                      )}
                      {f.estado === 'error' && (
                        <span className="flex shrink-0 items-center gap-1 font-semibold text-rose-600">
                          <XCircle className="size-3.5" /> Con errores
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : resumen ? (
            <section className="flex flex-col p-5" style={CARD}>
              <h3 className="mb-3 text-[15px] font-black text-slate-900">
                Resultado de lo que acabas de subir
              </h3>

              {resumen.rechazados.length > 0 && (
                <div className="mb-3 rounded-xl bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-800 ring-1 ring-rose-200">
                  <p className="mb-1 font-bold">
                    {resumen.rechazados.length} archivo(s) no se pudieron abrir. El resto sí se procesó.
                  </p>
                  {resumen.rechazados.slice(0, 4).map((r) => (
                    <p key={r.nombre} className="truncate">· {r.nombre} — {r.motivo}</p>
                  ))}
                  {resumen.rechazados.length > 4 && <p>· y {resumen.rechazados.length - 4} más</p>}
                </div>
              )}
              {resumen.sinProcesarPorCuota > 0 && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-200">
                  Quedaron <strong>{resumen.sinProcesarPorCuota}</strong> documento(s) sin procesar
                  porque llegaste a tu cupo de {beta?.limitePersona ?? 100}. No se perdieron:
                  vuelve a subir el mismo archivo cuando tengas cupo y Codec continúa donde quedó.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2.5">
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
          ) : resMes && resMes.documentos > 0 ? (
            <RepartoPorTipo datos={resMes} />
          ) : (
            <section className="flex flex-col items-center justify-center p-8 text-center" style={CARD}>
              <BarChart3 className="mb-3 size-8 text-slate-200" />
              <p className="text-[13px] font-bold text-slate-700">Aquí verás el avance</p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-slate-400">
                Cuando sueltes tus archivos, esta columna te dirá archivo por archivo cómo va.
              </p>
            </section>
          )}
        </div>
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

        {/* ── Cómo va el mes ──────────────────────────────────────────
            Estas cuatro cifras estaban en Inicio y ocupaban la primera
            pantalla entera. Aquí tienen más sentido: mirar cuánto se procesó
            es algo que se hace DESPUÉS de procesar, y ésta es la pestaña a la
            que el contador viene a revisar. */}
        {seccion === 'documentos' && resMes && resMes.documentos > 0 && (
          <div className="mb-4">
            <CifrasMes datos={resMes} />
          </div>
        )}

        {/* Y las tres cifras de dinero, que son las que coteja mientras mira
            la tabla. Van debajo de las de arriba porque responden a otra
            pregunta: aquéllas dicen cómo fue el mes, éstas cuánto suma lo que
            está viendo. */}
        {seccion === 'documentos' && totales && totales.documentos > 0 && (
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Cifra etiqueta="Total compras" valor={pesos(totales.compras)}
                   icono={FileText} color="#2563EB" indice={0} />
            <Cifra etiqueta="IVA" valor={pesos(totales.iva)}
                   icono={Scale} color="#7C3AED" indice={1}
                   pie="Notas crédito ya restadas" />
            <Cifra etiqueta="Retenciones" valor={pesos(totales.retenciones)}
                   icono={CheckCheck} color="#10B981" indice={2} />
          </div>
        )}

        {/* ── Tabla ───────────────────────────────────────────────────── */}
        {/* La tabla también en Inicio.
            Es el cambio que hace que esto se entienda: soltar los archivos,
            ver el avance y ver los documentos ocurre en la MISMA pantalla, sin
            navegar. Tenerlo repartido en secciones obligaba al contador a
            recordar dónde estaba cada cosa, que es justo lo que sobra en una
            herramienta que se usa una vez al mes. */}
        {(seccion === 'inicio' || seccion === 'documentos' || seccion === 'revision') && (
        <section className="overflow-hidden bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-1 border-b border-slate-100 px-6 pt-4">
            {/* La insignia lleva el TOTAL que cumple el filtro, no las filas
                de esta página. Con paginación, `documentos.length` diría
                «Documentos 50» tuviera el contador 50 o 5.000. */}
            {([
              ['documentos', 'Documentos', totalFiltrado],
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

          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-6 py-4">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por número, proveedor o NIT"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
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
              className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {exportando ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Descargar Excel
            </button>
            <button
              type="button"
              onClick={descargarCsv}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              CSV
            </button>
            {seleccion.size > 0 && (
              <button
                type="button"
                onClick={() => void borrar([...seleccion])}
                disabled={borrando}
                className="flex items-center gap-1.5 rounded-2xl bg-rose-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
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
              {/* Las celdas van a px-4, no a los px-6 del resto de la tarjeta.
                  «Actividad reciente» del dashboard usa px-6 y le sobra sitio
                  porque tiene cuatro columnas; ésta tiene diez, y con px-6 la
                  fecha se partía en dos líneas y el estado quedaba cortado
                  contra el borde. La tarjeta conserva sus px-6 en la barra de
                  filtros y en el pie: lo que se aprieta es la rejilla de
                  datos, que es lo que la necesita. */}
              <table className="w-full min-w-[900px] text-sm" translate="no">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                    <th className="w-12 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos"
                        checked={documentos.length > 0 && seleccion.size === documentos.length}
                        onChange={(e) => setSeleccion(e.target.checked ? new Set(documentos.map((d) => d.id)) : new Set())}
                        className="size-4 accent-blue-600"
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
                    <th className="w-20 px-5 py-3 text-right font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {documentos.map((d) => {
                    const e = ESTADO[d.status]
                      ?? { texto: d.status, color: '#475569', fondo: '#F1F5F9', punto: '#94A3B8' };
                    const revisable = d.status === 'REVIEW_REQUIRED' || d.status === 'INVALID';
                    return (
                      <tr
                        key={d.id}
                        onClick={() => void abrirDetalle(d.id)}
                        className="cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-3.5" onClick={(ev) => ev.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Seleccionar ${d.full_number ?? ''}`}
                            checked={seleccion.has(d.id)}
                            onChange={() => alternarSeleccion(d.id)}
                            className="size-4 accent-blue-600"
                          />
                        </td>
                        {/* El tipo como pastilla de color, y el color es el
                            mismo que usa la dona del reparto por tipo. Es lo
                            que permite recorrer 50 filas y ver dónde están las
                            notas crédito sin leer una por una. */}
                        <td className="px-4 py-3.5">
                          {(() => {
                            const c = COLOR_TIPO[d.doc_type] ?? COLOR_TIPO.desconocido;
                            return (
                              <span
                                className="inline-block whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold"
                                style={{ color: c, background: `${c}14` }}
                              >
                                {ETIQUETA_TIPO[d.doc_type] ?? d.doc_type}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{d.full_number}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 tabular-nums text-slate-400">{d.issue_date}</td>
                        {/* 180 y no 220: con 220 la tabla medía 1.100 px en
                            una caja de 1.062 y la columna «Acción» quedaba
                            cortada contra el borde. El nombre del proveedor ya
                            iba truncado de todos modos, así que los 40 px
                            salen de donde no se estaba leyendo nada. */}
                        <td className="max-w-[180px] px-4 py-3.5">
                          <span className="block truncate text-slate-800">{d.issuer_name}</span>
                          <span className="block truncate text-xs tabular-nums text-slate-400">{d.issuer_nit}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{pesos(Number(d.line_total))}</td>
                        <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">{pesos(Number(d.total_iva))}</td>
                        <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900">{pesos(Number(d.total))}</td>
                        <td className="px-4 py-3.5">
                          {/* La pastilla dice el estado, pero no el porqué, y
                              «Requiere revisión» sin motivo deja al contador
                              adivinando. Se marca como pulsable y abre el
                              detalle, donde está «Qué debes revisar». */}
                          <span
                            title={revisable ? 'Clic para ver por qué' : undefined}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold${
                              revisable ? ' cursor-pointer' : ''
                            }`}
                            style={{ color: e.color, background: e.fondo }}
                          >
                            <span className="size-1.5 shrink-0 rounded-full" style={{ background: e.punto }} />
                            {e.texto}
                            {revisable && ' ›'}
                          </span>
                        </td>
                        {/* «Abrir» como enlace azul, igual que en Actividad
                            reciente del dashboard.

                            En el mockup había además un botón de descarga por
                            fila, pero el XML de cada documento todavía no se
                            guarda en Storage —sólo su huella—, así que no
                            tendría nada que bajar. Un icono que no hace nada
                            gasta más confianza de la que ahorra: la descarga
                            por fila entra cuando entre la retención del XML. */}
                        <td className="px-4 py-3.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => void abrirDetalle(d.id)}
                            className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
                          >
                            Abrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Paginación ────────────────────────────────────────────────
              Antes la tabla traía como mucho 200 filas y no lo decía: quien
              tenía 1.250 documentos en el mes veía 200 y daba por hecho que
              ésos eran todos. En una herramienta fiscal, un corte silencioso
              es peor que una página de más. */}
          {vista === 'documentos' && totalFiltrado > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
              <p className="text-[12px] text-slate-500">
                Mostrando{' '}
                <strong className="tabular-nums text-slate-700">
                  {((pagina - 1) * DOCS_POR_PAGINA + 1).toLocaleString('es-CO')}
                </strong>
                {' a '}
                <strong className="tabular-nums text-slate-700">
                  {Math.min(pagina * DOCS_POR_PAGINA, totalFiltrado).toLocaleString('es-CO')}
                </strong>
                {' de '}
                <strong className="tabular-nums text-slate-700">
                  {totalFiltrado.toLocaleString('es-CO')}
                </strong>
                {' documentos'}
              </p>

              {totalPaginas > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {paginasVisibles.map((p, i) =>
                    p === null ? (
                      <span key={`hueco-${i}`} className="px-1 text-[12px] text-slate-300">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPagina(p)}
                        className={`min-w-[32px] rounded-lg px-2 py-1.5 text-[12px] font-bold tabular-nums transition ${
                          p === pagina
                            ? 'text-white'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        }`}
                        style={p === pagina ? { background: BLUE_GRADIENT } : undefined}
                        aria-current={p === pagina ? 'page' : undefined}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    disabled={pagina >= totalPaginas}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
        )}
        </div>
      </div>

      {/* Los modales quedan FUERA del envoltorio con desplazamiento lateral:
          son superposiciones fijas y con el `padding-left` de la barra se
          verían descentradas en escritorio. */}

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

      {/* Las cuatro herramientas grandes comparten cajón. Antes cada una traía
          el suyo copiado y pegado, y arreglar uno dejaba los otros tres igual
          —el detalle de documento, por ejemplo, no cerraba con Escape—. */}
      <CajonDerecho
        abierto={panelDescarga && puedeDescargar}
        onCerrar={() => setPanelDescarga(false)}
        etiqueta="Descargar de la DIAN"
      >
        <DescargarDeDian
          onCerrar={() => setPanelDescarga(false)}
          narrar={narrar}
          // Los que la verificación ya identificó como faltantes: llegan
          // pegados, sin que haya que copiarlos a mano.
          cufesIniciales={cruce?.faltantes}
          // Y lo descargado entra directo al analizador, que es lo que se
          // quería desde el principio.
          onDescargados={(archivos) => { void procesar(archivos); }}
        />
      </CajonDerecho>

      <CajonDerecho
        abierto={panelAuditor}
        onCerrar={() => setPanelAuditor(false)}
        ancho="max-w-3xl"
        etiqueta="Cruzar con mi contabilidad"
      >
        <AuditorFiscal
          onCerrar={() => setPanelAuditor(false)}
          narrar={narrar}
          cargarDocumentos={async () => {
            const { documentos: docs } = await datosParaReporte({});
            return docs as unknown as DocumentoDian[];
          }}
        />
      </CajonDerecho>

      <CajonDerecho
        abierto={panelPlantilla}
        onCerrar={() => setPanelPlantilla(false)}
        ancho="max-w-3xl"
        etiqueta="Plantillas contables"
      >
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
      </CajonDerecho>

      {/* La ayuda, flotante y movible. Fuera del contenedor desplazado por la
          barra lateral porque se posiciona contra la ventana, no contra la
          columna de contenido. */}
      <AyudaFlotante
        abierta={ayudaAbierta}
        onAbrir={() => setAyudaAbierta(true)}
        onCerrar={() => setAyudaAbierta(false)}
        // Repite el guion de la sección en la que está, no el último que sonó:
        // si el contador cambió de pantalla mientras la voz hablaba, lo que
        // quiere oír es dónde está ahora.
        onEscuchar={() => speak(GUION_SECCION[seccion] ?? GUION_SECCION.inicio)}
      />

      <CajonDerecho
        abierto={Boolean(detalle || cargandoDetalle)}
        onCerrar={() => setDetalle(null)}
        ancho="max-w-lg"
        etiqueta="Detalle del documento"
      >
        {cargandoDetalle || !detalle ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <DetalleDocumento datos={detalle} onCerrar={() => setDetalle(null)} />
        )}
      </CajonDerecho>
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
  const e = ESTADO[d.status]
    ?? { texto: d.status, color: '#475569', fondo: '#F1F5F9', punto: '#94A3B8' };

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
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ color: e.color, background: e.fondo }}
            >
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: e.punto }} />
              {e.texto}
            </span>
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
