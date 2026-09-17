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
-- IMPORTANTE — esta versión reemplaza un intento anterior que quedó sin
-- aplicar: ese primero usaba `document_invitations`, una tabla descrita en
-- supabase_guest_dashboard_anon_migration.sql pero que, verificado en vivo
-- contra esta base de datos (yxzchnldmfsgdtbjurey), NUNCA llegó a existir
-- — ni la tabla ni sus RPCs (record_document_invitation,
-- mark_document_invitation_signed). Las llamadas del frontend a esa
-- segunda función ya venían fallando en silencio (envueltas en try/catch
-- "non-fatal"), sin romper nada porque el seguimiento real siempre fue
-- otro: la tabla `signers` (columnas: id, document_id, name, email,
-- status), poblada por create_signer con status='pending' y llevada a
-- 'completed' por try_complete_signer_once — ambas confirmadas en vivo,
-- ambas ya en uso por el flujo de 2 firmantes que sí funciona hoy. Este
-- archivo usa esa tabla real en su lugar.
--
-- Reemplaza finalize_document para que solo marque 'completed' cuando no
-- queda ninguna fila 'pending' en signers para ese documento. Para el caso
-- sin invitados (el creador firma solo, handleSignAloneOnly en
-- electronic-signature-page.tsx — nunca llama createSigner, cero filas en
-- signers para ese documento) NOT EXISTS es verdadero de forma natural, así
-- que sigue marcando 'completed' de inmediato, sin cambios de
-- comportamiento ahí. signed_pdf_url se actualiza siempre, en cualquier
-- caso, para que cada compilación incremental (con las firmas recibidas
-- hasta ese momento) quede guardada aunque el documento aún no esté
-- 'completed'.

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


-- ─── get_signer_status ───────────────────────────────────────────────────
-- `signers` has no SELECT policy at all (guest-signing PII: name + email
-- alongside status) — confirmed live, same reason create_signer and
-- try_complete_signer_once already go through SECURITY DEFINER RPCs instead
-- of a plain client-side query. The creator's own browser needs to poll
-- each extra signer's progress individually (electronic-signature-page.tsx,
-- "Añadir otro firmante") without being able to read their name/email back
-- out — this returns only the one column needed for that.
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


-- Verificación — deben verse exactamente estas 2 firmas
SELECT oid::regprocedure AS funcion
FROM pg_proc
WHERE proname IN ('finalize_document', 'get_signer_status') AND pronamespace = 'public'::regnamespace;
