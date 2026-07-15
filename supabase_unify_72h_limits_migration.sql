-- ============================================================
-- CODEC DOCUMENT — Unificación de límites: 2 documentos + 2 firmas,
-- contadores INDEPENDIENTES, ventana móvil de 72h desde la última acción
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- CONTEXTO: la app tenía varios mecanismos de límite en paralelo y
-- desincronizados entre sí:
--   - user_limits + try_consume_daily_limit  → contador de CALENDARIO
--     (se reinicia a medianoche, no a las 72h) — esto es lo que usaban
--     consumeGeneratedDocLimit / consumeUploadedDocLimit.
--   - download_events + check_user_limits    → sí era 72h, pero mezclaba
--     documentos y firmas en UN solo contador compartido de 2 (nunca se
--     usó desde el frontend).
--   - signature_request_events + try_consume_signature_request_72h → el
--     único que ya era 72h Y de solicitud de firma exclusivamente
--     (implementado la sesión pasada). Se deja tal cual: pasa a ser el
--     contador canónico de "Firmas".
-- Esta migración agrega el contador canónico de "Documentos" con el
-- mismo patrón ya probado, y corrige anon_usage_events (sesión pasada)
-- para que también separe documento/firma en vez de compartir el cupo.
-- Los mecanismos viejos (user_limits, download_events) se dejan en la
-- base de datos sin usar — no se borran para no arriesgar nada, pero el
-- frontend deja de leerlos/escribirlos con este cambio.
-- ============================================================

-- ── 1. Contador canónico "Documentos" — 2 cada 72h, solo se consume en
--       la descarga exitosa (el frontend llama esto justo antes de
--       disparar la descarga real, nunca al solo llenar el formulario). ──
CREATE TABLE IF NOT EXISTS public.document_creation_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS document_creation_events_user_time_idx
  ON public.document_creation_events (user_id, created_at);

ALTER TABLE public.document_creation_events ENABLE ROW LEVEL SECURITY;
-- Sin políticas de cliente — todo pasa por las RPCs SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.try_consume_document_72h(
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
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.document_creation_events
  WHERE user_id = p_user_id
    AND created_at >= now() - interval '72 hours';

  -- Un usuario nuevo (0 filas en las últimas 72h) siempre da v_count = 0
  -- aquí — COUNT(*) nunca devuelve NULL — así que nunca se interpreta
  -- por error como "bloqueado".
  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.document_creation_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_consume_document_72h(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.next_document_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.document_creation_events
  WHERE user_id = p_user_id
    AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;

GRANT EXECUTE ON FUNCTION public.next_document_slot(uuid, integer) TO authenticated;

-- ── 2. Corrige anon_usage_events (creada en
--       supabase_guest_dashboard_anon_migration.sql): antes contaba
--       "document" + "signature" juntos contra el mismo cupo de 2, en vez
--       de darle a cada uno su propio cupo de 2 — se recrea aquí de forma
--       idempotente por si esa migración ya corrió. ──────────────────────
CREATE TABLE IF NOT EXISTS public.anon_usage_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  text NOT NULL,
  ip_address text,
  action     text NOT NULL CHECK (action IN ('document', 'signature')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anon_usage_events_device_time_idx
  ON public.anon_usage_events (device_id, created_at);

ALTER TABLE public.anon_usage_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.try_consume_anon_usage_72h(
  p_device_id text,
  p_ip        text,
  p_action    text,
  p_limit     integer DEFAULT 2
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_device_id IS NULL OR length(trim(p_device_id)) = 0 THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.anon_usage_events
  WHERE device_id = p_device_id
    AND action = p_action              -- antes faltaba: mezclaba doc+firma
    AND created_at >= now() - interval '72 hours';

  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.anon_usage_events (device_id, ip_address, action)
  VALUES (p_device_id, p_ip, p_action);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_consume_anon_usage_72h(text, text, text, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_anon_usage_slot(p_device_id text, p_action text, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.anon_usage_events
  WHERE device_id = p_device_id
    AND action = p_action
    AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;

GRANT EXECUTE ON FUNCTION public.next_anon_usage_slot(text, text, integer) TO anon, authenticated;
