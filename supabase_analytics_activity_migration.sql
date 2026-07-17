-- Adds "did this visitor generate a document / complete a signature" to
-- the existing analytics_visitors table (see analytics-service.ts header
-- comment for the real, hand-built schema). 100% additive: new columns
-- default false, new function, nothing existing is touched.
--
-- Run this ONCE in a blank SQL Editor tab.

ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS generated_document  boolean NOT NULL DEFAULT false;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS completed_signature boolean NOT NULL DEFAULT false;

-- Called from the client (markVisitorActivity in analytics-service.ts)
-- right when a document is generated or a signature is completed in that
-- browser tab. SECURITY DEFINER because analytics_visitors has no
-- client-side UPDATE policy (INSERT-only) — same reasoning as every
-- other *_own RPC in this project. Granted to anon too: guests signing
-- someone else's document (guest-sign-page.tsx) have no session at all.
CREATE OR REPLACE FUNCTION public.mark_visitor_activity(p_session_id text, p_event text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event = 'document' THEN
    UPDATE public.analytics_visitors SET generated_document = true WHERE session_id = p_session_id;
  ELSIF p_event = 'signature' THEN
    UPDATE public.analytics_visitors SET completed_signature = true WHERE session_id = p_session_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_visitor_activity(text, text) TO anon, authenticated;

-- Replaces the REAL live get_recent_visitors (confirmed via
-- pg_get_functiondef against production on 2026-07-17) so it also
-- returns the 2 new columns. Same name + same single `days_limit
-- integer DEFAULT 7` param as the live version, so CREATE OR REPLACE
-- genuinely replaces it in place -- it does not create a second,
-- unreachable overload. No access-control logic existed inside the
-- original body (the admin gate is client-side only, via AdminRoute),
-- so none is added here either -- this is a byte-for-byte match of the
-- original plus the 2 extra columns, nothing else changed.
CREATE OR REPLACE FUNCTION public.get_recent_visitors(days_limit integer DEFAULT 7)
 RETURNS TABLE(id uuid, country text, city text, referrer_source text, landing_page text, device text, is_new_visitor boolean, created_at timestamp with time zone, generated_document boolean, completed_signature boolean)
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
        v.completed_signature
    FROM
        public.analytics_visitors v
    WHERE
        v.created_at >= (NOW() - (days_limit || ' days')::INTERVAL)
    ORDER BY
        v.created_at DESC;
END;
$function$;

-- Verificacion rapida: deben existir las 2 columnas Y la funcion debe
-- devolver 10 columnas (antes devolvia 8).
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'analytics_visitors'
  AND column_name IN ('generated_document', 'completed_signature');

SELECT * FROM public.get_recent_visitors(7) LIMIT 3;
