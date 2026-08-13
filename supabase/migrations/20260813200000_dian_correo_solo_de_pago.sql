-- El conector de correo pasa a ser exclusivo de los planes de pago.
--
-- ── Por qué ──────────────────────────────────────────────────────────────
--
-- El coste de recibir correo no escala con el número de usuarios: escala con
-- el número de DOCUMENTOS. Un solo contador cuyos proveedores le manden las
-- facturas de una en una genera miles de correos entrantes al mes. Regalar eso
-- en el plan gratuito, que son 50 documentos, es regalar justo la parte cara.
--
-- ── Dónde se decide ──────────────────────────────────────────────────────
--
-- Aquí, en la base, y en tres puntos distintos. La pantalla también lo
-- comprueba, pero eso es cortesía para el usuario, no seguridad: quien llame
-- a la API directamente tiene que chocar igual.
--
--   1. ed_email_activar()  — no se puede crear la dirección sin plan
--   2. ed_email_destino()  — no se acepta correo entrante sin plan
--   3. ed_email_estado()   — la pantalla sabe por qué no está disponible
--
-- ── Qué pasa si el plan se vence ─────────────────────────────────────────
--
-- La dirección NO se borra y el token NO cambia: el contador ya la dejó puesta
-- en una regla de reenvío y quizá se la dio a sus proveedores. Al renovar,
-- todo sigue funcionando sin que tenga que reconfigurar nada.
--
-- Lo que se detiene es la recepción. Y no se pierde nada por ello: el correo
-- original sigue en el buzón del contador —él nos lo reenvía— así que
-- declinar aquí no destruye ningún documento suyo. Guardarle archivos
-- indefinidamente sin plan sí sería un coste nuestro sin contrapartida.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

/** ¿Puede esta persona usar el conector de correo?
 *
 *  Plan de pago vigente, o administrador. El plan Gratis tiene precio 0, así
 *  que la comprobación es «su plan cuesta algo». Se apoya en ed_plan_vigente()
 *  para no duplicar la lógica de qué plan rige hoy. */
CREATE OR REPLACE FUNCTION public.ed_email_disponible(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user()
      OR coalesce((SELECT price_cop FROM public.ed_plan_vigente(p_user_id)), 0) > 0;
$$;

REVOKE ALL ON FUNCTION public.ed_email_disponible(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_disponible(uuid) TO authenticated, service_role;

-- ── 1. No se crea la dirección sin plan ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.ed_email_activar()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token text;
  v_plan  public.ed_plans;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  IF NOT public.ed_email_disponible() THEN
    SELECT * INTO v_plan FROM public.ed_plan_vigente();
    -- El mensaje dice el plan actual y qué hay que hacer. Un «no autorizado»
    -- a secas obliga al contador a adivinar si es un fallo o una restricción.
    RAISE EXCEPTION 'La recepción por correo está disponible desde el plan Básico. Tu plan actual es %.', v_plan.name;
  END IF;

  SELECT inbox_token INTO v_token
  FROM ed_connector_state
  WHERE owner_user_id = auth.uid() AND connector = 'email' AND fiscal_entity_id IS NULL;

  IF v_token IS NULL THEN
    v_token := 'f' || substr(encode(gen_random_bytes(16), 'hex'), 1, 20);

    INSERT INTO ed_connector_state (owner_user_id, connector, inbox_token, inbox_enabled)
    VALUES (auth.uid(), 'email', v_token, true)
    ON CONFLICT (owner_user_id, connector, COALESCE(fiscal_entity_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET inbox_token = COALESCE(ed_connector_state.inbox_token, excluded.inbox_token),
                  inbox_enabled = true,
                  updated_at = now()
    RETURNING inbox_token INTO v_token;
  END IF;

  RETURN jsonb_build_object('token', v_token, 'activo', true);
END $$;

REVOKE ALL ON FUNCTION public.ed_email_activar() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_activar() TO authenticated;

-- ── 2. No se acepta correo entrante sin plan ──────────────────────────────

/** Resuelve el token a su dueño Y dice si puede recibir.
 *
 *  Sustituye a ed_email_duenio(), que solo devolvía el dueño. Se separan los
 *  dos motivos —dirección inexistente y plan vencido— porque en los registros
 *  hay que poder distinguirlos: uno es alguien escribiendo a una dirección
 *  inventada y el otro es un cliente que hay que llamar para que renueve. */
CREATE OR REPLACE FUNCTION public.ed_email_destino(p_token text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT owner_user_id INTO v_owner
  FROM ed_connector_state
  WHERE inbox_token = p_token AND connector = 'email' AND inbox_enabled;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'desconocido');
  END IF;

  IF NOT public.ed_email_disponible(v_owner) THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'sin_plan', 'owner', v_owner);
  END IF;

  RETURN jsonb_build_object('ok', true, 'owner', v_owner);
END $$;

REVOKE ALL ON FUNCTION public.ed_email_destino(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ed_email_destino(text) TO service_role;

/** Segunda barrera, dentro del guardado. La Edge Function ya consulta
 *  ed_email_destino() antes de subir nada, pero esta función es la que
 *  realmente escribe: si el plan venciera entre una llamada y otra, aquí se
 *  para. Nunca se deja la única comprobación en el llamador. */
CREATE OR REPLACE FUNCTION public.ed_email_recibir(
  p_token        text,
  p_from         text,
  p_subject      text,
  p_message_id   text,
  p_filename     text,
  p_size         bigint,
  p_content_type text,
  p_storage_path text,
  p_sha256       text
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner uuid;
  v_id    uuid;
BEGIN
  SELECT owner_user_id INTO v_owner
  FROM ed_connector_state
  WHERE inbox_token = p_token AND connector = 'email' AND inbox_enabled;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'desconocido');
  END IF;

  IF NOT public.ed_email_disponible(v_owner) THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'sin_plan');
  END IF;

  INSERT INTO ed_inbox_files (
    owner_user_id, from_address, subject, message_id,
    filename, size_bytes, content_type, storage_path, sha256
  )
  VALUES (
    v_owner, p_from, p_subject, p_message_id,
    p_filename, p_size, p_content_type, p_storage_path, p_sha256
  )
  ON CONFLICT (owner_user_id, sha256) WHERE sha256 IS NOT NULL
  DO NOTHING
  RETURNING id INTO v_id;

  UPDATE ed_connector_state SET last_sync_at = now(), last_error = NULL, updated_at = now()
  WHERE inbox_token = p_token;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('ok', true, 'motivo', 'repetido', 'owner', v_owner);
  END IF;

  RETURN jsonb_build_object('ok', true, 'motivo', 'guardado', 'id', v_id, 'owner', v_owner);
END $$;

REVOKE ALL ON FUNCTION public.ed_email_recibir(text, text, text, text, text, bigint, text, text, text)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ed_email_recibir(text, text, text, text, text, bigint, text, text, text)
  TO service_role;

-- ── 3. La pantalla sabe por qué no está disponible ────────────────────────

CREATE OR REPLACE FUNCTION public.ed_email_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token      text;
  v_activo     boolean;
  v_ultimo     timestamptz;
  v_pendientes int;
  v_plan       public.ed_plans;
  v_minimo     public.ed_plans;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  SELECT inbox_token, inbox_enabled, last_sync_at
    INTO v_token, v_activo, v_ultimo
  FROM ed_connector_state
  WHERE owner_user_id = auth.uid() AND connector = 'email' AND fiscal_entity_id IS NULL;

  SELECT count(*) INTO v_pendientes
  FROM ed_inbox_files
  WHERE owner_user_id = auth.uid() AND status = 'PENDING';

  SELECT * INTO v_plan FROM public.ed_plan_vigente();

  -- El plan más barato que lo incluye. Se calcula aquí para que la pantalla no
  -- tenga que saberse el catálogo ni quedarse desfasada si cambian los precios.
  SELECT * INTO v_minimo FROM ed_plans
  WHERE active AND price_cop IS NOT NULL AND price_cop > 0
  ORDER BY price_cop ASC LIMIT 1;

  RETURN jsonb_build_object(
    'token',        v_token,
    'activo',       coalesce(v_activo, false) AND v_token IS NOT NULL,
    'ultimo_correo', v_ultimo,
    'pendientes',   coalesce(v_pendientes, 0),
    'disponible',   public.ed_email_disponible(),
    'plan_actual',  v_plan.name,
    'plan_minimo',  CASE WHEN v_minimo.code IS NULL THEN NULL ELSE jsonb_build_object(
                      'code', v_minimo.code, 'nombre', v_minimo.name, 'precio', v_minimo.price_cop
                    ) END
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_email_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_estado() TO authenticated;

-- La versión vieja queda sin uso: se elimina para que nadie la llame creyendo
-- que sigue siendo la comprobación buena.
DROP FUNCTION IF EXISTS public.ed_email_duenio(text);

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('ed_email_disponible', 'ed_email_destino', 'ed_email_activar')
ORDER BY proname;
