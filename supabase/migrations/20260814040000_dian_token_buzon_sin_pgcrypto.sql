-- Arregla «function gen_random_bytes(integer) does not exist» al crear la
-- dirección de correo.
--
-- ── Qué pasaba ───────────────────────────────────────────────────────────
-- `ed_email_activar()` generaba el token del buzón con `gen_random_bytes()`,
-- que es de la extensión pgcrypto. La función es SECURITY DEFINER y lleva
-- `SET search_path = public` —correcto, y obligatorio: sin fijarlo, quien
-- llame puede anteponer un esquema suyo y hacer que la función ejecute SU
-- versión de cualquier cosa que invoque—. Pero en Supabase pgcrypto vive en el
-- esquema `extensions`, así que con el search_path fijado a `public` la
-- función simplemente no existe para ella.
--
-- El resultado era que «Crear mi dirección» fallaba SIEMPRE, para cualquier
-- contador, desde que se escribió. No se había detectado porque la única
-- cuenta con la que se probó el conector ya tenía el token creado de antes.
--
-- ── Por qué gen_random_uuid y no arreglar el search_path ─────────────────
-- Se podía añadir `extensions` al search_path o llamar a
-- `extensions.gen_random_bytes()`. Las dos atan esto a que pgcrypto siga
-- instalado y en ese esquema concreto, que es exactamente el tipo de supuesto
-- que acaba de fallar. `gen_random_uuid()` es Postgres del núcleo desde la
-- versión 13: vive en pg_catalog, que está SIEMPRE en el camino de búsqueda
-- por debajo de lo que uno fije. No hay nada que se pueda desinstalar ni
-- mover. Es además lo que ya usa el resto de migraciones de este repo.
--
-- ── Sobre la aleatoriedad ────────────────────────────────────────────────
-- Un UUID v4 en hexadecimal son 32 caracteres, de los cuales dos NO son
-- aleatorios: el 13 es siempre '4' (la versión) y el 17 marca la variante.
-- Coger «los primeros 20» habría metido esos dos dentro y dejado 74 bits en
-- vez de 80. Se cogen los tramos que sí son aleatorios —del 1 al 12 y del 18
-- al 25— para tener 20 caracteres con 80 bits de verdad, los mismos que daban
-- los 16 bytes de pgcrypto.
--
-- El formato del token no cambia: 'f' + 20 hexadecimales. Las direcciones ya
-- creadas siguen siendo válidas; esto sólo afecta a las nuevas.

CREATE OR REPLACE FUNCTION public.ed_email_activar()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_token text;
  v_hex   text;
  v_plan  public.ed_plans;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  IF NOT public.ed_email_disponible() THEN
    SELECT * INTO v_plan FROM public.ed_plan_vigente();
    -- El mensaje dice el plan actual y qué hay que hacer. Un «no autorizado»
    -- a secas obliga al contador a adivinar si es un fallo o una restricción.
    RAISE EXCEPTION 'La recepción por correo está disponible desde el plan Básico. Tu plan actual es %.', v_plan.name;
  END IF;

  SELECT inbox_token INTO v_token
  FROM ed_connector_state
  WHERE owner_user_id = auth.uid() AND connector = 'email' AND fiscal_entity_id IS NULL;

  IF v_token IS NULL THEN
    v_hex := replace(gen_random_uuid()::text, '-', '');
    -- 1..12 y 18..25: los tramos del UUID que son aleatorios de verdad.
    v_token := 'f' || substr(v_hex, 1, 12) || substr(v_hex, 18, 8);

    INSERT INTO ed_connector_state (owner_user_id, connector, inbox_token, inbox_enabled)
    VALUES (auth.uid(), 'email', v_token, true)
    ON CONFLICT (owner_user_id, connector, COALESCE(fiscal_entity_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET inbox_token = COALESCE(ed_connector_state.inbox_token, excluded.inbox_token),
                  inbox_enabled = true,
                  updated_at = now()
    RETURNING inbox_token INTO v_token;
  END IF;

  RETURN jsonb_build_object('token', v_token, 'activo', true);
END $$;

REVOKE ALL ON FUNCTION public.ed_email_activar() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_activar() TO authenticated;
