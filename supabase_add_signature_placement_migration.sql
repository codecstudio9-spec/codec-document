-- ============================================================
-- CODEC DOCUMENT — Guardar dónde el firmante coloca su firma (estilo Adobe)
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- Hasta ahora sign_transactions no guardaba NINGUNA posición para la firma
-- del destinatario — el PDF final siempre la estampaba en una posición fija
-- (donde el texto dice "Firma:", o en una rejilla por defecto). Esta
-- migración agrega la columna que necesita sign-transaction-page.tsx para
-- que el firmante pueda arrastrar su firma a la posición exacta que quiera
-- antes de confirmar, y complete_sign_transaction() para que esa posición
-- se guarde junto con la firma.
-- ============================================================

ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS recipient_signature_placement jsonb;

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
    status                        = COALESCE(p_payload->>'status', status),
    recipient_signature           = COALESCE(p_payload->>'recipient_signature', recipient_signature),
    recipient_signature_placement = COALESCE(p_payload->'recipient_signature_placement', recipient_signature_placement),
    recipient_selfie              = COALESCE(p_payload->>'recipient_selfie', recipient_selfie),
    recipient_id_photo            = COALESCE(p_payload->>'recipient_id_photo', recipient_id_photo),
    recipient_ip                  = COALESCE(p_payload->>'recipient_ip', recipient_ip),
    esign_consent_accepted        = COALESCE((p_payload->>'esign_consent_accepted')::boolean, esign_consent_accepted),
    signed_at                     = COALESCE((p_payload->>'signed_at')::timestamptz, signed_at)
  WHERE id = p_id
    AND status = p_expected_status;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sign_transaction(uuid, text, jsonb) TO anon, authenticated;
