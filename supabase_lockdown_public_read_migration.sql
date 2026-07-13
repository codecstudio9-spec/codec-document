-- ============================================================
-- CODEC DOCUMENT — Cierre de exposición pública de datos (PII/biométricos)
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- PROBLEMA: supabase_rls_migration.sql dejó políticas SELECT con
-- `USING (true)` en signing_links, signers, signatures y audit_logs.
-- Y sign_transactions (creada manualmente, ver sign-transaction-service.ts)
-- tiene la misma política `USING (true)`, incluyendo columnas
-- recipient_selfie / recipient_id_photo (selfie + foto de cédula).
-- Como la anon key de Supabase va en el bundle público, CUALQUIERA
-- puede hacer `supabase.from('signatures').select('*')` (sin filtro)
-- y leer nombres, emails, IPs, firmas y biometría de TODA la plataforma,
-- no solo su propio documento.
--
-- SOLUCIÓN: quitar el SELECT público de las tablas y mover el acceso
-- "de invitado, solo si conoces el token/id" a funciones RPC
-- SECURITY DEFINER que devuelven una sola fila para el id/token
-- exacto que se pasa como parámetro — nunca listan la tabla completa.
-- ============================================================

-- ── 1. Revocar el SELECT público en las tablas de firma ──────
DROP POLICY IF EXISTS "anon_read_signing_links" ON public.signing_links;
DROP POLICY IF EXISTS "anon_read_signers"       ON public.signers;
DROP POLICY IF EXISTS "owner_read_signatures"   ON public.signatures;
DROP POLICY IF EXISTS "owner_read_audit_logs"   ON public.audit_logs;

-- (Las políticas de INSERT/UPDATE anónimas se mantienen: el flujo de
-- invitado necesita poder insertar su firma y actualizar su estado
-- conociendo el id correspondiente.)

-- ── 2. RPC: verificar un signing_link por token (reemplaza el SELECT directo) ──
CREATE OR REPLACE FUNCTION public.verify_signing_link(p_token text)
RETURNS TABLE (
  document_id       uuid,
  signer_id         uuid,
  expires_at        timestamptz,
  doc_name          text,
  original_pdf_url  text,
  signed_pdf_url    text,
  doc_status        text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    sl.document_id,
    sl.signer_id,
    sl.expires_at,
    d.name,
    d.original_pdf_url,
    d.signed_pdf_url,
    d.status
  FROM public.signing_links sl
  JOIN public.documents d ON d.id = sl.document_id
  WHERE sl.token::text = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_signing_link(text) TO anon, authenticated;

-- ── 3. RPC: leer las firmas de un documento concreto (por id conocido) ──
CREATE OR REPLACE FUNCTION public.get_document_signatures(p_document_id uuid)
RETURNS TABLE (
  signature_url text,
  signer_email  text,
  signer_name   text,
  signed_at     timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT signature_url, signer_email, signer_name, signed_at
  FROM public.signatures
  WHERE document_id = p_document_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_document_signatures(uuid) TO anon, authenticated;

-- ── 4. sign_transactions: mismo problema, incluye selfie + foto de cédula ──
DROP POLICY IF EXISTS "tx_select" ON public.sign_transactions;

-- El creador autenticado sí puede listar/leer sus propias transacciones
-- directamente (para "mis documentos enviados a firmar", etc.)
DO $$ BEGIN
  CREATE POLICY "tx_select_own" ON public.sign_transactions
    FOR SELECT TO authenticated
    USING (auth.uid()::text = creator_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- El acceso de invitado (por id conocido en la URL /sign/:id) pasa por RPC.
CREATE OR REPLACE FUNCTION public.get_sign_transaction_public(p_id uuid)
RETURNS public.sign_transactions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT * FROM public.sign_transactions WHERE id = p_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_sign_transaction_public(uuid) TO anon, authenticated;
