// Supabase Edge Function — verifies a PayPal order server-side before
// granting anything, and performs the grant itself using the service-role
// client (never trusts a client-reported "payment succeeded" boolean).
//
// Why this exists: every payment flow in this app used to call
// actions.order.capture() in the browser and then immediately write the
// unlock/credit/plan directly from client JS. That is forgeable — anyone
// can open devtools and call the same Supabase write, or fake the capture
// callback, without ever paying. This function is the single place that
// talks to PayPal's REST API with the (secret, server-only) client secret
// and only grants access after PayPal itself confirms the order is
// COMPLETED and the amount paid matches the expected price for the
// product being unlocked.
//
// Deploy:
//   supabase functions deploy paypal-verify
// Secrets (supabase secrets set):
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE=live
//   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by the platform)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') ?? '';
const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') ?? 'live';
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Must match the plan IDs the frontend passes to actions.subscription.create()
// (VITE_PAYPAL_PLAN_MONTHLY / _SEMIANNUAL / _ANNUAL) — set as secrets here too,
// so a subscriptionID can be confirmed to be for the plan it claims to be.
const PAYPAL_PLAN_IDS: Record<string, string> = {
  sub_monthly: Deno.env.get('PAYPAL_PLAN_MONTHLY') ?? '',
  sub_semiannual: Deno.env.get('PAYPAL_PLAN_SEMIANNUAL') ?? '',
  sub_annual: Deno.env.get('PAYPAL_PLAN_ANNUAL') ?? '',
};

// ── Canonical price catalog — must match src/app/config/paypal.ts ──────────
// Keeping this duplicated (not imported) is deliberate: this function is the
// only place a price is authoritative. If you change a price in the
// frontend config, update it here too, in the same commit.
const DOCUMENT_PRICES: Record<string, number> = {
  'residential-lease': 7.0,
  'bill-of-sale-vehicle': 7.0,
  'promissory-note': 7.0,
  nda: 9.99,
  'independent-contractor': 9.99,
  'service-agreement': 9.99,
};
const DEFAULT_DOC_PRICE = 7.0;
const BUNDLE_PRICE = 12.0;
const SIG_SINGLE_PRICE = 2.99;
const SIG_MONTHLY_PRICE = 19.99;
// Smart Quotes -- pago individual; el ilimitado ya viene incluido en
// sub_monthly/semiannual/annual (el plan de documentos existente), sin
// plan nuevo, tal como se pidio explicitamente.
const QUOTE_SINGLE_PRICE = 6.99;
const SUBSCRIPTION_PLANS: Record<string, { amount: number; days: number }> = {
  sub_monthly: { amount: 29.99, days: 30 },
  sub_semiannual: { amount: 134.99, days: 182 },
  sub_annual: { amount: 251.99, days: 365 },
};
// Plan Empresarial -- vendido unicamente desde /my-company (owner/admin),
// nunca en la pagina de precios principal. Pago unico por periodo (Orders
// API), igual que sub_monthly/annual -- no requiere Billing Plan de PayPal.
const COMPANY_PLANS: Record<string, { amount: number; days: number }> = {
  company_monthly: { amount: 99.99, days: 30 },
  company_annual: { amount: 999.99, days: 365 },
};

type Product =
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

interface RequestBody {
  orderId?: string;        // Orders API — doc_single / doc_bundle / sig_single / sig_monthly
  subscriptionId?: string; // Subscriptions API — sub_monthly / sub_semiannual / sub_annual
  promoCode?: string;      // validated against public.promo_codes — no PayPal call at all
  // Required for a real payment (what's being bought). For a promoCode
  // redemption it's OPTIONAL and means something different: the checkout
  // context the code was typed into (which plan/product the user had
  // selected) — see the promo branch below for how it's used.
  product?: Product;
  documentId?: string; // required for doc_single / doc_bundle
}

const KNOWN_PRODUCTS = new Set<Product>([
  'doc_single', 'doc_bundle', 'sig_single', 'sig_monthly',
  'sub_monthly', 'sub_semiannual', 'sub_annual', 'full_access',
  'company_monthly', 'company_annual', 'quote_single',
]);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function expectedAmountFor(product: Product, documentId?: string): number | null {
  switch (product) {
    case 'doc_single':
      return documentId ? (DOCUMENT_PRICES[documentId] ?? DEFAULT_DOC_PRICE) : null;
    case 'doc_bundle':
      return BUNDLE_PRICE;
    case 'sig_single':
      return SIG_SINGLE_PRICE;
    case 'sig_monthly':
      return SIG_MONTHLY_PRICE;
    case 'sub_monthly':
    case 'sub_semiannual':
    case 'sub_annual':
      return SUBSCRIPTION_PLANS[product].amount;
    case 'company_monthly':
    case 'company_annual':
      return COMPANY_PLANS[product].amount;
    case 'quote_single':
      return QUOTE_SINGLE_PRICE;
    default:
      return null;
  }
}

async function getPayPalAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`);
  const json = await res.json();
  return json.access_token as string;
}

async function fetchOrGetPayPalOrder(orderId: string, accessToken: string): Promise<any> {
  const getRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!getRes.ok) throw new Error(`PayPal order lookup failed: ${getRes.status}`);
  let order = await getRes.json();

  // If the client only approved but didn't finish capture (rare race), capture it now.
  if (order.status === 'APPROVED') {
    const capRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!capRes.ok) throw new Error(`PayPal capture failed: ${capRes.status}`);
    order = await capRes.json();
  }

  return order;
}

async function fetchPayPalSubscription(subscriptionId: string, accessToken: string): Promise<any> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`PayPal subscription lookup failed: ${res.status}`);
  return await res.json();
}

function extractPaidAmount(order: any): { amount: number; currency: string } | null {
  const capture = order?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture || capture.status !== 'COMPLETED') return null;
  const amount = Number(capture.amount?.value);
  const currency = String(capture.amount?.currency_code ?? '');
  if (!Number.isFinite(amount)) return null;
  return { amount, currency };
}

// deno-lint-ignore no-explicit-any
async function grantProduct(admin: any, product: Product, userId: string | null, subscriptionId?: string) {
  if (product === 'sig_single' && userId) {
    const { data: existing } = await admin.from('user_credits').select('credits').eq('user_id', userId).maybeSingle();
    if (existing) {
      await admin.from('user_credits').update({ credits: (existing.credits ?? 0) + 1, updated_at: new Date().toISOString() }).eq('user_id', userId);
    } else {
      await admin.from('user_credits').insert({ user_id: userId, credits: 1, plan: 'free' });
    }
  } else if (product === 'sig_monthly' && userId) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await admin.from('user_credits').select('id').eq('user_id', userId).maybeSingle();
    if (existing) {
      await admin.from('user_credits').update({ plan: 'monthly', plan_expires_at: expiresAt, updated_at: new Date().toISOString() }).eq('user_id', userId);
    } else {
      await admin.from('user_credits').insert({ user_id: userId, credits: 0, plan: 'monthly', plan_expires_at: expiresAt });
    }
  } else if (product === 'full_access' && userId) {
    // Admin-granted coupon (FULL_ACCESS) — activates BOTH the document
    // plan and unlimited signatures at once, for ~10 years, from any
    // account. Reuses the exact same fields every real paid plan uses
    // (plan_status/plan_type/plan_expires_at on users, plan/plan_expires_at
    // on user_credits), so nothing else in the app has to special-case
    // this — a full_access grant looks exactly like a real annual +
    // sig_monthly subscription to every other check in the codebase.
    const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from('users').update({
      plan_status: 'active',
      plan_type: 'annual',
      plan_expires_at: expiresAt,
    }).eq('id', userId);
    const { data: existingCredits } = await admin.from('user_credits').select('id').eq('user_id', userId).maybeSingle();
    if (existingCredits) {
      await admin.from('user_credits').update({ plan: 'monthly', plan_expires_at: expiresAt, updated_at: new Date().toISOString() }).eq('user_id', userId);
    } else {
      await admin.from('user_credits').insert({ user_id: userId, credits: 0, plan: 'monthly', plan_expires_at: expiresAt });
    }
  } else if ((product === 'company_monthly' || product === 'company_annual') && userId) {
    // Only the caller's own company can be upgraded, and only if they're
    // owner/admin there -- mirrors the UI gate (canManage) in
    // my-company-page.tsx, enforced again here since this endpoint is the
    // only place that actually writes plan_active_until.
    const { data: membership } = await admin
      .from('company_members')
      .select('company_id, role')
      .eq('user_id', userId)
      .maybeSingle();
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('Only a company owner or admin can activate the Business plan');
    }
    const plan = COMPANY_PLANS[product];
    const expiresAt = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toISOString();
    await admin.from('companies').update({
      plan_active_until: expiresAt,
      plan_billing_cycle: product === 'company_monthly' ? 'monthly' : 'annual',
      updated_at: new Date().toISOString(),
    }).eq('id', membership.company_id);
  } else if (product.startsWith('sub_') && userId) {
    const plan = SUBSCRIPTION_PLANS[product];
    const expiresAt = new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toISOString();
    const planTypeMap: Record<string, string> = {
      sub_monthly: 'monthly', sub_semiannual: 'semiannual', sub_annual: 'annual',
    };
    await admin.from('users').update({
      plan_status: 'active',
      plan_type: planTypeMap[product],
      paypal_subscription_id: subscriptionId ?? null,
      plan_expires_at: expiresAt,
    }).eq('id', userId);
  }
  // doc_single / doc_bundle: no server-side entitlement table for anonymous
  // guest checkout — verification alone is the gate.
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: 'PayPal not configured on server' }), {
        status: 500, headers: corsHeaders(origin),
      });
    }

    const body = (await req.json()) as RequestBody;
    const { orderId, subscriptionId, promoCode, product, documentId } = body;

    // ── Promo code path — no PayPal call, validated entirely server-side ──
    if (promoCode) {
      const authHeader = req.headers.get('Authorization') ?? '';
      const jwt = authHeader.replace(/^Bearer\s+/i, '');
      if (!jwt) {
        return new Response(JSON.stringify({ error: 'Authentication required to redeem a promo code' }), {
          status: 401, headers: corsHeaders(origin),
        });
      }
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { data: userData } = await admin.auth.getUser(jwt);
      const userId = userData?.user?.id ?? null;
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401, headers: corsHeaders(origin),
        });
      }

      const code = promoCode.trim().toUpperCase();
      const { data: promo } = await admin
        .from('promo_codes')
        .select('code, product, active, expires_at, max_redemptions, redemption_count, unlimited_per_user')
        .eq('code', code)
        .maybeSingle();

      if (!promo || !promo.active) {
        return new Response(JSON.stringify({ error: 'Invalid or inactive promo code' }), {
          status: 404, headers: corsHeaders(origin),
        });
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'This promo code has expired' }), {
          status: 410, headers: corsHeaders(origin),
        });
      }
      if (promo.max_redemptions !== null && promo.redemption_count >= promo.max_redemptions) {
        return new Response(JSON.stringify({ error: 'This promo code has reached its redemption limit' }), {
          status: 410, headers: corsHeaders(origin),
        });
      }

      // A master/unlimited code (unlimited_per_user = true — e.g. the
      // admin's own PROMO1022925002) waives payment for whatever the
      // account was actually trying to buy, instead of always granting
      // the fixed product on the promo_codes row: select "monthly" and
      // apply it there, only the monthly plan activates; pay for a single
      // $7/$9 document and apply it there, only that document unlocks.
      // Ordinary (non-unlimited) discount codes ignore this and keep
      // granting exactly the product they were configured for, same as
      // before — that's normal, expected coupon behavior.
      const contextProduct = product && KNOWN_PRODUCTS.has(product) ? product : null;
      const grantedProduct: Product = (promo.unlimited_per_user && contextProduct)
        ? contextProduct
        : ((promo.product as Product) ?? 'doc_single');
      // Best-effort real client IP for the audit record — same header
      // chain reverse proxies/CDNs conventionally set; never blocks
      // redemption if absent.
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || null;

      // Codes with unlimited_per_user = true (e.g. the admin's own master
      // code) can be redeemed any number of times by the same account —
      // there's no DB-level UNIQUE(code, user_id) anymore (dropped
      // deliberately, see supabase_add_promo_unlimited_per_user_migration.sql),
      // so "already redeemed" is only enforced here, only for ordinary codes.
      if (!promo.unlimited_per_user) {
        const { data: alreadyRedeemed } = await admin
          .from('promo_redemptions')
          .select('id')
          .eq('code', code)
          .eq('user_id', userId)
          .maybeSingle();
        if (alreadyRedeemed) {
          return new Response(JSON.stringify({ error: 'You already redeemed this promo code' }), {
            status: 409, headers: corsHeaders(origin),
          });
        }
      }

      const { error: redemptionError } = await admin
        .from('promo_redemptions')
        .insert({ code, user_id: userId, ip_address: ipAddress, product: grantedProduct });
      if (redemptionError) {
        return new Response(JSON.stringify({ error: 'Could not record this redemption' }), {
          status: 500, headers: corsHeaders(origin),
        });
      }
      await admin.from('promo_codes').update({ redemption_count: promo.redemption_count + 1 }).eq('code', code);

      await grantProduct(admin, grantedProduct, userId);

      return new Response(
        JSON.stringify({ verified: true, orderId: `promo:${code}`, product: grantedProduct, amountPaid: 0 }),
        { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
      );
    }

    const isSubProduct = product?.startsWith('sub_');
    // The 3 plan tiers (sub_monthly/semiannual/annual) are sold two ways in
    // this app: as a real recurring PayPal Subscription object (subscriptionId
    // present → Subscriptions API), or as a one-time Orders API payment for
    // the same period (orderId present → Orders API, same amount/duration,
    // just no auto-renewal). Both are legitimate — branch on whichever id the
    // caller actually sent, not on the product name alone.
    const usesSubscriptionApi = isSubProduct && Boolean(subscriptionId);

    if (!product || (!subscriptionId && !orderId)) {
      return new Response(
        JSON.stringify({ error: 'orderId or subscriptionId, and product, are required' }),
        { status: 400, headers: corsHeaders(origin) },
      );
    }

    // Identify the caller (optional — document purchases can be anonymous;
    // signature credits and subscriptions require a real signed-in user).
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let userId: string | null = null;
    if (jwt) {
      const { data: userData } = await admin.auth.getUser(jwt);
      userId = userData?.user?.id ?? null;
    }

    const isCompanyProduct = product === 'company_monthly' || product === 'company_annual';
    const needsUser = product === 'sig_single' || product === 'sig_monthly' || isSubProduct || isCompanyProduct || product === 'quote_single';
    if (needsUser && !userId) {
      return new Response(JSON.stringify({ error: 'Authentication required for this product' }), {
        status: 401, headers: corsHeaders(origin),
      });
    }

    const accessToken = await getPayPalAccessToken();
    let paid: { amount: number; currency: string } | null = null;
    let ledgerId = '';

    if (usesSubscriptionApi) {
      // ── Subscriptions API path (recurring billing) ────────────────────
      const expectedPlanId = PAYPAL_PLAN_IDS[product];
      const sub = await fetchPayPalSubscription(subscriptionId!, accessToken);
      if (sub.status !== 'ACTIVE') {
        return new Response(JSON.stringify({ error: `Subscription is not active (status: ${sub.status})` }), {
          status: 402, headers: corsHeaders(origin),
        });
      }
      if (!expectedPlanId || sub.plan_id !== expectedPlanId) {
        return new Response(JSON.stringify({ error: 'Subscription plan_id does not match the requested product' }), {
          status: 402, headers: corsHeaders(origin),
        });
      }
      paid = { amount: SUBSCRIPTION_PLANS[product].amount, currency: 'USD' };
      ledgerId = `sub:${subscriptionId}`;
    } else {
      // ── Orders API path (one-time payment) ─────────────────────────────
      const expectedAmount = expectedAmountFor(product, documentId);
      if (expectedAmount === null) {
        return new Response(JSON.stringify({ error: 'Unknown product / missing documentId' }), {
          status: 400, headers: corsHeaders(origin),
        });
      }
      const order = await fetchOrGetPayPalOrder(orderId!, accessToken);
      const capturedPaid = extractPaidAmount(order);
      if (!capturedPaid || order.status !== 'COMPLETED') {
        return new Response(JSON.stringify({ error: 'Order is not a completed payment' }), {
          status: 402, headers: corsHeaders(origin),
        });
      }
      if (capturedPaid.currency !== 'USD' || Math.abs(capturedPaid.amount - expectedAmount) > 0.01) {
        return new Response(
          JSON.stringify({ error: `Amount mismatch: paid ${capturedPaid.amount} ${capturedPaid.currency}, expected ${expectedAmount} USD` }),
          { status: 402, headers: corsHeaders(origin) },
        );
      }
      paid = capturedPaid;
      ledgerId = orderId!;
    }

    // ── Idempotency: this orderId/subscriptionId can only ever be consumed once ──
    const { error: ledgerError } = await admin
      .from('paypal_processed_orders')
      .insert({ order_id: ledgerId, product, user_id: userId, amount_usd: paid.amount, document_id: documentId ?? null });
    if (ledgerError) {
      // Unique violation → already granted before, refuse to grant twice.
      return new Response(JSON.stringify({ error: 'This payment was already processed' }), {
        status: 409, headers: corsHeaders(origin),
      });
    }

    // ── Perform the grant, server-side, with the service-role client ───
    await grantProduct(admin, product, userId, subscriptionId);
    // doc_single / doc_bundle: no server-side entitlement table exists for
    // anonymous guest checkout — verification alone is the gate. The client
    // only proceeds to preview-page.tsx after this endpoint returns verified:true.

    return new Response(
      JSON.stringify({ verified: true, orderId: ledgerId, product, amountPaid: paid.amount }),
      { status: 200, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('paypal-verify error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), {
      status: 500, headers: corsHeaders(origin),
    });
  }
});
