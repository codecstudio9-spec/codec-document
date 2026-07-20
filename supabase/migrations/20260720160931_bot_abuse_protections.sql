-- ============================================================
-- CODEC DOCUMENT — Protecciones contra bots/abuso automatizado
-- Ejecutar una vez via `supabase db push` (o SQL Editor).
--
-- Corrige 3 huecos reales encontrados en vivo:
--
-- 1. try_consume_anon_usage_72h SOLO contaba por device_id (un simple
--    valor de localStorage, trivial de rotar) -- un bot podia generar un
--    device_id nuevo en cada intento y obtener documentos/firmas gratis
--    sin limite real, aunque siempre viniera de la misma IP.
--
-- 2. La redencion de codigos promocionales (paypal-verify) no tenia
--    ningun limite de intentos -- una cuenta autenticada podia probar
--    codigos indefinidamente por fuerza bruta.
--
-- 3. submit_business_lead (formulario publico "Soluciones para
--    Empresas") no tenia ningun limite -- un bot podia inundar la tabla
--    de leads con datos falsos indefinidamente.
-- ============================================================

-- ── 1. Limite de uso anonimo -- tambien por IP, no solo por device_id ──
-- Manteniendo el limite estricto por device_id (comportamiento normal de
-- un usuario real), y agregando un techo mas alto por IP que solo
-- bloquea cuando la MISMA ip ya genero muchos device_id distintos en la
-- ventana de 72h -- no afecta redes compartidas normales (oficina, cafe,
-- colegio) con unos pocos usuarios reales.
CREATE OR REPLACE FUNCTION public.try_consume_anon_usage_72h(
  p_device_id text, p_ip text, p_action text, p_limit integer DEFAULT 2
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device_count integer;
  v_ip_count integer;
  v_ip_ceiling integer := p_limit * 5;
BEGIN
  IF p_device_id IS NULL OR length(trim(p_device_id)) = 0 THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_device_count FROM public.anon_usage_events
  WHERE device_id = p_device_id AND action = p_action
    AND created_at >= now() - interval '72 hours';
  IF v_device_count >= p_limit THEN
    RETURN false;
  END IF;

  IF p_ip IS NOT NULL AND length(trim(p_ip)) > 0 THEN
    SELECT COUNT(*) INTO v_ip_count FROM public.anon_usage_events
    WHERE ip_address = p_ip AND action = p_action
      AND created_at >= now() - interval '72 hours';
    IF v_ip_count >= v_ip_ceiling THEN
      RETURN false;
    END IF;
  END IF;

  INSERT INTO public.anon_usage_events (device_id, ip_address, action)
  VALUES (p_device_id, p_ip, p_action);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_anon_usage_72h(text, text, text, integer) TO anon, authenticated;


-- ── 2. Limite de intentos de codigo promocional (fuerza bruta) ─────────
CREATE TABLE IF NOT EXISTS public.promo_attempt_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS promo_attempt_events_user_time_idx
  ON public.promo_attempt_events (user_id, created_at);
ALTER TABLE public.promo_attempt_events ENABLE ROW LEVEL SECURITY;
-- Sin politicas de cliente -- solo la Edge Function (service role) escribe/lee aqui.

-- Registra un intento y dice si YA se paso del limite (se llama ANTES de
-- validar el codigo en si, para que ni siquiera probar códigos cueste
-- gratis para un atacante). p_max intentos en la ventana de p_window_minutes.
CREATE OR REPLACE FUNCTION public.check_and_log_promo_attempt(
  p_user_id uuid, p_max integer DEFAULT 8, p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;

  SELECT COUNT(*) INTO v_count FROM public.promo_attempt_events
  WHERE user_id = p_user_id
    AND created_at >= now() - (p_window_minutes || ' minutes')::interval;

  INSERT INTO public.promo_attempt_events (user_id) VALUES (p_user_id);

  RETURN v_count < p_max;
END;
$$;
-- Solo la Edge Function (service role) llama esto -- no se otorga a anon/authenticated.


-- ── 3. Limite de envios del formulario de leads (por IP) ───────────────
CREATE TABLE IF NOT EXISTS public.lead_submission_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_submission_events_ip_time_idx
  ON public.lead_submission_events (ip_address, created_at);
ALTER TABLE public.lead_submission_events ENABLE ROW LEVEL SECURITY;
-- Sin politicas de cliente -- solo la funcion SECURITY DEFINER de abajo escribe aqui.

DROP FUNCTION IF EXISTS public.submit_business_lead(text, text, text, text, text, text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.submit_business_lead(
  p_name text, p_company text, p_position text, p_email text, p_phone text,
  p_employees text, p_country text, p_city text, p_language text, p_message text,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_recent_count integer;
BEGIN
  -- Maximo 3 envios por IP cada hora -- un formulario B2B real no genera
  -- ese volumen desde la misma direccion; un bot inundandolo si.
  IF p_ip_address IS NOT NULL AND length(trim(p_ip_address)) > 0 THEN
    SELECT COUNT(*) INTO v_recent_count FROM public.lead_submission_events
    WHERE ip_address = p_ip_address AND created_at >= now() - interval '1 hour';
    IF v_recent_count >= 3 THEN
      RAISE EXCEPTION 'Too many submissions from this connection. Please try again later.';
    END IF;
  END IF;

  INSERT INTO public.admin_business_leads (name, company, position, email, phone, employees, country, city, language, message)
  VALUES (p_name, p_company, p_position, p_email, p_phone, p_employees, p_country, p_city, p_language, p_message)
  RETURNING id INTO v_id;

  INSERT INTO public.lead_submission_events (ip_address) VALUES (p_ip_address);

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_business_lead(text, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;

-- Verificacion
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('try_consume_anon_usage_72h', 'check_and_log_promo_attempt', 'submit_business_lead');
