-- ============================================================
-- CODEC DOCUMENT — Límite de solicitudes de firma: 72 horas rolling
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- Cambia la regla de negocio para "enviar un documento a firmar"
-- (sign_transactions) de "2 por día calendario" a "2 en cualquier
-- ventana de 72 horas" — una ventana rolling real, no un contador que
-- se reinicia a medianoche. Requiere una tabla de eventos (cada envío
-- se registra con su timestamp) en vez de un contador simple, porque
-- un contador con reset fijo no puede representar una ventana móvil.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.signature_request_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signature_request_events_user_time_idx
  ON public.signature_request_events (user_id, created_at);

ALTER TABLE public.signature_request_events ENABLE ROW LEVEL SECURITY;

-- Sin política de INSERT/UPDATE para el cliente — todas las escrituras
-- pasan por la función SECURITY DEFINER de abajo, así el conteo no se
-- puede falsear desde el navegador.
DROP POLICY IF EXISTS "sig_req_events_select_own" ON public.signature_request_events;
CREATE POLICY "sig_req_events_select_own" ON public.signature_request_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.try_consume_signature_request_72h(
  p_user_id uuid,
  p_limit   integer DEFAULT 2
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.signature_request_events
  WHERE user_id = p_user_id
    AND created_at >= now() - interval '72 hours';

  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.signature_request_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_consume_signature_request_72h(uuid, integer) TO authenticated;

-- Cuándo se libera el próximo cupo — para mostrar "vuelve a intentar en Xh"
-- en el popup en vez de solo "está lleno".
CREATE OR REPLACE FUNCTION public.next_signature_request_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.signature_request_events
  WHERE user_id = p_user_id
    AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;

GRANT EXECUTE ON FUNCTION public.next_signature_request_slot(uuid, integer) TO authenticated;
