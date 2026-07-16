import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/auth-context';
import { useIsMobile } from '../../hooks/use-is-mobile';
import { MobileBottomNav } from './MobileBottomNav';

/**
 * Layout for every /app/* screen: guards (must be on a real mobile
 * viewport, must be signed in — this whole shell is the "logged-in"
 * experience, the desktop site and the signed-out mobile landing are
 * untouched elsewhere), then renders the screen content with the fixed
 * bottom nav persisted underneath it.
 */
export function MobileAppShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isMobile) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <div style={{ paddingBottom: 88 }}>{children}</div>
      <MobileBottomNav />
    </div>
  );
}
