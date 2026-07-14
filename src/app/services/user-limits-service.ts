/**
 * Daily usage limits — backed by the `user_limits` Supabase table and the
 * `try_consume_daily_limit` / `get_daily_limit_usage` RPCs (see
 * supabase_daily_limits_atomic_migration.sql).
 *
 * The check-and-increment happens atomically inside a single Postgres
 * transaction (row-locked with FOR UPDATE), so two concurrent requests for
 * the same user can never both slip through the limit — unlike a
 * read-count-in-JS-then-write pattern, which has a race window.
 *
 * Limits:
 *   Generated (AI creator)      → 2 / day
 *   Uploaded  (own PDF)         → 3 / day
 *   Sign transactions (send)    → 2 / day
 *
 * This is a real-money paywall gate, so on RPC failure we fail CLOSED
 * (deny) rather than open — a Supabase hiccup must not translate into
 * free, unmetered access. Supabase already backs auth for the whole app,
 * so if it's unreachable the user can't be doing anything else either.
 */

import { supabase } from '../../lib/supabase';

const LIMIT_GENERATED         = 2;
const LIMIT_UPLOADED          = 3;
const LIMIT_SIGN_TRANSACTIONS = 2;

type LimitResult = { allowed: boolean; remaining: number };

async function consume(
  userId: string,
  counter: 'generated' | 'uploaded' | 'signed',
  limit: number,
  isPremium: boolean,
): Promise<LimitResult> {
  if (isPremium) return { allowed: true, remaining: 999 };
  if (!userId) return { allowed: false, remaining: 0 };

  const { data, error } = await supabase.rpc('try_consume_daily_limit', {
    p_user_id: userId,
    p_counter: counter,
    p_limit: limit,
  });

  if (error) {
    console.error(`try_consume_daily_limit(${counter}) failed:`, error);
    return { allowed: false, remaining: 0 }; // fail closed — see file header
  }

  return { allowed: Boolean(data), remaining: Boolean(data) ? 1 : 0 };
}

/** Atomically check-and-consume one "generated document" credit for today. */
export function consumeGeneratedDocLimit(userId: string, isPremium = false): Promise<LimitResult> {
  return consume(userId, 'generated', LIMIT_GENERATED, isPremium);
}

/** Atomically check-and-consume one "uploaded document" credit for today. */
export function consumeUploadedDocLimit(userId: string, isPremium = false): Promise<LimitResult> {
  return consume(userId, 'uploaded', LIMIT_UPLOADED, isPremium);
}

/** Atomically check-and-consume one "sign transaction" credit for today. */
export function consumeSignTransactionLimit(userId: string, isPremium = false): Promise<LimitResult> {
  return consume(userId, 'signed', LIMIT_SIGN_TRANSACTIONS, isPremium);
}

/** Read-only peek at today's remaining counts, for UI banners — never mutates state. */
export async function getRemainingLimits(userId: string): Promise<{
  generatedRemaining: number;
  uploadedRemaining: number;
  signedRemaining: number;
}> {
  const fallback = {
    generatedRemaining: LIMIT_GENERATED,
    uploadedRemaining: LIMIT_UPLOADED,
    signedRemaining: LIMIT_SIGN_TRANSACTIONS,
  };
  if (!userId) return fallback;
  try {
    const { data, error } = await supabase
      .rpc('get_daily_limit_usage', { p_user_id: userId })
      .maybeSingle();
    if (error || !data) return fallback;
    const row = data as { generated_used: number; uploaded_used: number; signed_used: number };
    return {
      generatedRemaining: Math.max(0, LIMIT_GENERATED - (row.generated_used ?? 0)),
      uploadedRemaining: Math.max(0, LIMIT_UPLOADED - (row.uploaded_used ?? 0)),
      signedRemaining: Math.max(0, LIMIT_SIGN_TRANSACTIONS - (row.signed_used ?? 0)),
    };
  } catch {
    return fallback;
  }
}

// ── Sign transaction (send-to-sign) requests — 72h rolling window ──────────
// Business rule changed from "2 per calendar day" to "2 within any rolling
// 72-hour window" — see supabase_signature_72h_migration.sql. Backed by an
// event-log table (one row per request) counted with a sliding window,
// which a simple reset-at-midnight counter can't represent.
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

