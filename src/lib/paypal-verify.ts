import { supabase } from './supabase';

export type PaypalProduct =
  | 'doc_single'
  | 'doc_bundle'
  | 'sig_single'
  | 'sig_monthly'
  | 'sub_monthly'
  | 'sub_semiannual'
  | 'sub_annual'
  | 'full_access';

/**
 * Calls the `paypal-verify` Supabase Edge Function, which confirms the
 * order with PayPal's REST API (real payment, correct amount, not reused)
 * and performs the actual grant (credit / plan) server-side before
 * returning. Never trust a client-side `actions.order.capture()` result
 * alone — that only proves the browser thinks it succeeded, not that a
 * real payment for the right amount happened.
 */
export async function verifyPaypalOrder(params: {
  orderId?: string;
  subscriptionId?: string;
  product: PaypalProduct;
  documentId?: string;
}): Promise<{ verified: true; amountPaid: number }> {
  const { data, error } = await supabase.functions.invoke('paypal-verify', {
    body: params,
  });
  if (error) {
    throw new Error(error.message || 'No se pudo verificar el pago con PayPal.');
  }
  if (!data?.verified) {
    throw new Error(data?.error || 'El pago no pudo ser verificado.');
  }
  return { verified: true, amountPaid: data.amountPaid };
}

/**
 * Redeems a promo code entirely server-side (validity, expiry, redemption
 * cap, one-per-user, and the actual grant all live in the `paypal-verify`
 * Edge Function + public.promo_codes table) — the client never decides
 * whether a code is valid, only which code the user typed.
 */
export async function redeemPromoCode(promoCode: string): Promise<{ verified: true; product: PaypalProduct }> {
  const { data, error } = await supabase.functions.invoke('paypal-verify', {
    body: { promoCode },
  });
  if (error) {
    throw new Error(error.message || 'No se pudo validar el código promocional.');
  }
  if (!data?.verified) {
    throw new Error(data?.error || 'Código promocional inválido.');
  }
  return { verified: true, product: data.product };
}
