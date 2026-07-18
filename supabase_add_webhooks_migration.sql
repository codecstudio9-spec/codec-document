-- Fase 3 del modulo empresarial: Webhooks. 100% aditivo, y el envio de
-- eventos NO toca el flujo actual de documentos/firmas -- son
-- triggers OBSERVANDO documents/signers (nunca modifican esas tablas
-- ni su comportamiento), que solo escriben en un log nuevo
-- (webhook_events). El envio HTTP real hacia la URL del cliente es un
-- paso aparte (dispatcher), documentado al final -- registrar el
-- evento aqui no depende de que ese despachador ya este activo.

CREATE TABLE IF NOT EXISTS public.webhooks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  url        text NOT NULL,
  events     text[] NOT NULL DEFAULT ARRAY['document.completed','signature.completed'],
  secret     text NOT NULL DEFAULT encode(gen_random_bytes(20), 'hex'), -- para firmar el payload (HMAC) cuando el dispatcher lo envie
  active     boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type  text NOT NULL, -- 'document.created' | 'document.completed' | 'signature.sent' | 'signature.completed'
  payload     jsonb NOT NULL,
  delivered   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- Sin politicas de cliente -- se gestionan por funciones SECURITY
-- DEFINER (protege el "secret" de cada webhook de una lectura directa).

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

-- Registra un evento en el log SOLO si el documento pertenece al owner
-- de una empresa con al menos un webhook activo suscrito a ese evento
-- -- si no hay empresa/webhook, no pasa nada (no rompe el flujo normal
-- de un usuario individual sin workspace).
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

-- Triggers que OBSERVAN documents/signers -- nunca cambian su
-- comportamiento, solo registran el evento cuando corresponde.
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

-- Verificacion rapida.
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('webhooks', 'webhook_events');

-- ═══════════════════════════════════════════════════════════════════════════
-- PENDIENTE (fuera de esta migracion): un "dispatcher" que lea
-- webhook_events donde delivered = false, firme el payload con el
-- secret de cada webhook (HMAC-SHA256), lo envie por HTTP POST a la url
-- registrada, y marque delivered = true. Eso se implementa como una
-- Edge Function aparte (webhook-dispatcher) invocada por un Cron Job de
-- Supabase (Project Settings > Database > Cron, o `pg_cron`) cada 1-2
-- minutos -- programar ese cron requiere el dashboard de Supabase, asi
-- que ese ultimo paso queda para cuando lo configures o me confirmes
-- que quieres que te de el codigo del dispatcher tambien.
-- ═══════════════════════════════════════════════════════════════════════════
