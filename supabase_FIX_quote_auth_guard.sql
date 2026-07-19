-- Defensa explicita: create_quote insertaba con user_id = auth.uid() sin
-- verificar primero que auth.uid() no fuera NULL -- una llamada anonima
-- solo fallaba por casualidad (la restriccion NOT NULL de la columna),
-- no por una verificacion real. Mismo patron de riesgo que el bug de
-- is_admin_user() encontrado antes en este proyecto -- se corrige aqui
-- explicitamente en vez de confiar en un efecto secundario.
CREATE OR REPLACE FUNCTION public.create_quote(p_quote jsonb, p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
  v_item jsonb;
  v_pos integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

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

-- Verificacion: debe fallar con "Authentication required" sin JWT real.
