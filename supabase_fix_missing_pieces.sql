-- Fixes for what didn't get run yet: templates was missing updated_at,
-- and the branding migration ran the ALTER TABLEs but not the two
-- functions. Safe to run again even if parts already exist.

-- 1) templates: add the column update_user_branding's sibling
--    (updateTemplateFields) already writes to.
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2) branding: the two functions the app actually calls.
CREATE OR REPLACE FUNCTION public.update_user_branding(
  p_company_logo_url   text,
  p_logo_size          text,
  p_header_text        text,
  p_footer_text        text,
  p_use_watermark      boolean,
  p_use_global_branding boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
BEGIN
  UPDATE public.users
  SET company_logo_url    = p_company_logo_url,
      logo_size           = COALESCE(p_logo_size, 'medium'),
      header_text         = p_header_text,
      footer_text         = p_footer_text,
      use_watermark       = COALESCE(p_use_watermark, false),
      use_global_branding = COALESCE(p_use_global_branding, false)
  WHERE id = auth.uid()
  RETURNING to_jsonb(users.*) INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_branding(text, text, text, text, boolean, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_document_branding(p_document_id uuid)
RETURNS TABLE (
  company_logo_url    text,
  logo_size           text,
  header_text         text,
  footer_text         text,
  use_watermark       boolean,
  use_global_branding boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.company_logo_url, u.logo_size, u.header_text, u.footer_text, u.use_watermark, u.use_global_branding
  FROM public.documents d
  JOIN public.users u ON u.id = d.user_id
  WHERE d.id = p_document_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_document_branding(uuid) TO anon, authenticated;
