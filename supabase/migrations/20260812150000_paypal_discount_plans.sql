-- Planes de PayPal con precio rebajado, para que un bono parcial también
-- funcione sobre una suscripción recurrente.
--
-- ── Por qué hace falta una tabla y no basta con un descuento ─────────────
--
-- En un pago único el importe va en la orden, así que rebajarlo es cambiar
-- una cifra. En una suscripción de PayPal el importe NO está en la orden:
-- está en el Billing Plan, identificado por su plan_id. No existe forma de
-- decirle a PayPal «cobra este plan con un 40% menos»; hay que crear otro
-- plan, con su propio precio, y suscribir a la persona a ese.
--
-- Esta tabla es el registro de los planes ya creados en PayPal, para dos
-- cosas:
--   1. No crear un plan nuevo cada vez que alguien aplica el mismo bono. Los
--      planes en PayPal no se borran, sólo se desactivan, así que crearlos
--      sin control deja la cuenta llena de basura imposible de limpiar.
--   2. Que paypal-verify sepa que ese plan_id «raro» es legítimo. Sin este
--      registro rechazaría la suscripción por no coincidir con el plan
--      oficial, que es exactamente lo que debe hacer con un plan que no
--      reconoce.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

CREATE TABLE IF NOT EXISTS public.paypal_discount_plans (
  -- Producto interno ('sub_monthly', 'sub_semiannual', 'sub_annual')
  product      text    NOT NULL,
  discount_pct integer NOT NULL CHECK (discount_pct > 0 AND discount_pct < 100),
  -- El plan_id que devolvió PayPal al crearlo.
  plan_id      text    NOT NULL,
  -- Lo que ese plan cobra de verdad. Se guarda para poder comprobar después
  -- que el precio del plan sigue siendo el que creemos: si alguien lo
  -- cambiara desde el panel de PayPal, aquí quedaría la discrepancia.
  amount       numeric(10,2) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product, discount_pct)
);

CREATE INDEX IF NOT EXISTS paypal_discount_plans_plan_idx
  ON public.paypal_discount_plans (plan_id);

ALTER TABLE public.paypal_discount_plans ENABLE ROW LEVEL SECURITY;
-- Sin política: nadie lee esta tabla desde el navegador. La Edge Function
-- entra con el service role, que salta RLS.

-- ══════════════════════════════════════════════════════════════════════
-- Consulta para el frontend
-- ══════════════════════════════════════════════════════════════════════
--
-- El navegador SÍ necesita el plan_id rebajado: es lo que le pasa al SDK de
-- PayPal para abrir la suscripción. No es un secreto —un plan_id se ve en
-- cualquier petición del checkout— pero se sirve por función y no por SELECT
-- directo para no abrir la tabla entera.
CREATE OR REPLACE FUNCTION public.discount_plan_for(p_product text, p_discount_pct integer)
RETURNS TABLE (plan_id text, amount numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.plan_id, d.amount
  FROM public.paypal_discount_plans d
  WHERE d.product = p_product AND d.discount_pct = p_discount_pct;
$$;
GRANT EXECUTE ON FUNCTION public.discount_plan_for(text, integer) TO authenticated;

-- Para el panel: qué planes rebajados existen ya.
CREATE OR REPLACE FUNCTION public.admin_list_discount_plans()
RETURNS TABLE (product text, discount_pct integer, plan_id text, amount numeric, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT d.product, d.discount_pct, d.plan_id, d.amount, d.created_at
  FROM public.paypal_discount_plans d
  ORDER BY d.product, d.discount_pct;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_discount_plans() TO authenticated;

-- Verificación
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'paypal_discount_plans';
