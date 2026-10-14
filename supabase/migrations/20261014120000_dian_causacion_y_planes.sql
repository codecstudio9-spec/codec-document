-- Causación contable + planes nuevos (2026-10-14).
--
-- ── Planes ────────────────────────────────────────────────────────────────
-- Gratis: 50 XML al mes, sin tramos (antes 100 en tramos de 50 cada 72 h).
-- De pago: Básico $30.000, Profesional $50.000, Empresarial $90.000. Lo que
-- se compra es cupo; las funciones son las mismas en todos (la recepción por
-- correo sigue siendo sólo de pago, ver ed_email_disponible).
--
-- ── Causación ─────────────────────────────────────────────────────────────
-- Dos tablas, una por empresa que lleva el contador (identificada por su NIT
-- sin dígito de verificación):
--   ed_causacion_config  las cuentas del plan de cuentas que usa esa empresa
--   ed_causacion_reglas  lo aprendido por tercero: a qué cuenta va cada
--                        proveedor/cliente y qué retenciones se le practican
-- Lo aprendido se guarda para que el mes siguiente la causación salga sola:
-- es lo que convierte la función en una razón para volver cada mes.

UPDATE public.ed_plans
   SET monthly_xml_limit = 50,
       tranche_limit     = NULL,
       promo_xml_limit   = NULL,
       promo_until       = NULL,
       updated_at        = now()
 WHERE code = 'gratis';

UPDATE public.ed_plans SET price_cop = 30000, monthly_xml_limit = 1000,  updated_at = now() WHERE code = 'basico';
UPDATE public.ed_plans SET price_cop = 50000, monthly_xml_limit = 3000,  updated_at = now() WHERE code = 'profesional';
UPDATE public.ed_plans SET price_cop = 90000, monthly_xml_limit = 10000, updated_at = now() WHERE code = 'empresarial';

CREATE TABLE IF NOT EXISTS public.ed_causacion_config (
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_nit   text NOT NULL CHECK (empresa_nit ~ '^[0-9]{3,15}$'),
  empresa_nombre text,
  -- { "gasto_defecto": "519595", "proveedores": "220505", ... }. jsonb y no
  -- columnas porque cada contador nombra distinto sus subcuentas y la lista
  -- de cuentas configurables va a crecer sin migraciones.
  cuentas       jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_user_id, empresa_nit)
);

CREATE TABLE IF NOT EXISTS public.ed_causacion_reglas (
  owner_user_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_nit    text NOT NULL CHECK (empresa_nit ~ '^[0-9]{3,15}$'),
  tercero_nit    text NOT NULL CHECK (tercero_nit ~ '^[0-9A-Za-z]{3,20}$'),
  tercero_nombre text,
  cuenta         text CHECK (cuenta IS NULL OR cuenta ~ '^[0-9]{1,12}$'),
  centro_costo   text,
  concepto_retencion text,                         -- compras | servicios | honorarios | arrendamientos | ninguno
  retefuente_pct numeric(6,3) CHECK (retefuente_pct IS NULL OR (retefuente_pct >= 0 AND retefuente_pct <= 100)),
  reteiva_pct    numeric(6,3) CHECK (reteiva_pct    IS NULL OR (reteiva_pct    >= 0 AND reteiva_pct    <= 100)),
  reteica_xmil   numeric(7,3) CHECK (reteica_xmil   IS NULL OR (reteica_xmil   >= 0 AND reteica_xmil   <= 100)),
  iva_al_gasto   boolean NOT NULL DEFAULT false,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_user_id, empresa_nit, tercero_nit)
);

ALTER TABLE public.ed_causacion_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ed_causacion_reglas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ed_causacion_config_own ON public.ed_causacion_config;
CREATE POLICY ed_causacion_config_own ON public.ed_causacion_config
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS ed_causacion_reglas_own ON public.ed_causacion_reglas;
CREATE POLICY ed_causacion_reglas_own ON public.ed_causacion_reglas
  FOR ALL TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ed_causacion_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ed_causacion_reglas TO authenticated;
