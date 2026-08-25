-- Evidencia general del contrato de wedding-planner — PARTE 2 del pedido
-- del usuario (2026-08-25): además de los abonos (document_installments,
-- que exigen un monto en dinero), la planner y el cliente necesitan poder
-- subir CUALQUIER documento de seguimiento sobre un contrato ya firmado —
-- una captura de pantalla, un comprobante de pago, una foto del contrato
-- físico, etc. — sin que cada uno tenga que ser un abono con monto.
--
-- Mismo modelo de acceso que document_installments (ver el comentario
-- grande en 20260823150000_add_wedding_planner_installments.sql): quien
-- tiene el enlace de la transacción (`/sign/:id`) puede listar y subir,
-- sin login — el enlace ES la credencial para ambas partes. A diferencia
-- de los abonos, aquí NO hay flujo de aceptar/rechazar (no es dinero que
-- alguien deba aprobar), así que no hace falta una función que exija
-- auth.uid() — subir y listar es todo lo que existe.
--
-- Reutiliza el bucket "tx-evidence" (creado en la migración anterior),
-- bajo su propio prefijo `evidence/` para no mezclarse con los
-- comprobantes de abono (`installments/`).

CREATE TABLE IF NOT EXISTS public.document_evidence (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  uuid NOT NULL REFERENCES public.sign_transactions(id) ON DELETE CASCADE,
  tipo            text NOT NULL CHECK (tipo IN ('comprobante_pago', 'captura_pantalla', 'pagina_contrato', 'otro')),
  descripcion     text,
  archivo_path    text NOT NULL,
  archivo_nombre  text NOT NULL,
  subido_por      text NOT NULL CHECK (subido_por IN ('planner', 'cliente')),
  creado_en       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_evidence ENABLE ROW LEVEL SECURITY;
-- Sin política pública directa — todo pasa por las funciones SECURITY
-- DEFINER de abajo, igual que document_installments.

CREATE INDEX IF NOT EXISTS idx_document_evidence_tx ON public.document_evidence(transaction_id);

CREATE OR REPLACE FUNCTION public.list_document_evidence(p_transaction_id uuid)
RETURNS SETOF public.document_evidence
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.document_evidence
  WHERE transaction_id = p_transaction_id
  ORDER BY creado_en DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.list_document_evidence(uuid) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.create_document_evidence(
  p_transaction_id uuid,
  p_tipo text,
  p_descripcion text,
  p_archivo_path text,
  p_archivo_nombre text,
  p_subido_por text
)
RETURNS public.document_evidence
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row public.document_evidence;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sign_transactions WHERE id = p_transaction_id) THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;
  IF p_archivo_path IS NULL OR p_archivo_path = '' THEN
    RAISE EXCEPTION 'Missing file';
  END IF;

  INSERT INTO public.document_evidence (
    transaction_id, tipo, descripcion, archivo_path, archivo_nombre, subido_por
  ) VALUES (
    p_transaction_id, p_tipo, NULLIF(p_descripcion, ''), p_archivo_path, p_archivo_nombre, p_subido_por
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_document_evidence(uuid, text, text, text, text, text) TO authenticated, anon;

-- Cualquiera de las dos partes puede borrar un documento que subió por
-- error — a diferencia de los abonos, aquí no hay "revisado" que proteja:
-- es sólo un archivo de apoyo, no un registro de dinero aceptado.
CREATE OR REPLACE FUNCTION public.delete_document_evidence(p_evidence_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
BEGIN
  DELETE FROM public.document_evidence WHERE id = p_evidence_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_document_evidence(uuid) TO authenticated, anon;

-- Verificación
SELECT 'document_evidence' AS check, COUNT(*) FROM public.document_evidence;
