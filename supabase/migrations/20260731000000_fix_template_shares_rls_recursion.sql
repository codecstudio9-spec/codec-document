-- FIX URGENTE: la migracion anterior (20260730005000) causaba
-- "infinite recursion detected in policy for relation templates"
-- (Postgres 42P17) para TODOS los usuarios, no solo los compartidos:
--
--   templates_select_email_shared (en templates)  -> consulta template_shares
--   template_shares_owner_manage  (en template_shares) -> consulta templates
--
-- Cada politica dispara la evaluacion de la otra tabla, que a su vez
-- dispara la primera de nuevo -- ciclo infinito que Postgres detecta y
-- rechaza con error, dejando listDocxTemplates() (que traga el error y
-- devuelve []) mostrando "no tienes plantillas" a TODOS, dueños incluidos.
--
-- Mismo problema que ya se resolvio antes para el share de empresa via
-- get_my_company_id()/get_my_company_role() (SECURITY DEFINER, evita
-- consultar la tabla protegida por RLS desde su propia politica) --
-- deberia haber usado ese mismo patron desde el principio.

CREATE OR REPLACE FUNCTION public.user_owns_template(p_template_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.templates WHERE id = p_template_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.user_owns_template(uuid) TO authenticated;

DROP POLICY IF EXISTS "template_shares_owner_manage" ON public.template_shares;
CREATE POLICY "template_shares_owner_manage" ON public.template_shares
  FOR ALL TO authenticated
  USING (public.user_owns_template(template_id))
  WITH CHECK (public.user_owns_template(template_id));
