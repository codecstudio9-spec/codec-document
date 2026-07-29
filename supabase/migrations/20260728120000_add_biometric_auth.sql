-- Biometric authentication (WebAuthn/FIDO2) for signers.
--
-- The recipient_biometric_* columns hold only the *cryptographic proof*
-- that a platform authenticator (Touch ID / Face ID / Windows Hello /
-- Android fingerprint) verified the signer locally — never a fingerprint
-- image or any raw biometric template. Codec Document's servers never
-- receive that data; WebAuthn's whole point is that it never leaves the
-- signer's device.
ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS recipient_biometric_credential_id text,
  ADD COLUMN IF NOT EXISTS recipient_biometric_public_key    text,
  ADD COLUMN IF NOT EXISTS recipient_biometric_aaguid        text,
  ADD COLUMN IF NOT EXISTS recipient_biometric_device_label  text,
  ADD COLUMN IF NOT EXISTS recipient_biometric_verified_at   timestamptz,
  ADD COLUMN IF NOT EXISTS recipient_biometric_counter       bigint DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recipient_biometric_rp_id         text;

-- Defense in depth: the existing "tx_update" RLS policy on sign_transactions
-- is USING (true), so any anon/authenticated client can currently .update()
-- any column on this table directly (that's how recipient_signature/selfie/
-- id_photo get written from guest-sign-page.tsx). Biometric fields must NOT
-- be writable that way — otherwise anyone could fake "verified" from
-- devtools without ever completing a WebAuthn ceremony, which would make
-- the whole feature legally worthless. Only the webauthn Edge Function
-- (using the service_role key, which bypasses RLS and column grants
-- entirely) is allowed to write these columns.
REVOKE UPDATE (
  recipient_biometric_credential_id,
  recipient_biometric_public_key,
  recipient_biometric_aaguid,
  recipient_biometric_device_label,
  recipient_biometric_verified_at,
  recipient_biometric_counter,
  recipient_biometric_rp_id
) ON public.sign_transactions FROM anon, authenticated;

-- Single-use WebAuthn registration challenges. Never read or written by
-- the client directly — only via the webauthn Edge Function's service_role
-- client, so RLS is enabled with no policies at all (deny-all for anon/
-- authenticated; service_role bypasses RLS regardless).
CREATE TABLE IF NOT EXISTS public.webauthn_challenges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_id      uuid NOT NULL REFERENCES public.sign_transactions(id) ON DELETE CASCADE,
  challenge  text NOT NULL,
  used       boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.webauthn_challenges ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS webauthn_challenges_tx_id_idx ON public.webauthn_challenges (tx_id);
