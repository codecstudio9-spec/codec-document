-- Lets a template owner ADD brand-new clause blocks (not tied to any
-- paragraph in the source .docx) on top of the clause_overrides feature
-- (which only lets them REWRITE existing detected blocks). Appended at the
-- end of the rendered document — see applyClauseOverrides in
-- src/lib/docxTemplateEngine.ts. "Deleting" an existing detected block is
-- handled by clause_overrides itself (an override of '' removes that
-- paragraph's content entirely), so no separate column is needed for that.
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS extra_clauses jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP FUNCTION IF EXISTS public.get_template_by_slug_public(text);
DROP FUNCTION IF EXISTS public.get_docx_template_by_id_public(uuid);

CREATE OR REPLACE FUNCTION public.get_template_by_slug_public(p_slug text)
RETURNS TABLE (
  id uuid, name text, docx_file_url text, detected_fields jsonb,
  signers jsonb, security_config jsonb, instructions_en text, instructions_es text,
  clause_overrides jsonb, extra_clauses jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, docx_file_url, detected_fields, signers, security_config, instructions_en, instructions_es,
         clause_overrides, extra_clauses
  FROM public.templates
  WHERE public_slug = p_slug AND kind = 'docx_variables'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_template_by_slug_public(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_docx_template_by_id_public(p_id uuid)
RETURNS TABLE (id uuid, name text, docx_file_url text, clause_overrides jsonb, extra_clauses jsonb)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, docx_file_url, clause_overrides, extra_clauses
  FROM public.templates
  WHERE id = p_id AND kind = 'docx_variables'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_docx_template_by_id_public(uuid) TO anon, authenticated;
