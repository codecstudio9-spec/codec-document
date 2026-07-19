-- Smart Quotes / Cotizaciones Inteligentes -- Fase 1 (esquema + firma).
-- 100% aditivo: nuevas tablas + nuevas columnas en users, no toca
-- documents/signers/signing_links existentes salvo un trigger de SOLO
-- LECTURA sobre su cambio de estado (no modifica su comportamiento).

-- ══════════════════════════════════════════════════════════════════════
-- 1) Identidad de marca ampliada (colores/fuente/datos bancarios) --
--    reutiliza la tabla users + update_user_branding ya existentes
--    (ver supabase_add_branding_identity_migration.sql) en vez de crear
--    un /my-company-branding paralelo.
-- ══════════════════════════════════════════════════════════════════════
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_color_primary   text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_color_secondary text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS brand_font            text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_name             text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bank_account          text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_ach           text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_zelle         text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_nequi         text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_daviplata     text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payment_paypal        text;

DROP FUNCTION IF EXISTS public.update_user_branding(
  text, text, text, text, boolean, boolean, boolean, text, text, text, text, text, text, text, text, text, text, text, text
);
CREATE OR REPLACE FUNCTION public.update_user_branding(
  p_company_logo_url      text,
  p_logo_size             text,
  p_header_text           text,
  p_footer_text           text,
  p_use_watermark         boolean,
  p_use_global_branding   boolean,
  p_enable_logo_in_docs   boolean,
  p_logo_position         text,
  p_company_legal_name    text,
  p_company_address_line1 text,
  p_company_address_line2 text,
  p_company_city          text,
  p_company_state         text,
  p_company_zip           text,
  p_company_country       text,
  p_company_ein           text,
  p_company_phone         text,
  p_company_email         text,
  p_company_website       text,
  p_brand_color_primary   text DEFAULT NULL,
  p_brand_color_secondary text DEFAULT NULL,
  p_brand_font            text DEFAULT NULL,
  p_bank_name             text DEFAULT NULL,
  p_bank_account          text DEFAULT NULL,
  p_payment_ach           text DEFAULT NULL,
  p_payment_zelle         text DEFAULT NULL,
  p_payment_nequi         text DEFAULT NULL,
  p_payment_daviplata     text DEFAULT NULL,
  p_payment_paypal        text DEFAULT NULL
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE public.users SET
    company_logo_url = p_company_logo_url, logo_size = p_logo_size,
    header_text = p_header_text, footer_text = p_footer_text,
    use_watermark = p_use_watermark, use_global_branding = p_use_global_branding,
    enable_logo_in_docs = p_enable_logo_in_docs, logo_position = p_logo_position,
    company_legal_name = p_company_legal_name,
    company_address_line1 = p_company_address_line1, company_address_line2 = p_company_address_line2,
    company_city = p_company_city, company_state = p_company_state, company_zip = p_company_zip,
    company_country = p_company_country, company_ein = p_company_ein,
    company_phone = p_company_phone, company_email = p_company_email, company_website = p_company_website,
    brand_color_primary = p_brand_color_primary, brand_color_secondary = p_brand_color_secondary,
    brand_font = p_brand_font, bank_name = p_bank_name, bank_account = p_bank_account,
    payment_ach = p_payment_ach, payment_zelle = p_payment_zelle, payment_nequi = p_payment_nequi,
    payment_daviplata = p_payment_daviplata, payment_paypal = p_payment_paypal
  WHERE id = auth.uid();
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_user_branding(
  text, text, text, text, boolean, boolean, boolean, text, text, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- 2) Cotizaciones
-- ══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.quotes (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_number             text NOT NULL,
  status                   text NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected')),
  country                  text,
  language                 text NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  quote_type               text NOT NULL DEFAULT 'quote', -- 'quote'|'proposal'|'estimate'|'sow'
  client_name              text NOT NULL,
  client_company           text,
  client_position          text,
  client_email             text,
  client_phone             text,
  client_address           text,
  project_name             text,
  executive_summary        text,
  project_objective        text,
  project_scope            text,
  -- Bloques activables de la propuesta comercial -- jsonb libre en vez de
  -- una columna booleana por bloque, para poder agregar/quitar bloques
  -- sin nueva migracion cada vez: { intro, problem, solution, benefits,
  -- exclusions, timeline, terms, warranty, payment_terms, notes }
  proposal_blocks          jsonb NOT NULL DEFAULT '{}'::jsonb,
  subtotal                 numeric(12,2) NOT NULL DEFAULT 0,
  discount_total           numeric(12,2) NOT NULL DEFAULT 0,
  tax_total                numeric(12,2) NOT NULL DEFAULT 0,
  total                    numeric(12,2) NOT NULL DEFAULT 0,
  template                 text NOT NULL DEFAULT 'corporate',
  pdf_url                  text,
  signed                   boolean NOT NULL DEFAULT false,
  -- Apunta a documents.id una vez que se solicita firma (createDocumentRecord
  -- ya existente) -- el trigger de abajo usa esto para marcar la cotizacion
  -- como aceptada cuando ese documento termine de firmarse, reutilizando
  -- 100% del motor de firmas/auditoria que ya existe.
  signature_transaction_id uuid,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quotes_owner_all" ON public.quotes;
CREATE POLICY "quotes_owner_all" ON public.quotes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.quote_line_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id     uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  position     integer NOT NULL DEFAULT 0,
  description  text NOT NULL,
  quantity     numeric(12,2) NOT NULL DEFAULT 1,
  unit         text,
  unit_price   numeric(12,2) NOT NULL DEFAULT 0,
  discount_pct numeric(5,2) NOT NULL DEFAULT 0,
  tax_pct      numeric(5,2) NOT NULL DEFAULT 0
);
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quote_items_owner_all" ON public.quote_line_items;
CREATE POLICY "quote_items_owner_all" ON public.quote_line_items
  FOR ALL USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_id AND q.user_id = auth.uid()));

-- Seguimiento de apertura -- "el cliente abrio la propuesta hace 2 horas",
-- cuantas veces, desde que pais/dispositivo. INSERT publico (el cliente
-- no tiene sesion), lectura solo del dueno via get_quote_view_stats.
CREATE TABLE IF NOT EXISTS public.quote_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id   uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  country    text,
  city       text,
  device     text
);
ALTER TABLE public.quote_views ENABLE ROW LEVEL SECURITY;
-- Sin politicas directas -- solo via record_quote_view()/get_quote_view_stats().

-- ── RPCs ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_quote(p_quote jsonb, p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_item jsonb;
  v_pos integer := 0;
BEGIN
  INSERT INTO public.quotes (
    user_id, quote_number, country, language, quote_type, client_name, client_company,
    client_position, client_email, client_phone, client_address, project_name,
    executive_summary, project_objective, project_scope, proposal_blocks,
    subtotal, discount_total, tax_total, total, template
  ) VALUES (
    auth.uid(),
    COALESCE(p_quote->>'quote_number', 'Q-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4)),
    p_quote->>'country', COALESCE(p_quote->>'language', 'es'), COALESCE(p_quote->>'quote_type', 'quote'),
    p_quote->>'client_name', p_quote->>'client_company', p_quote->>'client_position',
    p_quote->>'client_email', p_quote->>'client_phone', p_quote->>'client_address',
    p_quote->>'project_name', p_quote->>'executive_summary', p_quote->>'project_objective', p_quote->>'project_scope',
    COALESCE(p_quote->'proposal_blocks', '{}'::jsonb),
    COALESCE((p_quote->>'subtotal')::numeric, 0), COALESCE((p_quote->>'discount_total')::numeric, 0),
    COALESCE((p_quote->>'tax_total')::numeric, 0), COALESCE((p_quote->>'total')::numeric, 0),
    COALESCE(p_quote->>'template', 'corporate')
  ) RETURNING id INTO v_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) LOOP
    INSERT INTO public.quote_line_items (quote_id, position, description, quantity, unit, unit_price, discount_pct, tax_pct)
    VALUES (
      v_id, v_pos, v_item->>'description', COALESCE((v_item->>'quantity')::numeric, 1), v_item->>'unit',
      COALESCE((v_item->>'unit_price')::numeric, 0), COALESCE((v_item->>'discount_pct')::numeric, 0),
      COALESCE((v_item->>'tax_pct')::numeric, 0)
    );
    v_pos := v_pos + 1;
  END LOOP;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_quote(jsonb, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_quote(p_id uuid, p_quote jsonb, p_items jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item jsonb;
  v_pos integer := 0;
BEGIN
  UPDATE public.quotes SET
    country = p_quote->>'country', language = COALESCE(p_quote->>'language', language),
    quote_type = COALESCE(p_quote->>'quote_type', quote_type),
    client_name = p_quote->>'client_name', client_company = p_quote->>'client_company',
    client_position = p_quote->>'client_position', client_email = p_quote->>'client_email',
    client_phone = p_quote->>'client_phone', client_address = p_quote->>'client_address',
    project_name = p_quote->>'project_name', executive_summary = p_quote->>'executive_summary',
    project_objective = p_quote->>'project_objective', project_scope = p_quote->>'project_scope',
    proposal_blocks = COALESCE(p_quote->'proposal_blocks', proposal_blocks),
    subtotal = COALESCE((p_quote->>'subtotal')::numeric, subtotal),
    discount_total = COALESCE((p_quote->>'discount_total')::numeric, discount_total),
    tax_total = COALESCE((p_quote->>'tax_total')::numeric, tax_total),
    total = COALESCE((p_quote->>'total')::numeric, total),
    template = COALESCE(p_quote->>'template', template),
    updated_at = now()
  WHERE id = p_id AND user_id = auth.uid();

  IF p_items IS NOT NULL THEN
    DELETE FROM public.quote_line_items WHERE quote_id = p_id;
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO public.quote_line_items (quote_id, position, description, quantity, unit, unit_price, discount_pct, tax_pct)
      VALUES (
        p_id, v_pos, v_item->>'description', COALESCE((v_item->>'quantity')::numeric, 1), v_item->>'unit',
        COALESCE((v_item->>'unit_price')::numeric, 0), COALESCE((v_item->>'discount_pct')::numeric, 0),
        COALESCE((v_item->>'tax_pct')::numeric, 0)
      );
      v_pos := v_pos + 1;
    END LOOP;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_quote(uuid, jsonb, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_quote_pdf_and_status(p_id uuid, p_pdf_url text, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.quotes SET pdf_url = COALESCE(p_pdf_url, pdf_url), status = COALESCE(p_status, status), updated_at = now()
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_quote_pdf_and_status(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_quote_signature(p_id uuid, p_document_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.quotes SET signature_transaction_id = p_document_id, status = 'sent', updated_at = now()
  WHERE id = p_id AND user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.link_quote_signature(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_my_quotes()
RETURNS SETOF public.quotes LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.quotes WHERE user_id = auth.uid() ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_quotes() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_quote_full(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'quote', to_jsonb(q.*),
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(i.*) ORDER BY i.position) FROM public.quote_line_items i WHERE i.quote_id = q.id), '[]'::jsonb)
  ) INTO v_result
  FROM public.quotes q WHERE q.id = p_id AND q.user_id = auth.uid();
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_quote_full(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_quote(p_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.quotes WHERE id = p_id AND user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_quote(uuid) TO authenticated;

-- ── Vista publica de la cotizacion (el cliente no tiene sesion) ─────────
CREATE OR REPLACE FUNCTION public.get_quote_public(p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'quote', to_jsonb(q.*) - 'user_id',
    'items', COALESCE((SELECT jsonb_agg(to_jsonb(i.*) ORDER BY i.position) FROM public.quote_line_items i WHERE i.quote_id = q.id), '[]'::jsonb),
    'branding', (SELECT to_jsonb(u.*) FROM (
      SELECT company_logo_url, company_legal_name, company_address_line1, company_address_line2,
             company_city, company_state, company_country, company_phone, company_email, company_website,
             brand_color_primary, brand_color_secondary, brand_font,
             bank_name, bank_account, payment_ach, payment_zelle, payment_nequi, payment_daviplata, payment_paypal
      FROM public.users WHERE id = q.user_id
    ) u)
  ) INTO v_result
  FROM public.quotes q WHERE q.id = p_id;
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_quote_public(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_quote_view(p_id uuid, p_country text, p_city text, p_device text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.quote_views (quote_id, country, city, device) VALUES (p_id, p_country, p_city, p_device);
  UPDATE public.quotes SET status = 'viewed' WHERE id = p_id AND status = 'sent';
END;
$$;
GRANT EXECUTE ON FUNCTION public.record_quote_view(uuid, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_quote_view_stats(p_id uuid)
RETURNS TABLE (view_count bigint, first_viewed_at timestamptz, last_viewed_at timestamptz, countries text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.quotes WHERE id = p_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT COUNT(*)::bigint, MIN(viewed_at), MAX(viewed_at), ARRAY_AGG(DISTINCT country) FILTER (WHERE country IS NOT NULL)
  FROM public.quote_views WHERE quote_id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_quote_view_stats(uuid) TO authenticated;

-- ── Analitica agregada del creador (todas sus cotizaciones) ─────────────
CREATE OR REPLACE FUNCTION public.get_quotes_summary()
RETURNS TABLE (
  total_count bigint, sent_count bigint, viewed_count bigint, accepted_count bigint, rejected_count bigint,
  quoted_value numeric, accepted_value numeric
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE status IN ('sent', 'viewed', 'accepted', 'rejected'))::bigint,
    COUNT(*) FILTER (WHERE status IN ('viewed', 'accepted', 'rejected'))::bigint,
    COUNT(*) FILTER (WHERE status = 'accepted')::bigint,
    COUNT(*) FILTER (WHERE status = 'rejected')::bigint,
    COALESCE(SUM(total), 0),
    COALESCE(SUM(total) FILTER (WHERE status = 'accepted'), 0)
  FROM public.quotes WHERE user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_quotes_summary() TO authenticated;

-- ── Trigger: cuando el documento de firma vinculado se completa, la
--    cotizacion pasa a "accepted" automaticamente -- reutiliza el motor
--    de firmas existente (signers.status = 'completed') sin tocarlo.
CREATE OR REPLACE FUNCTION public.mark_quote_accepted_on_signature()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE public.quotes SET status = 'accepted', signed = true, updated_at = now()
    WHERE signature_transaction_id = NEW.document_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_mark_quote_accepted ON public.signers;
CREATE TRIGGER trg_mark_quote_accepted
  AFTER UPDATE OF status ON public.signers
  FOR EACH ROW EXECUTE FUNCTION public.mark_quote_accepted_on_signature();

-- Verificacion
SELECT 'quotes' AS check, COUNT(*) FROM public.quotes;
