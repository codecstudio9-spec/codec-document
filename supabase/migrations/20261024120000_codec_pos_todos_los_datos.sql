-- Codec POS → Contabilidad, fase 2: todo lo que el contador necesita (2026-10-24).
--
-- Hasta ahora sólo llegaban ventas y facturas electrónicas. Con esto el
-- negocio también comparte:
--   · gasto          lo que pagó de la caja o del banco → pos_gastos
--   · devolucion     devoluciones de ventas              → pos_devoluciones
--   · cierre_caja    el arqueo de cada turno              → pos_cierres_caja
--   · nota_credito, nota_debito, documento_soporte: el XML entra a la misma
--                    bandeja que las facturas (ver pos-ingesta)
--   · anulacion      ahora también de gastos y devoluciones (campo `de`)
--
-- Y se corrige que «Contabilizar día» con ventas que llegaron después de un
-- VP ya hecho devolvía el VP viejo (mismo origen_ref) y marcaba las ventas
-- nuevas con él sin contabilizarlas.

-- ── Gastos ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pos_gastos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id       uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  vinculo_id       uuid REFERENCES public.cont_pos_vinculos(id) ON DELETE SET NULL,
  id_origen        text NOT NULL,
  fecha            timestamptz NOT NULL,
  concepto         text,
  categoria        text,
  -- Lo que salió de la caja o del banco, con IVA.
  valor            numeric(18,2) NOT NULL DEFAULT 0,
  iva              numeric(18,2) NOT NULL DEFAULT 0,
  medio_pago       text,
  proveedor_nombre text,
  proveedor_nit    text,
  numero_soporte   text,
  cajero           text,
  tienda           text,
  notas            text,
  anulado          boolean NOT NULL DEFAULT false,
  comprobante_id   uuid REFERENCES public.cont_comprobantes(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, id_origen)
);
CREATE INDEX IF NOT EXISTS pos_gastos_fecha_idx ON public.pos_gastos (empresa_id, fecha DESC);

-- ── Devoluciones ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pos_devoluciones (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id        uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  vinculo_id        uuid REFERENCES public.cont_pos_vinculos(id) ON DELETE SET NULL,
  id_origen         text NOT NULL,
  venta_id_origen   text,
  fecha             timestamptz NOT NULL,
  total             numeric(18,2) NOT NULL DEFAULT 0,
  subtotal          numeric(18,2) NOT NULL DEFAULT 0,
  iva               numeric(18,2) NOT NULL DEFAULT 0,
  medio_pago        text,
  motivo            text,
  -- Con nota crédito electrónica la devolución se causa desde su XML.
  nota_credito_cufe text,
  items             jsonb NOT NULL DEFAULT '[]'::jsonb,
  anulada           boolean NOT NULL DEFAULT false,
  comprobante_id    uuid REFERENCES public.cont_comprobantes(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, id_origen)
);
CREATE INDEX IF NOT EXISTS pos_devoluciones_fecha_idx ON public.pos_devoluciones (empresa_id, fecha DESC);

-- ── Cierres de caja ─────────────────────────────────────────────────────
-- Sólo informativos: el dinero ya está en ventas, gastos y devoluciones.
-- Sirven al contador para ver diferencias de caja por turno.
CREATE TABLE IF NOT EXISTS public.pos_cierres_caja (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id        uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  vinculo_id        uuid REFERENCES public.cont_pos_vinculos(id) ON DELETE SET NULL,
  id_origen         text NOT NULL,
  apertura          timestamptz,
  cierre            timestamptz NOT NULL,
  cajero            text,
  tienda            text,
  caja              text,
  base_inicial      numeric(18,2) NOT NULL DEFAULT 0,
  ventas_total      numeric(18,2) NOT NULL DEFAULT 0,
  ventas_por_medio  jsonb NOT NULL DEFAULT '{}'::jsonb,
  gastos_efectivo   numeric(18,2) NOT NULL DEFAULT 0,
  retiros           numeric(18,2) NOT NULL DEFAULT 0,
  ingresos_extra    numeric(18,2) NOT NULL DEFAULT 0,
  efectivo_esperado numeric(18,2) NOT NULL DEFAULT 0,
  efectivo_contado  numeric(18,2) NOT NULL DEFAULT 0,
  diferencia        numeric(18,2) NOT NULL DEFAULT 0,
  num_ventas        integer NOT NULL DEFAULT 0,
  observaciones     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, id_origen)
);
CREATE INDEX IF NOT EXISTS pos_cierres_caja_fecha_idx ON public.pos_cierres_caja (empresa_id, cierre DESC);

-- ── Permisos: el navegador sólo lee; escribe pos-ingesta con service_role ─
ALTER TABLE public.pos_gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_cierres_caja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_gastos_leer ON public.pos_gastos;
CREATE POLICY pos_gastos_leer ON public.pos_gastos FOR SELECT USING (owner_user_id = auth.uid());
DROP POLICY IF EXISTS pos_devoluciones_leer ON public.pos_devoluciones;
CREATE POLICY pos_devoluciones_leer ON public.pos_devoluciones FOR SELECT USING (owner_user_id = auth.uid());
DROP POLICY IF EXISTS pos_cierres_caja_leer ON public.pos_cierres_caja;
CREATE POLICY pos_cierres_caja_leer ON public.pos_cierres_caja FOR SELECT USING (owner_user_id = auth.uid());

-- Las funciones de contabilizar son INVOKER: necesitan marcar el comprobante.
DROP POLICY IF EXISTS pos_gastos_marcar ON public.pos_gastos;
CREATE POLICY pos_gastos_marcar ON public.pos_gastos FOR UPDATE
  USING (owner_user_id = auth.uid() AND public.cont_acceso_activo())
  WITH CHECK (owner_user_id = auth.uid());
DROP POLICY IF EXISTS pos_devoluciones_marcar ON public.pos_devoluciones;
CREATE POLICY pos_devoluciones_marcar ON public.pos_devoluciones FOR UPDATE
  USING (owner_user_id = auth.uid() AND public.cont_acceso_activo())
  WITH CHECK (owner_user_id = auth.uid());

REVOKE ALL ON public.pos_gastos, public.pos_devoluciones, public.pos_cierres_caja FROM anon, authenticated;
GRANT SELECT ON public.pos_gastos, public.pos_devoluciones, public.pos_cierres_caja TO authenticated;
GRANT UPDATE (comprobante_id, updated_at) ON public.pos_gastos, public.pos_devoluciones TO authenticated;

-- ── Avisos: un aviso por empresa y día con el detalle de lo que llegó ────
-- El de ventas reescribía `detalle` entero; ahora cada tipo suma su clave.
CREATE OR REPLACE FUNCTION public.pos_avisar()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_clave text := TG_ARGV[0];
  -- Sólo las ventas suman pesos al aviso: mezclar gastos daría una cifra sin sentido.
  v_monto numeric := CASE WHEN TG_TABLE_NAME = 'pos_ventas' THEN coalesce((to_jsonb(NEW) ->> 'total')::numeric, 0) ELSE 0 END;
BEGIN
  INSERT INTO cont_avisos (owner_user_id, empresa_id, tipo, fecha, cantidad, monto, detalle)
  VALUES (NEW.owner_user_id, NEW.empresa_id, 'pos_nuevos', current_date, 1, v_monto, jsonb_build_object(v_clave, 1))
  ON CONFLICT (owner_user_id, empresa_id, tipo, fecha) DO UPDATE
    SET cantidad = cont_avisos.cantidad + 1,
        monto = cont_avisos.monto + excluded.monto,
        detalle = cont_avisos.detalle || jsonb_build_object(v_clave, coalesce((cont_avisos.detalle ->> v_clave)::int, 0) + 1),
        leido = false,
        updated_at = now();
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS pos_venta_avisar ON public.pos_ventas;
CREATE TRIGGER pos_venta_avisar AFTER INSERT ON public.pos_ventas
  FOR EACH ROW EXECUTE FUNCTION public.pos_avisar('ventas');
DROP TRIGGER IF EXISTS pos_gasto_avisar ON public.pos_gastos;
CREATE TRIGGER pos_gasto_avisar AFTER INSERT ON public.pos_gastos
  FOR EACH ROW EXECUTE FUNCTION public.pos_avisar('gastos');
DROP TRIGGER IF EXISTS pos_devolucion_avisar ON public.pos_devoluciones;
CREATE TRIGGER pos_devolucion_avisar AFTER INSERT ON public.pos_devoluciones
  FOR EACH ROW EXECUTE FUNCTION public.pos_avisar('devoluciones');
DROP TRIGGER IF EXISTS pos_cierre_avisar ON public.pos_cierres_caja;
CREATE TRIGGER pos_cierre_avisar AFTER INSERT ON public.pos_cierres_caja
  FOR EACH ROW EXECUTE FUNCTION public.pos_avisar('cierres');

DROP FUNCTION IF EXISTS public.pos_venta_avisar();

-- ── Comprobante de ventas del día (VP), ahora neto de devoluciones ──────
-- Ventas sin factura electrónica menos devoluciones sin nota crédito, por
-- medio de pago. Si un medio queda negativo (sólo devoluciones ese día), va
-- al crédito; igual ingresos e IVA.
CREATE OR REPLACE FUNCTION public.pos_contabilizar_dia(
  p_empresa uuid, p_fecha date, p_cuentas jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  c_caja     text := coalesce(p_cuentas ->> 'caja', '110505');
  c_bancos   text := coalesce(p_cuentas ->> 'bancos', '111005');
  c_ingresos text := coalesce(p_cuentas ->> 'ingresos', '413595');
  c_iva      text := coalesce(p_cuentas ->> 'iva', '240805');
  c_propina  text := coalesce(p_cuentas ->> 'propinas', '238095');
  v_ventas   uuid[];
  v_devs     uuid[];
  v_movs     jsonb := '[]'::jsonb;
  v_res      jsonb;
  v_iva      numeric;
  v_propina  numeric;
  v_base     numeric;
  v_ref      text;
  r          record;
BEGIN
  SELECT array_agg(id ORDER BY id) INTO v_ventas FROM pos_ventas
  WHERE empresa_id = p_empresa AND owner_user_id = auth.uid()
    AND (fecha AT TIME ZONE 'America/Bogota')::date = p_fecha
    AND NOT anulada AND factura_cufe IS NULL AND comprobante_id IS NULL;

  SELECT array_agg(id ORDER BY id) INTO v_devs FROM pos_devoluciones
  WHERE empresa_id = p_empresa AND owner_user_id = auth.uid()
    AND (fecha AT TIME ZONE 'America/Bogota')::date = p_fecha
    AND NOT anulada AND nota_credito_cufe IS NULL AND comprobante_id IS NULL;

  IF v_ventas IS NULL AND v_devs IS NULL THEN
    RETURN jsonb_build_object('ventas', 0, 'devoluciones', 0);
  END IF;

  -- Filas con signo: venta +, devolución −.
  FOR r IN
    SELECT medio, sum(total) AS valor FROM (
      SELECT lower(coalesce(medio_pago, 'efectivo')) AS medio, total FROM pos_ventas WHERE id = ANY (coalesce(v_ventas, '{}'))
      UNION ALL
      SELECT lower(coalesce(medio_pago, 'efectivo')), -total FROM pos_devoluciones WHERE id = ANY (coalesce(v_devs, '{}'))
    ) f GROUP BY 1 HAVING sum(total) <> 0
  LOOP
    v_movs := v_movs || jsonb_build_array(jsonb_build_object(
      'cuenta', CASE WHEN r.medio IN ('efectivo', 'cash') THEN c_caja ELSE c_bancos END,
      'detalle', 'Ventas Codec POS ' || p_fecha || ' (' || r.medio || ')',
      'debito', greatest(r.valor, 0), 'credito', greatest(-r.valor, 0)));
  END LOOP;

  SELECT coalesce(sum(iva), 0), coalesce(sum(propina), 0), coalesce(sum(total - iva - propina), 0)
    INTO v_iva, v_propina, v_base FROM (
      SELECT total, iva, propina FROM pos_ventas WHERE id = ANY (coalesce(v_ventas, '{}'))
      UNION ALL
      SELECT -total, -iva, 0 FROM pos_devoluciones WHERE id = ANY (coalesce(v_devs, '{}'))
    ) f;

  v_movs := v_movs || jsonb_build_array(jsonb_build_object(
    'cuenta', c_ingresos, 'detalle', 'Ventas Codec POS ' || p_fecha,
    'debito', greatest(-v_base, 0), 'credito', greatest(v_base, 0), 'base', abs(v_base)));
  IF v_iva <> 0 THEN
    v_movs := v_movs || jsonb_build_array(jsonb_build_object(
      'cuenta', c_iva, 'detalle', 'IVA ventas Codec POS ' || p_fecha,
      'debito', greatest(-v_iva, 0), 'credito', greatest(v_iva, 0)));
  END IF;
  IF v_propina <> 0 THEN
    v_movs := v_movs || jsonb_build_array(jsonb_build_object(
      'cuenta', c_propina, 'detalle', 'Propinas Codec POS ' || p_fecha, 'debito', 0, 'credito', v_propina));
  END IF;

  -- La referencia lleva qué ventas entraron: si después llegan más del mismo
  -- día, el segundo VP es otro comprobante y no el primero repetido.
  v_ref := 'dia:' || p_fecha || ':' || left(md5(array_to_string(coalesce(v_ventas, '{}'), ',') || '|' || array_to_string(coalesce(v_devs, '{}'), ',')), 12);

  v_res := public.cont_guardar_comprobante(
    p_empresa, 'VP', p_fecha,
    'Ventas Codec POS del ' || p_fecha || ' (' || coalesce(array_length(v_ventas, 1), 0) || ' ventas'
      || CASE WHEN v_devs IS NOT NULL THEN ', ' || array_length(v_devs, 1) || ' devoluciones' ELSE '' END || ')',
    v_movs, 'pos', v_ref);

  UPDATE pos_ventas SET comprobante_id = (v_res ->> 'id')::uuid, updated_at = now() WHERE id = ANY (coalesce(v_ventas, '{}'));
  UPDATE pos_devoluciones SET comprobante_id = (v_res ->> 'id')::uuid, updated_at = now() WHERE id = ANY (coalesce(v_devs, '{}'));

  RETURN v_res || jsonb_build_object('ventas', coalesce(array_length(v_ventas, 1), 0), 'devoluciones', coalesce(array_length(v_devs, 1), 0));
END $$;
REVOKE ALL ON FUNCTION public.pos_contabilizar_dia(uuid, date, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pos_contabilizar_dia(uuid, date, jsonb) TO authenticated;

-- ── Comprobante de egreso (CE) con los gastos del día ───────────────────
-- Db gasto (519595 por defecto) e IVA descontable (240810), Cr caja o bancos
-- según cómo se pagó. Cada gasto es su propio movimiento con el proveedor
-- como tercero, para que el auxiliar por tercero salga bien.
CREATE OR REPLACE FUNCTION public.pos_contabilizar_gastos_dia(
  p_empresa uuid, p_fecha date, p_cuentas jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path = public AS $$
DECLARE
  c_caja   text := coalesce(p_cuentas ->> 'caja', '110505');
  c_bancos text := coalesce(p_cuentas ->> 'bancos', '111005');
  c_gasto  text := coalesce(p_cuentas ->> 'gastos', '519595');
  c_iva    text := coalesce(p_cuentas ->> 'iva_descontable', '240810');
  v_ids    uuid[];
  v_movs   jsonb;
  v_res    jsonb;
BEGIN
  SELECT array_agg(id ORDER BY id) INTO v_ids FROM pos_gastos
  WHERE empresa_id = p_empresa AND owner_user_id = auth.uid()
    AND (fecha AT TIME ZONE 'America/Bogota')::date = p_fecha
    AND NOT anulado AND comprobante_id IS NULL AND valor > 0;

  IF v_ids IS NULL THEN RETURN jsonb_build_object('gastos', 0); END IF;

  SELECT jsonb_agg(m) INTO v_movs FROM (
    SELECT jsonb_build_object(
             'cuenta', c_gasto, 'tercero_nit', proveedor_nit, 'tercero_nombre', proveedor_nombre,
             'documento', numero_soporte, 'detalle', left(coalesce(concepto, categoria, 'Gasto Codec POS'), 200),
             'debito', valor - iva, 'credito', 0, 'base', valor - iva) AS m
    FROM pos_gastos WHERE id = ANY (v_ids)
    UNION ALL
    SELECT jsonb_build_object(
             'cuenta', c_iva, 'tercero_nit', proveedor_nit, 'tercero_nombre', proveedor_nombre,
             'documento', numero_soporte, 'detalle', 'IVA ' || left(coalesce(concepto, 'gasto'), 190),
             'debito', iva, 'credito', 0)
    FROM pos_gastos WHERE id = ANY (v_ids) AND iva > 0
    UNION ALL
    SELECT jsonb_build_object(
             'cuenta', CASE WHEN medio IN ('efectivo', 'cash') THEN c_caja ELSE c_bancos END,
             'detalle', 'Gastos Codec POS ' || p_fecha || ' (' || medio || ')', 'debito', 0, 'credito', valor)
    FROM (SELECT lower(coalesce(medio_pago, 'efectivo')) AS medio, sum(valor) AS valor
          FROM pos_gastos WHERE id = ANY (v_ids) GROUP BY 1) g
  ) x;

  v_res := public.cont_guardar_comprobante(
    p_empresa, 'CE', p_fecha, 'Gastos Codec POS del ' || p_fecha || ' (' || array_length(v_ids, 1) || ' gastos)',
    v_movs, 'pos', 'gastos:' || p_fecha || ':' || left(md5(array_to_string(v_ids, ',')), 12));

  UPDATE pos_gastos SET comprobante_id = (v_res ->> 'id')::uuid, updated_at = now() WHERE id = ANY (v_ids);
  RETURN v_res || jsonb_build_object('gastos', array_length(v_ids, 1));
END $$;
REVOKE ALL ON FUNCTION public.pos_contabilizar_gastos_dia(uuid, date, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pos_contabilizar_gastos_dia(uuid, date, jsonb) TO authenticated;
