-- ============================================================
-- CODEC DOCUMENT — Ver los codigos promocionales que existen hoy
-- Ejecutar en https://yxzchnldmfsgdtbjurey.supabase.co -> SQL Editor
-- ============================================================

SELECT
  code,
  product,
  active,
  max_redemptions,
  redemption_count,
  (max_redemptions IS NULL OR redemption_count < max_redemptions) AS usos_disponibles,
  expires_at,
  (expires_at IS NULL OR expires_at > now()) AS no_expirado,
  created_at
FROM public.promo_codes
ORDER BY created_at DESC;
