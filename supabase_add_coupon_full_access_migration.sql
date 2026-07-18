-- Extiende el sistema de cupones YA EXISTENTE (public.promo_codes +
-- public.promo_redemptions + la Edge Function paypal-verify) en vez de
-- crear una tabla coupon_codes paralela -- promo_codes ya cubre
-- exactamente lo mismo (code, product/plan_scope, active, expires_at,
-- max_redemptions, redemption_count). Esto es 100% aditivo.
--
-- Run this ONCE in a blank SQL Editor tab.

-- Auditoria de quien creo el cupon (para el futuro panel de admin).
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Columnas para el futuro tipo de cupon "descuento" (porcentaje o monto
-- fijo) -- la logica de aplicar el descuento en el checkout todavia no
-- esta conectada (queda para una siguiente iteracion), pero el esquema
-- ya queda listo sin otra migracion despues.
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS discount_type text; -- 'percent' | 'fixed' | null (null = acceso completo gratis, como hoy)
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS discount_value numeric;

-- Auditoria de canje: IP + que producto/plan quedo activado, ademas de
-- usuario y fecha que promo_redemptions ya guardaba.
ALTER TABLE public.promo_redemptions ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.promo_redemptions ADD COLUMN IF NOT EXISTS product text;

-- Verificacion rapida.
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'promo_codes'
  AND column_name IN ('created_by', 'discount_type', 'discount_value');

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'promo_redemptions'
  AND column_name IN ('ip_address', 'product');

-- El codigo administrativo real (FULL_ACCESS o el nombre que elijas) NO
-- se incluye en este archivo a proposito -- este repo se sube a un
-- GitHub que puede volverse publico, y un codigo maestro sin limite de
-- usos ni vencimiento no debe quedar committeado en texto plano donde
-- cualquiera con acceso al repo pueda leerlo y canjearlo. Corre el
-- INSERT por separado, directo en el SQL Editor, sin guardarlo en un
-- archivo versionado -- Claude te lo dio aparte en el chat.
