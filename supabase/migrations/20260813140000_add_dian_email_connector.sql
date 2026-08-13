-- Conector de correo: los XML entran solos, sin descargar ni arrastrar nada.
--
-- ── Por qué el correo y no la DIAN ───────────────────────────────────────
--
-- El token de la DIAN dura 60 minutos y hay que pedirlo a mano desde el
-- portal. Eso hace IMPOSIBLE una sincronización nocturna: no existe forma de
-- renovarlo sin el contador delante. El correo sí funciona desatendido,
-- porque la ley obliga al emisor a entregar el XML por email — o sea que los
-- documentos YA están llegando a un buzón todos los días.
--
-- ── Cómo se direcciona ───────────────────────────────────────────────────
--
-- Cada contador recibe una dirección única e irrepetible. La reenvía desde su
-- correo con una regla, o se la da a sus proveedores. No se le piden las
-- credenciales de su buzón: pedirle a alguien la contraseña de su correo para
-- leerle las facturas es una barrera de confianza que ninguna herramienta
-- nueva supera, y con Gmail ni siquiera funcionaría sin pasar la revisión de
-- Google para un permiso restringido.
--
-- La dirección lleva un token aleatorio y no el nombre ni el NIT: quien la vea
-- de pasada en una regla de reenvío no debe poder deducir la de otro, ni
-- averiguar quién es el cliente.
--
-- ── Por qué NO se procesa aquí mismo ─────────────────────────────────────
--
-- Sería posible: src/lib/dian/ es TypeScript puro y corre igual en Deno. Pero
-- entonces habría DOS implementaciones del mismo cálculo — la del navegador y
-- la de la Edge Function — y el día que se toque una y no la otra, el mismo
-- documento daría dos cifras distintas según por dónde entró. En contabilidad
-- eso no es un bug molesto: es una declaración mal presentada.
--
-- Así que el correo deja los archivos en la bandeja y avisa. El motor sigue
-- siendo uno solo. Lo que se le ahorra al contador es el trayecto entero de
-- abrir el correo, bajar los adjuntos, buscarlos en el explorador y
-- arrastrarlos — que es donde estaba el trabajo, no en pulsar «procesar».
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

-- ── La dirección de cada contador ─────────────────────────────────────────

ALTER TABLE public.ed_connector_state
  ADD COLUMN IF NOT EXISTS inbox_token text,
  ADD COLUMN IF NOT EXISTS inbox_enabled boolean NOT NULL DEFAULT true;

-- Único en toda la plataforma: es lo que decide de quién es un correo que
-- llega. Un choque aquí significaría entregarle a alguien las facturas de otro.
CREATE UNIQUE INDEX IF NOT EXISTS ed_connector_inbox_token_idx
  ON public.ed_connector_state (inbox_token)
  WHERE inbox_token IS NOT NULL;

-- ── La bandeja ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_inbox_files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- De dónde vino, para que el contador reconozca el correo si algo no cuadra.
  from_address    text,
  subject         text,
  message_id      text,
  received_at     timestamptz NOT NULL DEFAULT now(),

  filename        text NOT NULL,
  size_bytes      bigint,
  content_type    text,
  -- Ruta dentro del bucket privado fiscal-documents. El XML es el documento
  -- con validez legal; se guarda tal cual llegó, sin reescribir.
  storage_path    text NOT NULL,
  -- SHA-256 del archivo. Es lo que evita procesar dos veces el mismo
  -- documento cuando el proveedor reenvía la misma factura, que hacen todos.
  sha256          text,

  status          text NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING', 'IMPORTED', 'SKIPPED', 'ERROR')),
  import_id       uuid REFERENCES public.ed_imports(id) ON DELETE SET NULL,
  error           text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ed_inbox_pendientes_idx
  ON public.ed_inbox_files (owner_user_id, status, received_at DESC);

-- Un mismo archivo, del mismo dueño, no entra dos veces. El reenvío repetido
-- de la misma factura es la norma, no la excepción.
CREATE UNIQUE INDEX IF NOT EXISTS ed_inbox_sin_repetir_idx
  ON public.ed_inbox_files (owner_user_id, sha256)
  WHERE sha256 IS NOT NULL;

ALTER TABLE public.ed_inbox_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ed_inbox_files_own ON public.ed_inbox_files;
CREATE POLICY ed_inbox_files_own ON public.ed_inbox_files
  FOR ALL USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- ── Activar la recepción ──────────────────────────────────────────────────

/** Devuelve (creándolo si hace falta) el token del buzón del contador.
 *
 *  El token es aleatorio de 128 bits en base32 sin vocales confusas. La
 *  dirección completa la arma la aplicación con el dominio configurado, para
 *  que cambiar de dominio no obligue a migrar filas. */
CREATE OR REPLACE FUNCTION public.ed_email_activar()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  SELECT inbox_token INTO v_token
  FROM ed_connector_state
  WHERE owner_user_id = auth.uid() AND connector = 'email' AND fiscal_entity_id IS NULL;

  IF v_token IS NULL THEN
    -- encode(gen_random_bytes) da hex; se recorta a 20 caracteres, que son
    -- 80 bits de azar: de sobra para que nadie acierte la dirección de otro.
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

/** Estado del conector para la pantalla: dirección y cuánto hay esperando. */
CREATE OR REPLACE FUNCTION public.ed_email_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token     text;
  v_activo    boolean;
  v_ultimo    timestamptz;
  v_pendientes int;
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

  RETURN jsonb_build_object(
    'token',        v_token,
    'activo',       coalesce(v_activo, false) AND v_token IS NOT NULL,
    'ultimo_correo', v_ultimo,
    'pendientes',   coalesce(v_pendientes, 0)
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_email_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_estado() TO authenticated;

/** Apaga la recepción sin borrar el token: volver a encenderla no debe
 *  cambiarle la dirección al contador, que ya la dejó puesta en una regla de
 *  reenvío y quizá se la dio a sus proveedores. */
CREATE OR REPLACE FUNCTION public.ed_email_apagar()
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  UPDATE ed_connector_state SET inbox_enabled = false, updated_at = now()
  WHERE owner_user_id = auth.uid() AND connector = 'email';
END $$;

REVOKE ALL ON FUNCTION public.ed_email_apagar() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_apagar() TO authenticated;

-- ── Depositar lo que llegó (sólo el webhook) ──────────────────────────────

/** La llama la Edge Function con service_role, ya verificada la firma del
 *  proveedor de correo. Resuelve el token → dueño y guarda la entrada.
 *
 *  Devuelve el dueño para que la función sepa bajo qué carpeta guardar, y
 *  'desconocido' si el token no existe: un correo a una dirección inventada
 *  no puede crear nada. */
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

/** Resuelve un token a su dueño. La Edge Function la necesita ANTES de subir
 *  nada, para no dejar archivos huérfanos en el bucket cuando el token no
 *  existe. */
CREATE OR REPLACE FUNCTION public.ed_email_duenio(p_token text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_user_id FROM ed_connector_state
  WHERE inbox_token = p_token AND connector = 'email' AND inbox_enabled;
$$;

REVOKE ALL ON FUNCTION public.ed_email_duenio(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ed_email_duenio(text) TO service_role;

-- ── Marcar lo ya importado ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ed_inbox_marcar(
  p_ids       uuid[],
  p_status    text,
  p_import_id uuid DEFAULT NULL,
  p_error     text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  IF p_status NOT IN ('PENDING', 'IMPORTED', 'SKIPPED', 'ERROR') THEN
    RAISE EXCEPTION 'Estado no válido';
  END IF;

  -- El filtro por dueño va aquí dentro: la función es SECURITY DEFINER, así
  -- que sin él bastaría con pasar los ids de otro.
  UPDATE ed_inbox_files
  SET status = p_status, import_id = coalesce(p_import_id, import_id),
      error = p_error, updated_at = now()
  WHERE owner_user_id = auth.uid() AND id = ANY(p_ids);

  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END $$;

REVOKE ALL ON FUNCTION public.ed_inbox_marcar(uuid[], text, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_inbox_marcar(uuid[], text, uuid, text) TO authenticated;

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('ed_email_activar', 'ed_email_estado', 'ed_email_recibir', 'ed_inbox_marcar')
ORDER BY proname;
