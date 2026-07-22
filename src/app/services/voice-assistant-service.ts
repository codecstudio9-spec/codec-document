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
 *
 * Voice/accent — Web Speech API has a hard ceiling worth knowing up front:
 * it can only pick among whatever voices the user's OS/browser already has
 * installed (Windows/macOS/Android/iOS speech packs). There is no API knob
 * for "neural" or "HD" quality, and no way to request a specific voice
 * provider — `pickVoice()` below picks the BEST candidate available on the
 * device, ranked to strongly prefer Latin American Spanish locales
 * (es-419/es-MX/es-US/es-CO/…) over peninsular Spanish (es-ES), per the
 * corporate LatAm accent requirement. On a device whose only Spanish voice
 * happens to be Spain Spanish, that's still what plays — there is no free,
 * guaranteed way around that; a hard guarantee of a specific neural LatAm
 * voice (e.g. Mexican/Colombian) would require a paid cloud TTS provider
 * (Azure Neural, Google Cloud TTS, Amazon Polly, ElevenLabs) instead of
 * this native, zero-cost approach.
 */

export type VoiceLang = 'es' | 'en';
export type VoiceMessage = string | { es: string; en: string };

const STORAGE_KEY = 'codec_voice_guide_enabled';

// Fluid, friendly, real-time-guide pace (like a navigation/mobility
// assistant) — slightly brisker than the 1.0 robotic default, without
// sounding rushed. Natural-sounding pauses come from the punctuation in
// each message's text itself (commas, periods) — the Web Speech API's
// SpeechSynthesisUtterance takes plain text only, not SSML, so pacing
// can't be scripted beyond that.
const SPEECH_RATE = 1.03;
const SPEECH_PITCH = 1.0;

// Ranked so index 0 is most preferred. Any locale on this list beats a
// bare "es" tag or es-ES; es-ES itself is the explicit last resort.
const LATAM_LOCALE_PRIORITY = [
  'es-419', 'es-mx', 'es-us', 'es-co', 'es-ar', 'es-cl', 'es-pe', 'es-ve',
  'es-ec', 'es-gt', 'es-cr', 'es-pa', 'es-do', 'es-hn', 'es-sv', 'es-ni',
  'es-py', 'es-uy', 'es-bo', 'es-pr',
];

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

// Higher is better. Peninsular Spanish (es-ES, or a voice literally named
// "Spain"/"España") is never excluded outright — a device with no other
// Spanish voice at all still needs something to speak — but it's ranked
// below every Latin American locale, including an unrecognized bare "es".
function spanishVoiceScore(v: SpeechSynthesisVoice): number {
  const lang = v.lang.toLowerCase();
  const name = v.name.toLowerCase();
  if (lang === 'es-es' || name.includes('spain') || name.includes('españa') || name.includes('espana')) return 0;
  const idx = LATAM_LOCALE_PRIORITY.indexOf(lang);
  if (idx !== -1) return 100 - idx;
  return 50; // bare "es" or an unlisted-but-not-Spain regional tag
}

function pickVoice(lang: VoiceLang): SpeechSynthesisVoice | null {
  const candidates = cachedVoices.filter((v) => v.lang.toLowerCase().startsWith(lang));
  if (candidates.length === 0) return null;
  if (lang === 'en') return candidates.find((v) => v.default) ?? candidates[0];
  return [...candidates].sort((a, b) => spanishVoiceScore(b) - spanishVoiceScore(a))[0];
}

function readStoredPreference(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === null ? true : raw === 'true'; // defaults ON — an opt-out guide, not opt-in
}

type EnabledListener = (enabled: boolean) => void;

/**
 * Three real Web Speech API gotchas explain "works once, then goes quiet"
 * and "never works for the guest at all":
 *
 * 1. Autoplay-style gating. Chrome/Safari (Safari especially) can silently
 *    drop `speechSynthesis.speak()` calls that aren't triggered by a user
 *    gesture — no error, it just never plays. The CREATOR triggers the
 *    first narration only after already clicking "upload" etc., so that
 *    gesture carries over. The GUEST opens a link from WhatsApp and the
 *    very first thing that happens is an auto-fired speak() with zero
 *    prior taps on that page — exactly the case these browsers block.
 *    Fix: track whether we've seen a real gesture yet; if a speak() call
 *    happens before one, remember it and replay it on the first tap.
 * 2. cancel() immediately followed by speak() in the same tick can race
 *    internally in Chrome and silently no-op — the second, third, etc.
 *    call in a session (every one of which cancels the previous line) is
 *    exactly where this bites, matching "the first line plays, nothing
 *    after that does." Fix: defer the speak() one tick after cancel().
 * 3. Garbage collection. Some engines stop mid-utterance if the
 *    SpeechSynthesisUtterance object has no surviving reference outside
 *    the function that created it. Fix: keep one alive on the instance.
 */
class VoiceAssistantServiceClass {
  private enabled = readStoredPreference();
  private listeners = new Set<EnabledListener>();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private keepAliveTimer: number | null = null;
  private gestureSeen = false;
  private pendingReplay: { message: string; lang: VoiceLang } | null = null;

  constructor() {
    if (typeof document === 'undefined') return;
    const onGesture = () => {
      this.gestureSeen = true;
      // A paused/stuck synthesis queue from before the gesture often just
      // needs a nudge — harmless no-op if nothing was paused.
      if (isSupported()) window.speechSynthesis.resume();
      if (this.pendingReplay) {
        const { message, lang } = this.pendingReplay;
        this.pendingReplay = null;
        this.speakNow(message, lang);
      }
    };
    // Not `{ once: true }` — every future gesture also gets a resume()
    // nudge, which is what actually recovers a silently-stuck engine.
    document.addEventListener('pointerdown', onGesture, { capture: true });
    document.addEventListener('keydown', onGesture, { capture: true });
  }

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

    if (!this.gestureSeen) {
      // Almost certainly about to be silently dropped (no user gesture on
      // this page yet) — remember it so the guest's first tap replays it,
      // instead of the whole flow just staying mute.
      this.pendingReplay = { message, lang: effectiveLang };
    }
    this.speakNow(message, effectiveLang);
  }

  private speakNow(message: string, effectiveLang: VoiceLang): void {
    if (this.keepAliveTimer !== null) { window.clearInterval(this.keepAliveTimer); this.keepAliveTimer = null; }

    // A new line always replaces whatever was mid-sentence — e.g. jumping
    // from one wizard step to the next shouldn't queue narration behind
    // stale guidance for a step the user already left. Deferred one tick
    // (see class doc, gotcha #2) so Chrome's cancel()→speak() race doesn't
    // silently swallow every line after the first.
    window.speechSynthesis.cancel();
    window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(message);
      const voice = pickVoice(effectiveLang);
      if (voice) {
        utterance.voice = voice;
        // Match the tag to the voice we actually picked (e.g. es-MX) instead
        // of forcing es-ES, which some engines use to bias pronunciation
        // toward peninsular Spanish even when a LatAm voice is selected.
        utterance.lang = voice.lang;
      } else {
        utterance.lang = effectiveLang === 'es' ? 'es-419' : 'en-US';
      }
      utterance.rate = SPEECH_RATE;
      utterance.pitch = SPEECH_PITCH;

      utterance.onstart = () => {
        if (this.pendingReplay?.message === message) this.pendingReplay = null;
        // Chrome silently pauses long-running synthesis after ~15s unless
        // nudged — a cheap periodic pause/resume keeps it alive. Cleared
        // in onend/onerror below and at the top of the next speakNow().
        this.keepAliveTimer = window.setInterval(() => {
          if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); window.speechSynthesis.resume(); }
        }, 5000);
      };
      const clearKeepAlive = () => {
        if (this.keepAliveTimer !== null) { window.clearInterval(this.keepAliveTimer); this.keepAliveTimer = null; }
        this.currentUtterance = null;
      };
      utterance.onend = clearKeepAlive;
      utterance.onerror = clearKeepAlive;

      // Held on the instance (gotcha #3) so nothing garbage-collects the
      // utterance mid-speech — a local variable alone isn't enough on
      // every engine.
      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }, 0);
  }

  stop(): void {
    this.pendingReplay = null;
    if (this.keepAliveTimer !== null) { window.clearInterval(this.keepAliveTimer); this.keepAliveTimer = null; }
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
