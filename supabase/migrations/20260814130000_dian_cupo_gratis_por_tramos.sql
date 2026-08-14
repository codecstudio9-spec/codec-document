-- El plan Gratis pasa a 100 documentos al mes, entregados en dos tramos de 50
-- con 72 horas entre uno y otro.
--
-- ── Qué problema resuelve ────────────────────────────────────────────────
-- Con 100 de golpe, un despacho pequeño procesa su mes entero gratis y nunca
-- necesita pagar. Con 50 secos, no alcanza a probar un mes completo y se va
-- sin ver de qué sirve. Los dos tramos dan las dos cosas: cabe un mes entero
-- —son 100— pero no se puede hacer del tirón el día del cierre.
--
-- La fricción cae exactamente donde tiene valor. Un contador que va sobrado de
-- tiempo espera las 72 horas sin molestarse. Uno que está cerrando contra la
-- fecha de vencimiento no puede esperar, y ése es justo el momento en el que
-- pagar tiene sentido para él. No se le quita nada: se le entrega más despacio.
--
-- ── Por qué NO hace falta una tabla nueva ────────────────────────────────
-- El estado se deduce de `ed_imports`, que ya guarda cuántos documentos
-- procesó cada importación y cuándo. El momento en que el contador cruzó el
-- tramo es el instante en que el acumulado del mes alcanzó los 50, y eso es
-- una suma acumulada sobre filas que ya existen. Una tabla de «tramos» sería
-- un segundo sitio donde la misma verdad puede quedar desincronizada.
--
-- ── Configurable por plan, no escrito en la lógica ───────────────────────
-- El tamaño del tramo y las horas de espera viven en `ed_plans`. Los planes de
-- pago los tienen en NULL y por tanto no esperan nada. Cambiar 72 por 48 es un
-- UPDATE, no un despliegue.

ALTER TABLE public.ed_plans
  ADD COLUMN IF NOT EXISTS tranche_limit integer
    CHECK (tranche_limit IS NULL OR tranche_limit > 0),
  ADD COLUMN IF NOT EXISTS tranche_cooldown_hours integer NOT NULL DEFAULT 72
    CHECK (tranche_cooldown_hours > 0);

COMMENT ON COLUMN public.ed_plans.tranche_limit IS
  'Cuántos documentos se entregan de una vez. NULL = todo el cupo mensual disponible sin espera (planes de pago).';
COMMENT ON COLUMN public.ed_plans.tranche_cooldown_hours IS
  'Horas de espera entre un tramo y el siguiente. Sólo aplica si tranche_limit no es NULL.';

-- Gratis: 100 al mes, en dos tramos de 50 separados por 72 horas.
-- Se retira la promoción de lanzamiento: prometía 100 y 100 pasa a ser el
-- valor permanente, así que ya no anuncia nada.
UPDATE public.ed_plans
   SET monthly_xml_limit      = 100,
       tranche_limit          = 50,
       tranche_cooldown_hours = 72,
       promo_xml_limit        = NULL,
       promo_until            = NULL,
       updated_at             = now()
 WHERE code = 'gratis';

-- Los de pago no esperan. Explícito y no por omisión: el día que se añada un
-- plan nuevo, que herede el DEFAULT de 72 horas sin querer sería un fallo
-- silencioso que sólo se nota cuando un cliente que paga se queda bloqueado.
UPDATE public.ed_plans
   SET tranche_limit = NULL,
       updated_at = now()
 WHERE code <> 'gratis';

-- ── La cuota, ahora con tramos ────────────────────────────────────────────

/** Todo lo que la pantalla necesita para explicar el límite ANTES de que el
 *  contador choque con él, y para explicárselo con nombre y cifra cuando
 *  choque.
 *
 *  `restantes` ya lleva el tramo dentro: si el contador agotó su tramo y
 *  todavía está en las 72 horas, `restantes` es 0 aunque le queden documentos
 *  del mes. Eso hace que la barrera que ya existía en el cliente funcione sin
 *  tocarla — una sola cifra decide, y no hay dos sitios que puedan discrepar. */
CREATE OR REPLACE FUNCTION public.ed_cuota_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan       public.ed_plans;
  v_usados     int;
  v_siguiente  public.ed_plans;
  v_hasta      timestamptz;
  v_inicio_mes timestamptz := date_trunc('month', now());

  v_bloque       int;             -- último múltiplo del tramo ya consumido
  v_corte        timestamptz;     -- cuándo se alcanzó ese múltiplo
  v_espera_hasta timestamptz;     -- cuándo se libera el siguiente tramo
  v_restantes    int;
  v_tope_ahora   int;             -- cuántos puede usar en este momento
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  SELECT * INTO v_plan FROM public.ed_plan_vigente();

  -- Procesados este mes. Acumulativo: borrar documentos no devuelve cupo.
  SELECT coalesce(sum(processed), 0) INTO v_usados
  FROM ed_imports
  WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes;

  SELECT current_period_end INTO v_hasta
  FROM ed_subscriptions WHERE user_id = auth.uid();

  -- ── Cálculo del tramo ──────────────────────────────────────────────────
  IF v_plan.monthly_xml_limit IS NULL OR public.is_admin_user() THEN
    v_restantes := NULL;

  ELSIF v_plan.tranche_limit IS NULL THEN
    -- Plan sin tramos: todo el cupo del mes, disponible de una vez.
    v_restantes := greatest(0, v_plan.monthly_xml_limit - v_usados);

  ELSE
    v_bloque := (v_usados / v_plan.tranche_limit) * v_plan.tranche_limit;

    IF v_bloque = 0 OR v_usados >= v_plan.monthly_xml_limit THEN
      -- Todavía dentro del primer tramo, o mes agotado: no hay espera que
      -- calcular. El mes agotado manda sobre el tramo — decirle a alguien que
      -- espere 72 horas cuando lo que tiene que esperar es al mes que viene
      -- sería mentirle sobre cuándo vuelve.
      v_restantes := greatest(0, v_plan.monthly_xml_limit - v_usados);

    ELSE
      -- Cuándo alcanzó el acumulado ese múltiplo del tramo.
      SELECT created_at INTO v_corte
      FROM (
        SELECT created_at,
               sum(processed) OVER (ORDER BY created_at, id) AS acumulado
        FROM ed_imports
        WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes
      ) t
      WHERE acumulado >= v_bloque
      ORDER BY created_at
      LIMIT 1;

      IF v_corte IS NOT NULL
         AND now() < v_corte + make_interval(hours => v_plan.tranche_cooldown_hours) THEN
        -- En espera: sólo queda lo que sobrara del tramo en curso, que
        -- normalmente es cero.
        v_espera_hasta := v_corte + make_interval(hours => v_plan.tranche_cooldown_hours);
        v_restantes := greatest(0, v_bloque - v_usados);
      ELSE
        -- Tramo siguiente liberado, sin pasarse del tope del mes.
        v_tope_ahora := least(v_plan.monthly_xml_limit, v_bloque + v_plan.tranche_limit);
        v_restantes := greatest(0, v_tope_ahora - v_usados);
      END IF;
    END IF;
  END IF;

  SELECT * INTO v_siguiente FROM ed_plans
  WHERE active AND price_cop IS NOT NULL AND price_cop > coalesce(v_plan.price_cop, 0)
  ORDER BY price_cop ASC LIMIT 1;

  RETURN jsonb_build_object(
    'plan_code',    v_plan.code,
    'plan_nombre',  v_plan.name,
    'plan_precio',  v_plan.price_cop,
    'limite',       v_plan.monthly_xml_limit,
    'uso_justo',    v_plan.fair_use_note,
    'usados',       v_usados,
    'restantes',    v_restantes,
    'ilimitado',    (v_plan.monthly_xml_limit IS NULL) OR public.is_admin_user(),
    'hasta',        v_hasta,
    'renueva_el',   (v_inicio_mes + interval '1 month'),
    -- ── Lo nuevo, para que la pantalla pueda contar la espera ────────────
    'tramo',        v_plan.tranche_limit,
    'tramo_horas',  CASE WHEN v_plan.tranche_limit IS NULL THEN NULL
                         ELSE v_plan.tranche_cooldown_hours END,
    'espera_hasta', v_espera_hasta,
    'siguiente',    CASE WHEN v_siguiente.code IS NULL THEN NULL ELSE jsonb_build_object(
                      'code',   v_siguiente.code,
                      'nombre', v_siguiente.name,
                      'precio', v_siguiente.price_cop,
                      'limite', v_siguiente.monthly_xml_limit
                    ) END
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_cuota_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_cuota_estado() TO authenticated;
