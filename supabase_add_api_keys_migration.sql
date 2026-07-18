-- Fase 2 del modulo empresarial: API Keys + acceso programatico.
-- 100% aditivo. Las claves NUNCA se guardan en texto plano -- solo un
-- hash SHA-256 (pgcrypto, ya viene habilitado en Supabase) + un
-- prefijo corto para mostrar en pantalla ("cd_live_a1b2..."). El texto
-- completo de la clave solo existe en el instante en que se genera; si
-- se pierde, no hay forma de recuperarla, solo revocar y generar otra
-- -- el mismo estandar que Stripe/GitHub usan para sus API keys.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  key_prefix  text NOT NULL, -- ej. "cd_live_a1b2c3d4" (16 caracteres), solo para mostrar/identificar
  key_hash    text NOT NULL, -- sha256 hex de la clave completa
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
-- Sin politicas de SELECT/INSERT/UPDATE para el cliente a proposito --
-- toda lectura/escritura pasa por las funciones de abajo, asi
-- key_hash nunca es alcanzable ni siquiera por error desde el cliente.

CREATE OR REPLACE FUNCTION public.generate_api_key(p_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_raw_key text;
  v_prefix text;
  v_hash text;
  v_id uuid;
  v_created_at timestamptz;
BEGIN
  SELECT company_id, role INTO v_company_id, v_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_company_id IS NULL OR v_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Key name is required';
  END IF;

  v_raw_key := 'cd_live_' || encode(gen_random_bytes(24), 'hex');
  v_prefix  := left(v_raw_key, 16);
  v_hash    := encode(digest(v_raw_key, 'sha256'), 'hex');

  INSERT INTO public.api_keys (company_id, name, key_prefix, key_hash, created_by)
  VALUES (v_company_id, trim(p_name), v_prefix, v_hash, auth.uid())
  RETURNING id, created_at INTO v_id, v_created_at;

  -- Unica vez que la clave completa existe en texto plano -- el cliente
  -- debe mostrarla/copiarla de inmediato, no se puede volver a consultar.
  RETURN jsonb_build_object('id', v_id, 'name', trim(p_name), 'key_prefix', v_prefix, 'created_at', v_created_at, 'api_key', v_raw_key);
END;
$$;
GRANT EXECUTE ON FUNCTION public.generate_api_key(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_api_keys()
RETURNS TABLE(id uuid, name text, key_prefix text, created_at timestamptz, revoked_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT k.id, k.name, k.key_prefix, k.created_at, k.revoked_at
  FROM public.api_keys k
  WHERE k.company_id = public.get_my_company_id()
  ORDER BY k.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_api_keys() TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_api_key(p_key_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_company_role() NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.api_keys SET revoked_at = now()
  WHERE id = p_key_id AND company_id = public.get_my_company_id() AND revoked_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(uuid) TO authenticated;

-- Verificacion rapida.
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'api_keys';
