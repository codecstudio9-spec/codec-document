-- ============================================================
-- CODEC DOCUMENT — Corrige conflicto de firma en try_consume_signature_request_72h
-- Ejecutar en https://yxzchnldmfsgdtbjurey.supabase.co -> SQL Editor
--
-- Diagnostico: existe una version de esta funcion con la firma
-- (p_user_id uuid, p_client_ip text) que devuelve jsonb. El frontend
-- (user-limits-service.ts) llama supabase.rpc('try_consume_signature_
-- request_72h', { p_user_id, p_limit }) esperando un boolean simple.
-- Postgres trata firmas distintas como funciones sobrecargadas
-- distintas -- no se reemplazan entre si -- asi que PostgREST no
-- encuentra ninguna funcion que matchee {p_user_id, p_limit} contra
-- esa version, la llamada falla, y el codigo bloquea por defecto ante
-- cualquier error (para no regalar acceso gratis si Supabase falla).
-- Resultado: hasta una cuenta 100% nueva ve el limite de inmediato.
-- ============================================================

-- 1. Quita la version con firma distinta (p_client_ip) que esta
--    causando el conflicto/confusion.
DROP FUNCTION IF EXISTS public.try_consume_signature_request_72h(uuid, text);

-- 2. Reinstala exactamente la version que el frontend llama.
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

-- 3. Verificación rápida: para tu propio usuario, esto debe devolver
--    cuántas firmas llevas registradas en las últimas 72h (0 si nunca
--    has enviado ninguna con esta cuenta). Reemplaza el uuid con tu
--    propio user id (Dashboard -> Authentication -> Users).
-- SELECT COUNT(*) FROM public.signature_request_events
--   WHERE user_id = 'TU-USER-ID-AQUI'
--   AND created_at >= now() - interval '72 hours';
