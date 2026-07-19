import { useEffect, Suspense } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { LanguageProvider } from './contexts/language-context';
import { AuthProvider } from './contexts/auth-context';
import { CookieBanner } from './components/CookieBanner';
import { trackVisitorSession } from './services/analytics-service';

/** Shown while a lazy-loaded route's JS chunk downloads (routes.tsx) —
 * brief on a real connection, but real on a slow one, so it's a small
 * on-brand spinner rather than a blank white flash. */
function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div
        className="size-8 animate-spin rounded-full border-2 border-slate-200"
        style={{ borderTopColor: '#4338CA' }}
      />
    </div>
  );
}

export default function App() {
  // Once per browser tab load (not per SPA route change — document.referrer
  // and the landing page are only meaningful at the real page load; the
  // session dedup inside trackVisitorSession already skips re-logging
  // within the same 30-min visit anyway).
  useEffect(() => { trackVisitorSession(); }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <RouterProvider router={router} />
        </Suspense>
        <CookieBanner />
        <Toaster />
      </AuthProvider>
    </LanguageProvider>
  );
}