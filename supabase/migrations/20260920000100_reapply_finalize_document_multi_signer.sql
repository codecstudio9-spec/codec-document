-- Re-aplica finalize_document/get_signer_status como migración versionada.
--
-- Estas dos funciones vivían solo en supabase_FIX_finalize_document_multi_
-- signer.sql (un archivo suelto en la raíz, pensado para correr UNA VEZ a
-- mano desde el Dashboard → SQL Editor), no en supabase/migrations — así
-- que no había forma confiable de confirmar, solo con el historial de
-- migraciones, si de verdad se había ejecutado contra el proyecto real.
-- CREATE OR REPLACE es idempotente: reaplicar esto no cambia nada si ya
-- estaba (deja la función exactamente igual), y la corrige si por
-- cualquier razón el archivo suelto nunca llegó a correr.
--
-- Qué hace finalize_document: solo marca documents.status = 'completed'
-- cuando ya no queda ninguna fila 'pending' en `signers` para ese
-- documento — antes marcaba 'completed' incondicionalmente, así que un
-- documento de 3+ firmantes se daba por firmado (banner de éxito
-- incluido) en cuanto firmaba el segundo, sin esperar al tercero.

CREATE OR REPLACE FUNCTION public.finalize_document(
  p_document_id uuid,
  p_signed_pdf_url text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
  v_all_signed boolean;
BEGIN
  v_all_signed := NOT EXISTS (
    SELECT 1 FROM public.signers
    WHERE document_id = p_document_id AND status = 'pending'
  );

  UPDATE public.documents
  SET signed_pdf_url = p_signed_pdf_url,
      status = CASE WHEN v_all_signed THEN 'completed' ELSE status END
  WHERE id = p_document_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.finalize_document(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_signer_status(p_signer_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status FROM public.signers WHERE id = p_signer_id LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_signer_status(uuid) TO anon, authenticated;
