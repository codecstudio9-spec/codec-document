-- Fase 1 del modulo empresarial: Company Workspace + Roles + deteccion
-- de dominio corporativo. 100% aditivo -- nuevas tablas, no toca
-- documents/signatures/users ni ninguna politica existente. El flujo
-- actual de documentos y firmas sigue exactamente igual; esto es una
-- capa nueva por encima.
--
-- Deliberadamente NO se modifica la visibilidad de documentos/firmas
-- existentes para que un "owner"/"admin" vea los documentos de otros
-- miembros -- eso requiere tocar RLS de documents/signatures con mucho
-- mas cuidado y queda para una fase dedicada aparte, para no arriesgar
-- el flujo que ya funciona.

CREATE TABLE IF NOT EXISTS public.companies (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  domain            text UNIQUE, -- ej. 'acme.com', minusculas, sin @
  logo_url          text,
  owner_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan text NOT NULL DEFAULT 'business',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Cada usuario pertenece como maximo a UNA empresa (UNIQUE en user_id) --
-- tabla de union separada en vez de agregar columnas a public.users,
-- para no tocar esa tabla existente en absoluto.
CREATE TABLE IF NOT EXISTS public.company_members (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL DEFAULT 'user' CHECK (role IN ('owner','admin','manager','user')),
  joined_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- Helpers SECURITY DEFINER -- evitan la recursion infinita clasica de
-- RLS al consultar company_members desde su propia politica.
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_company_role()
RETURNS text LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM public.company_members WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_company_role() TO authenticated;

CREATE POLICY "companies_select_members" ON public.companies
  FOR SELECT USING (id = public.get_my_company_id());

CREATE POLICY "companies_update_owner" ON public.companies
  FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "companies_insert_self_owner" ON public.companies
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "company_members_select_same_company" ON public.company_members
  FOR SELECT USING (company_id = public.get_my_company_id());

-- Nota: NO hay politica de INSERT/UPDATE/DELETE de cliente directa
-- sobre company_members -- toda alta/cambio de rol/baja pasa por las
-- funciones SECURITY DEFINER de abajo, que validan quien puede hacer
-- que (evita que alguien se auto-asigne 'owner' o se una a la empresa
-- de otro sin que su dominio de correo realmente coincida).

-- Crea una empresa nueva y a quien la crea como 'owner', atomicamente.
CREATE OR REPLACE FUNCTION public.create_company(p_name text, p_domain text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_row jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already belong to a company';
  END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Company name is required';
  END IF;

  INSERT INTO public.companies (name, domain, owner_user_id)
  VALUES (trim(p_name), NULLIF(lower(trim(p_domain)), ''), auth.uid())
  RETURNING id INTO v_company_id;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, auth.uid(), 'owner');

  SELECT to_jsonb(c.*) INTO v_row FROM public.companies c WHERE c.id = v_company_id;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_company(text, text) TO authenticated;

-- Detecta si el dominio del correo del usuario actual coincide con una
-- empresa ya registrada -- solo lectura, para mostrar el aviso
-- "Esta organizacion ya existe. ¿Deseas unirte?" antes de unirse.
CREATE OR REPLACE FUNCTION public.find_company_by_my_domain()
RETURNS TABLE(id uuid, name text, domain text)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_email text;
  v_domain text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid()) THEN RETURN; END IF;
  SELECT email INTO v_email FROM auth.users WHERE auth.users.id = auth.uid();
  IF v_email IS NULL THEN RETURN; END IF;
  v_domain := lower(split_part(v_email, '@', 2));
  RETURN QUERY SELECT c.id, c.name, c.domain FROM public.companies c WHERE c.domain = v_domain;
END;
$$;
GRANT EXECUTE ON FUNCTION public.find_company_by_my_domain() TO authenticated;

-- Une al usuario actual a la empresa cuyo dominio coincide con su
-- propio correo -- nunca a una empresa arbitraria elegida por el
-- cliente, evitando que alguien se una a la empresa de otro sin que su
-- dominio realmente corresponda.
CREATE OR REPLACE FUNCTION public.join_company_by_domain()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_domain text;
  v_company_id uuid;
  v_row jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.company_members WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already belong to a company';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE auth.users.id = auth.uid();
  v_domain := lower(split_part(v_email, '@', 2));
  SELECT id INTO v_company_id FROM public.companies WHERE domain = v_domain;
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'No company matches your email domain';
  END IF;
  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, auth.uid(), 'user')
  RETURNING to_jsonb(company_members.*) INTO v_row;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_company_by_domain() TO authenticated;

-- Agrega (o cambia el rol de) un miembro por correo -- solo owner/admin
-- de la MISMA empresa. El "WHERE company_members.company_id = v_my_company_id"
-- en el ON CONFLICT evita que se "robe" a un usuario que ya pertenece a
-- otra empresa: si el conflicto es con una fila de otra empresa, la
-- actualizacion simplemente no aplica y RETURNING no devuelve nada.
CREATE OR REPLACE FUNCTION public.add_company_member_by_email(p_email text, p_role text DEFAULT 'user')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_my_company_id uuid;
  v_my_role text;
  v_target_user_id uuid;
  v_row jsonb;
BEGIN
  SELECT company_id, role INTO v_my_company_id, v_my_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_my_company_id IS NULL OR v_my_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_role NOT IN ('owner','admin','manager','user') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  SELECT id INTO v_target_user_id FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'No account found with that email';
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_my_company_id, v_target_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
    WHERE company_members.company_id = v_my_company_id
  RETURNING to_jsonb(company_members.*) INTO v_row;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'That user already belongs to a different company';
  END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_company_member_by_email(text, text) TO authenticated;

-- Quita a un miembro -- solo owner/admin de la misma empresa, y nunca a
-- si mismo (para evitar que un admin se quede sin poder deshacerlo).
CREATE OR REPLACE FUNCTION public.remove_company_member(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_my_company_id uuid;
  v_my_role text;
BEGIN
  SELECT company_id, role INTO v_my_company_id, v_my_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_my_company_id IS NULL OR v_my_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself this way';
  END IF;
  DELETE FROM public.company_members WHERE user_id = p_user_id AND company_id = v_my_company_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_company_member(uuid) TO authenticated;

-- Todo lo que la pagina /my-company necesita en una sola llamada:
-- datos de la empresa, mi rol, y el roster completo con correos (los
-- correos vienen de auth.users, que el cliente no puede leer
-- directamente -- por eso esto tiene que ser SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.get_my_company_full()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_result jsonb;
BEGIN
  SELECT company_id, role INTO v_company_id, v_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_company_id IS NULL THEN RETURN NULL; END IF;
  SELECT jsonb_build_object(
    'company', to_jsonb(c.*),
    'my_role', v_role,
    'members', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('user_id', cm.user_id, 'email', u.email, 'role', cm.role, 'joined_at', cm.joined_at) ORDER BY cm.joined_at)
      FROM public.company_members cm
      JOIN auth.users u ON u.id = cm.user_id
      WHERE cm.company_id = v_company_id
    ), '[]'::jsonb)
  ) INTO v_result
  FROM public.companies c WHERE c.id = v_company_id;
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_company_full() TO authenticated;

-- Verificacion rapida.
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('companies', 'company_members');
