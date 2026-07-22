/**
 * VoiceAssistantService — contextual voice guidance using the browser's
 * native Web Speech API (SpeechSynthesis). No paid service, no backend
 * call, no API key: everything runs client-side in whatever voice the
 * OS/browser already ships.
 *
 * Language: auto-detected from `navigator.language` by default (es-ES,
 * es-CO, en-US, etc. — anything starting with "es" speaks Spanish,
 * everything else falls back to English) — this is what makes the
 * detection automatic per the spec. Callers that already know the site's
 * active UI language (most pages, via useLanguage()) can instead pass it
 * explicitly to `speak()` so the narration always matches what's on
 * screen, rather than possibly disagreeing with a user who manually
 * switched the site's language away from their OS default.
 */

export type VoiceLang = 'es' | 'en';
export type VoiceMessage = string | { es: string; en: string };

const STORAGE_KEY = 'codec_voice_guide_enabled';

function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function detectLang(): VoiceLang {
  const raw = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
  return raw.toLowerCase().startsWith('es') ? 'es' : 'en';
}

// speechSynthesis.getVoices() is often empty until the async
// 'voiceschanged' event fires (first page load, most browsers) — cached
// and kept fresh so pickVoice() below doesn't just silently get [] forever.
let cachedVoices: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  if (isSupported()) cachedVoices = window.speechSynthesis.getVoices();
}
if (isSupported()) {
  refreshVoices();
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
}

function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  const candidates = cachedVoices.filter((v) => v.lang.toLowerCase().startsWith(lang));
  if (candidates.length === 0) return null;
  return candidates.find((v) => v.default) ?? candidates[0];
}

function readStoredPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === null ? true : raw === 'true'; // defaults ON — an opt-out guide, not opt-in
}

type EnabledListener = (enabled: boolean) => void;

class VoiceAssistantServiceClass {
  private enabled = readStoredPreference();
  private listeners = new Set<EnabledListener>();

  isSupported(): boolean {
    return isSupported();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, String(value));
    if (!value) this.stop();
    this.listeners.forEach((l) => l(value));
  }

  /** Notified whenever the on/off preference changes — lets every toggle
   * instance across the app (one per active flow page) stay in sync
   * without prop-drilling. */
  onEnabledChange(listener: EnabledListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  detectLanguage(): VoiceLang {
    return detectLang();
  }

  /** Speaks `text` in the browser's TTS voice. Pass an explicit `lang` to
   * match a page's active UI language (via useLanguage()); omit it to
   * fall back to auto-detecting from navigator.language. No-ops silently
   * when the guide is off or the browser has no SpeechSynthesis support —
   * callers never need to guard for either case themselves. */
  speak(text: VoiceMessage, lang?: VoiceLang): void {
    if (!this.enabled || !isSupported()) return;
    const effectiveLang = lang ?? detectLang();
    const message = typeof text === 'string' ? text : text[effectiveLang];
    if (!message) return;

    // A new line always replaces whatever was mid-sentence — e.g. jumping
    // from one wizard step to the next shouldn't queue narration behind
    // stale guidance for a step the user already left.
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = effectiveLang === 'es' ? 'es-ES' : 'en-US';
    const voice = pickVoice(effectiveLang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  stop(): void {
    if (isSupported()) window.speechSynthesis.cancel();
  }

  pause(): void {
    if (isSupported()) window.speechSynthesis.pause();
  }

  resume(): void {
    if (isSupported()) window.speechSynthesis.resume();
  }
}

export const voiceAssistant = new VoiceAssistantServiceClass();
