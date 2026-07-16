-- ============================================================
-- CODEC DOCUMENT — Cierre de exposición pública de la tabla `documents`
-- Ejecutar en Supabase Dashboard → SQL Editor, UN PASO A LA VEZ (selecciona
-- solo el bloque de un paso, dale "Run", confirma que no dio error, y
-- recién ahí pasa al siguiente). Si algún paso da error, copia el mensaje
-- de error exacto — con eso se corrige rápido, sin adivinar.
--
-- Está escrito para ser seguro de ejecutar varias veces (usa
-- "IF EXISTS"/"IF NOT EXISTS" en todo), así que si ya corriste una
-- versión anterior de este script y quedó a medias, simplemente vuelve
-- a correr los 4 pasos completos desde el principio — no rompe nada.
--
-- PROBLEMA (confirmado en vivo, sin ninguna sesión, solo con la anon key):
--   GET /rest/v1/documents?select=id,name,status,original_pdf_url,signed_pdf_url
--   → devolvió filas reales: nombre, estado y URLs directas de descarga
--     de PDFs originales y firmados de documentos de otras personas.
-- El flujo de invitado (firmar por link) no depende de esta tabla siendo
-- pública: ya pasa por verify_signing_link(), una función SECURITY
-- DEFINER que ya existe y funciona en producción.
-- ============================================================


-- ─── PASO 1: tabla profile_documents ───────────────────────────────────
-- (sin foreign keys — solo para evitar que un problema de constraint
-- bloquee este paso; la relación ya la controla la aplicación)
CREATE TABLE IF NOT EXISTS public.profile_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL,
  document_id   uuid NOT NULL,
  role          text NOT NULL DEFAULT 'signer',
  associated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_documents_own" ON public.profile_documents;
CREATE POLICY "profile_documents_own" ON public.profile_documents
  FOR ALL TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);


-- ─── PASO 2: eliminar TODAS las políticas actuales de documents ───────
-- (las viejas del dashboard + las nuevas, por si un intento anterior de
-- este mismo script ya alcanzó a crear alguna — así este paso nunca
-- falla por "ya existe")
DROP POLICY IF EXISTS "Permitir insercion a usuarios autenticados"        ON public.documents;
DROP POLICY IF EXISTS "Permitir lectura a usuarios autenticados"          ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents"                     ON public.documents;
DROP POLICY IF EXISTS "UPDATE"                                           ON public.documents;
DROP POLICY IF EXISTS "Permitir lectura publica de documentos enlazados" ON public.documents;
DROP POLICY IF EXISTS "INSERT"                                           ON public.documents;
DROP POLICY IF EXISTS "documents_select_own_or_linked"                  ON public.documents;
DROP POLICY IF EXISTS "documents_insert"                                ON public.documents;
DROP POLICY IF EXISTS "documents_update_pending"                        ON public.documents;


-- ─── PASO 3: crear las 3 políticas correctas ───────────────────────────
-- SELECT: solo el dueño, o quien esté enlazado como firmante vía
-- profile_documents. El acceso de invitado sigue igual (verify_signing_link).
CREATE POLICY "documents_select_own_or_linked" ON public.documents
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profile_documents pd
      WHERE pd.document_id = documents.id AND pd.profile_id = auth.uid()
    )
  );

-- INSERT: un usuario autenticado solo puede crear documentos a su propio
-- nombre; una subida anónima (antes de login) solo con user_id NULL —
-- nunca puede hacerse pasar por otro usuario real.
CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- UPDATE: el flujo de invitado (guest-sign-page.tsx) actualiza
-- signed_pdf_url + status conociendo el id exacto del documento (el
-- token ya se verificó antes vía RPC). Restringido a documentos aún
-- "pending" para que uno ya completado no se pueda volver a modificar.
CREATE POLICY "documents_update_pending" ON public.documents
  FOR UPDATE TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (true);


-- ─── PASO 4: verificación — debe mostrar exactamente 3 filas ──────────
select
  policyname    as policy_name,
  cmd           as command,
  roles::text   as roles,
  qual          as using_expression,
  with_check    as with_check_expression
from pg_policies
where schemaname = 'public' and tablename = 'documents'
order by cmd, policyname;
