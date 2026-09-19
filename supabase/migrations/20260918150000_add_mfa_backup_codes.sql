-- Códigos de respaldo para 2FA de administrador (AdminMfaGate.tsx) —
-- sin esto, perder el teléfono con la app autenticadora deja la cuenta
-- admin sin forma de entrar. Solo códigos de un solo uso, generados y
-- vistos UNA vez; se guarda su hash, nunca el texto plano.
--
-- Hashing con sha256() del núcleo de Postgres (disponible desde la v11,
-- en pg_catalog) — NO pgcrypto/digest(): ver
-- 20260814040000_dian_token_buzon_sin_pgcrypto.sql, que documenta que
-- pgcrypto vive en el esquema `extensions` y una función SECURITY DEFINER
-- con `search_path = public` (obligatorio por seguridad) simplemente no
-- la encuentra en este proyecto.

CREATE TABLE IF NOT EXISTS public.admin_mfa_backup_codes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash  text NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_mfa_backup_codes ENABLE ROW LEVEL SECURITY;
-- Ninguna política de SELECT/INSERT/UPDATE directa a propósito — todo el
-- acceso pasa por las funciones SECURITY DEFINER de abajo, para que un
-- código nunca sea legible ni siquiera por su propio dueño después de
-- generado (ya lo vio una vez, en pantalla, al crearlo).
REVOKE ALL ON public.admin_mfa_backup_codes FROM anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_admin_mfa_backup_codes_user ON public.admin_mfa_backup_codes(user_id);

-- Genera 10 códigos nuevos para QUIEN LLAMA (auth.uid()) — nunca puede
-- generarlos para otra cuenta, así que no hace falta comprobar isAdmin
-- aquí aparte. Invalida (borra) cualquier código sin usar de una tanda
-- anterior primero, para que solo exista un juego vigente a la vez.
CREATE OR REPLACE FUNCTION public.generate_mfa_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_codes text[] := '{}';
  v_code  text;
  v_hex   text;
  i       int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sin sesión'; END IF;

  DELETE FROM public.admin_mfa_backup_codes WHERE user_id = auth.uid() AND used_at IS NULL;

  FOR i IN 1..10 LOOP
    v_hex  := replace(gen_random_uuid()::text, '-', '');
    v_code := upper(substr(v_hex, 1, 4) || '-' || substr(v_hex, 5, 4));
    v_codes := array_append(v_codes, v_code);
    INSERT INTO public.admin_mfa_backup_codes (user_id, code_hash)
    VALUES (auth.uid(), encode(sha256(convert_to(v_code, 'utf8')), 'hex'));
  END LOOP;

  RETURN v_codes; -- el único momento en que existen en texto plano
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_mfa_backup_codes() TO authenticated;

-- Canjea un código: si es válido y no usado, lo marca usado y borra
-- TODOS los factores TOTP de la cuenta — así AdminMfaGate cae de vuelta
-- a "configurar 2FA desde cero" (la pantalla que ya existe), en vez de
-- inventar una forma de fingir una sesión aal2 de Supabase. Toca
-- auth.mfa_factors directamente (ese esquema lo administra GoTrue, no
-- nosotros); es un DELETE acotado sin más efectos secundarios, pero
-- vale la pena tenerlo presente si una futura versión de Supabase
-- cambia esa tabla.
CREATE OR REPLACE FUNCTION public.redeem_mfa_backup_code(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash    text := encode(sha256(convert_to(upper(trim(p_code)), 'utf8')), 'hex');
  v_row_id  uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;

  SELECT id INTO v_row_id
  FROM public.admin_mfa_backup_codes
  WHERE user_id = auth.uid() AND code_hash = v_hash AND used_at IS NULL
  LIMIT 1;

  IF v_row_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.admin_mfa_backup_codes SET used_at = now() WHERE id = v_row_id;
  DELETE FROM auth.mfa_factors WHERE user_id = auth.uid();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_mfa_backup_code(text) TO authenticated;

-- Cuántos códigos sin usar le quedan a quien llama — para mostrar
-- "te quedan 3 códigos" en Configuración sin volver a generar la tanda.
CREATE OR REPLACE FUNCTION public.count_unused_mfa_backup_codes()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT count(*)::int FROM public.admin_mfa_backup_codes WHERE user_id = auth.uid() AND used_at IS NULL;
$$;

GRANT EXECUTE ON FUNCTION public.count_unused_mfa_backup_codes() TO authenticated;
