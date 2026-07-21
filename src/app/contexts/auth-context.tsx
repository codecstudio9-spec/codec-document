import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { fetchMyPurchasedDocuments, fetchSubscriptionStatus } from '../services/auth-service';
import { supabase } from '../../lib/supabase';
import { isAdminEmail } from '../utils/admin-access';
import { markVisitorFunnelStep } from '../services/analytics-service';
import { checkIsAnalyticsAdmin } from '../services/analytics-admin-service';

type AuthUser = { id?: string; email: string; name?: string; picture?: string };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  /** Granted via analytics_admins (see analytics-admin-service.ts) — sees
   * ONLY /dashboard/admin/analytics, not the rest of what isAdmin unlocks
   * (can't grant/revoke access itself, doesn't get plan_type: 'admin'). */
  isAnalyticsAdmin: boolean;
  unlimitedActive: boolean;
  subscriptionActive: boolean;
  annualPriceUsd: number;
  purchasedDocumentIds: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleToken: (idToken: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshPurchasedDocuments: (tokenOverride?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Where to send the browser after Google OAuth / magic-link completes —
 * a mobile viewport belongs in the /app bottom-nav shell, not the desktop
 * "/dashboard" document list. Read synchronously at click time (not a
 * hook) since this only runs inside a plain async function. */
function postLoginPath(): string {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  return isMobile ? '/app' : '/dashboard';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAnalyticsAdmin, setIsAnalyticsAdmin] = useState(false);
  const [unlimitedActive, setUnlimitedActive] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [annualPriceUsd, setAnnualPriceUsd] = useState(180);
  const [purchasedDocumentIds, setPurchasedDocumentIds] = useState<string[]>([]);

  const refreshSubscription = async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    const status = await fetchSubscriptionStatus(userId);
    setUnlimitedActive(Boolean(status.unlimitedActive));
    setSubscriptionActive(Boolean(status.subscriptionActive || status.unlimitedActive));
    setAnnualPriceUsd(status.annualPriceUsd || 180);
    // Combine with (never regress) the email-based check already applied at
    // session load — the DB `role` column lets future admins be added
    // without a code deploy, but the hardcoded email stays as a permanent
    // fallback (same defense-in-depth already used by admin-access.ts).
    if (status.role === 'admin') setIsAdmin(true);
  };

  // A granted analytics-only viewer gets the same unlimited-usage bypass
  // as isAdmin (via unlimitedActive/subscriptionActive, the flag already
  // read app-wide for paywall gates — see preview-page.tsx,
  // document-generator-page.tsx, my-documents-page.tsx,
  // my-quote-editor-page.tsx) but NEVER sets isAdmin itself, so they stay
  // locked out of every other admin-only surface.
  const refreshAnalyticsAdmin = async () => {
    if (!session?.user) { setIsAnalyticsAdmin(false); return; }
    const granted = await checkIsAnalyticsAdmin();
    setIsAnalyticsAdmin(granted);
    if (granted) {
      setUnlimitedActive(true);
      setSubscriptionActive(true);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Dynamic origin so this always targets whatever domain the app is
        // running on (localhost in dev, the Vercel domain in prod) — this
        // alone isn't enough for Supabase to honor it though: the exact
        // origin must also be present in Supabase Dashboard → Auth → URL
        // Configuration → Redirect URLs, or Supabase silently falls back
        // to the configured Site URL instead of this value.
        redirectTo: `${window.location.origin}${postLoginPath()}`,
      },
    });
    if (error) throw error;
  };

  const signInWithGoogleToken = async (idToken: string) => {
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    if (error) throw error;
  };

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${postLoginPath()}` },
    });
    if (error) throw error;
  };

  const refreshPurchasedDocuments = async (tokenOverride?: string) => {
    const effectiveToken = tokenOverride || token;
    if (!effectiveToken) return;
    const docs = await fetchMyPurchasedDocuments(effectiveToken);
    const ids = docs.map((d) => String(d.documentId)).filter(Boolean);
    setPurchasedDocumentIds(ids);
    ids.forEach((id) => localStorage.setItem(`codec_purchase_${id}`, 'true'));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsAnalyticsAdmin(false);
    setUser(null);
    setToken(null);
    setSession(null);
    setUnlimitedActive(false);
    setSubscriptionActive(false);
    setPurchasedDocumentIds([]);
  };

  useEffect(() => {
    const applySession = (nextSession: Session | null) => {
      setSession(nextSession);
      const nextToken = nextSession?.access_token || null;
      setToken(nextToken);

      const supaUser: User | null = nextSession?.user ?? null;
      const adminUser = isAdminEmail(supaUser?.email);
      setIsAdmin(adminUser);

      // Admin gets unlimited access automatically — no paywall, no quotas
      if (adminUser) {
        setUnlimitedActive(true);
        setSubscriptionActive(true);
      }

      setUser(
        supaUser
          ? {
              id: supaUser.id,
              email: supaUser.email || '',
              name:
                (supaUser.user_metadata?.full_name as string | undefined) ||
                (supaUser.user_metadata?.name as string | undefined) ||
                undefined,
              picture: (supaUser.user_metadata?.avatar_url as string | undefined) || undefined,
            }
          : null,
      );
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      applySession(nextSession);
      // Auto-create user profile row on first login (Google OAuth or magic link)
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && nextSession?.user) {
        const u = nextSession.user;
        void supabase.from('users').upsert(
          {
            id: u.id,
            email: u.email ?? '',
            full_name:
              (u.user_metadata?.full_name as string | undefined) ||
              (u.user_metadata?.name as string | undefined) ||
              (u.email ?? ''),
            avatar_url: (u.user_metadata?.avatar_url as string | undefined) ?? null,
          },
          { onConflict: 'id', ignoreDuplicates: true },
        )
          // With ignoreDuplicates, a row only comes back on a genuine first
          // insert (a pre-existing id is silently skipped, no row returned)
          // — that's how the Business Intelligence funnel tells a real
          // signup apart from every ordinary login re-firing SIGNED_IN.
          .select('id')
          .then(({ data }) => {
            if (data && data.length > 0) markVisitorFunnelStep('registered');
          });
        // Grant admin plan in DB so server-side checks also pass. Plan
        // status lives on `users.plan_type`/`plan_status`/`plan_expires_at`
        // (read by auth-service.ts/mobile-dashboard-service.ts) — that's
        // the only table this actually needs to touch. This used to also
        // upsert into `user_credits` with a `credits`/`plan` payload, but
        // that table's real columns are `user_id`/`credits_remaining`/
        // `updated_at` — every one of those upserts was silently failing
        // with "column user_credits.credits does not exist" on every
        // single sign-in (fire-and-forget `void` call, no `.catch()`, so
        // the rejection was never surfaced anywhere). Removed rather than
        // "fixed" to match the schema, since nothing reads user_credits
        // back for plan/credit gating anymore — it was dead weight.
        if (isAdminEmail(u.email)) {
          void supabase.from('users').update({ plan_type: 'admin' }).eq('id', u.id);
        }
        // Apply plan type selected in onboarding segmentation modal
        const pendingPlanType = localStorage.getItem('codec_pending_plan_type');
        if (pendingPlanType) {
          void supabase.from('users').update({ plan_type: pendingPlanType }).eq('id', u.id);
          localStorage.removeItem('codec_pending_plan_type');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!token || token === 'demo-token') return;
    // Wrap both calls so a down backend never throws an unhandled rejection
    refreshSubscription().catch(() => {});
    refreshPurchasedDocuments(token).catch(() => {});
    refreshAnalyticsAdmin().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      session,
      loading,
      isAdmin,
      isAnalyticsAdmin,
      unlimitedActive,
      subscriptionActive,
      annualPriceUsd,
      purchasedDocumentIds,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithGoogleToken,
      signInWithMagicLink,
      refreshSubscription,
      refreshPurchasedDocuments,
      logout,
    }),
    [user, token, session, loading, isAdmin, isAnalyticsAdmin, unlimitedActive, subscriptionActive, annualPriceUsd, purchasedDocumentIds],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
