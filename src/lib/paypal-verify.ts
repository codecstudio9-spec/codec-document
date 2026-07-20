import { supabase } from './supabase';

export type PaypalProduct =
  | 'doc_single'
  | 'doc_bundle'
  | 'sig_single'
  | 'sig_monthly'
  | 'sub_monthly'
  | 'sub_semiannual'
  | 'sub_annual'
  | 'full_access'
  | 'company_monthly'
  | 'company_annual'
  | 'quote_single';

/**
 * When the Edge Function responds with a non-2xx status, supabase-js
 * wraps it in a FunctionsHttpError whose `.message` is a generic,
 * unhelpful "Edge Function returned a non-2xx status code" — the REAL
 * reason (e.g. "Invalid or inactive promo code") is JSON in the
 * response body, reachable via `error.context` (the raw Response
 * object). Without this, every rejected promo code or failed payment
 * showed that generic technical string instead of an actionable
 * message — confirmed live via a real user screenshot.
 */
async function extractEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === 'function') {
    try {
      const body = await context.clone().json();
      if (body?.error) return String(body.error);
    } catch { /* body wasn't JSON — fall through to the generic message */ }
  }
  return (error as { message?: string })?.message || fallback;
}

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
    throw new Error(await extractEdgeFunctionErrorMessage(error, 'No se pudo verificar el pago con PayPal.'));
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
 *
 * `context.product` tells the server which checkout this code was typed
 * into (monthly plan, single document, etc.) — a master/unlimited code
 * uses it to grant exactly that instead of always granting its fixed
 * configured product; an ordinary discount code ignores it and keeps
 * granting whatever it was created for. Omit it entirely for surfaces
 * with no specific plan context (e.g. the admin-only audit lookup).
 */
export async function redeemPromoCode(
  promoCode: string,
  context?: { product: PaypalProduct; documentId?: string },
): Promise<{ verified: true; product: PaypalProduct }> {
  const { data, error } = await supabase.functions.invoke('paypal-verify', {
    body: { promoCode, product: context?.product, documentId: context?.documentId },
  });
  if (error) {
    throw new Error(await extractEdgeFunctionErrorMessage(error, 'No se pudo validar el código promocional.'));
  }
  if (!data?.verified) {
    throw new Error(data?.error || 'Código promocional inválido.');
  }
  return { verified: true, product: data.product };
}
