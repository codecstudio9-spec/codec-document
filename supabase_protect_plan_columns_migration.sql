-- ============================================================
-- CODEC DOCUMENT — Proteger columnas de plan/suscripción en public.users
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- PROBLEMA: la política "users_update_own" (supabase_credits_migration.sql)
-- permite `FOR UPDATE USING (auth.uid() = id)` sin restringir qué columnas
-- se pueden cambiar. Como subscription-service.ts hace
-- `supabase.from('users').update({...})` directamente desde el navegador
-- para guardar la firma guardada del usuario (saved_signature_url), la
-- misma política deja que CUALQUIER usuario autenticado ejecute en devtools:
--   supabase.from('users').update({ plan_status:'active', plan_type:'sub_annual',
--     plan_expires_at:'2099-01-01' }).eq('id', auth.uid())
-- y obtenga suscripción activa sin pagar nada.
--
-- Postgres/Supabase no tiene RLS a nivel de columna nativo, así que la
-- solución estándar es un trigger BEFORE UPDATE: si la petición NO viene
-- del service role (es decir, viene del navegador), las columnas de plan
-- se fuerzan a mantener su valor anterior, sin importar qué mandó el
-- cliente. La Edge Function paypal-verify sí usa el service role, así
-- que sus escrituras pasan sin tocar.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_plan_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    NEW.plan_status            := OLD.plan_status;
    NEW.plan_type               := OLD.plan_type;
    NEW.plan_expires_at         := OLD.plan_expires_at;
    NEW.paypal_subscription_id  := OLD.paypal_subscription_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_plan_columns_trigger ON public.users;
CREATE TRIGGER protect_plan_columns_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_plan_columns();
