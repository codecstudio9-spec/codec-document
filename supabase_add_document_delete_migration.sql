-- ============================================================
-- CODEC DOCUMENT — Permite borrar documentos (fila + archivos en Storage)
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- Hoy no existe ninguna forma de borrar un documento subido/firmado
-- (tabla `documents`, la que sí ocupa espacio real en Storage — PDFs
-- originales, firmados y las imágenes de firma). No hay política de
-- DELETE en la tabla ni en el bucket, así que aunque el cliente
-- intentara borrar, RLS lo bloquearía en silencio.
-- ============================================================

-- ─── PASO 1: permitir que el dueño borre su propia fila en documents ──
DROP POLICY IF EXISTS "documents_delete_own" ON public.documents;
CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ─── PASO 2: permitir borrar los archivos correspondientes en Storage ─
-- (documents-bucket ya permite INSERT/UPDATE de forma amplia para que
-- el flujo de invitado pueda subir su firma sin sesión — DELETE se deja
-- solo para usuarios autenticados, nunca para anónimos, para que un
-- invitado firmando no pueda borrar nada.)
DROP POLICY IF EXISTS "documents_bucket_delete_authenticated" ON storage.objects;
CREATE POLICY "documents_bucket_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents-bucket');

-- ─── PASO 3: verificación ──────────────────────────────────────────────
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'documents')
   OR (schemaname = 'storage' AND tablename = 'objects' AND policyname = 'documents_bucket_delete_authenticated')
ORDER BY tablename, cmd, policyname;
