-- La verificación en dos pasos para admins pasa de OBLIGATORIA a OPCIONAL.
-- Antes, AdminMfaGate.tsx bloqueaba todo el panel en cuanto la cuenta era
-- admin, sin ninguna salida si el código TOTP dejaba de coincidir (reloj del
-- teléfono desincronizado, o un reintento de inscripción que generó un
-- secreto nuevo sin que la persona volviera a escanear el QR). Ahora el
-- bloqueo por 2FA solo se activa si el propio admin lo prende explícitamente
-- desde Configuración — por defecto (sin fila en esta tabla) está apagado.

CREATE TABLE IF NOT EXISTS public.admin_mfa_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enforce_login boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_mfa_preferences ENABLE ROW LEVEL SECURITY;

-- Mismo patrón que admin_secrets: sin policies para el cliente, todo el
-- acceso pasa por las funciones SECURITY DEFINER de abajo.
REVOKE ALL ON public.admin_mfa_preferences FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_mfa_login_enforced()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT enforce_login FROM public.admin_mfa_preferences WHERE user_id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.set_mfa_login_enforced(p_enforce boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO public.admin_mfa_preferences (user_id, enforce_login, updated_at)
  VALUES (auth.uid(), p_enforce, now())
  ON CONFLICT (user_id) DO UPDATE
    SET enforce_login = excluded.enforce_login,
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_mfa_login_enforced() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_mfa_login_enforced(boolean) TO authenticated;

-- Limpieza del bloqueo actual: borra cualquier factor TOTP existente en la
-- cuenta admin real para que, si más adelante decide activarlo de nuevo,
-- empiece desde un QR fresco (evita el secreto viejo guardado en el
-- teléfono que ya no coincide con el servidor).
DELETE FROM auth.mfa_factors
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'douglastabordasanchez@gmail.com');
