-- Extends the branding profile (public.users, same table as
-- supabase_add_branding_migration.sql) with the "Identidad Empresarial"
-- block used by document-generator-page.tsx's PDF export: logo on/off +
-- position, legal business name, address, EIN, phone, email, website.
-- 100% additive -- existing columns/behavior untouched. Run this ONCE in
-- a blank SQL Editor tab.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS enable_logo_in_docs   boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS logo_position         text DEFAULT 'left'; -- 'left' | 'right'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_legal_name    text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_address_line1 text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_address_line2 text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_city          text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_state         text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_zip           text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_country       text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_ein           text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_phone         text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_email         text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_website       text;

-- update_user_branding gains 13 new parameters -- a different arg count
-- is a different function signature to Postgres, so the old 6-arg
-- version has to be dropped first (see the same reasoning already
-- applied to mark_visitor_activity/get_recent_visitors elsewhere in this
-- project) or both would exist side by side.
DROP FUNCTION IF EXISTS public.update_user_branding(text, text, text, text, boolean, boolean);

CREATE OR REPLACE FUNCTION public.update_user_branding(
  p_company_logo_url      text,
  p_logo_size             text,
  p_header_text           text,
  p_footer_text           text,
  p_use_watermark         boolean,
  p_use_global_branding   boolean,
  p_enable_logo_in_docs   boolean,
  p_logo_position         text,
  p_company_legal_name    text,
  p_company_address_line1 text,
  p_company_address_line2 text,
  p_company_city          text,
  p_company_state         text,
  p_company_zip           text,
  p_company_country       text,
  p_company_ein           text,
  p_company_phone         text,
  p_company_email         text,
  p_company_website       text
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
  SET company_logo_url      = p_company_logo_url,
      logo_size             = COALESCE(p_logo_size, 'medium'),
      header_text           = p_header_text,
      footer_text           = p_footer_text,
      use_watermark         = COALESCE(p_use_watermark, false),
      use_global_branding   = COALESCE(p_use_global_branding, false),
      enable_logo_in_docs   = COALESCE(p_enable_logo_in_docs, false),
      logo_position         = COALESCE(p_logo_position, 'left'),
      company_legal_name    = p_company_legal_name,
      company_address_line1 = p_company_address_line1,
      company_address_line2 = p_company_address_line2,
      company_city          = p_company_city,
      company_state         = p_company_state,
      company_zip           = p_company_zip,
      company_country       = p_company_country,
      company_ein           = p_company_ein,
      company_phone         = p_company_phone,
      company_email         = p_company_email,
      company_website       = p_company_website
  WHERE id = auth.uid()
  RETURNING to_jsonb(users.*) INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_branding(
  text, text, text, text, boolean, boolean, boolean, text, text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- Verificacion rapida: deben existir todas las columnas nuevas.
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
  AND column_name IN (
    'enable_logo_in_docs', 'logo_position', 'company_legal_name',
    'company_address_line1', 'company_address_line2', 'company_city',
    'company_state', 'company_zip', 'company_country', 'company_ein',
    'company_phone', 'company_email', 'company_website'
  );
