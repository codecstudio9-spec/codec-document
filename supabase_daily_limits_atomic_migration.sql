-- ============================================================
-- CODEC DOCUMENT — Límites diarios atómicos (2 docs + 2 firmas/día)
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- Ajustado al esquema REAL de public.user_limits que ya existe:
--   user_id                          uuid PRIMARY KEY
--   free_documents_generated_today   integer
--   free_documents_uploaded_today    integer
--   last_reset_date                  date
--
-- Reemplaza el patrón "leer contador en JS, comparar, escribir" (con
-- condición de carrera: dos pestañas concurrentes pueden ambas leer
-- el mismo valor y ambas pasar el límite) por un RPC atómico que hace
-- el chequeo + incremento dentro de una sola transacción con bloqueo
-- de fila (FOR UPDATE).
-- ============================================================

-- Añade la columna que falta para el contador de firmas (2/día).
ALTER TABLE public.user_limits
  ADD COLUMN IF NOT EXISTS free_sign_transactions_today integer NOT NULL DEFAULT 0;

ALTER TABLE public.user_limits
  ALTER COLUMN free_documents_generated_today SET DEFAULT 0,
  ALTER COLUMN free_documents_uploaded_today  SET DEFAULT 0,
  ALTER COLUMN last_reset_date                SET DEFAULT CURRENT_DATE;

ALTER TABLE public.user_limits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "user_limits_select_own"
    ON public.user_limits FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- No INSERT/UPDATE policy for authenticated users: all writes must go
-- through try_consume_daily_limit() (SECURITY DEFINER) below, so a
-- user can never directly zero out or edit their own counters from
-- the browser (e.g. via `supabase.from('user_limits').update(...)`).
-- If an older, looser policy already exists on this table, remove it:
DROP POLICY IF EXISTS "user_limits_insert_own" ON public.user_limits;
DROP POLICY IF EXISTS "user_limits_update_own" ON public.user_limits;
DROP POLICY IF EXISTS "user_limits_all_own"    ON public.user_limits;

CREATE OR REPLACE FUNCTION public.try_consume_daily_limit(
  p_user_id uuid,
  p_counter text,   -- 'generated' | 'uploaded' | 'signed'
  p_limit   integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_col      text;
  v_used     integer;
  v_same_day boolean;
BEGIN
  IF p_counter = 'generated' THEN v_col := 'free_documents_generated_today';
  ELSIF p_counter = 'uploaded' THEN v_col := 'free_documents_uploaded_today';
  ELSIF p_counter = 'signed' THEN v_col := 'free_sign_transactions_today';
  ELSE RAISE EXCEPTION 'invalid counter %', p_counter;
  END IF;

  INSERT INTO public.user_limits (user_id, last_reset_date)
  VALUES (p_user_id, CURRENT_DATE)
  ON CONFLICT (user_id) DO NOTHING;

  -- Row lock: concurrent calls for the same user serialize here.
  PERFORM 1 FROM public.user_limits WHERE user_id = p_user_id FOR UPDATE;

  SELECT (last_reset_date = CURRENT_DATE) INTO v_same_day
    FROM public.user_limits WHERE user_id = p_user_id;

  IF NOT v_same_day THEN
    UPDATE public.user_limits
    SET free_documents_generated_today = 0,
        free_documents_uploaded_today  = 0,
        free_sign_transactions_today   = 0,
        last_reset_date                = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;

  EXECUTE format('SELECT %I FROM public.user_limits WHERE user_id = $1', v_col)
    INTO v_used USING p_user_id;

  IF v_used >= p_limit THEN
    RETURN false;
  END IF;

  EXECUTE format(
    'UPDATE public.user_limits SET %I = %I + 1 WHERE user_id = $1',
    v_col, v_col
  ) USING p_user_id;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_consume_daily_limit(uuid, text, integer) TO authenticated;

-- Read-only peek at today's remaining counts (for UI banners) — safe
-- to expose since it only ever returns the caller's own row via RLS.
CREATE OR REPLACE FUNCTION public.get_daily_limit_usage(p_user_id uuid)
RETURNS TABLE (
  generated_used integer,
  uploaded_used  integer,
  signed_used    integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    CASE WHEN last_reset_date = CURRENT_DATE THEN free_documents_generated_today ELSE 0 END,
    CASE WHEN last_reset_date = CURRENT_DATE THEN free_documents_uploaded_today  ELSE 0 END,
    CASE WHEN last_reset_date = CURRENT_DATE THEN free_sign_transactions_today   ELSE 0 END
  FROM public.user_limits
  WHERE user_id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_daily_limit_usage(uuid) TO authenticated;
