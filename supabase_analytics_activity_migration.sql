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

-- Verificacion rapida: deben existir las 2 columnas.
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'analytics_visitors'
  AND column_name IN ('generated_document', 'completed_signature');
