-- ============================================================
-- CODEC DOCUMENT — Corrige la firma de try_consume_anon_usage_72h
-- Ejecutar en https://yxzchnldmfsgdtbjurey.supabase.co -> SQL Editor
--
-- Verificacion mas reciente muestra try_consume_anon_usage_72h con
-- (p_client_ip text, p_limit integer) -- pero el frontend la llama
-- con CUATRO parametros: (p_device_id text, p_ip text, p_action text,
-- p_limit integer). Sin p_device_id no hay forma de garantizar que un
-- dispositivo nuevo arranque en cero (es la clave que evita que se
-- comparta el conteo entre visitantes de la misma IP/red), y sin
-- p_action los cupos de "documento" y "firma" dejan de ser
-- independientes para los usuarios anonimos. Con la firma actual (solo
-- 2 argumentos), la llamada del frontend simplemente no encuentra
-- ninguna funcion que coincida y falla -- bloqueando a CUALQUIER
-- visitante anonimo nuevo, igual que paso antes con la de firmas.
-- ============================================================

-- Quita la version de 2 argumentos que quedo (p_client_ip, p_limit).
DROP FUNCTION IF EXISTS public.try_consume_anon_usage_72h(text, integer);
DROP FUNCTION IF EXISTS public.next_anon_usage_slot(text, integer);

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
    AND action = p_action
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

-- Verificación final — debe mostrar EXACTAMENTE esto (una sola fila
-- por función, con estos argumentos):
--   try_consume_anon_usage_72h  | p_device_id text, p_ip text, p_action text, p_limit integer DEFAULT 2 | boolean
--   next_anon_usage_slot        | p_device_id text, p_action text, p_limit integer DEFAULT 2             | timestamp with time zone
SELECT p.proname AS nombre_funcion, pg_get_function_identity_arguments(p.oid) AS argumentos_entrada, t.typname AS tipo_retorno
FROM pg_proc p
JOIN pg_type t ON t.oid = p.prorettype
WHERE p.pronamespace = 'public'::regnamespace
  AND p.proname IN ('try_consume_anon_usage_72h', 'next_anon_usage_slot')
ORDER BY p.proname;
