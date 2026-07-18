-- FIX critico: is_admin_user() devolvia NULL (no false) cuando auth.email()
-- es NULL (llamadas con la llave anonima, sin JWT de usuario real). En
-- PL/pgSQL, `IF NOT is_admin_user()` con NULL nunca dispara el
-- RAISE EXCEPTION -- efecto: get_business_leads()/get_sales_summary()/etc.
-- devolvian datos reales a CUALQUIERA que llamara con la anon key.
-- Confirmado en vivo con curl antes de este fix.

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(auth.email(), '') = 'douglastabordasanchez@gmail.com';
$$;

-- Verificacion: debe devolver false llamado sin sesion real.
SELECT public.is_admin_user() AS should_be_false;
