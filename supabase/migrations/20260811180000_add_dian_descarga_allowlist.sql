-- Lista de personas autorizadas a probar la descarga masiva de la DIAN.
--
-- Hasta ahora la herramienta se ocultaba a todos menos al propietario, pero
-- ocultarla no es cerrarla: el botón desaparecía del navegador y la Edge
-- Function `dian-descargar` seguía atendiendo a cualquier usuario con sesión.
-- Quien supiera la URL de la función podía usarla. El control real vive aquí,
-- y la función lo consulta antes de salir a la red.
--
-- Importa además por otra razón: todo el tráfico sale por las IPs de
-- Supabase, compartidas por todos los clientes. Si la DIAN bloquea esa IP por
-- abuso de un desconocido, la bloquea para todos a la vez. Quién puede
-- descargar no es una preferencia de interfaz.
--
-- Se guarda como una lista de correos separados por comas en app_settings, no
-- como tabla propia: son unas pocas personas durante unos días, y una tabla
-- con sus políticas para eso sería más de lo que el problema pide.

INSERT INTO public.app_settings (key, value)
VALUES ('dian_descarga_permitidos', '')
ON CONFLICT (key) DO NOTHING;

-- ¿Puede el usuario actual usar la descarga masiva?
--
-- SECURITY DEFINER porque tiene que leer auth.users para saber el correo de
-- quien pregunta y app_settings, y ninguna de las dos está abierta al cliente.
-- Devuelve un booleano y nada más: nunca la lista, que son datos personales de
-- terceros.
CREATE OR REPLACE FUNCTION public.ed_descarga_permitida()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_lista text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_admin_user() THEN
    RETURN true;
  END IF;

  SELECT lower(trim(email)) INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL OR v_email = '' THEN
    RETURN false;
  END IF;

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_permitidos'), '')
    INTO v_lista;

  -- La comparación va sobre la lista ya partida y normalizada, no con LIKE
  -- sobre la cadena entera: un LIKE haría que «ana@x.com» autorizara también
  -- a «juanana@x.com» y a «ana@x.com.co».
  RETURN EXISTS (
    SELECT 1
    FROM unnest(string_to_array(v_lista, ',')) AS c(correo)
    WHERE lower(trim(c.correo)) = v_email
      AND trim(c.correo) <> ''
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_descarga_permitida() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_descarga_permitida() TO authenticated, service_role;

-- ── El panel necesita saber dos cosas más ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.ed_beta_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_limite_persona int;
  v_limite_global  int;
  v_cierre         timestamptz;
  v_global         int;
  v_persona        int;
  v_personas       int;
  v_admin          boolean;
  v_inicio_mes     timestamptz := date_trunc('month', now());
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  v_admin := public.is_admin_user();

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_limite_persona'), '100')::int
    INTO v_limite_persona;
  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_limite_global'), '2000')::int
    INTO v_limite_global;
  SELECT coalesce(nullif((SELECT value FROM app_settings WHERE key = 'dian_beta_cierre'), ''), NULL)::timestamptz
    INTO v_cierre;

  -- El cupo se cuenta sobre documentos PROCESADOS, no sobre los guardados:
  -- si se contaran los guardados, borrarlos devolvería cupo y el límite sería
  -- infinito para quien borra.
  SELECT coalesce(sum(processed), 0) INTO v_global FROM ed_imports;
  SELECT coalesce(sum(processed), 0) INTO v_persona FROM ed_imports
    WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes;
  SELECT count(DISTINCT owner_user_id) INTO v_personas FROM ed_imports WHERE processed > 0;

  RETURN jsonb_build_object(
    'limite_persona', v_limite_persona,
    'limite_global',  v_limite_global,
    'cierre',         v_cierre,
    'usados_persona', v_persona,
    'usados_global',  v_global,
    'personas',       v_personas,
    'cerrada',        (v_cierre IS NOT NULL AND now() > v_cierre),
    'llena',          (v_global >= v_limite_global),
    'ilimitado',      v_admin,
    'puede_descargar', public.ed_descarga_permitida(),
    -- La lista de correos sólo se le devuelve al propietario, que es quien la
    -- administra. Para cualquier otro no viaja: son datos de terceros.
    'descarga_permitidos',
      CASE WHEN v_admin
        THEN coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_permitidos'), '')
        ELSE NULL END
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_estado() TO authenticated;

-- Se añade la clave nueva a las que el propietario puede cambiar. La lista
-- blanca de claves es lo que impide que esta función, que es SECURITY
-- DEFINER, se convierta en un "escribe cualquier ajuste del sistema".
CREATE OR REPLACE FUNCTION public.ed_beta_configurar(p_clave text, p_valor text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_clave NOT IN (
    'dian_beta_limite_persona',
    'dian_beta_limite_global',
    'dian_beta_cierre',
    'dian_descarga_permitidos'
  ) THEN
    RAISE EXCEPTION 'Parámetro no permitido: %', p_clave;
  END IF;

  INSERT INTO app_settings (key, value, updated_at)
  VALUES (p_clave, p_valor, now())
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_configurar(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_configurar(text, text) TO authenticated;
