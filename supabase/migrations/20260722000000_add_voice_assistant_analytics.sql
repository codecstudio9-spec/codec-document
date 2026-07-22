-- Voice assistant telemetry — "cuántas veces se reprodujo la ayuda, en qué
-- paso se pidió, en qué paso abandonan más, qué paso genera más dudas".
-- One row per event (step entered, line auto-played, replay button
-- pressed, idle/stuck hint fired). INSERT is open to anon/authenticated
-- (both creator and anonymous guest need to log events) via a
-- SECURITY DEFINER RPC; reads are admin/analytics-viewer-only, reusing the
-- is_analytics_admin() gate from 20260721000000_add_analytics_admin_grants.sql
-- so a granted analytics viewer sees this data too, not just the owner.

CREATE TABLE IF NOT EXISTS public.voice_assistant_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  session_id  text NOT NULL,
  role        text NOT NULL CHECK (role IN ('creator', 'guest')),
  flow        text NOT NULL,
  step        text NOT NULL,
  step_index  integer NOT NULL DEFAULT 0,
  is_terminal boolean NOT NULL DEFAULT false,
  event_type  text NOT NULL CHECK (event_type IN ('step_enter', 'auto_play', 'replay_button', 'idle_hint', 'stuck_hint')),
  document_id text
);
CREATE INDEX IF NOT EXISTS voice_assistant_events_session_idx ON public.voice_assistant_events (session_id, flow);
CREATE INDEX IF NOT EXISTS voice_assistant_events_flow_step_idx ON public.voice_assistant_events (flow, step_index);

ALTER TABLE public.voice_assistant_events ENABLE ROW LEVEL SECURITY;
-- No direct SELECT/INSERT policy for anon/authenticated — every access
-- goes through the two SECURITY DEFINER functions below.

CREATE OR REPLACE FUNCTION public.log_voice_assistant_event(
  p_session_id text, p_role text, p_flow text, p_step text,
  p_step_index int, p_event_type text,
  p_is_terminal boolean DEFAULT false, p_document_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.voice_assistant_events
    (session_id, role, flow, step, step_index, is_terminal, event_type, document_id)
  VALUES
    (p_session_id, p_role, p_flow, p_step, p_step_index, p_is_terminal, p_event_type, p_document_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_voice_assistant_event(text, text, text, text, int, text, boolean, text) TO anon, authenticated;

-- KPI row: reproducciones totales + desglose por tipo + sesiones únicas.
CREATE OR REPLACE FUNCTION public.get_voice_assistant_summary(days_limit int DEFAULT 30)
RETURNS TABLE (
  total_plays bigint, auto_plays bigint, replay_button_plays bigint,
  idle_hint_plays bigint, stuck_hint_plays bigint, unique_sessions bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE event_type IN ('auto_play', 'replay_button', 'idle_hint', 'stuck_hint'))::bigint,
    COUNT(*) FILTER (WHERE event_type = 'auto_play')::bigint,
    COUNT(*) FILTER (WHERE event_type = 'replay_button')::bigint,
    COUNT(*) FILTER (WHERE event_type = 'idle_hint')::bigint,
    COUNT(*) FILTER (WHERE event_type = 'stuck_hint')::bigint,
    COUNT(DISTINCT session_id)::bigint
  FROM public.voice_assistant_events
  WHERE created_at >= now() - (days_limit || ' days')::interval;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_voice_assistant_summary(int) TO authenticated;

-- Per-step breakdown: reproducciones, sesiones que llegaron, sesiones que
-- se quedaron ahí como su último paso (abandono), y tiempo promedio en el
-- paso (diferencia hasta el siguiente step_enter de la misma sesión).
CREATE OR REPLACE FUNCTION public.get_voice_assistant_by_step(days_limit int DEFAULT 30)
RETURNS TABLE (
  flow text, step text, step_index int,
  plays bigint, sessions_reached bigint, sessions_abandoned bigint,
  avg_seconds_on_step numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_analytics_admin() THEN RAISE EXCEPTION 'Access denied'; END IF;
  RETURN QUERY
  WITH windowed AS (
    SELECT
      e.session_id, e.flow, e.step, e.step_index, e.is_terminal, e.created_at,
      LEAD(e.created_at) OVER (PARTITION BY e.session_id, e.flow ORDER BY e.created_at) AS next_enter_at,
      MAX(e.step_index) OVER (PARTITION BY e.session_id, e.flow) AS session_max_step
    FROM public.voice_assistant_events e
    WHERE e.created_at >= now() - (days_limit || ' days')::interval
      AND e.event_type = 'step_enter'
  ),
  durations AS (
    SELECT
      flow, step, step_index, session_id,
      EXTRACT(EPOCH FROM (next_enter_at - created_at)) AS seconds_on_step,
      (session_max_step = step_index AND NOT is_terminal) AS is_abandon_point
    FROM windowed
  ),
  play_counts AS (
    SELECT flow, step, step_index, COUNT(*) AS plays
    FROM public.voice_assistant_events
    WHERE created_at >= now() - (days_limit || ' days')::interval
      AND event_type IN ('auto_play', 'replay_button', 'idle_hint', 'stuck_hint')
    GROUP BY flow, step, step_index
  )
  SELECT
    d.flow, d.step, d.step_index,
    COALESCE(pc.plays, 0)::bigint,
    COUNT(DISTINCT d.session_id)::bigint,
    COUNT(DISTINCT d.session_id) FILTER (WHERE d.is_abandon_point)::bigint,
    ROUND(AVG(d.seconds_on_step) FILTER (WHERE d.seconds_on_step IS NOT NULL), 1)
  FROM durations d
  LEFT JOIN play_counts pc ON pc.flow = d.flow AND pc.step = d.step AND pc.step_index = d.step_index
  GROUP BY d.flow, d.step, d.step_index, pc.plays
  ORDER BY d.flow, d.step_index;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_voice_assistant_by_step(int) TO authenticated;

-- Verificación
SELECT 'voice_assistant_events' AS check, COUNT(*) FROM public.voice_assistant_events;
