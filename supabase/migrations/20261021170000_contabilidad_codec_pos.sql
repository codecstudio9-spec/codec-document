-- Conexión Codec POS → Contabilidad (2026-10-21).
--
-- El contador genera un código por empresa; el dueño del negocio lo pega en
-- su Codec POS (Configuración > Mi contador) y con eso autoriza compartir sus
-- ventas. Codec POS (otro proyecto Supabase) manda desde su nube:
--   · factura_electronica  el XML firmado. Entra a la MISMA bandeja que el
--                          correo (ed_inbox_files) y lo lee el mismo motor;
--                          no hay un segundo lector de XML.
--   · venta                cada venta, con o sin factura, a pos_ventas
--   · anulacion            marca la venta como anulada
--
-- Seguridad:
--   · El código vence a los 7 días, sirve una vez y exige que el NIT del
--     negocio sea el de la empresa del contador.
--   · Al vincular, la función pos-vincular entrega un token que se muestra
--     una sola vez; aquí sólo se guarda su SHA-256.
--   · Todo lo de Codec POS entra por funciones con service_role; ninguna
--     política deja escribir estas tablas desde el navegador.

CREATE TABLE IF NOT EXISTS public.cont_pos_vinculos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id       uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  codigo           text UNIQUE,
  codigo_vence     timestamptz,
  estado           text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'activo', 'revocado')),
  token_hash       text UNIQUE,
  pos_cliente_id   text,
  nombre_negocio   text,
  vinculado_at     timestamptz,
  ultimo_envio_at  timestamptz,
  eventos_recibidos integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Una conexión viva (pendiente o activa) por empresa.
CREATE UNIQUE INDEX IF NOT EXISTS cont_pos_vinculos_empresa_viva_idx
  ON public.cont_pos_vinculos (empresa_id) WHERE estado <> 'revocado';

ALTER TABLE public.cont_pos_vinculos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cont_pos_vinculos_leer ON public.cont_pos_vinculos;
CREATE POLICY cont_pos_vinculos_leer ON public.cont_pos_vinculos FOR SELECT USING (owner_user_id = auth.uid());
-- Por columnas: el hash del token no tiene por qué llegar al navegador.
-- (Supabase da todos los permisos por defecto a las tablas nuevas; se quitan.)
REVOKE ALL ON public.cont_pos_vinculos FROM anon, authenticated;
GRANT SELECT (id, owner_user_id, empresa_id, codigo, codigo_vence, estado, pos_cliente_id, nombre_negocio,
              vinculado_at, ultimo_envio_at, eventos_recibidos, created_at, updated_at)
  ON public.cont_pos_vinculos TO authenticated;

CREATE TABLE IF NOT EXISTS public.pos_ventas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id        uuid NOT NULL REFERENCES public.fiscal_entities(id) ON DELETE CASCADE,
  vinculo_id        uuid REFERENCES public.cont_pos_vinculos(id) ON DELETE SET NULL,
  id_origen         text NOT NULL,
  numero            text,
  fecha             timestamptz NOT NULL,
  total             numeric(18,2) NOT NULL DEFAULT 0,
  subtotal          numeric(18,2) NOT NULL DEFAULT 0,
  iva               numeric(18,2) NOT NULL DEFAULT 0,
  descuento         numeric(18,2) NOT NULL DEFAULT 0,
  propina           numeric(18,2) NOT NULL DEFAULT 0,
  medio_pago        text,
  metodos_multiples jsonb,
  cajero            text,
  tienda            text,
  -- Si la venta tuvo factura electrónica: el XML entra aparte y se causa
  -- desde ahí. Con esto la venta no se cuenta dos veces.
  factura_cufe      text,
  items             jsonb NOT NULL DEFAULT '[]'::jsonb,
  anulada           boolean NOT NULL DEFAULT false,
  comprobante_id    uuid REFERENCES public.cont_comprobantes(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, id_origen)
);

CREATE INDEX IF NOT EXISTS pos_ventas_fecha_idx ON public.pos_ventas (empresa_id, fecha DESC);

ALTER TABLE public.pos_ventas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pos_ventas_leer ON public.pos_ventas;
CREATE POLICY pos_ventas_leer ON public.pos_ventas FOR SELECT USING (owner_user_id = auth.uid());
REVOKE ALL ON public.pos_ventas FROM anon, authenticated;
GRANT SELECT ON public.pos_ventas TO authenticated;

-- La bandeja dice de dónde vino cada archivo, y de qué empresa si fue del POS.
ALTER TABLE public.ed_inbox_files
  ADD COLUMN IF NOT EXISTS origen     text NOT NULL DEFAULT 'correo',
  ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

-- ── Contador: generar y quitar el código ───────────────────────────────

/** Código legible sin letras que se confundan (sin 0/O, 1/I/L). */
CREATE OR REPLACE FUNCTION public.cont_pos_codigo_nuevo()
RETURNS text
LANGUAGE plpgsql VOLATILE SET search_path = public AS $$
DECLARE
  alfabeto text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  bytes    bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  s        text := '';
BEGIN
  FOR i IN 0..7 LOOP
    s := s || substr(alfabeto, (get_byte(bytes, i) % length(alfabeto)) + 1, 1);
  END LOOP;
  RETURN 'CD-' || substr(s, 1, 4) || '-' || substr(s, 5, 4);
END $$;

CREATE OR REPLACE FUNCTION public.cont_pos_generar_codigo(p_empresa uuid)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_codigo text;
  v_vence  timestamptz := now() + interval '7 days';
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;
  IF NOT public.cont_acceso_activo() THEN RAISE EXCEPTION 'Tu plan de Contabilidad no está activo'; END IF;
  IF NOT EXISTS (SELECT 1 FROM fiscal_entities WHERE id = p_empresa AND owner_user_id = auth.uid() AND activo) THEN
    RAISE EXCEPTION 'Esa empresa no es tuya o está archivada';
  END IF;
  IF EXISTS (SELECT 1 FROM cont_pos_vinculos WHERE empresa_id = p_empresa AND estado = 'activo') THEN
    RAISE EXCEPTION 'Esta empresa ya está conectada con Codec POS';
  END IF;

  -- Un código nuevo anula el anterior que no se usó.
  UPDATE cont_pos_vinculos SET estado = 'revocado', codigo = NULL, updated_at = now()
  WHERE empresa_id = p_empresa AND estado = 'pendiente';

  LOOP
    v_codigo := public.cont_pos_codigo_nuevo();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM cont_pos_vinculos WHERE codigo = v_codigo);
  END LOOP;

  INSERT INTO cont_pos_vinculos (owner_user_id, empresa_id, codigo, codigo_vence)
  VALUES (auth.uid(), p_empresa, v_codigo, v_vence);

  RETURN jsonb_build_object('codigo', v_codigo, 'vence', v_vence);
END $$;
REVOKE ALL ON FUNCTION public.cont_pos_generar_codigo(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_pos_generar_codigo(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cont_pos_desconectar(p_empresa uuid)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE cont_pos_vinculos SET estado = 'revocado', codigo = NULL, updated_at = now()
  WHERE empresa_id = p_empresa AND owner_user_id = auth.uid() AND estado <> 'revocado';
END $$;
REVOKE ALL ON FUNCTION public.cont_pos_desconectar(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cont_pos_desconectar(uuid) TO authenticated;

-- ── Codec POS: vincular (sólo service_role, desde pos-vincular) ─────────

CREATE OR REPLACE FUNCTION public.pos_vincular(
  p_codigo text, p_nit text, p_nombre text, p_pos_cliente_id text, p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v        cont_pos_vinculos;
  v_nit    text;
  v_emp    text;
  v_cont   text;
BEGIN
  SELECT * INTO v FROM cont_pos_vinculos
  WHERE codigo = upper(trim(p_codigo)) AND estado = 'pendiente' FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'codigo_invalido'); END IF;
  IF v.codigo_vence < now() THEN RETURN jsonb_build_object('ok', false, 'error', 'codigo_vencido'); END IF;

  SELECT nit, coalesce(nombre_comercial, razon_social) INTO v_nit, v_emp FROM fiscal_entities WHERE id = v.empresa_id;
  -- El NIT puede venir con DV («1049796031-2»): se quita antes de comparar.
  IF regexp_replace(regexp_replace(coalesce(p_nit, ''), '-\s*[0-9]\s*$', ''), '[^0-9]', '', 'g') <> v_nit THEN
    RETURN jsonb_build_object('ok', false, 'error', 'nit_no_coincide');
  END IF;

  UPDATE cont_pos_vinculos
     SET estado = 'activo', codigo = NULL, token_hash = p_token_hash, pos_cliente_id = p_pos_cliente_id,
         nombre_negocio = p_nombre, vinculado_at = now(), updated_at = now()
   WHERE id = v.id;

  SELECT coalesce(raw_user_meta_data ->> 'name', raw_user_meta_data ->> 'full_name', email)
    INTO v_cont FROM auth.users WHERE id = v.owner_user_id;

  RETURN jsonb_build_object('ok', true, 'empresa', v_emp, 'contador', v_cont);
END $$;
REVOKE ALL ON FUNCTION public.pos_vincular(text, text, text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pos_vincular(text, text, text, text, text) TO service_role;

-- ── Avisos de ventas POS ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.pos_venta_avisar()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO cont_avisos (owner_user_id, empresa_id, tipo, fecha, cantidad, monto, detalle)
  VALUES (NEW.owner_user_id, NEW.empresa_id, 'pos_nuevos', current_date, 1, NEW.total, '{"ventas": 1}'::jsonb)
  ON CONFLICT (owner_user_id, empresa_id, tipo, fecha) DO UPDATE
    SET cantidad = cont_avisos.cantidad + 1,
        monto = cont_avisos.monto + excluded.monto,
        detalle = jsonb_build_object('ventas', coalesce((cont_avisos.detalle ->> 'ventas')::int, 0) + 1),
        leido = false,
        updated_at = now();
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS pos_venta_avisar ON public.pos_ventas;
CREATE TRIGGER pos_venta_avisar AFTER INSERT ON public.pos_ventas
  FOR EACH ROW EXECUTE FUNCTION public.pos_venta_avisar();

-- ── Comprobante de ventas del día (VP) ──────────────────────────────────
-- Las ventas sin factura electrónica de un día se vuelven un comprobante:
-- Db caja/bancos por medio de pago, Cr ingresos y Cr IVA generado. Las que
-- tienen factura se causan desde su XML.

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
  v_movs     jsonb;
  v_ids      uuid[];
  v_res      jsonb;
  v_iva      numeric;
  v_propina  numeric;
  v_total    numeric;
BEGIN
  SELECT array_agg(id), coalesce(sum(iva), 0), coalesce(sum(propina), 0), coalesce(sum(total), 0)
    INTO v_ids, v_iva, v_propina, v_total
  FROM pos_ventas
  WHERE empresa_id = p_empresa AND owner_user_id = auth.uid()
    AND (fecha AT TIME ZONE 'America/Bogota')::date = p_fecha
    AND NOT anulada AND factura_cufe IS NULL AND comprobante_id IS NULL;

  IF v_ids IS NULL THEN
    RETURN jsonb_build_object('ventas', 0);
  END IF;

  -- Débitos por medio de pago: efectivo a caja, el resto a bancos.
  SELECT jsonb_agg(jsonb_build_object(
           'cuenta', CASE WHEN medio IN ('efectivo', 'cash') THEN c_caja ELSE c_bancos END,
           'detalle', 'Ventas Codec POS ' || p_fecha || ' (' || medio || ')',
           'debito', valor, 'credito', 0))
    INTO v_movs
  FROM (
    SELECT lower(coalesce(medio_pago, 'efectivo')) AS medio, sum(total) AS valor
    FROM pos_ventas WHERE id = ANY (v_ids) GROUP BY 1
  ) m;

  v_movs := v_movs || jsonb_build_array(jsonb_build_object(
    'cuenta', c_ingresos, 'detalle', 'Ventas Codec POS ' || p_fecha,
    'debito', 0, 'credito', v_total - v_iva - v_propina, 'base', v_total - v_iva - v_propina));
  IF v_iva > 0 THEN
    v_movs := v_movs || jsonb_build_array(jsonb_build_object(
      'cuenta', c_iva, 'detalle', 'IVA ventas Codec POS ' || p_fecha, 'debito', 0, 'credito', v_iva));
  END IF;
  IF v_propina > 0 THEN
    v_movs := v_movs || jsonb_build_array(jsonb_build_object(
      'cuenta', c_propina, 'detalle', 'Propinas Codec POS ' || p_fecha, 'debito', 0, 'credito', v_propina));
  END IF;

  v_res := public.cont_guardar_comprobante(
    p_empresa, 'VP', p_fecha, 'Ventas Codec POS del ' || p_fecha || ' (' || array_length(v_ids, 1) || ' ventas)',
    v_movs, 'pos', 'dia:' || p_fecha);

  UPDATE pos_ventas SET comprobante_id = (v_res ->> 'id')::uuid, updated_at = now() WHERE id = ANY (v_ids);

  RETURN v_res || jsonb_build_object('ventas', array_length(v_ids, 1));
END $$;
REVOKE ALL ON FUNCTION public.pos_contabilizar_dia(uuid, date, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.pos_contabilizar_dia(uuid, date, jsonb) TO authenticated;

-- pos_contabilizar_dia es INVOKER: necesita poder marcar las ventas.
DROP POLICY IF EXISTS pos_ventas_marcar ON public.pos_ventas;
CREATE POLICY pos_ventas_marcar ON public.pos_ventas FOR UPDATE
  USING (owner_user_id = auth.uid() AND public.cont_acceso_activo())
  WITH CHECK (owner_user_id = auth.uid());
GRANT UPDATE (comprobante_id, updated_at) ON public.pos_ventas TO authenticated;
