/**
 * Documentos de seguimiento adjuntos a un contrato de wedding-planner ya
 * firmado — distinto de los abonos (document-installments-service.ts, que
 * exigen un monto en dinero): esto es cualquier archivo de apoyo que
 * cualquiera de las dos partes quiera dejar sobre esa transacción —una
 * captura de pantalla, un comprobante de pago, una foto de una página del
 * contrato firmado en papel, etc. Ver
 * supabase/migrations/20260825120000_add_document_evidence.sql para el
 * esquema y el modelo de acceso (el mismo de document_installments: quien
 * tiene el enlace de la transacción puede listar y subir, sin login).
 */
import { publicSupabase } from '../../lib/supabase';

export type TipoEvidencia = 'comprobante_pago' | 'captura_pantalla' | 'pagina_contrato' | 'otro';

export interface DocumentEvidence {
  id: string;
  transaction_id: string;
  tipo: TipoEvidencia;
  descripcion: string | null;
  archivo_path: string;
  archivo_nombre: string;
  subido_por: 'planner' | 'cliente';
  creado_en: string;
}

const BUCKET = 'tx-evidence';

/** Sube el archivo y devuelve su RUTA dentro del bucket — nunca una URL
 *  pública, igual que subirComprobante en document-installments-service.ts. */
export async function subirArchivoEvidencia(
  transactionId: string,
  tipo: TipoEvidencia,
  archivo: File,
): Promise<{ path: string; nombre: string }> {
  const extension = archivo.name.split('.').pop() || 'bin';
  const path = `evidence/${transactionId}/${Date.now()}_${tipo}.${extension}`;
  const { error } = await publicSupabase.storage
    .from(BUCKET)
    .upload(path, archivo, { contentType: archivo.type || 'application/octet-stream', upsert: false });
  if (error) throw new Error(`subirArchivoEvidencia: ${error.message}`);
  return { path, nombre: archivo.name };
}

export async function getEvidenciaUrl(path: string): Promise<string | null> {
  const { data, error } = await publicSupabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function listarEvidencias(transactionId: string): Promise<DocumentEvidence[]> {
  const { data, error } = await publicSupabase.rpc('list_document_evidence', { p_transaction_id: transactionId });
  if (error) throw new Error(`listarEvidencias: ${error.message}`);
  return (data as DocumentEvidence[]) ?? [];
}

export async function crearEvidencia(params: {
  transactionId: string;
  tipo: TipoEvidencia;
  descripcion: string;
  archivo: File;
  subidoPor: 'planner' | 'cliente';
}): Promise<DocumentEvidence> {
  const { path, nombre } = await subirArchivoEvidencia(params.transactionId, params.tipo, params.archivo);
  const { data, error } = await publicSupabase.rpc('create_document_evidence', {
    p_transaction_id: params.transactionId,
    p_tipo: params.tipo,
    p_descripcion: params.descripcion || null,
    p_archivo_path: path,
    p_archivo_nombre: nombre,
    p_subido_por: params.subidoPor,
  });
  if (error) throw new Error(`crearEvidencia: ${error.message}`);
  const fila = Array.isArray(data) ? data[0] : data;
  return fila as DocumentEvidence;
}

export async function borrarEvidencia(evidenceId: string): Promise<boolean> {
  const { data, error } = await publicSupabase.rpc('delete_document_evidence', { p_evidence_id: evidenceId });
  if (error) throw new Error(`borrarEvidencia: ${error.message}`);
  return Boolean(data);
}
