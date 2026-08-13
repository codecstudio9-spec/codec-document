-- Planes del motor DIAN: Gratis, Básico, Profesional e Ilimitado.
--
-- ── Por qué una tabla y no claves sueltas en app_settings ────────────────
--
-- El requisito es poder cambiar precios y límites sin desplegar. Una tabla lo
-- cumple igual que app_settings —se cambia con un UPDATE— y además guarda cada
-- dato en su columna con su tipo. Con app_settings harían falta ocho claves de
-- texto (`dian_plan_basico_precio`, `dian_plan_basico_limite`, …) y un precio
-- mal tecleado entraría como cadena hasta reventar al convertirlo, en mitad de
-- un cobro. Aquí `price_cop` es bigint: o es un número o no entra.
--
-- ── El límite es MENSUAL y se cuenta sobre lo procesado ──────────────────
--
-- Se cuenta ed_imports.processed del mes corriente, no documentos guardados.
-- Si contara los guardados, borrarlos devolvería cupo y el límite no
-- protegería nada. Es la misma decisión que ya se tomó para la beta.
--
-- ── El Ilimitado todavía no se vende ─────────────────────────────────────
--
-- Su precio queda en NULL a propósito, pendiente de revisión. `ed_crear_pago`
-- se niega a cobrar un plan sin precio en vez de asumir uno: cobrar una cifra
-- inventada es peor que no cobrar.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

-- ── Catálogo ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_plans (
  code              text PRIMARY KEY,
  name              text NOT NULL,
  -- NULL = todavía no está a la venta. 0 = gratis.
  price_cop         bigint CHECK (price_cop IS NULL OR price_cop >= 0),
  -- NULL = sin límite técnico. Se combina con fair_use_note.
  monthly_xml_limit integer CHECK (monthly_xml_limit IS NULL OR monthly_xml_limit > 0),
  -- Qué se le promete al contador. Va en la base y no en la pantalla para
  -- que el texto legal y el límite real no puedan contradecirse.
  fair_use_note     text,
  sort_order        integer NOT NULL DEFAULT 0,
  active            boolean NOT NULL DEFAULT true,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.ed_plans (code, name, price_cop, monthly_xml_limit, fair_use_note, sort_order) VALUES
  ('gratis',       'Gratis',       0,      50,   NULL, 1),
  ('basico',       'Básico',       53000,  2000, NULL, 2),
  ('profesional',  'Profesional',  129000, 8000, NULL, 3),
  ('ilimitado',    'Ilimitado',    NULL,   NULL,
   'Sin límite de documentos, sujeto a una política de uso justo: si un mes se dispara muy por encima de lo normal, te escribimos antes de tomar ninguna medida.', 4)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.ed_plans ENABLE ROW LEVEL SECURITY;

-- El catálogo lo puede leer cualquiera con sesión: son los precios públicos.
-- Escribirlo, sólo el propietario, y por función.
DROP POLICY IF EXISTS ed_plans_lectura ON public.ed_plans;
CREATE POLICY ed_plans_lectura ON public.ed_plans
  FOR SELECT TO authenticated USING (active);

-- ── La suscripción recuerda QUÉ plan se compró ────────────────────────────

ALTER TABLE public.ed_subscriptions
  ADD COLUMN IF NOT EXISTS plan_code text REFERENCES public.ed_plans(code);

ALTER TABLE public.ed_payments
  ADD COLUMN IF NOT EXISTS plan_code text REFERENCES public.ed_plans(code);

-- ── Plan vigente ──────────────────────────────────────────────────────────

/** El plan que rige HOY para esta persona: el que pagó si sigue vigente, y
 *  Gratis en cualquier otro caso. Un plan vencido no deja a nadie sin
 *  servicio, lo baja a Gratis — que es lo que el contador espera y evita el
 *  soporte de «pagué el mes pasado y ahora no puedo entrar». */
CREATE OR REPLACE FUNCTION public.ed_plan_vigente(p_user_id uuid DEFAULT auth.uid())
RETURNS public.ed_plans
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.*
  FROM ed_plans p
  WHERE p.code = COALESCE(
    (SELECT s.plan_code FROM ed_subscriptions s
      WHERE s.user_id = p_user_id
        AND s.status = 'active'
        AND s.current_period_end > now()),
    'gratis'
  );
$$;

REVOKE ALL ON FUNCTION public.ed_plan_vigente(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_plan_vigente(uuid) TO authenticated, service_role;

-- ── Cuota del mes ─────────────────────────────────────────────────────────

/** Todo lo que la pantalla necesita para explicar el límite ANTES de que el
 *  contador choque con él, y para explicárselo con nombre y cifra cuando
 *  choque. Devuelve también el plan que sigue, para poder ofrecerlo sin que
 *  la pantalla tenga que saberse el catálogo. */
CREATE OR REPLACE FUNCTION public.ed_cuota_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan       public.ed_plans;
  v_usados     int;
  v_siguiente  public.ed_plans;
  v_hasta      timestamptz;
  v_inicio_mes timestamptz := date_trunc('month', now());
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

  -- El siguiente plan que SÍ se puede comprar. El Ilimitado, mientras no
  -- tenga precio, no se ofrece: enseñar un botón que no cobra nada frustra.
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
    'restantes',    CASE WHEN v_plan.monthly_xml_limit IS NULL
                         THEN NULL
                         ELSE greatest(0, v_plan.monthly_xml_limit - v_usados) END,
    'ilimitado',    (v_plan.monthly_xml_limit IS NULL) OR public.is_admin_user(),
    'hasta',        v_hasta,
    -- El mes se reinicia el día 1. Decirlo evita el «¿y cuándo se me repone?»
    'renueva_el',   (v_inicio_mes + interval '1 month'),
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

/** El catálogo tal como se le enseña al contador. */
CREATE OR REPLACE FUNCTION public.ed_planes_listar()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'code',       code,
    'nombre',     name,
    'precio',     price_cop,
    'limite',     monthly_xml_limit,
    'uso_justo',  fair_use_note,
    -- Se dice explícitamente si se puede comprar. Un precio nulo en la
    -- pantalla se leería como «gratis», que es lo contrario de la verdad.
    'a_la_venta', (price_cop IS NOT NULL AND price_cop > 0)
  ) ORDER BY sort_order), '[]'::jsonb)
  FROM ed_plans WHERE active;
$$;

REVOKE ALL ON FUNCTION public.ed_planes_listar() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_planes_listar() TO authenticated;

-- ── Cobro por plan ────────────────────────────────────────────────────────

-- La versión vieja cobraba por meses con un precio único. Se elimina para que
-- no queden dos formas de abrir un cobro.
DROP FUNCTION IF EXISTS public.ed_crear_pago(integer);

/** Abre el cobro del plan indicado y devuelve QUÉ hay que cobrar.
 *
 *  El importe sale de ed_plans, nunca del navegador: si el cliente dijera
 *  cuánto cobrar, cualquiera pagaría mil pesos por el Profesional. La Edge
 *  Function firma exactamente lo que devuelve esta función. */
CREATE OR REPLACE FUNCTION public.ed_crear_pago(p_plan_code text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan public.ed_plans;
  v_id   uuid := gen_random_uuid();
  v_ref  text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  SELECT * INTO v_plan FROM ed_plans WHERE code = p_plan_code AND active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ese plan no existe';
  END IF;

  IF v_plan.price_cop IS NULL THEN
    RAISE EXCEPTION 'El plan % todavía no está a la venta', v_plan.name;
  END IF;
  IF v_plan.price_cop <= 0 THEN
    RAISE EXCEPTION 'El plan % es gratuito, no hay nada que cobrar', v_plan.name;
  END IF;

  v_ref := 'dian-' || replace(v_id::text, '-', '');

  -- Wompi trabaja en centavos. El peso no usa decimales en la práctica, pero
  -- la API los exige igual: 53.000 pesos son 5.300.000.
  INSERT INTO ed_payments (id, user_id, reference, amount_in_cents, currency, months, status, plan_code)
  VALUES (v_id, auth.uid(), v_ref, v_plan.price_cop * 100, 'COP', 1, 'PENDING', v_plan.code);

  RETURN jsonb_build_object(
    'reference',       v_ref,
    'amount_in_cents', v_plan.price_cop * 100,
    'currency',        'COP',
    'plan_code',       v_plan.code,
    'plan_nombre',     v_plan.name,
    'plan_limite',     v_plan.monthly_xml_limit
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_crear_pago(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_crear_pago(text) TO authenticated;

-- ── Confirmación ──────────────────────────────────────────────────────────

/** La llama el webhook con service_role, ya verificada la firma de Wompi.
 *
 *  Sigue siendo idempotente: Wompi reintenta los eventos que no reciben 200,
 *  así que el mismo pago aprobado llega varias veces. Sin la guarda, cada
 *  reintento regalaría otro mes. */
CREATE OR REPLACE FUNCTION public.ed_confirmar_pago(
  p_reference      text,
  p_transaction_id text,
  p_status         text,
  p_method         text DEFAULT NULL,
  p_raw            jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pago  record;
  v_desde timestamptz;
  v_hasta timestamptz;
BEGIN
  SELECT * INTO v_pago FROM ed_payments WHERE reference = p_reference FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'referencia_desconocida');
  END IF;

  IF v_pago.status = 'APPROVED' THEN
    RETURN jsonb_build_object('ok', true, 'motivo', 'ya_procesado');
  END IF;

  UPDATE ed_payments
  SET status = CASE WHEN p_status IN ('APPROVED','DECLINED','VOIDED','ERROR') THEN p_status ELSE 'ERROR' END,
      wompi_transaction_id = coalesce(p_transaction_id, wompi_transaction_id),
      payment_method = coalesce(p_method, payment_method),
      raw = coalesce(p_raw, raw),
      updated_at = now()
  WHERE reference = p_reference;

  IF p_status <> 'APPROVED' THEN
    RETURN jsonb_build_object('ok', true, 'motivo', 'no_aprobado', 'status', p_status);
  END IF;

  -- Se parte de lo que le quede vigente: quien renueva antes de vencerse no
  -- puede perder los días que ya pagó.
  SELECT greatest(coalesce(current_period_end, now()), now()) INTO v_desde
  FROM ed_subscriptions WHERE user_id = v_pago.user_id;
  v_desde := coalesce(v_desde, now());
  v_hasta := v_desde + make_interval(months => v_pago.months);

  INSERT INTO ed_subscriptions (user_id, status, plan_code, current_period_end, last_payment_at, updated_at)
  VALUES (v_pago.user_id, 'active', v_pago.plan_code, v_hasta, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        -- El plan del pago manda: quien sube de Básico a Profesional tiene que
        -- quedar en Profesional, no conservar el anterior.
        plan_code = excluded.plan_code,
        current_period_end = v_hasta,
        last_payment_at = now(),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'motivo', 'activado',
                            'plan', v_pago.plan_code, 'hasta', v_hasta);
END $$;

REVOKE ALL ON FUNCTION public.ed_confirmar_pago(text, text, text, text, jsonb)
  FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ed_confirmar_pago(text, text, text, text, jsonb)
  TO service_role;

-- ── Administración de precios y límites ───────────────────────────────────

/** Cambiar precio o límite sin desplegar. `p_precio` a NULL retira el plan de
 *  la venta; `p_limite` a NULL lo deja sin límite técnico. */
CREATE OR REPLACE FUNCTION public.ed_plan_configurar(
  p_code   text,
  p_precio bigint DEFAULT NULL,
  p_limite integer DEFAULT NULL,
  p_tocar_precio boolean DEFAULT true,
  p_tocar_limite boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_plan public.ed_plans;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  UPDATE ed_plans
  SET price_cop = CASE WHEN p_tocar_precio THEN p_precio ELSE price_cop END,
      monthly_xml_limit = CASE WHEN p_tocar_limite THEN p_limite ELSE monthly_xml_limit END,
      updated_at = now()
  WHERE code = p_code
  RETURNING * INTO v_plan;

  IF NOT FOUND THEN RAISE EXCEPTION 'Ese plan no existe: %', p_code; END IF;

  RETURN jsonb_build_object('code', v_plan.code, 'precio', v_plan.price_cop,
                            'limite', v_plan.monthly_xml_limit);
END $$;

REVOKE ALL ON FUNCTION public.ed_plan_configurar(text, bigint, integer, boolean, boolean)
  FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_plan_configurar(text, bigint, integer, boolean, boolean)
  TO authenticated;

-- ── El estado de la beta pasa a apoyarse en el plan ───────────────────────
--
-- El límite personal ya no sale de app_settings: sale del plan. Se mantiene el
-- tope GLOBAL, que no es comercial sino de capacidad de la plataforma, y del
-- que un plan pagado sigue quedando exento — cobrarle a alguien y luego
-- decirle que no hay sitio es la peor versión posible de este producto.

CREATE OR REPLACE FUNCTION public.ed_beta_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_limite_global  int;
  v_cierre         timestamptz;
  v_global         int;
  v_persona        int;
  v_personas       int;
  v_admin          boolean;
  v_plan           public.ed_plans;
  v_pagando        boolean;
  v_hasta          timestamptz;
  v_limite_persona int;
  v_inicio_mes     timestamptz := date_trunc('month', now());
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  v_admin := public.is_admin_user();
  SELECT * INTO v_plan FROM public.ed_plan_vigente();
  v_pagando := coalesce(v_plan.price_cop, 0) > 0;
  v_limite_persona := v_plan.monthly_xml_limit;

  SELECT current_period_end INTO v_hasta FROM ed_subscriptions WHERE user_id = auth.uid();

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_limite_global'), '2000')::int
    INTO v_limite_global;
  SELECT coalesce(nullif((SELECT value FROM app_settings WHERE key = 'dian_beta_cierre'), ''), NULL)::timestamptz
    INTO v_cierre;

  SELECT coalesce(sum(processed), 0) INTO v_global FROM ed_imports;
  SELECT coalesce(sum(processed), 0) INTO v_persona FROM ed_imports
    WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes;
  SELECT count(DISTINCT owner_user_id) INTO v_personas FROM ed_imports WHERE processed > 0;

  RETURN jsonb_build_object(
    'limite_persona', v_limite_persona,
    'limite_global',  v_limite_global,
    'cierre',         v_cierre,
    'usados_persona', v_persona,
    'usados_global',  v_global,
    'personas',       v_personas,
    'cerrada',        (v_cierre IS NOT NULL AND now() > v_cierre),
    'llena',          (v_global >= v_limite_global),
    -- «Ilimitado» aquí significa «sin tope personal»: admin, o un plan sin
    -- límite técnico. Un plan de pago CON límite no es ilimitado.
    'ilimitado',      (v_admin OR v_limite_persona IS NULL),
    'plan_activo',    v_pagando,
    'plan_code',      v_plan.code,
    'plan_nombre',    v_plan.name,
    'plan_hasta',     v_hasta,
    -- Un plan pagado no se topa con los guardias de capacidad de la beta.
    'exento_global',  (v_admin OR v_pagando),
    'puede_descargar', public.ed_descarga_permitida(),
    'descarga_abierta',
      coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_abierta'), 'false') = 'true',
    'descarga_permitidos',
      CASE WHEN v_admin
        THEN coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_permitidos'), '')
        ELSE NULL END
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_estado() TO authenticated;

-- Verificación
SELECT code, name, price_cop, monthly_xml_limit FROM public.ed_plans ORDER BY sort_order;
