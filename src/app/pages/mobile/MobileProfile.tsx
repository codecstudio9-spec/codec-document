import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileText, Settings, Bell, LogOut, ChevronRight, Crown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { fetchUserPlanInfo, type UserPlanInfo } from '../../services/mobile-dashboard-service';

const PLAN_LABEL: Record<string, string> = {
  monthly: 'Plan Mensual',
  semiannual: 'Plan 6 Meses',
  annual: 'Plan Anual',
  sub_monthly: 'Plan Mensual',
  sub_semiannual: 'Plan 6 Meses',
  sub_annual: 'Plan Anual',
};

export function MobileProfile() {
  return (
    <MobileAppShell>
      <ProfileContent />
    </MobileAppShell>
  );
}

function ProfileContent() {
  const { user, isAdmin, unlimitedActive, subscriptionActive, logout } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<UserPlanInfo | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchUserPlanInfo(user.id).then(setPlan).catch(() => setPlan(null));
  }, [user?.id]);

  const isPremium = isAdmin || unlimitedActive || subscriptionActive;
  const planLabel = isAdmin
    ? 'Administrador'
    : plan?.planType
      ? (PLAN_LABEL[plan.planType] ?? plan.planType)
      : 'Plan gratuito';

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="px-4 pt-5">
      <h1 className="text-xl font-black text-slate-900">Perfil</h1>

      {/* User card */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        {user?.picture ? (
          <img src={user.picture} alt={user.name || 'Perfil'} className="size-14 shrink-0 rounded-2xl object-cover" />
        ) : (
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-black text-white">
            {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-900">{user?.name || 'Usuario'}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
        </div>
      </div>

      {/* Plan card */}
      <div
        className="mt-3 rounded-2xl p-4"
        style={{
          background: isPremium ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' : '#FFFFFF',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPremium ? <Crown className="size-4 text-amber-400" /> : <ShieldCheck className="size-4 text-slate-400" />}
            <p className="text-sm font-bold" style={{ color: isPremium ? '#FFFFFF' : '#111827' }}>{planLabel}</p>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={isPremium ? { color: '#10B981', background: 'rgba(16,185,129,0.15)' } : { color: '#F59E0B', background: '#FFFBEB' }}
          >
            {isPremium ? 'Activo' : 'Gratuito'}
          </span>
        </div>
        {plan?.planExpiresAt && (
          <p className="mt-2 text-xs" style={{ color: isPremium ? 'rgba(255,255,255,0.5)' : '#94A3B8' }}>
            Renueva el {new Date(plan.planExpiresAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
        {!isPremium && (
          <button
            type="button"
            onClick={() => navigate('/#plan-ultimate')}
            className="mt-3 w-full rounded-xl py-2.5 text-xs font-bold text-white transition active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' }}
          >
            Ver planes
          </button>
        )}
      </div>

      {/* Options */}
      <div className="mt-5 space-y-2.5">
        {[
          { icon: FileText, label: 'Uso de documentos', onClick: () => navigate('/app/documents') },
          { icon: Settings, label: 'Ajustes', onClick: () => {} },
          { icon: Bell, label: 'Notificaciones', onClick: () => {} },
        ].map(({ icon: Icon, label, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left transition active:scale-[0.98]"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
              <Icon className="size-4 text-slate-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-slate-800">{label}</span>
            <ChevronRight className="size-4 text-slate-300" />
          </button>
        ))}

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left transition active:scale-[0.98]"
          style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: '#FEF2F2' }}>
            <LogOut className="size-4" style={{ color: '#EF4444' }} />
          </div>
          <span className="flex-1 text-sm font-semibold" style={{ color: '#EF4444' }}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
