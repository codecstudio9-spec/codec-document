import { supabase } from '../../lib/supabase';
import type { PlanKey } from '../config/paypal';

const PERIOD_MS: Record<PlanKey, number> = {
  monthly:    30  * 24 * 60 * 60 * 1000,
  semiannual: 183 * 24 * 60 * 60 * 1000,
  annual:     365 * 24 * 60 * 60 * 1000,
};

export async function activatePlan(
  userId: string,
  planKey: PlanKey,
  paypalSubscriptionId: string,
): Promise<void> {
  const expiresAt = new Date(Date.now() + PERIOD_MS[planKey]).toISOString();

  const { error } = await supabase
    .from('users')
    .update({
      plan_status:            'active',
      plan_type:              planKey,
      paypal_subscription_id: paypalSubscriptionId,
      plan_expires_at:        expiresAt,
      updated_at:             new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[activatePlan] Supabase error:', error.message);
    throw error;
  }
}
