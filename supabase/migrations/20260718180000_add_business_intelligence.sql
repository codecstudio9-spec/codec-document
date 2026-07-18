-- Módulo Business Intelligence (solo admin) -- responde quién está
-- interesado, qué compran, qué documentos generan, qué páginas convierten
-- y qué empresas piden información. 100% aditivo: nuevas columnas
-- nullable/default-false y una tabla nueva -- no toca el flujo actual de
-- documentos/firmas/pagos.
--
-- Todo lo que lee datos sensibles (ventas, leads, funnel) pasa por
-- funciones SECURITY DEFINER que verifican is_admin_user() -- ninguna
-- da acceso directo de SELECT a `authenticated`/`anon` sobre las tablas.

-- ── Admin check reutilizable ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.email() = 'douglastabordasanchez@gmail.com';
$$;

-- ══════════════════════════════════════════════════════════════════════
-- 1) LEADS EMPRESARIALES
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_business_leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name       text NOT NULL,
  company    text,
  position   text,
  email      text NOT NULL,
  phone      text,
  employees  text,
  country    text,
  city       text,
  language   text CHECK (language IS NULL OR language IN ('es', 'en')),
  message    text,
  status     text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'negotiating', 'closed', 'lost'))
);
ALTER TABLE public.admin_business_leads ENABLE ROW LEVEL SECURITY;
-- Nadie tiene SELECT/UPDATE directo -- solo vía las funciones de abajo.
-- No hay política de INSERT tampoco: el formulario público inserta por
-- submit_business_lead() (SECURITY DEFINER), nunca con una llave directa.

CREATE OR REPLACE FUNCTION public.submit_business_lead(
  p_name text, p_company text, p_position text, p_email text, p_phone text,
  p_employees text, p_country text, p_city text, p_language text, p_message text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.admin_business_leads (name, company, position, email, phone, employees, country, city, language, message)
  VALUES (p_name, p_company, p_position, p_email, p_phone, p_employees, p_country, p_city, p_language, p_message)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_business_lead(text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_business_leads()
RETURNS SETOF public.admin_business_leads LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY SELECT * FROM public.admin_business_leads ORDER BY created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_business_leads() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_lead_status(p_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.admin_business_leads SET status = p_status WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_lead_status(uuid, text) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- 2) VENTAS -- reutiliza paypal_processed_orders, ya existente
-- ══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_sales_summary()
RETURNS TABLE (sales_today numeric, count_today bigint, sales_month numeric, count_month bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COALESCE(SUM(amount_usd) FILTER (WHERE created_at >= date_trunc('day', now())), 0)::numeric,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::bigint,
    COALESCE(SUM(amount_usd) FILTER (WHERE created_at >= date_trunc('month', now())), 0)::numeric,
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now()))::bigint
  FROM public.paypal_processed_orders;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_sales_summary() TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- 3) SEGUIMIENTO POR TIPO DE DOCUMENTO + EMBUDO -- nuevas columnas sobre
--    analytics_visitors (ya existente) y paypal_processed_orders.
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS registered boolean NOT NULL DEFAULT false;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS previewed boolean NOT NULL DEFAULT false;
ALTER TABLE public.analytics_visitors ADD COLUMN IF NOT EXISTS signature_started boolean NOT NULL DEFAULT false;
ALTER TABLE public.paypal_processed_orders ADD COLUMN IF NOT EXISTS document_id text;

CREATE OR REPLACE FUNCTION public.mark_visitor_document_type(p_session_id text, p_document_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.analytics_visitors SET document_type = p_document_type WHERE session_id = p_session_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_visitor_document_type(text, text) TO anon, authenticated;

-- p_step: 'registered' | 'previewed' | 'signature_started'
CREATE OR REPLACE FUNCTION public.mark_visitor_funnel_step(p_session_id text, p_step text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_step = 'registered' THEN
    UPDATE public.analytics_visitors SET registered = true WHERE session_id = p_session_id;
  ELSIF p_step = 'previewed' THEN
    UPDATE public.analytics_visitors SET previewed = true WHERE session_id = p_session_id;
  ELSIF p_step = 'signature_started' THEN
    UPDATE public.analytics_visitors SET signature_started = true WHERE session_id = p_session_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_visitor_funnel_step(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_top_documents()
RETURNS TABLE (document_type text, generated_count bigint, paid_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
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
GRANT EXECUTE ON FUNCTION public.get_top_documents() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_conversion_funnel(days_limit int)
RETURNS TABLE (visited bigint, registered bigint, generated bigint, previewed bigint, purchased bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
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
GRANT EXECUTE ON FUNCTION public.get_conversion_funnel(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_signature_stats(days_limit int)
RETURNS TABLE (started bigint, completed bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE v.signature_started AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint,
    COUNT(*) FILTER (WHERE v.completed_signature AND v.created_at >= now() - (days_limit || ' days')::interval)::bigint
  FROM public.analytics_visitors v;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_signature_stats(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_top_pages()
RETURNS TABLE (landing_page text, visits bigint, conversions bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT v.landing_page, COUNT(*)::bigint, COUNT(*) FILTER (WHERE v.generated_document)::bigint
  FROM public.analytics_visitors v
  WHERE v.landing_page IS NOT NULL
  GROUP BY v.landing_page
  ORDER BY COUNT(*) DESC
  LIMIT 15;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_top_pages() TO authenticated;

-- Verificación
SELECT 'admin_business_leads' AS check, COUNT(*) FROM public.admin_business_leads;
