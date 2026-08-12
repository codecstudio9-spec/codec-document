/**
 * Documentos obsequiados: el administrador se los regala a alguien por su
 * correo, y esa persona los ve como capacidad extra cuando su cupo gratuito
 * de 72 horas ya se agotó.
 *
 * El orden —primero el cupo, después el regalo— vive en la base de datos
 * (`try_consume_document_72h`, migración 20260812130000). Aquí no hay lógica
 * de consumo: sólo consulta y aviso.
 */
import { supabase } from '../../lib/supabase';

export interface DocumentGift {
  id: string;
  quantity: number;
  remaining: number;
  message: string | null;
  createdAt: string;
}

export interface AdminGiftRow extends DocumentGift {
  email: string;
  notifiedAt: string | null;
}

// ─── Administración ─────────────────────────────────────────────────────

export async function giftDocuments(email: string, quantity: number, message?: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_gift_documents', {
    p_email: email,
    p_quantity: quantity,
    p_message: message ?? null,
  });
  if (error) throw new Error(error.message);
  const fila = Array.isArray(data) ? data[0] : data;
  return String(fila?.email ?? email);
}

export async function listGiftedDocuments(limit = 50): Promise<AdminGiftRow[]> {
  const { data, error } = await supabase.rpc('admin_list_document_gifts', { p_limit: limit });
  if (error) throw new Error(error.message);
  return ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    email: r.email,
    quantity: Number(r.quantity ?? 0),
    remaining: Number(r.remaining ?? 0),
    message: r.message ?? null,
    createdAt: r.created_at,
    notifiedAt: r.notified_at ?? null,
  }));
}

// ─── Lado de quien lo recibe ────────────────────────────────────────────

export async function getUnnotifiedGifts(): Promise<DocumentGift[]> {
  const { data, error } = await supabase.rpc('my_unnotified_document_gifts');
  if (error) return [];
  return ((data as any[]) ?? []).map((r) => ({
    id: r.id,
    quantity: Number(r.quantity ?? 0),
    remaining: Number(r.remaining ?? 0),
    message: r.message ?? null,
    createdAt: r.created_at,
  }));
}

export async function markGiftsNotified(): Promise<void> {
  try {
    await supabase.rpc('mark_document_gifts_notified');
  } catch { /* el aviso volverá a salir la próxima vez; no rompe nada */ }
}

export async function getGiftBalance(): Promise<number> {
  const { data, error } = await supabase.rpc('my_document_gift_balance');
  if (error) return 0;
  return Number(data ?? 0);
}
