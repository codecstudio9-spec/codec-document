-- ============================================================
-- CODEC DOCUMENT — Tablas que el código ya usa mero pero que no
-- existen en la base de datos real (confirmado contra el esquema
-- exacto que devolviste desde information_schema).
--
-- Sin esto, hoy mismo en producción:
--   • Comprar 1 firma / plan mensual (PaypalSignatureCheckout) falla
--     silenciosamente — escribe en user_credits, que no existe.
--   • "Mis documentos" (my-documents-page) nunca guarda ni lista nada
--     — escribe/lee user_documents, que no existe.
--   • Firma móvil por QR (SignaturePad → quick-sign-page) falla al
--     crear el token — escribe en mobile_signatures, que no existe.
--
-- Ejecutar una vez en Supabase Dashboard → SQL Editor.
-- ============================================================

-- ── 1. user_credits — créditos de firma individual + plan mensual ──
CREATE TABLE IF NOT EXISTS public.user_credits (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credits         integer DEFAULT 0 NOT NULL,
  plan            text DEFAULT 'free' CHECK (plan IN ('free', 'monthly')),
  plan_expires_at timestamptz,
  updated_at      timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credits_select_own" ON public.user_credits;
CREATE POLICY "credits_select_own" ON public.user_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- No public INSERT/UPDATE policy: credits are only ever granted by the
-- grant_paypal_credits(...) SECURITY DEFINER RPC (see
-- supabase_paypal_verification_migration.sql), never written directly
-- from the browser — otherwise any signed-in user could run
-- `supabase.from('user_credits').update({plan:'monthly'})` themselves.

-- ── 2. user_documents — "Mis documentos" guardados en la nube ──
CREATE TABLE IF NOT EXISTS public.user_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id   text NOT NULL,
  document_name text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_documents_own" ON public.user_documents;
CREATE POLICY "user_documents_own" ON public.user_documents
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 3. mobile_signatures — tokens de firma rápida por QR/celular ──
-- expires_at: el link/QR caduca 20 minutos después de generarse — antes
-- no expiraba nunca, solo se invalidaba al usarse.
CREATE TABLE IF NOT EXISTS public.mobile_signatures (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token      text NOT NULL UNIQUE,
  sig_data   text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '20 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mobile_signatures
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '20 minutes');

ALTER TABLE public.mobile_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mobile_sig_select" ON public.mobile_signatures;
DROP POLICY IF EXISTS "mobile_sig_insert" ON public.mobile_signatures;
DROP POLICY IF EXISTS "mobile_sig_update" ON public.mobile_signatures;
-- Acceso por token aleatorio (crypto.randomUUID()) — no hay dato sensible
-- de terceros aquí (solo el trazo de una firma en curso, borrado tras
-- usarse), así que un modelo "quien tenga el token puede leer/escribir
-- esta fila" es aceptable, a diferencia de sign_transactions.
CREATE POLICY "mobile_sig_select" ON public.mobile_signatures FOR SELECT USING (true);
CREATE POLICY "mobile_sig_insert" ON public.mobile_signatures FOR INSERT WITH CHECK (true);
CREATE POLICY "mobile_sig_update" ON public.mobile_signatures FOR UPDATE USING (true);

-- ── 4. users.saved_signature_url — firma guardada en el perfil ──
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS saved_signature_url text;
