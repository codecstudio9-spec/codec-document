-- Adds WHICH feature/page generated the document or completed the
-- signature (not just whether one happened) -- e.g. "Generador de
-- documentos" vs "Mis Plantillas" vs "Firma por plantilla". Run this
-- ONCE in a blank SQL Editor tab, AFTER supabase_analytics_activity_migration.sql
-- (this builds on generated_document/completed_signature from that file).

ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS generated_document_source  text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS completed_signature_source text;

-- Replaces mark_visitor_activity to also take a 3rd argument (the
-- source slug from ActivitySource in analytics-service.ts). Dropped
-- first: adding a parameter changes the function's signature (2 args
-- -> 3 args), which Postgres treats as a different function, not a
-- replace-in-place -- without the DROP this would leave BOTH the old
-- 2-arg and new 3-arg versions defined, which is confusing even though
-- it wouldn't break anything (PostgREST picks the overload matching the
-- named JSON keys sent).
DROP FUNCTION IF EXISTS public.mark_visitor_activity(text, text);

CREATE OR REPLACE FUNCTION public.mark_visitor_activity(p_session_id text, p_event text, p_source text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event = 'document' THEN
    UPDATE public.analytics_visitors SET generated_document = true, generated_document_source = p_source WHERE session_id = p_session_id;
  ELSIF p_event = 'signature' THEN
    UPDATE public.analytics_visitors SET completed_signature = true, completed_signature_source = p_source WHERE session_id = p_session_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_visitor_activity(text, text, text) TO anon, authenticated;

-- Same reasoning as before: return shape changes, so DROP then CREATE
-- in the same script.
DROP FUNCTION IF EXISTS public.get_recent_visitors(integer);

CREATE OR REPLACE FUNCTION public.get_recent_visitors(days_limit integer DEFAULT 7)
 RETURNS TABLE(id uuid, country text, city text, referrer_source text, landing_page text, device text, is_new_visitor boolean, created_at timestamp with time zone, generated_document boolean, completed_signature boolean, generated_document_source text, completed_signature_source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.country,
        v.city,
        v.referrer_source,
        v.landing_page,
        v.device,
        v.is_new_visitor,
        v.created_at,
        v.generated_document,
        v.completed_signature,
        v.generated_document_source,
        v.completed_signature_source
    FROM
        public.analytics_visitors v
    WHERE
        v.created_at >= (NOW() - (days_limit || ' days')::INTERVAL)
    ORDER BY
        v.created_at DESC;
END;
$function$;

-- Verificacion rapida: debe devolver hasta 3 filas con 12 columnas.
SELECT * FROM public.get_recent_visitors(7) LIMIT 3;
