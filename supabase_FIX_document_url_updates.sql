-- ============================================================
-- CODEC DOCUMENT — Corrige "original_pdf_url queda vacío en silencio"
-- Ejecutar en https://yxzchnldmfsgdtbjurey.supabase.co -> SQL Editor
--
-- CAUSA REAL: updateDocumentPdfUrl / updateDocumentSignedPdfUrl /
-- finalizeDocument hacian un UPDATE directo desde el cliente
-- (`.from('documents').update(...).eq('id', documentId)`) SIN
-- `.select()`. Bajo RLS, si la fila no cumple la condicion de la
-- politica de UPDATE (auth.uid() = user_id), Postgres/PostgREST NO
-- lanza ningun error -- simplemente actualiza CERO filas y devuelve
-- exito. El codigo nunca se enteraba de que la escritura no paso, asi
-- que original_pdf_url se quedaba en NULL para siempre sin ningun
-- mensaje visible -- exactamente el mismo patron que ya causo el falso
-- "documento ya firmado" y el falso "limite alcanzado" en sesiones
-- anteriores de este mismo proyecto.
--
-- SOLUCION: la misma de siempre -- mover la escritura a una funcion
-- SECURITY DEFINER que devuelve un boolean real usando ROW_COUNT, para
-- que el frontend pueda distinguir "se guardo" de "no se guardo" y
-- fallar de forma visible en vez de silenciosa.
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_document_pdf_url(
  p_document_id uuid,
  p_original_pdf_url text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.documents
  SET original_pdf_url = p_original_pdf_url
  WHERE id = p_document_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_document_pdf_url(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_document_signed_pdf_url(
  p_document_id uuid,
  p_signed_pdf_url text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.documents
  SET signed_pdf_url = p_signed_pdf_url
  WHERE id = p_document_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_document_signed_pdf_url(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.finalize_document(
  p_document_id uuid,
  p_signed_pdf_url text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.documents
  SET signed_pdf_url = p_signed_pdf_url, status = 'completed'
  WHERE id = p_document_id;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;
GRANT EXECUTE ON FUNCTION public.finalize_document(uuid, text) TO anon, authenticated;

-- ── Diagnóstico que pediste ─────────────────────────────────────────
-- Documentos de los últimos 2 días sin original_pdf_url — para
-- confirmar cuántos quedaron huérfanos por este bug antes del fix.
SELECT id, user_id, name, status, original_pdf_url, created_at
FROM public.documents
WHERE created_at >= now() - interval '2 days'
  AND (original_pdf_url IS NULL OR original_pdf_url = '')
ORDER BY created_at DESC;
