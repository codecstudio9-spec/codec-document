-- Fase 5 del modulo empresarial: SOLO arquitectura preparada para SSO
-- corporativo (Google Workspace / Microsoft Entra ID / Okta) -- sin
-- integracion real todavia, tal como se pidio explicitamente. El
-- dominio corporativo ya existia (companies.domain, Fase 1); esto
-- agrega donde guardar que proveedor usaria esa empresa el dia que se
-- implemente de verdad.

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sso_provider text
  CHECK (sso_provider IS NULL OR sso_provider IN ('google_workspace', 'azure_ad', 'okta'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS sso_enabled boolean NOT NULL DEFAULT false;

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'companies'
  AND column_name IN ('sso_provider', 'sso_enabled');
