import { Mic } from 'lucide-react';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';
import { useLanguage } from '../../contexts/language-context';
import { logVoiceAssistantEvent, type VoiceEventRole } from '../../services/voice-assistant-analytics-service';

/**
 * Permanent floating "🎤 Escuchar instrucciones" button — repeats whatever
 * the voice last said (or tried to say) for the current step, without a
 * page reload. Only renders while the voice guide is turned on; a user who
 * turned it off already has the (separate) toggle to turn it back on.
 */
export function VoiceReplayButton({
  sessionId, role, flow, step, stepIndex, documentId, className,
}: {
  sessionId: string;
  role: VoiceEventRole;
  flow: string;
  step: string;
  stepIndex: number;
  documentId?: string | null;
  className?: string;
}) {
  const { enabled, replay } = useVoiceGuide();
  const { language } = useLanguage();
  if (!enabled) return null;

  const handleClick = () => {
    replay();
    logVoiceAssistantEvent({
      sessionId, role, flow, step, stepIndex, documentId, eventType: 'replay_button',
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'fixed z-[9995] flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-3 text-xs font-bold text-white shadow-xl backdrop-blur-sm transition active:scale-95',
        'bottom-20 right-4 sm:bottom-6',
        className ?? '',
      ].join(' ')}
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <Mic className="size-4 shrink-0 text-indigo-300" />
      {language === 'en' ? 'Listen to instructions' : 'Escuchar instrucciones'}
    </button>
  );
}
