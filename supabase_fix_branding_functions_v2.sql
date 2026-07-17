-- Ejecuta este archivo COMPLETO en una pestaña NUEVA del SQL Editor de
-- Supabase (no reutilices una pestaña vieja que ya tenga texto escrito).
--
-- Primero borra cualquier version anterior de estas dos funciones con
-- OTRA firma (otro nombre de parametro), porque CREATE OR REPLACE solo
-- reemplaza si la firma es identica -- si no, crea una funcion aparte
-- y la app nunca la encuentra. DROP ... IF EXISTS es seguro: no borra
-- datos, solo la definicion de la funcion.

DROP FUNCTION IF EXISTS public.get_user_branding(uuid);
DROP FUNCTION IF EXISTS public.get_user_branding();
DROP FUNCTION IF EXISTS public.update_user_branding(text, text, text, text, boolean, boolean, uuid);
DROP FUNCTION IF EXISTS public.update_user_branding(uuid, text, text, text, text, boolean, boolean);

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

-- Verificacion rapida: debe devolver 2 filas.
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('update_user_branding', 'get_document_branding');
