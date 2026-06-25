-- ============================================================
-- CODEC DOCUMENT — Download Gate Migration
-- Run once in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Table: download_events
--    Stores one row per completed free download (doc or sig).
--    The RPC checks how many events exist in the last 72 hours.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.download_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address  text,
  event_type  text        NOT NULL DEFAULT 'doc',  -- 'doc' | 'sig'
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own events
CREATE POLICY "Users can insert own download events"
  ON public.download_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can read their own events
CREATE POLICY "Users can view own download events"
  ON public.download_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- 2. RPC: check_user_limits(user_ip, u_id)
--    Returns TRUE  → download allowed (< 2 events in last 72 h)
--    Returns FALSE → quota exhausted (>= 2 events in last 72 h)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_limits(
  user_ip text DEFAULT NULL,
  u_id    uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt integer;
BEGIN
  -- If both params are null, always allow
  IF u_id IS NULL AND user_ip IS NULL THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO cnt
  FROM public.download_events
  WHERE created_at >= now() - interval '72 hours'
    AND (
      (u_id      IS NOT NULL AND user_id    = u_id)
      OR (user_ip IS NOT NULL AND ip_address = user_ip)
    );

  -- Free tier: 2 downloads per 72-hour rolling window
  RETURN cnt < 2;
END;
$$;

-- Grant execute to both authenticated and anonymous callers
GRANT EXECUTE ON FUNCTION public.check_user_limits TO authenticated, anon;


-- 3. (Optional) Sign-transactions sender_signature column
--    Only needed if you haven't run this yet from the previous session.
-- ------------------------------------------------------------
ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS sender_signature text;


-- ============================================================
-- ADMIN BYPASS
-- The frontend bypasses the RPC entirely when:
--   isAdmin = true   (email: douglastabordasanchez@gmail.com)
--   subscriptionActive = true
--   unlimitedActive = true
--   isPurchased = true (paid via PremiumDownloadModal)
--
-- No database change needed — admin bypass is handled in
-- preview-page.tsx via the `canDownloadFree` flag.
-- ============================================================
