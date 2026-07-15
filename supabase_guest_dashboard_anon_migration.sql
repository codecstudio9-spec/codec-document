-- ============================================================
-- CODEC DOCUMENT — Guest PDF visibility + profile_documents dashboard
-- + límite anónimo por dispositivo (72h)
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- Requiere que ya existan (creadas por ti manualmente):
--   public.document_invitations (id, document_id, guest_email, guest_name,
--     token, status, created_at, expires_at) — RLS: SELECT público por token
--   public.profile_documents (id, profile_id, document_id, role, associated_at)
--     — RLS: SELECT/INSERT propios (profile_id = auth.uid())
-- ============================================================

-- ── 1. BUG 1 — el invitado no puede leer el PDF ───────────────────────────
-- verify_signing_link (supabase_lockdown_public_read_migration.sql) ya es
-- SECURITY DEFINER y bypassa RLS de `documents`/`signing_links`, así que la
-- fila con original_pdf_url SÍ debería resolver correctamente. El punto de
-- falla real más probable es el STORAGE: getPublicUrl() solo funciona si el
-- bucket está marcado "Public" en Supabase; si no lo está (o alguien lo puso
-- privado después), la URL "pública" devuelve 400/403 para el invitado sin
-- que ninguna política de tabla lo evite. La política de storage de abajo
-- ya existía en supabase_rls_migration.sql — se re-declara aquí de forma
-- idempotente porque createSignedUrl() (el fallback que agrega el frontend)
-- también depende de que esta policy exista, sin importar el flag
-- público/privado del bucket.
DROP POLICY IF EXISTS "public_read_documents_bucket" ON storage.objects;
CREATE POLICY "public_read_documents_bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents-bucket');

-- Wiring de document_invitations: createSigningLink() ahora también inserta
-- aquí (mismo token que en signing_links) para que la tabla que creaste
-- quede poblada y auditable. Como no conocemos las políticas de INSERT que
-- le pusiste a document_invitations, se escribe vía RPC SECURITY DEFINER en
-- vez de un INSERT directo del cliente — así funciona sin importar si esa
-- tabla permite INSERT anónimo o no.
CREATE OR REPLACE FUNCTION public.record_document_invitation(
  p_document_id uuid,
  p_guest_email text,
  p_guest_name  text,
  p_token       text,
  p_expires_at  timestamptz
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.document_invitations
    (document_id, guest_email, guest_name, token, status, expires_at)
  VALUES
    (p_document_id, p_guest_email, p_guest_name, p_token, 'pending', p_expires_at);
$$;

GRANT EXECUTE ON FUNCTION public.record_document_invitation(uuid, text, text, text, timestamptz) TO authenticated;

-- Se llama cuando el invitado firma con éxito, para cerrar el ciclo de vida
-- de la invitación (pending -> signed).
CREATE OR REPLACE FUNCTION public.mark_document_invitation_signed(p_token text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.document_invitations
  SET status = 'signed'
  WHERE token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.mark_document_invitation_signed(text) TO anon, authenticated;

-- ── 2. REQUERIMIENTO 2 — el firmante logueado ve el documento en su perfil ─
-- profile_documents ya permite INSERT propio (profile_id = auth.uid()), así
-- que el cliente inserta directo. Lo único que falta es permitir que ese
-- usuario luego pueda LEER la fila de `documents` a la que quedó asociado —
-- la política actual (owner_read_documents) solo permite leer documentos
-- donde uno mismo es el creador (user_id), no donde uno es un firmante
-- invitado añadido después. Se agrega una política adicional (permisiva,
-- se combina con OR con las existentes) para ese caso.
DROP POLICY IF EXISTS "associated_read_documents" ON public.documents;
CREATE POLICY "associated_read_documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_documents pd
      WHERE pd.document_id = documents.id AND pd.profile_id = auth.uid()
    )
  );

-- ── 3. BUG 3 — límite bloqueado para usuarios anónimos nuevos ─────────────
-- Causa real (confirmada en el código, no en la DB): handleUploadPdf y
-- handleConfirmPositions en electronic-signature-page.tsx, y el gate de
-- solicitud de firma en document-generator-page.tsx, hacían
-- `if (!userId) { mostrar paywall; return; }` — es decir, un visitante
-- anónimo era bloqueado ANTES de siquiera consultar ningún contador, sin
-- importar si era su primera visita. No había ninguna tabla de conteo
-- anónimo defectuosa que corregir; simplemente no existía un camino de
-- verificación para anónimos. Se agrega aquí, con el mismo patrón de
-- ventana móvil de 72h ya usado para signature_request_events, mapeado a un
-- device_id persistido en localStorage (no a IP sola, que rota y se
-- comparte entre usuarios de una misma red — ver comentario en la función).
CREATE TABLE IF NOT EXISTS public.anon_usage_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  text NOT NULL,
  ip_address text,
  action     text NOT NULL CHECK (action IN ('document', 'signature')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anon_usage_events_device_time_idx
  ON public.anon_usage_events (device_id, created_at);

ALTER TABLE public.anon_usage_events ENABLE ROW LEVEL SECURITY;
-- Sin políticas de SELECT/INSERT para el cliente — todo pasa por las RPCs
-- SECURITY DEFINER de abajo, así el conteo no se puede falsear borrando y
-- reescribiendo localStorage con un id "limpio" mientras se inspecciona la
-- tabla, ni se puede leer el device_id/IP de otros usuarios.

-- device_id es la clave de aplicación del límite: garantiza que un
-- dispositivo/navegador nuevo siempre arranca en 0. La IP se guarda junto a
-- cada evento solo como dato de auditoría/antifraude para revisión manual
-- (p. ej. detectar un mismo IP generando cientos de device_id distintos) —
-- NO se usa para bloquear, porque una IP compartida (wifi de oficina,
-- CGNAT de operador móvil) bloquearía por error a gente nueva y legítima.
CREATE OR REPLACE FUNCTION public.try_consume_anon_usage_72h(
  p_device_id text,
  p_ip        text,
  p_action    text,
  p_limit     integer DEFAULT 2
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_device_id IS NULL OR length(trim(p_device_id)) = 0 THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.anon_usage_events
  WHERE device_id = p_device_id
    AND created_at >= now() - interval '72 hours';

  IF v_count >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO public.anon_usage_events (device_id, ip_address, action)
  VALUES (p_device_id, p_ip, p_action);
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_consume_anon_usage_72h(text, text, text, integer) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.next_anon_usage_slot(p_device_id text, p_limit integer DEFAULT 2)
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT created_at + interval '72 hours'
  FROM public.anon_usage_events
  WHERE device_id = p_device_id
    AND created_at >= now() - interval '72 hours'
  ORDER BY created_at ASC
  LIMIT 1 OFFSET GREATEST(p_limit - 1, 0);
$$;

GRANT EXECUTE ON FUNCTION public.next_anon_usage_slot(text, integer) TO anon, authenticated;
