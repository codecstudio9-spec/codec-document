// Webhook dispatcher — the piece explicitly left "PENDIENTE" in
// supabase_add_webhooks_migration.sql. That migration's DB triggers
// (trg_documents_webhook / trg_signers_webhook) already write rows into
// webhook_events whenever a document completes or someone signs — they
// just never got sent anywhere, because nothing ever read that table.
// This function does: read undelivered events, POST each one (HMAC-signed
// with the webhook's own secret) to every active webhook subscribed to
// that event type, mark delivered on success. Meant to run on a schedule
// (see 20260920000200_schedule_webhook_dispatcher.sql, pg_cron every 2
// minutes) — also safe to call by hand for testing.
//
// Deploy — MUST include --no-verify-jwt (meant to be hit by pg_cron on a
// schedule, not a browser session with a Supabase JWT):
//   supabase functions deploy webhook-dispatcher --no-verify-jwt
//
// No caller auth beyond that: same reasoning as this repo's public
// dian-* functions. This never creates or exposes anything a caller
// couldn't already see — it only forwards webhook_events rows that a
// company's own DB triggers already queued from real document/signature
// activity, to URLs that company itself registered. Worst case of
// someone finding the URL and re-invoking it early is a redundant,
// harmless re-delivery of already-legitimate events (receivers are
// expected to handle webhook delivery idempotently, standard practice
// for this kind of API) — not worth the complexity of a shared secret
// that would otherwise have to be stored in a git-tracked migration to
// let pg_cron send it.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

interface WebhookEventRow {
  id: string;
  company_id: string;
  event_type: string;
  payload: Record<string, unknown>;
}

interface WebhookRow {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (_req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: events, error } = await admin
    .from('webhook_events')
    .select('id, company_id, event_type, payload')
    .eq('delivered', false)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) {
    console.error('webhook-dispatcher: could not read webhook_events:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let delivered = 0;
  let failed = 0;
  let skipped = 0;

  for (const event of (events ?? []) as WebhookEventRow[]) {
    const { data: webhooks } = await admin
      .from('webhooks')
      .select('id, url, secret, events, active')
      .eq('company_id', event.company_id)
      .eq('active', true);

    const targets = ((webhooks ?? []) as WebhookRow[]).filter((w) => w.events.includes(event.event_type));

    if (targets.length === 0) {
      // Nothing is currently subscribed to this event for this company
      // (webhook deleted/deactivated after the event was logged, or none
      // was ever registered) — mark it delivered so it doesn't sit in
      // the queue forever with nowhere to go.
      await admin.from('webhook_events').update({ delivered: true }).eq('id', event.id);
      skipped++;
      continue;
    }

    const body = JSON.stringify({
      id: event.id,
      type: event.event_type,
      created_at: new Date().toISOString(),
      data: event.payload,
    });

    let anySucceeded = false;
    for (const webhook of targets) {
      try {
        const signature = await hmacSha256Hex(webhook.secret, body);
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Codec-Signature': `sha256=${signature}`,
            'X-Codec-Event': event.event_type,
          },
          body,
        });
        if (res.ok) anySucceeded = true;
        else console.error(`webhook-dispatcher: ${webhook.url} responded ${res.status} for event ${event.id}`);
      } catch (err) {
        console.error(`webhook-dispatcher: delivery to ${webhook.url} failed:`, err);
      }
    }

    if (anySucceeded) {
      await admin.from('webhook_events').update({ delivered: true }).eq('id', event.id);
      delivered++;
    } else {
      // Left as delivered = false — picked up again on the next
      // scheduled run. No retry-count/backoff yet; a webhook whose URL
      // is permanently broken just keeps getting retried every cycle
      // until the company fixes or deletes it.
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ processed: (events ?? []).length, delivered, failed, skipped }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
