-- Las observaciones de los documentos NUNCA se guardaron.
--
-- ── El síntoma ───────────────────────────────────────────────────────────
--
-- Un documento aparece marcado «Requiere revisión», pero al entrar en la
-- bandeja de revisión dice «No hay nada que revisar». Las dos cosas a la vez,
-- siempre, desde el primer día.
--
-- ── La causa ─────────────────────────────────────────────────────────────
--
-- Todas las tablas del módulo declaran:
--
--     owner_user_id uuid NOT NULL DEFAULT auth.uid()
--
-- menos `ed_exceptions`, que se quedó en `uuid NOT NULL` a secas. El código
-- que inserta las observaciones nunca envía ese campo —confiaba en el
-- DEFAULT, como con las demás tablas—, así que cada INSERT llegaba con
-- owner_user_id en NULL y era rechazado por partida doble: por la
-- restricción NOT NULL y por la política RLS, que exige
-- `WITH CHECK (owner_user_id = auth.uid())` y con NULL no se cumple.
--
-- Y el error no se veía porque el cliente hacía `await supabase...insert()`
-- sin mirar el resultado. En supabase-js un INSERT fallido no lanza: devuelve
-- `{ error }`. Nadie lo leía, así que el fallo era invisible.
--
-- El estado del documento sí se calculaba bien (estadoDesdeExcepciones lo
-- deriva EN MEMORIA, antes de guardar), por eso la insignia era correcta y la
-- bandeja quedaba vacía: el motivo se calculaba y se perdía en el mismo paso.
--
-- ── Lo que NO arregla esta migración ─────────────────────────────────────
--
-- Los documentos ya importados y marcados «Requiere revisión» no recuperan su
-- motivo: se calculó al leer el XML y no se guardó en ningún sitio. Para
-- recuperarlo hay que volver a importar esos documentos. Se deja constancia
-- abajo para poder decírselo al contador en vez de dejarle una bandeja que
-- sigue vacía sin explicación.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

ALTER TABLE public.ed_exceptions
  ALTER COLUMN owner_user_id SET DEFAULT auth.uid();

-- Las importaciones tienen su propia fila de fallo (registrarFallo) que
-- tampoco enviaba el dueño y fallaba igual. Con el DEFAULT ya entra.

/**
 * Documentos marcados para revisión que se quedaron sin motivo guardado.
 *
 * Sirve para avisar al contador con una cifra concreta —«hay 3 documentos
 * cuyo motivo se perdió, vuelve a importarlos»— en vez de dejarle una
 * bandeja vacía que contradice la insignia.
 */
CREATE OR REPLACE FUNCTION public.ed_revision_sin_motivo()
RETURNS TABLE (id uuid, full_number text, doc_type text, issue_date date, issuer_name text, total numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id, d.full_number, d.doc_type, d.issue_date, d.issuer_name, d.total
  FROM public.ed_documents d
  WHERE d.owner_user_id = auth.uid()
    AND d.status = 'REVIEW_REQUIRED'
    AND NOT EXISTS (
      SELECT 1 FROM public.ed_exceptions e
      WHERE e.document_id = d.id AND e.resolved_at IS NULL
    )
  ORDER BY d.issue_date DESC NULLS LAST
  LIMIT 200;
$$;
GRANT EXECUTE ON FUNCTION public.ed_revision_sin_motivo() TO authenticated;

-- Verificación: el DEFAULT tiene que aparecer.
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'ed_exceptions' AND column_name = 'owner_user_id';
