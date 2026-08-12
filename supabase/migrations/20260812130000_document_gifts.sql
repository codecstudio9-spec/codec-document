-- Regalar documentos a una persona por su correo, desde el panel de
-- administración.
--
-- ── Cómo encaja con el cupo gratuito ─────────────────────────────────────
--
-- Un usuario gratuito tiene 2 documentos cada 72 horas (ventana deslizante,
-- `document_creation_events`). Los documentos regalados NO sustituyen ese
-- cupo: se gastan CUANDO EL CUPO YA SE AGOTÓ.
--
-- El orden importa y es deliberado. Gastando primero el regalo, alguien con
-- cupo libre quemaría un documento obsequiado que igualmente tenía gratis —
-- el regalo no le habría añadido nada. Gastándolo al final, el obsequio es
-- capacidad de verdad: son documentos que esa persona no habría podido hacer.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

CREATE TABLE IF NOT EXISTS public.document_gifts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by  uuid REFERENCES auth.users(id),
  quantity    integer NOT NULL CHECK (quantity > 0),
  -- Se lleva aparte del total para conservar cuántos se regalaron en su
  -- momento: con una sola columna que baja, se pierde el dato de la campaña.
  remaining   integer NOT NULL CHECK (remaining >= 0),
  message     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- NULL = a esa persona todavía no se le ha avisado. Es lo que dispara el
  -- aviso con sonido la próxima vez que entre.
  notified_at timestamptz
);

CREATE INDEX IF NOT EXISTS document_gifts_user_pending_idx
  ON public.document_gifts (user_id) WHERE remaining > 0;

ALTER TABLE public.document_gifts ENABLE ROW LEVEL SECURITY;

-- Cada quien ve SOLO sus propios regalos. No hay política de INSERT ni de
-- UPDATE para `authenticated`: si la hubiera, cualquiera podría regalarse
-- documentos a sí mismo con una llamada directa desde el navegador. Todo lo
-- que escribe pasa por funciones SECURITY DEFINER.
DROP POLICY IF EXISTS document_gifts_select_own ON public.document_gifts;
CREATE POLICY document_gifts_select_own ON public.document_gifts
  FOR SELECT USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════════
-- Regalar (admin)
-- ══════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.admin_gift_documents(
  p_email    text,
  p_quantity integer,
  p_message  text DEFAULT NULL
)
RETURNS TABLE (gift_id uuid, user_id uuid, email text, quantity integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid;
  v_email   text;
  v_id      uuid;
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  IF p_quantity IS NULL OR p_quantity < 1 OR p_quantity > 500 THEN
    RAISE EXCEPTION 'La cantidad debe estar entre 1 y 500';
  END IF;

  v_email := lower(trim(p_email));
  SELECT u.id INTO v_user_id FROM auth.users u WHERE lower(u.email) = v_email;

  -- Se exige que la cuenta exista. Guardar el regalo «pendiente» contra un
  -- correo sin cuenta parece amable, pero deja un dato que nunca se reclama
  -- y que nadie revisa; es más honesto decirlo en el momento para que quien
  -- regala compruebe el correo o invite antes a la persona.
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay ninguna cuenta con el correo %', v_email;
  END IF;

  INSERT INTO public.document_gifts (user_id, granted_by, quantity, remaining, message)
  VALUES (v_user_id, auth.uid(), p_quantity, p_quantity, nullif(trim(coalesce(p_message, '')), ''))
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_user_id, v_email, p_quantity;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_gift_documents(text, integer, text) TO authenticated;

-- Historial de lo regalado, para el panel.
CREATE OR REPLACE FUNCTION public.admin_list_document_gifts(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid, email text, quantity integer, remaining integer,
  message text, created_at timestamptz, notified_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin_user() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT g.id, u.email::text, g.quantity, g.remaining, g.message, g.created_at, g.notified_at
  FROM public.document_gifts g
  JOIN auth.users u ON u.id = g.user_id
  ORDER BY g.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_list_document_gifts(integer) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- Lado de quien lo recibe
-- ══════════════════════════════════════════════════════════════════════

/** Regalos que aún no se le han anunciado. Sirve para el aviso con sonido. */
CREATE OR REPLACE FUNCTION public.my_unnotified_document_gifts()
RETURNS TABLE (id uuid, quantity integer, remaining integer, message text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT g.id, g.quantity, g.remaining, g.message, g.created_at
  FROM public.document_gifts g
  WHERE g.user_id = auth.uid() AND g.notified_at IS NULL
  ORDER BY g.created_at;
$$;
GRANT EXECUTE ON FUNCTION public.my_unnotified_document_gifts() TO authenticated;

/** Marca como anunciados. Sólo puede marcar los propios: el WHERE lleva
 *  auth.uid(), así que pasar el id de otra persona no hace nada. */
CREATE OR REPLACE FUNCTION public.mark_document_gifts_notified()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_n integer;
BEGIN
  UPDATE public.document_gifts
  SET notified_at = now()
  WHERE user_id = auth.uid() AND notified_at IS NULL;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;
GRANT EXECUTE ON FUNCTION public.mark_document_gifts_notified() TO authenticated;

/** Cuántos documentos regalados le quedan sin usar. */
CREATE OR REPLACE FUNCTION public.my_document_gift_balance()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(sum(g.remaining), 0)::integer
  FROM public.document_gifts g
  WHERE g.user_id = auth.uid();
$$;
GRANT EXECUTE ON FUNCTION public.my_document_gift_balance() TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- El cupo de 72 h, ahora con los regalos como respaldo
-- ══════════════════════════════════════════════════════════════════════
--
-- Se reemplaza la función existente conservando su firma y su comportamiento
-- para todo el mundo: quien no tenga regalos ve exactamente lo mismo que
-- antes. Lo único nuevo es el tramo final, que sólo se alcanza cuando el cupo
-- gratuito ya está agotado.
CREATE OR REPLACE FUNCTION public.try_consume_document_72h(p_user_id uuid, p_limit integer DEFAULT 2)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_gift  uuid;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;

  SELECT COUNT(*) INTO v_count FROM public.document_creation_events
  WHERE user_id = p_user_id AND created_at >= now() - interval '72 hours';

  IF v_count < p_limit THEN
    INSERT INTO public.document_creation_events (user_id) VALUES (p_user_id);
    RETURN true;
  END IF;

  -- Cupo agotado: se tira de los documentos regalados, del más antiguo al
  -- más nuevo. FOR UPDATE SKIP LOCKED evita que dos pestañas abiertas a la
  -- vez gasten dos veces el mismo regalo.
  SELECT g.id INTO v_gift
  FROM public.document_gifts g
  WHERE g.user_id = p_user_id AND g.remaining > 0
  ORDER BY g.created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_gift IS NOT NULL THEN
    UPDATE public.document_gifts SET remaining = remaining - 1 WHERE id = v_gift;
    -- Se registra igual como evento: los informes de uso cuentan documentos
    -- creados, y uno hecho con un regalo se creó igual que cualquier otro.
    INSERT INTO public.document_creation_events (user_id) VALUES (p_user_id);
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
GRANT EXECUTE ON FUNCTION public.try_consume_document_72h(uuid, integer) TO authenticated;

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('admin_gift_documents', 'my_unnotified_document_gifts',
                  'my_document_gift_balance', 'try_consume_document_72h');
