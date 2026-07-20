-- Permite que un codigo promocional puntual (ej. el codigo maestro del
-- propio admin) se pueda canjear MAS DE UNA VEZ por la misma cuenta --
-- hoy TODOS los codigos estan limitados a una sola redencion por
-- (code, user_id) via una restriccion UNIQUE, sin excepcion.
--
-- No incluye ningun valor de codigo real -- ver el aviso de seguridad al
-- final de supabase_add_coupon_full_access_migration.sql: un codigo
-- maestro sin limite de usos no debe quedar committeado en texto plano
-- en un repo que puede volverse publico. El UPDATE real para activar
-- esto en un codigo especifico se corre aparte, sin guardarlo en un
-- archivo versionado.

ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS unlimited_per_user boolean NOT NULL DEFAULT false;

-- La restriccion UNIQUE(code, user_id) le impide a CUALQUIER codigo
-- tener mas de una fila de canje por usuario, sin excepcion posible --
-- se quita, y la logica de "ya lo canjeaste" pasa a vivir en la Edge
-- Function (chequeo explicito, solo para codigos con
-- unlimited_per_user = false), que es el unico lugar que ya podia
-- escribir en esta tabla de todas formas (no hay politica INSERT
-- directa para authenticated/anon).
ALTER TABLE public.promo_redemptions DROP CONSTRAINT IF EXISTS promo_redemptions_code_user_id_key;

-- Panel admin: historial de uso de CUALQUIER codigo (el admin escribe el
-- codigo que quiere revisar -- nunca queda un codigo real hardcodeado en
-- el frontend committeado a git).
CREATE OR REPLACE FUNCTION public.get_promo_code_usage(p_code text)
RETURNS TABLE (
  redeemed_at timestamptz, user_email text, ip_address text, product text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT r.redeemed_at, u.email, r.ip_address, r.product
  FROM public.promo_redemptions r
  JOIN auth.users u ON u.id = r.user_id
  WHERE r.code = upper(trim(p_code))
  ORDER BY r.redeemed_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_promo_code_usage(text) TO authenticated;

-- Verificacion
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'unlimited_per_user';
