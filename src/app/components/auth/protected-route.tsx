import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../contexts/auth-context';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    // Se guarda a dónde iba y la portada abre el registro: al entrar, la
    // persona sigue a esa pantalla. Antes caía en la portada sin contexto y
    // el botón de una página de SEO («Sube tu contrato») se perdía.
    try { localStorage.setItem('codec_post_auth_redirect', location.pathname + location.search); } catch { /* sin almacenamiento */ }
    return <Navigate to="/?registro=1" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
