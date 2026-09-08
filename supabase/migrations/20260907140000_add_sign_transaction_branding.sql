-- El firmante invitado (sin sesión) también puede descargar su propia
-- copia desde /sign/:transactionId (ver handleDownloadCopy en
-- sign-transaction-page.tsx) — pero esa página nunca tenía forma de leer
-- el branding del CREADOR de la transacción (logo, marca de agua, pie de
-- página, identidad de empresa configurados en Configuración), porque
-- get_document_branding() sólo cubre la tabla `documents`, no
-- `sign_transactions`. Mismo patrón exacto que get_document_branding
-- (supabase_fix_branding_functions_v2.sql), pero resolviendo el dueño vía
-- sign_transactions.creator_id en vez de documents.user_id, y con el set
-- COMPLETO de columnas de marca (no solo las 6 originales) para que el
-- documento final refleje TODO lo configurado, no solo logo/watermark.
CREATE OR REPLACE FUNCTION public.get_sign_transaction_branding(p_transaction_id uuid)
RETURNS TABLE (
  company_logo_url     text,
  logo_size            text,
  header_text          text,
  footer_text          text,
  use_watermark        boolean,
  use_global_branding  boolean,
  enable_logo_in_docs  boolean,
  logo_position        text,
  company_legal_name   text,
  company_address_line1 text,
  company_address_line2 text,
  company_city         text,
  company_state        text,
  company_zip          text,
  company_country      text,
  company_ein          text,
  company_phone        text,
  company_email        text,
  company_website      text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.company_logo_url, u.logo_size, u.header_text, u.footer_text,
    u.use_watermark, u.use_global_branding, u.enable_logo_in_docs, u.logo_position,
    u.company_legal_name, u.company_address_line1, u.company_address_line2,
    u.company_city, u.company_state, u.company_zip, u.company_country,
    u.company_ein, u.company_phone, u.company_email, u.company_website
  FROM public.sign_transactions t
  JOIN public.users u ON u.id::text = t.creator_id
  WHERE t.id = p_transaction_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_sign_transaction_branding(uuid) TO anon, authenticated;
