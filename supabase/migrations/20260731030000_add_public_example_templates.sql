-- Public example templates — a small gallery of Word templates ANY
-- account can see and clone into their own account, even one with zero
-- templates of its own (the whole point: give a brand-new user a running
-- start instead of a blank page). Distinct from template_shares (which
-- shares the SAME row, joint-editing) — cloning creates an independent
-- copy the new owner can freely rewrite (clauses, fields, everything)
-- without affecting the original example.
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS is_public_example boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS example_label text;

CREATE INDEX IF NOT EXISTS templates_public_example_idx ON public.templates (is_public_example) WHERE is_public_example = true;

-- Lightweight listing — anyone (anon or authenticated) can see what
-- example templates exist, safe fields only (no user_id, no raw docx url
-- needed just to browse the gallery).
CREATE OR REPLACE FUNCTION public.list_public_example_templates()
RETURNS TABLE (id uuid, name text, example_label text, detected_fields jsonb)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, example_label, detected_fields
  FROM public.templates
  WHERE is_public_example = true AND kind = 'docx_variables'
  ORDER BY created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_public_example_templates() TO anon, authenticated;

-- Full clonable data for ONE example template — everything
-- createDocxTemplate() needs to make an independent copy under the
-- caller's own account. Safe to expose fully: by definition an
-- is_public_example row is meant to be seen and copied by anyone.
CREATE OR REPLACE FUNCTION public.get_public_example_template(p_id uuid)
RETURNS TABLE (
  id uuid, name text, example_label text, docx_file_url text, detected_fields jsonb,
  security_config jsonb, instructions_en text, instructions_es text,
  clause_overrides jsonb, extra_clauses jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, example_label, docx_file_url, detected_fields,
         security_config, instructions_en, instructions_es,
         clause_overrides, extra_clauses
  FROM public.templates
  WHERE id = p_id AND is_public_example = true AND kind = 'docx_variables'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_public_example_template(uuid) TO anon, authenticated;

-- Mark the Centro de Idiomas Universal contract as the first public
-- example — generic label for the gallery card (its real `name`, used
-- everywhere else including the original owner's own My Templates list,
-- stays untouched).
UPDATE public.templates
SET is_public_example = true,
    example_label = 'Contrato de Matrícula — Plantilla de Ejemplo'
WHERE id = '66ad7dce-ab6f-4a71-bccd-cab86bf87cf2';
