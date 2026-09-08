-- Plan Empresa por asientos (desde 5 usuarios, $24.99/usuario/mes) +
-- visibilidad de super-admin sobre documentos y firmas del equipo.
--
-- Tres piezas, 100% aditivas:
--   1. companies.plan_seats -- cuántos asientos compró la empresa. NULL
--      significa "plan plano legado" (el $99.99/mes existente en
--      /my-company, sin límite de miembros) -- así ningún cliente actual
--      se ve afectado por este cambio.
--   2. user_documents.company_id -- mismo patrón que
--      20260730001000_add_company_document_scoping.sql ya usó para
--      sign_transactions/templates: auto-poblado, y visible para
--      owner/admin de esa empresa además del propio dueño.
--   3. Límite de asientos aplicado en add_company_member_by_email — sin
--      esto, pagar por asientos no significaría nada.
--   4. get_company_activity_admin() -- una sola llamada para el panel de
--      "Actividad del equipo": documentos + firmas de TODOS los miembros,
--      solo para owner/admin. Nunca incluye selfie/foto de identificación
--      (columnas sensibles de sign_transactions) -- mismo criterio que
--      listMySentTransactions() en sign-transaction-service.ts.

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_seats integer
  CHECK (plan_seats IS NULL OR plan_seats >= 5);

ALTER TABLE public.user_documents
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.user_documents ALTER COLUMN company_id SET DEFAULT public.get_my_company_id();

CREATE INDEX IF NOT EXISTS user_documents_company_id_idx ON public.user_documents (company_id) WHERE company_id IS NOT NULL;

DROP POLICY IF EXISTS "user_documents_select_company_admin" ON public.user_documents;
CREATE POLICY "user_documents_select_company_admin" ON public.user_documents
  FOR SELECT USING (
    company_id IS NOT NULL
    AND company_id = public.get_my_company_id()
    AND public.get_my_company_role() IN ('owner', 'admin')
  );

-- ── Límite de asientos ──────────────────────────────────────────────────
-- Solo aplica cuando la empresa tiene plan_seats configurado (plan por
-- asientos). El plan plano legado (plan_seats NULL) sigue sin límite,
-- exactamente como se comporta hoy.
CREATE OR REPLACE FUNCTION public.add_company_member_by_email(p_email text, p_role text DEFAULT 'user')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_my_company_id uuid;
  v_my_role text;
  v_target_user_id uuid;
  v_row jsonb;
  v_plan_seats integer;
  v_current_members integer;
  v_already_member boolean;
BEGIN
  SELECT company_id, role INTO v_my_company_id, v_my_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_my_company_id IS NULL OR v_my_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_role NOT IN ('owner','admin','manager','user') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  SELECT id INTO v_target_user_id FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'No account found with that email';
  END IF;

  SELECT plan_seats INTO v_plan_seats FROM public.companies WHERE id = v_my_company_id;
  IF v_plan_seats IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM public.company_members WHERE company_id = v_my_company_id AND user_id = v_target_user_id
    ) INTO v_already_member;
    IF NOT v_already_member THEN
      SELECT COUNT(*) INTO v_current_members FROM public.company_members WHERE company_id = v_my_company_id;
      IF v_current_members >= v_plan_seats THEN
        RAISE EXCEPTION 'Your Enterprise plan includes % seats — remove a member or add more seats to invite more people.', v_plan_seats;
      END IF;
    END IF;
  END IF;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (v_my_company_id, v_target_user_id, p_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role
    WHERE company_members.company_id = v_my_company_id
  RETURNING to_jsonb(company_members.*) INTO v_row;

  IF v_row IS NULL THEN
    RAISE EXCEPTION 'That user already belongs to a different company';
  END IF;
  RETURN v_row;
END;
$$;
GRANT EXECUTE ON FUNCTION public.add_company_member_by_email(text, text) TO authenticated;

-- Misma comprobación de asientos, reutilizable por la Edge Function que
-- crea una cuenta nueva directamente (admin-create-company-user) — esa
-- función corre con el service role, así que auth.uid() no sirve ahí;
-- necesita poder pasar el id de quien llama explícitamente.
CREATE OR REPLACE FUNCTION public.company_has_seat_available(p_company_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT
    plan_seats IS NULL
    OR (SELECT COUNT(*) FROM public.company_members WHERE company_id = p_company_id) < plan_seats
  FROM public.companies WHERE id = p_company_id;
$$;
GRANT EXECUTE ON FUNCTION public.company_has_seat_available(uuid) TO service_role;

-- ── Actividad del equipo (documentos + firmas), solo owner/admin ───────
-- Nunca selecciona recipient_selfie/recipient_id_photo/recipient_biometric_*
-- de sign_transactions -- son evidencia biométrica/de identidad, fuera del
-- alcance de un panel de "quién generó qué y cuándo".
CREATE OR REPLACE FUNCTION public.get_company_activity_admin()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_company_id uuid;
  v_role text;
  v_result jsonb;
BEGIN
  SELECT company_id, role INTO v_company_id, v_role FROM public.company_members WHERE user_id = auth.uid();
  IF v_company_id IS NULL OR v_role NOT IN ('owner', 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_build_object(
    'documents', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'document_name', d.document_name, 'template_id', d.template_id,
        'created_at', d.created_at, 'author_email', u.email
      ) ORDER BY d.created_at DESC)
      FROM public.user_documents d
      JOIN auth.users u ON u.id = d.user_id
      WHERE d.company_id = v_company_id
      LIMIT 200
    ), '[]'::jsonb),
    'signatures', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'document_type', s.document_type, 'status', s.status,
        'created_at', s.created_at, 'signed_at', s.signed_at, 'author_email', u.email
      ) ORDER BY s.created_at DESC)
      FROM public.sign_transactions s
      JOIN auth.users u ON u.id::text = s.creator_id
      WHERE s.company_id = v_company_id
      LIMIT 200
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_company_activity_admin() TO authenticated;

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('companies', 'user_documents')
  AND column_name IN ('plan_seats', 'company_id');
