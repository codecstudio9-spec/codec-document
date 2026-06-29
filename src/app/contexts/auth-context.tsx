import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { fetchMyPurchasedDocuments, fetchSubscriptionStatus } from '../services/auth-service';
import { supabase } from '../../lib/supabase';
import { ensureUserUsageRow } from '../services/usage-service';
import { isAdminEmail } from '../utils/admin-access';

type AuthUser = { id?: string; email: string; name?: string; picture?: string };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  unlimitedActive: boolean;
  subscriptionActive: boolean;
  annualPriceUsd: number;
  purchasedDocumentIds: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGoogleToken: (idToken: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshPurchasedDocuments: (tokenOverride?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unlimitedActive, setUnlimitedActive] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [annualPriceUsd, setAnnualPriceUsd] = useState(180);
  const [purchasedDocumentIds, setPurchasedDocumentIds] = useState<string[]>([]);

  const refreshSubscription = async () => {
    if (!token) return;
    const status = await fetchSubscriptionStatus(token);
    setUnlimitedActive(Boolean(status.unlimitedActive));
    setSubscriptionActive(Boolean(status.subscriptionActive || status.unlimitedActive));
    setAnnualPriceUsd(status.annualPriceUsd || 180);
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
        redirectTo: `${window.location.origin}/dashboard`,
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
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  };

  const signInDemo = async () => {
    // Inicio de sesión temporal para pruebas locales sin proveedor OAuth.
    setUser({
      email: 'demo@codec.local',
      name: 'Usuario Demo',
      picture: undefined,
    });
    setToken('demo-token');
    setSession(null);
    setUnlimitedActive(true);
    setSubscriptionActive(true);
    setPurchasedDocumentIds([]);
    localStorage.setItem('codec_demo_auth', 'true');
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
    const isDemo = localStorage.getItem('codec_demo_auth') === 'true';
    if (isDemo) {
      localStorage.removeItem('codec_demo_auth');
      setUser(null);
      setToken(null);
      setSession(null);
      setUnlimitedActive(false);
      setSubscriptionActive(false);
      setPurchasedDocumentIds([]);
      return;
    }

    await supabase.auth.signOut();
    setIsAdmin(false);
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

    // Always check Supabase for a real session first.  A real session takes
    // priority over the codec_demo_auth localStorage flag — this allows the
    // admin (douglastabordasanchez@gmail.com) to log in normally even when the
    // demo flag was left behind from a previous test session.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Real session wins — purge any stale demo flag so the UI shows the
        // correct user instead of "Usuario Demo demo@codec.local".
        localStorage.removeItem('codec_demo_auth');
        applySession(data.session);
      } else if (localStorage.getItem('codec_demo_auth') === 'true') {
        // No real session — honour the explicit demo mode flag.
        setUser({ email: 'demo@codec.local', name: 'Usuario Demo', picture: undefined });
        setToken('demo-token');
        setSession(null);
        setUnlimitedActive(true);
        setSubscriptionActive(true);
        setLoading(false);
      } else {
        applySession(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // If a real session arrives, always clear the demo flag
      if (nextSession) localStorage.removeItem('codec_demo_auth');
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
        );
        // Grant admin plan in DB so server-side checks also pass
        if (isAdminEmail(u.email)) {
          void supabase.from('users').update({ plan_type: 'admin' }).eq('id', u.id);
          // Use 'monthly' — safe value that passes DB CHECK constraints; credits: 9999 = unlimited
          void supabase.from('user_credits').upsert(
            { user_id: u.id, credits: 9999, plan: 'monthly' },
            { onConflict: 'user_id' },
          );
        }
        // Ensure user_usage row exists for document/signature quota tracking
        ensureUserUsageRow(u.id);
        // Apply plan type selected in onboarding segmentation modal
        const pendingPlanType = localStorage.getItem('codec_pending_plan_type');
        if (pendingPlanType) {
          void supabase.from('users').update({ plan_type: pendingPlanType }).eq('id', u.id);
          localStorage.removeItem('codec_pending_plan_type');
        }
        // Ensure user_credits row exists (0 credits, free plan)
        void supabase.from('user_credits').upsert(
          { user_id: u.id, credits: 0, plan: 'free' },
          { onConflict: 'user_id', ignoreDuplicates: true },
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      session,
      loading,
      isAdmin,
      unlimitedActive,
      subscriptionActive,
      annualPriceUsd,
      purchasedDocumentIds,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithGoogleToken,
      signInWithMagicLink,
      signInDemo,
      refreshSubscription,
      refreshPurchasedDocuments,
      logout,
    }),
    [user, token, session, loading, isAdmin, unlimitedActive, subscriptionActive, annualPriceUsd, purchasedDocumentIds],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
