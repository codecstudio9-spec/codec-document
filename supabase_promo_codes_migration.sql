-- ============================================================
-- CODEC DOCUMENT — Códigos promocionales validados en servidor
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- PROBLEMA: VALID_PROMO_CODES vivía como un array hardcodeado en
-- PremiumDownloadModal.tsx, shipeado en el bundle de JavaScript público.
-- Cualquiera podía abrir devtools, leer el código fuente y usar
-- "CODEC2026" gratis sin límite de veces. La validación pasa ahora a la
-- Edge Function paypal-verify, que es la única con permiso de escritura.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  code              text PRIMARY KEY,
  -- 'doc_single' grants whichever documentId the caller sends (free-form,
  -- like the original client-side behavior); any other product value
  -- grants that fixed product regardless of what the caller sends.
  product           text NOT NULL,
  active            boolean NOT NULL DEFAULT true,
  expires_at        timestamptz,
  max_redemptions   integer,        -- NULL = sin límite
  redemption_count  integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
-- Sin política alguna: ni siquiera SELECT es público — un cliente no
-- necesita leer la tabla, solo mandar el código y dejar que la Edge
-- Function (service role) lo valide. Así tampoco se puede enumerar
-- códigos válidos consultando la tabla directamente.

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL REFERENCES public.promo_codes(code),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, user_id)
);

ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promo_redemptions_select_own" ON public.promo_redemptions;
CREATE POLICY "promo_redemptions_select_own" ON public.promo_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Migra los 3 códigos que ya existían hardcodeados en el frontend — en el
-- modal original solo aparecían en el panel de "documento individual", así
-- que otorgan ese documento puntual gratis (doc_single), igual que antes.
-- Ajusta `product`/`max_redemptions`/`expires_at` según lo que en realidad
-- quieras ofrecer con cada código.
INSERT INTO public.promo_codes (code, product, active)
VALUES
  ('TESTZERO', 'doc_single', true),
  ('CODEC2026', 'doc_single', true),
  ('SEBASMANU2026', 'doc_single', true)
ON CONFLICT (code) DO NOTHING;
