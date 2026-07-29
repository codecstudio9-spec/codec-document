-- Word (.docx) {{variable}} template engine, ZapSign-style — additive
-- extension of the existing public.templates table (see
-- supabase_add_templates_migration.sql). Existing PDF-by-coordinates
-- templates keep working unchanged: they simply have kind = 'pdf_overlay'
-- (the default) and never populate the new columns below.
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS kind             text NOT NULL DEFAULT 'pdf_overlay',
  ADD COLUMN IF NOT EXISTS docx_file_url    text,
  -- DetectedField[] — see src/lib/docxTemplateEngine.ts for the shape:
  -- { key, label, type: 'text'|'date'|'number'|'choice', options?, required }
  ADD COLUMN IF NOT EXISTS detected_fields  jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- TemplateSigner[] — exactly one { role: 'variable' } entry (Signer 1,
  -- whoever opens the public link) plus zero or more { role: 'fixed',
  -- name, email, promotedToField? } entries pre-filled by the template
  -- owner. See docx-template-service.ts.
  ADD COLUMN IF NOT EXISTS signers          jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Same shape as SecurityConfig (sign-transaction-service.ts) — reuses
  -- the existing SecurityConfigModal component as-is, biometric option
  -- included, instead of a new one.
  ADD COLUMN IF NOT EXISTS security_config  jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS public_slug      text UNIQUE,
  ADD COLUMN IF NOT EXISTS instructions_en  text,
  ADD COLUMN IF NOT EXISTS instructions_es  text;

CREATE INDEX IF NOT EXISTS templates_public_slug_idx ON public.templates (public_slug) WHERE public_slug IS NOT NULL;

-- Public, anonymous read by slug only (for /t/:slug) — the templates
-- table's only RLS policy ("templates_own") intentionally stays
-- owner-only, so a guest can't list or browse anyone's templates; this
-- SECURITY DEFINER RPC is the sole public entry point, same pattern as
-- get_sign_transaction_public in sign-transaction-service.ts.
CREATE OR REPLACE FUNCTION public.get_template_by_slug_public(p_slug text)
RETURNS TABLE (
  id uuid, name text, docx_file_url text, detected_fields jsonb,
  signers jsonb, security_config jsonb, instructions_en text, instructions_es text
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, docx_file_url, detected_fields, signers, security_config, instructions_en, instructions_es
  FROM public.templates
  WHERE public_slug = p_slug AND kind = 'docx_variables'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_template_by_slug_public(text) TO anon, authenticated;

-- Creates the sign_transactions row for a docx template's public fill
-- page — the ONLY way a guest can create one from a template, so the
-- template's real owner (user_id) never has to be exposed to the client
-- at all (unlike get_template_by_slug_public, which deliberately omits
-- it). Mirrors create_sign_transaction's SECURITY DEFINER pattern.
CREATE OR REPLACE FUNCTION public.create_custom_template_transaction(p_slug text, p_values jsonb)
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
    'fill_send', v_template.security_config, 'pending'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_custom_template_transaction(text, jsonb) TO anon, authenticated;
