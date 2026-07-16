import { createContext, useContext, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/auth-context';
import { useIsMobile } from '../../hooks/use-is-mobile';
import { MobileBottomNav } from './MobileBottomNav';
import { OnboardingModal } from '../auth/OnboardingModal';

const MobileSignInContext = createContext<() => void>(() => {});

/** Lets any /app/* screen (or a component nested inside one) open the
 * shared sign-in modal without each screen owning its own modal state. */
export function useMobileSignIn() {
  return useContext(MobileSignInContext);
}

/**
 * Layout for every /app/* screen — the primary mobile experience now,
 * for signed-in AND anonymous visitors alike. Only a real mobile viewport
 * is required; desktop always keeps the traditional landing at "/" (see
 * modern-home-page.tsx). Each screen decides for itself how to present
 * itself when there's no user (compact intro on the home screen, sign-in
 * prompts on the screens that need real account data).
 */
export function MobileAppShell({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const { loading } = useAuth();
  const [signInOpen, setSignInOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isMobile) return <Navigate to="/" replace />;

  return (
    <MobileSignInContext.Provider value={() => setSignInOpen(true)}>
      <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
        <div style={{ paddingBottom: 88 }}>{children}</div>
        <MobileBottomNav />
      </div>
      <OnboardingModal open={signInOpen} onOpenChange={setSignInOpen} />
    </MobileSignInContext.Provider>
  );
}
