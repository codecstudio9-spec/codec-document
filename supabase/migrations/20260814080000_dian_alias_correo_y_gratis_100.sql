-- Dos cosas: el plan Gratis sube a 100, y el contador puede elegir el nombre
-- de su dirección de correo.

-- ── 1. Gratis: 50 → 100 documentos al mes ────────────────────────────────
--
-- Fijo, no promocional: la mayoría de contadores mueve más de 50 documentos
-- al mes, así que con 50 el gratis no alcanzaba ni para probar un mes real y
-- el contador se iba sin llegar a ver de qué sirve. Con 100 cabe un mes
-- pequeño entero, que es justo lo que hace falta para que la decisión de
-- pagar sea sobre algo que ya vio funcionar.
--
-- Las columnas de promoción se quedan sin usar (promo_until NULL). Siguen
-- disponibles para una campaña temporal cuando se quiera.

UPDATE public.ed_plans
   SET monthly_xml_limit = 100,
       updated_at = now()
 WHERE code = 'gratis';

-- ── 2. Nombre elegido para la dirección de correo ────────────────────────
--
-- Antes la dirección era `f3fe64b8b83ec819e5e43@…`: imposible de dictar por
-- teléfono a un proveedor, que es exactamente lo que hay que hacer con ella.
--
-- ── Por qué NO se deja elegir la dirección entera ────────────────────────
-- Esta dirección es una credencial. Cualquiera que la conozca puede meter
-- documentos en la bandeja de un contador, y `douglas@facturas…` se adivina
-- al primer intento. Así que el contador elige el NOMBRE y el sistema le pega
-- un sufijo al azar: `douglas-taborda-a4f9c2d1`. Legible y dictable, pero con
-- 32 bits detrás — cuatro mil millones de combinaciones, que por correo no se
-- recorren.
--
-- Por eso tampoco hay que reservar nombres globalmente: dos contadores pueden
-- llamarse igual porque el sufijo los separa, y nadie puede «pedir» el nombre
-- de otro para bloquearlo.

/** Normaliza lo que escriba el contador a algo que valga como parte local de
 *  una dirección de correo. Se hace en el servidor y no en la pantalla porque
 *  el navegador no es de fiar: esto decide una credencial. */
CREATE OR REPLACE FUNCTION public.ed_email_alias_normalizar(p_alias text)
RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT nullif(
    -- 4. recortado a 24, y sin guiones sueltos en los extremos tras recortar
    trim(both '-' from
      substr(
        -- 3. guiones repetidos a uno solo
        regexp_replace(
          -- 2. lo que no sea letra, número o guion, a guion
          regexp_replace(
            -- 1. sin tildes ni eñes, en minúsculas
            lower(translate(p_alias,
              'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
              'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC')),
            '[^a-z0-9]+', '-', 'g'),
          '-{2,}', '-', 'g'),
        1, 24)),
    '');
$$;

/** Nombres que no se dejan usar.
 *
 *  Unos porque los sistemas de correo los tratan de forma especial y otros
 *  porque permitirían hacerse pasar por Codec ante un proveedor. */
CREATE OR REPLACE FUNCTION public.ed_email_alias_reservado(p_alias text)
RETURNS boolean
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT p_alias = ANY (ARRAY[
    'admin', 'administrator', 'postmaster', 'hostmaster', 'webmaster',
    'abuse', 'noreply', 'no-reply', 'mailer-daemon', 'root', 'support',
    'soporte', 'ayuda', 'info', 'contacto', 'facturacion', 'facturas',
    'codec', 'codecdocument', 'dian', 'security', 'seguridad', 'billing'
  ]);
$$;

/** Cambia el nombre de la dirección del contador.
 *
 *  Devuelve el token nuevo. El anterior DEJA de funcionar: es la misma
 *  columna, y tener dos direcciones vivas a la vez significaría que revocar
 *  una filtrada no serviría de nada. La pantalla tiene que avisarlo antes. */
CREATE OR REPLACE FUNCTION public.ed_email_alias(p_alias text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_alias  text;
  v_hex    text;
  v_token  text;
  v_plan   public.ed_plans;
  v_intentos int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  IF NOT public.ed_email_disponible() THEN
    SELECT * INTO v_plan FROM public.ed_plan_vigente();
    RAISE EXCEPTION 'La recepción por correo está disponible desde el plan Básico. Tu plan actual es %.', v_plan.name;
  END IF;

  v_alias := public.ed_email_alias_normalizar(p_alias);

  IF v_alias IS NULL OR length(v_alias) < 3 THEN
    RAISE EXCEPTION 'El nombre necesita al menos 3 letras o números.';
  END IF;

  IF public.ed_email_alias_reservado(v_alias) THEN
    RAISE EXCEPTION 'Ese nombre está reservado. Prueba con el tuyo o el de tu oficina.';
  END IF;

  -- El sufijo al azar es lo que hace que la dirección no se pueda adivinar.
  -- El bucle es por el índice único: con 32 bits la colisión es
  -- astronómicamente improbable, pero «improbable» no es «imposible» y un
  -- choque sin reintento le daría un error incomprensible a alguien.
  LOOP
    v_intentos := v_intentos + 1;
    v_hex := replace(gen_random_uuid()::text, '-', '');
    v_token := v_alias || '-' || substr(v_hex, 1, 8);

    BEGIN
      UPDATE ed_connector_state
         SET inbox_token = v_token,
             inbox_enabled = true,
             updated_at = now()
       WHERE owner_user_id = auth.uid()
         AND connector = 'email'
         AND fiscal_entity_id IS NULL;

      IF NOT FOUND THEN
        INSERT INTO ed_connector_state (owner_user_id, connector, inbox_token, inbox_enabled)
        VALUES (auth.uid(), 'email', v_token, true);
      END IF;

      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_intentos >= 5 THEN
        RAISE EXCEPTION 'No se pudo generar la dirección. Inténtalo otra vez.';
      END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object('token', v_token, 'activo', true);
END $$;

REVOKE ALL ON FUNCTION public.ed_email_alias(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_email_alias(text) TO authenticated;
