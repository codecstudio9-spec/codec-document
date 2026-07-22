import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/language-context';
import { voiceAssistant, type VoiceMessage } from '../services/voice-assistant-service';

/**
 * React-friendly wrapper around VoiceAssistantService. `speak()` here
 * always narrates in the page's current `language` (from useLanguage()),
 * not navigator.language — so narration matches whatever text is already
 * on screen instead of possibly disagreeing with a user who manually
 * switched the site to the other language. Pages with no i18n of their
 * own (nothing in this app yet besides electronic-signature-page.tsx)
 * can still call voiceAssistant.speak() directly to get the
 * navigator.language-based auto-detection instead.
 */
export function useVoiceGuide() {
  const { language } = useLanguage();
  const [enabled, setEnabledState] = useState(() => voiceAssistant.isEnabled());

  useEffect(() => voiceAssistant.onEnabledChange(setEnabledState), []);

  const speak = useCallback((text: VoiceMessage, highlight?: string) => {
    voiceAssistant.speak(text, language, highlight);
  }, [language]);

  const setEnabled = useCallback((value: boolean) => {
    voiceAssistant.setEnabled(value);
  }, []);

  const stop = useCallback(() => voiceAssistant.stop(), []);
  const pause = useCallback(() => voiceAssistant.pause(), []);
  const resume = useCallback(() => voiceAssistant.resume(), []);
  const replay = useCallback(() => voiceAssistant.replayLast(), []);

  return { speak, stop, pause, resume, replay, enabled, setEnabled };
}
