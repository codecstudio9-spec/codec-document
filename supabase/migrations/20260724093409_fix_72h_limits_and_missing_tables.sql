-- ============================================================
-- CODEC DOCUMENT — Repara el sistema de cupo gratis de 72h.
--
-- HALLAZGO 1 (grave): public.document_creation_events NO EXISTE en
-- producción. Los scripts sueltos supabase_unify_72h_limits_migration.sql
-- / supabase_MASTER_catchup_migration.sql (pensados para correr a mano
-- desde el SQL Editor del Dashboard) nunca se ejecutaron ahí, aunque el
-- frontend (user-limits-service.ts) ya llama a try_consume_document_72h
-- como si existiera. Con la tabla/función ausentes, cada llamada real
-- del gate de "Documentos" fallaba con un error de Postgres; el código
-- cliente está diseñado para fallar CERRADO ante un error de RPC (ver
-- comentario en user-limits-service.ts), así que TODO usuario gratuito
-- terminaba viendo el paywall de una vez, incluso en su primer
-- documento — nunca llegaba a disfrutar los 2 gratis prometidos.
-- Esta migración crea la tabla y las funciones que deberían existir
-- desde esa sesión (idempotente con IF NOT EXISTS / CREATE OR REPLACE,
-- así que no rompe nada si alguna pieza sí llegó a crearse a mano).
--
-- HALLAZGO 2: las funciones next_*_slot (documentos/firmas/anónimos/
-- cotizaciones) tenían un OFFSET incorrecto — tomaban el evento MÁS
-- RECIENTE de la ventana en vez del MÁS VIEJO para calcular "vuelve
-- gratis en X horas", sobreestimando la espera real que aplica el
-- propio try_consume_*_72h (que libera cupo 72h después del evento más
-- viejo). Se corrige aquí también, para las 4 funciones.
-- ============================================================

-- ── Documentos — 2 cada 72h, se consume solo en la descarga exitosa ──
CREATE TABLE IF NOT EXISTS public.document_creation_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS document_creation_events_user_time_idx
  ON public.document_creation_events (user_id, created_at);
ALTER TABLE public.document_creation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "document_creation_events_select_own" ON public.document_creation_events;
CREATE POLICY "document_creation_events_select_own" ON public.document_creation_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.try_consume_document_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_count FROM public.document_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.document_creation_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_document_72h(uuid, integer) TO authenticated;

DROP FUNCTION IF EXISTS public.next_document_slot(uuid, integer);
CREATE OR REPLACE FUNCTION public.next_document_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.document_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.next_document_slot(uuid, integer) TO authenticated;

-- ── Firmas — 2 cada 72h (recrea si faltara, mismo motivo que arriba) ──
CREATE TABLE IF NOT EXISTS public.signature_request_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signature_request_events_user_time_idx
  ON public.signature_request_events (user_id, created_at);
ALTER TABLE public.signature_request_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sig_req_events_select_own" ON public.signature_request_events;
CREATE POLICY "sig_req_events_select_own" ON public.signature_request_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.try_consume_signature_request_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_count FROM public.signature_request_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.signature_request_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_signature_request_72h(uuid, integer) TO authenticated;

DROP FUNCTION IF EXISTS public.next_signature_request_slot(uuid, integer);
CREATE OR REPLACE FUNCTION public.next_signature_request_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.signature_request_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.next_signature_request_slot(uuid, integer) TO authenticated;

-- ── Anónimos (por device_id) — 2 cada 72h por acción, independientes ──
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
  p_device_id text, p_ip text, p_action text, p_limit integer DEFAULT 2
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_device_id IS NULL OR length(trim(p_device_id)) = 0 THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_count FROM public.anon_usage_events
  WHERE device_id = p_device_id AND action = p_action
    AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.anon_usage_events (device_id, ip_address, action)
  VALUES (p_device_id, p_ip, p_action);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_anon_usage_72h(text, text, text, integer) TO anon, authenticated;

-- An older version of this function exists with a conflicting return
-- type (CREATE OR REPLACE cannot change a function's return type), so
-- it must be dropped by its exact signature before recreating it.
DROP FUNCTION IF EXISTS public.next_anon_usage_slot(text, text, integer);
DROP FUNCTION IF EXISTS public.next_anon_usage_slot(text, text);

CREATE OR REPLACE FUNCTION public.next_anon_usage_slot(p_device_id text, p_action text, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.anon_usage_events
  WHERE device_id = p_device_id AND action = p_action
    AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.next_anon_usage_slot(text, text, integer) TO anon, authenticated;

-- ── Cotizaciones (Smart Quotes) — ya existía; solo corrige el OFFSET ──
DROP FUNCTION IF EXISTS public.next_quote_slot(uuid, integer);
CREATE OR REPLACE FUNCTION public.next_quote_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.quote_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.next_quote_slot(uuid, integer) TO authenticated;
