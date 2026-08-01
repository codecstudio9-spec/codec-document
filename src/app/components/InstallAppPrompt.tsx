import { useEffect, useRef, useState } from 'react';
import { Share, PlusSquare, X, Download } from 'lucide-react';
import { useIsMobile } from '../hooks/use-is-mobile';
import { useInstallPrompt, isIOSDevice, isStandaloneDisplay } from '../hooks/use-install-prompt';

const COOKIE_CONSENT_KEY = 'codec_cookie_consent_v1';
const IOS_DISMISS_KEY = 'codec_ios_install_dismissed_at';
const IOS_DISMISS_DAYS = 14;
const ANDROID_DISMISS_KEY = 'codec_android_install_dismissed';
const ANDROID_POS_KEY = 'codec_android_install_pos';

/**
 * iOS has no equivalent of Chrome/Android's automatic "install this app"
 * banner (no beforeinstallprompt event, no OS-level prompt at all — Apple
 * deliberately doesn't offer one) — the only way to install a PWA on an
 * iPhone is the user manually tapping Share → Add to Home Screen in
 * Safari. This banner is the closest available substitute: it can't
 * trigger the install itself, only walk the user through doing it.
 *
 * On Android/desktop Chrome, the OS already shows its own install
 * banner (that's what the user saw and tapped) — this component adds a
 * small on-demand "Install app" button for that case too, since Chrome
 * only shows its automatic banner once per session/some cooldown and a
 * dismissed one doesn't reappear for a while.
 *
 * Mounted once at the app root (App.tsx) — reads window.navigator
 * directly rather than any router hook, matching the lesson learned
 * from SignedDocumentPopup (useLocation/useNavigate crash outside the
 * Router tree; this component has the same "sibling of RouterProvider"
 * mounting position).
 */
export function InstallAppPrompt() {
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [androidDismissed, setAndroidDismissed] = useState(() => sessionStorage.getItem(ANDROID_DISMISS_KEY) === '1');
  const { canInstall, promptInstall } = useInstallPrompt();
  const isMobile = useIsMobile();
  // MobileAppShell renders a fixed 72px bottom tab bar (+ safe-area inset)
  // on every /app/* route on a real mobile viewport — same collision this
  // component's sibling SignedDocumentPopup hit, fixed the same way: read
  // window.location.pathname directly (no router hook — this mounts as a
  // sibling of <RouterProvider>, and useLocation() crashes there).
  const clearsBottomNav = isMobile && typeof window !== 'undefined' && window.location.pathname.startsWith('/app');

  useEffect(() => {
    if (isStandaloneDisplay()) return; // already installed — nothing to show

    if (isIOSDevice()) {
      // Don't stack on top of the cookie banner — wait until that's resolved.
      if (!localStorage.getItem(COOKIE_CONSENT_KEY)) return;
      const dismissedAt = Number(localStorage.getItem(IOS_DISMISS_KEY) || 0);
      const daysSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (!dismissedAt || daysSinceDismiss > IOS_DISMISS_DAYS) setShowIOSBanner(true);
    }
  }, []);

  const dismissIOS = () => {
    localStorage.setItem(IOS_DISMISS_KEY, String(Date.now()));
    setShowIOSBanner(false);
  };

  // Closing the Android/desktop button only hides it for this browser
  // session (sessionStorage, not localStorage) — it keeps showing up on
  // the main page on a later visit, it's just closable in the moment
  // instead of permanently glued to the screen.
  const dismissAndroid = () => {
    sessionStorage.setItem(ANDROID_DISMISS_KEY, '1');
    setAndroidDismissed(true);
  };

  const defaultBottom = clearsBottomNav ? 96 : 16;
  const drag = useDraggablePosition(ANDROID_POS_KEY);

  if (canInstall && !androidDismissed) {
    const style: React.CSSProperties = drag.pos
      ? { left: drag.pos.left, top: drag.pos.top, bottom: 'auto' }
      : { left: 16, bottom: defaultBottom };
    return (
      <div
        className="fixed z-[9980] flex items-center gap-1 rounded-full bg-indigo-600 pl-4 pr-1.5 py-1.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30"
        style={{ ...style, touchAction: 'none' }}
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      >
        <button
          type="button"
          onClick={() => { if (!drag.wasDragged()) void promptInstall(); }}
          className="flex items-center gap-2 py-1 active:scale-95"
        >
          <Download className="size-4" /> Instalar app
        </button>
        <button
          type="button"
          onClick={dismissAndroid}
          aria-label="Cerrar"
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  if (showIOSBanner) {
    return (
      <div
        role="dialog"
        aria-label="Instalar en iPhone"
        className={`fixed left-0 right-0 z-[9980] border-t border-slate-700/50 bg-slate-950/97 px-4 py-4 shadow-2xl shadow-black/50 backdrop-blur-2xl ${clearsBottomNav ? 'bottom-[72px]' : 'bottom-0'}`}
      >
        <div className="container mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20">
            <Download className="size-5 text-indigo-400" />
          </div>
          <p className="flex-1 text-sm leading-relaxed text-slate-300">
            Instala Codec Document en tu iPhone: toca{' '}
            <Share className="mx-0.5 inline size-4 -translate-y-0.5 text-indigo-400" /> (Compartir) y luego{' '}
            <span className="inline-flex items-center gap-1 font-semibold text-white">
              <PlusSquare className="size-3.5" /> Agregar a inicio
            </span>.
          </p>
          <button
            type="button"
            onClick={dismissIOS}
            aria-label="Cerrar aviso de instalacion"
            className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/8 hover:text-slate-300"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/** Lets the user drag the floating install button somewhere it isn't
 * blocking content, and remembers where they left it (per browser,
 * across sessions). A tap that never moves past a small threshold still
 * falls through as a normal click; a real drag suppresses it, mirroring
 * the same "swallow the click after a real gesture" trick used for
 * long-press elsewhere in the app (see use-long-press.ts). */
function useDraggablePosition(storageKey: string) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0 });

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { left: number; top: number };
      if (typeof parsed.left === 'number' && typeof parsed.top === 'number') setPos(parsed);
    } catch { /* ignore malformed value */ }
  }, [storageKey]);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    draggingRef.current = true;
    movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, left: rect.left, top: rect.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (!movedRef.current && Math.hypot(dx, dy) > 6) movedRef.current = true;
    if (!movedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const left = Math.min(Math.max(startRef.current.left + dx, 8), window.innerWidth - rect.width - 8);
    const top = Math.min(Math.max(startRef.current.top + dy, 8), window.innerHeight - rect.height - 8);
    setPos({ left, top });
  };

  const onPointerUp = () => {
    draggingRef.current = false;
    if (movedRef.current) {
      setPos((current) => {
        if (current) localStorage.setItem(storageKey, JSON.stringify(current));
        return current;
      });
    }
  };

  return {
    pos,
    wasDragged: () => movedRef.current,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
