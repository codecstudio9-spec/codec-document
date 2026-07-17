-- Adds a rename + accent-color feature to both document systems
-- (public.documents = signature/upload flow, public.user_documents =
-- template-generated flow). Run this once in the Supabase SQL Editor.
--
-- Both RPCs are SECURITY DEFINER and check auth.uid() = user_id
-- internally — a raw client-side `.update()` on these tables would
-- silently affect 0 rows if the caller isn't the owner (or if RLS
-- doesn't have an UPDATE policy at all), with no error surfaced. This
-- keeps the write path server-verified and explicit either way.

ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS color text;

-- Both p_name/p_color are the caller's FULL desired state, not a partial
-- patch — the client always sends the current value for whichever field
-- it isn't changing (a plain edit form, not a PATCH semantics). Simpler
-- and unambiguous vs. treating null as "leave untouched", which would
-- make "clear the color" indistinguishable from "didn't touch color".
CREATE OR REPLACE FUNCTION public.update_document_details(
  p_document_id uuid,
  p_name text,
  p_color text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
BEGIN
  UPDATE public.documents
  SET name  = COALESCE(NULLIF(trim(p_name), ''), name),
      color = p_color
  WHERE id = p_document_id
    AND user_id = auth.uid()
  RETURNING to_jsonb(documents.*) INTO v_row;

  RETURN v_row; -- null if no matching row (not found, or not the owner)
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_document_details(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_user_document_details(
  p_document_id uuid,
  p_name text,
  p_color text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row jsonb;
BEGIN
  UPDATE public.user_documents
  SET document_name = COALESCE(NULLIF(trim(p_name), ''), document_name),
      color          = p_color,
      updated_at     = now()
  WHERE id = p_document_id
    AND user_id = auth.uid()
  RETURNING to_jsonb(user_documents.*) INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_document_details(uuid, text, text) TO authenticated;
