-- Cupo gratuito de Smart Quotes: 2 cotizaciones cada 72h, exactamente el
-- mismo patron ya usado para documentos y firmas (contador independiente,
-- tabla de eventos propia, ventana deslizante de 72h) -- ver
-- supabase_FIX_all_72h_rpc_conflicts.sql / supabase_unify_72h_limits_migration.sql.
-- Los 3 cupos (documentos/firmas/cotizaciones) son independientes entre si,
-- tal como se pidio explicitamente.

CREATE TABLE IF NOT EXISTS public.quote_creation_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quote_creation_events_user_time_idx
  ON public.quote_creation_events (user_id, created_at);
ALTER TABLE public.quote_creation_events ENABLE ROW LEVEL SECURITY;
-- Sin politicas directas -- solo via las funciones SECURITY DEFINER de abajo.

CREATE OR REPLACE FUNCTION public.try_consume_quote_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_count FROM public.quote_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.quote_creation_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_quote_72h(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.next_quote_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.quote_creation_events
  WHERE user_id = p_user_id
    AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;
GRANT EXECUTE ON FUNCTION public.next_quote_slot(uuid, integer) TO authenticated;

-- Verificacion
SELECT p.proname FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace AND p.proname IN ('try_consume_quote_72h', 'next_quote_slot');
