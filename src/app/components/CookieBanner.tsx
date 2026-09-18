import { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../contexts/auth-context';

const CONSENT_KEY = 'codec_cookie_consent_v1';

export function CookieBanner() {
  const { isAdmin } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Admin bypasses the banner — no interruption during production audits
    if (isAdmin) return;
    if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
  }, [isAdmin]);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[9990] max-h-[45vh] overflow-y-auto border-t border-slate-700/50 bg-slate-950/97 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl shadow-black/50 backdrop-blur-2xl sm:px-4 sm:py-4 sm:pb-4"
    >
      <div className="container mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
        <ShieldCheck className="hidden size-5 shrink-0 text-indigo-400 sm:block" />
        {/* Use <a> tags — <Link> requires RouterProvider context which is a sibling, not an ancestor */}
        <p className="flex-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
          We use cookies to secure digital signatures and ensure proper audit trails. By using Codec
          Document, you agree to our{' '}
          <a href="/privacy" className="font-medium text-indigo-400 underline-offset-2 hover:underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/terms" className="font-medium text-indigo-400 underline-offset-2 hover:underline">
            Terms of Service
          </a>.
        </p>
        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={accept}
            className="min-h-11 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={accept}
            aria-label="Dismiss cookie banner"
            className="min-h-11 min-w-11 rounded-lg p-2.5 text-slate-500 transition hover:bg-white/8 hover:text-slate-300"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
