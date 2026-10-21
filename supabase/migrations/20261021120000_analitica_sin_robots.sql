-- Analítica sin robots (2026-10-21).
--
-- De 4.797 visitas registradas en 60 días, unas 2.300 de «Estados Unidos»
-- venían de ciudades de centros de datos (Washington, Quincy, Des Moines,
-- Chase City, San José) con navegador sin identificar: rastreadores que
-- ejecutan JavaScript (Bing, IA, monitores). Inflaban el panel a «6.000
-- visitas y cero ventas» y escondían que desde Google llegaron 18 personas.
--
-- 1. es_robot / motivo_robot en cada visita. Desde ahora lo decide el cliente
--    (user agent, navigator.webdriver, proveedor de la IP según ipwho.is: Amazon,
--    Microsoft, Google Cloud…). Las visitas viejas se marcan con la misma
--    heurística que dio el diagnóstico.
-- 2. Vista analytics_visitantes_humanos y todas las funciones del panel la
--    usan en lugar de la tabla. Sin permisos para anon/authenticated: sólo la
--    leen las funciones SECURITY DEFINER.
-- 3. get_robot_summary: cuántas visitas se excluyeron, para que el panel lo diga.

ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS es_robot boolean NOT NULL DEFAULT false;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS motivo_robot text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS proveedor_red text;

UPDATE public.analytics_visitors
   SET es_robot = true,
       motivo_robot = CASE WHEN browser = 'Otro' THEN 'historico: navegador sin identificar' ELSE 'historico: ciudad de centro de datos' END
 WHERE es_robot = false
   AND (
     browser = 'Otro'
     OR (country = 'United States' AND city IN ('Washington', 'Quincy', 'Des Moines', 'Chase City', 'San Jose', 'Ashburn', 'Boardman', 'Council Bluffs', 'The Dalles', 'Moncks Corner'))
     OR (country IN ('Ireland', 'Netherlands', 'Singapore') AND city IN ('Dublin', 'Amsterdam', 'Singapore'))
   )
   AND NOT (generated_document OR completed_signature OR registered OR previewed OR signature_started);

CREATE INDEX IF NOT EXISTS analytics_visitors_humanos_idx ON public.analytics_visitors (created_at) WHERE NOT es_robot;

CREATE OR REPLACE VIEW public.analytics_visitantes_humanos AS
  SELECT * FROM public.analytics_visitors WHERE NOT es_robot;
REVOKE ALL ON public.analytics_visitantes_humanos FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_analytics_summary()
 RETURNS TABLE(total_visitors bigint, visitors_today bigint, visitors_this_week bigint, visitors_this_month bigint, new_visitors_pct numeric, returning_visitors_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total BIGINT;
    v_today BIGINT;
    v_week BIGINT;
    v_month BIGINT;
    v_new BIGINT;
BEGIN
    -- Total de visitas únicas por sesión
    SELECT COUNT(DISTINCT session_id) INTO v_total FROM public.analytics_visitantes_humanos;
    
    -- Hoy
    SELECT COUNT(DISTINCT session_id) INTO v_today FROM public.analytics_visitantes_humanos 
    WHERE created_at >= CURRENT_DATE;
    
    -- Últimos 7 días
    SELECT COUNT(DISTINCT session_id) INTO v_week FROM public.analytics_visitantes_humanos 
    WHERE created_at >= (NOW() - INTERVAL '7 days');
    
    -- Últimos 30 días
    SELECT COUNT(DISTINCT session_id) INTO v_month FROM public.analytics_visitantes_humanos 
    WHERE created_at >= (NOW() - INTERVAL '30 days');
    
    -- Nuevos vs Recurrentes
    SELECT COUNT(DISTINCT session_id) INTO v_new FROM public.analytics_visitantes_humanos 
    WHERE is_new_visitor = true;

    RETURN QUERY
    SELECT 
        v_total,
        v_today,
        v_week,
        v_month,
        CASE WHEN v_total > 0 THEN ROUND((v_new::NUMERIC / v_total::NUMERIC) * 100, 2) ELSE 0 END,
        CASE WHEN v_total > 0 THEN ROUND(((v_total - v_new)::NUMERIC / v_total::NUMERIC) * 100, 2) ELSE 0 END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_conversion_funnel(days_limit integer)
 RETURNS TABLE(visited bigint, registered bigint, generated bigint, previewed bigint, purchased bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.registered AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.generated_document AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.previewed AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    (SELECT COUNT(*) FROM public.paypal_processed_orders o WHERE o.created_at >= now() - (days_limit || ' days')::interval)::bigint
  FROM public.analytics_visitantes_humanos v;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_location_summary()
 RETURNS TABLE(country_name text, city_name text, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        country AS country_name,
        city AS city_name,
        COUNT(DISTINCT session_id) AS count
    FROM 
        public.analytics_visitantes_humanos
    GROUP BY 
        country, city
    ORDER BY 
        count DESC
    LIMIT 15;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recent_visitors(days_limit integer DEFAULT 7)
 RETURNS TABLE(id uuid, country text, city text, referrer_source text, landing_page text, device text, is_new_visitor boolean, created_at timestamp with time zone, generated_document boolean, completed_signature boolean, generated_document_source text, completed_signature_source text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.country, v.city, v.referrer_source, v.landing_page, v.device,
        v.is_new_visitor, v.created_at, v.generated_document, v.completed_signature,
        v.generated_document_source, v.completed_signature_source
    FROM public.analytics_visitantes_humanos v
    WHERE v.created_at >= (NOW() - (days_limit || ' days')::INTERVAL)
    ORDER BY v.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_signature_stats(days_limit integer)
 RETURNS TABLE(started bigint, completed bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE v.signature_started AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.completed_signature AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint
  FROM public.analytics_visitantes_humanos v;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_documents()
 RETURNS TABLE(document_type text, generated_count bigint, paid_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    v.document_type,
    COUNT(*)::bigint AS generated_count,
    (SELECT COUNT(*) FROM public.paypal_processed_orders o WHERE o.document_id = v.document_type)::bigint AS paid_count
  FROM public.analytics_visitantes_humanos v
  WHERE v.document_type IS NOT NULL AND v.created_at >= now() - interval '30 days'
  GROUP BY v.document_type
  ORDER BY COUNT(*) DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_top_pages()
 RETURNS TABLE(landing_page text, visits bigint, conversions bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT v.landing_page, COUNT(*)::bigint, COUNT(*) FILTER (WHERE v.generated_document)::bigint
  FROM public.analytics_visitantes_humanos v
  WHERE v.landing_page IS NOT NULL
  GROUP BY v.landing_page
  ORDER BY COUNT(*) DESC
  LIMIT 15;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_traffic_sources_summary()
 RETURNS TABLE(source text, count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        referrer_source AS source,
        COUNT(DISTINCT session_id) AS count
    FROM 
        public.analytics_visitantes_humanos
    GROUP BY 
        referrer_source
    ORDER BY 
        count DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_visitors_trend(days_limit integer DEFAULT 7)
 RETURNS TABLE(visit_date date, total_visits bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        created_at::DATE AS visit_date,
        COUNT(DISTINCT session_id) AS total_visits
    FROM 
        public.analytics_visitantes_humanos
    WHERE 
        created_at >= (NOW() - (days_limit || ' days')::INTERVAL)
    GROUP BY 
        visit_date
    ORDER BY 
        visit_date ASC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_robot_summary(days_limit integer DEFAULT 30)
 RETURNS TABLE(robots bigint, humanos bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COUNT(*) FILTER (WHERE es_robot), COUNT(*) FILTER (WHERE NOT es_robot)
    FROM public.analytics_visitors
   WHERE created_at >= NOW() - make_interval(days => days_limit);
$function$;
REVOKE ALL ON FUNCTION public.get_robot_summary(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_robot_summary(integer) TO authenticated;
