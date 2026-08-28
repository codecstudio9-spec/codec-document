-- Opciones alternativas dentro de una cotizacion (p. ej. "Plan Esencial /
-- Profesional / Premium") -- antes cada plan era un item mas y el PDF sumaba
-- los tres, mostrando un total que nadie iba a pagar. Un item con
-- option_group NO es una alternativa; ver la nota completa en
-- QuoteLineItem (quotes-service.ts) y computeQuoteTotals, que ya excluye
-- estos items del subtotal/total en el cliente antes de guardar.

ALTER TABLE public.quote_line_items ADD COLUMN IF NOT EXISTS option_group text;

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
    INSERT INTO public.quote_line_items (quote_id, position, description, quantity, unit, unit_price, discount_pct, tax_pct, option_group)
    VALUES (
      v_id, v_pos, v_item->>'description', COALESCE((v_item->>'quantity')::numeric, 1), v_item->>'unit',
      COALESCE((v_item->>'unit_price')::numeric, 0), COALESCE((v_item->>'discount_pct')::numeric, 0),
      COALESCE((v_item->>'tax_pct')::numeric, 0), NULLIF(v_item->>'option_group', '')
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
      INSERT INTO public.quote_line_items (quote_id, position, description, quantity, unit, unit_price, discount_pct, tax_pct, option_group)
      VALUES (
        p_id, v_pos, v_item->>'description', COALESCE((v_item->>'quantity')::numeric, 1), v_item->>'unit',
        COALESCE((v_item->>'unit_price')::numeric, 0), COALESCE((v_item->>'discount_pct')::numeric, 0),
        COALESCE((v_item->>'tax_pct')::numeric, 0), NULLIF(v_item->>'option_group', '')
      );
      v_pos := v_pos + 1;
    END LOOP;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_quote(uuid, jsonb, jsonb) TO authenticated;
