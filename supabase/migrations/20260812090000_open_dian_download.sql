-- Abre la descarga masiva de XML a todos los usuarios con sesión.
--
-- Hasta ahora estaba limitada al propietario y a los correos que él
-- autorizara, mientras se comprobaba contra el portal real. Se abre con un
-- interruptor en app_settings y no borrando el guardia, por dos razones:
--
-- 1. Se puede volver a cerrar desde el panel, sin desplegar nada. El tráfico
--    sale por las IPs de Supabase, compartidas por toda la plataforma: si la
--    DIAN bloquea esa IP por abuso, la bloquea para todos los clientes a la
--    vez. Hay que poder cerrar el grifo en segundos.
-- 2. La lista de autorizados sigue funcionando cuando el interruptor está
--    cerrado, que es como quedará al terminar la prueba.
--
-- Lo que NO cambia: sigue haciendo falta sesión iniciada, sigue vigente el
-- gobernador de ritmo (2 peticiones por segundo globales) y siguen vigentes el
-- cierre por fecha y el tope global de la prueba.

INSERT INTO public.app_settings (key, value)
VALUES ('dian_descarga_abierta', 'true')
ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = now();

CREATE OR REPLACE FUNCTION public.ed_descarga_permitida()
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email    text;
  v_lista    text;
  v_abierta  boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  IF public.is_admin_user() THEN
    RETURN true;
  END IF;

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_abierta'), 'false') = 'true'
    INTO v_abierta;
  IF v_abierta THEN
    RETURN true;
  END IF;

  SELECT lower(trim(email)) INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL OR v_email = '' THEN
    RETURN false;
  END IF;

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_permitidos'), '')
    INTO v_lista;

  -- Sobre la lista ya partida, no con LIKE sobre la cadena entera: un LIKE
  -- haría que «ana@x.com» autorizara también a «juanana@x.com».
  RETURN EXISTS (
    SELECT 1
    FROM unnest(string_to_array(v_lista, ',')) AS c(correo)
    WHERE lower(trim(c.correo)) = v_email
      AND trim(c.correo) <> ''
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_descarga_permitida() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_descarga_permitida() TO authenticated, service_role;

-- El interruptor se puede mover desde el panel del propietario.
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
    'dian_descarga_permitidos',
    'dian_descarga_abierta'
  ) THEN
    RAISE EXCEPTION 'Parámetro no permitido: %', p_clave;
  END IF;

  INSERT INTO app_settings (key, value, updated_at)
  VALUES (p_clave, p_valor, now())
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_configurar(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_configurar(text, text) TO authenticated;

-- El panel necesita saber si está abierta para poder mostrar el interruptor.
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

  -- Cuenta documentos PROCESADOS, no guardados: si contara los guardados,
  -- borrarlos devolvería cupo y el límite no protegería nada.
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
    'descarga_abierta',
      coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_abierta'), 'false') = 'true',
    'descarga_permitidos',
      CASE WHEN v_admin
        THEN coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_permitidos'), '')
        ELSE NULL END
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_estado() TO authenticated;
