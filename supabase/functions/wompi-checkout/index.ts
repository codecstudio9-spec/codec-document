// Abre un cobro con Wompi para el plan del motor DIAN.
//
// ── Por qué hace falta una función y no basta el navegador ──────────────
//
// El Checkout Web de Wompi exige una «firma de integridad»:
//
//     SHA256(referencia + importeEnCentavos + moneda + SECRETO_DE_INTEGRIDAD)
//
// Ese secreto no puede estar en el navegador. Si estuviera, cualquiera
// firmaría un cobro de $1.000 por el plan de $52.900 y Wompi lo aceptaría
// como legítimo, porque la firma sería correcta. Por eso la firma se calcula
// aquí, sobre el importe que dice la BASE DE DATOS — nunca sobre el que
// mande el cliente.
//
// El navegador sólo recibe el resultado ya firmado y se lo entrega al widget.
//
// ── Variables de entorno ────────────────────────────────────────────────
//   WOMPI_PUBLIC_KEY        pub_prod_… (o pub_test_… en pruebas)
//   WOMPI_INTEGRITY_SECRET  el «secreto de integridad» del panel de Wompi
//   WOMPI_REDIRECT_URL      a dónde vuelve el contador tras pagar
//
// Deploy:
//   supabase functions deploy wompi-checkout --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const PUBLIC_KEY = Deno.env.get('WOMPI_PUBLIC_KEY') ?? '';
const INTEGRITY_SECRET = Deno.env.get('WOMPI_INTEGRITY_SECRET') ?? '';
const REDIRECT_URL = Deno.env.get('WOMPI_REDIRECT_URL')
  ?? 'https://www.codecdocument.com/documentos-dian';

function cors(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json' },
  });
}

async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(origin) });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405, origin);

  if (!PUBLIC_KEY || !INTEGRITY_SECRET) {
    // Se dice claro y pronto. Un cobro que falla a mitad del widget deja al
    // contador sin saber si le cobraron o no, que es la peor duda posible.
    return json({ error: 'El cobro no está configurado todavía.' }, 503, origin);
  }

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) {
    return json({ error: 'Hay que iniciar sesión para pagar.' }, 401, origin);
  }

  let meses = 1;
  try {
    const body = await req.json();
    meses = Number(body?.meses ?? 1);
  } catch {
    meses = 1;
  }
  if (meses !== 1 && meses !== 12) {
    return json({ error: 'Sólo hay plan mensual o anual.' }, 400, origin);
  }

  // Con la sesión del usuario, no con la llave de servicio: ed_crear_pago()
  // resuelve de quién es el pago con auth.uid(), y así no hay forma de
  // crearle un cobro a otra persona.
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });

  const { data, error } = await supabase.rpc('ed_crear_pago', { p_meses: meses });
  if (error) return json({ error: error.message }, 400, origin);

  const pago = data as { reference: string; amount_in_cents: number; currency: string };
  if (!pago?.reference) return json({ error: 'No se pudo abrir el cobro.' }, 500, origin);

  // El orden importa y no es negociable: referencia, importe, moneda, secreto.
  const firma = await sha256Hex(
    `${pago.reference}${pago.amount_in_cents}${pago.currency}${INTEGRITY_SECRET}`,
  );

  return json({
    publicKey: PUBLIC_KEY,
    reference: pago.reference,
    amountInCents: pago.amount_in_cents,
    currency: pago.currency,
    signature: firma,
    redirectUrl: REDIRECT_URL,
    meses,
  }, 200, origin);
});
