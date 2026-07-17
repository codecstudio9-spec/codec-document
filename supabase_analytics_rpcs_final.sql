-- ============================================================
-- CODEC DOCUMENT — Funciones RPC del panel de Analytics (versión final)
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente, NO
-- destructivo (no recrea ni borra la tabla, no toca "users.role").
--
-- ESTE ES EL ARCHIVO CORRECTO A CORRER AHORA. Los anteriores
-- (supabase_add_visitor_analytics_migration.sql,
-- supabase_fix_analytics_visitors_schema.sql,
-- supabase_finalize_analytics_and_admin_role.sql) quedaron obsoletos
-- — la tabla y el rol de admin ya se crearon correctamente por otra
-- vía (confirmado en vivo): analytics_visitors ya tiene id/session_id/
-- country/city/region/referrer_source/landing_page/created_at, y
-- public.users.role ya existe como ENUM user_role ('user'/'admin'),
-- con la cuenta admin ya marcada. Solo faltan: unas columnas extra
-- para el panel, y las funciones RPC que el dashboard usa para leer
-- los datos (la tabla ya tiene su propia política RLS de SELECT
-- restringida a admin, pero el dashboard usa RPCs SECURITY DEFINER en
-- vez de leer la tabla directo, así que este script las agrega).
-- ============================================================

-- ── Columnas adicionales para dispositivo/navegador y nuevo-vs-recurrente ──
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS visitor_id      text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS country_code    text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS referrer_host   text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS language        text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS device_type     text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS browser         text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS is_new_visitor  boolean;

CREATE INDEX IF NOT EXISTS analytics_visitors_visitor_idx ON public.analytics_visitors (visitor_id);
CREATE INDEX IF NOT EXISTS analytics_visitors_source_idx  ON public.analytics_visitors (referrer_source);

-- ── Helper de admin — usa el enum user_role tal como ya quedó ──────────
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT COALESCE((SELECT role = 'admin'::user_role FROM public.users WHERE id = auth.uid()), false);
$$;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- ── RPCs de agregación (SECURITY DEFINER — bypasean la política RLS
-- de la tabla, verifican admin ellas mismas) ───────────────────────────

CREATE OR REPLACE FUNCTION public.admin_visitor_counts()
RETURNS TABLE (today bigint, this_week bigint, this_month bigint, total bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT
    (SELECT count(DISTINCT session_id) FROM public.analytics_visitors WHERE created_at >= date_trunc('day', now()) AND public.is_current_user_admin()),
    (SELECT count(DISTINCT session_id) FROM public.analytics_visitors WHERE created_at >= now() - interval '7 days' AND public.is_current_user_admin()),
    (SELECT count(DISTINCT session_id) FROM public.analytics_visitors WHERE created_at >= now() - interval '30 days' AND public.is_current_user_admin()),
    (SELECT count(DISTINCT session_id) FROM public.analytics_visitors WHERE public.is_current_user_admin());
$$;
GRANT EXECUTE ON FUNCTION public.admin_visitor_counts() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_top_countries(p_since timestamptz, p_limit integer DEFAULT 10)
RETURNS TABLE (country text, country_code text, visitors bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT v.country, v.country_code, count(DISTINCT v.session_id) AS visitors
  FROM public.analytics_visitors v
  WHERE v.created_at >= p_since AND v.country IS NOT NULL AND v.country <> 'Desconocido' AND public.is_current_user_admin()
  GROUP BY v.country, v.country_code
  ORDER BY visitors DESC
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.admin_top_countries(timestamptz, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_top_cities(p_since timestamptz, p_limit integer DEFAULT 10)
RETURNS TABLE (city text, country text, visitors bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT v.city, v.country, count(DISTINCT v.session_id) AS visitors
  FROM public.analytics_visitors v
  WHERE v.created_at >= p_since AND v.city IS NOT NULL AND v.city <> 'Desconocido' AND public.is_current_user_admin()
  GROUP BY v.city, v.country
  ORDER BY visitors DESC
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.admin_top_cities(timestamptz, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_traffic_sources(p_since timestamptz)
RETURNS TABLE (referrer_source text, visitors bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT v.referrer_source, count(DISTINCT v.session_id) AS visitors
  FROM public.analytics_visitors v
  WHERE v.created_at >= p_since AND public.is_current_user_admin()
  GROUP BY v.referrer_source
  ORDER BY visitors DESC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_traffic_sources(timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_visitor_daily_series(p_since timestamptz)
RETURNS TABLE (day date, visitors bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT date_trunc('day', v.created_at)::date AS day, count(DISTINCT v.session_id) AS visitors
  FROM public.analytics_visitors v
  WHERE v.created_at >= p_since AND public.is_current_user_admin()
  GROUP BY day
  ORDER BY day ASC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_visitor_daily_series(timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_recent_visitors(p_limit integer DEFAULT 50)
RETURNS TABLE (
  session_id text, country text, city text, referrer_source text,
  landing_page text, is_registered boolean, device_type text, browser text,
  is_new_visitor boolean, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT v.session_id, v.country, v.city, v.referrer_source, v.landing_page,
         (v.user_id IS NOT NULL) AS is_registered, v.device_type, v.browser,
         v.is_new_visitor, v.created_at
  FROM public.analytics_visitors v
  WHERE public.is_current_user_admin()
  ORDER BY v.created_at DESC
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.admin_recent_visitors(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_device_breakdown(p_since timestamptz)
RETURNS TABLE (device_type text, visitors bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT COALESCE(v.device_type, 'Desconocido') AS device_type, count(DISTINCT v.session_id) AS visitors
  FROM public.analytics_visitors v
  WHERE v.created_at >= p_since AND public.is_current_user_admin()
  GROUP BY COALESCE(v.device_type, 'Desconocido')
  ORDER BY visitors DESC;
$$;
GRANT EXECUTE ON FUNCTION public.admin_device_breakdown(timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_new_vs_returning(p_since timestamptz)
RETURNS TABLE (new_visitors bigint, returning_visitors bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT
    count(DISTINCT v.visitor_id) FILTER (WHERE v.is_new_visitor = true),
    count(DISTINCT v.visitor_id) FILTER (WHERE v.is_new_visitor = false)
  FROM public.analytics_visitors v
  WHERE v.created_at >= p_since AND v.visitor_id IS NOT NULL AND public.is_current_user_admin();
$$;
GRANT EXECUTE ON FUNCTION public.admin_new_vs_returning(timestamptz) TO authenticated;

-- ── Verificación ─────────────────────────────────────────────────────
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND (proname LIKE 'admin_%' OR proname = 'is_current_user_admin');
SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_visitors' ORDER BY column_name;
