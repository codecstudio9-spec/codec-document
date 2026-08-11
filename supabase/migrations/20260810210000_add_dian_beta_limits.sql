-- Beta abierta del motor DIAN: cupo por persona, tope global y fecha de
-- cierre. Todo configurable desde app_settings para poder ajustarlo sin
-- desplegar mientras dura la prueba.
--
-- El tope global NO se puede calcular desde el cliente: las políticas RLS
-- de ed_documents sólo dejan ver lo propio, así que un usuario contando
-- filas obtendría su propio número, no el de la plataforma. De ahí que
-- ed_beta_estado() sea SECURITY DEFINER: es la única forma de exponer un
-- total agregado sin abrir la lectura de los documentos de nadie.
--
-- Devuelve sólo cifras agregadas y la configuración. Nunca filas.

INSERT INTO public.app_settings (key, value) VALUES
  ('dian_beta_limite_persona', '100'),
  ('dian_beta_limite_global',  '2000'),
  -- Se cierra sola a los 3 días. Si el usuario quiere extenderla, cambia
  -- esta fecha desde el panel; no hace falta tocar código.
  ('dian_beta_cierre', to_char(now() + interval '3 days', 'YYYY-MM-DD"T"HH24:MI:SSOF'))
ON CONFLICT (key) DO NOTHING;

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
  v_inicio_mes     timestamptz := date_trunc('month', now());
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_limite_persona'), '100')::int
    INTO v_limite_persona;
  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_limite_global'), '2000')::int
    INTO v_limite_global;
  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_cierre'), '')::timestamptz
    INTO v_cierre;

  SELECT count(*) INTO v_global FROM ed_documents;
  SELECT count(*) INTO v_persona FROM ed_documents
    WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes;
  SELECT count(DISTINCT owner_user_id) INTO v_personas FROM ed_documents;

  RETURN jsonb_build_object(
    'limite_persona', v_limite_persona,
    'limite_global',  v_limite_global,
    'cierre',         v_cierre,
    'usados_persona', v_persona,
    'usados_global',  v_global,
    'personas',       v_personas,
    'cerrada',        (v_cierre IS NOT NULL AND now() > v_cierre),
    'llena',          (v_global >= v_limite_global),
    'ilimitado',      public.is_admin_user()
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_estado() TO authenticated;

-- Ajuste de los parámetros desde el panel del propietario. El guardia va
-- dentro porque la función es SECURITY DEFINER: sin él, cualquier usuario
-- podría subirse su propio cupo.
CREATE OR REPLACE FUNCTION public.ed_beta_configurar(p_clave text, p_valor text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_clave NOT IN ('dian_beta_limite_persona', 'dian_beta_limite_global', 'dian_beta_cierre') THEN
    RAISE EXCEPTION 'Parámetro no permitido: %', p_clave;
  END IF;

  INSERT INTO app_settings (key, value, updated_at)
  VALUES (p_clave, p_valor, now())
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_configurar(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_configurar(text, text) TO authenticated;
