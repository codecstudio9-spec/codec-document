-- Contadores: un solo sistema de planes (2026-10-24).
--
-- Antes había dos suscripciones que no se hablaban: la de XML (ed_subscriptions
-- + ed_plans) y la de Contabilidad (cont_suscripciones + cont_planes), cada una
-- con su fecha y su cobro. Ahora la cuenta tiene UNA suscripción con UNA fecha
-- de corte, y el plan dice qué módulos incluye:
--
--   Plan XML       descarga de la DIAN, Excel, auditor y empresas para
--                  organizar los XML (sin contabilidad)
--   Plan Contador  lo anterior + contabilidad + Codec POS
--
-- Tres tamaños (30/60/150 empresas · 1.000/3.000/10.000 XML) y dos ciclos
-- (mensual, o anual = 10 meses). El Plan Contador es la suma de los dos
-- módulos; el ahorro está en pagar anual.
--
-- Subir de plan a mitad de periodo cobra solo la diferencia de los días que
-- faltan y NO mueve la fecha de corte. Bajar de plan, o pasar de anual a
-- mensual, se programa para cuando termine lo ya pagado.
--
-- Las funciones que deciden permisos y topes en toda la app (ed_plan_vigente,
-- ed_plan_activo, cont_acceso_activo, cont_max_empresas) pasan a leer de aquí,
-- así que las políticas y las pantallas existentes siguen funcionando sin
-- tocarlas una por una. Las tablas viejas se conservan como histórico.

-- ── Catálogo ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contador_planes (
  code          text PRIMARY KEY,
  modulo        text NOT NULL CHECK (modulo IN ('xml', 'contador', 'prueba')),
  tamano        text CHECK (tamano IN ('independiente', 'oficina', 'firma')),
  nombre        text NOT NULL,
  descripcion   text,
  xml_mes       integer CHECK (xml_mes IS NULL OR xml_mes > 0),
  max_empresas  integer NOT NULL CHECK (max_empresas > 0),
  precio_mes    bigint CHECK (precio_mes IS NULL OR precio_mes > 0),
  precio_anual  bigint CHECK (precio_anual IS NULL OR precio_anual > 0),
  orden         integer NOT NULL DEFAULT 0,
  activo        boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.contador_planes (code, modulo, tamano, nombre, descripcion, xml_mes, max_empresas, precio_mes, precio_anual, orden) VALUES
  ('xml_independiente',      'xml',      'independiente', 'XML Independiente',      'Hasta 30 empresas y 1.000 XML al mes',    1000,  30,  60000,  600000, 1),
  ('xml_oficina',            'xml',      'oficina',       'XML Oficina',            'Hasta 60 empresas y 3.000 XML al mes',    3000,  60,  90000,  900000, 2),
  ('xml_firma',              'xml',      'firma',         'XML Firma',              'Hasta 150 empresas y 10.000 XML al mes', 10000, 150, 180000, 1800000, 3),
  ('contador_independiente', 'contador', 'independiente', 'Contador Independiente', 'Hasta 30 empresas y 1.000 XML al mes',    1000,  30, 120000, 1200000, 4),
  ('contador_oficina',       'contador', 'oficina',       'Contador Oficina',       'Hasta 60 empresas y 3.000 XML al mes',    3000,  60, 180000, 1800000, 5),
  ('contador_firma',         'contador', 'firma',         'Contador Firma',         'Hasta 150 empresas y 10.000 XML al mes', 10000, 150, 340000, 3400000, 6),
  -- La prueba no se vende: tiene todo, con tope para que no sea una descarga gratis masiva.
  ('prueba',                 'prueba',   NULL,            'Prueba gratis',          '15 días con todo: 5 empresas y 300 XML',   300,   5,   NULL,     NULL, 0)
ON CONFLICT (code) DO UPDATE SET
  modulo = excluded.modulo, tamano = excluded.tamano, nombre = excluded.nombre, descripcion = excluded.descripcion,
  xml_mes = excluded.xml_mes, max_empresas = excluded.max_empresas, precio_mes = excluded.precio_mes,
  precio_anual = excluded.precio_anual, orden = excluded.orden, updated_at = now();

ALTER TABLE public.contador_planes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contador_planes_leer ON public.contador_planes;
CREATE POLICY contador_planes_leer ON public.contador_planes FOR SELECT USING (true);
REVOKE ALL ON public.contador_planes FROM anon, authenticated;
GRANT SELECT ON public.contador_planes TO anon, authenticated;

-- ── Suscripción: una por cuenta ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contador_suscripciones (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code          text NOT NULL REFERENCES public.contador_planes(code),
  ciclo              text NOT NULL DEFAULT 'mensual' CHECK (ciclo IN ('mensual', 'anual')),
  estado             text NOT NULL CHECK (estado IN ('prueba', 'activa')),
  -- Lo pagado va de periodo_inicio a current_period_end. Con eso se calcula
  -- qué fracción le queda al contador cuando sube de plan.
  periodo_inicio     timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  -- Precio acordado a mano (un amigo, un cliente fundador). Rige para las
  -- renovaciones del MISMO plan y ciclo; al cambiar de plan se pierde.
  precio_especial    bigint CHECK (precio_especial IS NULL OR precio_especial > 0),
  nota               text,
  -- Bajar de plan o pasar de anual a mensual: rige desde programado_desde.
  plan_programado    text REFERENCES public.contador_planes(code),
  ciclo_programado   text CHECK (ciclo_programado IS NULL OR ciclo_programado IN ('mensual', 'anual')),
  programado_desde   timestamptz,
  prueba_usada       boolean NOT NULL DEFAULT false,
  prueba_inicio      timestamptz,
  last_payment_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contador_suscripciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS contador_suscripciones_propia ON public.contador_suscripciones;
CREATE POLICY contador_suscripciones_propia ON public.contador_suscripciones
  FOR SELECT USING (user_id = auth.uid());
-- Escribir sólo desde funciones: con un UPDATE directo cualquiera se alargaría el plan.
REVOKE ALL ON public.contador_suscripciones FROM anon, authenticated;
GRANT SELECT ON public.contador_suscripciones TO authenticated;

-- El pago recuerda qué se compró y cómo se calculó, para aplicarlo igual al confirmarse.
ALTER TABLE public.ed_payments
  ADD COLUMN IF NOT EXISTS contador_plan_code text REFERENCES public.contador_planes(code),
  ADD COLUMN IF NOT EXISTS ciclo              text CHECK (ciclo IS NULL OR ciclo IN ('mensual', 'anual')),
  ADD COLUMN IF NOT EXISTS cotizacion         jsonb;

-- ── Lo que hay hoy pasa al sistema nuevo ────────────────────────────────
-- Hoy no hay planes pagados vigentes; sólo una prueba de Contabilidad. Igual
-- se trasladan todas las filas (vencidas incluidas) para conservar la fecha y
-- que nadie vuelva a tener prueba si ya la usó.
INSERT INTO public.contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end, prueba_usada, prueba_inicio, last_payment_at)
SELECT c.user_id,
       CASE WHEN c.estado = 'prueba' THEN 'prueba'
            WHEN c.plan_code IN ('cont_60') THEN 'contador_oficina'
            WHEN c.plan_code IN ('cont_150', 'combo_firma') THEN 'contador_firma'
            WHEN c.plan_code = 'combo_pro' THEN 'contador_oficina'
            ELSE 'contador_independiente' END,
       'mensual', c.estado, coalesce(c.prueba_inicio, c.created_at), c.current_period_end,
       c.prueba_usada, c.prueba_inicio, c.last_payment_at
FROM public.cont_suscripciones c
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end, last_payment_at)
SELECT s.user_id,
       CASE s.plan_code WHEN 'profesional' THEN 'xml_oficina' WHEN 'empresarial' THEN 'xml_firma' ELSE 'xml_independiente' END,
       'mensual', 'activa', coalesce(s.last_payment_at, s.created_at), s.current_period_end, s.last_payment_at
FROM public.ed_subscriptions s
WHERE s.status = 'active' AND s.current_period_end IS NOT NULL AND s.plan_code IS NOT NULL AND s.plan_code <> 'gratis'
ON CONFLICT (user_id) DO NOTHING;

-- ── Plan vigente ────────────────────────────────────────────────────────
/** El plan que rige ahora para la cuenta, o nada si está en gratis.
 *  Si hay un cambio programado y ya llegó su fecha, rige el programado. */
CREATE OR REPLACE FUNCTION public.contador_plan_actual(p_user_id uuid DEFAULT auth.uid())
RETURNS public.contador_planes
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.* FROM contador_suscripciones s
  JOIN contador_planes p ON p.code = CASE
    WHEN s.plan_programado IS NOT NULL AND s.programado_desde <= now() THEN s.plan_programado
    ELSE s.plan_code END
  WHERE s.user_id = p_user_id AND s.current_period_end > now();
$$;
REVOKE ALL ON FUNCTION public.contador_plan_actual(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contador_plan_actual(uuid) TO authenticated, service_role;

/** Contabilidad, comprobantes, reportes y Codec POS: Plan Contador o prueba. */
CREATE OR REPLACE FUNCTION public.cont_acceso_activo(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user()
      OR coalesce((SELECT modulo IN ('contador', 'prueba') FROM public.contador_plan_actual(p_user_id) WHERE code IS NOT NULL), false);
$$;

/** Tope de empresas activas. NULL = sin tope (administrador). 0 = gratis. */
CREATE OR REPLACE FUNCTION public.cont_max_empresas(p_user_id uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.is_admin_user() THEN NULL
              ELSE coalesce((SELECT max_empresas FROM public.contador_plan_actual(p_user_id) WHERE code IS NOT NULL), 0) END;
$$;

/** Cualquier plan pagado o la prueba (correo propio, sin tope global de la beta…). */
CREATE OR REPLACE FUNCTION public.ed_plan_activo(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.contador_plan_actual(p_user_id) WHERE code IS NOT NULL);
$$;

/** El cupo de XML se sigue leyendo como una fila de ed_plans, que es lo que
 *  esperan las funciones de cuota: se arma con los datos del plan nuevo. */
CREATE OR REPLACE FUNCTION public.ed_plan_vigente(p_user_id uuid DEFAULT auth.uid())
RETURNS public.ed_plans
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v  public.ed_plans;
  cp public.contador_planes;
BEGIN
  SELECT * INTO v FROM ed_plans WHERE code = 'gratis';
  SELECT * INTO cp FROM public.contador_plan_actual(p_user_id);
  IF cp.code IS NOT NULL THEN
    v.code := cp.code;
    v.name := cp.nombre;
    v.price_cop := coalesce(cp.precio_mes, 0);
    v.monthly_xml_limit := cp.xml_mes;
    v.tranche_limit := NULL;
    v.promo_xml_limit := NULL;
    v.promo_until := NULL;
    v.fair_use_note := NULL;
  ELSIF v.promo_xml_limit IS NOT NULL AND v.promo_until IS NOT NULL AND v.promo_until > now() THEN
    v.monthly_xml_limit := v.promo_xml_limit;
  END IF;
  RETURN v;
END $$;

-- Agregar empresas: con cualquier plan (el de XML también organiza por NIT).
CREATE OR REPLACE FUNCTION public.cont_empresa_validar()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max    integer;
  v_usadas integer;
  v_bruto  text := trim(coalesce(NEW.nit, ''));
BEGIN
  IF v_bruto ~ '-\s*[0-9]\s*$' THEN
    NEW.dv := coalesce(nullif(NEW.dv, ''), regexp_replace(substring(v_bruto from '-\s*([0-9])\s*$'), '\s', '', 'g'));
    v_bruto := regexp_replace(v_bruto, '-\s*[0-9]\s*$', '');
  END IF;
  NEW.nit := regexp_replace(v_bruto, '[^0-9]', '', 'g');
  IF NEW.nit !~ '^[0-9]{3,15}$' THEN
    RAISE EXCEPTION 'El NIT debe tener entre 3 y 15 dígitos, sin dígito de verificación';
  END IF;
  NEW.updated_at := now();

  IF NEW.activo AND (TG_OP = 'INSERT' OR NOT OLD.activo) THEN
    v_max := public.cont_max_empresas(NEW.owner_user_id);
    IF v_max = 0 THEN
      RAISE EXCEPTION 'Para agregar empresas necesitas un plan o la prueba gratis de 15 días';
    END IF;
    IF v_max IS NOT NULL THEN
      SELECT count(*) INTO v_usadas FROM fiscal_entities
      WHERE owner_user_id = NEW.owner_user_id AND activo AND id <> NEW.id;
      IF v_usadas >= v_max THEN
        RAISE EXCEPTION 'Tu plan permite % empresas activas. Archiva una o pasa a un plan más grande.', v_max;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- ── Cuánto se paga hoy ──────────────────────────────────────────────────
/** El corazón del cobro. Recibe lo que el contador quiere y lo que tiene, y
 *  dice qué tipo de compra es, cuánto paga hoy, hasta cuándo queda y por
 *  cuánto renueva. Lo usan la pantalla (para mostrarlo) y el pago (para
 *  cobrarlo): así nunca pueden decir cifras distintas. */
CREATE OR REPLACE FUNCTION public.contador_calcular(p_user_id uuid, p_plan text, p_ciclo text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_nuevo     contador_planes;
  v_sub       contador_suscripciones;
  v_actual    contador_planes;
  v_precio    bigint;
  v_pagado    bigint;
  v_tipo      text;
  v_hoy       numeric;
  v_inicio    timestamptz;
  v_fin       timestamptz;
  v_fraccion  numeric;
  v_intervalo interval := CASE WHEN p_ciclo = 'anual' THEN interval '1 year' ELSE interval '1 month' END;
  v_activa    boolean;
BEGIN
  IF p_ciclo NOT IN ('mensual', 'anual') THEN RAISE EXCEPTION 'El pago es mensual o anual'; END IF;
  SELECT * INTO v_nuevo FROM contador_planes WHERE code = p_plan AND activo AND modulo IN ('xml', 'contador');
  IF NOT FOUND THEN RAISE EXCEPTION 'Ese plan no existe'; END IF;
  v_precio := CASE WHEN p_ciclo = 'anual' THEN v_nuevo.precio_anual ELSE v_nuevo.precio_mes END;

  SELECT * INTO v_sub FROM contador_suscripciones WHERE user_id = p_user_id;
  v_activa := v_sub.user_id IS NOT NULL AND v_sub.estado = 'activa' AND v_sub.current_period_end > now()
              AND (v_sub.plan_programado IS NULL OR v_sub.programado_desde > now());

  IF NOT v_activa THEN
    -- Nuevo, vencido o saliendo de la prueba: periodo completo desde hoy.
    v_tipo := 'nuevo';
    -- El precio especial se respeta aunque renueve tarde, si es el mismo plan y ciclo.
    v_hoy := CASE WHEN v_sub.plan_code = p_plan AND v_sub.ciclo = p_ciclo AND v_sub.precio_especial IS NOT NULL
                  THEN v_sub.precio_especial ELSE v_precio END;
    v_inicio := now();
    v_fin := now() + v_intervalo;
  ELSE
    SELECT * INTO v_actual FROM contador_planes WHERE code = v_sub.plan_code;
    v_pagado := coalesce(v_sub.precio_especial,
                         CASE WHEN v_sub.ciclo = 'anual' THEN v_actual.precio_anual ELSE v_actual.precio_mes END);
    v_fraccion := greatest(0, least(1,
      extract(epoch FROM (v_sub.current_period_end - now()))
      / nullif(extract(epoch FROM (v_sub.current_period_end - v_sub.periodo_inicio)), 0)));

    IF v_nuevo.code = v_sub.plan_code AND p_ciclo = v_sub.ciclo THEN
      v_tipo := 'renovacion';
      v_hoy := v_pagado;
      v_inicio := v_sub.current_period_end;
      v_fin := v_sub.current_period_end + v_intervalo;
    ELSIF v_sub.ciclo = 'mensual' AND p_ciclo = 'anual' THEN
      -- A anual: lo que le queda del mes se descuenta y el año arranca hoy.
      v_tipo := 'cambio_anual';
      v_hoy := v_precio - v_pagado * v_fraccion;
      v_inicio := now();
      v_fin := now() + interval '1 year';
    ELSIF p_ciclo = v_sub.ciclo AND v_precio > v_pagado THEN
      -- Mejora en el mismo ciclo: sólo la diferencia de los días que faltan.
      v_tipo := 'mejora';
      v_hoy := (v_precio - v_pagado) * v_fraccion;
      v_inicio := v_sub.periodo_inicio;
      v_fin := v_sub.current_period_end;
    ELSE
      -- Bajar de plan o pasar de anual a mensual: arranca cuando termine lo pagado.
      v_tipo := 'programado';
      v_hoy := v_precio;
      v_inicio := v_sub.current_period_end;
      v_fin := v_sub.current_period_end + v_intervalo;
    END IF;
  END IF;

  -- A centenas hacia arriba; un cambio que da casi nada cobra al menos $5.000.
  v_hoy := ceil(greatest(v_hoy, 0) / 100) * 100;
  IF v_tipo IN ('mejora', 'cambio_anual') AND v_hoy < 5000 THEN v_hoy := 5000; END IF;

  RETURN jsonb_build_object(
    'tipo',          v_tipo,
    'plan',          v_nuevo.code,
    'plan_nombre',   v_nuevo.nombre,
    'modulo',        v_nuevo.modulo,
    'ciclo',         p_ciclo,
    'precio_lista',  v_precio,
    'hoy',           v_hoy::bigint,
    'desde',         v_inicio,
    'hasta',         v_fin,
    'renueva_por',   CASE WHEN v_tipo IN ('nuevo', 'renovacion') AND v_hoy::bigint < v_precio
                          AND v_sub.plan_code = p_plan AND v_sub.ciclo = p_ciclo THEN v_hoy::bigint ELSE v_precio END,
    'precio_especial', v_tipo IN ('nuevo', 'renovacion') AND v_sub.precio_especial IS NOT NULL
                          AND v_sub.plan_code = p_plan AND v_sub.ciclo = p_ciclo,
    'actual',        CASE WHEN v_activa THEN jsonb_build_object(
                       'plan', v_sub.plan_code, 'plan_nombre', v_actual.nombre, 'ciclo', v_sub.ciclo,
                       'pagado', v_pagado, 'hasta', v_sub.current_period_end) END
  );
END $$;
REVOKE ALL ON FUNCTION public.contador_calcular(uuid, text, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.contador_cotizar(p_plan text, p_ciclo text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  PERFORM public.contador_aplicar_programado(auth.uid());
  RETURN public.contador_calcular(auth.uid(), p_plan, p_ciclo);
END $$;
REVOKE ALL ON FUNCTION public.contador_cotizar(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contador_cotizar(text, text) TO authenticated;

/** Abre el cobro. El importe sale de contador_calcular, nunca del navegador. */
CREATE OR REPLACE FUNCTION public.contador_crear_pago(p_plan text, p_ciclo text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_c   jsonb;
  v_id  uuid := gen_random_uuid();
  v_ref text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  PERFORM public.contador_aplicar_programado(auth.uid());
  v_c := public.contador_calcular(auth.uid(), p_plan, p_ciclo);
  IF (v_c ->> 'hoy')::bigint <= 0 THEN RAISE EXCEPTION 'No hay nada que cobrar'; END IF;

  v_ref := 'ctd-' || replace(v_id::text, '-', '');
  INSERT INTO ed_payments (id, user_id, reference, amount_in_cents, currency, months, status, contador_plan_code, ciclo, cotizacion)
  VALUES (v_id, auth.uid(), v_ref, (v_c ->> 'hoy')::bigint * 100, 'COP',
          CASE WHEN p_ciclo = 'anual' THEN 12 ELSE 1 END, 'PENDING', p_plan, p_ciclo, v_c);

  RETURN jsonb_build_object(
    'reference', v_ref, 'amount_in_cents', (v_c ->> 'hoy')::bigint * 100, 'currency', 'COP',
    'plan_code', p_plan, 'plan_nombre', v_c ->> 'plan_nombre', 'plan_limite', NULL);
END $$;
REVOKE ALL ON FUNCTION public.contador_crear_pago(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contador_crear_pago(text, text) TO authenticated;

/** Aplica un pago aprobado. Se recalcula con el estado de AHORA (no con el
 *  de cuando se abrió el cobro) para el tipo de compra, pero se respeta lo
 *  que el contador pagó: si entre abrir y pagar se le venció el plan, igual
 *  queda con su periodo completo desde hoy. */
CREATE OR REPLACE FUNCTION public.contador_aplicar_pago(p_pago ed_payments)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_c    jsonb := public.contador_calcular(p_pago.user_id, p_pago.contador_plan_code, p_pago.ciclo);
  v_tipo text := v_c ->> 'tipo';
BEGIN
  IF v_tipo = 'nuevo' THEN
    INSERT INTO contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end, last_payment_at)
    VALUES (p_pago.user_id, p_pago.contador_plan_code, p_pago.ciclo, 'activa', now(), (v_c ->> 'hasta')::timestamptz, now())
    ON CONFLICT (user_id) DO UPDATE
      SET plan_code = excluded.plan_code, ciclo = excluded.ciclo, estado = 'activa',
          periodo_inicio = now(), current_period_end = excluded.current_period_end,
          precio_especial = CASE WHEN contador_suscripciones.plan_code = excluded.plan_code
                                  AND contador_suscripciones.ciclo = excluded.ciclo
                                 THEN contador_suscripciones.precio_especial END,
          plan_programado = NULL, ciclo_programado = NULL, programado_desde = NULL,
          last_payment_at = now(), updated_at = now();
  ELSIF v_tipo = 'renovacion' THEN
    UPDATE contador_suscripciones
       SET periodo_inicio = current_period_end, current_period_end = (v_c ->> 'hasta')::timestamptz,
           last_payment_at = now(), updated_at = now()
     WHERE user_id = p_pago.user_id;
  ELSIF v_tipo = 'mejora' THEN
    UPDATE contador_suscripciones
       SET plan_code = p_pago.contador_plan_code, precio_especial = NULL,
           plan_programado = NULL, ciclo_programado = NULL, programado_desde = NULL,
           last_payment_at = now(), updated_at = now()
     WHERE user_id = p_pago.user_id;
  ELSIF v_tipo = 'cambio_anual' THEN
    UPDATE contador_suscripciones
       SET plan_code = p_pago.contador_plan_code, ciclo = 'anual', precio_especial = NULL,
           periodo_inicio = now(), current_period_end = (v_c ->> 'hasta')::timestamptz,
           plan_programado = NULL, ciclo_programado = NULL, programado_desde = NULL,
           last_payment_at = now(), updated_at = now()
     WHERE user_id = p_pago.user_id;
  ELSE -- programado
    UPDATE contador_suscripciones
       SET plan_programado = p_pago.contador_plan_code, ciclo_programado = p_pago.ciclo,
           programado_desde = current_period_end, current_period_end = (v_c ->> 'hasta')::timestamptz,
           last_payment_at = now(), updated_at = now()
     WHERE user_id = p_pago.user_id;
  END IF;
  RETURN jsonb_build_object('ok', true, 'motivo', 'activado', 'tipo', v_tipo, 'plan', p_pago.contador_plan_code, 'hasta', v_c ->> 'hasta');
END $$;
REVOKE ALL ON FUNCTION public.contador_aplicar_pago(ed_payments) FROM public, anon, authenticated;

/** Cuando ya rige un cambio programado, se vuelve el plan normal de la fila
 *  (para que el siguiente cálculo parta del plan correcto). Se llama al leer
 *  el estado y antes de calcular un pago. */
CREATE OR REPLACE FUNCTION public.contador_aplicar_programado(p_user_id uuid)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE contador_suscripciones
     SET plan_code = plan_programado, ciclo = ciclo_programado, periodo_inicio = programado_desde,
         precio_especial = NULL, plan_programado = NULL, ciclo_programado = NULL, programado_desde = NULL,
         updated_at = now()
   WHERE user_id = p_user_id AND plan_programado IS NOT NULL AND programado_desde <= now();
$$;
REVOKE ALL ON FUNCTION public.contador_aplicar_programado(uuid) FROM public, anon, authenticated;

-- El webhook de Wompi sigue llamando ed_confirmar_pago: se le añade la rama
-- nueva y las viejas quedan para pagos que se hayan abierto antes del cambio.
CREATE OR REPLACE FUNCTION public.ed_confirmar_pago(
  p_reference text, p_transaction_id text, p_status text, p_method text DEFAULT NULL, p_raw jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pago  ed_payments;
  v_desde timestamptz;
  v_hasta timestamptz;
  v_cplan cont_planes;
  v_actual ed_plans;
  v_incl   ed_plans;
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

  IF v_pago.contador_plan_code IS NOT NULL THEN
    PERFORM public.contador_aplicar_programado(v_pago.user_id);
    RETURN public.contador_aplicar_pago(v_pago);
  END IF;

  -- ── Pagos abiertos antes del sistema unificado ──
  IF v_pago.cont_plan_code IS NOT NULL THEN
    SELECT * INTO v_cplan FROM cont_planes WHERE code = v_pago.cont_plan_code;
    SELECT CASE WHEN estado = 'activa' THEN greatest(current_period_end, now()) ELSE now() END
      INTO v_desde FROM cont_suscripciones WHERE user_id = v_pago.user_id;
    v_desde := coalesce(v_desde, now());
    v_hasta := v_desde + make_interval(months => v_pago.months);
    INSERT INTO cont_suscripciones (user_id, plan_code, estado, current_period_end, last_payment_at, updated_at)
    VALUES (v_pago.user_id, v_cplan.code, 'activa', v_hasta, now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET plan_code = excluded.plan_code, estado = 'activa', current_period_end = v_hasta,
          last_payment_at = now(), updated_at = now();
    -- …y queda reflejado en el sistema nuevo, que es el que da acceso.
    INSERT INTO contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end, last_payment_at)
    VALUES (v_pago.user_id,
            CASE v_cplan.code WHEN 'cont_60' THEN 'contador_oficina' WHEN 'cont_150' THEN 'contador_firma'
                              WHEN 'combo_firma' THEN 'contador_firma' WHEN 'combo_pro' THEN 'contador_oficina'
                              ELSE 'contador_independiente' END,
            CASE WHEN v_pago.months = 12 THEN 'anual' ELSE 'mensual' END, 'activa', now(), v_hasta, now())
    ON CONFLICT (user_id) DO UPDATE
      SET plan_code = excluded.plan_code, ciclo = excluded.ciclo, estado = 'activa',
          periodo_inicio = now(), current_period_end = greatest(contador_suscripciones.current_period_end, v_hasta),
          last_payment_at = now(), updated_at = now();
    RETURN jsonb_build_object('ok', true, 'motivo', 'activado', 'contabilidad', v_cplan.code, 'hasta', v_hasta);
  END IF;

  SELECT greatest(coalesce(current_period_end, now()), now()) INTO v_desde
  FROM ed_subscriptions WHERE user_id = v_pago.user_id;
  v_desde := coalesce(v_desde, now());
  v_hasta := v_desde + make_interval(months => v_pago.months);
  INSERT INTO ed_subscriptions (user_id, status, plan_code, current_period_end, last_payment_at, updated_at)
  VALUES (v_pago.user_id, 'active', v_pago.plan_code, v_hasta, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active', plan_code = excluded.plan_code, current_period_end = v_hasta,
        last_payment_at = now(), updated_at = now();
  INSERT INTO contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end, last_payment_at)
  VALUES (v_pago.user_id,
          CASE v_pago.plan_code WHEN 'profesional' THEN 'xml_oficina' WHEN 'empresarial' THEN 'xml_firma' ELSE 'xml_independiente' END,
          'mensual', 'activa', now(), v_hasta, now())
  ON CONFLICT (user_id) DO UPDATE
    SET plan_code = excluded.plan_code, estado = 'activa', periodo_inicio = now(),
        current_period_end = greatest(contador_suscripciones.current_period_end, v_hasta),
        last_payment_at = now(), updated_at = now();

  RETURN jsonb_build_object('ok', true, 'motivo', 'activado', 'plan', v_pago.plan_code, 'hasta', v_hasta);
END $$;

-- Las compras nuevas van por contador_crear_pago.
CREATE OR REPLACE FUNCTION public.ed_crear_pago(p_plan_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Los planes cambiaron: elige tu plan en Contadores > Mi plan'; END $$;
CREATE OR REPLACE FUNCTION public.cont_crear_pago(p_plan_code text, p_meses integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Los planes cambiaron: elige tu plan en Contadores > Mi plan'; END $$;

-- ── Prueba gratis ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.contador_iniciar_prueba()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sub contador_suscripciones;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  SELECT * INTO v_sub FROM contador_suscripciones WHERE user_id = auth.uid() FOR UPDATE;
  IF coalesce(v_sub.prueba_usada, false)
     OR EXISTS (SELECT 1 FROM cont_suscripciones WHERE user_id = auth.uid() AND prueba_usada) THEN
    RAISE EXCEPTION 'Ya usaste tu prueba gratis. Elige un plan para seguir.';
  END IF;
  IF v_sub.current_period_end > now() THEN RAISE EXCEPTION 'Ya tienes un plan activo.'; END IF;

  INSERT INTO contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end, prueba_usada, prueba_inicio)
  VALUES (auth.uid(), 'prueba', 'mensual', 'prueba', now(), now() + interval '15 days', true, now())
  ON CONFLICT (user_id) DO UPDATE
    SET plan_code = 'prueba', estado = 'prueba', periodo_inicio = now(), current_period_end = now() + interval '15 days',
        prueba_usada = true, prueba_inicio = now(), updated_at = now();
  RETURN public.contador_estado();
END $$;
REVOKE ALL ON FUNCTION public.contador_iniciar_prueba() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contador_iniciar_prueba() TO authenticated;

-- La pantalla vieja de Contabilidad pedía la prueba con esta: se redirige.
CREATE OR REPLACE FUNCTION public.cont_iniciar_prueba()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.contador_iniciar_prueba(); RETURN public.cont_estado(); END $$;

-- ── Estado para la pantalla «Mi plan» ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.contador_estado()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sub   contador_suscripciones;
  v_plan  contador_planes;
  v_prog  contador_planes;
  v_admin boolean := public.is_admin_user();
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'sin_sesion'); END IF;
  PERFORM public.contador_aplicar_programado(auth.uid());

  SELECT * INTO v_sub FROM contador_suscripciones WHERE user_id = auth.uid();
  SELECT * INTO v_plan FROM public.contador_plan_actual(auth.uid());
  IF v_sub.plan_programado IS NOT NULL THEN SELECT * INTO v_prog FROM contador_planes WHERE code = v_sub.plan_programado; END IF;

  RETURN jsonb_build_object(
    'admin',             v_admin,
    'activo',            v_plan.code IS NOT NULL,
    'en_prueba',         v_plan.modulo = 'prueba',
    'contabilidad',      public.cont_acceso_activo(),
    'plan',              CASE WHEN v_plan.code IS NULL THEN NULL ELSE jsonb_build_object(
                           'code', v_plan.code, 'nombre', v_plan.nombre, 'modulo', v_plan.modulo, 'tamano', v_plan.tamano,
                           'xml_mes', v_plan.xml_mes, 'max_empresas', v_plan.max_empresas) END,
    'ciclo',             v_sub.ciclo,
    'hasta',             CASE WHEN v_plan.code IS NULL THEN NULL ELSE coalesce(v_sub.programado_desde, v_sub.current_period_end) END,
    'precio_especial',   v_sub.precio_especial,
    'renueva_por',       CASE WHEN v_plan.code IS NULL OR v_plan.modulo = 'prueba' THEN NULL ELSE coalesce(v_sub.precio_especial,
                           CASE WHEN v_sub.ciclo = 'anual' THEN v_plan.precio_anual ELSE v_plan.precio_mes END) END,
    'programado',        CASE WHEN v_prog.code IS NULL THEN NULL ELSE jsonb_build_object(
                           'plan', v_prog.code, 'nombre', v_prog.nombre, 'ciclo', v_sub.ciclo_programado,
                           'desde', v_sub.programado_desde, 'hasta', v_sub.current_period_end) END,
    'vencido',           v_sub.user_id IS NOT NULL AND v_plan.code IS NULL,
    'vencio_el',         CASE WHEN v_plan.code IS NULL THEN v_sub.current_period_end END,
    'prueba_disponible', v_plan.code IS NULL AND NOT coalesce(v_sub.prueba_usada, false)
                         AND NOT EXISTS (SELECT 1 FROM cont_suscripciones WHERE user_id = auth.uid() AND prueba_usada),
    'max_empresas',      public.cont_max_empresas(),
    'empresas_usadas',   (SELECT count(*) FROM fiscal_entities WHERE owner_user_id = auth.uid() AND activo),
    'planes', (SELECT coalesce(jsonb_agg(jsonb_build_object(
                 'code', p.code, 'modulo', p.modulo, 'tamano', p.tamano, 'nombre', p.nombre, 'descripcion', p.descripcion,
                 'xml_mes', p.xml_mes, 'max_empresas', p.max_empresas, 'precio_mes', p.precio_mes, 'precio_anual', p.precio_anual
               ) ORDER BY p.orden), '[]'::jsonb)
               FROM contador_planes p WHERE p.activo AND p.modulo IN ('xml', 'contador'))
  );
END $$;
REVOKE ALL ON FUNCTION public.contador_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contador_estado() TO authenticated;

-- La pantalla vieja de Contabilidad sigue funcionando mientras se reemplaza.
CREATE OR REPLACE FUNCTION public.cont_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan  contador_planes;
  v_sub   contador_suscripciones;
  v_admin boolean := public.is_admin_user();
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'sin_sesion'); END IF;
  SELECT * INTO v_plan FROM public.contador_plan_actual(auth.uid());
  SELECT * INTO v_sub FROM contador_suscripciones WHERE user_id = auth.uid();
  RETURN jsonb_build_object(
    'activo',            public.cont_acceso_activo(),
    'admin',             v_admin,
    'en_prueba',         (NOT v_admin AND v_plan.modulo = 'prueba'),
    'plan_code',         v_plan.code,
    'plan_nombre',       v_plan.nombre,
    'max_empresas',      public.cont_max_empresas(),
    'empresas_usadas',   (SELECT count(*) FROM fiscal_entities WHERE owner_user_id = auth.uid() AND activo),
    'hasta',             CASE WHEN v_plan.code IS NOT NULL THEN v_sub.current_period_end END,
    'prueba_disponible', (v_plan.code IS NULL AND NOT coalesce(v_sub.prueba_usada, false)
                          AND NOT EXISTS (SELECT 1 FROM cont_suscripciones WHERE user_id = auth.uid() AND prueba_usada)),
    'planes',            '[]'::jsonb
  );
END $$;

-- ── Cupo de XML: el «siguiente plan» sale del catálogo nuevo ────────────
CREATE OR REPLACE FUNCTION public.ed_cuota_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan       public.ed_plans;
  v_usados     int;
  v_hasta      timestamptz;
  v_inicio_mes timestamptz := date_trunc('month', now());
  v_bloque       int;
  v_corte        timestamptz;
  v_espera_hasta timestamptz;
  v_restantes    int;
  v_tope_ahora   int;
  v_actual       contador_planes;
  v_sig          contador_planes;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  SELECT * INTO v_plan FROM public.ed_plan_vigente();
  SELECT * INTO v_actual FROM public.contador_plan_actual(auth.uid());

  SELECT coalesce(sum(processed), 0) INTO v_usados
  FROM ed_imports
  WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes;

  SELECT current_period_end INTO v_hasta FROM contador_suscripciones WHERE user_id = auth.uid();

  IF v_plan.monthly_xml_limit IS NULL OR public.is_admin_user() THEN
    v_restantes := NULL;
  ELSIF v_plan.tranche_limit IS NULL THEN
    v_restantes := greatest(0, v_plan.monthly_xml_limit - v_usados);
  ELSE
    v_bloque := (v_usados / v_plan.tranche_limit) * v_plan.tranche_limit;
    IF v_bloque = 0 OR v_usados >= v_plan.monthly_xml_limit THEN
      v_restantes := greatest(0, v_plan.monthly_xml_limit - v_usados);
    ELSE
      SELECT created_at INTO v_corte
      FROM (
        SELECT created_at, sum(processed) OVER (ORDER BY created_at, id) AS acumulado
        FROM ed_imports
        WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes
      ) t
      WHERE acumulado >= v_bloque
      ORDER BY created_at
      LIMIT 1;
      IF v_corte IS NOT NULL
         AND now() < v_corte + make_interval(hours => v_plan.tranche_cooldown_hours) THEN
        v_espera_hasta := v_corte + make_interval(hours => v_plan.tranche_cooldown_hours);
        v_restantes := greatest(0, v_bloque - v_usados);
      ELSE
        v_tope_ahora := least(v_plan.monthly_xml_limit, v_bloque + v_plan.tranche_limit);
        v_restantes := greatest(0, v_tope_ahora - v_usados);
      END IF;
    END IF;
  END IF;

  -- El siguiente: más XML, del mismo tipo de plan (XML o Contador); en gratis
  -- o en prueba, el XML más chico.
  SELECT * INTO v_sig FROM contador_planes
  WHERE activo AND modulo = CASE WHEN v_actual.modulo = 'contador' THEN 'contador' ELSE 'xml' END
    AND xml_mes > coalesce(v_plan.monthly_xml_limit, 0)
  ORDER BY xml_mes LIMIT 1;

  RETURN jsonb_build_object(
    'plan_code',    v_plan.code,
    'plan_nombre',  v_plan.name,
    'plan_precio',  v_plan.price_cop,
    'limite',       v_plan.monthly_xml_limit,
    'uso_justo',    v_plan.fair_use_note,
    'usados',       v_usados,
    'restantes',    v_restantes,
    'ilimitado',    (v_plan.monthly_xml_limit IS NULL) OR public.is_admin_user(),
    'hasta',        CASE WHEN v_actual.code IS NOT NULL THEN v_hasta END,
    'renueva_el',   (v_inicio_mes + interval '1 month'),
    'tramo',        v_plan.tranche_limit,
    'tramo_horas',  CASE WHEN v_plan.tranche_limit IS NULL THEN NULL ELSE v_plan.tranche_cooldown_hours END,
    'espera_hasta', v_espera_hasta,
    'siguiente',    CASE WHEN v_sig.code IS NULL THEN NULL ELSE jsonb_build_object(
                      'code', v_sig.code, 'nombre', v_sig.nombre, 'precio', v_sig.precio_mes, 'limite', v_sig.xml_mes) END
  );
END $$;

-- ── Administrador: planes a mano y precio especial ──────────────────────
/** Para cobros por fuera de Wompi (como el plan anual de un amigo a $900.000)
 *  o para regalar meses. Deja la cuenta activa hasta p_hasta, con su precio
 *  especial para las renovaciones. */
CREATE OR REPLACE FUNCTION public.contador_admin_asignar(
  p_email text, p_plan text, p_ciclo text, p_hasta date, p_precio_especial bigint DEFAULT NULL, p_nota text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid;
  v_plan contador_planes;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_user IS NULL THEN RAISE EXCEPTION 'No hay ninguna cuenta con el correo %', p_email; END IF;
  SELECT * INTO v_plan FROM contador_planes WHERE code = p_plan AND modulo IN ('xml', 'contador');
  IF NOT FOUND THEN RAISE EXCEPTION 'Ese plan no existe: %', p_plan; END IF;
  IF p_ciclo NOT IN ('mensual', 'anual') THEN RAISE EXCEPTION 'El ciclo es mensual o anual'; END IF;
  IF p_hasta IS NULL OR p_hasta <= current_date THEN RAISE EXCEPTION 'La fecha de vencimiento debe ser futura'; END IF;

  INSERT INTO contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end,
                                      precio_especial, nota, last_payment_at)
  VALUES (v_user, p_plan, p_ciclo, 'activa', now(), (p_hasta::timestamp AT TIME ZONE 'America/Bogota'),
          p_precio_especial, nullif(trim(coalesce(p_nota, '')), ''), now())
  ON CONFLICT (user_id) DO UPDATE
    SET plan_code = excluded.plan_code, ciclo = excluded.ciclo, estado = 'activa', periodo_inicio = now(),
        current_period_end = excluded.current_period_end, precio_especial = excluded.precio_especial,
        nota = excluded.nota, plan_programado = NULL, ciclo_programado = NULL, programado_desde = NULL,
        last_payment_at = now(), updated_at = now();

  RETURN jsonb_build_object('email', lower(trim(p_email)), 'plan', v_plan.nombre, 'ciclo', p_ciclo,
                            'hasta', p_hasta, 'precio_especial', p_precio_especial);
END $$;
REVOKE ALL ON FUNCTION public.contador_admin_asignar(text, text, text, date, bigint, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.contador_admin_asignar(text, text, text, date, bigint, text) TO authenticated;

-- El panel de administración de XML sigue funcionando con los planes nuevos.
CREATE OR REPLACE FUNCTION public.ed_admin_conceder_plan(p_email text, p_plan_code text, p_meses integer DEFAULT 1, p_nota text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user  uuid;
  v_code  text;
  v_desde timestamptz;
  v_hasta timestamptz;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_meses IS NULL OR p_meses < 1 OR p_meses > 24 THEN RAISE EXCEPTION 'Los meses deben estar entre 1 y 24'; END IF;
  v_code := CASE p_plan_code WHEN 'basico' THEN 'xml_independiente' WHEN 'profesional' THEN 'xml_oficina'
                             WHEN 'empresarial' THEN 'xml_firma' ELSE p_plan_code END;
  IF NOT EXISTS (SELECT 1 FROM contador_planes WHERE code = v_code AND modulo IN ('xml', 'contador')) THEN
    RAISE EXCEPTION 'Ese plan no existe: %', p_plan_code;
  END IF;
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_user IS NULL THEN RAISE EXCEPTION 'No hay ninguna cuenta con el correo %', p_email; END IF;

  SELECT greatest(current_period_end, now()) INTO v_desde FROM contador_suscripciones
  WHERE user_id = v_user AND estado = 'activa' AND plan_code = v_code;
  v_desde := coalesce(v_desde, now());
  v_hasta := v_desde + make_interval(months => p_meses);

  INSERT INTO contador_suscripciones (user_id, plan_code, ciclo, estado, periodo_inicio, current_period_end, nota)
  VALUES (v_user, v_code, 'mensual', 'activa', now(), v_hasta, nullif(trim(coalesce(p_nota, '')), ''))
  ON CONFLICT (user_id) DO UPDATE
    SET plan_code = v_code, estado = 'activa', current_period_end = v_hasta,
        periodo_inicio = CASE WHEN contador_suscripciones.plan_code = v_code THEN contador_suscripciones.periodo_inicio ELSE now() END,
        nota = coalesce(excluded.nota, contador_suscripciones.nota),
        plan_programado = NULL, ciclo_programado = NULL, programado_desde = NULL, updated_at = now();

  RETURN jsonb_build_object('email', lower(trim(p_email)), 'plan', v_code, 'meses', p_meses, 'hasta', v_hasta);
END $$;

CREATE OR REPLACE FUNCTION public.ed_admin_retirar_plan(p_email text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid; v_email text := lower(trim(p_email));
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  SELECT id INTO v_user FROM auth.users WHERE lower(email) = v_email;
  IF v_user IS NULL THEN RAISE EXCEPTION 'No hay cuenta con %', v_email; END IF;
  UPDATE contador_suscripciones SET current_period_end = now(), plan_programado = NULL, ciclo_programado = NULL,
         programado_desde = NULL, updated_at = now()
  WHERE user_id = v_user;
  UPDATE ed_subscriptions SET status = 'inactive', current_period_end = now(), updated_at = now() WHERE user_id = v_user;
  RETURN jsonb_build_object('email', v_email, 'retirado', true);
END $$;

CREATE OR REPLACE FUNCTION public.ed_admin_usuarios(p_limit integer DEFAULT 200)
RETURNS TABLE(user_id uuid, email text, registrado timestamptz, ultimo_acceso timestamptz, plan_code text, plan_nombre text,
              plan_hasta timestamptz, docs_mes bigint, docs_total bigint, pagado_total bigint, ultimo_pago timestamptz,
              ultima_actividad timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inicio_mes timestamptz := date_trunc('month', now());
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
  SELECT
    u.id, u.email::text, u.created_at, u.last_sign_in_at,
    coalesce(p.code, 'gratis'), coalesce(p.nombre, 'Gratis'),
    CASE WHEN p.code IS NOT NULL THEN s.current_period_end END,
    coalesce((SELECT sum(i.processed) FROM ed_imports i WHERE i.owner_user_id = u.id AND i.created_at >= v_inicio_mes), 0)::bigint,
    coalesce((SELECT sum(i.processed) FROM ed_imports i WHERE i.owner_user_id = u.id), 0)::bigint,
    coalesce((SELECT sum(pay.amount_in_cents) / 100 FROM ed_payments pay WHERE pay.user_id = u.id AND pay.status = 'APPROVED'), 0)::bigint,
    (SELECT max(pay.created_at) FROM ed_payments pay WHERE pay.user_id = u.id AND pay.status = 'APPROVED'),
    (SELECT max(i.created_at) FROM ed_imports i WHERE i.owner_user_id = u.id)
  FROM auth.users u
  LEFT JOIN contador_suscripciones s ON s.user_id = u.id
  LEFT JOIN LATERAL public.contador_plan_actual(u.id) p ON true
  WHERE EXISTS (SELECT 1 FROM ed_imports i WHERE i.owner_user_id = u.id) OR s.user_id IS NOT NULL
  ORDER BY coalesce((SELECT max(i.created_at) FROM ed_imports i WHERE i.owner_user_id = u.id), u.last_sign_in_at, u.created_at) DESC
  LIMIT greatest(1, least(coalesce(p_limit, 200), 1000));
END $$;

CREATE OR REPLACE FUNCTION public.ed_admin_resumen()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inicio_mes timestamptz := date_trunc('month', now());
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN jsonb_build_object(
    'usuarios_total',    (SELECT count(DISTINCT owner_user_id) FROM ed_imports),
    'usuarios_mes',      (SELECT count(DISTINCT owner_user_id) FROM ed_imports WHERE created_at >= v_inicio_mes),
    'de_pago',           (SELECT count(*) FROM contador_suscripciones s WHERE s.estado = 'activa' AND s.current_period_end > now()),
    'docs_mes',          (SELECT coalesce(sum(processed), 0) FROM ed_imports WHERE created_at >= v_inicio_mes),
    'docs_total',        (SELECT coalesce(sum(processed), 0) FROM ed_imports),
    'ingresos_mes',      (SELECT coalesce(sum(amount_in_cents), 0) / 100 FROM ed_payments WHERE status = 'APPROVED' AND created_at >= v_inicio_mes),
    'ingresos_total',    (SELECT coalesce(sum(amount_in_cents), 0) / 100 FROM ed_payments WHERE status = 'APPROVED'),
    'pagos_pendientes',  (SELECT count(*) FROM ed_payments WHERE status = 'PENDING'),
    'documentos_guardados', (SELECT count(*) FROM ed_documents)
  );
END $$;
