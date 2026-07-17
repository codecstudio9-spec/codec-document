import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/auth-context';
import { useIsMobile } from '../../hooks/use-is-mobile';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopHeader } from './DesktopHeader';
import { MOBILE_BG_GRADIENT, GLOW_TOP_RIGHT, GLOW_TOP_LEFT } from '../../styles/mobile-theme';

/**
 * Layout for every /dashboard/* screen — the private, authenticated
 * "application" world (Mundo 2), completely separate from the public
 * marketing landing at "/" (Mundo 1, untouched). Requires both a real
 * desktop viewport (mobile has its own /app shell) and a signed-in
 * session — unlike MobileAppShell, there's no anonymous/compact state
 * here: the whole point of this shell is that it's the product, not
 * marketing, so it simply bounces anyone without a session back to "/".
 */
export function DesktopAppShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: MOBILE_BG_GRADIENT }}>
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (isMobile) return <Navigate to="/app" replace />;
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="relative min-h-screen" style={{ background: MOBILE_BG_GRADIENT }}>
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: GLOW_TOP_RIGHT }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: GLOW_TOP_LEFT }} />

      <DesktopSidebar />

      {/* No z-index here on purpose: pairing `relative` with an explicit
          z-index creates a new stacking context, which caps every
          descendant — including fixed full-screen modals like PlansModal
          that set z-[9998] — at that context's rank. That trapped modals
          UNDER the sidebar (z-20) even though the modal's own z-index was
          far higher, because the comparison happened one level up. This
          div still paints above the two z-0 glow backgrounds below by
          plain DOM order, so no z-index is needed here at all. */}
      <div className="relative" style={{ marginLeft: 280 }}>
        <DesktopHeader />
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
