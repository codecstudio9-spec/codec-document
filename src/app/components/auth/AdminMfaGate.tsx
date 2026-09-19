import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { getMfaStatus, type MfaStatus } from '../../services/mfa-service';
import { MfaEnrollScreen } from './MfaEnrollScreen';
import { MfaChallengeScreen } from './MfaChallengeScreen';

type Gate = 'checking' | 'satisfied' | 'needs-enroll' | 'needs-challenge';

/**
 * Blocks the ENTIRE app behind 2FA for isAdmin accounts — mounted once
 * near the root (App.tsx), not tied to any one route, since isAdmin
 * unlocks things outside of AdminRoute-guarded pages too (unlimited
 * usage, etc.). Ordinary users never see this: the status check is
 * skipped entirely when isAdmin is false, so no extra network round trip
 * or friction for the vast majority of sign-ins.
 */
export function AdminMfaGate({ children }: { children: ReactNode }) {
  const { loading, isAdmin, user, logout } = useAuth();
  const [gate, setGate] = useState<Gate>('checking');
  const [status, setStatus] = useState<MfaStatus | null>(null);

  const recheck = async () => {
    if (!isAdmin) { setGate('satisfied'); return; }
    setGate('checking');
    try {
      const s = await getMfaStatus();
      setStatus(s);
      if (!s.hasVerifiedFactor) setGate('needs-enroll');
      else if (s.currentLevel !== s.nextLevel) setGate('needs-challenge');
      else setGate('satisfied');
    } catch {
      // A transient network/API error checking MFA status should never
      // lock an admin out of their own account — fail open. Worst case is
      // one page load without the re-check, not a broken product.
      setGate('satisfied');
    }
  };

  useEffect(() => {
    if (loading) return;
    void recheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAdmin, user?.id]);

  if (loading || gate === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200" style={{ borderTopColor: '#4338CA' }} />
      </div>
    );
  }

  if (gate === 'needs-enroll') {
    return <MfaEnrollScreen onDone={() => void recheck()} onLogout={() => void logout()} />;
  }

  if (gate === 'needs-challenge') {
    const factorId = status?.factors.find((f) => f.status === 'verified')?.id;
    return <MfaChallengeScreen factorId={factorId} onDone={() => void recheck()} onLogout={() => void logout()} />;
  }

  return <>{children}</>;
}
