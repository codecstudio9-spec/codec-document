-- Bug real encontrado 2026-09-20: handleRemoveExtraSigner en
-- electronic-signature-page.tsx solo quitaba al firmante de la lista en
-- pantalla (setExtraSigners), pero la fila en `signers` seguía en
-- status='pending' en la base de datos. finalize_document (ver
-- supabase_FIX_finalize_document_multi_signer.sql) solo marca el
-- documento 'completed' cuando NO queda ninguna fila 'pending' en
-- `signers` para ese documento — así que "quitar" a un firmante extra
-- que el creador ya no quiere esperar dejaba el documento bloqueado en
-- 'pending' PARA SIEMPRE, aunque todos los demás sí firmaran.
--
-- cancel_signer borra la fila de `signers` (y su signing_link asociado,
-- si tiene uno) para que finalize_document deje de esperarla. Mismo
-- patrón de seguridad que create_signer/try_complete_signer_once: RPC
-- SECURITY DEFINER abierta a anon/authenticated, sin política de acceso
-- directo a la tabla (es PII de firma: nombre + correo).
CREATE OR REPLACE FUNCTION public.cancel_signer(p_signer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.signing_links WHERE signer_id = p_signer_id;
  DELETE FROM public.signers WHERE id = p_signer_id AND status = 'pending';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_signer(uuid) TO anon, authenticated;
