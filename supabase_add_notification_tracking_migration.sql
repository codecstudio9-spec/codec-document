-- ============================================================
-- CODEC DOCUMENT — Contador real de notificaciones sin leer (campana 🔔)
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- No existe un sistema de notificaciones (no hay push, no hay tabla de
-- eventos). En vez de inventar un numero falso en la campana, se define
-- "sin leer" de forma honesta y verificable: documentos que enviaste a
-- firmar, que ya se firmaron (status = 'completed'), y que todavia no has
-- abierto desde la pestaña Firmas. viewed_at se marca la primera vez que
-- tocas ese documento firmado.
-- ============================================================

ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
