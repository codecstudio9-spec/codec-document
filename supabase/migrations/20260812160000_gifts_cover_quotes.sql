-- Los documentos regalados también sirven para cotizaciones.
--
-- ── El fallo ─────────────────────────────────────────────────────────────
--
-- La migración 20260812130000 enganchó los regalos a try_consume_document_72h
-- y a nada más. Pero cada cosa que se puede crear lleva SU PROPIO contador de
-- 72 horas —documentos, cotizaciones, firmas— en tablas distintas y con
-- funciones distintas. Resultado: a quien recibía «2 documentos gratis» y se
-- ponía a hacer una cotización se le seguía cobrando, porque la cotización
-- pasaba por try_consume_quote_72h, que no sabía que existían los regalos.
--
-- ── El arreglo ───────────────────────────────────────────────────────────
--
-- El regalo pasa a ser un fondo común. Se saca el gasto a una función
-- compartida, `spend_document_gift()`, y la llaman tanto los documentos como
-- las cotizaciones. Un regalo de 2 se puede usar en dos documentos, en dos
-- cotizaciones, o en una de cada — es capacidad, no un cupo por tipo.
--
-- Las FIRMAS se quedan fuera a propósito. Son otro producto («firmas», no
-- «documentos»), tienen su propio sistema de créditos (user_credits.credits)
-- y regalar «2 documentos» para gastarlos en solicitudes de firma sería una
-- sorpresa en la otra dirección. Si hiciera falta, se añade igual que aquí.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

/**
 * Gasta un documento regalado, si queda alguno. Devuelve true si lo gastó.
 *
 * FOR UPDATE SKIP LOCKED evita que dos pestañas abiertas a la vez gasten dos
 * veces el mismo regalo; del más antiguo al más nuevo, para que el primero
 * que se recibió sea el primero que se usa.
 */
CREATE OR REPLACE FUNCTION public.spend_document_gift(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_gift uuid;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;

  SELECT g.id INTO v_gift
  FROM public.document_gifts g
  WHERE g.user_id = p_user_id AND g.remaining > 0
  ORDER BY g.created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_gift IS NULL THEN RETURN false; END IF;

  UPDATE public.document_gifts SET remaining = remaining - 1 WHERE id = v_gift;
  RETURN true;
END;
$$;
-- No se concede a nadie: sólo la llaman las funciones de cupo, que ya son
-- SECURITY DEFINER. Expuesta, cualquiera podría vaciar sus propios regalos.
REVOKE ALL ON FUNCTION public.spend_document_gift(uuid) FROM PUBLIC, anon, authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- Documentos — ahora usando la función compartida
-- ══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.try_consume_document_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;

  SELECT COUNT(*) INTO v_count FROM public.document_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';

  IF v_count < p_limit THEN
    INSERT INTO public.document_creation_events (user_id) VALUES (p_user_id);
    RETURN true;
  END IF;

  -- Cupo agotado: se tira del regalo.
  IF public.spend_document_gift(p_user_id) THEN
    INSERT INTO public.document_creation_events (user_id) VALUES (p_user_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_document_72h(uuid, integer) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- Cotizaciones — el caso que estaba cobrando de más
-- ══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.try_consume_quote_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;

  SELECT COUNT(*) INTO v_count FROM public.quote_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';

  IF v_count < p_limit THEN
    INSERT INTO public.quote_creation_events (user_id) VALUES (p_user_id);
    RETURN true;
  END IF;

  IF public.spend_document_gift(p_user_id) THEN
    INSERT INTO public.quote_creation_events (user_id) VALUES (p_user_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_quote_72h(uuid, integer) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- Saldo, para poder decírselo a la persona antes de que se lleve el susto
-- ══════════════════════════════════════════════════════════════════════
--
-- Ya existía my_document_gift_balance(); se deja igual pero se documenta que
-- ahora ese saldo vale para las dos cosas.
COMMENT ON FUNCTION public.my_document_gift_balance() IS
  'Documentos regalados sin usar. Valen tanto para documentos como para cotizaciones.';

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('spend_document_gift', 'try_consume_document_72h', 'try_consume_quote_72h');
