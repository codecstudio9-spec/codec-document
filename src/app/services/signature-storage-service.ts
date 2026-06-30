/**
 * Saved-signature & mobile-signing service.
 *
 * Run this SQL once in Supabase SQL Editor:
 *
 * -- Saved signature on user profile
 * ALTER TABLE public.users ADD COLUMN IF NOT EXISTS saved_signature_url text;
 *
 * -- Mobile quick-sign tokens
 * CREATE TABLE IF NOT EXISTS public.mobile_signatures (
 *   id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   token      text NOT NULL UNIQUE,
 *   sig_data   text,
 *   created_at timestamptz NOT NULL DEFAULT now()
 * );
 * ALTER TABLE public.mobile_signatures ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "mobile_sig_select" ON public.mobile_signatures FOR SELECT USING (true);
 * CREATE POLICY "mobile_sig_insert" ON public.mobile_signatures FOR INSERT WITH CHECK (true);
 * CREATE POLICY "mobile_sig_update" ON public.mobile_signatures FOR UPDATE USING (true);
 */

import { supabase } from '../../lib/supabase';

// ─── Saved Signature ─────────────────────────────────────────────────────────

export async function getSavedSignature(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('users')
    .select('saved_signature_url')
    .eq('id', userId)
    .single();
  return (data as any)?.saved_signature_url ?? null;
}

export async function saveSavedSignature(userId: string, dataUrl: string): Promise<void> {
  await supabase
    .from('users')
    .update({ saved_signature_url: dataUrl })
    .eq('id', userId);
}

export async function clearSavedSignature(userId: string): Promise<void> {
  await supabase
    .from('users')
    .update({ saved_signature_url: null })
    .eq('id', userId);
}

// ─── Mobile Quick-Sign ───────────────────────────────────────────────────────

export async function createMobileSignToken(): Promise<string> {
  const token = crypto.randomUUID();
  const { error } = await supabase.from('mobile_signatures').insert({ token });
  if (error) throw new Error(`createMobileSignToken: ${error.message}`);
  return token;
}

export async function pollMobileSignature(token: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('mobile_signatures')
    .select('sig_data')
    .eq('token', token)
    .single();
  if (error) {
    console.warn(`pollMobileSignature failed for token ${token}:`, error.message);
    return null;
  }
  return (data as any)?.sig_data ?? null;
}

export async function submitMobileSignature(token: string, sigData: string): Promise<void> {
  const { data, error } = await supabase
    .from('mobile_signatures')
    .update({ sig_data: sigData })
    .eq('token', token)
    .select('id');

  if (error) throw new Error(`submitMobileSignature: ${error.message}`);
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('submitMobileSignature: token not found or already expired');
  }
}

export async function deleteMobileSignToken(token: string): Promise<void> {
  await supabase.from('mobile_signatures').delete().eq('token', token);
}
