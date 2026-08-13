-- Panel de control del dueño para la herramienta de contadores.
--
-- ── Qué responde ─────────────────────────────────────────────────────────
-- Quién entró, quién paga, quién no, cuánto consume cada uno y desde dónde se
-- conecta. Y permite conceder acceso a mano, que es lo que hace falta para
-- cerrar un cliente por teléfono sin pedirle que pase por la pasarela.
--
-- ── Por qué no se reutiliza el módulo de analítica existente ─────────────
-- El que ya hay (analytics_visitors) mide VISITANTES anónimos: ciudad, fuente,
-- página de entrada. Sirve para marketing. Aquí hace falta lo contrario: una
-- fila por CUENTA, con su plan, su consumo y su historial de pagos. Son dos
-- preguntas distintas sobre dos poblaciones distintas, y forzar una sobre la
-- otra daría cifras que no significan nada.
--
-- ── Acceso ───────────────────────────────────────────────────────────────
-- Todo pasa por is_admin_user(), que está atado a un único correo. No hay
-- lista de administradores ni roles: para lo que enseña esto —correos de
-- clientes, cuánto paga cada uno— una lista es una superficie de ataque que
-- no compensa.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

-- ── Concesiones manuales ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_plan_grants (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid REFERENCES auth.users(id),
  plan_code  text NOT NULL REFERENCES public.ed_plans(code),
  months     integer NOT NULL CHECK (months BETWEEN 1 AND 24),
  expires_at timestamptz NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_plan_grants ENABLE ROW LEVEL SECURITY;
-- Sin políticas: sólo se toca desde funciones SECURITY DEFINER.

-- ── Resumen ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ed_admin_resumen()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inicio_mes timestamptz := date_trunc('month', now());
  v_res jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  SELECT jsonb_build_object(
    'usuarios_total',    (SELECT count(DISTINCT owner_user_id) FROM ed_imports),
    'usuarios_mes',      (SELECT count(DISTINCT owner_user_id) FROM ed_imports WHERE created_at >= v_inicio_mes),
    'de_pago',           (SELECT count(*) FROM ed_subscriptions s
                            WHERE s.status = 'active' AND s.current_period_end > now()),
    'docs_mes',          (SELECT coalesce(sum(processed), 0) FROM ed_imports WHERE created_at >= v_inicio_mes),
    'docs_total',        (SELECT coalesce(sum(processed), 0) FROM ed_imports),
    -- Sólo pagos APROBADOS. Contar los pendientes inflaría los ingresos con
    -- cobros que nunca entraron, que es la peor cifra posible en un panel.
    'ingresos_mes',      (SELECT coalesce(sum(amount_in_cents), 0) / 100 FROM ed_payments
                            WHERE status = 'APPROVED' AND created_at >= v_inicio_mes),
    'ingresos_total',    (SELECT coalesce(sum(amount_in_cents), 0) / 100 FROM ed_payments
                            WHERE status = 'APPROVED'),
    'pagos_pendientes',  (SELECT count(*) FROM ed_payments WHERE status = 'PENDING'),
    'documentos_guardados', (SELECT count(*) FROM ed_documents)
  ) INTO v_res;

  RETURN v_res;
END $$;

REVOKE ALL ON FUNCTION public.ed_admin_resumen() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_admin_resumen() TO authenticated;

-- ── Una fila por cuenta ───────────────────────────────────────────────────

/** Todo lo que hace falta saber de un usuario para decidir si llamarlo:
 *  cuándo entró por última vez, qué plan tiene, cuánto consume y cuánto ha
 *  pagado. Ordenado por actividad reciente, que es el orden en el que se
 *  trabaja una lista de clientes. */
CREATE OR REPLACE FUNCTION public.ed_admin_usuarios(p_limit integer DEFAULT 200)
RETURNS TABLE (
  user_id       uuid,
  email         text,
  registrado    timestamptz,
  ultimo_acceso timestamptz,
  plan_code     text,
  plan_nombre   text,
  plan_hasta    timestamptz,
  docs_mes      bigint,
  docs_total    bigint,
  pagado_total  bigint,
  ultimo_pago   timestamptz,
  ultima_actividad timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inicio_mes timestamptz := date_trunc('month', now());
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    coalesce(s.plan_code, 'gratis'),
    coalesce(p.name, 'Gratis'),
    s.current_period_end,
    coalesce((SELECT sum(i.processed) FROM ed_imports i
               WHERE i.owner_user_id = u.id AND i.created_at >= v_inicio_mes), 0)::bigint,
    coalesce((SELECT sum(i.processed) FROM ed_imports i WHERE i.owner_user_id = u.id), 0)::bigint,
    coalesce((SELECT sum(pay.amount_in_cents) / 100 FROM ed_payments pay
               WHERE pay.user_id = u.id AND pay.status = 'APPROVED'), 0)::bigint,
    (SELECT max(pay.created_at) FROM ed_payments pay
       WHERE pay.user_id = u.id AND pay.status = 'APPROVED'),
    (SELECT max(i.created_at) FROM ed_imports i WHERE i.owner_user_id = u.id)
  FROM auth.users u
  LEFT JOIN ed_subscriptions s
    ON s.user_id = u.id AND s.status = 'active' AND s.current_period_end > now()
  LEFT JOIN ed_plans p ON p.code = s.plan_code
  -- Sólo quien ha tocado ESTA herramienta. La base tiene usuarios de firma y
  -- de cotizaciones que aquí sólo serían ruido.
  WHERE EXISTS (SELECT 1 FROM ed_imports i WHERE i.owner_user_id = u.id)
     OR EXISTS (SELECT 1 FROM ed_subscriptions s2 WHERE s2.user_id = u.id)
  ORDER BY coalesce(
    (SELECT max(i.created_at) FROM ed_imports i WHERE i.owner_user_id = u.id),
    u.last_sign_in_at, u.created_at
  ) DESC
  LIMIT greatest(1, least(coalesce(p_limit, 200), 1000));
END $$;

REVOKE ALL ON FUNCTION public.ed_admin_usuarios(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_admin_usuarios(integer) TO authenticated;

-- ── Pagos ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ed_admin_pagos(p_limit integer DEFAULT 100)
RETURNS TABLE (
  reference  text,
  email      text,
  plan_code  text,
  cop        bigint,
  status     text,
  metodo     text,
  manual     boolean,
  creado     timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  RETURN QUERY
  SELECT p.reference, u.email::text, p.plan_code,
         (p.amount_in_cents / 100)::bigint, p.status,
         coalesce(p.payment_method, '—'),
         (p.confirmed_manually_at IS NOT NULL),
         p.created_at
  FROM ed_payments p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 100), 500));
END $$;

REVOKE ALL ON FUNCTION public.ed_admin_pagos(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_admin_pagos(integer) TO authenticated;

-- ── Conceder acceso a mano ────────────────────────────────────────────────

/** Da un plan sin cobrar. Es lo que hace falta para cerrar un cliente por
 *  teléfono, compensar a alguien por un fallo, o abrirle la herramienta a un
 *  contador que la está probando en serio.
 *
 *  Si ya tiene plan, el tiempo se SUMA en vez de reemplazar: un regalo nunca
 *  puede dejar a alguien peor de lo que estaba. Y queda registrado quién lo
 *  concedió — un acceso sin rastro es indistinguible de un fallo de cobro. */
CREATE OR REPLACE FUNCTION public.ed_admin_conceder_plan(
  p_email     text,
  p_plan_code text,
  p_meses     integer DEFAULT 1,
  p_nota      text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_plan    public.ed_plans;
  v_desde   timestamptz;
  v_hasta   timestamptz;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF p_meses IS NULL OR p_meses < 1 OR p_meses > 24 THEN
    RAISE EXCEPTION 'Los meses deben estar entre 1 y 24';
  END IF;

  SELECT * INTO v_plan FROM ed_plans WHERE code = p_plan_code AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ese plan no existe: %', p_plan_code; END IF;

  v_email := lower(trim(p_email));
  SELECT u.id INTO v_user_id FROM auth.users u WHERE lower(u.email) = v_email;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay ninguna cuenta con el correo %', v_email;
  END IF;

  SELECT greatest(coalesce(current_period_end, now()), now()) INTO v_desde
  FROM ed_subscriptions WHERE user_id = v_user_id;
  v_desde := coalesce(v_desde, now());
  v_hasta := v_desde + make_interval(months => p_meses);

  INSERT INTO ed_subscriptions (user_id, status, plan_code, current_period_end, updated_at)
  VALUES (v_user_id, 'active', v_plan.code, v_hasta, now())
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active', plan_code = v_plan.code,
        current_period_end = v_hasta, updated_at = now();

  INSERT INTO ed_plan_grants (user_id, granted_by, plan_code, months, expires_at, note)
  VALUES (v_user_id, auth.uid(), v_plan.code, p_meses, v_hasta,
          nullif(trim(coalesce(p_nota, '')), ''));

  RETURN jsonb_build_object('email', v_email, 'plan', v_plan.name,
                            'meses', p_meses, 'hasta', v_hasta);
END $$;

REVOKE ALL ON FUNCTION public.ed_admin_conceder_plan(text, text, integer, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_admin_conceder_plan(text, text, integer, text) TO authenticated;

/** Retira un acceso concedido por error. Sin esto, un regalo mal dado sólo se
 *  puede deshacer entrando a la base a mano. */
CREATE OR REPLACE FUNCTION public.ed_admin_retirar_plan(p_email text)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid; v_email text;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  v_email := lower(trim(p_email));
  SELECT u.id INTO v_user_id FROM auth.users u WHERE lower(u.email) = v_email;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No hay cuenta con %', v_email; END IF;

  UPDATE ed_subscriptions
  SET status = 'inactive', current_period_end = now(), updated_at = now()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object('email', v_email, 'retirado', true);
END $$;

REVOKE ALL ON FUNCTION public.ed_admin_retirar_plan(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_admin_retirar_plan(text) TO authenticated;

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND proname LIKE 'ed_admin_%'
ORDER BY proname;
