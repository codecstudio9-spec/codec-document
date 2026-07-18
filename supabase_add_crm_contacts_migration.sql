-- Fase 4 del modulo empresarial: CRM basico. 100% aditivo -- no
-- modifica documents/signers/sign_transactions ni el flujo existente,
-- solo agrega un trigger que OBSERVA la tabla signers (ya confirmada
-- en vivo: id, document_id, name, email) y sincroniza un directorio de
-- contactos, sin duplicar logica de negocio.

CREATE TABLE IF NOT EXISTS public.contacts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           text,
  email          text NOT NULL,
  phone          text,
  company        text, -- texto libre: donde trabaja ESTE contacto (no tiene relacion con public.companies)
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, email)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_own" ON public.contacts
  FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- Se dispara solo cuando alguien firma un documento que TU generaste
-- (subir tu propio PDF / firma electronica) -- automaticamente guarda
-- o actualiza el contacto, sin que el usuario tenga que hacer nada.
CREATE OR REPLACE FUNCTION public.sync_contact_from_signer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner_user_id uuid;
BEGIN
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN RETURN NEW; END IF;

  SELECT user_id INTO v_owner_user_id FROM public.documents WHERE id = NEW.document_id;
  IF v_owner_user_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.contacts (owner_user_id, name, email)
  VALUES (v_owner_user_id, NEW.name, lower(trim(NEW.email)))
  ON CONFLICT (owner_user_id, email)
  DO UPDATE SET name = COALESCE(EXCLUDED.name, public.contacts.name), updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_contact_from_signer ON public.signers;
CREATE TRIGGER trg_sync_contact_from_signer
  AFTER INSERT ON public.signers
  FOR EACH ROW EXECUTE FUNCTION public.sync_contact_from_signer();

-- Devuelve tus contactos con un resumen de actividad calculado a partir
-- de signers/documents ya existentes (sin duplicar esos datos):
-- cuantos documentos le has enviado, cuantos ya firmo, y su ultima
-- actividad.
CREATE OR REPLACE FUNCTION public.get_my_contacts()
RETURNS TABLE(
  id uuid, name text, email text, phone text, company text, notes text,
  created_at timestamptz, documents_sent bigint, documents_signed bigint, last_activity_at timestamptz
)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT
    c.id, c.name, c.email, c.phone, c.company, c.notes, c.created_at,
    COUNT(s.id) AS documents_sent,
    COUNT(s.id) FILTER (WHERE s.status = 'completed') AS documents_signed,
    GREATEST(c.updated_at, MAX(s.created_at)) AS last_activity_at
  FROM public.contacts c
  LEFT JOIN public.signers s
    ON lower(trim(s.email)) = c.email
    AND s.document_id IN (SELECT id FROM public.documents WHERE user_id = auth.uid())
  WHERE c.owner_user_id = auth.uid()
  GROUP BY c.id
  ORDER BY last_activity_at DESC NULLS LAST;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_contacts() TO authenticated;

CREATE OR REPLACE FUNCTION public.update_contact_notes(p_contact_id uuid, p_notes text, p_phone text DEFAULT NULL, p_company text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.contacts
  SET notes = p_notes, phone = COALESCE(p_phone, phone), company = COALESCE(p_company, company), updated_at = now()
  WHERE id = p_contact_id AND owner_user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_contact_notes(uuid, text, text, text) TO authenticated;

-- Verificacion rapida.
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts';
