-- Fix: mover un documento a una carpeta usaba un `.update()` directo desde
-- el cliente, igual que renameDocument/updateAssociatedDocumentDetails
-- hacían ANTES de que existieran update_document_details /
-- update_user_document_details (ver 20260720145222_add_document_name_color.sql).
-- La política "documents_update_pending" (supabase_lockdown_documents_migration.sql)
-- solo permite UPDATE en filas con status = 'pending' — un documento YA
-- FIRMADO no cumple esa condición, así que el UPDATE no daba error pero
-- afectaba 0 filas, y el folder_id nunca quedaba guardado (confirmado en
-- vivo: se movía visualmente y al recargar volvía a "Sin carpeta"). Mismo
-- arreglo que ya se usó para nombre/color: pasar por una función
-- SECURITY DEFINER que verifica el dueño explícitamente en vez de
-- depender de la política de UPDATE de la tabla.

CREATE OR REPLACE FUNCTION public.update_document_folder(
  p_document_id uuid,
  p_folder_id   uuid
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
  SET folder_id = p_folder_id
  WHERE id = p_document_id
    AND user_id = auth.uid()
    -- La carpeta también debe ser del mismo dueño — sin esto, alguien
    -- podría intentar archivar su documento bajo el id de una carpeta
    -- ajena adivinado, ya que esta función corre con permisos elevados.
    AND (p_folder_id IS NULL OR EXISTS (
      SELECT 1 FROM public.document_folders f
      WHERE f.id = p_folder_id AND f.user_id = auth.uid()
    ))
  RETURNING to_jsonb(documents.*) INTO v_row;

  RETURN v_row; -- null if no matching row (not found, not owner, or foreign folder)
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_document_folder(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_user_document_folder(
  p_document_id uuid,
  p_folder_id   uuid
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
  SET folder_id  = p_folder_id,
      updated_at = now()
  WHERE id = p_document_id
    AND user_id = auth.uid()
    AND (p_folder_id IS NULL OR EXISTS (
      SELECT 1 FROM public.document_folders f
      WHERE f.id = p_folder_id AND f.user_id = auth.uid()
    ))
  RETURNING to_jsonb(user_documents.*) INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_document_folder(uuid, uuid) TO authenticated;

-- Deleting a folder needs to unfile everything inside it first — same
-- "documents_update_pending" problem as above applies to that unfiling
-- step for any already-signed document, so it's folded into this same
-- SECURITY DEFINER function instead of a client-side `.update()` the
-- app can't be sure actually ran. Ownership of the folder is verified
-- before anything is touched; deleting a folder that isn't yours (or
-- doesn't exist) is a no-op that reports false.
CREATE OR REPLACE FUNCTION public.delete_document_folder(p_folder_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.document_folders WHERE id = p_folder_id AND user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.user_documents SET folder_id = NULL WHERE folder_id = p_folder_id AND user_id = auth.uid();
  UPDATE public.documents      SET folder_id = NULL WHERE folder_id = p_folder_id AND user_id = auth.uid();
  DELETE FROM public.document_folders WHERE id = p_folder_id AND user_id = auth.uid();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_document_folder(uuid) TO authenticated;
