-- ============================================================
-- CODEC DOCUMENT — Repara update_document_signed_pdf_url y finalize_document
-- Ejecutar en Supabase Dashboard → SQL Editor, UN PASO A LA VEZ.
--
-- CAUSA: en algún momento se recrearon estas dos funciones con nombres de
-- parámetro distintos a los que el código del cliente usa (p.ej.
-- "p_signed_url" en vez de "p_signed_pdf_url", y un parámetro extra
-- "p_audit_trail" en finalize_document) — el mismo problema que ya
-- corregimos en update_document_pdf_url. Resultado: el mismo error
-- "Could not find the function ... in the schema cache" al firmar.
--
-- SOLUCIÓN: en vez de adivinar qué firma quedó, se eliminan TODAS las
-- versiones de estas dos funciones (sin importar su firma actual) y se
-- vuelven a crear con el contrato exacto que el código del cliente
-- (src/lib/signatureService.ts) ya espera — el mismo patrón booleano por
-- ROW_COUNT que ya funciona hoy en update_document_pdf_url.
-- ============================================================


-- ─── PASO 1: eliminar todas las versiones existentes (cualquier firma) ─
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig FROM pg_proc
    WHERE proname = 'update_document_signed_pdf_url' AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.sig);
  END LOOP;

  FOR r IN
    SELECT oid::regprocedure AS sig FROM pg_proc
    WHERE proname = 'finalize_document' AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.sig);
  END LOOP;
END $$;


-- ─── PASO 2: recrear update_document_signed_pdf_url ────────────────────
CREATE FUNCTION public.update_document_signed_pdf_url(
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


-- ─── PASO 3: recrear finalize_document ──────────────────────────────────
CREATE FUNCTION public.finalize_document(
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


-- ─── PASO 4: verificación — deben verse exactamente estas 2 firmas ────
SELECT oid::regprocedure AS funcion
FROM pg_proc
WHERE proname IN ('update_document_signed_pdf_url', 'finalize_document')
  AND pronamespace = 'public'::regnamespace;
