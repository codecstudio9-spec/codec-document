-- Bug real encontrado en vivo 2026-09-20, probando generate_api_key como
-- un admin real (no anónimo): fallaba con
--   {"code":"42883",...,"message":"function gen_random_bytes(integer) does not exist"}
-- La prueba anónima anterior nunca lo había detectado porque esa llamada
-- corta en la verificación "Not authorized" ANTES de llegar a la línea
-- que usa gen_random_bytes/digest — un usuario sin empresa nunca ejecuta
-- ese código. En cuanto Douglas (dueño real de una empresa) lo probó de
-- verdad, sí llegó a esa línea y truena.
--
-- Causa: gen_random_bytes()/digest() son de pgcrypto, que en este
-- proyecto vive en el esquema `extensions`, no en `public` — y esta
-- función tiene `SET search_path = public`, así que Postgres no las
-- encuentra. Mismo problema ya documentado y resuelto en otras partes de
-- este repo (ver signatureService.ts: se usa sha256() nativo de Postgres
-- en vez de digest() de pgcrypto por esta misma razón). Aquí se aplica
-- el mismo criterio: gen_random_uuid() SÍ es nativo de Postgres (no
-- pgcrypto) desde la versión 13, por eso las columnas id de api_keys/
-- webhooks ya lo usaban sin problema.

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

  -- 2 UUIDs sin guiones = 64 hex chars de entropía, sin depender de pgcrypto.
  v_raw_key := 'cd_live_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_prefix  := left(v_raw_key, 16);
  v_hash    := encode(sha256(v_raw_key::bytea), 'hex');

  INSERT INTO public.api_keys (company_id, name, key_prefix, key_hash, created_by)
  VALUES (v_company_id, trim(p_name), v_prefix, v_hash, auth.uid())
  RETURNING id, created_at INTO v_id, v_created_at;

  RETURN jsonb_build_object('id', v_id, 'name', trim(p_name), 'key_prefix', v_prefix, 'created_at', v_created_at, 'api_key', v_raw_key);
END;
$$;
GRANT EXECUTE ON FUNCTION public.generate_api_key(text) TO authenticated;

-- Mismo problema en el DEFAULT de webhooks.secret — lo cambiamos a la
-- misma alternativa nativa. ALTER COLUMN ... SET DEFAULT no toca las
-- filas que ya existan.
ALTER TABLE public.webhooks
  ALTER COLUMN secret SET DEFAULT (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''));

NOTIFY pgrst, 'reload schema';
