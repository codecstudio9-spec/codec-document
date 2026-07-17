-- ============================================================
-- CODEC DOCUMENT — Rol de administrador (para el módulo de Analytics/BI)
-- Ejecutar en Supabase Dashboard → SQL Editor. Idempotente.
--
-- Agrega una columna `role` real a public.users, en vez de depender
-- solo del email hardcodeado en src/app/utils/admin-access.ts. El
-- email hardcodeado se mantiene como respaldo en el código (defensa
-- en profundidad) — este rol permite agregar futuros administradores
-- sin necesidad de un nuevo deploy.
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

UPDATE public.users
SET role = 'admin'
WHERE lower(email) = 'douglastabordasanchez@gmail.com';

-- ── Verificación ─────────────────────────────────────────────────────
SELECT id, email, role FROM public.users WHERE role = 'admin';
