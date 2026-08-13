-- Plan de pago del motor DIAN, cobrado con Wompi.
--
-- ── Por qué NO reutiliza el plan de documentos ───────────────────────────
--
-- La aplicación ya tiene un plan (users.plan_status/plan_type/plan_expires_at
-- + user_credits), que se paga con PayPal en dólares y da acceso a documentos
-- y firmas. Meter aquí el plan del motor DIAN habría sido más corto de
-- escribir y estaría mal: un contador que paga $52.900 por procesar sus XML
-- se llevaría de regalo el plan completo de documentos, y al revés, alguien
-- con el plan de documentos entraría gratis al motor. Son dos productos, dos
-- precios y dos monedas.
--
-- Por eso el plan del motor vive en ed_subscriptions, con la misma familia
-- ed_* que todo lo demás del módulo.
--
-- ── Por qué el precio vive en app_settings y no en el código ─────────────
--
-- Wompi cobra comisión (~2,65–2,99 % + IVA) y el precio ya subió una vez por
-- eso, de 50.000 a 52.900. Un precio quemado en una Edge Function obliga a
-- desplegar para moverlo; en app_settings se cambia desde el panel, y el
-- plan anual se puede encender el día que se decida sin tocar código.
--
-- Lo que NO puede vivir en el cliente es la CIFRA que se le pide a Wompi: si
-- el navegador dijera cuánto cobrar, cualquiera pagaría $100 por el mes. Por
-- eso ed_crear_pago() calcula el importe en la base y la Edge Function firma
-- sobre ese importe, no sobre el que le pasen.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

-- ── Precios ───────────────────────────────────────────────────────────────

INSERT INTO public.app_settings (key, value) VALUES
  ('dian_plan_precio_cop', '52900'),
  -- Vacío = no se ofrece. El plan anual está pendiente de decisión (la
  -- referencia del mercado son ~500.000 COP/año); encenderlo es escribir la
  -- cifra aquí desde el panel, sin desplegar nada.
  ('dian_plan_precio_anual_cop', ''),
  ('dian_plan_gratis_mes', '200')
ON CONFLICT (key) DO NOTHING;

-- ── Suscripción ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_subscriptions (
  user_id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status             text NOT NULL DEFAULT 'inactive'
                     CHECK (status IN ('inactive', 'active')),
  -- Hasta cuándo está pagado. Es la única fuente de verdad del acceso: no se
  -- guarda un booleano "activo" que pueda quedar desincronizado con la fecha.
  current_period_end timestamptz,
  last_payment_at    timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_subscriptions ENABLE ROW LEVEL SECURITY;

-- Leer lo propio, y nada más. Escribir sólo desde funciones SECURITY DEFINER:
-- si el usuario pudiera hacer UPDATE, se regalaría el plan con una línea.
DROP POLICY IF EXISTS ed_subscriptions_select_own ON public.ed_subscriptions;
CREATE POLICY ed_subscriptions_select_own ON public.ed_subscriptions
  FOR SELECT USING (user_id = auth.uid());

-- ── Pagos ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ed_payments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- La referencia que se le manda a Wompi. Única, porque es la llave con la
  -- que vuelve el evento y con la que se evita acreditar dos veces.
  reference            text NOT NULL UNIQUE,
  wompi_transaction_id text UNIQUE,
  amount_in_cents      bigint NOT NULL CHECK (amount_in_cents > 0),
  currency             text NOT NULL DEFAULT 'COP',
  months               integer NOT NULL DEFAULT 1 CHECK (months BETWEEN 1 AND 24),
  status               text NOT NULL DEFAULT 'PENDING'
                       CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR')),
  payment_method       text,
  -- El evento crudo de Wompi. Cuando un cobro se discute, el que gana la
  -- discusión es quien conserva lo que llegó, no quien lo resumió.
  raw                  jsonb,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ed_payments_user_idx ON public.ed_payments (user_id, created_at DESC);

ALTER TABLE public.ed_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ed_payments_select_own ON public.ed_payments;
CREATE POLICY ed_payments_select_own ON public.ed_payments
  FOR SELECT USING (user_id = auth.uid());

-- ── ¿Tiene plan? ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ed_plan_activo(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM ed_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end IS NOT NULL
      AND current_period_end > now()
  );
$$;

REVOKE ALL ON FUNCTION public.ed_plan_activo(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_plan_activo(uuid) TO authenticated, service_role;

/** Lo que la pantalla necesita saber del plan. Devuelve también el precio,
    para que el botón no lo lleve escrito: el día que cambie, cambia solo. */
CREATE OR REPLACE FUNCTION public.ed_plan_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sub    record;
  v_anual  text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  SELECT * INTO v_sub FROM ed_subscriptions WHERE user_id = auth.uid();
  SELECT nullif(trim(coalesce((SELECT value FROM app_settings WHERE key = 'dian_plan_precio_anual_cop'), '')), '')
    INTO v_anual;

  RETURN jsonb_build_object(
    'activo',        public.ed_plan_activo(),
    'hasta',         v_sub.current_period_end,
    'ultimo_pago',   v_sub.last_payment_at,
    'precio_mes',    coalesce((SELECT value FROM app_settings WHERE key = 'dian_plan_precio_cop'), '52900')::bigint,
    'precio_anual',  v_anual::bigint,
    'gratis_mes',    coalesce((SELECT value FROM app_settings WHERE key = 'dian_plan_gratis_mes'), '200')::int
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_plan_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_plan_estado() TO authenticated;

-- ── Iniciar un pago ───────────────────────────────────────────────────────

/** Crea el pago pendiente y devuelve QUÉ hay que cobrar. La Edge Function
    firma exactamente esto: el importe nunca viaja desde el navegador.

    La referencia lleva el id del pago, que es un uuid: no se puede adivinar
    la referencia de otro para reclamar su pago. */
CREATE OR REPLACE FUNCTION public.ed_crear_pago(p_meses integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_precio_mes   bigint;
  v_precio_anual text;
  v_total        bigint;
  v_id           uuid := gen_random_uuid();
  v_ref          text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  IF p_meses IS NULL OR p_meses NOT IN (1, 12) THEN
    RAISE EXCEPTION 'Sólo hay plan mensual o anual';
  END IF;

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_plan_precio_cop'), '52900')::bigint
    INTO v_precio_mes;
  SELECT nullif(trim(coalesce((SELECT value FROM app_settings WHERE key = 'dian_plan_precio_anual_cop'), '')), '')
    INTO v_precio_anual;

  IF p_meses = 12 THEN
    IF v_precio_anual IS NULL THEN
      RAISE EXCEPTION 'El plan anual no está disponible';
    END IF;
    v_total := v_precio_anual::bigint;
  ELSE
    v_total := v_precio_mes;
  END IF;

  IF v_total <= 0 THEN RAISE EXCEPTION 'Precio no configurado'; END IF;

  -- Wompi trabaja en centavos. El peso colombiano no usa decimales en la
  -- práctica, pero la API los exige igual: 52.900 pesos son 5.290.000.
  v_ref := 'dian-' || replace(v_id::text, '-', '');

  INSERT INTO ed_payments (id, user_id, reference, amount_in_cents, currency, months, status)
  VALUES (v_id, auth.uid(), v_ref, v_total * 100, 'COP', p_meses, 'PENDING');

  RETURN jsonb_build_object(
    'reference',       v_ref,
    'amount_in_cents', v_total * 100,
    'currency',        'COP',
    'meses',           p_meses
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_crear_pago(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_crear_pago(integer) TO authenticated;

-- ── Confirmar un pago ─────────────────────────────────────────────────────

/** La llama la Edge Function del webhook, ya con la firma de Wompi
    verificada, usando service_role. No la puede llamar un usuario: quien
    pudiera invocarla se activaría el plan solo.

    Es idempotente. Wompi reintenta los eventos que no reciben 200, así que
    el mismo pago APROBADO llega varias veces; sin esta guarda, cada reintento
    regalaría otro mes. */
CREATE OR REPLACE FUNCTION public.ed_confirmar_pago(
  p_reference      text,
  p_transaction_id text,
  p_status         text,
  p_method         text DEFAULT NULL,
  p_raw            jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pago  record;
  v_desde timestamptz;
  v_hasta timestamptz;
BEGIN
  SELECT * INTO v_pago FROM ed_payments WHERE reference = p_reference FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'motivo', 'referencia_desconocida');
  END IF;

  IF v_pago.status = 'APPROVED' THEN
    RETURN jsonb_build_object('ok', true, 'motivo', 'ya_procesado',
                              'hasta', (SELECT current_period_end FROM ed_subscriptions WHERE user_id = v_pago.user_id));
  END IF;

  UPDATE ed_payments
  SET status = CASE WHEN p_status IN ('APPROVED', 'DECLINED', 'VOIDED', 'ERROR') THEN p_status ELSE 'ERROR' END,
      wompi_transaction_id = coalesce(p_transaction_id, wompi_transaction_id),
      payment_method = coalesce(p_method, payment_method),
      raw = coalesce(p_raw, raw),
      updated_at = now()
  WHERE reference = p_reference;

  IF p_status <> 'APPROVED' THEN
    RETURN jsonb_build_object('ok', true, 'motivo', 'no_aprobado', 'status', p_status);
  END IF;

  -- Se parte de lo que le quede vigente, no de hoy: quien renueva antes de
  -- que se le venza no puede perder los días que ya pagó.
  SELECT greatest(coalesce(current_period_end, now()), now()) INTO v_desde
  FROM ed_subscriptions WHERE user_id = v_pago.user_id;
  v_desde := coalesce(v_desde, now());
  v_hasta := v_desde + make_interval(months => v_pago.months);

  INSERT INTO ed_subscriptions (user_id, status, current_period_end, last_payment_at, updated_at)
  VALUES (v_pago.user_id, 'active', v_hasta, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET status = 'active',
        current_period_end = v_hasta,
        last_payment_at = now(),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'motivo', 'activado', 'hasta', v_hasta);
END $$;

REVOKE ALL ON FUNCTION public.ed_confirmar_pago(text, text, text, text, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ed_confirmar_pago(text, text, text, text, jsonb) TO service_role;

-- ── El plan levanta los topes de la prueba ────────────────────────────────
--
-- Quien paga no puede toparse con «la prueba alcanzó su capacidad». Cobrarle
-- a alguien y después cerrarle la puerta es la peor versión posible de este
-- producto, así que el plan activo vale lo mismo que ser administrador para
-- los tres límites: el personal, el global y el cierre por fecha.

CREATE OR REPLACE FUNCTION public.ed_beta_estado()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_limite_persona int;
  v_limite_global  int;
  v_cierre         timestamptz;
  v_global         int;
  v_persona        int;
  v_personas       int;
  v_admin          boolean;
  v_plan           boolean;
  v_hasta          timestamptz;
  v_inicio_mes     timestamptz := date_trunc('month', now());
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  v_admin := public.is_admin_user();
  v_plan  := public.ed_plan_activo();

  SELECT current_period_end INTO v_hasta FROM ed_subscriptions WHERE user_id = auth.uid();

  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_limite_persona'), '100')::int
    INTO v_limite_persona;
  SELECT coalesce((SELECT value FROM app_settings WHERE key = 'dian_beta_limite_global'), '2000')::int
    INTO v_limite_global;
  SELECT coalesce(nullif((SELECT value FROM app_settings WHERE key = 'dian_beta_cierre'), ''), NULL)::timestamptz
    INTO v_cierre;

  SELECT coalesce(sum(processed), 0) INTO v_global FROM ed_imports;
  SELECT coalesce(sum(processed), 0) INTO v_persona FROM ed_imports
    WHERE owner_user_id = auth.uid() AND created_at >= v_inicio_mes;
  SELECT count(DISTINCT owner_user_id) INTO v_personas FROM ed_imports WHERE processed > 0;

  RETURN jsonb_build_object(
    'limite_persona', v_limite_persona,
    'limite_global',  v_limite_global,
    'cierre',         v_cierre,
    'usados_persona', v_persona,
    'usados_global',  v_global,
    'personas',       v_personas,
    'cerrada',        (v_cierre IS NOT NULL AND now() > v_cierre),
    'llena',          (v_global >= v_limite_global),
    'ilimitado',      (v_admin OR v_plan),
    'plan_activo',    v_plan,
    'plan_hasta',     v_hasta,
    'puede_descargar', public.ed_descarga_permitida(),
    'descarga_abierta',
      coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_abierta'), 'false') = 'true',
    'descarga_permitidos',
      CASE WHEN v_admin
        THEN coalesce((SELECT value FROM app_settings WHERE key = 'dian_descarga_permitidos'), '')
        ELSE NULL END
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_estado() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_estado() TO authenticated;

-- El panel puede mover los precios sin desplegar.
CREATE OR REPLACE FUNCTION public.ed_beta_configurar(p_clave text, p_valor text)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_clave NOT IN (
    'dian_beta_limite_persona',
    'dian_beta_limite_global',
    'dian_beta_cierre',
    'dian_descarga_permitidos',
    'dian_descarga_abierta',
    'dian_plan_precio_cop',
    'dian_plan_precio_anual_cop',
    'dian_plan_gratis_mes'
  ) THEN
    RAISE EXCEPTION 'Parámetro no permitido: %', p_clave;
  END IF;

  INSERT INTO app_settings (key, value, updated_at)
  VALUES (p_clave, p_valor, now())
  ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now();
END $$;

REVOKE ALL ON FUNCTION public.ed_beta_configurar(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_beta_configurar(text, text) TO authenticated;

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('ed_crear_pago', 'ed_confirmar_pago', 'ed_plan_activo', 'ed_plan_estado')
ORDER BY proname;
