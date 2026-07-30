import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';

/**
 * Loads Google Identity Services (GIS) and initializes
 * `google.accounts.id` exactly once app-wide, then hands the resulting
 * ID token to `signInWithGoogleToken` (supabase.auth.signInWithIdToken)
 * instead of `signInWithGoogle`'s `supabase.auth.signInWithOAuth` redirect
 * — the redirect flow briefly shows "Ir a yxzchnldmfsgdtbjurey.supabase.co"
 * in the browser, breaking the white-label experience; GIS stays entirely
 * on our own domain.
 *
 * Module-level script-load/init guards so mounting this hook from several
 * places at once (a modal AND the homepage, say) only loads the script
 * and calls `initialize()` once — re-initializing repeatedly is wasteful
 * and, per Google's docs, can reset in-flight prompt state.
 */
let scriptLoadPromise: Promise<void> | null = null;
function loadGsiScript(): Promise<void> {
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('gsi script failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('gsi script failed to load'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

let initializedClientId: string | null = null;

export function useGoogleIdentityServices() {
  const { signInWithGoogleToken } = useAuth();
  const { language } = useLanguage();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError(language === 'en' ? 'Google login not configured' : 'Google login no configurado');
      return;
    }

    loadGsiScript()
      .then(() => {
        if (cancelled) return;
        const googleApi = (window as any).google;
        if (!googleApi?.accounts?.id) {
          setError(language === 'en' ? 'Google script unavailable' : 'Script de Google no disponible');
          return;
        }
        if (initializedClientId !== clientId) {
          googleApi.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: { credential?: string }) => {
              if (!response?.credential) return;
              try {
                await signInWithGoogleToken(response.credential);
                toast.success(language === 'en' ? 'Login successful' : 'Inicio de sesión exitoso');
              } catch (err: any) {
                const raw = String(err?.message ?? '');
                const isAudienceErr =
                  raw.toLowerCase().includes('unacceptable_audience') ||
                  raw.toLowerCase().includes('unacceptable audience');
                const message = isAudienceErr
                  ? (language === 'en'
                      ? 'Google sign-in is temporarily unavailable. Please try again shortly.'
                      : 'El inicio de sesión con Google no está disponible en este momento. Intenta de nuevo en unos minutos.')
                  : raw || (language === 'en' ? 'Google login failed' : 'Falló el login con Google');
                setError(message);
                toast.error(message);
              }
            },
          });
          initializedClientId = clientId;
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError(language === 'en' ? 'Google script failed to load' : 'No se pudo cargar Google');
      });

    return () => { cancelled = true; };
  }, [signInWithGoogleToken, language]);

  return { ready, error };
}
