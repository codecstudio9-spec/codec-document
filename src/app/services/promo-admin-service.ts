/**
 * Admin-only promo code usage lookup — the admin types the code they
 * want to check (never hardcoded in a committed file, since a code with
 * no redemption limit is exactly the kind of value that shouldn't live
 * in plain text in a repo that could go public — see the note at the
 * end of supabase_add_coupon_full_access_migration.sql).
 */
import { supabase } from '../../lib/supabase';

export interface PromoCodeUsage {
  redeemedAt: string;
  userEmail: string;
  ipAddress: string | null;
  product: string;
}

export async function getPromoCodeUsage(code: string): Promise<PromoCodeUsage[]> {
  const { data, error } = await supabase.rpc('get_promo_code_usage', { p_code: code });
  if (error) throw new Error(error.message);
  if (!data) return [];
  return (data as any[]).map((r) => ({
    redeemedAt: r.redeemed_at,
    userEmail: r.user_email,
    ipAddress: r.ip_address,
    product: r.product,
  }));
}

// ─── Alta y gestión de cupones ──────────────────────────────────────────
//
// Todo pasa por funciones SECURITY DEFINER que comprueban is_admin_user().
// `promo_codes` tiene RLS activo y ninguna política, así que ni siquiera
// leerla es posible sin pasar por ahí — eso es lo que impide que nadie pueda
// enumerar los códigos válidos desde el navegador.

export interface PromoCode {
  code: string;
  product: string;
  discountPct: number;
  active: boolean;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  unlimitedPerUser: boolean;
  label: string | null;
  createdAt: string;
  expired: boolean;
}

/** Las duraciones que se ofrecen, en minutos. `null` = sin caducidad. */
export const DURACIONES: Array<{ minutos: number | null; es: string; en: string }> = [
  { minutos: 30, es: '30 minutos', en: '30 minutes' },
  { minutos: 60, es: '1 hora', en: '1 hour' },
  { minutos: 60 * 3, es: '3 horas', en: '3 hours' },
  { minutos: 60 * 24, es: '24 horas', en: '24 hours' },
  { minutos: 60 * 48, es: '2 días', en: '2 days' },
  { minutos: 60 * 24 * 7, es: '7 días', en: '7 days' },
  { minutos: 60 * 24 * 30, es: '30 días', en: '30 days' },
  { minutos: null, es: 'Sin caducidad', en: 'No expiry' },
];

const mapa = (r: any): PromoCode => ({
  code: r.code,
  product: r.product,
  discountPct: Number(r.discount_pct ?? 100),
  active: Boolean(r.active),
  expiresAt: r.expires_at ?? null,
  maxRedemptions: r.max_redemptions ?? null,
  redemptionCount: Number(r.redemption_count ?? 0),
  unlimitedPerUser: Boolean(r.unlimited_per_user),
  label: r.label ?? null,
  createdAt: r.created_at,
  expired: Boolean(r.expired),
});

export async function listPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await supabase.rpc('admin_list_promo_codes');
  if (error) throw new Error(error.message);
  return ((data as any[]) ?? []).map(mapa);
}

export async function createPromoCode(input: {
  code: string;
  product: string;
  discountPct: number;
  /** Minutos de vigencia. `null` = no caduca. La fecha la calcula el
   *  servidor con su propio reloj, no el navegador. */
  durationMinutes: number | null;
  maxRedemptions: number | null;
  label?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('admin_create_promo_code', {
    p_code: input.code,
    p_product: input.product,
    p_discount_pct: input.discountPct,
    p_duration_minutes: input.durationMinutes,
    p_max_redemptions: input.maxRedemptions,
    p_label: input.label ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function setPromoCodeActive(code: string, active: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_promo_code_active', { p_code: code, p_active: active });
  if (error) throw new Error(error.message);
}

// ─── Planes de PayPal con precio rebajado ───────────────────────────────
//
// Un descuento parcial sobre una SUSCRIPCIÓN no se puede aplicar cambiando
// una cifra: el importe vive dentro del Billing Plan de PayPal. Hace falta un
// plan aparte con el precio ya rebajado, y a eso suscribir a la persona.
//
// Los tres productos de suscripción son los únicos que lo necesitan; un pago
// único lleva el importe en la propia orden.
export const PRODUCTOS_DE_SUSCRIPCION = ['sub_monthly', 'sub_semiannual', 'sub_annual'];

export interface PlanRebajado {
  product: string;
  discountPct: number;
  planId: string;
  amount: number;
}

/** Crea el plan en PayPal (o devuelve el que ya existiera para esa
 *  combinación producto+porcentaje: los planes de PayPal no se pueden
 *  borrar, sólo desactivar, así que no se crean por duplicado). */
export async function crearPlanRebajado(product: string, discountPct: number): Promise<{ planId: string; amount: number; reused: boolean }> {
  const { data, error } = await supabase.functions.invoke('paypal-discount-plan', {
    body: { product, discountPct },
  });
  if (error) {
    const detalle = (data as { error?: string } | null)?.error;
    throw new Error(detalle || error.message || 'No se pudo crear el plan en PayPal.');
  }
  if (!data?.planId) throw new Error(data?.error || 'PayPal no devolvió un plan.');
  return { planId: String(data.planId), amount: Number(data.amount), reused: Boolean(data.reused) };
}

export async function listarPlanesRebajados(): Promise<PlanRebajado[]> {
  const { data, error } = await supabase.rpc('admin_list_discount_plans');
  if (error) return [];
  return ((data as any[]) ?? []).map((r) => ({
    product: r.product,
    discountPct: Number(r.discount_pct),
    planId: r.plan_id,
    amount: Number(r.amount),
  }));
}
