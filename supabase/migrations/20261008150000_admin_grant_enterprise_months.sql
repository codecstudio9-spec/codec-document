CREATE TABLE IF NOT EXISTS public.admin_company_plan_gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  granted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  months integer NOT NULL CHECK (months BETWEEN 1 AND 24),
  expires_at timestamptz NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_company_plan_gifts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.admin_grant_free_enterprise_months(
  p_email text,
  p_months integer DEFAULT 1,
  p_company_name text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS TABLE (email text, company_name text, months integer, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_domain text;
  v_company_id uuid;
  v_company_name text;
  v_role text;
  v_expires_at timestamptz;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  IF p_months IS NULL OR p_months < 1 OR p_months > 24 THEN
    RAISE EXCEPTION 'Los meses deben estar entre 1 y 24';
  END IF;

  v_email := lower(trim(coalesce(p_email, '')));
  IF v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'Escribe un correo válido';
  END IF;

  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = v_email;

  SELECT cm.company_id INTO v_company_id
  FROM public.company_members cm
  WHERE cm.user_id = v_user_id;

  v_domain := split_part(v_email, '@', 2);
  IF v_company_id IS NULL AND v_domain = ANY (ARRAY[
    'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
    'yahoo.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com'
  ]) THEN
    RAISE EXCEPTION 'Usa un correo con el dominio empresarial de la organización';
  END IF;
  IF v_company_id IS NULL THEN
    SELECT c.id INTO v_company_id
    FROM public.companies c
    WHERE lower(c.domain) = v_domain
    FOR UPDATE;
  END IF;

  IF v_company_id IS NULL THEN
    v_company_name := coalesce(
      nullif(trim(coalesce(p_company_name, '')), ''),
      initcap(replace(split_part(v_domain, '.', 1), '-', ' '))
    );
    INSERT INTO public.companies (name, domain, owner_user_id, subscription_plan)
    VALUES (v_company_name, v_domain, v_user_id, 'enterprise')
    RETURNING id INTO v_company_id;
    IF v_user_id IS NOT NULL THEN
      v_role := 'owner';
      INSERT INTO public.company_members (company_id, user_id, role)
      VALUES (v_company_id, v_user_id, v_role);
    END IF;
  ELSE
    SELECT c.name INTO v_company_name
    FROM public.companies c
    WHERE c.id = v_company_id
    FOR UPDATE;

    IF v_user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.company_members cm
      WHERE cm.company_id = v_company_id AND cm.user_id = v_user_id
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.company_members cm WHERE cm.company_id = v_company_id
      ) AND EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = v_company_id AND c.owner_user_id IS NULL
      ) THEN
        v_role := 'owner';
        UPDATE public.companies
        SET owner_user_id = v_user_id, updated_at = now()
        WHERE id = v_company_id;
      ELSE
        v_role := 'user';
      END IF;
      INSERT INTO public.company_members (company_id, user_id, role)
      VALUES (v_company_id, v_user_id, v_role);
    END IF;
  END IF;

  UPDATE public.companies c
  SET subscription_plan = 'enterprise',
      plan_active_until = greatest(coalesce(c.plan_active_until, now()), now())
        + make_interval(months => p_months),
      plan_billing_cycle = 'monthly',
      updated_at = now()
  WHERE c.id = v_company_id
  RETURNING c.name, c.plan_active_until INTO v_company_name, v_expires_at;

  INSERT INTO public.admin_company_plan_gifts (
    company_id, granted_user_id, email, granted_by, months, expires_at, note
  )
  VALUES (
    v_company_id, v_user_id, v_email, auth.uid(), p_months, v_expires_at,
    nullif(trim(coalesce(p_note, '')), '')
  );

  RETURN QUERY SELECT v_email, v_company_name, p_months, v_expires_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_grant_free_enterprise_months(text, integer, text, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_enterprise_plan_gifts(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid, email text, company_name text, months integer,
  expires_at timestamptz, note text, created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  RETURN QUERY
  SELECT g.id, g.email, c.name, g.months, g.expires_at, g.note, g.created_at
  FROM public.admin_company_plan_gifts g
  JOIN public.companies c ON c.id = g.company_id
  ORDER BY g.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_enterprise_plan_gifts(integer)
  TO authenticated;
