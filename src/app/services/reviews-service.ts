/**
 * Reseñas reales de clientes verificados. Ver
 * supabase/migrations/20260828120000_add_reviews.sql para las reglas
 * completas: solo puede reseñar quien ya generó un documento real
 * (verificado server-side en submit_review, no en el cliente), y ninguna
 * reseña es pública hasta que el admin la aprueba con moderate_review().
 */
import { supabase } from '../../lib/supabase';

export interface PublicReview {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
}

export interface AdminReview extends PublicReview {
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote: string | null;
  reviewedAt: string | null;
}

export interface ReviewsSummary {
  avgRating: number;
  reviewCount: number;
}

function mapRow(row: any): AdminReview {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    rating: row.rating,
    body: row.body,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}

/** Solo reseñas aprobadas — lo que se muestra públicamente en la landing. */
export async function getApprovedReviews(limit = 20): Promise<PublicReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, author_name, rating, body, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    authorName: row.author_name,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
  }));
}

/** Promedio + conteo real de reseñas aprobadas. count=0 -> no mostrar nada
 * inventado, ni en la UI ni en structured-data.tsx. */
export async function getReviewsSummary(): Promise<ReviewsSummary> {
  const { data, error } = await supabase.rpc('get_reviews_summary');
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    avgRating: Number(row?.avg_rating ?? 0),
    reviewCount: Number(row?.review_count ?? 0),
  };
}

/** La propia reseña del usuario logueado, si ya envió una (aprobada o no). */
export async function getMyReview(): Promise<AdminReview | null> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

/** Lanza si el usuario no está logueado o no ha usado el producto todavía
 * (submit_review lo valida server-side — este mensaje es el que Supabase
 * devuelve). */
export async function submitReview(rating: number, body: string, authorName: string): Promise<void> {
  const { error } = await supabase.rpc('submit_review', {
    p_rating: rating,
    p_body: body,
    p_author_name: authorName,
  });
  if (error) throw new Error(error.message);
}

// ─── Administración (solo admin real, ver moderate_review/list_reviews_for_admin) ───

export async function listReviewsForAdmin(): Promise<AdminReview[]> {
  const { data, error } = await supabase.rpc('list_reviews_for_admin');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function moderateReview(reviewId: string, approve: boolean, note?: string): Promise<void> {
  const { error } = await supabase.rpc('moderate_review', {
    p_review_id: reviewId,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
}
