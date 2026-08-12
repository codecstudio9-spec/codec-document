-- Cupones de descuento creados desde el panel de administración.
--
-- ── Qué había antes ──────────────────────────────────────────────────────
--
-- `promo_codes` era todo-o-nada: un código liberaba un producto entero y la
-- Edge Function devolvía `amountPaid: 0`. No existía el concepto de «40% de
-- descuento», y los códigos se creaban a mano con un INSERT suelto contra la
-- base de datos.
--
-- ── Por qué discount_pct arranca en 100 ──────────────────────────────────
--
-- Porque 100% de descuento ES el comportamiento actual: gratis. Con
-- DEFAULT 100, todas las filas que ya existen quedan descritas exactamente
-- como se venían comportando, sin tener que tocarlas ni arriesgar que un
-- código en circulación cambie de significado al aplicar esta migración.
-- Cualquier otro valor por defecto habría reescrito en silencio el efecto de
-- cupones que ya están repartidos.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS discount_pct integer NOT NULL DEFAULT 100;

-- Se prohíbe el 0 a propósito: un cupón que no descuenta nada no es un cupón,
-- es un código roto que el cliente canjea creyendo que le sirvió.
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_discount_pct_check;
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_pct_check CHECK (discount_pct > 0 AND discount_pct <= 100);

-- Nota interna del admin («campaña de septiembre», «para el cliente X»). No se
-- le muestra nunca a quien canjea.
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- ══════════════════════════════════════════════════════════════════════
-- Crear un cupón
-- ══════════════════════════════════════════════════════════════════════
--
-- La duración llega en MINUTOS y la caducidad se calcula aquí, con el reloj
-- del servidor. Si el frontend mandara un `expires_at` ya resuelto, la
-- vigencia del cupón dependería de la hora del equipo de quien lo crea: un
-- portátil con la fecha mal puesta produce cupones caducados al nacer o
-- eternos. NULL = sin caducidad.
CREATE OR REPLACE FUNCTION public.admin_create_promo_code(
  p_code             text,
  p_product          text,
  p_discount_pct     integer,
  p_duration_minutes integer DEFAULT NULL,
  p_max_redemptions  integer DEFAULT NULL,
  p_label            text    DEFAULT NULL
)
RETURNS TABLE (
  code text, product text, discount_pct integer, expires_at timestamptz,
  max_redemptions integer, active boolean, created_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code text;
  v_expires timestamptz;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;

  -- Se normaliza igual que en el canje (upper + trim), para que «bono»,
  -- «Bono» y « BONO » no puedan convertirse en tres cupones distintos.
  v_code := upper(trim(p_code));

  IF v_code IS NULL OR length(v_code) < 3 THEN
    RAISE EXCEPTION 'El código debe tener al menos 3 caracteres';
  END IF;
  IF v_code !~ '^[A-Z0-9._-]+$' THEN
    RAISE EXCEPTION 'El código solo puede llevar letras, números, punto, guion y guion bajo';
  END IF;
  IF p_discount_pct IS NULL OR p_discount_pct < 1 OR p_discount_pct > 100 THEN
    RAISE EXCEPTION 'El descuento debe estar entre 1 y 100';
  END IF;
  IF EXISTS (SELECT 1 FROM public.promo_codes pc WHERE pc.code = v_code) THEN
    RAISE EXCEPTION 'Ya existe un cupón con ese código';
  END IF;

  IF p_duration_minutes IS NOT NULL AND p_duration_minutes > 0 THEN
    v_expires := now() + make_interval(mins => p_duration_minutes);
  END IF;

  INSERT INTO public.promo_codes AS pc
    (code, product, discount_pct, active, expires_at, max_redemptions, label, created_by)
  VALUES
    (v_code, p_product, p_discount_pct, true, v_expires, p_max_redemptions, p_label, auth.uid());

  RETURN QUERY
  SELECT pc.code, pc.product, pc.discount_pct, pc.expires_at,
         pc.max_redemptions, pc.active, pc.created_at
  FROM public.promo_codes pc WHERE pc.code = v_code;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_create_promo_code(text, text, integer, integer, integer, text) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- Listar los cupones
-- ══════════════════════════════════════════════════════════════════════
--
-- Esta función es la ÚNICA vía de lectura de la tabla: `promo_codes` tiene
-- RLS activo y ni una sola política, justamente para que nadie pueda
-- enumerar códigos válidos consultándola. Aquí se devuelve todo porque quien
-- llama ya demostró ser el administrador.
CREATE OR REPLACE FUNCTION public.admin_list_promo_codes()
RETURNS TABLE (
  code text, product text, discount_pct integer, active boolean,
  expires_at timestamptz, max_redemptions integer, redemption_count integer,
  unlimited_per_user boolean, label text, created_at timestamptz, expired boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT pc.code, pc.product, pc.discount_pct, pc.active,
         pc.expires_at, pc.max_redemptions, pc.redemption_count,
         pc.unlimited_per_user, pc.label, pc.created_at,
         (pc.expires_at IS NOT NULL AND pc.expires_at < now()) AS expired
  FROM public.promo_codes pc
  ORDER BY pc.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_promo_codes() TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- Activar / desactivar
-- ══════════════════════════════════════════════════════════════════════
--
-- Se desactiva, no se borra. Un cupón borrado se lleva por delante el
-- historial de quién lo canjeó (promo_redemptions apunta aquí con una clave
-- foránea), y ese historial es lo que permite saber después si una campaña
-- funcionó o si alguien abusó de un código.
CREATE OR REPLACE FUNCTION public.admin_set_promo_code_active(p_code text, p_active boolean)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  UPDATE public.promo_codes SET active = p_active WHERE code = upper(trim(p_code));
  RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_promo_code_active(text, boolean) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- Consulta del descuento para el cobro (NO administrativa)
-- ══════════════════════════════════════════════════════════════════════
--
-- La usa la Edge Function paypal-verify con el service role, para recalcular
-- el precio con descuento EN EL SERVIDOR antes de dar por buena una compra.
-- El importe rebajado no puede venir del navegador: quien manipule esa cifra
-- compraría a un céntimo.
--
-- No se concede a `authenticated` ni a `anon` a propósito. Un usuario que
-- pudiera llamarla probaría códigos a ciegas hasta encontrar uno válido, que
-- es exactamente el ataque que ya vigila check_and_log_promo_attempt.
CREATE OR REPLACE FUNCTION public.promo_discount_for(p_code text)
RETURNS TABLE (code text, product text, discount_pct integer, active boolean, expires_at timestamptz,
               max_redemptions integer, redemption_count integer, unlimited_per_user boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT pc.code, pc.product, pc.discount_pct, pc.active, pc.expires_at,
         pc.max_redemptions, pc.redemption_count, pc.unlimited_per_user
  FROM public.promo_codes pc
  WHERE pc.code = upper(trim(p_code));
$$;
REVOKE ALL ON FUNCTION public.promo_discount_for(text) FROM PUBLIC, anon, authenticated;

-- Verificación
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'promo_codes'
  AND column_name IN ('discount_pct', 'label', 'created_by');
