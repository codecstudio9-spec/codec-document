-- Abonos (installment payments) for the wedding-planner contract — PARTE 1
-- del pedido del usuario (2026-08-23): el cliente sube el comprobante de
-- cada abono, la planner lo revisa y puede subir su propio comprobante al
-- aceptarlo o rechazarlo.
--
-- Anclado a sign_transactions.id (no a `documents`), porque un contrato de
-- wedding-planner enviado a firmar vive en sign_transactions — ver
-- sign-transaction-service.ts / sign-transaction-page.tsx. Esa tabla ya
-- tiene su modelo de acceso: quien tiene el enlace (`/sign/:id`) puede
-- leerla vía get_sign_transaction_public(uuid), sin login — el enlace ES la
-- credencial, tanto para la planner como para quien firma. Se sigue el
-- MISMO modelo aquí para listar/crear abonos (cualquiera con el enlace
-- puede ver los abonos y subir su comprobante de cliente), pero NO para
-- aceptar/rechazar: esa acción sólo puede hacerla quien esté autenticado
-- como el creator_id real de la transacción — si cualquiera con el enlace
-- pudiera aceptar, un cliente podría auto-aprobarse su propio pago.
--
-- Los archivos de comprobante van al bucket "tx-evidence" (ya documentado
-- en sign-transaction-page.tsx: crear a mano en el dashboard de Supabase,
-- público, con políticas SELECT+INSERT en USING(true) — no se crea por SQL
-- porque el "público"/CORS de un bucket son ajustes del dashboard, no algo
-- que una migración pueda fijar de forma fiable). Esta migración sólo
-- guarda la RUTA dentro de ese bucket, nunca el archivo.

CREATE TABLE IF NOT EXISTS public.document_installments (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id            uuid NOT NULL REFERENCES public.sign_transactions(id) ON DELETE CASCADE,
  numero                    int NOT NULL,
  descripcion               text,
  monto                     numeric NOT NULL CHECK (monto > 0),
  moneda                    text NOT NULL DEFAULT 'COP',
  estado                    text NOT NULL DEFAULT 'pendiente_revision'
                              CHECK (estado IN ('pendiente_revision', 'aceptado', 'rechazado')),
  comprobante_cliente_path  text,
  comprobante_cliente_nombre text,
  subido_por_cliente_en     timestamptz,
  comprobante_planner_path  text,
  comprobante_planner_nombre text,
  motivo_rechazo            text,
  revisado_en               timestamptz,
  creado_en                 timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_installments ENABLE ROW LEVEL SECURITY;
-- Sin política pública de SELECT/INSERT/UPDATE — todo pasa por las
-- funciones SECURITY DEFINER de abajo, igual que sign_transactions (ver
-- supabase_lockdown_public_read_migration.sql). Así "aceptar" puede exigir
-- ser el creator_id real aunque "ver"/"subir" no lo exijan.

CREATE INDEX IF NOT EXISTS idx_document_installments_tx ON public.document_installments(transaction_id);

-- Cualquiera con el enlace del contrato puede ver sus abonos — mismo modelo
-- que get_sign_transaction_public. No expone nada de otras transacciones.
CREATE OR REPLACE FUNCTION public.list_document_installments(p_transaction_id uuid)
RETURNS SETOF public.document_installments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.document_installments
  WHERE transaction_id = p_transaction_id
  ORDER BY numero ASC, creado_en ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_document_installments(uuid) TO authenticated, anon;

-- El cliente (o la planner) registra un abono con su propio comprobante ya
-- subido a Storage — el path llega hecho, esta función sólo valida que la
-- transacción exista y calcula el siguiente número si no se indica.
CREATE OR REPLACE FUNCTION public.create_document_installment(
  p_transaction_id uuid,
  p_descripcion text,
  p_monto numeric,
  p_moneda text,
  p_comprobante_path text,
  p_comprobante_nombre text
)
RETURNS public.document_installments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.document_installments;
  v_siguiente int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sign_transactions WHERE id = p_transaction_id) THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  IF p_monto IS NULL OR p_monto <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  SELECT COALESCE(MAX(numero), 0) + 1 INTO v_siguiente
  FROM public.document_installments WHERE transaction_id = p_transaction_id;

  INSERT INTO public.document_installments (
    transaction_id, numero, descripcion, monto, moneda,
    comprobante_cliente_path, comprobante_cliente_nombre, subido_por_cliente_en
  ) VALUES (
    p_transaction_id, v_siguiente, p_descripcion, p_monto, COALESCE(NULLIF(p_moneda, ''), 'COP'),
    p_comprobante_path, p_comprobante_nombre, now()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_document_installment(uuid, text, numeric, text, text, text) TO authenticated, anon;

-- Adjunta (o reemplaza) el comprobante del CLIENTE a un abono ya creado.
-- Mismo modelo de confianza que create_document_installment: conocer el id
-- del abono ya implica haber podido listar los abonos de esa transacción,
-- así que no hace falta auth.uid() aquí — a propósito distinto de
-- review_document_installment, que sí lo exige.
CREATE OR REPLACE FUNCTION public.attach_client_installment_proof(
  p_installment_id uuid,
  p_comprobante_path text,
  p_comprobante_nombre text
)
RETURNS public.document_installments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.document_installments;
BEGIN
  UPDATE public.document_installments SET
    comprobante_cliente_path = p_comprobante_path,
    comprobante_cliente_nombre = p_comprobante_nombre,
    subido_por_cliente_en = now()
  WHERE id = p_installment_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Installment not found'; END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.attach_client_installment_proof(uuid, text, text) TO authenticated, anon;

-- SÓLO quien está autenticado como el creator_id real de la transacción
-- puede aceptar/rechazar — a propósito distinto de las dos funciones de
-- arriba. Sin este chequeo, el propio cliente (que también tiene el
-- enlace) podría auto-aprobarse su pago.
CREATE OR REPLACE FUNCTION public.review_document_installment(
  p_installment_id uuid,
  p_aceptar boolean,
  p_comprobante_planner_path text,
  p_comprobante_planner_nombre text,
  p_motivo_rechazo text
)
RETURNS public.document_installments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tx_id uuid;
  v_creator_id text;
  v_row public.document_installments;
BEGIN
  SELECT transaction_id INTO v_tx_id FROM public.document_installments WHERE id = p_installment_id;
  IF v_tx_id IS NULL THEN RAISE EXCEPTION 'Installment not found'; END IF;

  SELECT creator_id INTO v_creator_id FROM public.sign_transactions WHERE id = v_tx_id;
  IF v_creator_id IS NULL OR auth.uid() IS NULL OR v_creator_id <> auth.uid()::text THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.document_installments SET
    estado = CASE WHEN p_aceptar THEN 'aceptado' ELSE 'rechazado' END,
    comprobante_planner_path = COALESCE(p_comprobante_planner_path, comprobante_planner_path),
    comprobante_planner_nombre = COALESCE(p_comprobante_planner_nombre, comprobante_planner_nombre),
    motivo_rechazo = CASE WHEN p_aceptar THEN NULL ELSE p_motivo_rechazo END,
    revisado_en = now()
  WHERE id = p_installment_id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.review_document_installment(uuid, boolean, text, text, text) TO authenticated;

-- Cualquiera de las dos partes puede borrar un abono que quedó mal
-- registrado ANTES de que la planner lo revise — después de revisado
-- (aceptado o rechazado) queda como registro fijo, no se borra.
CREATE OR REPLACE FUNCTION public.delete_pending_installment(p_installment_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
BEGIN
  DELETE FROM public.document_installments
  WHERE id = p_installment_id AND estado = 'pendiente_revision';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_pending_installment(uuid) TO authenticated, anon;

-- Verificación
SELECT 'document_installments' AS check, COUNT(*) FROM public.document_installments;
