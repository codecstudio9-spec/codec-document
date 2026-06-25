/**
 * Daily usage limits — backed by the `user_limits` Supabase table.
 *
 * Table schema (run once in Supabase SQL Editor if column missing):
 *   user_id                          uuid  PRIMARY KEY
 *   free_documents_generated_today   integer  DEFAULT 0
 *   free_documents_uploaded_today    integer  DEFAULT 0
 *   free_sign_transactions_today     integer  DEFAULT 0
 *   updated_at                       timestamptz DEFAULT now()
 *
 * Migration:
 *   ALTER TABLE public.user_limits
 *     ADD COLUMN IF NOT EXISTS free_sign_transactions_today integer NOT NULL DEFAULT 0;
 *
 * Counters reset automatically when updated_at is from a previous calendar day (UTC).
 *
 * Limits:
 *   Generated (AI creator)      → 2 / day
 *   Uploaded  (own PDF)         → 3 / day
 *   Sign transactions (send)    → 2 / day
 */

import { supabase } from '../../lib/supabase';

const LIMIT_GENERATED         = 2;
const LIMIT_UPLOADED          = 3;
const LIMIT_SIGN_TRANSACTIONS = 2;

type LimitsRow = {
  free_documents_generated_today: number;
  free_documents_uploaded_today: number;
  free_sign_transactions_today?: number;
  updated_at: string;
};

async function fetchRow(userId: string): Promise<LimitsRow | null> {
  const { data } = await supabase
    .from('user_limits')
    .select('free_documents_generated_today, free_documents_uploaded_today, free_sign_transactions_today, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  return data as LimitsRow | null;
}

function isToday(isoTimestamp: string | null | undefined): boolean {
  if (!isoTimestamp) return false;
  const today = new Date().toISOString().slice(0, 10);
  return isoTimestamp.slice(0, 10) === today;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Generated documents (AI document creator) ────────────────────────────────

export async function checkGeneratedDocLimit(
  userId: string,
  isPremium = false,
): Promise<{ allowed: boolean; remaining: number }> {
  if (isPremium) return { allowed: true, remaining: 999 };
  try {
    const row = await fetchRow(userId);
    if (!row || !isToday(row.updated_at)) return { allowed: true, remaining: LIMIT_GENERATED };
    const used = row.free_documents_generated_today ?? 0;
    const remaining = Math.max(0, LIMIT_GENERATED - used);
    return { allowed: remaining > 0, remaining };
  } catch {
    return { allowed: true, remaining: LIMIT_GENERATED }; // fail open
  }
}

export async function incrementGeneratedDoc(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const row = await fetchRow(userId);
    const now = new Date().toISOString();

    if (!row) {
      await supabase.from('user_limits').insert({
        user_id: userId,
        free_documents_generated_today: 1,
        free_documents_uploaded_today: 0,
        updated_at: now,
      });
      return;
    }

    const sameDay = isToday(row.updated_at);
    await supabase.from('user_limits').update({
      free_documents_generated_today: sameDay ? (row.free_documents_generated_today ?? 0) + 1 : 1,
      free_documents_uploaded_today:  sameDay ? (row.free_documents_uploaded_today  ?? 0)     : 0,
      updated_at: now,
    }).eq('user_id', userId);
  } catch { /* non-fatal */ }
}

// ── Uploaded documents (external PDF uploader / e-signature flow) ─────────────

export async function checkUploadedDocLimit(
  userId: string,
  isPremium = false,
): Promise<{ allowed: boolean; remaining: number }> {
  if (isPremium) return { allowed: true, remaining: 999 };
  try {
    const row = await fetchRow(userId);
    if (!row || !isToday(row.updated_at)) return { allowed: true, remaining: LIMIT_UPLOADED };
    const used = row.free_documents_uploaded_today ?? 0;
    const remaining = Math.max(0, LIMIT_UPLOADED - used);
    return { allowed: remaining > 0, remaining };
  } catch {
    return { allowed: true, remaining: LIMIT_UPLOADED }; // fail open
  }
}

export async function incrementUploadedDoc(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const row = await fetchRow(userId);
    const now = new Date().toISOString();

    if (!row) {
      await supabase.from('user_limits').insert({
        user_id: userId,
        free_documents_generated_today: 0,
        free_documents_uploaded_today: 1,
        updated_at: now,
      });
      return;
    }

    const sameDay = isToday(row.updated_at);
    await supabase.from('user_limits').update({
      free_documents_generated_today: sameDay ? (row.free_documents_generated_today ?? 0)     : 0,
      free_documents_uploaded_today:  sameDay ? (row.free_documents_uploaded_today  ?? 0) + 1 : 1,
      updated_at: now,
    }).eq('user_id', userId);
  } catch { /* non-fatal */ }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Ensure a row exists for this user (call on sign-in). */
export async function ensureUserLimitsRow(userId: string): Promise<void> {
  await supabase.from('user_limits').upsert(
    {
      user_id: userId,
      free_documents_generated_today: 0,
      free_documents_uploaded_today: 0,
      free_sign_transactions_today: 0,
      updated_at: todayStr(),
    },
    { onConflict: 'user_id', ignoreDuplicates: true },
  );
}

// ── Sign transactions (send-to-sign flow) ────────────────────────────────────

export async function checkSignTransactionLimit(
  userId: string,
  isPremium = false,
): Promise<{ allowed: boolean; remaining: number }> {
  if (isPremium) return { allowed: true, remaining: 999 };
  try {
    const row = await fetchRow(userId);
    if (!row || !isToday(row.updated_at)) return { allowed: true, remaining: LIMIT_SIGN_TRANSACTIONS };
    const used = row.free_sign_transactions_today ?? 0;
    const remaining = Math.max(0, LIMIT_SIGN_TRANSACTIONS - used);
    return { allowed: remaining > 0, remaining };
  } catch {
    return { allowed: true, remaining: LIMIT_SIGN_TRANSACTIONS };
  }
}

export async function incrementSignTransaction(userId: string): Promise<void> {
  if (!userId) return;
  try {
    const row = await fetchRow(userId);
    const now = new Date().toISOString();

    if (!row) {
      await supabase.from('user_limits').insert({
        user_id: userId,
        free_documents_generated_today: 0,
        free_documents_uploaded_today: 0,
        free_sign_transactions_today: 1,
        updated_at: now,
      });
      return;
    }

    const sameDay = isToday(row.updated_at);
    await supabase.from('user_limits').update({
      free_documents_generated_today:  sameDay ? (row.free_documents_generated_today  ?? 0)     : 0,
      free_documents_uploaded_today:   sameDay ? (row.free_documents_uploaded_today   ?? 0)     : 0,
      free_sign_transactions_today:    sameDay ? (row.free_sign_transactions_today    ?? 0) + 1 : 1,
      updated_at: now,
    }).eq('user_id', userId);
  } catch { /* non-fatal */ }
}
