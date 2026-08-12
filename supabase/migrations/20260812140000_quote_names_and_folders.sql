-- Nombre propio y carpetas para las cotizaciones guardadas.
--
-- Las cotizaciones ya se guardaban, pero en el panel sólo se distinguían por
-- el número («Q-20260812-a3f1») y el nombre del cliente. Quien manda varias
-- al mes no reconoce la suya de un vistazo, y menos aún encuentra la que
-- quiere duplicar para no volver a escribirla entera.
--
-- Dos cosas, entonces:
--   · `name`      — cómo la llama su dueño («Kevin Hernández», «Agendas
--                   diciembre»). Es un rótulo interno: no sale en el PDF.
--   · carpetas    — Clientes, Proveedores, Clientes especiales, lo que haga
--                   falta.
--
-- ── Por qué las carpetas son una tabla y no un texto ─────────────────────
--
-- Con una columna de texto en `quotes`, una carpeta sólo existe mientras
-- tenga cotizaciones dentro: crear «Proveedores» y verla desaparecer hasta
-- meter algo es desconcertante. Con tabla propia, la carpeta existe desde que
-- se crea, aunque esté vacía, que es como funciona una carpeta en cualquier
-- sitio.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

CREATE TABLE IF NOT EXISTS public.quote_folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  -- Color para distinguirlas de un vistazo en el panel.
  color      text NOT NULL DEFAULT '#4338CA',
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Dos carpetas con el mismo nombre para la misma persona no tienen sentido
  -- y hacen imposible saber en cuál se guardó algo.
  UNIQUE (user_id, name)
);

ALTER TABLE public.quote_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_folders_own ON public.quote_folders;
CREATE POLICY quote_folders_own ON public.quote_folders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS name text;
-- ON DELETE SET NULL: borrar una carpeta no puede llevarse por delante las
-- cotizaciones que había dentro. Vuelven a «sin carpeta», que es recuperable;
-- borradas, no.
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS folder_id uuid
  REFERENCES public.quote_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quotes_folder_idx ON public.quotes (user_id, folder_id);

-- ══════════════════════════════════════════════════════════════════════
-- Carpetas
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.list_my_quote_folders()
RETURNS TABLE (id uuid, name text, color text, created_at timestamptz, quote_count integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.name, f.color, f.created_at,
         (SELECT count(*)::integer FROM public.quotes q WHERE q.folder_id = f.id) AS quote_count
  FROM public.quote_folders f
  WHERE f.user_id = auth.uid()
  ORDER BY f.name;
$$;
GRANT EXECUTE ON FUNCTION public.list_my_quote_folders() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_quote_folder(p_name text, p_color text DEFAULT '#4338CA')
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.quote_folders (user_id, name, color)
  VALUES (auth.uid(), trim(p_name), coalesce(nullif(trim(p_color), ''), '#4338CA'))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_quote_folder(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rename_quote_folder(p_id uuid, p_name text, p_color text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.quote_folders
  SET name = coalesce(nullif(trim(p_name), ''), name),
      color = coalesce(nullif(trim(p_color), ''), color)
  WHERE id = p_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION public.rename_quote_folder(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_quote_folder(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.quote_folders WHERE id = p_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_quote_folder(uuid) TO authenticated;

/** Mover una cotización a una carpeta (o sacarla, con p_folder_id = NULL).
 *  Comprueba que AMBAS cosas son de quien llama: sin la segunda condición,
 *  se podría mover una cotización propia a la carpeta de otra persona. */
CREATE OR REPLACE FUNCTION public.set_quote_folder(p_quote_id uuid, p_folder_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_folder_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.quote_folders f WHERE f.id = p_folder_id AND f.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Esa carpeta no existe';
  END IF;

  UPDATE public.quotes SET folder_id = p_folder_id, updated_at = now()
  WHERE id = p_quote_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_quote_folder(uuid, uuid) TO authenticated;

/** Ponerle nombre a una cotización guardada. */
CREATE OR REPLACE FUNCTION public.set_quote_name(p_quote_id uuid, p_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.quotes
  SET name = nullif(trim(coalesce(p_name, '')), ''), updated_at = now()
  WHERE id = p_quote_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_quote_name(uuid, text) TO authenticated;

/** Duplicar una cotización con todos sus productos: el motivo por el que se
 *  guardan con nombre es poder reutilizarlas ya llenas. La copia nace como
 *  borrador con número nuevo — nunca hereda el estado de envío ni el PDF ni
 *  la firma del original, que pertenecen a aquel envío y no a este. */
CREATE OR REPLACE FUNCTION public.duplicate_quote(p_id uuid, p_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new uuid;
BEGIN
  INSERT INTO public.quotes (
    user_id, quote_number, status, country, language, quote_type,
    client_name, client_company, client_position, client_email, client_phone, client_address,
    project_name, executive_summary, project_objective, project_scope, proposal_blocks,
    subtotal, discount_total, tax_total, total, template, name, folder_id
  )
  SELECT
    q.user_id,
    'Q-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4),
    'draft',
    q.country, q.language, q.quote_type,
    q.client_name, q.client_company, q.client_position, q.client_email, q.client_phone, q.client_address,
    q.project_name, q.executive_summary, q.project_objective, q.project_scope, q.proposal_blocks,
    q.subtotal, q.discount_total, q.tax_total, q.total, q.template,
    coalesce(nullif(trim(coalesce(p_name, '')), ''), coalesce(q.name, q.client_name) || ' (copia)'),
    q.folder_id
  FROM public.quotes q
  WHERE q.id = p_id AND q.user_id = auth.uid()
  RETURNING id INTO v_new;

  IF v_new IS NULL THEN RAISE EXCEPTION 'Cotización no encontrada'; END IF;

  INSERT INTO public.quote_line_items (quote_id, position, description, quantity, unit, unit_price, discount_pct, tax_pct)
  SELECT v_new, i.position, i.description, i.quantity, i.unit, i.unit_price, i.discount_pct, i.tax_pct
  FROM public.quote_line_items i WHERE i.quote_id = p_id;

  RETURN v_new;
END;
$$;
GRANT EXECUTE ON FUNCTION public.duplicate_quote(uuid, text) TO authenticated;

-- ══════════════════════════════════════════════════════════════════════
-- create_quote / update_quote: que acepten name y folder_id
-- ══════════════════════════════════════════════════════════════════════
--
-- Ambas listan las columnas una a una, así que un campo nuevo en el JSON se
-- ignoraría en silencio si no se añade aquí también.

CREATE OR REPLACE FUNCTION public.create_quote(p_quote jsonb, p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_item jsonb; v_pos integer := 0; v_folder uuid;
BEGIN
  -- Una carpeta ajena colada en el JSON no puede aceptarse: se comprueba que
  -- sea de quien llama, y si no, la cotización nace sin carpeta.
  v_folder := nullif(p_quote->>'folder_id', '')::uuid;
  IF v_folder IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.quote_folders f WHERE f.id = v_folder AND f.user_id = auth.uid()
  ) THEN
    v_folder := NULL;
  END IF;

  INSERT INTO public.quotes (
    user_id, quote_number, country, language, quote_type, client_name, client_company,
    client_position, client_email, client_phone, client_address, project_name,
    executive_summary, project_objective, project_scope, proposal_blocks,
    subtotal, discount_total, tax_total, total, template, name, folder_id
  ) VALUES (
    auth.uid(),
    COALESCE(p_quote->>'quote_number', 'Q-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 4)),
    p_quote->>'country', COALESCE(p_quote->>'language', 'es'), COALESCE(p_quote->>'quote_type', 'quote'),
    p_quote->>'client_name', p_quote->>'client_company', p_quote->>'client_position',
    p_quote->>'client_email', p_quote->>'client_phone', p_quote->>'client_address',
    p_quote->>'project_name', p_quote->>'executive_summary', p_quote->>'project_objective', p_quote->>'project_scope',
    COALESCE(p_quote->'proposal_blocks', '{}'::jsonb),
    COALESCE((p_quote->>'subtotal')::numeric, 0), COALESCE((p_quote->>'discount_total')::numeric, 0),
    COALESCE((p_quote->>'tax_total')::numeric, 0), COALESCE((p_quote->>'total')::numeric, 0),
    COALESCE(p_quote->>'template', 'corporate'),
    nullif(trim(coalesce(p_quote->>'name', '')), ''),
    v_folder
  ) RETURNING id INTO v_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) LOOP
    INSERT INTO public.quote_line_items (quote_id, position, description, quantity, unit, unit_price, discount_pct, tax_pct)
    VALUES (
      v_id, v_pos, v_item->>'description', COALESCE((v_item->>'quantity')::numeric, 1), v_item->>'unit',
      COALESCE((v_item->>'unit_price')::numeric, 0), COALESCE((v_item->>'discount_pct')::numeric, 0),
      COALESCE((v_item->>'tax_pct')::numeric, 0)
    );
    v_pos := v_pos + 1;
  END LOOP;

  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_quote(jsonb, jsonb) TO authenticated;

-- Verificación
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name IN ('name', 'folder_id');
