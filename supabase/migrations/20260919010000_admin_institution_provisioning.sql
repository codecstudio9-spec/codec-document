-- SSO institucional — el admin de la plataforma (is_admin_user()) puede
-- pre-registrar una institución por nombre + dominio de correo ANTES de
-- que ninguno de sus usuarios exista todavía en Codec Document. El
-- primer usuario que inicie sesión con ese dominio (ya sea porque le
-- llegó el aviso automático o porque entró a Configuración → Empresa)
-- reclama la empresa y queda como 'owner'; el resto que se una después
-- entra como 'user' — mismo comportamiento de siempre para el caso
-- normal (alguien crea su propia empresa como owner).
--
-- Por qué owner_user_id pasa a ser NULLABLE: la tabla companies exigía
-- un owner real desde el INSERT (así funciona create_company(), donde
-- quien la crea Y la usa son la misma persona) — pero aquí el admin de
-- la plataforma provisiona la fila sin ser él mismo parte de esa
-- empresa, así que no hay ningún auth.users real que poner ahí todavía.

ALTER TABLE public.companies ALTER COLUMN owner_user_id DROP NOT NULL;

-- ── Aprovisionar una institución (solo admin de plataforma) ────────────
CREATE OR REPLACE FUNCTION public.admin_provision_institution(
  p_name text,
  p_domain text,
  p_plan_seats integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain text;
  v_company_id uuid;
  v_row jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RAISE EXCEPTION 'Institution name is required';
  END IF;
  v_domain := lower(trim(p_domain));
  IF v_domain IS NULL OR v_domain = '' OR v_domain NOT LIKE '%.%' THEN
    RAISE EXCEPTION 'A valid email domain is required (e.g. institucion.edu.co)';
  END IF;
  IF p_plan_seats IS NOT NULL AND p_plan_seats < 1 THEN
    RAISE EXCEPTION 'Seat count must be at least 1';
  END IF;
  IF EXISTS (SELECT 1 FROM public.companies WHERE domain = v_domain) THEN
    RAISE EXCEPTION 'An institution with that domain already exists';
  END IF;

  INSERT INTO public.companies (name, domain, owner_user_id, subscription_plan, plan_seats)
  VALUES (trim(p_name), v_domain, NULL, 'enterprise', p_plan_seats)
  RETURNING id INTO v_company_id;

  SELECT to_jsonb(c.*) INTO v_row FROM public.companies c WHERE c.id = v_company_id;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_provision_institution(text, text, integer) TO authenticated;

-- ── Listar todas las instituciones provisionadas (solo admin) ──────────
CREATE OR REPLACE FUNCTION public.admin_list_institutions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'domain', c.domain,
    'subscription_plan', c.subscription_plan,
    'plan_seats', c.plan_seats,
    'owner_email', ou.email,
    'member_count', (SELECT count(*) FROM public.company_members cm WHERE cm.company_id = c.id),
    'created_at', c.created_at
  ) ORDER BY c.created_at DESC), '[]'::jsonb) INTO v_result
  FROM public.companies c
  LEFT JOIN auth.users ou ON ou.id = c.owner_user_id;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_institutions() TO authenticated;

-- ── Borrar una institución provisionada por error (solo admin) ─────────
-- Se niega si ya tiene miembros reales, para que borrar por accidente
-- nunca se lleve por delante una empresa que alguien ya reclamó — para
-- esa hay que usar la gestión normal de /my-company.
CREATE OR REPLACE FUNCTION public.admin_delete_institution(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member_count integer;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT count(*) INTO v_member_count FROM public.company_members WHERE company_id = p_company_id;
  IF v_member_count > 0 THEN
    RAISE EXCEPTION 'This institution already has members — remove them individually from /my-company first.';
  END IF;
  DELETE FROM public.companies WHERE id = p_company_id AND owner_user_id IS NULL;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_institution(uuid) TO authenticated;

-- ── join_company_by_domain: el primer miembro reclama como 'owner' ─────
CREATE OR REPLACE FUNCTION public.join_company_by_domain()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_domain text;
  v_company_id uuid;
  v_existing_members integer;
  v_role text;
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

  SELECT count(*) INTO v_existing_members FROM public.company_members WHERE company_id = v_company_id;
  v_role := CASE WHEN v_existing_members = 0 THEN 'owner' ELSE 'user' END;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_company_id, auth.uid(), v_role)
  RETURNING to_jsonb(company_members.*) INTO v_row;

  -- Deja owner_user_id en sync con quien realmente reclamó la empresa —
  -- una institución provisionada por el admin nace con owner_user_id
  -- NULL (ver admin_provision_institution arriba).
  IF v_role = 'owner' THEN
    UPDATE public.companies SET owner_user_id = auth.uid(), updated_at = now() WHERE id = v_company_id;
  END IF;

  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_company_by_domain() TO authenticated;
