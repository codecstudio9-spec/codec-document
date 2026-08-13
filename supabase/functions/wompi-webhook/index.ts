// Recibe los eventos de Wompi y activa el plan del motor DIAN.
//
// ── Por qué el webhook y no la vuelta del navegador ─────────────────────
//
// Tras pagar, Wompi devuelve al contador a una URL nuestra. Esa vuelta NO
// sirve para activar nada: la escribe el navegador, y quien quiera puede
// visitarla a mano sin haber pagado un peso. El único aviso que vale es este,
// que llega servidor a servidor y viene firmado.
//
// ── Cómo se verifica la firma ──────────────────────────────────────────
//
// Wompi manda `signature.properties`: una lista de rutas dentro de `data`.
// Se concatenan SUS VALORES en ese orden, después el `timestamp`, después el
// secreto de eventos, y se aplica SHA256. El resultado debe coincidir con
// `signature.checksum` (o la cabecera X-Event-Checksum).
//
// La lista de propiedades se lee del propio evento y NO se quema aquí: Wompi
// advierte que puede cambiar con el tiempo y entre eventos. Quien la fije en
// el código verá cómo el día que Wompi añada un campo dejan de entrar todos
// los pagos, sin un error visible en ninguna parte.
//
// ── Lo que se comprueba además de la firma ─────────────────────────────
//
// Que el importe del evento sea el que se guardó al abrir el cobro. La firma
// garantiza que el mensaje viene de Wompi y no fue alterado; no garantiza que
// hable del cobro que creemos. Comparar el importe cierra ese hueco.
//
// ── Variables de entorno ───────────────────────────────────────────────
//   WOMPI_EVENTS_SECRET       el «secreto de eventos» del panel de Wompi
//   SUPABASE_SERVICE_ROLE_KEY para llamar a ed_confirmar_pago()
//
// Deploy (SIN verificación de JWT: quien llama es Wompi, no un usuario):
//   supabase functions deploy wompi-webhook --no-verify-jwt --workdir "<carpeta>"

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const EVENTS_SECRET = Deno.env.get('WOMPI_EVENTS_SECRET') ?? '';

async function sha256Hex(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparación en tiempo constante. Con un `===` corriente, el tiempo que
 *  tarda en fallar delata cuántos caracteres iniciales acertó quien lo
 *  intenta, y eso convierte adivinar la firma en un problema abordable. */
function igualSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

/** Lee 'transaction.status' dentro de data. Devuelve '' si falta: un valor
 *  ausente tiene que producir una firma distinta, no reventar. */
function porRuta(obj: unknown, ruta: string): string {
  let actual: unknown = obj;
  for (const parte of ruta.split('.')) {
    if (actual === null || typeof actual !== 'object') return '';
    actual = (actual as Record<string, unknown>)[parte];
  }
  if (actual === null || actual === undefined) return '';
  return String(actual);
}

Deno.serve(async (req) => {
  // Wompi no espera CORS: no lo llama un navegador.
  if (req.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }
  if (!EVENTS_SECRET || !SERVICE_KEY) {
    console.error('wompi-webhook sin configurar (falta secreto de eventos o service role)');
    return new Response('No configurado', { status: 503 });
  }

  let evento: Record<string, unknown>;
  try {
    evento = await req.json();
  } catch {
    return new Response('JSON inválido', { status: 400 });
  }

  const firma = evento.signature as { properties?: unknown; checksum?: unknown } | undefined;
  const propiedades = Array.isArray(firma?.properties) ? firma!.properties as string[] : null;
  const checksumEsperado = String(
    firma?.checksum ?? req.headers.get('X-Event-Checksum') ?? '',
  ).toLowerCase();

  if (!propiedades || !checksumEsperado) {
    return new Response('Evento sin firma', { status: 400 });
  }

  const data = evento.data;
  const concatenado =
    propiedades.map((p) => porRuta(data, p)).join('')
    + String(evento.timestamp ?? '')
    + EVENTS_SECRET;

  const calculado = await sha256Hex(concatenado);
  if (!igualSeguro(calculado, checksumEsperado)) {
    // No se dice qué falló. A quien esté probando firmas no se le explica
    // cuánto le faltó.
    console.warn('wompi-webhook: firma no coincide');
    return new Response('Firma inválida', { status: 401 });
  }

  // Sólo interesan las transacciones. Wompi manda más tipos de evento y
  // devolver 200 a los demás evita que los reintente eternamente.
  const tx = (data as { transaction?: Record<string, unknown> } | null)?.transaction;
  if (!tx) return new Response('ok', { status: 200 });

  const referencia = String(tx.reference ?? '');
  const estado = String(tx.status ?? '');
  const idTx = String(tx.id ?? '');
  const metodo = String(tx.payment_method_type ?? '');
  const importe = Number(tx.amount_in_cents ?? 0);

  if (!referencia) return new Response('ok', { status: 200 });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // La firma prueba que el mensaje es de Wompi; no prueba que el importe sea
  // el del cobro que abrimos. Se comprueba aparte.
  const { data: pago } = await admin
    .from('ed_payments')
    .select('amount_in_cents, status')
    .eq('reference', referencia)
    .maybeSingle();

  if (!pago) {
    // Referencia que no es nuestra. 200 igualmente: reintentarlo no la va a
    // convertir en nuestra, y dejar a Wompi reintentando para siempre sólo
    // ensucia su cola y la nuestra.
    console.warn('wompi-webhook: referencia desconocida', referencia);
    return new Response('ok', { status: 200 });
  }

  if (estado === 'APPROVED' && Number(pago.amount_in_cents) !== importe) {
    console.error(
      'wompi-webhook: importe distinto',
      { referencia, esperado: pago.amount_in_cents, recibido: importe },
    );
    // Aquí sí se rechaza: es una incoherencia que alguien tiene que mirar.
    return new Response('Importe no coincide', { status: 409 });
  }

  const { data: resultado, error } = await admin.rpc('ed_confirmar_pago', {
    p_reference: referencia,
    p_transaction_id: idTx || null,
    p_status: estado,
    p_method: metodo || null,
    p_raw: evento,
  });

  if (error) {
    console.error('wompi-webhook: fallo al confirmar', error.message);
    // 500 para que Wompi lo reintente: el pago es real y todavía no está
    // acreditado. ed_confirmar_pago() es idempotente, así que reintentar es
    // seguro.
    return new Response('Error al confirmar', { status: 500 });
  }

  console.log('wompi-webhook', referencia, estado, JSON.stringify(resultado));
  return new Response('ok', { status: 200 });
});
