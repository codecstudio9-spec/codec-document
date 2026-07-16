import { supabase } from '../../lib/supabase';
import { isActiveTxStatus, type SignTransaction } from './sign-transaction-service';

/**
 * Data for the mobile app-shell screens — all real queries against tables
 * that already exist, no invented numbers. Kept separate from
 * documents-service.ts / sign-transaction-service.ts because this file is
 * specifically about aggregating across them for the dashboard, not a new
 * source of truth for any one table.
 */

export interface DashboardStats {
  documentsCreated: number;
  pending: number;
  signed: number;
}

/** sign_transactions the CURRENT user created (creator_id = own id) — no
 * existing function lists these; RLS policy tx_select_own already permits
 * a direct table read for the authenticated owner, so no new RPC needed. */
export async function fetchMySignTransactions(userId: string): Promise<SignTransaction[]> {
  const { data, error } = await supabase
    .from('sign_transactions')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchMySignTransactions failed:', error); return []; }
  return (data as SignTransaction[]) ?? [];
}

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const [userDocsRes, docsRes, txs] = await Promise.all([
    supabase.from('user_documents').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('documents').select('id, status', { count: 'exact' }).eq('user_id', userId),
    fetchMySignTransactions(userId),
  ]);

  const userDocsCount = userDocsRes.count ?? 0;
  const docsRows = (docsRes.data as Array<{ id: string; status: string | null }>) ?? [];
  const docsCount = docsRes.count ?? docsRows.length;

  const txPending = txs.filter((t) => isActiveTxStatus(t.status)).length;
  const docsPending = docsRows.filter((d) => d.status && d.status !== 'completed').length;

  const txSigned = txs.filter((t) => t.status === 'completed').length;
  const docsSigned = docsRows.filter((d) => d.status === 'completed').length;

  return {
    documentsCreated: userDocsCount + docsCount + txs.length,
    pending: txPending + docsPending,
    signed: txSigned + docsSigned,
  };
}

export interface UserPlanInfo {
  planStatus: string | null;
  planType: string | null;
  planExpiresAt: string | null;
}

/** auth-context.tsx deliberately translates these into unlimitedActive/
 * subscriptionActive booleans and never exposes the raw values — the
 * Profile screen needs to actually show them, so this reads the users
 * row directly. Read-only; the table's plan columns are trigger-protected
 * against client writes regardless. */
export async function fetchUserPlanInfo(userId: string): Promise<UserPlanInfo> {
  const { data, error } = await supabase
    .from('users')
    .select('plan_status, plan_type, plan_expires_at')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return { planStatus: null, planType: null, planExpiresAt: null };
  return {
    planStatus: (data as any).plan_status ?? null,
    planType: (data as any).plan_type ?? null,
    planExpiresAt: (data as any).plan_expires_at ?? null,
  };
}
