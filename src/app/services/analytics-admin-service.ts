/**
 * Analytics-only admin grants — lets the primary admin give specific
 * emails read access to /dashboard/admin/analytics without full admin
 * access. Every call goes through SECURITY DEFINER RPCs that re-check
 * is_admin_user() server-side (see
 * supabase_add_analytics_admin_grants_migration.sql) — this file never
 * trusts the client for who's allowed to grant/revoke.
 */
import { supabase } from '../../lib/supabase';

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
