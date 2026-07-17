import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { LanguageProvider } from './contexts/language-context';
import { AuthProvider } from './contexts/auth-context';
import { CookieBanner } from './components/CookieBanner';
import { trackVisitorSession } from './services/analytics-service';

export default function App() {
  // Once per browser tab load (not per SPA route change — document.referrer
  // and the landing page are only meaningful at the real page load; the
  // session dedup inside trackVisitorSession already skips re-logging
  // within the same 30-min visit anyway).
  useEffect(() => { trackVisitorSession(); }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <CookieBanner />
        <Toaster />
      </AuthProvider>
    </LanguageProvider>
  );
}