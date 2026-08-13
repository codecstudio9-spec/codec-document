/**
 * Acceso a datos del motor de documentos electrónicos DIAN.
 *
 * Esta capa es la única que conoce Supabase. El motor (src/lib/dian/) es
 * TypeScript puro y no importa nada de la aplicación — es lo que permitirá
 * llevarlo a Codec POS copiando la carpeta, y lo que le deja correr igual
 * en un Web Worker que en una Edge Function.
 *
 * Sigue el estilo del resto de src/app/services: cliente supabase tipado a
 * mano, sin ORM.
 */

import { supabase } from '../../lib/supabase';
import { parseDianXml } from '../../lib/dian/parser';
import { mapearDocumento, type PayloadDocumento } from '../../lib/dian/mapper';
import { leerZipSeguro, sha256Hex, ZipError, type EntradaZip } from '../../lib/dian/zip';
import { base64ABytes } from '../../lib/dian/xlsx-relleno';

export interface ResumenImportacion {
  importId: string;
  encontrados: number;
  procesados: number;
  duplicados: number;
  revision: number;
  errores: number;
  porTipo: Record<string, number>;
  sinProcesarPorCuota: number;
  rechazados: ArchivoRechazado[];
}

export interface EventoProgreso {
  fase: 'leyendo' | 'procesando' | 'guardando' | 'listo';
  total: number;
  hechos: number;
  ultimo?: { nombre: string; estado: 'ok' | 'revision' | 'duplicado' | 'error'; detalle?: string };
}

export interface DocumentoListado {
  id: string;
  doc_type: string;
  full_number: string | null;
  issue_date: string | null;
  issuer_nit: string | null;
  issuer_name: string | null;
  line_total: number;
  total_iva: number;
  total_retenciones: number;
  total: number;
  status: string;
  cufe: string | null;
}

/** Estado de la beta: cupos, consumo y fecha de cierre.
 *
 *  Todo viene de la función `ed_beta_estado()` en la base. Tiene que ser
 *  así: el tope GLOBAL no se puede calcular desde el cliente, porque las
 *  políticas RLS de ed_documents sólo dejan ver lo propio y un usuario
 *  contando filas obtendría su propio número, no el de la plataforma.
 *  La función es SECURITY DEFINER y devuelve sólo cifras agregadas. */
export interface EstadoBeta {
  limitePersona: number;
  limiteGlobal: number;
  cierre: string | null;
  usadosPersona: number;
  usadosGlobal: number;
  personas: number;
  cerrada: boolean;
  llena: boolean;
  ilimitado: boolean;
  /** Plan de pago o admin: no le aplican los topes de capacidad de la beta. */
  exentoGlobal: boolean;
  planCode: string;
  planNombre: string;
  planActivo: boolean;
  restantesPersona: number;
  restantesGlobal: number;
  /** Si esta cuenta puede usar la descarga masiva desde la DIAN. La decide el
   *  servidor; el cliente sólo la obedece para mostrar o no el botón. El
   *  cierre de verdad está en la Edge Function `dian-descargar`. */
  puedeDescargar: boolean;
  /** Correos autorizados a probar la descarga. Sólo llega si quien pregunta
   *  es el propietario; para el resto es null, porque son datos de terceros. */
  descargaPermitidos: string[] | null;
  /** Si la descarga está abierta a cualquier usuario con sesión. Cuando está
   *  cerrada, sólo entran el propietario y los correos autorizados. */
  descargaAbierta: boolean;
}

export async function estadoBeta(): Promise<EstadoBeta> {
  const { data, error } = await supabase.rpc('ed_beta_estado');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;

  // Sin límite personal (plan sin tope o admin) llega null. Se representa como
  // Infinity para que las restas de abajo no lo conviertan en cero, que es
  // justo lo contrario de «sin límite».
  const limitePersona = d.limite_persona == null ? Infinity : Number(d.limite_persona);
  const limiteGlobal = Number(d.limite_global ?? 2000);
  const usadosPersona = Number(d.usados_persona ?? 0);
  const usadosGlobal = Number(d.usados_global ?? 0);

  return {
    limitePersona, limiteGlobal,
    cierre: (d.cierre as string) ?? null,
    usadosPersona, usadosGlobal,
    personas: Number(d.personas ?? 0),
    cerrada: Boolean(d.cerrada),
    llena: Boolean(d.llena),
    ilimitado: Boolean(d.ilimitado),
    exentoGlobal: Boolean(d.exento_global),
    planCode: String(d.plan_code ?? 'gratis'),
    planNombre: String(d.plan_nombre ?? 'Gratis'),
    planActivo: Boolean(d.plan_activo),
    restantesPersona: Math.max(0, limitePersona - usadosPersona),
    restantesGlobal: Math.max(0, limiteGlobal - usadosGlobal),
    puedeDescargar: Boolean(d.puede_descargar),
    descargaPermitidos: typeof d.descarga_permitidos === 'string'
      ? d.descarga_permitidos.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean)
      : null,
    descargaAbierta: Boolean(d.descarga_abierta),
  };
}

/** Guarda la lista de personas autorizadas a probar la descarga masiva.
 *  Se normaliza aquí y se vuelve a validar en el servidor. */
export async function guardarPermitidosDescarga(correos: string[]): Promise<void> {
  const limpios = [...new Set(
    correos.map((c) => c.trim().toLowerCase()).filter((c) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c)),
  )];
  await configurarBeta('dian_descarga_permitidos', limpios.join(','));
}

/** Sólo el propietario. El guardia real está dentro de la función SQL. */
export async function configurarBeta(clave: string, valor: string): Promise<void> {
  const { error } = await supabase.rpc('ed_beta_configurar', { p_clave: clave, p_valor: valor });
  if (error) throw new Error(error.message);
}

// ── Plan de pago (Wompi) ──────────────────────────────────────────────────

/** Estado del plan del contador.
 *
 *  Es un plan APARTE del de documentos y firmas: otro producto, otro precio y
 *  otra moneda. El precio llega del servidor y no va escrito en la pantalla,
 *  para que moverlo sea cambiar un ajuste y no desplegar. */
/** Un plan del catálogo, tal como se le enseña al contador. */
export interface PlanCatalogo {
  code: string;
  nombre: string;
  /** En pesos. null = todavía no tiene precio definido. */
  precio: number | null;
  /** Documentos al mes que aplican AHORA. Ya lleva la promoción dentro si la
   *  hay: la pantalla no tiene que calcular nada. */
  limite: number | null;
  /** A cuánto vuelve cuando acabe la promoción. null = no hay promoción. */
  limiteNormal: number | null;
  /** Cuándo acaba la promoción. null = no hay promoción. */
  promoHasta: string | null;
  usoJusto: string | null;
  aLaVenta: boolean;
}

/** La cuota del contador este mes, con todo lo necesario para explicársela
 *  ANTES de que choque con ella. */
export interface EstadoCuota {
  planCode: string;
  planNombre: string;
  planPrecio: number | null;
  /** null = sin límite técnico. */
  limite: number | null;
  usoJusto: string | null;
  usados: number;
  /** null cuando no hay límite. */
  restantes: number | null;
  ilimitado: boolean;
  hasta: string | null;
  renuevaEl: string | null;
  /** El siguiente plan comprable, para poder ofrecerlo sin saberse el catálogo. */
  siguiente: { code: string; nombre: string; precio: number; limite: number | null } | null;
  diasRestantes: number | null;
}

export async function estadoCuota(): Promise<EstadoCuota> {
  const { data, error } = await supabase.rpc('ed_cuota_estado');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;

  const hasta = (d.hasta as string) ?? null;
  const s = d.siguiente as Record<string, unknown> | null;

  return {
    planCode: String(d.plan_code ?? 'gratis'),
    planNombre: String(d.plan_nombre ?? 'Gratis'),
    planPrecio: d.plan_precio == null ? null : Number(d.plan_precio),
    limite: d.limite == null ? null : Number(d.limite),
    usoJusto: (d.uso_justo as string) ?? null,
    usados: Number(d.usados ?? 0),
    restantes: d.restantes == null ? null : Number(d.restantes),
    ilimitado: Boolean(d.ilimitado),
    hasta,
    renuevaEl: (d.renueva_el as string) ?? null,
    siguiente: s
      ? {
          code: String(s.code), nombre: String(s.nombre),
          precio: Number(s.precio),
          limite: s.limite == null ? null : Number(s.limite),
        }
      : null,
    diasRestantes: hasta
      ? Math.max(0, Math.ceil((new Date(hasta).getTime() - Date.now()) / 86_400_000))
      : null,
  };
}

/** Resumen del mes, con la comparación contra el anterior. */
export interface ResumenMes {
  mes: string;
  documentos: number;
  valorTotal: number;
  /** null cuando no hay documentos: un 0 % diría «todo mal» donde no hay nada
   *  que juzgar. */
  sinErroresPct: number | null;
  documentosPrev: number;
  valorPrev: number;
  porTipo: Array<{ tipo: string; cantidad: number; valor: number }>;
  /** Variación en documentos. null si el mes anterior estaba vacío: dividir
   *  entre cero daría un «+∞ %» que no significa nada. */
  variacionDocs: number | null;
  variacionValor: number | null;
}

export async function resumenMes(mes?: string): Promise<ResumenMes> {
  const { data, error } = await supabase.rpc('ed_resumen_mes', { p_mes: mes ?? null });
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;

  const documentos = Number(d.documentos ?? 0);
  const documentosPrev = Number(d.documentos_prev ?? 0);
  const valorTotal = Number(d.valor_total ?? 0);
  const valorPrev = Number(d.valor_prev ?? 0);

  const variacion = (ahora: number, antes: number): number | null =>
    antes > 0 ? Math.round(((ahora - antes) / antes) * 1000) / 10 : null;

  return {
    mes: String(d.mes ?? ''),
    documentos,
    valorTotal,
    sinErroresPct: d.sin_errores_pct == null ? null : Number(d.sin_errores_pct),
    documentosPrev,
    valorPrev,
    porTipo: ((d.por_tipo ?? []) as Record<string, unknown>[]).map((t) => ({
      tipo: String(t.tipo),
      cantidad: Number(t.cantidad ?? 0),
      valor: Number(t.valor ?? 0),
    })),
    variacionDocs: variacion(documentos, documentosPrev),
    variacionValor: variacion(valorTotal, valorPrev),
  };
}

export async function listarPlanes(): Promise<PlanCatalogo[]> {
  const { data, error } = await supabase.rpc('ed_planes_listar');
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((p) => ({
    code: String(p.code),
    nombre: String(p.nombre),
    precio: p.precio == null ? null : Number(p.precio),
    limite: p.limite == null ? null : Number(p.limite),
    limiteNormal: p.limite_normal == null ? null : Number(p.limite_normal),
    promoHasta: (p.promo_hasta as string) ?? null,
    usoJusto: (p.uso_justo as string) ?? null,
    aLaVenta: Boolean(p.a_la_venta),
  }));
}

/** Abre el cobro del plan y devuelve la dirección del Checkout de Wompi.
 *
 *  Viaja el CÓDIGO del plan, nunca el precio. El importe y la firma los
 *  calcula el servidor leyendo ed_plans: si el navegador pudiera decir cuánto
 *  cobrar, cualquiera pagaría mil pesos por el Profesional. */
export async function iniciarPagoPlan(planCode: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('wompi-checkout', {
    body: { plan: planCode },
  });
  if (error) throw new Error(error.message);

  const c = data as {
    publicKey: string; reference: string; amountInCents: number;
    currency: string; signature: string; redirectUrl: string;
    email?: string; error?: string;
  };
  if (c?.error) throw new Error(c.error);
  if (!c?.signature) throw new Error('No se pudo abrir el cobro.');

  // Checkout Web de Wompi por redirección. Se prefiere al widget incrustado
  // porque no obliga a cargar un script de otro dominio dentro de la app.
  //
  // NO se usa un «link de pago» de Wompi (checkout.wompi.co/l/…): ese lleva
  // referencia fija, y el webhook necesita saber QUÉ contador pagó para
  // activarle el plan. Con una referencia igual para todos no se puede.
  const q = new URLSearchParams({
    'public-key': c.publicKey,
    currency: c.currency,
    'amount-in-cents': String(c.amountInCents),
    reference: c.reference,
    'signature:integrity': c.signature,
    'redirect-url': c.redirectUrl,
  });
  // Prellenar el correo evita retecleárselo justo cuando va a pagar, que es
  // el peor momento para poner un trámite de más.
  if (c.email) q.set('customer-data:email', c.email);

  return `https://checkout.wompi.co/p/?${q.toString()}`;
}

// ── Conector de correo ────────────────────────────────────────────────────

/** El dominio donde se reciben las facturas. Va aquí y no en la base para que
 *  cambiarlo no obligue a migrar filas: en la base sólo vive el token. */
const DOMINIO_BUZON =
  (import.meta.env.VITE_DIAN_INBOX_DOMAIN as string | undefined)
  ?? 'facturas.codecdocument.com';

export interface EstadoCorreo {
  /** Dirección completa del contador. null si nunca la ha activado. */
  direccion: string | null;
  activo: boolean;
  ultimoCorreo: string | null;
  /** Documentos esperando a que los procese. */
  pendientes: number;
  /** Si su plan incluye la recepción por correo. Lo decide el servidor; la
   *  pantalla sólo lo obedece para mostrar el candado. El cierre de verdad
   *  está en `ed_email_activar()` y en `ed_email_recibir()`. */
  disponible: boolean;
  planActual: string;
  /** El plan más barato que lo incluye, para poder ofrecerlo sin que la
   *  pantalla se sepa el catálogo ni se quede desfasada si cambian precios. */
  planMinimo: { code: string; nombre: string; precio: number } | null;
}

export interface ArchivoBandeja {
  id: string;
  filename: string;
  from_address: string | null;
  subject: string | null;
  received_at: string;
  size_bytes: number | null;
  storage_path: string;
}

const direccionDe = (token: string | null): string | null =>
  token ? `${token}@${DOMINIO_BUZON}` : null;

export async function estadoCorreo(): Promise<EstadoCorreo> {
  const { data, error } = await supabase.rpc('ed_email_estado');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;
  const m = d.plan_minimo as Record<string, unknown> | null;

  return {
    direccion: direccionDe((d.token as string) ?? null),
    activo: Boolean(d.activo),
    ultimoCorreo: (d.ultimo_correo as string) ?? null,
    pendientes: Number(d.pendientes ?? 0),
    disponible: Boolean(d.disponible),
    planActual: String(d.plan_actual ?? 'Gratis'),
    planMinimo: m
      ? { code: String(m.code), nombre: String(m.nombre), precio: Number(m.precio) }
      : null,
  };
}

export async function activarCorreo(): Promise<string> {
  const { data, error } = await supabase.rpc('ed_email_activar');
  if (error) throw new Error(error.message);
  const dir = direccionDe(((data ?? {}) as Record<string, unknown>).token as string);
  if (!dir) throw new Error('No se pudo crear la dirección.');
  return dir;
}

/**
 * Cambia el nombre de la dirección: `douglas-taborda` → la dirección pasa a
 * ser `douglas-taborda-a4f9c2d1@…`.
 *
 * El sufijo lo pone el servidor y no se puede elegir: es lo que impide que
 * alguien adivine la dirección de un contador sabiendo cómo se llama. Por lo
 * mismo, la normalización del nombre también es del servidor — aquí sólo se
 * previsualiza para que el contador vea lo que va a quedar.
 */
export async function renombrarCorreo(alias: string): Promise<string> {
  const { data, error } = await supabase.rpc('ed_email_alias', { p_alias: alias });
  if (error) throw new Error(error.message);
  const dir = direccionDe(((data ?? {}) as Record<string, unknown>).token as string);
  if (!dir) throw new Error('No se pudo cambiar la dirección.');
  return dir;
}

/** La misma limpieza que hace el servidor, para enseñar en vivo cómo va a
 *  quedar mientras se teclea. NO sustituye a la del servidor: es un espejo
 *  para que no haya sorpresas al pulsar el botón. */
export function previsualizarAlias(alias: string): string {
  return alias
    .toLowerCase()
    // El rango del corchete es U+0300–U+036F: las marcas diacríticas que NFD
    // separa de su letra. Van como caracteres literales, así que en un editor
    // el corchete parece vacío o con basura — no lo está. Si alguna vez sale
    // mojibake ahí, es que una herramienta reescribió el archivo con otra
    // codificación; se restituye con ̀-ͯ.
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 24)
    .replace(/^-+|-+$/g, '');
}

export async function apagarCorreo(): Promise<void> {
  const { error } = await supabase.rpc('ed_email_apagar');
  if (error) throw new Error(error.message);
}

export async function listarBandeja(): Promise<ArchivoBandeja[]> {
  const { data, error } = await supabase
    .from('ed_inbox_files')
    .select('id, filename, from_address, subject, received_at, size_bytes, storage_path')
    .eq('status', 'PENDING')
    .order('received_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as ArchivoBandeja[];
}

/**
 * Procesa lo que llegó por correo.
 *
 * Baja los archivos del bucket privado y los mete por EL MISMO camino que un
 * archivo arrastrado a mano. Esa es la decisión de fondo del conector: no hay
 * un segundo motor para el correo. Si lo hubiera, el mismo documento podría
 * dar dos cifras distintas según por dónde entró, y eso en contabilidad no es
 * una molestia, es una declaración mal presentada.
 */
export async function importarBandeja(
  onProgreso: (e: EventoProgreso) => void,
): Promise<ResumenImportacion & { desdeCorreo: number }> {
  const pendientes = await listarBandeja();
  if (pendientes.length === 0) {
    throw new Error('No hay documentos nuevos en el correo.');
  }

  const archivos: File[] = [];
  const bajados: string[] = [];
  const fallidos: { id: string; error: string }[] = [];

  for (const p of pendientes) {
    const { data, error } = await supabase.storage
      .from('fiscal-documents')
      .download(p.storage_path);
    if (error || !data) {
      fallidos.push({ id: p.id, error: error?.message ?? 'No se pudo leer el archivo.' });
      continue;
    }
    archivos.push(new File([data], p.filename));
    bajados.push(p.id);
  }

  // Los que no se pudieron leer se marcan antes de importar. Si se dejaran
  // en PENDING, volverían a intentarse en cada visita y el contador vería
  // para siempre un aviso de documentos nuevos que nunca bajan.
  for (const f of fallidos) {
    await supabase.rpc('ed_inbox_marcar', {
      p_ids: [f.id], p_status: 'ERROR', p_import_id: null, p_error: f.error,
    });
  }

  if (archivos.length === 0) {
    throw new Error('No se pudo leer ninguno de los documentos que llegaron.');
  }

  const resumen = await importarArchivos(archivos, onProgreso);

  await supabase.rpc('ed_inbox_marcar', {
    p_ids: bajados, p_status: 'IMPORTED', p_import_id: resumen.importId, p_error: null,
  });

  return { ...resumen, desdeCorreo: archivos.length };
}

export class BetaCerradaError extends Error {
  constructor(motivo: 'cerrada' | 'llena') {
    super(
      motivo === 'cerrada'
        ? 'El periodo de prueba terminó. Gracias por participar — te escribiremos con las novedades.'
        : 'La plataforma alcanzó su capacidad por hoy. Escríbenos y te damos acceso ampliado.',
    );
    this.name = 'BetaCerradaError';
  }
}

/**
 * Se acabó el cupo del mes.
 *
 * Va aparte de BetaCerradaError porque NO es lo mismo y no se resuelve igual:
 * aquello es un tope de la plataforma y esto es el plan que el contador
 * contrató. Lleva las cifras encima —plan, límite, usados, cuándo se repone y
 * qué plan sigue— para que la pantalla pueda decirle exactamente qué pasó y
 * qué puede hacer.
 *
 * Un «no se puede procesar» a secas deja a la persona sin saber si es un fallo
 * nuestro, un problema de su archivo o un límite suyo. Las tres se atienden de
 * forma distinta, y adivinar cuál es no es trabajo del contador.
 */
export class LimiteDelPlanError extends Error {
  constructor(public readonly cuota: EstadoCuota) {
    const limite = cuota.limite ?? 0;
    const renueva = cuota.renuevaEl
      ? new Date(cuota.renuevaEl).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
      : null;

    super(
      `Llegaste al límite de tu plan ${cuota.planNombre}: `
      + `${limite.toLocaleString('es-CO')} documentos al mes, y este mes ya procesaste ${cuota.usados.toLocaleString('es-CO')}.`
      + (renueva ? ` Tu cupo se repone el ${renueva}.` : '')
      + (cuota.siguiente
          ? ` Si necesitas más ahora, el plan ${cuota.siguiente.nombre} te da `
            + `${cuota.siguiente.limite === null ? 'documentos sin límite' : `${cuota.siguiente.limite.toLocaleString('es-CO')} al mes`}`
            + ` por $${cuota.siguiente.precio.toLocaleString('es-CO')} al mes.`
          : ''),
    );
    this.name = 'LimiteDelPlanError';
  }
}

/** Extrae los XML de lo que el usuario suelte: un .xml suelto o un .zip. */
async function extraerEntradas(archivo: File): Promise<EntradaZip[]> {
  if (/\.xml$/i.test(archivo.name)) {
    const contenido = await archivo.text();
    return [{ nombre: archivo.name, contenido, bytes: contenido.length }];
  }
  if (/\.zip$/i.test(archivo.name)) {
    return leerZipSeguro(await archivo.arrayBuffer()).entradas;
  }
  throw new ZipError(`${archivo.name} no es un XML ni un ZIP`, 'ZIP_ILEGIBLE');
}

export interface ArchivoRechazado { nombre: string; motivo: string }

/** Abre todos los archivos que soltó el contador, aislando los fallos.
 *
 *  Un ZIP corrupto, protegido con contrasena o sin XML dentro NO puede
 *  tumbar el lote entero: quien arrastra treinta comprimidos de la DIAN no
 *  tiene por que perder los veintinueve buenos por culpa de uno. Los que
 *  fallan se devuelven aparte para poder nombrarlos en pantalla. */
async function abrirTodos(archivos: File[]): Promise<{ entradas: EntradaZip[]; rechazados: ArchivoRechazado[] }> {
  const entradas: EntradaZip[] = [];
  const rechazados: ArchivoRechazado[] = [];

  for (const a of archivos) {
    try {
      const e = await extraerEntradas(a);
      if (e.length === 0) rechazados.push({ nombre: a.name, motivo: 'no trae ningún XML dentro' });
      else entradas.push(...e);
    } catch (err) {
      const z = err as ZipError;
      rechazados.push({
        nombre: a.name,
        motivo: z.code === 'SIN_XML'
          ? 'no trae ningún XML dentro'
          : z.code === 'ZIP_ILEGIBLE'
            ? 'no se pudo abrir (¿está dañado o tiene contraseña?)'
            : (z.message || 'no se pudo leer'),
      });
    }
  }
  return { entradas, rechazados };
}

/**
 * Procesa uno o varios archivos y guarda el resultado.
 *
 * El parseo ocurre en el navegador a propósito en esta etapa: no depende de
 * tiempos de ejecución de servidor, no cuesta invocaciones y permite ver el
 * avance documento a documento. Cuando el volumen lo pida, el mismo parser
 * se ejecuta en el worker sin cambiar una línea — por eso no importa nada
 * de la aplicación.
 */
export async function importarArchivos(
  archivos: File[],
  onProgreso: (e: EventoProgreso) => void,
): Promise<ResumenImportacion> {
  onProgreso({ fase: 'leyendo', total: 0, hechos: 0 });

  const { entradas, rechazados } = await abrirTodos(archivos);
  if (entradas.length === 0) {
    throw new Error(
      rechazados.length > 0
        ? `No pude leer ningún documento. ${rechazados[0].nombre}: ${rechazados[0].motivo}.`
        : 'No encontré ningún XML en lo que subiste.',
    );
  }

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error('Necesitas iniciar sesión para importar documentos.');

  // Se comprueba ANTES de crear la importación y de parsear nada: procesar
  // 5.000 documentos para luego decir "no cabían" sería tiempo perdido del
  // contador y trabajo pagado por nosotros.
  //
  // Tres barreras, en orden de gravedad: la prueba terminó, la plataforma
  // llegó a su tope global, o esta persona agotó su cupo. Las dos primeras
  // detienen; la tercera procesa hasta donde alcance.
  const [beta, cuota] = await Promise.all([estadoBeta(), estadoCuota()]);

  // Los topes de capacidad de la plataforma. Un plan de pago queda exento:
  // cobrarle a alguien y después decirle que no hay sitio no es defendible.
  if (!beta.exentoGlobal) {
    if (beta.cerrada) throw new BetaCerradaError('cerrada');
    if (beta.llena) throw new BetaCerradaError('llena');
  }

  // El límite del plan, que es otra cosa: se explica con nombre y cifras.
  if (!cuota.ilimitado && (cuota.restantes ?? 0) <= 0) {
    throw new LimiteDelPlanError(cuota);
  }

  const tope = cuota.ilimitado
    ? entradas.length
    : Math.min(entradas.length, cuota.restantes ?? entradas.length);

  const { data: imp, error: errImp } = await supabase
    .from('ed_imports')
    .insert({
      source: archivos.some((a) => /\.zip$/i.test(a.name)) ? 'zip' : 'xml',
      source_ref: archivos.map((a) => a.name).join(', ').slice(0, 500),
      status: 'RUNNING',
      phase: 'PARSING',
      total_found: entradas.length,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (errImp) throw new Error(`No se pudo crear la importación: ${errImp.message}`);

  const importId = imp.id as string;
  const resumen: ResumenImportacion = {
    importId, encontrados: entradas.length,
    procesados: 0, duplicados: 0, revision: 0, errores: 0, porTipo: {},
    // Cuántos quedaron fuera por cuota. No es un error: es información que
    // el contador necesita para saber que su carpeta no se procesó entera.
    sinProcesarPorCuota: Math.max(0, entradas.length - tope),
    rechazados,
  };

  onProgreso({ fase: 'procesando', total: tope, hechos: 0 });

  for (let i = 0; i < tope; i++) {
    const entrada = entradas[i];
    let evento: EventoProgreso['ultimo'];

    try {
      const t0 = performance.now();
      const r = parseDianXml(entrada.contenido);
      const ms = Math.round(performance.now() - t0);

      if (!r.documento) {
        resumen.errores++;
        await registrarFallo(importId, entrada.nombre, r.excepciones[0]?.codigo, r.excepciones[0]?.mensaje);
        evento = { nombre: entrada.nombre, estado: 'error', detalle: r.excepciones[0]?.mensaje };
      } else {
        const payload = mapearDocumento(r.documento, r.excepciones, {
          importId, parseMs: ms, validacionDian: r.validacionDian,
        });
        const sha = await sha256Hex(entrada.contenido);
        const guardado = await guardarDocumento(payload, sha, entrada, importId);

        if (guardado === 'duplicado') {
          resumen.duplicados++;
          evento = { nombre: entrada.nombre, estado: 'duplicado' };
        } else {
          resumen.procesados++;
          const tipo = payload.documento.doc_type;
          resumen.porTipo[tipo] = (resumen.porTipo[tipo] ?? 0) + 1;
          if (payload.documento.status === 'REVIEW_REQUIRED') {
            resumen.revision++;
            evento = { nombre: entrada.nombre, estado: 'revision', detalle: r.excepciones[0]?.mensaje };
          } else {
            evento = { nombre: entrada.nombre, estado: 'ok' };
          }
        }
      }
    } catch (e) {
      resumen.errores++;
      const msg = (e as Error).message;
      await registrarFallo(importId, entrada.nombre, 'ERROR_PROCESO', msg);
      evento = { nombre: entrada.nombre, estado: 'error', detalle: msg };
    }

    onProgreso({ fase: 'procesando', total: tope, hechos: i + 1, ultimo: evento });
  }

  await supabase
    .from('ed_imports')
    .update({
      status: resumen.errores > 0 || resumen.revision > 0 ? 'PARTIAL' : 'COMPLETED',
      phase: 'DONE',
      processed: resumen.procesados,
      duplicates: resumen.duplicados,
      review: resumen.revision,
      errors: resumen.errores,
      by_type: resumen.porTipo,
      finished_at: new Date().toISOString(),
    })
    .eq('id', importId);

  onProgreso({ fase: 'listo', total: tope, hechos: tope });
  return resumen;
}

async function registrarFallo(importId: string, nombre: string, code?: string, mensaje?: string) {
  const { error } = await supabase.from('ed_exceptions').insert({
    import_id: importId,
    code: code ?? 'ERROR',
    severity: 'error',
    message: `${nombre}: ${mensaje ?? 'no se pudo procesar'}`.slice(0, 800),
  });
  // Esta fila es el único rastro de un archivo que no se pudo procesar. Si
  // tampoco se guarda, el contador ve «28 documentos» cuando subió 30 y no
  // tiene forma de saber cuáles faltaron ni por qué.
  if (error) console.error('[dian] no se pudo registrar el fallo de', nombre, error);
}

/** Guarda documento + líneas + impuestos + excepciones + archivo original.
 *
 *  El duplicado NO se descarta en silencio: el índice único sobre el CUFE
 *  lo rechaza, se detecta por el código 23505 de Postgres y se devuelve
 *  como tal para que el contador vea que ocurrió. */
async function guardarDocumento(
  payload: PayloadDocumento,
  sha256: string,
  entrada: EntradaZip,
  importId: string,
): Promise<'guardado' | 'duplicado'> {
  const { data: doc, error } = await supabase
    .from('ed_documents')
    .insert(payload.documento)
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') return 'duplicado';
    throw new Error(error.message);
  }

  const documentId = doc.id as string;

  if (payload.lineas.length) {
    await supabase.from('ed_document_lines').insert(
      payload.lineas.map((l) => ({ ...l, document_id: documentId })),
    );
  }
  if (payload.impuestos.length) {
    await supabase.from('ed_document_taxes').insert(
      payload.impuestos.map((t) => ({ ...t, document_id: documentId })),
    );
  }
  if (payload.excepciones.length) {
    // El resultado SÍ se mira. Antes no, y por eso este fallo vivió oculto:
    // en supabase-js un INSERT rechazado no lanza, devuelve `{ error }`. Las
    // observaciones llevaban desde el primer día sin guardarse —la columna
    // owner_user_id no tenía DEFAULT auth.uid() como el resto de tablas, así
    // que RLS las rechazaba todas— y el documento quedaba marcado «Requiere
    // revisión» con la bandeja vacía. Un error que no se lee es un error que
    // no existe hasta que alguien lo sufre.
    const { error: errExc } = await supabase.from('ed_exceptions').insert(
      payload.excepciones.map((e) => ({ ...e, document_id: documentId, import_id: importId })),
    );
    if (errExc) {
      console.error('[dian] no se pudieron guardar las observaciones de', documentId, errExc);
      // El documento se conserva: perder la observación es malo, perder la
      // factura entera es peor. Pero se devuelve a PROCESSED para que no
      // quede marcado «requiere revisión» sin nada que enseñar — esa
      // contradicción es justo lo que desconcertaba al contador.
      await supabase.from('ed_documents').update({ status: 'PROCESSED' }).eq('id', documentId);
    }
  }
  if (payload.terceros.length) {
    // onConflict sobre (owner_user_id, nit): el mismo proveedor aparece en
    // cientos de facturas y debe quedar una sola vez.
    await supabase
      .from('ed_parties')
      .upsert(payload.terceros, { onConflict: 'owner_user_id,nit', ignoreDuplicates: true });
  }

  await supabase.from('ed_document_files').insert({
    document_id: documentId,
    import_id: importId,
    kind: 'attached_document',
    // En esta etapa el XML no se sube a Storage todavía: se guarda su huella
    // para deduplicar. La subida al bucket privado entra con el worker.
    storage_path: `pendiente/${sha256}.xml`,
    original_filename: entrada.nombre,
    sha256,
    byte_size: entrada.bytes,
  });

  return 'guardado';
}

// ── Consulta ──────────────────────────────────────────────────────────────

export interface FiltrosDocumentos {
  desde?: string;
  hasta?: string;
  tipo?: string;
  estado?: string;
  busqueda?: string;
  /** Página pedida, empezando en 1. */
  pagina?: number;
  porPagina?: number;
}

/** Cuántas filas trae una página. 50 llena la pantalla de un portátil sin
 *  obligar a bajar dos veces, y el mes típico de un contador cabe en 25
 *  páginas en vez de en una lista infinita. */
export const DOCS_POR_PAGINA = 50;

export interface PaginaDocumentos {
  filas: DocumentoListado[];
  /** Total que cumple el filtro, no el de la página. Es lo que permite decir
   *  «1 a 50 de 1.250» y saber cuántas páginas hay. */
  total: number;
}

/**
 * Antes esto traía como mucho 200 filas y no lo decía en ninguna parte: un
 * contador con 1.250 documentos en el mes veía 200 y daba por hecho que ésos
 * eran todos. El corte silencioso en una herramienta fiscal es peor que la
 * lentitud — se declara con las cifras que se ven.
 *
 * `count: 'exact'` cuesta un conteo por consulta. Es asumible porque la tabla
 * está filtrada por RLS al dueño y lleva índice por fecha; y sin el total no
 * hay forma honesta de dibujar el paginador.
 */
export async function listarDocumentos(f: FiltrosDocumentos = {}): Promise<PaginaDocumentos> {
  const porPagina = f.porPagina ?? DOCS_POR_PAGINA;
  const pagina = Math.max(1, f.pagina ?? 1);
  const desdeFila = (pagina - 1) * porPagina;

  let q = supabase
    .from('ed_documents')
    .select(
      'id,doc_type,full_number,issue_date,issuer_nit,issuer_name,line_total,total_iva,total_retenciones,total,status,cufe',
      { count: 'exact' },
    )
    .order('issue_date', { ascending: false })
    .range(desdeFila, desdeFila + porPagina - 1);

  if (f.desde) q = q.gte('issue_date', f.desde);
  if (f.hasta) q = q.lte('issue_date', f.hasta);
  if (f.tipo) q = q.eq('doc_type', f.tipo);
  if (f.estado) q = q.eq('status', f.estado);
  if (f.busqueda) {
    const s = f.busqueda.replace(/[%,()]/g, '');
    q = q.or(`full_number.ilike.%${s}%,issuer_name.ilike.%${s}%,issuer_nit.ilike.%${s}%`);
  }

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { filas: (data ?? []) as DocumentoListado[], total: count ?? 0 };
}

export interface TotalesPanel {
  documentos: number;
  revision: number;
  errores: number;
  compras: number;
  iva: number;
  retenciones: number;
}

export async function obtenerTotales(): Promise<TotalesPanel> {
  const { data, error } = await supabase
    .from('ed_documents')
    .select('line_total,total_iva,total_retenciones,status');
  if (error) throw new Error(error.message);

  const filas = (data ?? []) as Array<{ line_total: number; total_iva: number; total_retenciones: number; status: string }>;
  return {
    documentos: filas.length,
    revision: filas.filter((r) => r.status === 'REVIEW_REQUIRED').length,
    errores: filas.filter((r) => r.status === 'INVALID' || r.status === 'ERROR').length,
    compras: filas.reduce((a, r) => a + Number(r.line_total ?? 0), 0),
    iva: filas.reduce((a, r) => a + Number(r.total_iva ?? 0), 0),
    retenciones: filas.reduce((a, r) => a + Number(r.total_retenciones ?? 0), 0),
  };
}

/** Trae todo lo necesario para el reporte de 4 hojas.
 *
 *  Se piden las tres tablas por separado y se cruzan en memoria en vez de
 *  usar un select anidado: PostgREST devolvería un JSON con las líneas y los
 *  impuestos embebidos en cada documento, y para miles de documentos eso es
 *  un payload mucho mayor y más lento de recorrer que tres listas planas. */
export async function datosParaReporte(f: FiltrosDocumentos = {}) {
  let q = supabase.from('ed_documents').select('*').order('issue_date', { ascending: false });
  if (f.desde) q = q.gte('issue_date', f.desde);
  if (f.hasta) q = q.lte('issue_date', f.hasta);
  if (f.tipo) q = q.eq('doc_type', f.tipo);
  if (f.estado) q = q.eq('status', f.estado);

  const { data: docs, error } = await q;
  if (error) throw new Error(error.message);

  const ids = (docs ?? []).map((d: { id: string }) => d.id);
  if (ids.length === 0) return { documentos: [], lineas: [], impuestos: [] };

  // Se pide por lotes: una lista con miles de UUID en un solo `in` supera el
  // largo máximo de URL que acepta PostgREST.
  const lotes: string[][] = [];
  for (let i = 0; i < ids.length; i += 200) lotes.push(ids.slice(i, i + 200));

  const lineas: unknown[] = [];
  const impuestos: unknown[] = [];
  for (const lote of lotes) {
    const [l, t] = await Promise.all([
      supabase.from('ed_document_lines').select('*').in('document_id', lote),
      supabase.from('ed_document_taxes').select('*').in('document_id', lote),
    ]);
    if (l.error) throw new Error(l.error.message);
    if (t.error) throw new Error(t.error.message);
    lineas.push(...(l.data ?? []));
    impuestos.push(...(t.data ?? []));
  }

  return { documentos: docs ?? [], lineas, impuestos };
}

/** Resultado de cruzar una lista de CUFEs contra lo ya importado. */
export interface CruceCufes {
  total: number;
  invalidos: string[];
  repetidosEnLista: number;
  encontrados: DocumentoListado[];
  faltantes: string[];
}

/** Un CUFE/CUDE es SHA-384 en hexadecimal: 96 caracteres. Se valida el
 *  formato antes de consultar para no mandar basura a la base y, sobre
 *  todo, para poder decirle al contador exactamente cuáles pegó mal —
 *  copiar una columna de Excel arrastra espacios, saltos y celdas vacías. */
const CUFE_VALIDO = /^[0-9a-f]{96}$/i;

/** Cruza una lista pegada por el contador contra sus documentos.
 *
 *  Responde la pregunta que hoy resuelve a mano: de los documentos que la
 *  DIAN dice que tengo, ¿cuáles ya están cargados y cuáles me faltan? */
export async function cruzarCufes(texto: string): Promise<CruceCufes> {
  // Se acepta lo que salga de copiar una columna de Excel: separados por
  // salto de línea, coma, punto y coma, tabulación o espacios.
  const crudos = texto.split(/[\s,;]+/).map((c) => c.trim()).filter(Boolean);

  const invalidos: string[] = [];
  const vistos = new Set<string>();
  let repetidosEnLista = 0;

  for (const c of crudos) {
    if (!CUFE_VALIDO.test(c)) { invalidos.push(c); continue; }
    const k = c.toLowerCase();
    if (vistos.has(k)) { repetidosEnLista++; continue; }
    vistos.add(k);
  }

  const lista = [...vistos];
  const encontrados: DocumentoListado[] = [];

  // Por lotes: una lista con miles de CUFE de 96 caracteres en un solo `in`
  // supera con creces el largo máximo de URL que acepta PostgREST.
  for (let i = 0; i < lista.length; i += 100) {
    const lote = lista.slice(i, i + 100);
    const { data, error } = await supabase
      .from('ed_documents')
      .select('id,doc_type,full_number,issue_date,issuer_nit,issuer_name,line_total,total_iva,total_retenciones,total,status,cufe')
      .in('cufe', lote);
    if (error) throw new Error(error.message);
    encontrados.push(...((data ?? []) as DocumentoListado[]));
  }

  const hallados = new Set(encontrados.map((d) => (d.cufe ?? '').toLowerCase()));
  return {
    total: crudos.length,
    invalidos,
    repetidosEnLista,
    encontrados,
    faltantes: lista.filter((c) => !hallados.has(c)),
  };
}

/** Detalle completo para el panel lateral. */
export async function obtenerDocumento(id: string) {
  const [doc, lineas, impuestos, excepciones] = await Promise.all([
    supabase.from('ed_documents').select('*').eq('id', id).single(),
    supabase.from('ed_document_lines').select('*').eq('document_id', id).order('line_no'),
    supabase.from('ed_document_taxes').select('*').eq('document_id', id),
    supabase.from('ed_exceptions').select('*').eq('document_id', id),
  ]);
  if (doc.error) throw new Error(doc.error.message);
  return {
    documento: doc.data,
    lineas: lineas.data ?? [],
    impuestos: impuestos.data ?? [],
    excepciones: excepciones.data ?? [],
  };
}


// ── Opiniones de la beta ──────────────────────────────────────────────────

export interface Feedback {
  xml_manuales: string;
  clientes: string;
  precio: string;
  falta: string;
  sistema_contable: string;
}

export async function enviarFeedback(f: Feedback, email?: string): Promise<void> {
  const { error } = await supabase.from('ed_feedback').insert({ ...f, email: email ?? null });
  if (error) throw new Error(error.message);
}

/** Sólo devuelve filas si quien pregunta es el propietario: la política
 *  ed_feedback_admin es la que abre la lectura completa. Para cualquier
 *  otro usuario esto devuelve únicamente lo que él mismo escribió. */
export async function listarFeedback() {
  const { data, error } = await supabase
    .from('ed_feedback').select('*').order('created_at', { ascending: false }).limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
}


// ── Plantillas contables del contador ─────────────────────────────────────
//
// El contador sube su plantilla vacia (Siigo, Alegra, World Office, Helisa
// o la que use) y guardamos el archivo junto al emparejamiento de columnas.
// Los meses siguientes elige el perfil y descarga: no vuelve a configurar.

export interface PerfilPlantilla {
  id: string;
  slug: string;
  name: string;
  target: string;
  date_format: string;
  granularity: 'documento' | 'linea';
  sheet_path: string;
  sheet_name: string;
  header_row: number;
  template_filename: string;
  columns: unknown;
}

// El archivo va en base64 porque una plantilla vacia pesa poco (5-30 KB) y
// asi no hace falta administrar politicas de un bucket aparte para algo que
// siempre se lee junto con su fila. La conversion vive en el motor.
export { bytesABase64, base64ABytes } from '../../lib/dian/xlsx-relleno';

export async function listarPerfiles(): Promise<PerfilPlantilla[]> {
  const { data, error } = await supabase
    .from('ed_export_profiles')
    .select('id,slug,name,target,date_format,granularity,sheet_path,sheet_name,header_row,template_filename,columns')
    .not('template_b64', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PerfilPlantilla[];
}

export async function guardarPerfil(p: {
  nombre: string;
  programa: string;
  formatoFecha: string;
  granularidad: 'documento' | 'linea';
  rutaHoja: string;
  nombreHoja: string;
  filaEncabezados: number;
  nombreArchivo: string;
  plantillaB64: string;
  columnas: unknown;
}): Promise<void> {
  const slug = `${p.programa}-${p.nombre}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
  const { error } = await supabase.from('ed_export_profiles').upsert({
    slug,
    name: p.nombre,
    target: p.programa,
    date_format: p.formatoFecha,
    granularity: p.granularidad,
    sheet_path: p.rutaHoja,
    sheet_name: p.nombreHoja,
    header_row: p.filaEncabezados,
    template_filename: p.nombreArchivo,
    template_b64: p.plantillaB64,
    columns: p.columnas,
    file_format: 'xlsx',
  }, { onConflict: 'owner_user_id,slug' });
  if (error) throw new Error(error.message);
}

/** Trae el archivo original del perfil para rellenarlo. Se pide aparte del
 *  listado porque es lo unico pesado de la fila. */
export async function obtenerPlantilla(perfilId: string): Promise<Uint8Array> {
  const { data, error } = await supabase
    .from('ed_export_profiles').select('template_b64').eq('id', perfilId).single();
  if (error) throw new Error(error.message);
  const b64 = (data as { template_b64: string | null }).template_b64;
  if (!b64) throw new Error('Ese perfil no tiene plantilla guardada.');
  return base64ABytes(b64);
}

export async function borrarPerfil(perfilId: string): Promise<void> {
  const { error } = await supabase.from('ed_export_profiles').delete().eq('id', perfilId);
  if (error) throw new Error(error.message);
}


// ── Excepciones y limpieza ────────────────────────────────────────────────

export interface ExcepcionListada {
  id: number;
  document_id: string | null;
  code: string;
  severity: string;
  message: string;
  field: string | null;
  expected: string | null;
  found: string | null;
  created_at: string;
  documento: {
    full_number: string | null;
    doc_type: string;
    issue_date: string | null;
    issuer_name: string | null;
    issuer_nit: string | null;
    total: number;
    status: string;
  } | null;
}

/** Las que el contador todavia tiene que mirar. Es su lista de tareas: si
 *  no se vacia a medida que trabaja, deja de servir. */
export async function listarExcepciones(incluirResueltas = false): Promise<ExcepcionListada[]> {
  let q = supabase
    .from('ed_exceptions')
    .select('id,document_id,code,severity,message,field,expected,found,created_at,documento:ed_documents(full_number,doc_type,issue_date,issuer_name,issuer_nit,total,status)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (!incluirResueltas) q = q.is('resolved_at', null);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ExcepcionListada[];
}

export async function resolverExcepcion(id: number, nota?: string): Promise<void> {
  const { error } = await supabase.rpc('ed_resolver_excepcion', { p_id: id, p_nota: nota ?? null });
  if (error) throw new Error(error.message);
}

/** Borra documentos propios. Sin ids, borra todos.
 *
 *  Las lineas, impuestos, archivos y excepciones caen por CASCADE. Las
 *  importaciones NO: son el historico que sostiene la cuota, y ademas el
 *  contador debe seguir viendo que ese dia importo 5.284 documentos aunque
 *  luego los haya limpiado. */
export async function borrarDocumentos(ids?: string[]): Promise<number> {
  const { data, error } = await supabase.rpc('ed_borrar_documentos', { p_ids: ids ?? null });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}
