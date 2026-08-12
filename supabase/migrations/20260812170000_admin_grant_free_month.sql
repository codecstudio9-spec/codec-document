-- Regalar un mes (o varios) de plan completo a alguien, por su correo, desde
-- el panel de analítica.
--
-- ── Por qué no vale con un bono ──────────────────────────────────────────
--
-- Un bono es anónimo: se reparte y lo canjea quien lo tenga. Esto es lo
-- contrario — va dirigido a UNA persona concreta y se activa solo, sin que
-- ella tenga que escribir nada. Es lo que se usa para un cliente al que se le
-- quiere dar cortesía, no para una campaña.
--
-- ── Cómo se concede ──────────────────────────────────────────────────────
--
-- Se escriben exactamente los mismos campos que escribe un pago real
-- (users.plan_status/plan_type/plan_expires_at y user_credits.plan/
-- plan_expires_at), que es lo que hace grantProduct() en paypal-verify. Así
-- ningún otro punto de la aplicación tiene que saber que esto existe: un mes
-- regalado se ve exactamente igual que un mes pagado para todas las
-- comprobaciones de plan que ya hay.
--
-- Si la persona YA tiene plan, el tiempo se SUMA a lo que le quede en vez de
-- reemplazarlo. Reemplazar podría recortarle un plan pagado más largo — el
-- regalo nunca puede dejar a alguien peor de lo que estaba.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

CREATE TABLE IF NOT EXISTS public.admin_plan_gifts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  months     integer NOT NULL CHECK (months > 0),
  expires_at timestamptz NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_plan_gifts ENABLE ROW LEVEL SECURITY;
-- Sin políticas: sólo se lee y escribe desde funciones SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.admin_grant_free_month(
  p_email  text,
  p_months integer DEFAULT 1,
  p_note   text DEFAULT NULL
)
RETURNS TABLE (email text, months integer, expires_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_desde   timestamptz;
  v_hasta   timestamptz;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF p_months IS NULL OR p_months < 1 OR p_months > 24 THEN
    RAISE EXCEPTION 'Los meses deben estar entre 1 y 24';
  END IF;

  v_email := lower(trim(p_email));
  SELECT u.id INTO v_user_id FROM auth.users u WHERE lower(u.email) = v_email;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay ninguna cuenta con el correo %', v_email;
  END IF;

  -- Se parte de lo que ya tenga, si sigue vigente. Así un regalo sobre un
  -- plan activo alarga, no recorta.
  SELECT greatest(coalesce(us.plan_expires_at, now()), now())
    INTO v_desde
  FROM public.users us WHERE us.id = v_user_id;
  v_desde := coalesce(v_desde, now());
  v_hasta := v_desde + make_interval(months => p_months);

  UPDATE public.users
  SET plan_status = 'active',
      plan_type = 'monthly',
      plan_expires_at = v_hasta
  WHERE id = v_user_id;

  -- user_credits gobierna las firmas; se alarga igual para que el mes
  -- regalado incluya lo mismo que un mes pagado.
  IF EXISTS (SELECT 1 FROM public.user_credits uc WHERE uc.user_id = v_user_id) THEN
    UPDATE public.user_credits
    SET plan = 'monthly', plan_expires_at = v_hasta, updated_at = now()
    WHERE user_id = v_user_id;
  ELSE
    INSERT INTO public.user_credits (user_id, credits, plan, plan_expires_at)
    VALUES (v_user_id, 0, 'monthly', v_hasta);
  END IF;

  INSERT INTO public.admin_plan_gifts (user_id, granted_by, months, expires_at, note)
  VALUES (v_user_id, auth.uid(), p_months, v_hasta, nullif(trim(coalesce(p_note, '')), ''));

  RETURN QUERY SELECT v_email, p_months, v_hasta;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_grant_free_month(text, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_plan_gifts(p_limit integer DEFAULT 50)
RETURNS TABLE (id uuid, email text, months integer, expires_at timestamptz, note text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT g.id, u.email::text, g.months, g.expires_at, g.note, g.created_at
  FROM public.admin_plan_gifts g
  JOIN auth.users u ON u.id = g.user_id
  ORDER BY g.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_plan_gifts(integer) TO authenticated;

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND proname = 'admin_grant_free_month';
