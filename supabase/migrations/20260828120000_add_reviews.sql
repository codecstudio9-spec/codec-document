-- Sistema de reseñas reales, verificadas y moderadas.
--
-- Por que existe: la landing tenia una seccion de "reseñas" con nombres,
-- roles y fotos 100% inventados (ver commit a04eeb9). Esto la reemplaza por
-- un sistema real: solo puede reseñar quien ya genero un documento real en
-- la plataforma (verificado server-side, no confiando en el cliente), y
-- ninguna reseña se muestra publicamente hasta que el admin la aprueba.
--
-- Flujo: submit_review() valida uso real + inserta en 'pending' ->
-- moderate_review() (solo admin) aprueba o rechaza -> solo lo 'approved' es
-- visible via la policy publica de SELECT.

CREATE TABLE IF NOT EXISTS public.reviews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name  text NOT NULL,
  rating       smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body         text NOT NULL CHECK (char_length(body) BETWEEN 10 AND 1000),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_at  timestamptz,
  UNIQUE (user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Publico (incluido anon): solo lee lo aprobado. Es lo que se muestra en la
-- landing.
DROP POLICY IF EXISTS reviews_select_approved ON public.reviews;
CREATE POLICY reviews_select_approved ON public.reviews
  FOR SELECT USING (status = 'approved');

-- El autor siempre ve su propia reseña, este o no aprobada aun.
DROP POLICY IF EXISTS reviews_select_own ON public.reviews;
CREATE POLICY reviews_select_own ON public.reviews
  FOR SELECT USING (auth.uid() = user_id);

-- Solo el admin real puede moderar. Mismo criterio que BonosYRegalosTab:
-- decidir que se publica en la landing es una accion sensible.
DROP POLICY IF EXISTS reviews_admin_update ON public.reviews;
CREATE POLICY reviews_admin_update ON public.reviews
  FOR UPDATE USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

-- A proposito no hay policy de INSERT para authenticated/anon: toda fila
-- nueva pasa por submit_review() (SECURITY DEFINER), que es quien verifica
-- uso real del producto antes de aceptar la reseña.

CREATE OR REPLACE FUNCTION public.submit_review(p_rating smallint, p_body text, p_author_name text)
RETURNS public.reviews
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_has_used boolean;
  v_row public.reviews;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesion para dejar una reseña.';
  END IF;

  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Calificacion invalida.';
  END IF;

  IF char_length(trim(coalesce(p_body, ''))) < 10 THEN
    RAISE EXCEPTION 'Cuentanos un poco mas sobre tu experiencia (minimo 10 caracteres).';
  END IF;

  IF char_length(trim(coalesce(p_author_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Escribe tu nombre.';
  END IF;

  -- "Verificado" = ya genero un documento real o ya firmo algo como
  -- creador, no solo tener una cuenta. Mismo patron de creator_id =
  -- auth.uid()::text que usa tx_select_own en sign_transactions.
  SELECT EXISTS(SELECT 1 FROM public.user_documents WHERE user_id = auth.uid())
      OR EXISTS(SELECT 1 FROM public.sign_transactions WHERE creator_id = auth.uid()::text)
    INTO v_has_used;

  IF NOT v_has_used THEN
    RAISE EXCEPTION 'Solo clientes que ya generaron un documento pueden dejar una reseña.';
  END IF;

  INSERT INTO public.reviews (user_id, author_name, rating, body, status)
  VALUES (auth.uid(), trim(p_author_name), p_rating, trim(p_body), 'pending')
  ON CONFLICT (user_id) DO UPDATE SET
    author_name = EXCLUDED.author_name,
    rating      = EXCLUDED.rating,
    body        = EXCLUDED.body,
    status      = 'pending',
    admin_note  = NULL,
    reviewed_at = NULL,
    created_at  = now()
  WHERE public.reviews.status <> 'approved'
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'Ya tienes una reseña publicada. Escribe a soporte si quieres cambiarla.';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_review(smallint, text, text) TO authenticated;

-- Moderacion (aprobar / rechazar). Solo admin real, nunca el propio autor.
CREATE OR REPLACE FUNCTION public.moderate_review(p_review_id uuid, p_approve boolean, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'No autorizado.';
  END IF;

  UPDATE public.reviews
  SET status      = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      admin_note  = p_note,
      reviewed_at = now()
  WHERE id = p_review_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.moderate_review(uuid, boolean, text) TO authenticated;

-- Listado completo (pendientes primero) para el panel admin.
CREATE OR REPLACE FUNCTION public.list_reviews_for_admin()
RETURNS SETOF public.reviews
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.reviews
  WHERE public.is_admin_user()
  ORDER BY (status = 'pending') DESC, created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.list_reviews_for_admin() TO authenticated;

-- Resumen publico (promedio + conteo) de SOLO lo aprobado. Es la unica
-- fuente del AggregateRating real en structured-data.tsx -- si
-- review_count = 0 el frontend no emite AggregateRating (nunca se inventa).
CREATE OR REPLACE FUNCTION public.get_reviews_summary()
RETURNS TABLE(avg_rating numeric, review_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(AVG(rating), 0)::numeric(3,2), COUNT(*)
  FROM public.reviews
  WHERE status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.get_reviews_summary() TO anon, authenticated;
