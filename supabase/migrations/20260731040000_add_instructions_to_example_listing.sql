-- The example-templates gallery card only ever showed a generic hardcoded
-- description ("Get your own independent copy...") regardless of which
-- template it was — the real per-template instructions_es/instructions_en
-- (written when each example was created) were never exposed by
-- list_public_example_templates(), so nothing in the UI could show them.
DROP FUNCTION IF EXISTS public.list_public_example_templates();

CREATE OR REPLACE FUNCTION public.list_public_example_templates()
RETURNS TABLE (id uuid, name text, example_label text, detected_fields jsonb, instructions_es text, instructions_en text)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT id, name, example_label, detected_fields, instructions_es, instructions_en
  FROM public.templates
  WHERE is_public_example = true AND kind = 'docx_variables'
  ORDER BY created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.list_public_example_templates() TO anon, authenticated;
