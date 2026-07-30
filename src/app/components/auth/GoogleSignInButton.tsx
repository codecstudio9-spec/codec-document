import { useEffect, useRef } from 'react';
import { useGoogleIdentityServices } from '../../hooks/useGoogleIdentityServices';
import { useLanguage } from '../../contexts/language-context';

/**
 * Google's own rendered button (via GIS `renderButton`) — used instead of
 * a custom-styled button calling `signInWithGoogle()` (the Supabase OAuth
 * redirect, which briefly shows the supabase.co domain). Google requires
 * its button to be rendered by its own script into a container div rather
 * than a fully custom element, but `shape`/`theme`/`size` keep it close to
 * this app's usual pill-button look.
 */
interface GoogleSignInButtonProps {
  className?: string;
  /** 'outline'/'filled_blue' read well on light backgrounds; 'filled_black'
   * blends better into a dark glassmorphism modal. Defaults to 'outline'. */
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  width?: number;
}

export function GoogleSignInButton({ className, theme = 'outline', width = 280 }: GoogleSignInButtonProps) {
  const { ready, error } = useGoogleIdentityServices();
  const { language } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const googleApi = (window as any).google;
    if (!googleApi?.accounts?.id) return;
    containerRef.current.innerHTML = '';
    googleApi.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme,
      size: 'large',
      shape: 'pill',
      text: 'continue_with',
      logo_alignment: 'left',
      locale: language === 'es' ? 'es' : 'en',
      width,
    });
  }, [ready, language, theme, width]);

  if (error) {
    return <p className="text-xs font-medium text-red-500">{error}</p>;
  }

  return <div ref={containerRef} className={className ?? 'flex justify-center'} />;
}
