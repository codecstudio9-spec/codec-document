import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { getMfaStatus, getMfaLoginEnforced, setMfaLoginEnforced, type MfaStatus } from '../../services/mfa-service';
import { MfaEnrollScreen } from './MfaEnrollScreen';
import { MfaChallengeScreen } from './MfaChallengeScreen';

type Gate = 'checking' | 'satisfied' | 'needs-enroll' | 'needs-challenge';

/**
 * Gates the app behind 2FA for isAdmin accounts — but ONLY when the admin
 * has explicitly turned that on from Settings (getMfaLoginEnforced),
 * defaulting to off. 2FA used to be mandatory the moment an account was
 * admin, with no way out if the TOTP code stopped matching (phone clock
 * drift, or a re-enrollment that quietly generated a new secret) — that
 * design could lock an admin out of their own account with no recovery
 * besides a database fix. Every blocking screen below also has an escape
 * hatch that disables enforcement and lets them straight in, so that can't
 * happen again. Ordinary users never see any of this: both the enforcement
 * check and the status check are skipped entirely when isAdmin is false.
 */
export function AdminMfaGate({ children }: { children: ReactNode }) {
  const { loading, isAdmin, user, logout } = useAuth();
  const [gate, setGate] = useState<Gate>('checking');
  const [status, setStatus] = useState<MfaStatus | null>(null);

  const recheck = async () => {
    if (!isAdmin) { setGate('satisfied'); return; }
    setGate('checking');
    try {
      const enforced = await getMfaLoginEnforced();
      if (!enforced) { setGate('satisfied'); return; }
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

  const disableAndContinue = async () => {
    try { await setMfaLoginEnforced(false); } catch { /* still let them in below */ }
    void recheck();
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
    return (
      <MfaEnrollScreen
        onDone={() => void recheck()}
        onLogout={() => void logout()}
        onSkip={() => void disableAndContinue()}
      />
    );
  }

  if (gate === 'needs-challenge') {
    const factorId = status?.factors.find((f) => f.status === 'verified')?.id;
    return (
      <MfaChallengeScreen
        factorId={factorId}
        onDone={() => void recheck()}
        onLogout={() => void logout()}
        onDisable={() => void disableAndContinue()}
      />
    );
  }

  return <>{children}</>;
}
