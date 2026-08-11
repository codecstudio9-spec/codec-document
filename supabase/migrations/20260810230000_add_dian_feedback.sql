-- Opiniones de los contadores que prueban la beta.
--
-- Es la investigacion de mercado que ningun estudio da: cuanto tiempo les
-- ahorra, cuanto pagarian y que les falta. Se guarda con el usuario para
-- poder volver a escribirle, pero se lee SOLO desde la cuenta del
-- propietario.

CREATE TABLE IF NOT EXISTS public.ed_feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text,
  -- Cuantos XML pasa hoy a Excel a mano cada mes: la medida real del dolor.
  xml_manuales  text,
  clientes      text,
  -- Rango de precio elegido, en pesos.
  precio        text,
  falta         text,
  sistema_contable text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ed_feedback ENABLE ROW LEVEL SECURITY;

-- Cada quien escribe lo suyo y puede releerlo; nadie ve lo de los demas.
DROP POLICY IF EXISTS ed_feedback_propio ON public.ed_feedback;
CREATE POLICY ed_feedback_propio ON public.ed_feedback
  FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- El propietario lee todo. is_admin_user() resuelve a una sola direccion.
DROP POLICY IF EXISTS ed_feedback_admin ON public.ed_feedback;
CREATE POLICY ed_feedback_admin ON public.ed_feedback
  FOR SELECT USING (public.is_admin_user());

CREATE INDEX IF NOT EXISTS ed_feedback_fecha_idx ON public.ed_feedback (created_at DESC);
