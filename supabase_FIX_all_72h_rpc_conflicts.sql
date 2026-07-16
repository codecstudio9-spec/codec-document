-- ============================================================
-- CODEC DOCUMENT — Elimina CUALQUIER version en conflicto de las 3
-- funciones de limite de 72h (documento / firma / anonimo) y reinstala
-- exactamente las firmas que el frontend llama.
-- Ejecutar en https://yxzchnldmfsgdtbjurey.supabase.co -> SQL Editor
--
-- Ya se confirmo que try_consume_signature_request_72h tenia una
-- version en conflicto -- firma (uuid, text) devolviendo jsonb en vez
-- de (uuid, integer) devolviendo boolean. Este script asume que el
-- mismo problema puede existir tambien en try_consume_document_72h y
-- try_consume_anon_usage_72h (mismo patron, probablemente generadas
-- por la misma herramienta/script), y limpia las tres de una vez para
-- no seguir cazando este bug una funcion a la vez.
-- ============================================================

-- ── Documentos ──────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.try_consume_document_72h(uuid, text);
DROP FUNCTION IF EXISTS public.try_consume_document_72h(uuid, text, integer);

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

-- ── Firmas (re-asegura, por si acaso) ───────────────────────────────
DROP FUNCTION IF EXISTS public.try_consume_signature_request_72h(uuid, text);
DROP FUNCTION IF EXISTS public.try_consume_signature_request_72h(uuid, text, integer);

CREATE OR REPLACE FUNCTION public.try_consume_signature_request_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.signature_request_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.signature_request_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_signature_request_72h(uuid, integer) TO authenticated;

-- ── Anonimos (device_id + action) ───────────────────────────────────
DROP FUNCTION IF EXISTS public.try_consume_anon_usage_72h(text, text, integer);
DROP FUNCTION IF EXISTS public.try_consume_anon_usage_72h(text, text);

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

-- ── Verificación: lista TODAS las funciones que quedan con estos
--    nombres, para confirmar que solo hay UNA firma de cada una.
--    Si alguna aparece dos veces, todavía hay un conflicto.
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS argumentos
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN (
    'try_consume_document_72h',
    'try_consume_signature_request_72h',
    'try_consume_anon_usage_72h'
  )
ORDER BY p.proname;
