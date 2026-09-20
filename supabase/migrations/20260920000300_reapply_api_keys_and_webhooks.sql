-- Re-aplica el módulo de API keys + webhooks como migración versionada.
--
-- Bug real encontrado en vivo 2026-09-20: generate_api_key devolvía 404
-- ("could not find the function in the schema cache") al llamarlo desde
-- el navegador con una sesión real autenticada, aunque el mismo curl
-- anónimo sí lo encontraba segundos antes. Estas funciones vivían solo
-- en dos archivos sueltos en la raíz (supabase_add_api_keys_migration.sql
-- y supabase_add_webhooks_migration.sql, pensados para correrse UNA VEZ a
-- mano desde el Dashboard → SQL Editor) — el mismo patrón que ya causó el
-- problema de finalize_document (ver 20260920000100_reapply_finalize_
-- document_multi_signer.sql). CREATE OR REPLACE es idempotente: esto no
-- cambia nada si ya estaba bien, y lo corrige si el caché de PostgREST
-- quedó desincronizado en algún nodo. Termina con un NOTIFY explícito
-- para forzar a PostgREST a recargar su caché de esquema en todos lados.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ═══════════════════════════════════════════════════════════════════════
-- API Keys
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name        text NOT NULL,
  key_prefix  text NOT NULL,
  key_hash    text NOT NULL,
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.generate_api_key(p_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_raw_key text;
  v_prefix text;
  v_hash text;
  v_id uuid;
  v_created_at timestamptz;
BEGIN
  SELECT company_id, role INTO v_company_id, v_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_company_id IS NULL OR v_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Key name is required';
  END IF;

  v_raw_key := 'cd_live_' || encode(gen_random_bytes(24), 'hex');
  v_prefix  := left(v_raw_key, 16);
  v_hash    := encode(digest(v_raw_key, 'sha256'), 'hex');

  INSERT INTO public.api_keys (company_id, name, key_prefix, key_hash, created_by)
  VALUES (v_company_id, trim(p_name), v_prefix, v_hash, auth.uid())
  RETURNING id, created_at INTO v_id, v_created_at;

  RETURN jsonb_build_object('id', v_id, 'name', trim(p_name), 'key_prefix', v_prefix, 'created_at', v_created_at, 'api_key', v_raw_key);
END;
$$;
GRANT EXECUTE ON FUNCTION public.generate_api_key(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_api_keys()
RETURNS TABLE(id uuid, name text, key_prefix text, created_at timestamptz, revoked_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT k.id, k.name, k.key_prefix, k.created_at, k.revoked_at
  FROM public.api_keys k
  WHERE k.company_id = public.get_my_company_id()
  ORDER BY k.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_api_keys() TO authenticated;

CREATE OR REPLACE FUNCTION public.revoke_api_key(p_key_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_company_role() NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.api_keys SET revoked_at = now()
  WHERE id = p_key_id AND company_id = public.get_my_company_id() AND revoked_at IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.revoke_api_key(uuid) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════
-- Webhooks
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.webhooks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  url        text NOT NULL,
  events     text[] NOT NULL DEFAULT ARRAY['document.completed','signature.completed'],
  secret     text NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'),
  active     boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL,
  delivered   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_webhook(p_url text, p_events text[] DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_row jsonb;
BEGIN
  SELECT company_id, role INTO v_company_id, v_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_company_id IS NULL OR v_role NOT IN ('owner','admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_url IS NULL OR p_url !~ '^https://' THEN RAISE EXCEPTION 'url must be a valid https:// URL'; END IF;

  INSERT INTO public.webhooks (company_id, url, events, created_by)
  VALUES (v_company_id, p_url, COALESCE(p_events, ARRAY['document.completed','signature.completed']), auth.uid())
  RETURNING jsonb_build_object('id', id, 'url', url, 'events', events, 'active', active, 'created_at', created_at) INTO v_row;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_webhook(text, text[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_webhooks()
RETURNS TABLE(id uuid, url text, events text[], active boolean, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT w.id, w.url, w.events, w.active, w.created_at
  FROM public.webhooks w WHERE w.company_id = public.get_my_company_id() ORDER BY w.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.list_webhooks() TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_webhook(p_webhook_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_company_role() NOT IN ('owner','admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM public.webhooks WHERE id = p_webhook_id AND company_id = public.get_my_company_id();
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_webhook(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.log_webhook_event_for_document(p_document_id uuid, p_event_type text, p_payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_id uuid;
  v_company_id uuid;
BEGIN
  SELECT user_id INTO v_owner_id FROM public.documents WHERE id = p_document_id;
  IF v_owner_id IS NULL THEN RETURN; END IF;

  SELECT c.id INTO v_company_id FROM public.companies c WHERE c.owner_user_id = v_owner_id;
  IF v_company_id IS NULL THEN RETURN; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.webhooks WHERE company_id = v_company_id AND active AND p_event_type = ANY(events)) THEN
    RETURN;
  END IF;

  INSERT INTO public.webhook_events (company_id, event_type, payload)
  VALUES (v_company_id, p_event_type, p_payload);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_webhook_document_completed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM public.log_webhook_event_for_document(
      NEW.id, 'document.completed',
      jsonb_build_object('document_id', NEW.id, 'name', NEW.name, 'signed_pdf_url', NEW.signed_pdf_url)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_documents_webhook ON public.documents;
CREATE TRIGGER trg_documents_webhook
  AFTER UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.trg_webhook_document_completed();

CREATE OR REPLACE FUNCTION public.trg_webhook_signature_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.log_webhook_event_for_document(
      NEW.document_id, 'signature.sent',
      jsonb_build_object('signer_id', NEW.id, 'document_id', NEW.document_id, 'email', NEW.email)
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM public.log_webhook_event_for_document(
      NEW.document_id, 'signature.completed',
      jsonb_build_object('signer_id', NEW.id, 'document_id', NEW.document_id, 'email', NEW.email)
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_signers_webhook ON public.signers;
CREATE TRIGGER trg_signers_webhook
  AFTER INSERT OR UPDATE ON public.signers
  FOR EACH ROW EXECUTE FUNCTION public.trg_webhook_signature_events();

-- Fuerza a PostgREST a recargar su caché de esquema en todos los nodos —
-- esto es lo que probablemente resuelve el 404 visto en vivo.
NOTIFY pgrst, 'reload schema';
