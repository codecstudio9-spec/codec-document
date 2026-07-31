-- Lets a docx template's owner rewrite the LARGE legal-prose paragraphs of
-- the document (the clauses baked into the uploaded .docx) without leaving
-- the app or touching Word — distinct from detected_fields, which only
-- covers small {{tag}} values (names, dates, amounts). Keyed by the
-- paragraph's index in the array extractFormattedParagraphs() returns for
-- this template's own .docx (stable across renders since docxtemplater's
-- {{tag}} substitution never adds/removes paragraphs, only replaces text
-- within existing runs) — see detectEditableClauseBlocks/applyClauseOverrides
-- in src/lib/docxTemplateEngine.ts.
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS clause_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Both public RPCs need the new column too, since the actual rendering
-- (guest fill page, guest's "download my copy") must apply the owner's
-- overrides just like the owner's own preview/download does. DROP first —
-- Postgres won't let CREATE OR REPLACE change a RETURNS TABLE column set.
DROP FUNCTION IF EXISTS public.get_template_by_slug_public(text);
DROP FUNCTION IF EXISTS public.get_docx_template_by_id_public(uuid);

CREATE OR REPLACE FUNCTION public.get_template_by_slug_public(p_slug text)
RETURNS TABLE (
  id uuid, name text, docx_file_url text, detected_fields jsonb,
  signers jsonb, security_config jsonb, instructions_en text, instructions_es text,
  clause_overrides jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, docx_file_url, detected_fields, signers, security_config, instructions_en, instructions_es,
         clause_overrides
  FROM public.templates
  WHERE public_slug = p_slug AND kind = 'docx_variables'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_template_by_slug_public(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_docx_template_by_id_public(p_id uuid)
RETURNS TABLE (id uuid, name text, docx_file_url text, clause_overrides jsonb)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, docx_file_url, clause_overrides
  FROM public.templates
  WHERE id = p_id AND kind = 'docx_variables'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_docx_template_by_id_public(uuid) TO anon, authenticated;
