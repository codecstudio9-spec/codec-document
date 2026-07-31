import { useEffect, useRef, useState } from 'react';
import { Headphones } from 'lucide-react';
import { useVoiceGuide } from '../../hooks/useVoiceGuide';
import { useLanguage } from '../../contexts/language-context';

const POSITION_KEY = 'codec_voice_btn_top';
const BUTTON_HALF_HEIGHT = 22; // half of the 44px (h-11) button height
const DRAG_THRESHOLD = 6; // px of movement before a tap becomes a drag

function clampTop(top: number): number {
  const min = BUTTON_HALF_HEIGHT + 8;
  const max = window.innerHeight - BUTTON_HALF_HEIGHT - 8;
  return Math.min(Math.max(top, min), Math.max(min, max));
}

/**
 * Always-on-screen mute switch for the voice guide, mounted once at the
 * app root (App.tsx) next to <Toaster />/<SignedDocumentPopup /> — reachable
 * from literally any page, unlike VoiceGuideToggle (embedded inline in the
 * handful of page headers that opted into it).
 *
 * Anchored to the right edge on purpose: every other fixed-position
 * element in the app (mobile bottom tab bar, cookie banner, the
 * "document signed" popup, the home page FAB stack, guest-sign's bottom
 * action bar) anchors to a top or bottom corner/edge, so the right edge
 * is the one screen region nothing else ever claims. Vertical position is
 * user-draggable (mouse or touch, via Pointer Events) and persisted in
 * localStorage — starts at vertical-center on first visit.
 *
 * Reads window.location.pathname directly instead of react-router's
 * useLocation() — this component mounts as a sibling of <RouterProvider>
 * in App.tsx, outside the Router tree, and useLocation() crashed the
 * whole app (blank screen, every route) the one time it was tried on a
 * component mounted here (see SignedDocumentPopup's history).
 */
export function GlobalVoiceMuteButton() {
  const { enabled, setEnabled, stop, speak } = useVoiceGuide();
  const { language } = useLanguage();

  const [top, setTop] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = Number(localStorage.getItem(POSITION_KEY));
    return saved > 0 ? clampTop(saved) : Math.round(window.innerHeight / 2);
  });

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startYRef = useRef(0);
  const startTopRef = useRef(0);

  useEffect(() => {
    const onResize = () => setTop((t) => clampTop(t));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    movedRef.current = false;
    startYRef.current = e.clientY;
    startTopRef.current = top;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    const delta = e.clientY - startYRef.current;
    if (Math.abs(delta) > DRAG_THRESHOLD) movedRef.current = true;
    if (movedRef.current) setTop(clampTop(startTopRef.current + delta));
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (movedRef.current) {
      localStorage.setItem(POSITION_KEY, String(top));
      return; // it was a drag, not a tap — don't toggle
    }
    handleToggle();
  };

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      stop();
      return;
    }
    // Only greets on the home page — everywhere else this button is just
    // a silent on/off switch, per explicit user request.
    if (window.location.pathname === '/') {
      speak({
        en: "I'm here to help you complete your documents, or sign them.",
        es: 'Aquí estoy para ayudarte a completar tus documentos, o firmarlos.',
      });
    }
  };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      title={enabled
        ? (language === 'en' ? 'Voice guide is on — tap to turn off, drag to move' : 'Guía por voz activada — toca para apagar, arrastra para mover')
        : (language === 'en' ? 'Voice guide is off — tap to turn on, drag to move' : 'Guía por voz desactivada — toca para activar, arrastra para mover')}
      style={{ top, touchAction: 'none' }}
      className={`fixed right-0 z-30 flex h-11 w-9 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 shadow-md backdrop-blur-sm transition-[width,background-color] hover:w-11 ${
        enabled
          ? 'border-indigo-200 bg-indigo-600/90 text-white'
          : 'border-slate-200 bg-white/90 text-slate-400'
      }`}
    >
      <Headphones className="size-4" />
    </button>
  );
}
