-- Analytics-only admin grants -- lets the primary admin (is_admin_user())
-- give specific emails read access to /dashboard/admin/analytics (both the
-- "Comercial" and "Visitantes" tabs) WITHOUT full admin access: they can't
-- grant/revoke access themselves (grant_analytics_access/
-- revoke_analytics_access/list_analytics_admins stay is_admin_user()-only),
-- and nothing outside this analytics page treats them as admin.
--
-- NOTE: get_analytics_summary / get_visitors_trend /
-- get_traffic_sources_summary / get_location_summary / get_recent_visitors
-- (the "Visitantes" tab's data) are NOT touched here -- those were already
-- callable by any authenticated user with no admin check at all (a
-- pre-existing gap, not introduced by this migration). A granted analytics
-- viewer sees that tab's data the same way any logged-in user already
-- technically could; only the client-side route gate is what's new for them.

CREATE TABLE IF NOT EXISTS public.analytics_admins (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by text
);
ALTER TABLE public.analytics_admins ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT/DELETE policy for anon/authenticated -- every access
-- goes through the SECURITY DEFINER functions below (same pattern as
-- admin_business_leads in 20260718180000_add_business_intelligence.sql).

CREATE OR REPLACE FUNCTION public.is_analytics_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user() OR EXISTS (
    SELECT 1 FROM public.analytics_admins WHERE email = COALESCE(auth.email(), '')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_analytics_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.grant_analytics_access(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  INSERT INTO public.analytics_admins (email, granted_by)
  VALUES (lower(trim(p_email)), auth.email())
  ON CONFLICT (email) DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.grant_analytics_access(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_analytics_access(p_email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  DELETE FROM public.analytics_admins WHERE email = lower(trim(p_email));
END;
$$;
GRANT EXECUTE ON FUNCTION public.revoke_analytics_access(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_analytics_admins()
RETURNS SETOF public.analytics_admins LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY SELECT * FROM public.analytics_admins ORDER BY granted_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_analytics_admins() TO authenticated;

-- ── Widen the "Comercial" tab RPCs from is_admin_user()-only to
--    is_analytics_admin() (= is_admin_user() OR granted email). Bodies are
--    unchanged from 20260718180000_add_business_intelligence.sql /
--    20260719180000_add_promo_unlimited_per_user.sql -- only the guard
--    changes; signatures stay identical (CREATE OR REPLACE in place).
CREATE OR REPLACE FUNCTION public.get_business_leads()
RETURNS SETOF public.admin_business_leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY SELECT * FROM public.admin_business_leads ORDER BY created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_lead_status(p_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.admin_business_leads SET status = p_status WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_summary()
RETURNS TABLE (sales_today numeric, count_today bigint, sales_month numeric, count_month bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount_usd) FILTER (WHERE created_at >= date_trunc('day', now())), 0)::numeric,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::bigint,
    COALESCE(SUM(amount_usd) FILTER (WHERE created_at >= date_trunc('month', now())), 0)::numeric,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()))::bigint
  FROM public.paypal_processed_orders;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_documents()
RETURNS TABLE (document_type text, generated_count bigint, paid_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    v.document_type,
    COUNT(*)::bigint AS generated_count,
    (SELECT COUNT(*) FROM public.paypal_processed_orders o WHERE o.document_id = v.document_type)::bigint AS paid_count
  FROM public.analytics_visitors v
  WHERE v.document_type IS NOT NULL AND v.created_at >= now() - interval '30 days'
  GROUP BY v.document_type
  ORDER BY COUNT(*) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_conversion_funnel(days_limit int)
RETURNS TABLE (visited bigint, registered bigint, generated bigint, previewed bigint, purchased bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.registered AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.generated_document AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.previewed AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    (SELECT COUNT(*) FROM public.paypal_processed_orders o WHERE o.created_at >= now() - (days_limit || ' days')::interval)::bigint
  FROM public.analytics_visitors v;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_signature_stats(days_limit int)
RETURNS TABLE (started bigint, completed bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE v.signature_started AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.completed_signature AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint
  FROM public.analytics_visitors v;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_top_pages()
RETURNS TABLE (landing_page text, visits bigint, conversions bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT v.landing_page, COUNT(*)::bigint, COUNT(*) FILTER (WHERE v.generated_document)::bigint
  FROM public.analytics_visitors v
  WHERE v.landing_page IS NOT NULL
  GROUP BY v.landing_page
  ORDER BY COUNT(*) DESC
  LIMIT 15;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_promo_code_usage(p_code text)
RETURNS TABLE (
  redeemed_at timestamptz, user_email text, ip_address text, product text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT r.redeemed_at, u.email, r.ip_address, r.product
  FROM public.promo_redemptions r
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.code = upper(trim(p_code))
  ORDER BY r.redeemed_at DESC;
END;
$$;

-- Verificación
SELECT 'analytics_admins' AS check, COUNT(*) FROM public.analytics_admins;
