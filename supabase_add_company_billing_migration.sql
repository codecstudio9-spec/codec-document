-- Fase 6 del modulo empresarial: cobro real del Plan Empresarial via
-- PayPal ($99.99/mes o $999.99/año, a la cuenta PayPal ya configurada
-- en PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET -- la misma usada por el resto
-- de la plataforma). 100% aditivo -- solo agrega columnas a companies,
-- no toca roles/members/api_keys/webhooks/contacts.
--
-- La verificacion y el otorgamiento del plan ocurren en la Edge Function
-- paypal-verify (igual que cualquier otro pago de esta plataforma):
-- el cliente nunca marca su propia empresa como pagada directamente.

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_active_until timestamptz;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_billing_cycle text
  CHECK (plan_billing_cycle IS NULL OR plan_billing_cycle IN ('monthly', 'annual'));

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'companies'
  AND column_name IN ('plan_active_until', 'plan_billing_cycle');
