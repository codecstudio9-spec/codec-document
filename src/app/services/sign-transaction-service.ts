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
  requireBiometric:   boolean;
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
  recipient_signature_placement?: { x: number; y: number } | null;
  recipient_selfie?:      string;
  recipient_id_photo?:    string;
  recipient_ip?:          string;
  esign_consent_accepted?: boolean;
  recipient_biometric_credential_id?: string;
  recipient_biometric_device_label?:  string;
  recipient_biometric_aaguid?:        string;
  recipient_biometric_verified_at?:   string;
  sender_signature?:      string;
  signed_at?:             string;
  viewed_at?:             string | null;
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

/** Lists the caller's own sent/created transactions — direct `.select()`
 * works here (unlike getSignTransaction above) because RLS policy
 * "tx_select_own" already scopes it to `auth.uid()::text = creator_id`
 * (see supabase_lockdown_public_read_migration.sql), so there's no risk of
 * leaking another user's rows the way an unrestricted SELECT would. Used
 * to power a "pick one of your documents" picker (e.g. the AI review
 * page) — trimmed to the fields buildGuestDocumentContent() needs plus
 * enough to label each option, never selfies/ID photos. */
export async function listMySentTransactions(userId: string, limit = 25): Promise<SignTransaction[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('sign_transactions')
    .select('id, document_type, document_data, status, created_at')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as SignTransaction[];
}

export interface VerifiedTransaction {
  found:         boolean;
  status:        TxStatus | null;
  document_type: string | null;
  completed_at:  string | null;
  created_at:    string | null;
}

/** Public "is this document real" check for the /verificar page — goes
 * through verify_sign_transaction(uuid), a narrower RPC than
 * get_sign_transaction_public: it returns only status/document_type/dates,
 * never selfies, ID photos, IPs or signature images, so it's safe to expose
 * to anyone who has a transaction id printed on a document's audit page. */
export async function verifySignTransaction(id: string): Promise<VerifiedTransaction> {
  const { data, error } = await supabase
    .rpc('verify_sign_transaction', { p_id: id })
    .maybeSingle();
  if (error || !data) return { found: false, status: null, document_type: null, completed_at: null, created_at: null };
  return data as VerifiedTransaction;
}

/** Marks a signed transaction as "seen" by its creator — the only signal
 * the unread-notifications badge uses. Called the moment the sender opens
 * a completed transaction from the Firmas/Notificaciones list. Uses the
 * regular (authenticated) client directly: tx_update's RLS policy is
 * already permissive for UPDATE, and there's nothing to read back. */
export async function markTransactionViewed(id: string): Promise<void> {
  await supabase.from('sign_transactions').update({ viewed_at: new Date().toISOString() }).eq('id', id);
}

export async function markAllTransactionsViewed(userId: string): Promise<void> {
  await supabase
    .from('sign_transactions')
    .update({ viewed_at: new Date().toISOString() })
    .eq('creator_id', userId)
    .eq('status', 'completed')
    .is('viewed_at', null);
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
      () => {
        // Refetch the full row instead of trusting the realtime payload
        // directly — large base64 identity-evidence columns (a scanned ID
        // photo can be several hundred KB of text) aren't reliably
        // delivered whole over postgres_changes, which was silently
        // dropping selfie/ID/biometric evidence from the eventual
        // downloaded PDF for documents that had it. A plain RPC call has
        // no such size constraint.
        void getSignTransaction(txId).then((tx) => { if (tx) onChange(tx); });
      },
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
        placement: tx.recipient_signature_placement ?? null,
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

    if (tx.recipient_biometric_verified_at && tx.recipient_biometric_device_label) {
      sessionStorage.setItem('identityBiometric', JSON.stringify({
        deviceLabel: tx.recipient_biometric_device_label,
        verifiedAt: tx.recipient_biometric_verified_at,
        credentialIdHash: (tx.recipient_biometric_credential_id ?? '').slice(0, 16),
      }));
    } else {
      sessionStorage.removeItem('identityBiometric');
    }

    sessionStorage.setItem('isPurchased', 'true');
  } catch { /* sessionStorage quota */ }
}