-- ============================================================
-- CODEC DOCUMENT — Ledger de idempotencia para pagos verificados
-- Ejecutar una vez en Supabase Dashboard → SQL Editor
--
-- Usada por la Edge Function supabase/functions/paypal-verify — cada
-- orderId de PayPal solo puede procesarse (otorgar crédito/plan) UNA
-- vez. El INSERT con UNIQUE en order_id es lo que impide que alguien
-- reenvíe el mismo orderId varias veces para multiplicar créditos.
--
-- Solo la Edge Function (con la service role key, nunca expuesta al
-- navegador) puede escribir aquí — no hay política de INSERT/UPDATE
-- para 'anon' ni 'authenticated'.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.paypal_processed_orders (
  order_id   text PRIMARY KEY,
  product    text NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_usd numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.paypal_processed_orders ENABLE ROW LEVEL SECURITY;

-- Owners can see their own payment history; nothing else — no INSERT/UPDATE
-- policy at all, so this table is write-only from the service role.
DROP POLICY IF EXISTS "paypal_orders_select_own" ON public.paypal_processed_orders;
CREATE POLICY "paypal_orders_select_own" ON public.paypal_processed_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
