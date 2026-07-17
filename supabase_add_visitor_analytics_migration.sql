-- ============================================================
-- CODEC DOCUMENT — Analítica de visitantes (origen + geografía)
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
--
-- Una sola fila por SESIÓN de visitante (no por page view) — el pedido
-- fue específicamente "de dónde vienen las personas" y "quiénes son
-- los que me visitan", no un pipeline completo de eventos de negocio.
-- No se guarda IP cruda: solo país/ciudad/región derivados de una API
-- de geolocalización pública, y un session_id aleatorio (no ligado a
-- la IP) generado en el navegador.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.analytics_visitors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      text NOT NULL,
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  country         text,
  country_code    text,
  city            text,
  region          text,
  referrer_source text NOT NULL DEFAULT 'direct',
  referrer_host   text,
  landing_page    text,
  language        text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_visitors_session_idx ON public.analytics_visitors (session_id);
CREATE INDEX IF NOT EXISTS analytics_visitors_created_idx ON public.analytics_visitors (created_at);
CREATE INDEX IF NOT EXISTS analytics_visitors_country_idx ON public.analytics_visitors (country);
CREATE INDEX IF NOT EXISTS analytics_visitors_source_idx ON public.analytics_visitors (referrer_source);

ALTER TABLE public.analytics_visitors ENABLE ROW LEVEL SECURITY;

-- Cualquier visitante (con o sin cuenta) puede insertar SU PROPIA fila de
-- sesión — el tracking tiene que funcionar para anónimos. Sin política de
-- SELECT/UPDATE/DELETE para clientes: solo se lee vía las RPCs de abajo,
-- mismo patrón ya usado en document_invitations para no repetir el hueco
-- de "cualquiera puede leer todo" que tuvieron signing_links/signers.
DROP POLICY IF EXISTS "analytics_visitors_insert" ON public.analytics_visitors;
CREATE POLICY "analytics_visitors_insert" ON public.analytics_visitors
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ── Helper: ¿el usuario autenticado actual es admin? ──────────────────
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.users WHERE id = auth.uid()),
    false
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- ── RPCs de agregación (solo devuelven datos si el caller es admin) ───

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
  WHERE v.created_at >= p_since AND v.country IS NOT NULL AND public.is_current_user_admin()
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
  WHERE v.created_at >= p_since AND v.city IS NOT NULL AND public.is_current_user_admin()
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
  landing_page text, is_registered boolean, created_at timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT v.session_id, v.country, v.city, v.referrer_source, v.landing_page,
         (v.user_id IS NOT NULL) AS is_registered, v.created_at
  FROM public.analytics_visitors v
  WHERE public.is_current_user_admin()
  ORDER BY v.created_at DESC
  LIMIT p_limit;
$$;
GRANT EXECUTE ON FUNCTION public.admin_recent_visitors(integer) TO authenticated;

-- ── Verificación ─────────────────────────────────────────────────────
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname LIKE 'admin_%';
