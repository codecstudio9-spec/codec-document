import { useEffect, useState } from 'react';
import { voiceAssistant } from '../services/voice-assistant-service';

/**
 * Returns true while the voice guide is actively narrating a line tagged
 * with this exact `id` (the third arg to speak()/useVoiceStepGuide's
 * `highlight` option). Wire it into a button's className to make it pulse
 * right when the voice says "presiona Firmar" / "presiona Siguiente" —
 * reduces confusion for less tech-savvy users by tying the spoken
 * instruction to a visible cue instead of just words.
 *
 * Usage: className={`... ${useVoiceHighlight('firmar') ? PULSE_CLASSES : ''}`}
 */
export function useVoiceHighlight(id: string): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => voiceAssistant.onHighlightChange((activeId) => setActive(activeId === id)), [id]);
  return active;
}

/** Shared Tailwind classes for the pulse cue — one place to tune the look. */
export const VOICE_HIGHLIGHT_CLASSES = 'animate-pulse ring-4 ring-indigo-300 ring-offset-2';
