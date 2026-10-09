-- Qué plantilla prediseñada originó cada copia. Antes «Usar esta plantilla»
-- creaba una copia nueva en cada clic y «Mis plantillas» se llenaba de
-- duplicados; con esto la app reabre la copia que la persona ya tiene.
ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS source_example_id uuid
  REFERENCES public.templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS templates_source_example_idx
  ON public.templates (user_id, source_example_id)
  WHERE source_example_id IS NOT NULL;

-- Copias ya existentes: cloneExampleTemplate las nombraba
-- "<example_label> — Copia" (o "— Copy").
UPDATE public.templates t
SET source_example_id = e.id
FROM public.templates e
WHERE e.is_public_example = true
  AND t.is_public_example = false
  AND t.source_example_id IS NULL
  AND t.name IN (e.example_label || ' — Copia', e.example_label || ' — Copy');
