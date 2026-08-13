-- Red de rescate para pagos que el webhook no alcanzó a confirmar.
--
-- ── Por qué hace falta ───────────────────────────────────────────────────
--
-- Wompi reintenta un evento hasta 3 veces en 24 horas. Si el webhook está
-- caído, mal configurado o con el secreto equivocado durante ese tiempo, el
-- evento se pierde para siempre: el contador pagó, Wompi tiene su dinero, y
-- en nuestra base el pago se queda en PENDING para siempre.
--
-- Eso no se puede resolver «volviendo a pagar». Hace falta poder mirar qué
-- pagos quedaron colgados y activarlos a mano, dejando constancia de que se
-- hizo a mano y de quién lo hizo.
--
-- Es exactamente el mismo riesgo el primer día que el día mil, pero el primer
-- día es cuando más probable es que el webhook esté mal puesto — que es
-- justo cuando peor sienta perder un cobro.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

-- Quién lo activó a mano y por qué. Un pago acreditado sin rastro es
-- indistinguible de uno regalado por error.
ALTER TABLE public.ed_payments
  ADD COLUMN IF NOT EXISTS confirmed_manually_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS confirmed_manually_at timestamptz,
  ADD COLUMN IF NOT EXISTS manual_note text;

/** Los pagos que se quedaron sin confirmar. Es la lista que hay que mirar
 *  cuando alguien escribe «pagué y no se me activó».
 *
 *  Se incluye el correo para poder cruzarlo con el comprobante de Wompi sin
 *  tener que ir a buscar el usuario por separado. */
CREATE OR REPLACE FUNCTION public.ed_pagos_pendientes(p_horas integer DEFAULT 72)
RETURNS TABLE (
  reference   text,
  email       text,
  plan_code   text,
  monto_cop   bigint,
  status      text,
  creado      timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  RETURN QUERY
  SELECT p.reference, u.email::text, p.plan_code,
         (p.amount_in_cents / 100)::bigint, p.status, p.created_at
  FROM ed_payments p
  JOIN auth.users u ON u.id = p.user_id
  WHERE p.status = 'PENDING'
    AND p.created_at > now() - make_interval(hours => greatest(1, coalesce(p_horas, 72)))
  ORDER BY p.created_at DESC;
END $$;

REVOKE ALL ON FUNCTION public.ed_pagos_pendientes(integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_pagos_pendientes(integer) TO authenticated;

/** Activa a mano un pago que Wompi cobró y el webhook no confirmó.
 *
 *  NO sustituye al webhook ni lo hace opcional: es para el caso en que el
 *  evento se perdió. Por eso exige la referencia exacta —la que aparece en el
 *  panel de Wompi— y no permite inventarse un pago que no existe en nuestra
 *  base: si la referencia no está, es que ese cobro nunca se abrió aquí.
 *
 *  Se apoya en ed_confirmar_pago(), que ya es idempotente. Si el evento de
 *  Wompi llega tarde después de haberlo activado a mano, no se acredita dos
 *  veces. */
CREATE OR REPLACE FUNCTION public.ed_confirmar_pago_manual(
  p_reference      text,
  p_transaction_id text DEFAULT NULL,
  p_nota           text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_res jsonb;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'No autorizado'; END IF;

  IF NOT EXISTS (SELECT 1 FROM ed_payments WHERE reference = p_reference) THEN
    RAISE EXCEPTION 'No existe ningún cobro con la referencia %', p_reference;
  END IF;

  v_res := public.ed_confirmar_pago(
    p_reference, p_transaction_id, 'APPROVED', 'MANUAL',
    jsonb_build_object('confirmado_a_mano', true, 'por', auth.uid(), 'nota', p_nota)
  );

  UPDATE ed_payments
  SET confirmed_manually_by = auth.uid(),
      confirmed_manually_at = now(),
      manual_note = p_nota
  WHERE reference = p_reference;

  RETURN v_res;
END $$;

REVOKE ALL ON FUNCTION public.ed_confirmar_pago_manual(text, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_confirmar_pago_manual(text, text, text) TO authenticated;

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('ed_pagos_pendientes', 'ed_confirmar_pago_manual')
ORDER BY proname;
