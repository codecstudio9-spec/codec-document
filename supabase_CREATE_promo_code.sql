-- ============================================================
-- CODEC DOCUMENT — Crea el código promocional 1022925002 (100% descuento)
-- Ejecutar en https://yxzchnldmfsgdtbjurey.supabase.co -> SQL Editor
--
-- product = 'sub_monthly' -> otorga el Plan Mensual completo
-- (documentos ilimitados + firmas ilimitadas por 30 días), que es lo
-- más cercano en el catálogo actual a "todos los documentos". Se
-- redime gratis, sin pasar por PayPal en absoluto — la validación es
-- 100% en el Edge Function paypal-verify, requiere que el usuario esté
-- logueado (auth.uid()), y queda registrado en promo_redemptions para
-- que la MISMA cuenta no pueda usarlo dos veces.
--
-- Si en vez de esto quieres que otorgue acceso permanente/ilimitado en
-- el tiempo (no solo 30 días), dime y agrego una rama nueva en
-- grantProduct() del Edge Function para ese caso — hoy 'sub_monthly'
-- siempre expira a los 30 días como cualquier suscripción mensual real.
-- ============================================================

-- Guard con NOT EXISTS en vez de ON CONFLICT (code) -- no se confirmó
-- que `code` tenga una restricción UNIQUE a nivel de base de datos, y
-- ON CONFLICT sin esa restricción da error en vez de insertar.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.promo_codes WHERE code = '1022925002') THEN
    UPDATE public.promo_codes
    SET product = 'sub_monthly', active = true
    WHERE code = '1022925002';
  ELSE
    INSERT INTO public.promo_codes (code, product, active, max_redemptions, expires_at)
    VALUES ('1022925002', 'sub_monthly', true, NULL, NULL);
  END IF;
END $$;

-- Verificación
SELECT code, product, active, max_redemptions, redemption_count, expires_at, created_at
FROM public.promo_codes
WHERE code = '1022925002';
