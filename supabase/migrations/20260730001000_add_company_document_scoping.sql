-- Fase 2 del ecosistema de empresa: vincula sign_transactions y templates
-- a la empresa del creador (si tiene una), y deja que un owner/admin de
-- esa empresa vea TODO lo de su equipo, no solo lo propio -- lo que la
-- migracion original del workspace (supabase_add_company_workspace_migration.sql)
-- dejo explicitamente pendiente ("queda para una fase dedicada aparte").
--
-- Nullable en ambas tablas -- un usuario individual sin empresa sigue
-- funcionando exactamente igual, company_id simplemente queda NULL.
--
-- Alcance de esta migracion: sign_transactions + templates únicamente.
-- documents/user_documents/profile_documents (las tablas de "Mis
-- Documentos") tienen su propio conjunto de políticas RLS que no se
-- auditó con el mismo detalle en esta pasada -- vincularlas a la empresa
-- queda para un siguiente paso, para no arriesgar una política mal
-- escrita sobre una tabla que no se verificó línea por línea.

ALTER TABLE public.sign_transactions
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Auto-populate on insert via column DEFAULT — get_my_company_id() is
-- STABLE and reads auth.uid() from the request's own JWT (unaffected by
-- create_sign_transaction's SECURITY DEFINER, which only changes whose
-- table privileges apply, not what auth.uid() resolves to). Neither
-- create_sign_transaction's INSERT nor the client's plain
-- .from('templates').insert(...) calls list company_id explicitly, so
-- this default fills it in with zero changes to that RPC or to
-- template-service.ts/docx-template-service.ts. An anonymous caller
-- (auth.uid() null) simply gets NULL back — unaffected, same as today.
ALTER TABLE public.sign_transactions ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();
ALTER TABLE public.templates ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

CREATE INDEX IF NOT EXISTS sign_transactions_company_id_idx ON public.sign_transactions (company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS templates_company_id_idx ON public.templates (company_id) WHERE company_id IS NOT NULL;

-- Reutiliza get_my_company_id()/get_my_company_role() (SECURITY DEFINER,
-- ya existentes desde el módulo empresarial) -- evita la recursión de RLS
-- clásica de consultar company_members desde su propia política.

CREATE POLICY "tx_select_company_admin" ON public.sign_transactions
  FOR SELECT USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
    AND public.get_my_company_role() IN ('owner', 'admin')
  );

-- Plantillas compartidas de empresa: cualquier miembro (no solo el
-- admin) puede VER (para poder usarla) una plantilla marcada como de su
-- empresa -- la política "templates_own" existente sigue intacta para
-- el dueño real (que además puede editarla/borrarla, cosa que un
-- empleado normal no puede vía esta política nueva, solo de solo lectura).
CREATE POLICY "templates_select_company_shared" ON public.templates
  FOR SELECT USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
  );
