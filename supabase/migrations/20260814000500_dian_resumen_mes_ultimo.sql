-- El resumen se apoya en el ÚLTIMO mes con documentos, no en el calendario.
--
-- ── El fallo ─────────────────────────────────────────────────────────────
-- La primera versión miraba el mes corriente. Un contador que en agosto se
-- sienta a procesar las facturas de junio —que es exactamente lo que hace un
-- contador— veía el resumen vacío y concluía que la herramienta no calcula
-- nada. La cifra estaba bien; la pregunta estaba mal hecha.
--
-- Ahora, sin mes indicado, se usa el último periodo del que hay documentos. Si
-- no hay ninguno, el mes corriente, para que la comparación siga teniendo un
-- punto de partida coherente.
--
-- Se puede seguir pidiendo un mes concreto con p_mes, que es lo que usará el
-- selector de periodo.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

CREATE OR REPLACE FUNCTION public.ed_resumen_mes(p_mes date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ini        date;
  v_fin        date;
  v_ini_prev   date;
  v_docs       bigint;
  v_docs_prev  bigint;
  v_valor      numeric;
  v_valor_prev numeric;
  v_limpios    bigint;
  v_por_tipo   jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  IF p_mes IS NOT NULL THEN
    v_ini := date_trunc('month', p_mes)::date;
  ELSE
    SELECT date_trunc('month', max(issue_date))::date INTO v_ini
    FROM ed_documents
    WHERE owner_user_id = auth.uid() AND issue_date IS NOT NULL;
    v_ini := coalesce(v_ini, date_trunc('month', current_date)::date);
  END IF;

  v_fin      := (v_ini + interval '1 month')::date;
  v_ini_prev := (v_ini - interval '1 month')::date;

  SELECT count(*), coalesce(sum(total), 0),
         count(*) FILTER (WHERE status = 'PROCESSED')
    INTO v_docs, v_valor, v_limpios
  FROM ed_documents
  WHERE owner_user_id = auth.uid()
    AND issue_date >= v_ini AND issue_date < v_fin;

  SELECT count(*), coalesce(sum(total), 0)
    INTO v_docs_prev, v_valor_prev
  FROM ed_documents
  WHERE owner_user_id = auth.uid()
    AND issue_date >= v_ini_prev AND issue_date < v_ini;

  SELECT coalesce(jsonb_agg(t ORDER BY (t->>'cantidad')::bigint DESC), '[]'::jsonb)
    INTO v_por_tipo
  FROM (
    SELECT jsonb_build_object(
             'tipo', doc_type,
             'cantidad', count(*),
             'valor', coalesce(sum(total), 0)
           ) AS t
    FROM ed_documents
    WHERE owner_user_id = auth.uid()
      AND issue_date >= v_ini AND issue_date < v_fin
    GROUP BY doc_type
  ) s;

  RETURN jsonb_build_object(
    'mes',             v_ini,
    'documentos',      v_docs,
    'valor_total',     v_valor,
    'sin_errores_pct', CASE WHEN v_docs > 0
                            THEN round((v_limpios::numeric / v_docs) * 100, 1)
                            ELSE NULL END,
    'documentos_prev', v_docs_prev,
    'valor_prev',      v_valor_prev,
    'por_tipo',        v_por_tipo
  );
END $$;

REVOKE ALL ON FUNCTION public.ed_resumen_mes(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ed_resumen_mes(date) TO authenticated;

-- Verificación
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace AND proname = 'ed_resumen_mes';
