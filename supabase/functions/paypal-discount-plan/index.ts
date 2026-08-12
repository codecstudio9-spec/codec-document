// Supabase Edge Function — crea en PayPal un Billing Plan con el precio
// rebajado, para que un bono parcial funcione también sobre una suscripción.
//
// ── El problema que resuelve ─────────────────────────────────────────────
//
// En un pago único el importe viaja en la orden, así que aplicar un 40% es
// cambiar una cifra. En una suscripción NO: el importe vive dentro del
// Billing Plan de PayPal, identificado por su plan_id, y no existe forma de
// pedirle a PayPal que cobre un plan «con un 40% menos». Hay que crear otro
// plan, con su propio precio, y suscribir a la persona a ese.
//
// ── Por qué el plan se calca del original ────────────────────────────────
//
// No se declara aquí ni la periodicidad ni la moneda ni el producto: se leen
// del plan real que ya está en producción (GET /v1/billing/plans/{id}) y se
// copian, cambiando sólo el precio. Escribir esos valores a mano en este
// archivo significaría que cualquier cambio futuro en el plan oficial —una
// subida de precio, un cambio de moneda— dejaría los planes rebajados
// describiendo algo que ya no existe, y nadie se enteraría hasta que alguien
// cobrara de menos.
//
// ── Idempotencia ─────────────────────────────────────────────────────────
//
// Los planes de PayPal NO se borran, sólo se desactivan. Crear uno nuevo en
// cada llamada dejaría la cuenta llena de planes basura imposibles de
// limpiar, así que antes de crear se mira si ya existe en
// public.paypal_discount_plans y se devuelve el que hay.
//
// Deploy:
//   supabase functions deploy paypal-discount-plan --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes
// Secrets: reutiliza PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_MODE y
// PAYPAL_PLAN_MONTHLY / _SEMIANNUAL / _ANNUAL, ya configurados para
// paypal-verify.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') ?? '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') ?? '';
const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') ?? 'sandbox';
const PAYPAL_API_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const ADMIN_EMAILS = ['douglastabordasanchez@gmail.com'];

/** Los mismos identificadores y precios que paypal-verify. Duplicado a
 *  propósito, igual que allí: cambiar un precio obliga a tocar los dos, en
 *  el mismo commit. */
const PLAN_BASE: Record<string, { envVar: string; amount: number }> = {
  sub_monthly: { envVar: 'PAYPAL_PLAN_MONTHLY', amount: 29.99 },
  sub_semiannual: { envVar: 'PAYPAL_PLAN_SEMIANNUAL', amount: 134.99 },
  sub_annual: { envVar: 'PAYPAL_PLAN_ANNUAL', amount: 251.99 },
};

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

const responder = (cuerpo: unknown, origin: string | null, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: corsHeaders(origin) });

async function accessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth falló: ${res.status}`);
  return (await res.json()).access_token as string;
}

interface PlanPayPal {
  id: string;
  product_id: string;
  name: string;
  status: string;
  billing_cycles?: Array<{
    frequency: { interval_unit: string; interval_count: number };
    tenure_type: string;
    sequence: number;
    total_cycles: number;
    pricing_scheme?: { fixed_price?: { value: string; currency_code: string } };
  }>;
  payment_preferences?: Record<string, unknown>;
  taxes?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });

  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return responder({ error: 'PayPal no está configurado en el servidor.' }, origin, 500);
    }

    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt) return responder({ error: 'Authentication required.' }, origin, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData?.user) return responder({ error: 'Invalid session.' }, origin, 401);

    // Crear planes en la cuenta real de PayPal es una operación de dueño, no
    // de invitado con acceso a analítica.
    const email = (userData.user.email ?? '').toLowerCase().trim();
    if (!ADMIN_EMAILS.includes(email)) {
      return responder({ error: 'Access denied.' }, origin, 403);
    }

    const body = await req.json() as { product?: string; discountPct?: number };
    const product = String(body.product ?? '');
    const discountPct = Math.round(Number(body.discountPct ?? 0));

    const base = PLAN_BASE[product];
    if (!base) {
      return responder({ error: `Producto desconocido: ${product}` }, origin, 400);
    }
    if (!Number.isFinite(discountPct) || discountPct < 1 || discountPct > 99) {
      // El 100% no pasa por aquí: un bono gratuito total no necesita plan,
      // se concede directamente sin cobrar nada.
      return responder({ error: 'El descuento debe estar entre 1 y 99 para una suscripción.' }, origin, 400);
    }

    // ── ¿Ya existe? ───────────────────────────────────────────────────
    const { data: yaExiste } = await admin
      .from('paypal_discount_plans')
      .select('plan_id, amount')
      .eq('product', product)
      .eq('discount_pct', discountPct)
      .maybeSingle();

    if (yaExiste) {
      return responder({
        planId: yaExiste.plan_id, amount: Number(yaExiste.amount), reused: true,
      }, origin);
    }

    const planBaseId = Deno.env.get(base.envVar) ?? '';
    if (!planBaseId) {
      return responder({ error: `Falta el secreto ${base.envVar}.` }, origin, 500);
    }

    const token = await accessToken();

    // ── Se lee el plan original para calcarlo ─────────────────────────
    const resPlan = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans/${planBaseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resPlan.ok) {
      const detalle = await resPlan.text().catch(() => '');
      console.error('[paypal-discount-plan] no se pudo leer el plan base:', resPlan.status, detalle);
      return responder({ error: 'No se pudo leer el plan original en PayPal.' }, origin, 502);
    }
    const original = await resPlan.json() as PlanPayPal;

    const cicloRegular = original.billing_cycles?.find((c) => c.tenure_type === 'REGULAR')
      ?? original.billing_cycles?.[0];
    if (!cicloRegular?.frequency) {
      return responder({ error: 'El plan original no tiene un ciclo de cobro legible.' }, origin, 502);
    }

    const moneda = cicloRegular.pricing_scheme?.fixed_price?.currency_code ?? 'USD';
    // El precio de partida sale del plan real, no de la constante local: si
    // alguien subió el precio en PayPal, el descuento debe aplicarse sobre lo
    // que se está cobrando de verdad.
    const precioReal = Number(cicloRegular.pricing_scheme?.fixed_price?.value ?? base.amount);
    const rebajado = Math.round(precioReal * (100 - discountPct)) / 100;

    if (!(rebajado > 0)) {
      return responder({ error: 'El precio rebajado no puede ser cero.' }, origin, 400);
    }

    // ── Crear el plan ─────────────────────────────────────────────────
    const nombre = `${original.name} — ${discountPct}% dto`.slice(0, 127);
    const resNuevo = await fetch(`${PAYPAL_API_BASE}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        // Sin esto, un reintento por timeout de red crearía un segundo plan
        // idéntico e imborrable en la cuenta de PayPal.
        'PayPal-Request-Id': `codec-disc-${product}-${discountPct}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        product_id: original.product_id,
        name: nombre,
        description: `Plan con ${discountPct}% de descuento aplicado mediante bono.`,
        status: 'ACTIVE',
        billing_cycles: [{
          frequency: {
            interval_unit: cicloRegular.frequency.interval_unit,
            interval_count: cicloRegular.frequency.interval_count,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          // 0 = indefinido, igual que una suscripción normal.
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: { value: rebajado.toFixed(2), currency_code: moneda },
          },
        }],
        payment_preferences: original.payment_preferences ?? {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
        ...(original.taxes ? { taxes: original.taxes } : {}),
      }),
    });

    if (!resNuevo.ok) {
      const detalle = await resNuevo.text().catch(() => '');
      console.error('[paypal-discount-plan] creación falló:', resNuevo.status, detalle);
      return responder({ error: `PayPal rechazó la creación del plan: ${detalle.slice(0, 300)}` }, origin, 502);
    }

    const creado = await resNuevo.json() as PlanPayPal;

    const { error: errGuardar } = await admin.from('paypal_discount_plans').insert({
      product, discount_pct: discountPct, plan_id: creado.id, amount: rebajado,
    });
    if (errGuardar) {
      // El plan YA existe en PayPal. No se puede borrar, así que se informa
      // con su id para poder registrarlo a mano en vez de dejarlo huérfano.
      console.error('[paypal-discount-plan] plan creado pero no registrado:', creado.id, errGuardar);
      return responder({
        error: `El plan se creó en PayPal (${creado.id}) pero no se pudo registrar: ${errGuardar.message}`,
        planId: creado.id,
      }, origin, 500);
    }

    return responder({ planId: creado.id, amount: rebajado, reused: false }, origin);
  } catch (err) {
    console.error('[paypal-discount-plan] error:', err);
    return responder({ error: (err as Error).message ?? 'Error inesperado' }, origin, 500);
  }
});
