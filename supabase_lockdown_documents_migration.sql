-- ============================================================
-- CODEC DOCUMENT — Cierre de exposición pública de la tabla `documents`
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- PROBLEMA (confirmado en vivo, sin ninguna sesión, solo con la anon key):
--   GET /rest/v1/documents?select=id,name,status,original_pdf_url,signed_pdf_url
--   → devolvió filas reales: nombre, estado y URLs directas de descarga
--     de PDFs originales y firmados de documentos de otras personas.
-- Causa: la política "Permitir lectura publica de documentos enlazados"
-- (SELECT → public) en la tabla `documents` no tiene ningún filtro por
-- dueño. Es el mismo problema que ya se cerró en signing_links/signers/
-- signatures/sign_transactions vía supabase_lockdown_public_read_migration.sql
-- — a esa tabla simplemente se le olvidó aplicar el mismo cierre.
--
-- El flujo de invitado (firmar por link, /sign/:token) YA NO necesita
-- lectura pública de `documents`: pasa por verify_signing_link(), una
-- función SECURITY DEFINER que ya existe y ya se usa en producción
-- (ver src/lib/signatureService.ts → verifySigningTokenPublic). Esta
-- migración solo cierra el acceso directo a la tabla que ya no hace
-- falta, sin tocar esa función ni el flujo de invitado.
-- ============================================================

-- ── 1. Tabla que faltaba para "documentos que firmé como invitado en
--       un documento de otra persona" (ver documents-service.ts) ──────
CREATE TABLE IF NOT EXISTS public.profile_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id   uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  role          text NOT NULL DEFAULT 'signer',
  associated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_documents_own" ON public.profile_documents;
CREATE POLICY "profile_documents_own" ON public.profile_documents
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- ── 2. Revocar las políticas actuales de `documents` (exactamente los
--       nombres reportados por el dashboard — DROP IF EXISTS no falla
--       si alguno ya no existe o el nombre difiere ligeramente) ──────
DROP POLICY IF EXISTS "Permitir insercion a usuarios autenticados"        ON public.documents;
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados"          ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents"                     ON public.documents;
DROP POLICY IF EXISTS "UPDATE"                                           ON public.documents;
DROP POLICY IF EXISTS "Permitir lectura publica de documentos enlazados" ON public.documents;
DROP POLICY IF EXISTS "INSERT"                                           ON public.documents;

-- ── 3. SELECT: solo el dueño (o quien esté enlazado como firmante vía
--       profile_documents) puede leer sus propios documentos. El acceso
--       de invitado sigue funcionando igual, vía verify_signing_link(). ──
CREATE POLICY "documents_select_own_or_linked" ON public.documents
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profile_documents pd
      WHERE pd.document_id = documents.id AND pd.profile_id = auth.uid()
    )
  );

-- ── 4. INSERT: un usuario autenticado solo puede crear documentos a su
--       propio nombre; una subida anónima (sin login, antes de firmar)
--       solo puede crear con user_id NULL — nunca puede hacerse pasar
--       por otro usuario real. Cubre createDocumentRecord() en
--       src/lib/signatureService.ts, que hoy inserta con user_id nulo
--       para invitados. ──────────────────────────────────────────────
CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- ── 5. UPDATE: el flujo de invitado (guest-sign-page.tsx) actualiza
--       signed_pdf_url + status conociendo el id exacto del documento
--       (el token ya se verificó antes vía RPC). Se restringe a
--       documentos todavía "pending" para que un documento ya completado
--       no pueda ser modificado de nuevo por un anónimo. Las escrituras
--       del dueño autenticado (updateDocumentPdfUrl / finalizeDocument)
--       ya pasan por sus propias RPC SECURITY DEFINER y no dependen de
--       esta política. ──────────────────────────────────────────────
CREATE POLICY "documents_update_pending" ON public.documents
  FOR UPDATE TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (true);
