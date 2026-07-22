import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/language-context';
import { voiceAssistant, type VoiceMessage } from '../services/voice-assistant-service';

/**
 * Speak-only API — no subscription to the on/off toggle state. Use this
 * in every page/component that only ever calls `speak()`/`stop()`/etc.
 * (which is nearly everywhere voice guidance is wired in). The full
 * `useVoiceGuide()` below additionally subscribes to `enabled` via
 * `voiceAssistant.onEnabledChange`, which forces a re-render of every
 * component that calls it whenever ANYONE flips the toggle ANYWHERE in
 * the app (the enabled flag is a single shared store, not per-component
 * state). On a large page component, an unrelated toggle click forcing a
 * full second render pass is exactly the kind of thing that can surface a
 * latent re-render bug that never shows up on the first mount — reserve
 * the subscription for components that actually need to show/react to
 * the boolean (VoiceGuideToggle, VoiceReplayButton).
 */
export function useVoiceSpeak() {
  const { language } = useLanguage();

  const speak = useCallback((text: VoiceMessage, highlight?: string) => {
    voiceAssistant.speak(text, language, highlight);
  }, [language]);

  const stop = useCallback(() => voiceAssistant.stop(), []);
  const pause = useCallback(() => voiceAssistant.pause(), []);
  const resume = useCallback(() => voiceAssistant.resume(), []);
  const replay = useCallback(() => voiceAssistant.replayLast(), []);

  return { speak, stop, pause, resume, replay };
}

/**
 * Full API, including the live `enabled` boolean — only needed by
 * components that render differently based on whether the voice guide is
 * on (the toggle switch itself, the floating replay button which hides
 * when the guide is off). Everything else should use `useVoiceSpeak()`
 * above to avoid the re-render coupling described there.
 */
export function useVoiceGuide() {
  const { speak, stop, pause, resume, replay } = useVoiceSpeak();
  const [enabled, setEnabledState] = useState(() => voiceAssistant.isEnabled());

  useEffect(() => voiceAssistant.onEnabledChange(setEnabledState), []);

  const setEnabled = useCallback((value: boolean) => {
    voiceAssistant.setEnabled(value);
  }, []);

  return { speak, stop, pause, resume, replay, enabled, setEnabled };
}
