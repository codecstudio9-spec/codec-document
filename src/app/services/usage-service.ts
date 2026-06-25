/**
 * User usage tracking service — uploads, documents, and signatures.
 *
 * Free tier limits:
 *   - 3 PDF uploads per day         (checked on upload)
 *   - 2 signed+downloaded docs/day  (checked on compilation)
 *
 * Run this SQL once in Supabase SQL Editor to add the uploads columns:
 *
 * ALTER TABLE public.user_usage
 *   ADD COLUMN IF NOT EXISTS sigs_today       integer NOT NULL DEFAULT 0,
 *   ADD COLUMN IF NOT EXISTS sig_day_start    date,
 *   ADD COLUMN IF NOT EXISTS uploads_today    integer NOT NULL DEFAULT 0,
 *   ADD COLUMN IF NOT EXISTS upload_day_start date;
 */

import { supabase } from '../../lib/supabase';

const FREE_DOCS_PER_DAY    = 2; // signed + downloaded completions per day
const FREE_UPLOADS_PER_DAY = 3; // PDF uploads per day
const FREE_SIGS_PER_DAY    = 2; // kept for reference / legacy checks
const SIG_COOLDOWN_MS = 24 * 60 * 60 * 1000; // fallback for pre-migration rows

export interface DocUsageStatus {
  allowed: boolean;
  remaining: number;
  nextWindowAt: Date | null;
}

export interface SigUsageStatus {
  allowed: boolean;
  nextFreeAt: Date | null;
}

type UsageRow = {
  first_doc_granted: boolean;
  doc_window_start: string;
  docs_in_window: number;
  last_signature_at: string | null;
  sigs_today?: number;
  sig_day_start?: string | null;
  uploads_today?: number;
  upload_day_start?: string | null;
};

async function fetchUsageRow(userId: string): Promise<UsageRow | null> {
  const { data } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as UsageRow | null;
}

/** Returns midnight UTC of the next calendar day. */
function nextMidnightUTC(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── Documents (1 free per calendar day) ──────────────────────────────────────

export async function checkDocumentUsage(userId: string, isPremium = false): Promise<DocUsageStatus> {
  if (isPremium) return { allowed: true, remaining: 999, nextWindowAt: null };

  try {
    const row = await fetchUsageRow(userId);
    if (!row) return { allowed: true, remaining: FREE_DOCS_PER_DAY, nextWindowAt: null };

    const todayStr = new Date().toISOString().slice(0, 10);
    const windowDay = new Date(row.doc_window_start).toISOString().slice(0, 10);

    if (windowDay !== todayStr) {
      // New day — fresh quota
      return { allowed: true, remaining: FREE_DOCS_PER_DAY, nextWindowAt: null };
    }

    const used = row.docs_in_window ?? 0;
    const remaining = Math.max(0, FREE_DOCS_PER_DAY - used);
    return {
      allowed: remaining > 0,
      remaining,
      nextWindowAt: remaining === 0 ? nextMidnightUTC() : null,
    };
  } catch {
    return { allowed: true, remaining: FREE_DOCS_PER_DAY, nextWindowAt: null };
  }
}

export async function recordDocumentCreation(userId: string): Promise<void> {
  try {
    const row = await fetchUsageRow(userId);
    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);

    if (!row) {
      await supabase.from('user_usage').insert({
        user_id: userId,
        first_doc_granted: true,
        doc_window_start: now,
        docs_in_window: 1,
        updated_at: now,
      });
      return;
    }

    const windowDay = new Date(row.doc_window_start).toISOString().slice(0, 10);
    if (windowDay !== todayStr) {
      await supabase.from('user_usage')
        .update({ doc_window_start: now, docs_in_window: 1, first_doc_granted: true, updated_at: now })
        .eq('user_id', userId);
    } else {
      await supabase.from('user_usage')
        .update({ docs_in_window: (row.docs_in_window ?? 0) + 1, first_doc_granted: true, updated_at: now })
        .eq('user_id', userId);
    }
  } catch {
    // Non-blocking failure
  }
}

// ─── Signatures (2 free per calendar day) ─────────────────────────────────────

export async function checkSignatureUsage(userId: string, isPremium = false): Promise<SigUsageStatus> {
  if (isPremium) return { allowed: true, nextFreeAt: null };

  try {
    const row = await fetchUsageRow(userId);
    if (!row) return { allowed: true, nextFreeAt: null };

    const todayStr = new Date().toISOString().slice(0, 10);

    // New column-based check (requires migration)
    if (row.sigs_today !== undefined && row.sigs_today !== null) {
      const dayOfRecord = row.sig_day_start
        ? String(row.sig_day_start).slice(0, 10)
        : null;
      const count = dayOfRecord === todayStr ? (row.sigs_today ?? 0) : 0;

      if (count < FREE_SIGS_PER_DAY) return { allowed: true, nextFreeAt: null };
      return { allowed: false, nextFreeAt: nextMidnightUTC() };
    }

    // Fallback: old single-signature 24h check
    if (!row.last_signature_at) return { allowed: true, nextFreeAt: null };
    const last = new Date(row.last_signature_at).getTime();
    const elapsed = Date.now() - last;
    if (elapsed >= SIG_COOLDOWN_MS) return { allowed: true, nextFreeAt: null };
    return { allowed: false, nextFreeAt: new Date(last + SIG_COOLDOWN_MS) };
  } catch {
    return { allowed: true, nextFreeAt: null };
  }
}

export async function recordSignatureUse(userId: string): Promise<void> {
  try {
    const row = await fetchUsageRow(userId);
    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);

    const dayOfRecord = row?.sig_day_start
      ? String(row.sig_day_start).slice(0, 10)
      : null;
    const currentCount = dayOfRecord === todayStr ? (row?.sigs_today ?? 0) : 0;

    if (!row) {
      await supabase.from('user_usage').insert({
        user_id: userId,
        first_doc_granted: false,
        last_signature_at: now,
        sigs_today: 1,
        sig_day_start: todayStr,
        updated_at: now,
      });
      return;
    }

    // Always update last_signature_at; try to update sig counters too
    try {
      await supabase.from('user_usage')
        .update({
          last_signature_at: now,
          sigs_today: currentCount + 1,
          sig_day_start: todayStr,
          updated_at: now,
        })
        .eq('user_id', userId);
    } catch {
      // Fallback if new columns don't exist yet (migration not run)
      await supabase.from('user_usage')
        .update({ last_signature_at: now, updated_at: now })
        .eq('user_id', userId);
    }
  } catch {
    // Non-blocking failure
  }
}

/** Call on SIGNED_IN to ensure the row exists. */
export function ensureUserUsageRow(userId: string): void {
  void supabase.from('user_usage').upsert(
    { user_id: userId },
    { onConflict: 'user_id', ignoreDuplicates: true },
  );
}

// ─── Uploads (3 free per calendar day) ────────────────────────────────────────

export async function checkUploadUsage(userId: string, isPremium = false): Promise<DocUsageStatus> {
  if (isPremium) return { allowed: true, remaining: 999, nextWindowAt: null };

  try {
    const row = await fetchUsageRow(userId);
    if (!row) return { allowed: true, remaining: FREE_UPLOADS_PER_DAY, nextWindowAt: null };

    const todayStr = new Date().toISOString().slice(0, 10);
    const dayOfRecord = row.upload_day_start
      ? String(row.upload_day_start).slice(0, 10)
      : null;
    const count = dayOfRecord === todayStr ? (row.uploads_today ?? 0) : 0;
    const remaining = Math.max(0, FREE_UPLOADS_PER_DAY - count);
    return {
      allowed: remaining > 0,
      remaining,
      nextWindowAt: remaining === 0 ? nextMidnightUTC() : null,
    };
  } catch {
    return { allowed: true, remaining: FREE_UPLOADS_PER_DAY, nextWindowAt: null };
  }
}

export async function recordUploadUse(userId: string): Promise<void> {
  try {
    const row = await fetchUsageRow(userId);
    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);

    const dayOfRecord = row?.upload_day_start
      ? String(row.upload_day_start).slice(0, 10)
      : null;
    const currentCount = dayOfRecord === todayStr ? (row?.uploads_today ?? 0) : 0;

    if (!row) {
      await supabase.from('user_usage').insert({
        user_id: userId,
        first_doc_granted: false,
        uploads_today: 1,
        upload_day_start: todayStr,
        updated_at: now,
      });
      return;
    }

    await supabase.from('user_usage')
      .update({ uploads_today: currentCount + 1, upload_day_start: todayStr, updated_at: now })
      .eq('user_id', userId);
  } catch {
    // Non-blocking failure
  }
}
