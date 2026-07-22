import { useEffect, useRef } from 'react';
import { useVoiceSpeak } from './useVoiceGuide';
import type { VoiceMessage } from '../services/voice-assistant-service';
import { logVoiceAssistantEvent, type VoiceEventRole } from '../services/voice-assistant-analytics-service';

const IDLE_HINT_MS = 15000; // no touch/scroll/key at all
const STUCK_HINT_MS = 20000; // still on the same step, whether or not they've been fiddling with it

export interface VoiceStepGuideOptions {
  /** True only for whichever step is actually on screen right now — call
   * this hook once per possible step (fixed hook-call count, per the Rules
   * of Hooks) and flip `active` per caller instead of calling it
   * conditionally. */
  active: boolean;
  sessionId: string;
  role: VoiceEventRole;
  /** Which page/wizard this belongs to, e.g. 'electronic-signature' or
   * 'guest-sign' — groups steps together in the admin panel. */
  flow: string;
  /** Unique key for this step within its flow. */
  step: string;
  /** Position in the flow's step order — drives the abandonment/avg-time
   * metrics in the admin panel. */
  stepIndex: number;
  /** Marks the flow's actual completion step so it's never counted as
   * "abandoned" just because no later step follows it. */
  isTerminal?: boolean;
  documentId?: string | null;
  /** Spoken (and logged as step_enter + auto_play) once, the moment this
   * step becomes active. Omit for a step that only needs presence logged. */
  message?: VoiceMessage;
  /** Names a useVoiceHighlight(id) target that should pulse while `message`
   * (or either hint below) is being read aloud. */
  highlight?: string;
  /** Spoken once after 15s with zero interaction anywhere on the page —
   * e.g. "Si necesitas ayuda, toca el botón de ayuda". */
  idleHint?: VoiceMessage;
  /** Spoken once after 20s still on this same step, regardless of whether
   * the user has been interacting (scrolling, zooming) without actually
   * progressing — e.g. "Puedes continuar presionando Siguiente". */
  stuckHint?: VoiceMessage;
}

/**
 * The voice engine's single integration point for a wizard step: speaks
 * the step's line once on activation, nudges the user if they stall (two
 * different stalls — true inactivity vs. stuck-on-this-step), and logs
 * every bit of it (step_enter/auto_play/idle_hint/stuck_hint) for the
 * "Asistente de Voz" admin panel. Telemetry never blocks or throws into
 * the signing flow — see logVoiceAssistantEvent.
 */
export function useVoiceStepGuide(opts: VoiceStepGuideOptions): void {
  const { speak } = useVoiceSpeak();
  const activatedStepRef = useRef<string | null>(null);

  const base = {
    sessionId: opts.sessionId,
    role: opts.role,
    flow: opts.flow,
    step: opts.step,
    stepIndex: opts.stepIndex,
    isTerminal: opts.isTerminal,
    documentId: opts.documentId,
  };

  // Speak + log once per activation of this step.
  useEffect(() => {
    if (!opts.active || activatedStepRef.current === opts.step) return;
    activatedStepRef.current = opts.step;

    logVoiceAssistantEvent({ ...base, eventType: 'step_enter' });
    if (opts.message) {
      speak(opts.message, opts.highlight);
      logVoiceAssistantEvent({ ...base, eventType: 'auto_play' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.active, opts.step]);

  // "Se quedó detenido" — 15s completely idle (no touch/scroll/key at all).
  useEffect(() => {
    if (!opts.active || !opts.idleHint) return;
    let firedOnce = false;
    let timer: number | null = null;
    const arm = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (firedOnce) return;
        firedOnce = true;
        speak(opts.idleHint!, opts.highlight);
        logVoiceAssistantEvent({ ...base, eventType: 'idle_hint' });
      }, IDLE_HINT_MS);
    };
    arm();
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchmove', 'scroll', 'keydown', 'wheel'];
    events.forEach((e) => window.addEventListener(e, arm, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, arm));
      if (timer !== null) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.active, opts.step]);

  // "No avanza" — 20s still on the same step, interaction or not.
  useEffect(() => {
    if (!opts.active || !opts.stuckHint) return;
    const timer = window.setTimeout(() => {
      speak(opts.stuckHint!, opts.highlight);
      logVoiceAssistantEvent({ ...base, eventType: 'stuck_hint' });
    }, STUCK_HINT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.active, opts.step]);
}
