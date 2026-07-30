-- Lets whoever GENERATES a document from a Word template (not just the
-- template owner) override the template's stored security_config for
-- that one document, and records the correct SigningIntent (see
-- sign-transaction-service.ts) instead of the hardcoded 'fill_send' the
-- original create_custom_template_transaction always used — that value
-- was wrong for the public /t/:slug path (recipient fills a BLANK
-- template themselves, which is 'blank_send'); 'fill_send' now correctly
-- means "the sender filled it in and is sending only for a signature",
-- used by the new "llenar antes de enviar" flow (GenerateSendModal).
--
-- p_security_override is NULL by default -- the existing public fill
-- page's call site (template-fill-public-page.tsx) doesn't pass it, so
-- that flow is byte-for-byte unchanged (falls back to the template's own
-- security_config, same as before).
DROP FUNCTION IF EXISTS public.create_custom_template_transaction(text, jsonb);

CREATE OR REPLACE FUNCTION public.create_custom_template_transaction(
  p_slug text,
  p_values jsonb,
  p_security_override jsonb DEFAULT NULL,
  p_intent text DEFAULT 'blank_send'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_template RECORD;
  v_id uuid;
BEGIN
  SELECT id, user_id, security_config INTO v_template
  FROM public.templates WHERE public_slug = p_slug AND kind = 'docx_variables';

  IF v_template.id IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;

  INSERT INTO public.sign_transactions (
    creator_id, document_type, document_data, intent, security_config, status
  ) VALUES (
    v_template.user_id::text, 'custom-template',
    jsonb_build_object('templateId', v_template.id, 'values', p_values),
    p_intent, COALESCE(p_security_override, v_template.security_config), 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_custom_template_transaction(text, jsonb, jsonb, text) TO anon, authenticated;
