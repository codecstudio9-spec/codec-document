-- La dirección elegida va limpia, sin el sufijo al azar:
--   contabilidad-taborda@facturas.codecdocument.com
--
-- ── Por qué se quita, si el sufijo era la protección ─────────────────────
-- El sufijo existía para que la dirección no se pudiera adivinar. Pero el
-- motivo por el que esta dirección existe es que el contador se la DICTE a un
-- proveedor por teléfono, y `contabilidad-taborda-san-845e7ece` no se dicta:
-- se deletrea tres veces y se apunta mal. Una credencial que hay que dictar
-- deja de ser una credencial.
--
-- Y mirándolo de cerca, el modelo de «dirección secreta» era el raro aquí.
-- Toda la facturación electrónica colombiana funciona con direcciones de
-- recepción públicas y adivinables —`facturacion@empresa.com` lo es, y la
-- DIAN obliga a tener una—. La defensa real del sector no es que nadie sepa
-- la dirección: es que quien recibe mira lo que llega.
--
-- ── Qué protege entonces ─────────────────────────────────────────────────
-- Que un desconocido pueda escribir a la dirección NO significa que pueda
-- meter nada en la contabilidad de nadie:
--   · lo que llega se queda en la bandeja, sin procesar;
--   · la bandeja enseña remitente, asunto y nombre de archivo;
--   · procesar es un gesto explícito del contador, documento a documento;
--   · y el parser y el auditor siguen validando lo que entra.
-- Lo peor que consigue un desconocido es ensuciar una bandeja que el contador
-- vacía sin procesar.
--
-- ── Lo que NO cambia ─────────────────────────────────────────────────────
-- La dirección que se genera sola al activar el conector sigue siendo
-- aleatoria. Nadie acaba con una dirección adivinable sin haberla elegido:
-- hay que ir a ponerle nombre a propósito.
--
-- Y como ahora el nombre es la dirección entera, pasa a ser único en todo el
-- sistema. El índice único de `inbox_token` ya lo garantizaba; lo que cambia
-- es que hay que explicarlo cuando choque, en vez de reintentar en silencio.

CREATE OR REPLACE FUNCTION public.ed_email_alias(p_alias text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_alias text;
  v_plan  public.ed_plans;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  IF NOT public.ed_email_disponible() THEN
    SELECT * INTO v_plan FROM public.ed_plan_vigente();
    RAISE EXCEPTION 'La recepción por correo está disponible desde el plan Básico. Tu plan actual es %.', v_plan.name;
  END IF;

  v_alias := public.ed_email_alias_normalizar(p_alias);

  IF v_alias IS NULL OR length(v_alias) < 4 THEN
    -- 4 y no 3: al ser la dirección entera, los nombres muy cortos son los que
    -- todo el mundo querría y se agotarían el primer día.
    RAISE EXCEPTION 'El nombre necesita al menos 4 letras o números.';
  END IF;

  IF public.ed_email_alias_reservado(v_alias) THEN
    RAISE EXCEPTION 'Ese nombre está reservado. Prueba con el tuyo o el de tu oficina.';
  END IF;

  BEGIN
    UPDATE ed_connector_state
       SET inbox_token = v_alias,
           inbox_enabled = true,
           updated_at = now()
     WHERE owner_user_id = auth.uid()
       AND connector = 'email'
       AND fiscal_entity_id IS NULL;

    IF NOT FOUND THEN
      INSERT INTO ed_connector_state (owner_user_id, connector, inbox_token, inbox_enabled)
      VALUES (auth.uid(), 'email', v_alias, true);
    END IF;
  EXCEPTION WHEN unique_violation THEN
    -- Se dice que está ocupado, no que «hubo un error». Es la diferencia entre
    -- probar otro nombre y pensar que la herramienta está rota.
    RAISE EXCEPTION 'Ya hay otra oficina usando «%». Prueba añadiendo tu ciudad o tu NIT.', v_alias;
  END;

  RETURN jsonb_build_object('token', v_alias, 'activo', true);
END $$;

REVOKE ALL ON FUNCTION public.ed_email_alias(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_alias(text) TO authenticated;
