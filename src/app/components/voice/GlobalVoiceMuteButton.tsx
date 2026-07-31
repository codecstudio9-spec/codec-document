import { Volume2, VolumeX } from 'lucide-react';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';
import { useLanguage } from '../../contexts/language-context';

/**
 * Always-on-screen mute switch for the voice guide, mounted once at the
 * app root (App.tsx) next to <Toaster />/<SignedDocumentPopup /> — reachable
 * from literally any page, unlike VoiceGuideToggle (embedded inline in the
 * handful of page headers that opted into it).
 *
 * Anchored to the vertical center of the right edge on purpose: every other
 * fixed-position element in the app (mobile bottom tab bar, cookie banner,
 * the "document signed" popup, the home page FAB stack, guest-sign's bottom
 * action bar) anchors to a top or bottom corner/edge, so this is the one
 * screen region nothing else ever claims — placing it in a corner would
 * eventually stack it on top of one of those on some page.
 */
export function GlobalVoiceMuteButton() {
  const { enabled, setEnabled, stop } = useVoiceGuide();
  const { language } = useLanguage();

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (!next) stop();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      title={enabled
        ? (language === 'en' ? 'Voice guide is on — tap to turn off' : 'Guía por voz activada — toca para apagar')
        : (language === 'en' ? 'Voice guide is off — tap to turn on' : 'Guía por voz desactivada — toca para activar')}
      className={`fixed right-0 top-1/2 z-30 flex h-11 w-9 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 shadow-md backdrop-blur-sm transition-all hover:w-11 ${
        enabled
          ? 'border-indigo-200 bg-indigo-600/90 text-white'
          : 'border-slate-200 bg-white/90 text-slate-400'
      }`}
    >
      {enabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
    </button>
  );
}
