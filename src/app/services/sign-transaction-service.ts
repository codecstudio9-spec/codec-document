/**
 * Sign Transaction Service
 *
 * -- Run this migration in Supabase SQL Editor:
 * ALTER TABLE public.sign_transactions
 *   ADD COLUMN IF NOT EXISTS sender_signature text;
 *
 * Run once in Supabase SQL Editor:
 *
 * CREATE TABLE IF NOT EXISTS public.sign_transactions (
 *   id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   creator_id             text,
 *   document_type          text NOT NULL,
 *   document_data          jsonb NOT NULL DEFAULT '{}'::jsonb,
 *   intent                 text NOT NULL,
 *   security_config        jsonb NOT NULL DEFAULT '{}'::jsonb,
 *   status                 text NOT NULL DEFAULT 'pending',
 *   recipient_signature    text,
 *   recipient_selfie       text,
 *   recipient_id_photo     text,
 *   recipient_ip           text,
 *   esign_consent_accepted boolean DEFAULT false,
 *   signed_at              timestamptz,
 *   created_at             timestamptz NOT NULL DEFAULT now()
 * );
 * ALTER TABLE public.sign_transactions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "tx_insert" ON public.sign_transactions FOR INSERT WITH CHECK (true);
 * CREATE POLICY "tx_update" ON public.sign_transactions FOR UPDATE USING (true);
 *
 * Do NOT add a public `USING (true)` SELECT policy — this table stores
 * recipient_selfie / recipient_id_photo (biometric + government ID data).
 * Public reads go through the get_sign_transaction_public(uuid) RPC and
 * the owner-scoped tx_select_own policy instead — see
 * supabase_lockdown_public_read_migration.sql.
 */

import { supabase } from '../../lib/supabase';

export type SigningIntent = 'fill_send' | 'fill_self' | 'blank_send' | 'fill_approve';
export type TxStatus     =
  | 'draft'
  | 'pending'
  | 'sender_signed'
  | 'pending_recipient'
  | 'signing'
  | 'completed'
  | 'cancelled'
  | 'expired';

const ACTIVE_LINK_STATUSES = new Set<TxStatus>([
  'pending_recipient',
  'pending',
  'sender_signed',
  'signing',
]);

const TERMINAL_STATUSES = new Set<TxStatus>([
  'completed',
  'cancelled',
  'expired',
]);

export function isActiveTxStatus(status: string | null | undefined): boolean {
  return ACTIVE_LINK_STATUSES.has((status ?? 'pending') as TxStatus);
}

export function isTerminalTxStatus(status: string | null | undefined): boolean {
  return TERMINAL_STATUSES.has((status ?? '') as TxStatus);
}

export interface SecurityConfig {
  standardSignature:  boolean;
  requireSelfie:      boolean;
  requireIdPhoto:     boolean;
  requireSmsOtp:      boolean;
  requireEsignConsent: boolean;
  advancedAuditTrail: boolean;
}

export interface SignTransaction {
  id:                     string;
  creator_id:             string | null;
  document_type:          string;
  document_data:          Record<string, unknown>;
  intent:                 SigningIntent;
  security_config:        SecurityConfig;
  status:                 TxStatus;
  recipient_signature?:   string;
  recipient_selfie?:      string;
  recipient_id_photo?:    string;
  recipient_ip?:          string;
  esign_consent_accepted?: boolean;
  sender_signature?:      string;
  signed_at?:             string;
  created_at:             string;
}

type CreatePayload = Omit<SignTransaction, 'id' | 'created_at'>;

export async function createSignTransaction(payload: CreatePayload): Promise<string> {
  const { data, error } = await supabase
    .from('sign_transactions')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return (data as any).id as string;
}

export async function getSignTransaction(id: string): Promise<SignTransaction | null> {
  // Goes through a SECURITY DEFINER RPC — see supabase_lockdown_public_read_migration.sql
  // for why a raw `.select('*')` here would let anyone dump every user's
  // sign_transactions row (including selfies and ID photos).
  const { data, error } = await supabase
    .rpc('get_sign_transaction_public', { p_id: id })
    .maybeSingle();
  if (error || !data) return null;
  return data as SignTransaction;
}

export async function updateSignTransaction(
  id: string,
  updates: Partial<SignTransaction>,
): Promise<void> {
  await supabase.from('sign_transactions').update(updates).eq('id', id);
}

export function subscribeToTransaction(
  txId: string,
  onChange: (tx: SignTransaction) => void,
): () => void {
  const channel = supabase
    .channel(`tx-${txId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sign_transactions', filter: `id=eq.${txId}` },
      (payload) => onChange(payload.new as SignTransaction),
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}