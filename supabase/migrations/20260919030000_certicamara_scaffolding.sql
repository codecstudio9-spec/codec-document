-- Infraestructura para Certicámara — el admin pega su API key desde el
-- panel (no por CLI), y la plataforma decide firma electrónica simple vs
-- firma digital certificada por documento. El API real de Certicámara
-- (endpoints, payloads) queda pendiente hasta tener su documentación —
-- ver supabase/functions/certicamara-sign/index.ts para el punto exacto
-- donde se conecta.
--
-- admin_secrets es DELIBERADAMENTE una tabla nueva, no una fila más en
-- app_settings: app_settings tiene "SELECT USING (true)" — legible por
-- cualquier visitante anónimo, correcto para el ID del Pixel de Meta
-- (tiene que llegar al navegador para inyectar el script), un desastre
-- de seguridad para una API key real. Aquí no hay política de SELECT en
-- absoluto para el cliente: el valor real solo lo lee la Edge Function,
-- con la service-role key (bypassa RLS, igual que el resto de funciones
-- de este proyecto). El panel de admin nunca vuelve a ver el valor
-- después de guardarlo — mismo patrón que un campo de contraseña.

CREATE TABLE IF NOT EXISTS public.admin_secrets (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;
-- Sin políticas de SELECT/INSERT/UPDATE/DELETE para ningún rol de
-- cliente -- todo pasa por las funciones SECURITY DEFINER de abajo.
REVOKE ALL ON public.admin_secrets FROM anon, authenticated;

-- Guarda o reemplaza un secreto (solo admin de plataforma).
CREATE OR REPLACE FUNCTION public.admin_set_secret(p_key text, p_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_key IS NULL OR trim(p_key) = '' THEN
    RAISE EXCEPTION 'Key is required';
  END IF;
  IF p_value IS NULL OR trim(p_value) = '' THEN
    RAISE EXCEPTION 'Value is required';
  END IF;

  INSERT INTO public.admin_secrets (key, value)
  VALUES (trim(p_key), trim(p_value))
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_secret(text, text) TO authenticated;

-- Borra un secreto (para "desactivar" Certicámara sin dejar una clave
-- vieja/rotada dando vueltas).
CREATE OR REPLACE FUNCTION public.admin_delete_secret(p_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  DELETE FROM public.admin_secrets WHERE key = trim(p_key);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_delete_secret(text) TO authenticated;

-- Le dice al panel si YA hay algo guardado, sin devolver el valor —
-- "Configurado ✓" / "No configurado", nunca la clave en sí.
CREATE OR REPLACE FUNCTION public.admin_get_secret_status(p_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_updated_at timestamptz;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  SELECT updated_at INTO v_updated_at FROM public.admin_secrets WHERE key = trim(p_key);
  RETURN jsonb_build_object('configured', v_updated_at IS NOT NULL, 'updated_at', v_updated_at);
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_secret_status(text) TO authenticated;

-- ── Método de firma por documento ───────────────────────────────────────
-- 'electronic' (lo que ya existe hoy) vs 'certicamara' (firma digital
-- certificada) — decisión manual de quien envía a firmar, no automática:
-- no tenemos la regla legal exacta de cuándo Certicámara es obligatorio
-- bajo la ley colombiana, así que en vez de inventarla, se deja elegir.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS signature_method text NOT NULL DEFAULT 'electronic'
    CHECK (signature_method IN ('electronic', 'certicamara'));
