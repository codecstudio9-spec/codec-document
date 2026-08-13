-- Resumen mensual del contador, con comparación contra el mes anterior.
--
-- ── Por qué en la base y no en el cliente ────────────────────────────────
-- El cliente tendría que traerse todas las filas del mes para agrupar, y un
-- contador del plan Empresarial tiene 23.000 documentos al mes. Descargarlos
-- para contar cuántos son de cada tipo es tráfico y memoria a cambio de nada:
-- lo que se necesita son ocho cifras.
--
-- ── La comparación con el mes anterior ───────────────────────────────────
-- Es lo que convierte una cifra en información. «1.250 documentos» no dice si
-- fue un buen mes; «1.250, un 12 % más que abril» sí. Y para un contador esa
-- variación es además una señal de trabajo: si un cliente le manda de golpe el
-- doble, quiere saberlo antes de cerrar el periodo.
--
-- Se cuenta por `issue_date` (la fecha del documento) y no por cuándo se
-- importó: al contador le importa el periodo fiscal, no el día en que se sentó
-- a subir los archivos.
--
-- Aplicar con:
--   supabase db push --workdir "C:\Users\hp\Downloads\CODEC DOCUMENT (2)\CODEC DOCUMENT" --yes

CREATE OR REPLACE FUNCTION public.ed_resumen_mes(p_mes date DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ini      date;
  v_fin      date;
  v_ini_prev date;
  v_docs     bigint;
  v_docs_prev bigint;
  v_valor    numeric;
  v_valor_prev numeric;
  v_limpios  bigint;
  v_por_tipo jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'sin_sesion');
  END IF;

  v_ini      := date_trunc('month', coalesce(p_mes, current_date))::date;
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

  -- Reparto por tipo, ya ordenado de mayor a menor: la dona se dibuja en ese
  -- orden y hacerlo aquí evita que cada pantalla lo reordene a su manera.
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
    'mes',            v_ini,
    'documentos',     v_docs,
    'valor_total',    v_valor,
    -- Sin documentos no hay porcentaje. Devolver 0 % diria «todo mal» cuando
    -- lo cierto es que no hay nada que juzgar.
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
