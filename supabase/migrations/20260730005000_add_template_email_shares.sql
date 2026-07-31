-- Comparte una plantilla Word ({{variables}}) con OTRA cuenta por correo
-- -- sin necesidad de pertenecer a la misma empresa (eso ya existe via
-- templates_select_company_shared, 20260730001000). El dueño agrega un
-- email; cuando esa persona inicia sesion con ese mismo correo, la
-- plantilla aparece en su "Mis Plantillas" identica a como la ve el
-- dueño (mismos campos, firmantes, seguridad, instrucciones) porque es
-- LA MISMA fila de public.templates, solo con una regla RLS extra que
-- se la deja ver.
--
-- Mismo patron que templates_select_company_shared: una politica de
-- SELECT adicional sobre public.templates, sin tocar templates_own.

CREATE TABLE IF NOT EXISTS public.template_shares (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      uuid NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  shared_with_email text NOT NULL,
  created_by       uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, shared_with_email)
);

ALTER TABLE public.template_shares ENABLE ROW LEVEL SECURITY;

-- Solo el dueño real de la plantilla puede ver/agregar/quitar con quien
-- la comparte -- igual que cualquier otra config de su propia plantilla.
CREATE POLICY "template_shares_owner_manage" ON public.template_shares
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.templates t WHERE t.id = template_id AND t.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS template_shares_template_id_idx ON public.template_shares (template_id);
CREATE INDEX IF NOT EXISTS template_shares_email_idx ON public.template_shares (lower(shared_with_email));

-- La plantilla misma: visible tambien para quien recibio el share, por
-- email (case-insensitive) -- solo lectura, igual que el share de empresa.
CREATE POLICY "templates_select_email_shared" ON public.templates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.template_shares ts
      WHERE ts.template_id = templates.id
        AND lower(ts.shared_with_email) = lower((auth.jwt() ->> 'email'))
    )
  );
