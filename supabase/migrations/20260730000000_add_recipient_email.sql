-- Optional email address for the guest signer, so we can send them (and the
-- document creator) a "your document was signed" notification — see
-- supabase/functions/notify-completion. Nullable/optional: a signer who
-- skips this field simply doesn't get a copy emailed to them; nothing else
-- about the signing flow depends on it.
ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS recipient_email text;

CREATE OR REPLACE FUNCTION public.complete_sign_transaction(
  p_id              uuid,
  p_expected_status text,
  p_payload         jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.sign_transactions
  SET
    status                 = COALESCE(p_payload->>'status', status),
    recipient_signature    = COALESCE(p_payload->>'recipient_signature', recipient_signature),
    recipient_selfie       = COALESCE(p_payload->>'recipient_selfie', recipient_selfie),
    recipient_id_photo     = COALESCE(p_payload->>'recipient_id_photo', recipient_id_photo),
    recipient_ip           = COALESCE(p_payload->>'recipient_ip', recipient_ip),
    recipient_email        = COALESCE(p_payload->>'recipient_email', recipient_email),
    esign_consent_accepted = COALESCE((p_payload->>'esign_consent_accepted')::boolean, esign_consent_accepted),
    signed_at              = COALESCE((p_payload->>'signed_at')::timestamptz, signed_at)
  WHERE id = p_id
    AND status = p_expected_status;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sign_transaction(uuid, text, jsonb) TO anon, authenticated;
