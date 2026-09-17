-- CODEC DOCUMENT — finalize_document ahora espera a TODOS los firmantes
--
-- Contexto: finalize_document(p_document_id, p_signed_pdf_url) ponía
-- status = 'completed' SIEMPRE, sin importar cuántos firmantes había
-- invitado el creador. Para un documento de 2 (creador + 1 invitado) eso
-- coincidía por accidente con "ya firmaron todos", porque solo hay un
-- invitado que puede terminar. En cuanto un documento tiene VARIOS
-- invitados (ej.: 3 firmantes de un contrato de boda), guest-sign-page.tsx
-- llama finalize_document cada vez que CUALQUIER invitado termina — el
-- documento se marcaba "completed" (y su banner "¡Documento firmado con
-- éxito!", y su listado en Mis Documentos como firmado) en cuanto firmaba
-- el SEGUNDO de tres, sin haber firmado el tercero todavía.
--
-- Este archivo reemplaza esa función para que solo marque 'completed'
-- cuando no queda ninguna fila 'pending' en document_invitations para ese
-- documento. Para el caso sin invitados (el creador firma solo,
-- handleSignAloneOnly en electronic-signature-page.tsx) NOT EXISTS es
-- verdadero de forma natural — cero invitaciones pendientes — así que
-- sigue marcando 'completed' de inmediato, sin cambios de comportamiento
-- ahí. signed_pdf_url se actualiza siempre, en cualquier caso, para que
-- cada compilación incremental (con las firmas recibidas hasta ese
-- momento) quede guardada aunque el documento aún no esté 'completed'.

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
    SELECT 1 FROM public.document_invitations
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

-- Verificación — debe verse exactamente esta firma
SELECT oid::regprocedure AS funcion
FROM pg_proc
WHERE proname = 'finalize_document' AND pronamespace = 'public'::regnamespace;
