-- El bucket "tx-evidence" está documentado desde hace tiempo en
-- sign-transaction-page.tsx como "opcional pero recomendado, crear a mano
-- en el dashboard" — nunca se creó (confirmado: `supabase storage ls`
-- sólo lista documents/, signed-documents/, signatures/, documents-bucket/,
-- fiscal-documents/). document-installments-service.ts ya lo usa para los
-- comprobantes de abono y no tiene ningún fallback si falta, así que se
-- crea aquí por SQL en vez de dejarlo como paso manual que alguien podría
-- olvidar.
--
-- Privado (no marcado Public) a propósito: el servicio sólo pide
-- createSignedUrl(), nunca getPublicUrl(), así que no hace falta exponer el
-- bucket entero — cada URL firmada expira sola (3600s, ver
-- getComprobanteUrl). SELECT+INSERT abiertos porque el modelo de acceso de
-- toda esta zona es "quien tiene el enlace de la transacción", igual que
-- sign_transactions — ver el comentario grande al inicio de
-- 20260823150000_add_wedding_planner_installments.sql.

INSERT INTO storage.buckets (id, name, public)
VALUES ('tx-evidence', 'tx-evidence', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "tx_evidence_insert" ON storage.objects;
CREATE POLICY "tx_evidence_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'tx-evidence');

DROP POLICY IF EXISTS "tx_evidence_select" ON storage.objects;
CREATE POLICY "tx_evidence_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'tx-evidence');

-- Verificación
SELECT id, public FROM storage.buckets WHERE id = 'tx-evidence';
