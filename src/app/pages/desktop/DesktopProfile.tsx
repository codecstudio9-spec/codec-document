import { useEffect, useState } from 'react';
import { Crown, ShieldCheck, Mail, Calendar, KeyRound } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { PlansModal } from '../../components/PlansModal';
import { fetchUserPlanInfo, type UserPlanInfo } from '../../services/mobile-dashboard-service';
import { CARD_RADIUS, CARD_SHADOW, DARK_GRADIENT, BLUE_GRADIENT } from '../../styles/mobile-theme';

const PLAN_LABEL_ES: Record<string, string> = {
  monthly: 'Plan Mensual', semiannual: 'Plan 6 Meses', annual: 'Plan Anual',
  sub_monthly: 'Plan Mensual', sub_semiannual: 'Plan 6 Meses', sub_annual: 'Plan Anual',
};
const PLAN_LABEL_EN: Record<string, string> = {
  monthly: 'Monthly Plan', semiannual: '6-Month Plan', annual: 'Annual Plan',
  sub_monthly: 'Monthly Plan', sub_semiannual: '6-Month Plan', sub_annual: 'Annual Plan',
};

export function DesktopProfile() {
  return (
    <DesktopAppShell>
      <ProfileContent />
    </DesktopAppShell>
  );
}

function ProfileContent() {
  const { user, session, isAdmin, unlimitedActive, subscriptionActive } = useAuth();
  const { language } = useLanguage();
  const [plan, setPlan] = useState<UserPlanInfo | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserPlanInfo(user.id).then(setPlan).catch(() => setPlan(null));
  }, [user?.id]);

  const isPremium = isAdmin || unlimitedActive || subscriptionActive;
  const planLabels = language === 'en' ? PLAN_LABEL_EN : PLAN_LABEL_ES;
  const planLabel = isAdmin
    ? (language === 'en' ? 'Administrator' : 'Administrador')
    : plan?.planType
      ? (planLabels[plan.planType] ?? plan.planType)
      : (isPremium ? (language === 'en' ? 'Active Plan' : 'Plan Activo') : (language === 'en' ? 'Free Plan' : 'Plan Gratuito'));
  const provider = (session?.user?.app_metadata as { provider?: string } | undefined)?.provider;
  const providerLabel = provider === 'google'
    ? 'Google'
    : provider === 'email'
      ? (language === 'en' ? 'Email' : 'Correo electrónico')
      : (language === 'en' ? 'Magic link' : 'Enlace mágico');

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Profile' : 'Perfil'}</h1>

      <div className="mt-6 grid grid-cols-3 gap-5">
        {/* Identity card */}
        <div className="col-span-2 bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
          <div className="flex items-center gap-4">
            {user?.picture ? (
              <img src={user.picture} alt={user.name || (language === 'en' ? 'Profile' : 'Perfil')} referrerPolicy="no-referrer" className="size-16 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-black text-indigo-500">
                {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-black text-slate-900">{user?.name || (language === 'en' ? 'User' : 'Usuario')}</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 text-slate-400" />
              <span className="text-slate-500">{language === 'en' ? 'Email' : 'Correo'}</span>
              <span className="ml-auto font-semibold text-slate-800">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <KeyRound className="size-4 text-slate-400" />
              <span className="text-slate-500">{language === 'en' ? 'Sign-in provider' : 'Proveedor de acceso'}</span>
              <span className="ml-auto font-semibold text-slate-800">{providerLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 text-slate-400" />
              <span className="text-slate-500">{language === 'en' ? 'Member since' : 'Miembro desde'}</span>
              <span className="ml-auto font-semibold text-slate-800">
                {plan?.createdAt ? new Date(plan.createdAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Plan card */}
        <div
          className="flex flex-col justify-between p-6"
          style={{ borderRadius: CARD_RADIUS, background: isPremium ? DARK_GRADIENT : '#FFFFFF', boxShadow: isPremium ? '0 20px 40px rgba(15,23,42,0.22)' : CARD_SHADOW }}
        >
          <div>
            <div className="flex items-center gap-2">
              {isPremium ? <Crown className="size-4 text-amber-400" /> : <ShieldCheck className="size-4 text-slate-400" />}
              <p className="text-sm font-bold" style={{ color: isPremium ? '#fff' : '#111827' }}>{planLabel}</p>
            </div>
            <span
              className="mt-3 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={isPremium ? { color: '#10B981', background: 'rgba(16,185,129,0.15)' } : { color: '#F59E0B', background: '#FFFBEB' }}
            >
              {isPremium ? (language === 'en' ? 'Active' : 'Activo') : (language === 'en' ? 'Free' : 'Gratuito')}
            </span>
          </div>
          {!isPremium && (
            <button
              type="button"
              onClick={() => setPlansOpen(true)}
              className="mt-4 w-full rounded-xl py-2.5 text-xs font-bold text-white"
              style={{ background: BLUE_GRADIENT }}
            >
              {language === 'en' ? 'View plans' : 'Ver planes'}
            </button>
          )}
        </div>
      </div>

      <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} />
    </div>
  );
}
