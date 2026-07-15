-- ============================================================
-- CODEC DOCUMENT — SCRIPT MAESTRO DE PUESTA AL DÍA
-- Ejecutar UNA SOLA VEZ, completo, en el proyecto REAL:
--   https://yxzchnldmfsgdtbjurey.supabase.co  (Dashboard → SQL Editor)
--
-- CONTEXTO: los últimos ~4 archivos de migración de este repo
-- (supabase_lockdown_public_read_migration.sql,
--  supabase_fix_tx_complete_rpc_migration.sql,
--  supabase_signature_72h_migration.sql,
--  supabase_guest_dashboard_anon_migration.sql,
--  supabase_unify_72h_limits_migration.sql)
-- se ejecutaron por error contra OTRO proyecto de Supabase (uno con
-- tablas de una app de bodas: invitados, rsvps, wedding_config, etc.).
-- El proyecto real de Codec Document nunca los recibió. Este script
-- consolida TODOS en uno solo, usando los nombres EXACTOS de las
-- políticas que ya existen en el proyecto real (confirmado contra tu
-- reporte de information_schema), para poder hacer DROP POLICY
-- correctamente. Es 100% idempotente — se puede correr más de una vez
-- sin romper nada.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- PARTE A — Cerrar exposición pública de PII/biometría
-- (signing_links, signers, signatures traían políticas heredadas
-- "Usando: true" que dejan leer/escribir TODO desde el anon key
-- público del bundle — cualquiera podía listar todos los tokens de
-- firma o todas las firmas de toda la plataforma).
-- ════════════════════════════════════════════════════════════

-- signing_links: hoy cualquiera puede leer TODOS los enlaces de firma
-- (token, document_id) sin conocer ninguno de antemano.
DROP POLICY IF EXISTS "Permitir lectura publica de enlaces por token" ON public.signing_links;
DROP POLICY IF EXISTS "Acceso total a signing_links" ON public.signing_links;

-- signers: hoy cualquiera puede leer/escribir/borrar CUALQUIER fila.
DROP POLICY IF EXISTS "Acceso total a signers" ON public.signers;

-- signatures: hoy cualquiera puede leer TODAS las firmas de todos los
-- documentos (nombre, email, IP, imagen de firma) de toda la plataforma.
DROP POLICY IF EXISTS "Permitir lectura en signatures" ON public.signatures;

-- audit_logs: puede que ni tenga RLS habilitado todavía.
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- El acceso "de invitado, solo si conoces el token/id" para las 4 tablas
-- de arriba pasa ahora exclusivamente por funciones RPC SECURITY DEFINER
-- (devuelven una sola fila para el token/id exacto — nunca listan todo).

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
  SELECT sl.document_id, sl.signer_id, sl.expires_at,
         d.name, d.original_pdf_url, d.signed_pdf_url, d.status
  FROM public.signing_links sl
  JOIN public.documents d ON d.id = sl.document_id
  WHERE sl.token::text = p_token
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_signing_link(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_document_signatures(p_document_id uuid)
RETURNS TABLE (signature_url text, signer_email text, signer_name text, signed_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT signature_url, signer_email, signer_name, signed_at
  FROM public.signatures WHERE document_id = p_document_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_document_signatures(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_sign_transaction_public(p_id uuid)
RETURNS public.sign_transactions
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT * FROM public.sign_transactions WHERE id = p_id LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_sign_transaction_public(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_signer(p_document_id uuid, p_name text, p_email text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.signers (document_id, name, email, status)
  VALUES (p_document_id, p_name, p_email, 'pending')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_signer(uuid, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.try_complete_signer_once(p_signer_id uuid, p_from_status text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE public.signers SET status = 'completed'
  WHERE id = p_signer_id AND status = p_from_status;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_complete_signer_once(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_sign_transaction(p_payload jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.sign_transactions (
    creator_id, document_type, document_data, intent, security_config,
    status, sender_signature
  ) VALUES (
    p_payload->>'creator_id', p_payload->>'document_type',
    COALESCE(p_payload->'document_data', '{}'::jsonb), p_payload->>'intent',
    COALESCE(p_payload->'security_config', '{}'::jsonb),
    COALESCE(p_payload->>'status', 'pending'), p_payload->>'sender_signature'
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_sign_transaction(jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.complete_sign_transaction(
  p_id uuid, p_expected_status text, p_payload jsonb
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE public.sign_transactions
  SET status = COALESCE(p_payload->>'status', status),
      recipient_signature = COALESCE(p_payload->>'recipient_signature', recipient_signature),
      recipient_selfie = COALESCE(p_payload->>'recipient_selfie', recipient_selfie),
      recipient_id_photo = COALESCE(p_payload->>'recipient_id_photo', recipient_id_photo),
      recipient_ip = COALESCE(p_payload->>'recipient_ip', recipient_ip),
      esign_consent_accepted = COALESCE((p_payload->>'esign_consent_accepted')::boolean, esign_consent_accepted),
      signed_at = COALESCE((p_payload->>'signed_at')::timestamptz, signed_at)
  WHERE id = p_id AND status = p_expected_status;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.complete_sign_transaction(uuid, text, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.patch_sign_transaction_evidence(p_id uuid, p_payload jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.sign_transactions
  SET recipient_selfie = COALESCE(p_payload->>'recipient_selfie', recipient_selfie),
      recipient_id_photo = COALESCE(p_payload->>'recipient_id_photo', recipient_id_photo)
  WHERE id = p_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.patch_sign_transaction_evidence(uuid, jsonb) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- PARTE B — document_invitations + profile_documents
-- (NO EXISTEN todavía en este proyecto — se crean desde cero con el
-- esquema exacto que definiste).
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.document_invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  guest_email text NOT NULL,
  guest_name  text,
  token       text NOT NULL UNIQUE,
  status      text DEFAULT 'pending',
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);
ALTER TABLE public.document_invitations ENABLE ROW LEVEL SECURITY;
-- Sin políticas de cliente: solo se escribe/lee vía las RPCs de abajo,
-- para no repetir el mismo hueco de "SELECT true" que tenían
-- signing_links/signers/signatures.

CREATE OR REPLACE FUNCTION public.record_document_invitation(
  p_document_id uuid, p_guest_email text, p_guest_name text,
  p_token text, p_expires_at timestamptz
)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO public.document_invitations
    (document_id, guest_email, guest_name, token, status, expires_at)
  VALUES (p_document_id, p_guest_email, p_guest_name, p_token, 'pending', p_expires_at);
$$;
GRANT EXECUTE ON FUNCTION public.record_document_invitation(uuid, text, text, text, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_document_invitation_signed(p_token text)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  UPDATE public.document_invitations SET status = 'signed' WHERE token = p_token;
$$;
GRANT EXECUTE ON FUNCTION public.mark_document_invitation_signed(text) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.profile_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id   uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  role          text,
  associated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios documentos asociados" ON public.profile_documents;
CREATE POLICY "Usuarios pueden ver sus propios documentos asociados" ON public.profile_documents
  FOR SELECT TO authenticated USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus asociaciones" ON public.profile_documents;
CREATE POLICY "Usuarios pueden insertar sus asociaciones" ON public.profile_documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- Deja que un usuario que quedó asociado a un documento (p. ej. firmó
-- como invitado logueado) también pueda LEER esa fila de `documents` en
-- el Dashboard — hoy `documents` ya es de lectura pública igual (ver
-- Parte A: no se tocó esa tabla), pero esto lo deja correcto y explícito
-- por si esa política pública se cierra más adelante.
DROP POLICY IF EXISTS "associated_read_documents" ON public.documents;
CREATE POLICY "associated_read_documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_documents pd
      WHERE pd.document_id = documents.id AND pd.profile_id = auth.uid()
    )
  );


-- ════════════════════════════════════════════════════════════
-- PARTE C — Límites: 2 documentos + 2 firmas, independientes, 72h
-- rolling desde la última acción que alcanzó el límite.
-- ════════════════════════════════════════════════════════════

-- Firmas (usuarios registrados)
CREATE TABLE IF NOT EXISTS public.signature_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS signature_request_events_user_time_idx
  ON public.signature_request_events (user_id, created_at);
ALTER TABLE public.signature_request_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.try_consume_signature_request_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.signature_request_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.signature_request_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_signature_request_72h(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.next_signature_request_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours' FROM public.signature_request_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;
GRANT EXECUTE ON FUNCTION public.next_signature_request_slot(uuid, integer) TO authenticated;

-- Documentos (usuarios registrados) — solo se llama al descargar con éxito.
CREATE TABLE IF NOT EXISTS public.document_creation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS document_creation_events_user_time_idx
  ON public.document_creation_events (user_id, created_at);
ALTER TABLE public.document_creation_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.try_consume_document_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_count FROM public.document_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.document_creation_events (user_id) VALUES (p_user_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_document_72h(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.next_document_slot(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours' FROM public.document_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;
GRANT EXECUTE ON FUNCTION public.next_document_slot(uuid, integer) TO authenticated;

-- Anónimos (no logueados) — device_id de localStorage es la clave de
-- aplicación (garantiza que un dispositivo nuevo arranque en 0); IP se
-- guarda solo como dato de auditoría antifraude, nunca para bloquear
-- (evita falsos positivos en wifi/IP compartida). "document" y
-- "signature" son cupos independientes de 2 cada uno, igual que para
-- usuarios logueados.
CREATE TABLE IF NOT EXISTS public.anon_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  ip_address text,
  action text NOT NULL CHECK (action IN ('document', 'signature')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS anon_usage_events_device_time_idx
  ON public.anon_usage_events (device_id, created_at);
ALTER TABLE public.anon_usage_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.try_consume_anon_usage_72h(
  p_device_id text, p_ip text, p_action text, p_limit integer DEFAULT 2
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  IF p_device_id IS NULL OR length(trim(p_device_id)) = 0 THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_count FROM public.anon_usage_events
  WHERE device_id = p_device_id AND action = p_action
    AND created_at >= now() - interval '72 hours';
  IF v_count >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.anon_usage_events (device_id, ip_address, action)
  VALUES (p_device_id, p_ip, p_action);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_anon_usage_72h(text, text, text, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_anon_usage_slot(p_device_id text, p_action text, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT created_at + interval '72 hours' FROM public.anon_usage_events
  WHERE device_id = p_device_id AND action = p_action
    AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;
GRANT EXECUTE ON FUNCTION public.next_anon_usage_slot(text, text, integer) TO anon, authenticated;


-- ════════════════════════════════════════════════════════════
-- PARTE D — Storage: que el PDF del invitado cargue sí o sí
-- ════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "public_read_documents_bucket" ON storage.objects;
CREATE POLICY "public_read_documents_bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents-bucket');

DROP POLICY IF EXISTS "auth_write_documents_bucket" ON storage.objects;
CREATE POLICY "auth_write_documents_bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents-bucket');

DROP POLICY IF EXISTS "auth_update_documents_bucket" ON storage.objects;
CREATE POLICY "auth_update_documents_bucket" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents-bucket');

-- ════════════════════════════════════════════════════════════
-- FIN — Verificación rápida después de correr esto:
--   select proname from pg_proc where pronamespace = 'public'::regnamespace
--     and proname like '%signing_link%' or proname like '%_72h';
--   (deberían aparecer verify_signing_link, try_consume_document_72h,
--    try_consume_signature_request_72h, try_consume_anon_usage_72h)
-- ════════════════════════════════════════════════════════════
