import { Volume2, VolumeX } from 'lucide-react';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';
import { useLanguage } from '../../contexts/language-context';

/**
 * "🔊 Activar guía por voz" switch — lets the user turn the contextual
 * voice narration off (or back on) at any point; the preference persists
 * in localStorage via VoiceAssistantService, so it stays put across
 * sessions and across every flow that renders this toggle.
 */
export function VoiceGuideToggle({ className }: { className?: string }) {
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
      className={[
        'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
        enabled ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500',
        className ?? '',
      ].join(' ')}
      title={enabled
        ? (language === 'en' ? 'Voice guide is on — tap to turn off' : 'Guía por voz activada — toca para apagar')
        : (language === 'en' ? 'Voice guide is off — tap to turn on' : 'Guía por voz desactivada — toca para activar')}
    >
      {enabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
      {language === 'en' ? 'Voice guide' : 'Guía por voz'}
    </button>
  );
}
