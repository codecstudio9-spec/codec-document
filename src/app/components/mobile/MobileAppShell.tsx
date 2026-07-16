import { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../contexts/auth-context';
import { useIsMobile } from '../../hooks/use-is-mobile';
import { MobileBottomNav } from './MobileBottomNav';
import { OnboardingModal } from '../auth/OnboardingModal';
import { MOBILE_BG_GRADIENT, GLOW_TOP_RIGHT, GLOW_TOP_LEFT } from '../../styles/mobile-theme';

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
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: MOBILE_BG_GRADIENT }}>
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!isMobile) return <Navigate to="/" replace />;

  return (
    <MobileSignInContext.Provider value={() => setSignInOpen(true)}>
      <div className="relative min-h-screen overflow-x-hidden" style={{ background: MOBILE_BG_GRADIENT }}>
        {/* Ambient depth — two soft radial glows fixed behind the content,
            never intercepting taps. Kept subtle on purpose. */}
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: GLOW_TOP_RIGHT }} />
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: GLOW_TOP_LEFT }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
            style={{ paddingBottom: 88 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>

        <MobileBottomNav />
      </div>
      <OnboardingModal open={signInOpen} onOpenChange={setSignInOpen} />
    </MobileSignInContext.Provider>
  );
}
