-- Bucket privado para documentos/firmas NUEVOS (PDFs originales, PDFs
-- firmados, imágenes de firma, evidencia de identidad/selfie del guest-sign).
-- Ver memoria [[project_security_audit_enterprise_readiness]]: documents-bucket
-- es público desde su creación — cualquiera con la ruta de un objeto (UUID,
-- no enumerable, pero tampoco protegida) puede descargarlo sin autenticación.
--
-- Se crea un bucket NUEVO en vez de voltear el flag "Public" del existente:
-- documentos ya firmados y enviados por email siguen apuntando a URLs
-- "public" de documents-bucket — voltear ese flag las rompería de inmediato
-- para cualquier consumidor que no pase por getSignedUrlFallback(). Solo las
-- subidas NUEVAS (a partir de este cambio) usan este bucket; lo ya subido se
-- deja tal cual — limitación de alcance deliberada, no un olvido.
--
-- Mismo modelo de seguridad que tx-evidence / sign_transactions (ver
-- 20260823153000_create_tx_evidence_bucket.sql): no es RLS-por-dueño, sino
-- ruta UUID no adivinable + URL firmada con vencimiento. Los permisos
-- abiertos (sin filtrar por auth.uid()) replican exactamente lo que ya tenía
-- documents-bucket — ver supabase_add_document_delete_migration.sql:
-- "documents-bucket ya permite INSERT/UPDATE de forma amplia para que el
-- flujo de invitado pueda subir su firma sin sesión" — incluyendo DELETE
-- restringido a usuarios autenticados únicamente.

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents-private', 'documents-private', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "documents_private_insert" ON storage.objects;
CREATE POLICY "documents_private_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'documents-private');

DROP POLICY IF EXISTS "documents_private_select" ON storage.objects;
CREATE POLICY "documents_private_select" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'documents-private');

DROP POLICY IF EXISTS "documents_private_update" ON storage.objects;
CREATE POLICY "documents_private_update" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'documents-private')
  WITH CHECK (bucket_id = 'documents-private');

DROP POLICY IF EXISTS "documents_private_delete_authenticated" ON storage.objects;
CREATE POLICY "documents_private_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents-private');

-- Verificación
SELECT id, public FROM storage.buckets WHERE id = 'documents-private';
