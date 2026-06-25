-- ============================================================
-- CODEC DOCUMENT — Migración Definitiva
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. RPC check_user_limits ─────────────────────────────────
--    Lee de public.user_usage_limits (tabla ya existente).
--    Columnas reales: id, client_ip, user_id, action_type, created_at
--    Retorna TRUE  → descarga permitida  (< 2 eventos en 72 h)
--    Retorna FALSE → cuota agotada       (>= 2 eventos en 72 h)
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
  IF u_id IS NULL AND user_ip IS NULL THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO cnt
  FROM public.user_usage_limits
  WHERE created_at >= now() - interval '72 hours'
    AND (
      (u_id     IS NOT NULL AND user_id   = u_id)
      OR (user_ip IS NOT NULL AND client_ip = user_ip)
    );

  RETURN cnt < 2;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_limits TO authenticated, anon;


-- ── 2. RLS para user_usage_limits (si no existen ya) ─────────
DO $$ BEGIN
  CREATE POLICY "Users insert own usage"
    ON public.user_usage_limits
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users view own usage"
    ON public.user_usage_limits
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── 3. Columnas de suscripción en public.users ───────────────
--    El servicio subscription-service.ts escribe aquí al
--    completarse un pago de suscripción con PayPal.
-- ------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan_status            text    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_type              text,
  ADD COLUMN IF NOT EXISTS paypal_subscription_id text,
  ADD COLUMN IF NOT EXISTS plan_expires_at        timestamptz;


-- ── 4. sign_transactions: columna sender_signature ───────────
--    Necesaria para el flujo bilateral (si no fue agregada antes)
-- ------------------------------------------------------------
ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS sender_signature text;


-- ── VERIFICACIÓN (ejecutar después para confirmar) ───────────
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'users'
-- ORDER BY ordinal_position;

-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'user_usage_limits'
-- ORDER BY ordinal_position;
