-- Custom templates uploaded by the client — a document they upload once
-- (PDF), mark where the fillable fields and signature spots go, and reuse
-- from then on: each time they use it, a form (built from
-- fields_metadata) asks for the values, and the system stamps them onto
-- the document automatically. Fully additive — new table, doesn't touch
-- documents/user_documents or anything already working.

CREATE TABLE IF NOT EXISTS public.templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  file_url        text NOT NULL,
  -- Array of field definitions, each shaped like:
  -- {
  --   "id": "field-1699999999-abc",
  --   "type": "text" | "date" | "signature" | "initials",
  --   "label": "Nombre del cliente",     -- shown on the fill-in form (not for type=signature)
  --   "page": 1,                          -- 1-indexed
  --   "xFraction": 0.32, "yFraction": 0.71,
  --   "widthFraction": 0.30, "heightFraction": 0.04,
  --   "required": true
  -- }
  fields_metadata jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Same "own" pattern already used for user_documents: the owner can do
-- everything with their own templates, nobody else can see them at all.
CREATE POLICY "templates_own" ON public.templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
