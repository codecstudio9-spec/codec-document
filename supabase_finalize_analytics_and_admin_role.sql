-- ============================================================
-- CODEC DOCUMENT — Finaliza analytics_visitors + rol de admin
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente y NO
-- destructivo (no borra columnas, filas, ni la tabla profiles).
--
-- QUÉ PASÓ: lo que se creó en Supabase no fue mi archivo .sql
-- original — quedó con nombres de columna distintos
-- (traffic_source en vez de referrer_source, path_visited en vez de
-- landing_page) y un rol en una tabla nueva "profiles" separada,
-- con una política RLS rota (recursión infinita: la política de
-- "profiles" se consulta a sí misma, así que ni siquiera se puede
-- leer la tabla ahora mismo).
--
-- DECISIÓN: en vez de pelear con esas dos tablas nuevas, este script:
--  1. Se adapta a analytics_visitors tal como quedó — agrega SOLO las
--     columnas que faltan (nunca renombra ni toca las que ya existen).
--  2. Ignora "profiles" por completo — el rol de admin se agrega a
--     public.users, que es la tabla que YA usa el resto de la app
--     (plan_type, plan_status, etc.) desde antes de este módulo. Es
--     más simple tener un solo lugar para "quién es quién" que dos
--     tablas de identidad separadas. "profiles" se puede borrar
--     cuando quieras (no lo hace este script — decisión tuya), no
--     afecta nada si se queda ahí sin usarse.
-- ============================================================


-- ── PARTE A — Rol de administrador en public.users (la tabla real) ────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

UPDATE public.users SET role = 'admin' WHERE lower(email) = 'douglastabordasanchez@gmail.com';


-- ── PARTE B — Columnas que le faltan a analytics_visitors ─────────────
-- (session_id, country, city, region, traffic_source, path_visited,
-- created_at ya existen tal como quedaron — no se tocan)
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS visitor_id      text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS country_code    text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS referrer_host   text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS language        text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS device_type     text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS browser         text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS is_new_visitor  boolean;

CREATE INDEX IF NOT EXISTS analytics_visitors_session_idx ON public.analytics_visitors (session_id);
CREATE INDEX IF NOT EXISTS analytics_visitors_visitor_idx ON public.analytics_visitors (visitor_id);
CREATE INDEX IF NOT EXISTS analytics_visitors_created_idx ON public.analytics_visitors (created_at);
CREATE INDEX IF NOT EXISTS analytics_visitors_country_idx ON public.analytics_visitors (country);
CREATE INDEX IF NOT EXISTS analytics_visitors_source_idx  ON public.analytics_visitors (traffic_source);

ALTER TABLE public.analytics_visitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "analytics_visitors_insert" ON public.analytics_visitors;
CREATE POLICY "analytics_visitors_insert" ON public.analytics_visitors
  FOR INSERT TO anon, authenticated WITH CHECK (true);


-- ── PARTE C — Helper de admin (contra public.users, no profiles) ──────
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.users WHERE id = auth.uid()), false);
$$;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;


-- ── PARTE D — RPCs de agregación ───────────────────────────────────────
-- Internamente leen traffic_source/path_visited (los nombres reales),
-- pero DEVUELVEN referrer_source/landing_page como alias — así el
-- código del cliente (analytics-service.ts) no necesita cambiar nada
-- en cómo lee las respuestas de estas funciones.

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
  SELECT v.traffic_source AS referrer_source, count(DISTINCT v.session_id) AS visitors
  FROM public.analytics_visitors v
  WHERE v.created_at >= p_since AND public.is_current_user_admin()
  GROUP BY v.traffic_source
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
  SELECT v.session_id, v.country, v.city, v.traffic_source AS referrer_source,
         v.path_visited AS landing_page, (v.user_id IS NOT NULL) AS is_registered,
         v.device_type, v.browser, v.is_new_visitor, v.created_at
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
SELECT id, email, role FROM public.users WHERE role = 'admin';
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND (proname LIKE 'admin_%' OR proname = 'is_current_user_admin');
SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'analytics_visitors' ORDER BY column_name;
