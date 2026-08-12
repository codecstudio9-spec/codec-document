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
  /** Bono parcial aplicado a este pago. El servidor recalcula el precio con
   *  descuento a partir del porcentaje guardado y comprueba que lo capturado
   *  coincide; sólo entonces registra el canje. */
  promoCode?: string;
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

/**
 * El plan_id de PayPal con el precio ya rebajado, para suscribir a alguien
 * que aplicó un bono parcial.
 *
 * Devuelve `null` si ese plan no se ha creado todavía — el administrador lo
 * crea desde el panel al hacer el bono. Sin plan no se puede aplicar el
 * descuento a una suscripción, y es mejor decirlo que cobrar el precio
 * entero como si el bono no existiera.
 */
export async function planRebajadoDe(
  product: PaypalProduct,
  discountPct: number,
): Promise<{ planId: string; amount: number } | null> {
  const { data, error } = await supabase.rpc('discount_plan_for', {
    p_product: product, p_discount_pct: discountPct,
  });
  const fila = Array.isArray(data) ? data[0] : data;
  if (error || !fila?.plan_id) return null;
  return { planId: String(fila.plan_id), amount: Number(fila.amount) };
}

export interface DescuentoDeBono {
  code: string;
  discountPct: number;
  /** Precio de lista, antes del bono. */
  originalAmount: number | null;
  /** Lo que hay que cobrar. 0 cuando el bono es del 100%. */
  discountedAmount: number | null;
}

/**
 * Consulta cuánto descuenta un bono, sin canjearlo.
 *
 * Hace falta porque un bono ya no es necesariamente «gratis»: uno del 40%
 * deja un importe que pagar, y el botón de PayPal tiene que crearse por esa
 * cifra. La calcula el servidor a partir del porcentaje guardado — el
 * navegador manda el código, nunca el precio, porque un importe que viaja
 * desde el cliente se puede editar y se compraría a un céntimo.
 *
 * Devuelve `null` si el bono no sirve (inexistente, caducado o agotado), para
 * que quien llama pueda distinguir «no aplica» de un fallo de red.
 */
export async function consultarDescuento(
  promoCode: string,
  context: { product: PaypalProduct; documentId?: string },
): Promise<DescuentoDeBono | null> {
  const { data, error } = await supabase.functions.invoke('paypal-verify', {
    body: { promoCode, preview: true, product: context.product, documentId: context.documentId },
  });
  if (error || !data?.valid) return null;
  return {
    code: String(data.code),
    discountPct: Number(data.discountPct ?? 100),
    originalAmount: data.originalAmount ?? null,
    discountedAmount: data.discountedAmount ?? null,
  };
}
