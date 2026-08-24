/**
 * Abonos (installment payments) attached to a wedding-planner
 * sign_transaction — see supabase/migrations/20260823150000_add_wedding_planner_installments.sql
 * for the schema and the security model.
 *
 * `publicSupabase` (no session) for anything either party can do just by
 * holding the /sign/:id link — list, and the client's own upload — matching
 * how sign-transaction-page.tsx already treats that link as the
 * credential. `supabase` (carries the logged-in session) ONLY for the
 * planner's accept/reject call, because `review_document_installment`
 * checks `auth.uid()` server-side — using the session-less client there
 * would always fail with "Access denied", not silently succeed, but it's
 * worth being explicit about why the two clients are split this way.
 */
import { supabase, publicSupabase } from '../../lib/supabase';

export type EstadoAbono = 'pendiente_revision' | 'aceptado' | 'rechazado';

export interface DocumentInstallment {
  id: string;
  transaction_id: string;
  numero: number;
  descripcion: string | null;
  monto: number;
  moneda: string;
  estado: EstadoAbono;
  comprobante_cliente_path: string | null;
  comprobante_cliente_nombre: string | null;
  subido_por_cliente_en: string | null;
  comprobante_planner_path: string | null;
  comprobante_planner_nombre: string | null;
  motivo_rechazo: string | null;
  revisado_en: string | null;
  creado_en: string;
}

const BUCKET = 'tx-evidence';

/** Sube un comprobante (foto o PDF de la transferencia/consignación) y
 *  devuelve la ruta dentro del bucket — nunca la URL pública, porque el
 *  bucket puede no ser público y el llamador ya sabe pedir una URL firmada
 *  si la necesita (mismo patrón que signatureService.getSignedUrlFallback). */
export async function subirComprobante(
  transactionId: string,
  installmentId: string,
  quien: 'cliente' | 'planner',
  archivo: File,
): Promise<{ path: string; nombre: string }> {
  const extension = archivo.name.split('.').pop() || 'bin';
  const path = `installments/${transactionId}/${installmentId}_${quien}_${Date.now()}.${extension}`;
  const { error } = await publicSupabase.storage
    .from(BUCKET)
    .upload(path, archivo, { contentType: archivo.type || 'application/octet-stream', upsert: false });
  if (error) throw new Error(`subirComprobante: ${error.message}`);
  return { path, nombre: archivo.name };
}

export async function getComprobanteUrl(path: string): Promise<string | null> {
  const { data, error } = await publicSupabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function listarAbonos(transactionId: string): Promise<DocumentInstallment[]> {
  const { data, error } = await publicSupabase.rpc('list_document_installments', { p_transaction_id: transactionId });
  if (error) throw new Error(`listarAbonos: ${error.message}`);
  return (data as DocumentInstallment[]) ?? [];
}

/**
 * Registra un abono con el comprobante YA subido (llamar `subirComprobante`
 * primero con un id provisional, o subir después de crear — aquí se sube
 * DESPUÉS porque el path incluye el id real del abono para no chocar entre
 * dos comprobantes del mismo intento).
 */
export async function crearAbono(params: {
  transactionId: string;
  descripcion: string;
  monto: number;
  moneda: string;
}): Promise<DocumentInstallment> {
  const { data, error } = await publicSupabase.rpc('create_document_installment', {
    p_transaction_id: params.transactionId,
    p_descripcion: params.descripcion || null,
    p_monto: params.monto,
    p_moneda: params.moneda,
    p_comprobante_path: null,
    p_comprobante_nombre: null,
  });
  if (error) throw new Error(`crearAbono: ${error.message}`);
  const fila = Array.isArray(data) ? data[0] : data;
  return fila as DocumentInstallment;
}

/** Adjunta (o reemplaza) el comprobante del CLIENTE a un abono ya creado —
 *  separado de `crearAbono` porque el nombre del archivo en Storage incluye
 *  el id real del abono, que sólo existe una vez creado. */
export async function adjuntarComprobanteCliente(
  installmentId: string,
  transactionId: string,
  archivo: File,
): Promise<void> {
  const { path, nombre } = await subirComprobante(transactionId, installmentId, 'cliente', archivo);
  // Va por RPC (attach_client_installment_proof), no por un `.update()`
  // directo — la tabla no tiene política pública de UPDATE a propósito (ver
  // migración): todo pasa por funciones SECURITY DEFINER.
  const { error } = await publicSupabase.rpc('attach_client_installment_proof', {
    p_installment_id: installmentId,
    p_comprobante_path: path,
    p_comprobante_nombre: nombre,
  });
  if (error) throw new Error(`adjuntarComprobanteCliente: ${error.message}`);
}

export async function borrarAbonoPendiente(installmentId: string): Promise<boolean> {
  const { data, error } = await publicSupabase.rpc('delete_pending_installment', { p_installment_id: installmentId });
  if (error) throw new Error(`borrarAbonoPendiente: ${error.message}`);
  return Boolean(data);
}

/** Sólo la planner autenticada como creadora de la transacción puede
 *  llamar esto — usa el cliente CON sesión a propósito (ver comentario del
 *  archivo). `archivoPropio` es opcional: la planner puede aceptar sin
 *  adjuntar nada, o adjuntar su propio recibo/comprobante. */
export async function revisarAbono(params: {
  installmentId: string;
  transactionId: string;
  aceptar: boolean;
  motivoRechazo?: string;
  archivoPropio?: File | null;
}): Promise<DocumentInstallment> {
  let path: string | null = null;
  let nombre: string | null = null;
  if (params.archivoPropio) {
    const subido = await subirComprobante(params.transactionId, params.installmentId, 'planner', params.archivoPropio);
    path = subido.path;
    nombre = subido.nombre;
  }
  const { data, error } = await supabase.rpc('review_document_installment', {
    p_installment_id: params.installmentId,
    p_aceptar: params.aceptar,
    p_comprobante_planner_path: path,
    p_comprobante_planner_nombre: nombre,
    p_motivo_rechazo: params.aceptar ? null : (params.motivoRechazo?.trim() || null),
  });
  if (error) throw new Error(`revisarAbono: ${error.message}`);
  const fila = Array.isArray(data) ? data[0] : data;
  return fila as DocumentInstallment;
}
