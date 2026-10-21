-- Módulo «Contabilidad» para contadores (2026-10-21).
--
-- Lo que agrega, encima del módulo DIAN que ya existe:
--   1. Varias empresas por contador, identificadas por NIT (fiscal_entities,
--      que existía desde el motor DIAN pero ninguna pantalla usaba).
--   2. Avisos automáticos: cada XML que entra (subido, por correo o
--      descargado de la DIAN) se asigna solo a la empresa de su NIT y deja un
--      aviso «llegaron N documentos de X».
--   3. Contabilidad propia por empresa: plan de cuentas (PUC base en el
--      código + las cuentas propias de cada empresa aquí), comprobantes con
--      consecutivo por tipo, movimientos y saldos para los reportes.
--   4. Archivos por empresa (RUT, extractos, cámara de comercio…).
--   5. Planes de pago aparte del de XML, con prueba gratis de 15 días.
--
-- ── Por qué un plan aparte y no otro tramo de ed_plans ──────────────────
-- ed_plans vende CUPO de XML; esto vende un módulo con un tope de EMPRESAS.
-- Son dos cosas que el contador puede comprar por separado (o juntas, en
-- los combos). Meterlo en ed_plans obligaba a que comprar contabilidad le
-- quitara el plan de XML que ya tenía, o al revés.
--
-- Se cobra con el mismo Wompi y el mismo webhook: el pago vive en
-- ed_payments con cont_plan_code, y ed_confirmar_pago lo reparte.

-- ═══════════════════════════════════════════════════════════════════════
-- 1. Catálogo de planes
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cont_planes (
  code          text PRIMARY KEY,
  nombre        text NOT NULL,
  descripcion   text,
  max_empresas  integer NOT NULL CHECK (max_empresas > 0),
  precio_mes    bigint CHECK (precio_mes IS NULL OR precio_mes > 0),
  precio_anual  bigint CHECK (precio_anual IS NULL OR precio_anual > 0),
  -- Los combos incluyen además un plan de XML. NULL = sólo contabilidad.
  incluye_dian  text REFERENCES public.ed_plans(code),
  sort_order    integer NOT NULL DEFAULT 0,
  activo        boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Precios: el de 30 empresas lo fijó el dueño (50.000 / 530.000). Los demás
-- siguen la misma lógica: el anual sale casi a 10,6 meses, y los combos
-- cuestan menos que comprar las dos cosas por separado.
INSERT INTO public.cont_planes (code, nombre, descripcion, max_empresas, precio_mes, precio_anual, incluye_dian, sort_order) VALUES
  ('cont_30',    'Contador',            'Contabilidad de hasta 30 empresas', 30, 50000, 530000, NULL, 1),
  ('cont_60',    'Contador Plus',       'Contabilidad de hasta 60 empresas', 60, 85000, 900000, NULL, 2),
  ('cont_150',   'Firma contable',      'Contabilidad de hasta 150 empresas', 150, 160000, 1700000, NULL, 3),
  ('combo_pro',  'Todo en uno',         'Contador (30 empresas) + XML Profesional (3.000 XML al mes)', 30, 120000, 1250000, 'profesional', 4),
  ('combo_firma','Todo en uno Firma',   'Firma contable (150 empresas) + XML Empresarial (10.000 XML al mes)', 150, 280000, 2900000, 'empresarial', 5)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.cont_planes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cont_planes_lectura ON public.cont_planes;
CREATE POLICY cont_planes_lectura ON public.cont_planes FOR SELECT TO authenticated USING (activo);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. Suscripción
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cont_suscripciones (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code          text NOT NULL REFERENCES public.cont_planes(code),
  estado             text NOT NULL CHECK (estado IN ('prueba', 'activa')),
  -- Única fuente de verdad del acceso, igual que en ed_subscriptions.
  current_period_end timestamptz NOT NULL,
  prueba_usada       boolean NOT NULL DEFAULT false,
  prueba_inicio      timestamptz,
  last_payment_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cont_suscripciones ENABLE ROW LEVEL SECURITY;
-- Leer lo propio. Escribir sólo desde funciones: con UPDATE directo
-- cualquiera se alargaría la prueba.
DROP POLICY IF EXISTS cont_suscripciones_propia ON public.cont_suscripciones;
CREATE POLICY cont_suscripciones_propia ON public.cont_suscripciones
  FOR SELECT USING (user_id = auth.uid());

ALTER TABLE public.ed_payments
  ADD COLUMN IF NOT EXISTS cont_plan_code text REFERENCES public.cont_planes(code);

CREATE OR REPLACE FUNCTION public.cont_acceso_activo(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_admin_user()
      OR EXISTS (SELECT 1 FROM cont_suscripciones
                 WHERE user_id = p_user_id AND current_period_end > now());
$$;
REVOKE ALL ON FUNCTION public.cont_acceso_activo(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_acceso_activo(uuid) TO authenticated, service_role;

/** Tope de empresas vigente. NULL = sin tope (administrador). 0 = sin acceso. */
CREATE OR REPLACE FUNCTION public.cont_max_empresas(p_user_id uuid DEFAULT auth.uid())
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.is_admin_user() THEN NULL
    ELSE coalesce((
      SELECT p.max_empresas FROM cont_suscripciones s
      JOIN cont_planes p ON p.code = s.plan_code
      WHERE s.user_id = p_user_id AND s.current_period_end > now()), 0)
  END;
$$;
REVOKE ALL ON FUNCTION public.cont_max_empresas(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_max_empresas(uuid) TO authenticated, service_role;

/** Todo lo que la pantalla necesita para decidir qué enseñar. */
CREATE OR REPLACE FUNCTION public.cont_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sub    cont_suscripciones;
  v_plan   cont_planes;
  v_admin  boolean := public.is_admin_user();
  v_activo boolean;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('error', 'sin_sesion'); END IF;

  SELECT * INTO v_sub FROM cont_suscripciones WHERE user_id = auth.uid();
  IF v_sub.plan_code IS NOT NULL THEN
    SELECT * INTO v_plan FROM cont_planes WHERE code = v_sub.plan_code;
  END IF;
  v_activo := v_admin OR (v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end > now());

  RETURN jsonb_build_object(
    'activo',            v_activo,
    'admin',             v_admin,
    'en_prueba',         (NOT v_admin AND v_activo AND v_sub.estado = 'prueba'),
    'plan_code',         v_plan.code,
    'plan_nombre',       v_plan.nombre,
    'max_empresas',      public.cont_max_empresas(),
    'empresas_usadas',   (SELECT count(*) FROM fiscal_entities WHERE owner_user_id = auth.uid() AND activo),
    'hasta',             v_sub.current_period_end,
    'prueba_disponible', (NOT v_activo AND NOT coalesce(v_sub.prueba_usada, false)),
    'planes', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'code', p.code, 'nombre', p.nombre, 'descripcion', p.descripcion,
        'max_empresas', p.max_empresas, 'precio_mes', p.precio_mes, 'precio_anual', p.precio_anual,
        'incluye_dian', p.incluye_dian,
        'dian_nombre', d.name, 'dian_limite', d.monthly_xml_limit
      ) ORDER BY p.sort_order), '[]'::jsonb)
      FROM cont_planes p LEFT JOIN ed_plans d ON d.code = p.incluye_dian
      WHERE p.activo
    )
  );
END $$;
REVOKE ALL ON FUNCTION public.cont_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_estado() TO authenticated;

/** Prueba gratis de 15 días, una por cuenta, al instante. */
CREATE OR REPLACE FUNCTION public.cont_iniciar_prueba()
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sub cont_suscripciones;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  SELECT * INTO v_sub FROM cont_suscripciones WHERE user_id = auth.uid() FOR UPDATE;
  IF v_sub.prueba_usada THEN
    RAISE EXCEPTION 'Ya usaste tu prueba gratis. Elige un plan para seguir.';
  END IF;
  IF v_sub.current_period_end IS NOT NULL AND v_sub.current_period_end > now() THEN
    RAISE EXCEPTION 'Ya tienes Contabilidad activa.';
  END IF;

  INSERT INTO cont_suscripciones (user_id, plan_code, estado, current_period_end, prueba_usada, prueba_inicio)
  VALUES (auth.uid(), 'cont_30', 'prueba', now() + interval '15 days', true, now())
  ON CONFLICT (user_id) DO UPDATE
    SET plan_code = 'cont_30', estado = 'prueba', current_period_end = now() + interval '15 days',
        prueba_usada = true, prueba_inicio = now(), updated_at = now();

  RETURN public.cont_estado();
END $$;
REVOKE ALL ON FUNCTION public.cont_iniciar_prueba() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_iniciar_prueba() TO authenticated;

/** Abre el cobro. El importe sale de cont_planes, nunca del navegador. */
CREATE OR REPLACE FUNCTION public.cont_crear_pago(p_plan_code text, p_meses integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan  cont_planes;
  v_total bigint;
  v_id    uuid := gen_random_uuid();
  v_ref   text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  IF p_meses NOT IN (1, 12) THEN RAISE EXCEPTION 'Sólo hay pago mensual o anual'; END IF;

  SELECT * INTO v_plan FROM cont_planes WHERE code = p_plan_code AND activo;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ese plan no existe'; END IF;

  v_total := CASE WHEN p_meses = 12 THEN v_plan.precio_anual ELSE v_plan.precio_mes END;
  IF v_total IS NULL THEN RAISE EXCEPTION 'Ese pago no está disponible para el plan %', v_plan.nombre; END IF;

  v_ref := 'cont-' || replace(v_id::text, '-', '');
  INSERT INTO ed_payments (id, user_id, reference, amount_in_cents, currency, months, status, cont_plan_code)
  VALUES (v_id, auth.uid(), v_ref, v_total * 100, 'COP', p_meses, 'PENDING', v_plan.code);

  RETURN jsonb_build_object(
    'reference', v_ref, 'amount_in_cents', v_total * 100, 'currency', 'COP',
    'plan_code', v_plan.code, 'plan_nombre', v_plan.nombre, 'plan_limite', NULL, 'meses', p_meses
  );
END $$;
REVOKE ALL ON FUNCTION public.cont_crear_pago(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_crear_pago(text, integer) TO authenticated;

-- ── Confirmación: la misma función de siempre, que ahora reparte ─────────
-- El camino del plan de XML queda EXACTAMENTE igual que antes; sólo se
-- agrega la rama del pago de contabilidad.
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

  -- ── Pago de Contabilidad ────────────────────────────────────────────
  IF v_pago.cont_plan_code IS NOT NULL THEN
    SELECT * INTO v_cplan FROM cont_planes WHERE code = v_pago.cont_plan_code;

    -- Los días de una suscripción PAGADA vigente se respetan. Los de la
    -- prueba no se suman: quien paga en el día 3 de la prueba empieza su mes
    -- hoy, que es lo que se le está cobrando.
    SELECT CASE WHEN estado = 'activa' THEN greatest(current_period_end, now()) ELSE now() END
      INTO v_desde FROM cont_suscripciones WHERE user_id = v_pago.user_id;
    v_desde := coalesce(v_desde, now());
    v_hasta := v_desde + make_interval(months => v_pago.months);

    INSERT INTO cont_suscripciones (user_id, plan_code, estado, current_period_end, last_payment_at, updated_at)
    VALUES (v_pago.user_id, v_cplan.code, 'activa', v_hasta, now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET plan_code = excluded.plan_code, estado = 'activa', current_period_end = v_hasta,
          last_payment_at = now(), updated_at = now();

    -- Combo: además el plan de XML. Nunca baja a nadie de plan: si ya tenía
    -- uno más grande vigente, se le queda ese y sólo se alarga la fecha.
    IF v_cplan.incluye_dian IS NOT NULL THEN
      SELECT * INTO v_incl FROM ed_plans WHERE code = v_cplan.incluye_dian;
      SELECT * INTO v_actual FROM public.ed_plan_vigente(v_pago.user_id);
      INSERT INTO ed_subscriptions (user_id, status, plan_code, current_period_end, last_payment_at, updated_at)
      VALUES (v_pago.user_id, 'active', v_incl.code, v_hasta, now(), now())
      ON CONFLICT (user_id) DO UPDATE
        SET status = 'active',
            plan_code = CASE WHEN coalesce(v_actual.price_cop, 0) > coalesce(v_incl.price_cop, 0)
                             THEN v_actual.code ELSE v_incl.code END,
            current_period_end = greatest(coalesce(ed_subscriptions.current_period_end, now()), v_hasta),
            last_payment_at = now(),
            updated_at = now();
    END IF;

    RETURN jsonb_build_object('ok', true, 'motivo', 'activado', 'contabilidad', v_cplan.code, 'hasta', v_hasta);
  END IF;

  -- ── Pago del plan de XML (igual que siempre) ────────────────────────
  SELECT greatest(coalesce(current_period_end, now()), now()) INTO v_desde
  FROM ed_subscriptions WHERE user_id = v_pago.user_id;
  v_desde := coalesce(v_desde, now());
  v_hasta := v_desde + make_interval(months => v_pago.months);

  INSERT INTO ed_subscriptions (user_id, status, plan_code, current_period_end, last_payment_at, updated_at)
  VALUES (v_pago.user_id, 'active', v_pago.plan_code, v_hasta, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        plan_code = excluded.plan_code,
        current_period_end = v_hasta,
        last_payment_at = now(),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'motivo', 'activado',
                            'plan', v_pago.plan_code, 'hasta', v_hasta);
END $$;

REVOKE ALL ON FUNCTION public.ed_confirmar_pago(text, text, text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ed_confirmar_pago(text, text, text, text, jsonb) TO service_role;

-- La lista de pagos sin confirmar del panel muestra también los de
-- Contabilidad (su plan va en cont_plan_code).
CREATE OR REPLACE FUNCTION public.ed_pagos_pendientes(p_horas integer DEFAULT 72)
RETURNS TABLE (reference text, email text, plan_code text, monto_cop bigint, status text, creado timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  RETURN QUERY
  SELECT p.reference, u.email::text, coalesce(p.plan_code, p.cont_plan_code),
         (p.amount_in_cents / 100)::bigint, p.status, p.created_at
  FROM ed_payments p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.status = 'PENDING'
    AND p.created_at > now() - make_interval(hours => greatest(1, coalesce(p_horas, 72)))
  ORDER BY p.created_at DESC;
END $$;

/** El dueño ajusta precios y topes sin desplegar. */
CREATE OR REPLACE FUNCTION public.cont_plan_configurar(
  p_code text, p_precio_mes bigint, p_precio_anual bigint, p_max_empresas integer
)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE cont_planes SET precio_mes = p_precio_mes, precio_anual = p_precio_anual,
         max_empresas = p_max_empresas, updated_at = now()
  WHERE code = p_code;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ese plan no existe: %', p_code; END IF;
END $$;
REVOKE ALL ON FUNCTION public.cont_plan_configurar(text, bigint, bigint, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_plan_configurar(text, bigint, bigint, integer) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. Empresas (fiscal_entities)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.fiscal_entities
  ADD COLUMN IF NOT EXISTS color    text,
  ADD COLUMN IF NOT EXISTS ciudad   text,
  ADD COLUMN IF NOT EXISTS email    text,
  ADD COLUMN IF NOT EXISTS telefono text,
  ADD COLUMN IF NOT EXISTS notas    text;

/** El NIT se guarda sólo con dígitos y sin DV; el tope del plan se cumple
 *  aquí y no en la pantalla, que se puede saltar. */
CREATE OR REPLACE FUNCTION public.cont_empresa_validar()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_max   integer;
  v_usadas integer;
BEGIN
  NEW.nit := regexp_replace(coalesce(NEW.nit, ''), '[^0-9]', '', 'g');
  IF NEW.nit !~ '^[0-9]{3,15}$' THEN
    RAISE EXCEPTION 'El NIT debe tener entre 3 y 15 dígitos, sin dígito de verificación';
  END IF;
  NEW.updated_at := now();

  IF NEW.activo AND (TG_OP = 'INSERT' OR NOT OLD.activo) THEN
    IF NOT public.cont_acceso_activo(NEW.owner_user_id) THEN
      RAISE EXCEPTION 'Necesitas el plan de Contabilidad (o la prueba gratis) para agregar empresas';
    END IF;
    v_max := public.cont_max_empresas(NEW.owner_user_id);
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

DROP TRIGGER IF EXISTS cont_empresa_validar ON public.fiscal_entities;
CREATE TRIGGER cont_empresa_validar
  BEFORE INSERT OR UPDATE ON public.fiscal_entities
  FOR EACH ROW EXECUTE FUNCTION public.cont_empresa_validar();

/** Al crear una empresa, los XML que ya estaban subidos con su NIT pasan a
 *  su carpeta. Sin esto, el contador que ya usaba el módulo DIAN abriría la
 *  empresa recién creada y la vería vacía. */
CREATE OR REPLACE FUNCTION public.cont_empresa_reclamar_documentos()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE ed_documents d
     SET fiscal_entity_id = NEW.id
   WHERE d.owner_user_id = NEW.owner_user_id
     AND d.fiscal_entity_id IS NULL
     AND (regexp_replace(coalesce(d.receiver_nit, ''), '[^0-9]', '', 'g') = NEW.nit
          OR regexp_replace(coalesce(d.issuer_nit, ''), '[^0-9]', '', 'g') = NEW.nit);
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS cont_empresa_reclamar ON public.fiscal_entities;
CREATE TRIGGER cont_empresa_reclamar
  AFTER INSERT ON public.fiscal_entities
  FOR EACH ROW EXECUTE FUNCTION public.cont_empresa_reclamar_documentos();

-- Las carpetas filtran por NIT en cualquiera de los dos lados; el emisor ya
-- tenía índice, el receptor no.
CREATE INDEX IF NOT EXISTS ed_documents_receptor_idx
  ON public.ed_documents (owner_user_id, receiver_nit, issue_date DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. Avisos: «llegaron N XML de esta empresa»
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cont_avisos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id    uuid REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  tipo          text NOT NULL CHECK (tipo IN ('xml_nuevos', 'pos_nuevos', 'sistema')),
  -- Un aviso por empresa, tipo y día: 300 XML de una tarde son UN aviso
  -- que dice 300, no 300 avisos.
  fecha         date NOT NULL DEFAULT current_date,
  cantidad      integer NOT NULL DEFAULT 0,
  monto         numeric(18,2) NOT NULL DEFAULT 0,
  -- {"factura": 10, "nota_credito": 2, "compras": 9, "ventas": 3}
  detalle       jsonb NOT NULL DEFAULT '{}'::jsonb,
  leido         boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cont_avisos_dia_idx
  ON public.cont_avisos (owner_user_id, empresa_id, tipo, fecha);
CREATE INDEX IF NOT EXISTS cont_avisos_lista_idx
  ON public.cont_avisos (owner_user_id, updated_at DESC);

ALTER TABLE public.cont_avisos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cont_avisos_leer ON public.cont_avisos;
CREATE POLICY cont_avisos_leer ON public.cont_avisos FOR SELECT USING (owner_user_id = auth.uid());
DROP POLICY IF EXISTS cont_avisos_marcar ON public.cont_avisos;
CREATE POLICY cont_avisos_marcar ON public.cont_avisos FOR UPDATE
  USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
DROP POLICY IF EXISTS cont_avisos_borrar ON public.cont_avisos;
CREATE POLICY cont_avisos_borrar ON public.cont_avisos FOR DELETE USING (owner_user_id = auth.uid());
GRANT SELECT, UPDATE, DELETE ON public.cont_avisos TO authenticated;

/** Antes de guardar un XML: ¿de cuál de mis empresas es? Gana el receptor
 *  (compra), luego el emisor (venta o documento soporte). */
CREATE OR REPLACE FUNCTION public.cont_documento_asignar_empresa()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_rec text := regexp_replace(coalesce(NEW.receiver_nit, ''), '[^0-9]', '', 'g');
  v_emi text := regexp_replace(coalesce(NEW.issuer_nit, ''), '[^0-9]', '', 'g');
BEGIN
  IF NEW.fiscal_entity_id IS NULL AND (v_rec <> '' OR v_emi <> '') THEN
    SELECT id INTO NEW.fiscal_entity_id
    FROM fiscal_entities
    WHERE owner_user_id = NEW.owner_user_id AND activo AND nit IN (v_rec, v_emi)
    ORDER BY (nit = v_rec) DESC
    LIMIT 1;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS cont_documento_asignar ON public.ed_documents;
CREATE TRIGGER cont_documento_asignar
  BEFORE INSERT ON public.ed_documents
  FOR EACH ROW EXECUTE FUNCTION public.cont_documento_asignar_empresa();

/** Después de guardarlo (sólo si de verdad se guardó: un duplicado revienta
 *  antes y no llega aquí), se suma al aviso del día de esa empresa. */
CREATE OR REPLACE FUNCTION public.cont_documento_avisar()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_nit text;
  v_lado text;
BEGIN
  IF NEW.fiscal_entity_id IS NULL THEN RETURN NULL; END IF;
  SELECT nit INTO v_nit FROM fiscal_entities WHERE id = NEW.fiscal_entity_id;
  v_lado := CASE
    WHEN regexp_replace(coalesce(NEW.receiver_nit, ''), '[^0-9]', '', 'g') = v_nit
         AND NEW.doc_type <> 'documento_soporte' THEN 'compras'
    ELSE 'ventas' END;

  INSERT INTO cont_avisos (owner_user_id, empresa_id, tipo, fecha, cantidad, monto, detalle)
  VALUES (NEW.owner_user_id, NEW.fiscal_entity_id, 'xml_nuevos', current_date, 1, coalesce(NEW.total, 0),
          jsonb_build_object(NEW.doc_type, 1, v_lado, 1))
  ON CONFLICT (owner_user_id, empresa_id, tipo, fecha) DO UPDATE
    SET cantidad = cont_avisos.cantidad + 1,
        monto = cont_avisos.monto + excluded.monto,
        detalle = cont_avisos.detalle
          || jsonb_build_object(NEW.doc_type, coalesce((cont_avisos.detalle ->> NEW.doc_type)::int, 0) + 1)
          || jsonb_build_object(v_lado, coalesce((cont_avisos.detalle ->> v_lado)::int, 0) + 1),
        leido = false,
        updated_at = now();
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS cont_documento_avisar ON public.ed_documents;
CREATE TRIGGER cont_documento_avisar
  AFTER INSERT ON public.ed_documents
  FOR EACH ROW EXECUTE FUNCTION public.cont_documento_avisar();

-- ═══════════════════════════════════════════════════════════════════════
-- 5. Plan de cuentas propio de cada empresa
-- ═══════════════════════════════════════════════════════════════════════
-- El PUC base (Decreto 2650 de 1993) vive en el código: es igual para
-- todos. Aquí sólo lo que cada empresa agrega o renombra, y lo que oculta.

CREATE TABLE IF NOT EXISTS public.cont_cuentas (
  empresa_id    uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  codigo        text NOT NULL CHECK (codigo ~ '^[0-9]{1,12}$'),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre        text NOT NULL,
  naturaleza    text CHECK (naturaleza IN ('D', 'C')),
  activa        boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (empresa_id, codigo)
);

-- ═══════════════════════════════════════════════════════════════════════
-- 6. Comprobantes y movimientos
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.cont_comprobantes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id    uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  -- CC causación · RC recibo de caja · CE egreso · NC nota contable ·
  -- SI saldos iniciales · VP ventas POS · CI cierre
  tipo          text NOT NULL CHECK (tipo ~ '^[A-Z]{2,4}$'),
  numero        integer NOT NULL,
  fecha         date NOT NULL,
  descripcion   text,
  origen        text NOT NULL DEFAULT 'manual' CHECK (origen IN ('manual', 'xml', 'pos', 'saldos', 'cierre')),
  -- Lo que lo originó (id del XML, id de la venta del POS). Con el índice
  -- de abajo, contabilizar dos veces el mismo XML es imposible.
  origen_ref    text,
  total         numeric(18,2) NOT NULL DEFAULT 0,
  anulado       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cont_comprobantes_numero_idx
  ON public.cont_comprobantes (empresa_id, tipo, numero);
CREATE UNIQUE INDEX IF NOT EXISTS cont_comprobantes_origen_idx
  ON public.cont_comprobantes (empresa_id, origen, origen_ref)
  WHERE origen_ref IS NOT NULL AND NOT anulado;
CREATE INDEX IF NOT EXISTS cont_comprobantes_fecha_idx
  ON public.cont_comprobantes (empresa_id, fecha DESC);

CREATE TABLE IF NOT EXISTS public.cont_movimientos (
  id             bigserial PRIMARY KEY,
  comprobante_id uuid NOT NULL REFERENCES public.cont_comprobantes(id) ON DELETE CASCADE,
  owner_user_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id     uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  fecha          date NOT NULL,
  cuenta         text NOT NULL CHECK (cuenta ~ '^[0-9]{1,12}$'),
  tercero_nit    text,
  tercero_nombre text,
  documento      text,
  detalle        text,
  debito         numeric(18,2) NOT NULL DEFAULT 0 CHECK (debito >= 0),
  credito        numeric(18,2) NOT NULL DEFAULT 0 CHECK (credito >= 0),
  base           numeric(18,2) NOT NULL DEFAULT 0,
  centro_costo   text
);

CREATE INDEX IF NOT EXISTS cont_movimientos_comprobante_idx ON public.cont_movimientos (comprobante_id);
CREATE INDEX IF NOT EXISTS cont_movimientos_fecha_idx ON public.cont_movimientos (empresa_id, fecha, id);
CREATE INDEX IF NOT EXISTS cont_movimientos_cuenta_idx ON public.cont_movimientos (empresa_id, cuenta, fecha);

-- ═══════════════════════════════════════════════════════════════════════
-- 7. Archivos por empresa
-- ═══════════════════════════════════════════════════════════════════════
-- Los bytes van al bucket privado fiscal-documents, bajo
-- {owner}/contabilidad/{empresa}/…: la política existente del bucket ya
-- exige que la primera carpeta sea el propio usuario.

CREATE TABLE IF NOT EXISTS public.cont_archivos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id    uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  carpeta       text NOT NULL DEFAULT 'general',
  periodo       text CHECK (periodo IS NULL OR periodo ~ '^[0-9]{4}(-[0-9]{2})?$'),
  nombre        text NOT NULL,
  storage_path  text NOT NULL,
  tamano        bigint,
  tipo_mime     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cont_archivos_empresa_idx ON public.cont_archivos (empresa_id, carpeta, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════
-- 8. RLS: se lee siempre lo propio; se escribe con el plan vigente
-- ═══════════════════════════════════════════════════════════════════════
-- Si el plan vence, el contador sigue VIENDO su contabilidad (es suya) pero
-- no puede agregar ni cambiar nada hasta renovar.

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['cont_cuentas', 'cont_comprobantes', 'cont_movimientos', 'cont_archivos'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_leer', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (owner_user_id = auth.uid())', t || '_leer', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_escribir', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR INSERT
        WITH CHECK (owner_user_id = auth.uid() AND public.cont_acceso_activo()
                    AND EXISTS (SELECT 1 FROM public.fiscal_entities e
                                WHERE e.id = empresa_id AND e.owner_user_id = auth.uid()))
    $f$, t || '_escribir', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_cambiar', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR UPDATE
        USING (owner_user_id = auth.uid() AND public.cont_acceso_activo())
        WITH CHECK (owner_user_id = auth.uid())
    $f$, t || '_cambiar', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_borrar', t);
    EXECUTE format($f$
      CREATE POLICY %I ON public.%I FOR DELETE
        USING (owner_user_id = auth.uid() AND public.cont_acceso_activo())
    $f$, t || '_borrar', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.cont_movimientos_id_seq TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 9. Guardar un comprobante (atómico, cuadrado, con consecutivo)
-- ═══════════════════════════════════════════════════════════════════════
-- SECURITY INVOKER: corre con los permisos del contador, así que las
-- políticas de arriba se aplican igual que si escribiera tabla por tabla.
--
-- p_movimientos: [{cuenta, tercero_nit, tercero_nombre, documento, detalle,
--                  debito, credito, base, centro_costo}]

CREATE OR REPLACE FUNCTION public.cont_guardar_comprobante(
  p_empresa      uuid,
  p_tipo         text,
  p_fecha        date,
  p_descripcion  text,
  p_movimientos  jsonb,
  p_origen       text DEFAULT 'manual',
  p_origen_ref   text DEFAULT NULL,
  p_id           uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_db      numeric(18,2);
  v_cr      numeric(18,2);
  v_n       integer;
  v_numero  integer;
  v_id      uuid;
  v_exist   cont_comprobantes;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  IF NOT public.cont_acceso_activo() THEN
    RAISE EXCEPTION 'Tu plan de Contabilidad no está activo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM fiscal_entities WHERE id = p_empresa AND owner_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Esa empresa no es tuya';
  END IF;
  IF p_fecha IS NULL THEN RAISE EXCEPTION 'Falta la fecha'; END IF;

  SELECT count(*),
         round(coalesce(sum((m->>'debito')::numeric), 0), 2),
         round(coalesce(sum((m->>'credito')::numeric), 0), 2)
    INTO v_n, v_db, v_cr
  FROM jsonb_array_elements(coalesce(p_movimientos, '[]'::jsonb)) m;

  IF v_n < 2 THEN RAISE EXCEPTION 'Un comprobante necesita al menos dos movimientos'; END IF;
  IF v_db <= 0 THEN RAISE EXCEPTION 'El comprobante está en cero'; END IF;
  IF v_db <> v_cr THEN
    RAISE EXCEPTION 'El comprobante no cuadra: débitos % y créditos %', v_db, v_cr;
  END IF;

  -- Idempotencia por origen: el mismo XML o la misma venta no entra dos veces.
  IF p_origen_ref IS NOT NULL AND p_id IS NULL THEN
    SELECT * INTO v_exist FROM cont_comprobantes
    WHERE empresa_id = p_empresa AND origen = p_origen AND origen_ref = p_origen_ref AND NOT anulado;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_exist.id, 'numero', v_exist.numero, 'duplicado', true);
    END IF;
  END IF;

  IF p_id IS NOT NULL THEN
    SELECT * INTO v_exist FROM cont_comprobantes WHERE id = p_id AND empresa_id = p_empresa;
    IF NOT FOUND THEN RAISE EXCEPTION 'Ese comprobante no existe'; END IF;
    IF v_exist.anulado THEN RAISE EXCEPTION 'Un comprobante anulado no se edita'; END IF;
    UPDATE cont_comprobantes SET fecha = p_fecha, descripcion = p_descripcion, total = v_db, updated_at = now()
    WHERE id = p_id;
    DELETE FROM cont_movimientos WHERE comprobante_id = p_id;
    v_id := p_id;
    v_numero := v_exist.numero;
  ELSE
    -- El consecutivo se reparte bajo candado por empresa y tipo: dos
    -- pestañas guardando a la vez no pueden sacar el mismo número.
    PERFORM pg_advisory_xact_lock(hashtext(p_empresa::text || ':' || p_tipo));
    SELECT coalesce(max(numero), 0) + 1 INTO v_numero
    FROM cont_comprobantes WHERE empresa_id = p_empresa AND tipo = p_tipo;
    INSERT INTO cont_comprobantes (empresa_id, tipo, numero, fecha, descripcion, origen, origen_ref, total)
    VALUES (p_empresa, upper(p_tipo), v_numero, p_fecha, p_descripcion, p_origen, p_origen_ref, v_db)
    RETURNING id INTO v_id;
  END IF;

  INSERT INTO cont_movimientos (comprobante_id, empresa_id, fecha, cuenta, tercero_nit, tercero_nombre,
                                documento, detalle, debito, credito, base, centro_costo)
  SELECT v_id, p_empresa, p_fecha,
         regexp_replace(m->>'cuenta', '[^0-9]', '', 'g'),
         nullif(regexp_replace(coalesce(m->>'tercero_nit', ''), '[^0-9A-Za-z]', '', 'g'), ''),
         nullif(m->>'tercero_nombre', ''),
         nullif(m->>'documento', ''),
         nullif(m->>'detalle', ''),
         round(coalesce((m->>'debito')::numeric, 0), 2),
         round(coalesce((m->>'credito')::numeric, 0), 2),
         round(coalesce((m->>'base')::numeric, 0), 2),
         nullif(m->>'centro_costo', '')
  FROM jsonb_array_elements(p_movimientos) m
  WHERE coalesce((m->>'debito')::numeric, 0) <> 0 OR coalesce((m->>'credito')::numeric, 0) <> 0;

  -- El XML queda marcado como contabilizado en el módulo DIAN.
  IF p_origen = 'xml' AND p_origen_ref ~ '^[0-9a-f-]{36}$' THEN
    UPDATE ed_documents SET accounting_status = 'aprobado', updated_at = now()
    WHERE id = p_origen_ref::uuid AND owner_user_id = auth.uid();
  END IF;

  RETURN jsonb_build_object('id', v_id, 'numero', v_numero, 'duplicado', false);
END $$;
REVOKE ALL ON FUNCTION public.cont_guardar_comprobante(uuid, text, date, text, jsonb, text, text, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_guardar_comprobante(uuid, text, date, text, jsonb, text, text, uuid) TO authenticated;

/** Anular conserva el número (el consecutivo no puede tener huecos) y
 *  quita los movimientos. Si venía de un XML, el XML vuelve a pendiente. */
CREATE OR REPLACE FUNCTION public.cont_anular_comprobante(p_id uuid)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = public AS $$
DECLARE v cont_comprobantes;
BEGIN
  IF NOT public.cont_acceso_activo() THEN RAISE EXCEPTION 'Tu plan de Contabilidad no está activo'; END IF;
  SELECT * INTO v FROM cont_comprobantes WHERE id = p_id AND owner_user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Ese comprobante no existe'; END IF;
  DELETE FROM cont_movimientos WHERE comprobante_id = p_id;
  UPDATE cont_comprobantes SET anulado = true, total = 0, updated_at = now(),
         descripcion = 'ANULADO. ' || coalesce(descripcion, '')
  WHERE id = p_id;
  IF v.origen = 'xml' AND v.origen_ref ~ '^[0-9a-f-]{36}$' THEN
    UPDATE ed_documents SET accounting_status = 'pendiente', updated_at = now()
    WHERE id = v.origen_ref::uuid AND owner_user_id = auth.uid();
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.cont_anular_comprobante(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_anular_comprobante(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- 10. Saldos para los reportes
-- ═══════════════════════════════════════════════════════════════════════
-- Una fila por cuenta (y por tercero si se pide) con el saldo anterior al
-- periodo y los débitos y créditos del periodo. Con esto la pantalla arma
-- balance de prueba, estados financieros, cartera y proveedores sin bajar
-- miles de movimientos.

CREATE OR REPLACE FUNCTION public.cont_saldos(
  p_empresa uuid, p_desde date, p_hasta date, p_por_tercero boolean DEFAULT false
)
RETURNS TABLE (cuenta text, tercero_nit text, tercero_nombre text, anterior numeric, debitos numeric, creditos numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT m.cuenta,
         CASE WHEN p_por_tercero THEN coalesce(m.tercero_nit, '') ELSE '' END,
         CASE WHEN p_por_tercero THEN max(m.tercero_nombre) ELSE NULL END,
         round(sum(CASE WHEN m.fecha < p_desde THEN m.debito - m.credito ELSE 0 END), 2),
         round(sum(CASE WHEN m.fecha >= p_desde THEN m.debito ELSE 0 END), 2),
         round(sum(CASE WHEN m.fecha >= p_desde THEN m.credito ELSE 0 END), 2)
  FROM cont_movimientos m
  WHERE m.empresa_id = p_empresa AND m.owner_user_id = auth.uid() AND m.fecha <= p_hasta
  GROUP BY 1, 2
  ORDER BY 1, 2;
$$;
REVOKE ALL ON FUNCTION public.cont_saldos(uuid, date, date, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_saldos(uuid, date, date, boolean) TO authenticated;

/** Tarjetas de «Mis empresas»: documentos del mes, pendientes de causar y
 *  avisos sin leer por empresa, en una sola consulta. */
CREATE OR REPLACE FUNCTION public.cont_resumen_empresas()
RETURNS TABLE (empresa_id uuid, documentos_mes integer, por_causar integer, avisos integer, ultimo_documento date, comprobantes integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT e.id,
         (SELECT count(*)::int FROM ed_documents d
           WHERE d.owner_user_id = auth.uid() AND d.fiscal_entity_id = e.id
             AND d.issue_date >= date_trunc('month', current_date)),
         (SELECT count(*)::int FROM ed_documents d
           WHERE d.owner_user_id = auth.uid() AND d.fiscal_entity_id = e.id
             AND d.accounting_status = 'pendiente'
             AND d.doc_type IN ('factura','nota_credito','nota_debito','documento_equivalente','documento_soporte')),
         (SELECT coalesce(sum(a.cantidad), 0)::int FROM cont_avisos a
           WHERE a.owner_user_id = auth.uid() AND a.empresa_id = e.id AND NOT a.leido),
         (SELECT max(d.issue_date) FROM ed_documents d
           WHERE d.owner_user_id = auth.uid() AND d.fiscal_entity_id = e.id),
         (SELECT count(*)::int FROM cont_comprobantes c WHERE c.empresa_id = e.id AND NOT c.anulado)
  FROM fiscal_entities e
  WHERE e.owner_user_id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.cont_resumen_empresas() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_resumen_empresas() TO authenticated;

-- Verificación
SELECT code, nombre, max_empresas, precio_mes, precio_anual, incluye_dian FROM public.cont_planes ORDER BY sort_order;
