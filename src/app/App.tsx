import { useEffect, useState, Suspense, lazy, type ReactNode } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { LanguageProvider } from './contexts/language-context';
import { AuthProvider } from './contexts/auth-context';
import { AdminMfaGate } from './components/auth/AdminMfaGate';
import { CookieBanner } from './components/CookieBanner';
import { GlobalVoiceMuteButton } from './components/voice/GlobalVoiceMuteButton';
import { trackVisitorSession } from './services/analytics-service';

// Avisos flotantes que nadie necesita para ver la página: se cargan cuando ya
// terminó de cargar. Antes iban en el JavaScript de entrada que descarga todo
// visitante, y con ellos la librería de animaciones entera (~126 KB) — la
// mayor parte del tiempo bloqueado que Lighthouse medía en celular.
const SignedDocumentPopup = lazy(() => import('./components/SignedDocumentPopup').then((m) => ({ default: m.SignedDocumentPopup })));
const InstallAppPrompt = lazy(() => import('./components/InstallAppPrompt').then((m) => ({ default: m.InstallAppPrompt })));
const MetaPixel = lazy(() => import('./components/MetaPixel').then((m) => ({ default: m.MetaPixel })));
const AvisoDeRegalo = lazy(() => import('./components/AvisoDeRegalo').then((m) => ({ default: m.AvisoDeRegalo })));

/** Monta a sus hijos cuando la página ya cargó y el navegador está libre
 *  (o a los 4 s como máximo), para que no compitan con el contenido. */
function CuandoTermineDeCargar({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false);
  useEffect(() => {
    let cancelado = false;
    const marcar = () => { if (!cancelado) setListo(true); };
    const enReposo = () => {
      const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(marcar, { timeout: 4000 });
      else setTimeout(marcar, 1500);
    };
    if (document.readyState === 'complete') enReposo();
    else window.addEventListener('load', enReposo, { once: true });
    return () => { cancelado = true; window.removeEventListener('load', enReposo); };
  }, []);
  return listo ? <Suspense fallback={null}>{children}</Suspense> : null;
}

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
        <AdminMfaGate>
          <Suspense fallback={<RouteFallback />}>
            <RouterProvider router={router} />
          </Suspense>
          <CookieBanner />
          <Toaster />
          <GlobalVoiceMuteButton />
          <CuandoTermineDeCargar>
            <SignedDocumentPopup />
            <InstallAppPrompt />
            <MetaPixel />
            <AvisoDeRegalo />
          </CuandoTermineDeCargar>
        </AdminMfaGate>
      </AuthProvider>
    </LanguageProvider>
  );
}