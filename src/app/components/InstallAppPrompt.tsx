import { useEffect, useState } from 'react';
import { Share, PlusSquare, X, Download } from 'lucide-react';
import { useIsMobile } from '../hooks/use-is-mobile';

const COOKIE_CONSENT_KEY = 'codec_cookie_consent_v1';
const IOS_DISMISS_KEY = 'codec_ios_install_dismissed_at';
const IOS_DISMISS_DAYS = 14;

function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

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
  const [androidPromptEvent, setAndroidPromptEvent] = useState<Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> } | null>(null);
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
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setAndroidPromptEvent(e as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> });
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismissIOS = () => {
    localStorage.setItem(IOS_DISMISS_KEY, String(Date.now()));
    setShowIOSBanner(false);
  };

  const handleAndroidInstall = async () => {
    if (!androidPromptEvent) return;
    androidPromptEvent.prompt();
    await androidPromptEvent.userChoice;
    setAndroidPromptEvent(null);
  };

  if (androidPromptEvent) {
    return (
      <button
        type="button"
        onClick={() => void handleAndroidInstall()}
        className={`fixed left-4 z-[9980] flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95 ${clearsBottomNav ? 'bottom-24' : 'bottom-4'}`}
      >
        <Download className="size-4" /> Instalar app
      </button>
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
