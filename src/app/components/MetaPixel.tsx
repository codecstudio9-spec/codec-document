import { useEffect } from 'react';
import { router } from '../routes';
import { getAppSetting, META_PIXEL_ID_KEY } from '../services/app-settings-service';

interface FbqFunction {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: FbqFunction;
  loaded: boolean;
  version: string;
}

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

/** Standard Meta Pixel base code (from Events Manager), adapted to run
 * from a TS file instead of an inline <script> tag. Safe to call more
 * than once — it no-ops if `window.fbq` already exists. */
function installPixelStub() {
  if (window.fbq) return;

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as FbqFunction;
  fbq.queue = [];
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';

  window.fbq = fbq;
  window._fbq ??= fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);
}

/**
 * Mounted once at the app root (App.tsx), as a sibling of RouterProvider
 * — same "reads window.location directly, no router hooks" pattern as
 * InstallAppPrompt/SignedDocumentPopup, since useLocation() crashes
 * outside the Router tree. Route-change PageView tracking subscribes
 * directly to the `router` singleton instead (React Router's data router
 * exposes `.subscribe()` for exactly this: observing navigation from
 * outside the component tree it renders).
 *
 * The pixel ID itself lives in Supabase (app_settings, admin-editable
 * from Settings → Marketing) rather than being hardcoded, so it can be
 * set/rotated without a code deploy.
 */
export function MetaPixel() {
  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    getAppSetting(META_PIXEL_ID_KEY)
      .then((pixelId) => {
        if (cancelled || !pixelId) return;
        installPixelStub();
        window.fbq!('init', pixelId);
        window.fbq!('track', 'PageView');

        // SPA route changes don't trigger a real page load, so Meta's
        // pixel never sees them unless we tell it to — fire a PageView on
        // every navigation the same way a fresh <script> load would.
        let lastPath = router.state.location.pathname;
        unsubscribe = router.subscribe((state) => {
          if (state.location.pathname === lastPath) return;
          lastPath = state.location.pathname;
          window.fbq?.('track', 'PageView');
        });
      })
      .catch(() => {
        // No pixel configured, or the fetch failed — advertising tracking
        // is never allowed to break the app, so this is silently ignored.
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return null;
}
