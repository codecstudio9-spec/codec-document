-- Adds per-account white-label branding (logo, header/footer text,
-- watermark) — 100% additive, all columns nullable/default-off, so
-- existing accounts/documents are completely unaffected until a user
-- explicitly opts in from Settings. Run once in the Supabase SQL Editor.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS logo_size text DEFAULT 'medium'; -- 'small' | 'medium' | 'large'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS header_text text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS footer_text text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS use_watermark boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS use_global_branding boolean NOT NULL DEFAULT false;

-- SECURITY DEFINER, not a raw client-side `.update()` — same reasoning as
-- update_document_details / update_user_document_details elsewhere in
-- this project: a raw update that matches 0 rows (wrong owner, or a
-- missing/misconfigured RLS policy) reports success with no error at
-- all, so a silent mismatch could make "Guardar" look like it worked
-- when the branding was never actually saved.
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

  RETURN v_row; -- null if no matching row (not authenticated / no such user)
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_branding(text, text, text, text, boolean, boolean) TO authenticated;

-- Lets the GUEST-facing signing page (anonymous visitor, no session) read
-- the DOCUMENT OWNER's branding to render their logo/header/footer — a
-- direct `.from('users').select(...)` would be blocked by the owner-only
-- RLS SELECT policy on `users` (and should stay blocked for every other
-- column). This only ever exposes the 6 branding fields, keyed by a
-- document_id the caller must already hold a valid signing link for.
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
