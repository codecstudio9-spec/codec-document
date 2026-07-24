import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';
import { useLanguage } from '../../contexts/language-context';
import { logVoiceAssistantEvent, type VoiceEventRole } from '../../services/voice-assistant-analytics-service';

const EXPAND_AFTER_CLICK_MS = 1800;

/**
 * Permanent floating "🎤 Escuchar instrucciones" button — repeats whatever
 * the voice last said (or tried to say) for the current step, without a
 * page reload. Only renders while the voice guide is turned on; a user who
 * turned it off already has the (separate) toggle to turn it back on.
 *
 * Collapsed to just the mic icon by default so it never sits on top of
 * form fields/dropzones underneath it (see the "Sube tu documento"
 * dropzone report) — it only expands into the labeled pill on hover
 * (desktop) or briefly after a tap (no hover on touch, so the click
 * itself doubles as the "reveal" for a moment).
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
  const { enabled, replay, stop } = useVoiceGuide();
  const { language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const collapseTimerRef = useRef<number | null>(null);

  // The voice engine plays via the browser's SpeechSynthesis API, which
  // keeps talking regardless of the React tree — leaving this page (a
  // client-side route change, not a real page unload) doesn't stop it on
  // its own. This button is mounted for exactly as long as the voice-guided
  // flow is on screen, so its unmount is the right moment to cut the audio.
  useEffect(() => () => stop(), [stop]);

  useEffect(() => () => {
    if (collapseTimerRef.current !== null) window.clearTimeout(collapseTimerRef.current);
  }, []);

  if (!enabled) return null;

  const label = language === 'en' ? 'Listen to instructions' : 'Escuchar instrucciones';

  const handleClick = () => {
    replay();
    logVoiceAssistantEvent({
      sessionId, role, flow, step, stepIndex, documentId, eventType: 'replay_button',
    });
    setExpanded(true);
    if (collapseTimerRef.current !== null) window.clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = window.setTimeout(() => setExpanded(false), EXPAND_AFTER_CLICK_MS);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      aria-label={label}
      title={label}
      className={[
        'fixed z-[9995] flex items-center gap-2 rounded-full bg-slate-900/90 text-white shadow-xl backdrop-blur-sm transition-all duration-200 active:scale-95 overflow-hidden',
        'bottom-20 right-4 sm:bottom-6',
        expanded ? 'px-4 py-3' : 'p-3.5',
        className ?? '',
      ].join(' ')}
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <Mic className="size-4 shrink-0 text-indigo-300" />
      <span
        className={[
          'overflow-hidden whitespace-nowrap text-xs font-bold transition-all duration-200',
          expanded ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0',
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  );
}
