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

export interface ResumenImportacion {
  importId: string;
  encontrados: number;
  procesados: number;
  duplicados: number;
  revision: number;
  errores: number;
  porTipo: Record<string, number>;
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
  };

  onProgreso({ fase: 'procesando', total: entradas.length, hechos: 0 });

  for (let i = 0; i < entradas.length; i++) {
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

    onProgreso({ fase: 'procesando', total: entradas.length, hechos: i + 1, ultimo: evento });
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

  onProgreso({ fase: 'listo', total: entradas.length, hechos: entradas.length });
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
