/**
 * Voice-assistant telemetry — "cuántas veces se reprodujo la ayuda, en qué
 * paso se pidió, en qué paso abandonan más". Writes go through
 * log_voice_assistant_event() (SECURITY DEFINER, open to anon so an
 * anonymous guest signer can log too); reads go through two
 * SECURITY DEFINER RPCs gated by is_analytics_admin() (see
 * supabase_add_voice_assistant_analytics_migration.sql) — same admin/
 * analytics-viewer boundary already used for the rest of the admin panel.
 */
import { publicSupabase, supabase } from '../../lib/supabase';

export type VoiceEventRole = 'creator' | 'guest';
export type VoiceEventType = 'step_enter' | 'auto_play' | 'replay_button' | 'idle_hint' | 'stuck_hint';

// Same reasoning as analytics-service.ts's withTimeout — the admin panel
// must never show "Cargando…" forever on a slow/flaky connection.
function withTimeout<T>(thenable: PromiseLike<T>, ms = 12000): Promise<T> {
  return Promise.race([
    Promise.resolve(thenable),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
  ]);
}

/** Fire-and-forget, never throws — a telemetry hiccup must never interrupt
 * someone in the middle of signing a document. */
export function logVoiceAssistantEvent(params: {
  sessionId: string;
  role: VoiceEventRole;
  flow: string;
  step: string;
  stepIndex: number;
  eventType: VoiceEventType;
  isTerminal?: boolean;
  documentId?: string | null;
}): void {
  void (async () => {
    try {
      await publicSupabase.rpc('log_voice_assistant_event', {
        p_session_id: params.sessionId,
        p_role: params.role,
        p_flow: params.flow,
        p_step: params.step,
        p_step_index: params.stepIndex,
        p_event_type: params.eventType,
        p_is_terminal: params.isTerminal ?? false,
        p_document_id: params.documentId ?? null,
      });
    } catch { /* telemetry must never break the signing flow */ }
  })();
}

export interface VoiceAssistantSummary {
  totalPlays: number;
  autoPlays: number;
  replayButtonPlays: number;
  idleHintPlays: number;
  stuckHintPlays: number;
  uniqueSessions: number;
}

export async function fetchVoiceAssistantSummary(daysLimit = 30): Promise<VoiceAssistantSummary> {
  const fallback: VoiceAssistantSummary = { totalPlays: 0, autoPlays: 0, replayButtonPlays: 0, idleHintPlays: 0, stuckHintPlays: 0, uniqueSessions: 0 };
  const { data, error } = await withTimeout(supabase.rpc('get_voice_assistant_summary', { days_limit: daysLimit }));
  if (error || !data || !data[0]) return fallback;
  const row = data[0] as Record<string, number>;
  return {
    totalPlays: Number(row.total_plays) || 0,
    autoPlays: Number(row.auto_plays) || 0,
    replayButtonPlays: Number(row.replay_button_plays) || 0,
    idleHintPlays: Number(row.idle_hint_plays) || 0,
    stuckHintPlays: Number(row.stuck_hint_plays) || 0,
    uniqueSessions: Number(row.unique_sessions) || 0,
  };
}

export interface VoiceAssistantStepStats {
  flow: string;
  step: string;
  stepIndex: number;
  plays: number;
  sessionsReached: number;
  sessionsAbandoned: number;
  avgSecondsOnStep: number | null;
}

export async function fetchVoiceAssistantByStep(daysLimit = 30): Promise<VoiceAssistantStepStats[]> {
  const { data, error } = await withTimeout(supabase.rpc('get_voice_assistant_by_step', { days_limit: daysLimit }));
  if (error || !data) return [];
  return (data as Array<Record<string, number | string | null>>).map((row) => ({
    flow: String(row.flow),
    step: String(row.step),
    stepIndex: Number(row.step_index) || 0,
    plays: Number(row.plays) || 0,
    sessionsReached: Number(row.sessions_reached) || 0,
    sessionsAbandoned: Number(row.sessions_abandoned) || 0,
    avgSecondsOnStep: row.avg_seconds_on_step === null ? null : Number(row.avg_seconds_on_step),
  }));
}
