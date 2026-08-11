-- 1. La cuota deja de contar documentos GUARDADOS y pasa a contar
--    documentos PROCESADOS.
--
-- Al permitir que el contador borre sus documentos, contar sobre
-- ed_documents abria un rodeo evidente: borrar y volver a importar daria
-- cupo infinito, y el tope global de la beta dejaria de proteger nada.
--
-- ed_imports.processed es acumulativo: la importacion queda como registro
-- historico aunque sus documentos se borren despues. Esa es la cifra
-- honesta de "cuanto trabajo nos pidio esta persona".

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
    'ilimitado',      public.is_admin_user()
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_estado() TO authenticated;

-- 2. Borrado masivo de los documentos propios.
--
-- Las lineas, impuestos, archivos y excepciones caen solas por ON DELETE
-- CASCADE. Las importaciones NO se borran: son el historico que sostiene
-- la cuota, y ademas el contador debe seguir viendo que ese dia importo
-- 5.284 documentos aunque luego los haya limpiado.
CREATE OR REPLACE FUNCTION public.ed_borrar_documentos(p_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_borrados integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesion'; END IF;

  -- El filtro por owner_user_id va aqui dentro y no se delega a RLS: la
  -- funcion es SECURITY DEFINER, asi que sin el, un usuario podria pasar
  -- los ids de otro.
  IF p_ids IS NULL THEN
    DELETE FROM ed_documents WHERE owner_user_id = auth.uid();
  ELSE
    DELETE FROM ed_documents WHERE owner_user_id = auth.uid() AND id = ANY(p_ids);
  END IF;

  GET DIAGNOSTICS v_borrados = ROW_COUNT;
  RETURN v_borrados;
END $$;

REVOKE ALL ON FUNCTION public.ed_borrar_documentos(uuid[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_borrar_documentos(uuid[]) TO authenticated;

-- 3. Resolver una excepcion: el contador la revisa y la marca como vista.
CREATE OR REPLACE FUNCTION public.ed_resolver_excepcion(p_id bigint, p_nota text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesion'; END IF;

  UPDATE ed_exceptions
  SET resolved_at = now(), resolved_by = auth.uid(), resolution_note = p_nota
  WHERE id = p_id AND owner_user_id = auth.uid();

  IF NOT FOUND THEN RAISE EXCEPTION 'No encontrada'; END IF;

  -- Si al documento no le quedan observaciones pendientes, vuelve a
  -- Procesado: la bandeja tiene que vaciarse a medida que se trabaja, o
  -- deja de servir como lista de tareas.
  UPDATE ed_documents d
  SET status = 'PROCESSED'
  WHERE d.id = (SELECT document_id FROM ed_exceptions WHERE id = p_id)
    AND d.owner_user_id = auth.uid()
    AND d.status = 'REVIEW_REQUIRED'
    AND NOT EXISTS (
      SELECT 1 FROM ed_exceptions e
      WHERE e.document_id = d.id AND e.resolved_at IS NULL
    );
END $$;

REVOKE ALL ON FUNCTION public.ed_resolver_excepcion(bigint, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_resolver_excepcion(bigint, text) TO authenticated;
