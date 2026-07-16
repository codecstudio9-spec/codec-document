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
  // Goes through a SECURITY DEFINER RPC — an anonymous (not-logged-in)
  // creator has creator_id = NULL, which never matches the "tx_select_own"
  // RLS policy (auth.uid()::text = creator_id), so
  // `.insert(...).select('id').single()` would fail to read the row back.
  const { data, error } = await supabase.rpc('create_sign_transaction', { p_payload: payload });
  if (error) throw new Error(error.message);
  return data as string;
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

export function parseIdEvidencePayload(value?: string): { front?: string; back?: string } {
  if (!value) return {};
  const trimmed = value.trim();
  if (!trimmed.startsWith('{')) return { front: value };
  try {
    const parsed = JSON.parse(trimmed) as { front?: string; back?: string; idFront?: string; idBack?: string };
    return {
      front: parsed.front || parsed.idFront || undefined,
      back: parsed.back || parsed.idBack || undefined,
    };
  } catch {
    return { front: value };
  }
}

/**
 * Stashes a completed transaction's data into sessionStorage in the exact
 * shape preview-page.tsx reads to compile the final PDF (recipient
 * signature included) — the caller navigates to `/preview/${tx.document_type}`
 * right after calling this. This is the ONLY place the recipient's
 * signature actually gets stamped onto the document.
 *
 * Extracted out of document-generator-page.tsx's handleDownloadSignedDoc
 * (which only worked if the sender was still on that exact page, with a
 * live realtime subscription, at the moment the recipient finished
 * signing) so the Firmas tab can reuse the same, already-working
 * compilation step for a transaction that completed after the sender
 * left — the common case, since nothing else notifies them it happened.
 */
export function stashSignedTransactionForDownload(tx: SignTransaction, language: 'en' | 'es'): void {
  try {
    sessionStorage.setItem('documentData', JSON.stringify(tx.document_data));
    sessionStorage.setItem('documentType', tx.document_type);
    sessionStorage.removeItem('documentBranding');

    if (tx.recipient_signature) {
      const recipientAsSigner = [{
        id: 'recipient',
        name: language === 'en' ? 'Recipient' : 'Destinatario',
        role: language === 'en' ? 'Signer' : 'Firmante',
        token: '',
        sigDataUrl: tx.recipient_signature,
        placement: null,
      }];
      sessionStorage.setItem('coSigners', JSON.stringify(recipientAsSigner));
    } else {
      sessionStorage.removeItem('coSigners');
    }

    if (tx.sender_signature) {
      sessionStorage.setItem('userSignatureDataUrl', tx.sender_signature);
    } else {
      sessionStorage.removeItem('userSignatureDataUrl');
    }

    if (tx.recipient_selfie) {
      sessionStorage.setItem('identitySelfie', tx.recipient_selfie);
    } else {
      sessionStorage.removeItem('identitySelfie');
    }

    if (tx.recipient_id_photo) {
      const parsedId = parseIdEvidencePayload(tx.recipient_id_photo);
      if (parsedId.front) {
        sessionStorage.setItem('identityIdDocFront', parsedId.front);
        sessionStorage.setItem('identityIdDoc', parsedId.front);
      } else {
        sessionStorage.removeItem('identityIdDocFront');
        sessionStorage.removeItem('identityIdDoc');
      }
      if (parsedId.back) sessionStorage.setItem('identityIdDocBack', parsedId.back);
      else sessionStorage.removeItem('identityIdDocBack');
    } else {
      sessionStorage.removeItem('identityIdDocFront');
      sessionStorage.removeItem('identityIdDocBack');
      sessionStorage.removeItem('identityIdDoc');
    }

    sessionStorage.setItem('isPurchased', 'true');
  } catch { /* sessionStorage quota */ }
}