-- admin_get_secret_status() está bien para el panel de administración
-- (solo Douglas lo usa), pero CUALQUIER usuario que envía un documento a
-- firmar necesita saber si Certicámara está disponible para decidir qué
-- opción mostrar — no solo el admin. Esta función es de solo lectura,
-- nunca devuelve el valor real, y no requiere is_admin_user().
CREATE OR REPLACE FUNCTION public.is_certicamara_configured()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_secrets WHERE key = 'CERTICAMARA_API_KEY');
$$;
GRANT EXECUTE ON FUNCTION public.is_certicamara_configured() TO authenticated, anon;
