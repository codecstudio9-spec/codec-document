/**
 * Analytics-only admin grants — lets the primary admin give specific
 * emails read access to /dashboard/admin/analytics without full admin
 * access. Every call goes through SECURITY DEFINER RPCs that re-check
 * is_admin_user() server-side (see
 * supabase_add_analytics_admin_grants_migration.sql) — this file never
 * trusts the client for who's allowed to grant/revoke.
 */
import { supabase } from '../../lib/supabase';

// ─── Regalar meses de plan ──────────────────────────────────────────────
//
// Distinto de un bono: un bono es anónimo y lo canjea quien lo tenga; esto va
// dirigido a una persona por su correo y se activa solo, sin que ella escriba
// nada. Es la cortesía para un cliente concreto, no una campaña.

export interface PlanGift {
  id: string;
  email: string;
  months: number;
  expiresAt: string;
  note: string | null;
  createdAt: string;
}

/** Si esa persona ya tiene plan, el tiempo se SUMA a lo que le quede: un
 *  regalo nunca puede dejar a nadie peor de lo que estaba. */
export async function grantFreeMonths(email: string, months = 1, note?: string): Promise<{ email: string; expiresAt: string }> {
  const { data, error } = await supabase.rpc('admin_grant_free_month', {
    p_email: email, p_months: months, p_note: note ?? null,
  });
  if (error) throw new Error(error.message);
  const fila = Array.isArray(data) ? data[0] : data;
  return { email: String(fila?.email ?? email), expiresAt: String(fila?.expires_at ?? '') };
}

export async function listPlanGifts(limit = 50): Promise<PlanGift[]> {
  const { data, error } = await supabase.rpc('admin_list_plan_gifts', { p_limit: limit });
  if (error) return [];
  return ((data as any[]) ?? []).map((r) => ({
    id: r.id, email: r.email, months: Number(r.months ?? 0),
    expiresAt: r.expires_at, note: r.note ?? null, createdAt: r.created_at,
  }));
}

export interface AnalyticsAdminGrant {
  id: string;
  email: string;
  granted_at: string;
  granted_by: string | null;
}

/** Whether the CURRENT signed-in user (super admin OR a granted email)
 * may view the analytics page. Fails closed on any error. */
export async function checkIsAnalyticsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_analytics_admin');
  if (error) return false;
  return Boolean(data);
}

export async function listAnalyticsAdmins(): Promise<AnalyticsAdminGrant[]> {
  const { data, error } = await supabase.rpc('list_analytics_admins');
  if (error) throw new Error(error.message);
  return (data as AnalyticsAdminGrant[]) ?? [];
}

export async function grantAnalyticsAccess(email: string): Promise<void> {
  const { error } = await supabase.rpc('grant_analytics_access', { p_email: email });
  if (error) throw new Error(error.message);
}

export async function revokeAnalyticsAccess(email: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_analytics_access', { p_email: email });
  if (error) throw new Error(error.message);
}
