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
