/**
 * Free-tier usage limits — TWO fully independent counters, "Documentos" and
 * "Firmas", each 2 uses per rolling 72-hour window measured from the action
 * that hit the limit (not a calendar-day reset). Backed by event-log tables
 * (one row per action) counted with a sliding window via SECURITY DEFINER
 * RPCs — see supabase_unify_72h_limits_migration.sql.
 *
 * "Documento" only counts on a real, successful download/compile — never on
 * filling out a form or passing through an identity-verification screen.
 * "Firma" counts when a signature is actually placed/sent for signing.
 * These two counters must stay independent: exhausting one must never
 * affect the other.
 *
 * This is a real-money paywall gate, so on RPC failure we fail CLOSED
 * (deny) rather than open — a Supabase hiccup must not translate into
 * free, unmetered access. Supabase already backs auth for the whole app,
 * so if it's unreachable the user can't be doing anything else either.
 *
 * A logged-in user's quota is ALWAYS computed purely from their own userId
 * against these tables — never from localStorage device ids or IP, which
 * only apply to the separate, fully-anonymous path below. Mixing the two
 * was the actual cause of "new account instantly blocked" reports: it
 * wasn't a bad empty-result check (COUNT(*) already correctly returns 0,
 * never NULL, for a user with no history), it was other code paths
 * blocking before ever consulting a real per-user count at all.
 */

import { supabase } from '../../lib/supabase';
import { getPublicIp } from '../../lib/signatureService';
import { getDeviceId } from '../utils/device-id';

type LimitResult = { allowed: boolean; remaining: number };

// ── Signatures — 72h rolling window ─────────────────────────────────────
const SIGNATURE_REQUEST_LIMIT_72H = 2;

export async function consumeSignatureRequest72h(userId: string, isPremium = false): Promise<LimitResult> {
  if (isPremium) return { allowed: true, remaining: 999 };
  if (!userId) return { allowed: false, remaining: 0 };

  const { data, error } = await supabase.rpc('try_consume_signature_request_72h', {
    p_user_id: userId,
    p_limit: SIGNATURE_REQUEST_LIMIT_72H,
  });

  if (error) {
    console.error('try_consume_signature_request_72h failed:', error);
    return { allowed: false, remaining: 0 };
  }
  return { allowed: Boolean(data), remaining: Boolean(data) ? 1 : 0 };
}

/** When the next free slot opens up, for "try again in Xh" messaging. Null if a slot is free right now. */
export async function getNextSignatureRequestSlot(userId: string): Promise<Date | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase.rpc('next_signature_request_slot', {
      p_user_id: userId,
      p_limit: SIGNATURE_REQUEST_LIMIT_72H,
    });
    if (error || !data) return null;
    return new Date(data as string);
  } catch {
    return null;
  }
}

// ── Documents — 72h rolling window ──────────────────────────────────────
// Only ever call this at the point a document is actually, successfully
// generated/downloaded — never earlier in the flow (form fill, identity
// verification screens). If the user abandons before that point, nothing
// should be consumed.
const DOCUMENT_LIMIT_72H = 2;

export async function consumeDocumentLimit72h(userId: string, isPremium = false): Promise<LimitResult> {
  if (isPremium) return { allowed: true, remaining: 999 };
  if (!userId) return { allowed: false, remaining: 0 };

  const { data, error } = await supabase.rpc('try_consume_document_72h', {
    p_user_id: userId,
    p_limit: DOCUMENT_LIMIT_72H,
  });

  if (error) {
    console.error('try_consume_document_72h failed:', error);
    return { allowed: false, remaining: 0 };
  }
  return { allowed: Boolean(data), remaining: Boolean(data) ? 1 : 0 };
}

export async function getNextDocumentSlot(userId: string): Promise<Date | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase.rpc('next_document_slot', {
      p_user_id: userId,
      p_limit: DOCUMENT_LIMIT_72H,
    });
    if (error || !data) return null;
    return new Date(data as string);
  } catch {
    return null;
  }
}

// ── Smart Quotes — 72h rolling window, independent from documents/signatures ──
// Only ever call this at the point a NEW quote is actually created — never
// on saving edits to an existing draft, same reasoning as documents above.
const QUOTE_LIMIT_72H = 2;

export async function consumeQuoteLimit72h(userId: string, isPremium = false): Promise<LimitResult> {
  if (isPremium) return { allowed: true, remaining: 999 };
  if (!userId) return { allowed: false, remaining: 0 };

  const { data, error } = await supabase.rpc('try_consume_quote_72h', {
    p_user_id: userId,
    p_limit: QUOTE_LIMIT_72H,
  });

  if (error) {
    console.error('try_consume_quote_72h failed:', error);
    return { allowed: false, remaining: 0 };
  }
  return { allowed: Boolean(data), remaining: Boolean(data) ? 1 : 0 };
}

export async function getNextQuoteSlot(userId: string): Promise<Date | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase.rpc('next_quote_slot', {
      p_user_id: userId,
      p_limit: QUOTE_LIMIT_72H,
    });
    if (error || !data) return null;
    return new Date(data as string);
  } catch {
    return null;
  }
}

// ── Anonymous (not logged in) usage — 72h rolling window, per device ───────
// Previously, every gate in the app treated "no userId" as an instant hard
// block ("if (!userId) { show paywall; return; }") with no quota check at
// all — so a brand-new visitor on a brand-new phone hit the "limit reached"
// message on their very first tap, having done nothing. This gives
// anonymous visitors a real 2-actions/72h allowance, keyed by a device id
// persisted in localStorage (see utils/device-id.ts) so a genuinely new
// device always starts at zero. See supabase_guest_dashboard_anon_migration.sql.
const ANON_USAGE_LIMIT_72H = 2;

export async function consumeAnonUsage72h(action: 'document' | 'signature'): Promise<LimitResult> {
  const deviceId = getDeviceId();
  const ip = await getPublicIp().catch(() => 'unknown');

  const { data, error } = await supabase.rpc('try_consume_anon_usage_72h', {
    p_device_id: deviceId,
    p_ip: ip,
    p_action: action,
    p_limit: ANON_USAGE_LIMIT_72H,
  });

  if (error) {
    console.error('try_consume_anon_usage_72h failed:', error);
    return { allowed: false, remaining: 0 }; // fail closed — see file header
  }
  return { allowed: Boolean(data), remaining: Boolean(data) ? 1 : 0 };
}

export async function getNextAnonUsageSlot(action: 'document' | 'signature'): Promise<Date | null> {
  try {
    const { data, error } = await supabase.rpc('next_anon_usage_slot', {
      p_device_id: getDeviceId(),
      p_action: action,
      p_limit: ANON_USAGE_LIMIT_72H,
    });
    if (error || !data) return null;
    return new Date(data as string);
  } catch {
    return null;
  }
}

