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
  restantesPersona: number;
  restantesGlobal: number;
}

export async function estadoBeta(): Promise<EstadoBeta> {
  const { data, error } = await supabase.rpc('ed_beta_estado');
  if (error) throw new Error(error.message);
  const d = (data ?? {}) as Record<string, unknown>;

  const limitePersona = Number(d.limite_persona ?? 100);
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
    restantesPersona: Math.max(0, limitePersona - usadosPersona),
    restantesGlobal: Math.max(0, limiteGlobal - usadosGlobal),
  };
}

/** Sólo el propietario. El guardia real está dentro de la función SQL. */
export async function configurarBeta(clave: string, valor: string): Promise<void> {
  const { error } = await supabase.rpc('ed_beta_configurar', { p_clave: clave, p_valor: valor });
  if (error) throw new Error(error.message);
}

export class BetaCerradaError extends Error {
  constructor(motivo: 'cerrada' | 'llena' | 'cupo') {
    super(
      motivo === 'cerrada'
        ? 'El periodo de prueba terminó. Gracias por participar — te escribiremos con las novedades.'
        : motivo === 'llena'
          ? 'La prueba alcanzó su capacidad. Escríbenos y te damos acceso ampliado.'
          : 'Llegaste a tu cupo de documentos de la prueba. Escríbenos si necesitas procesar más.',
    );
    this.name = 'BetaCerradaError';
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

  const entradas: EntradaZip[] = [];
  for (const a of archivos) entradas.push(...(await extraerEntradas(a)));

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
  const beta = await estadoBeta();
  if (!beta.ilimitado) {
    if (beta.cerrada) throw new BetaCerradaError('cerrada');
    if (beta.llena) throw new BetaCerradaError('llena');
    if (beta.restantesPersona <= 0) throw new BetaCerradaError('cupo');
  }
  const tope = beta.ilimitado
    ? entradas.length
    : Math.min(entradas.length, beta.restantesPersona, beta.restantesGlobal);

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
  await supabase.from('ed_exceptions').insert({
    import_id: importId,
    code: code ?? 'ERROR',
    severity: 'error',
    message: `${nombre}: ${mensaje ?? 'no se pudo procesar'}`.slice(0, 800),
  });
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
    await supabase.from('ed_exceptions').insert(
      payload.excepciones.map((e) => ({ ...e, document_id: documentId, import_id: importId })),
    );
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
  limite?: number;
}

export async function listarDocumentos(f: FiltrosDocumentos = {}): Promise<DocumentoListado[]> {
  let q = supabase
    .from('ed_documents')
    .select('id,doc_type,full_number,issue_date,issuer_nit,issuer_name,line_total,total_iva,total_retenciones,total,status,cufe')
    .order('issue_date', { ascending: false })
    .limit(f.limite ?? 200);

  if (f.desde) q = q.gte('issue_date', f.desde);
  if (f.hasta) q = q.lte('issue_date', f.hasta);
  if (f.tipo) q = q.eq('doc_type', f.tipo);
  if (f.estado) q = q.eq('status', f.estado);
  if (f.busqueda) {
    const s = f.busqueda.replace(/[%,()]/g, '');
    q = q.or(`full_number.ilike.%${s}%,issuer_name.ilike.%${s}%,issuer_nit.ilike.%${s}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as DocumentoListado[];
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
