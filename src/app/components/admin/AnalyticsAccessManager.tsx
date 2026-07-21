import { useEffect, useState } from 'react';
import { KeyRound, Loader, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  grantAnalyticsAccess, revokeAnalyticsAccess, listAnalyticsAdmins,
  type AnalyticsAdminGrant,
} from '../../services/analytics-admin-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

/**
 * Super-admin-only widget (the caller must already gate this on `isAdmin`,
 * never `isAnalyticsAdmin` — a granted viewer must never see this, since
 * that's exactly the boundary that keeps them from managing who else gets
 * in). Lets the primary admin grant/revoke analytics-only access by email —
 * see supabase_add_analytics_admin_grants_migration.sql for the actual
 * enforcement (grant_analytics_access/revoke_analytics_access both
 * re-check is_admin_user() server-side regardless of what this UI shows).
 */
export function AnalyticsAccessManager({ language }: { language: 'en' | 'es' }) {
  const [grants, setGrants] = useState<AnalyticsAdminGrant[] | null>(null);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  const load = () => {
    listAnalyticsAdmins().then(setGrants).catch(() => setGrants([]));
  };

  useEffect(() => { load(); }, []);

  const handleGrant = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast.error(language === 'en' ? 'Enter a valid email.' : 'Escribe un correo válido.');
      return;
    }
    setSaving(true);
    try {
      await grantAnalyticsAccess(trimmed);
      setEmail('');
      toast.success(language === 'en' ? 'Access granted.' : 'Acceso otorgado.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (targetEmail: string) => {
    setRemovingEmail(targetEmail);
    try {
      await revokeAnalyticsAccess(targetEmail);
      setGrants((prev) => (prev ?? []).filter((g) => g.email !== targetEmail));
      toast.success(language === 'en' ? 'Access revoked.' : 'Acceso revocado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setRemovingEmail(null);
    }
  };

  return (
    <div className="bg-white p-6" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-slate-400" />
        <h2 className="text-sm font-black text-slate-900">
          {language === 'en' ? 'Analytics access' : 'Acceso a analítica'}
        </h2>
      </div>
      <p className="mt-0.5 text-xs text-slate-400">
        {language === 'en'
          ? 'These emails see this whole page (Business + Visitors, unlimited usage) but nothing else — they can’t grant access themselves.'
          : 'Estos correos ven toda esta página (Comercial + Visitantes, uso ilimitado) pero nada más — no pueden dar acceso a otros.'}
      </p>

      <div className="mt-4 flex gap-2">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleGrant(); }}
          placeholder={language === 'en' ? 'email@example.com' : 'correo@ejemplo.com'}
          type="email"
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <button
          type="button"
          disabled={saving || !email.trim()}
          onClick={() => void handleGrant()}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
        >
          {saving ? <Loader className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
          {language === 'en' ? 'Grant' : 'Dar acceso'}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {!grants ? (
          <div className="flex justify-center py-4"><Loader className="size-4 animate-spin text-slate-300" /></div>
        ) : grants.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            {language === 'en' ? 'No one else has access yet.' : 'Nadie más tiene acceso todavía.'}
          </p>
        ) : (
          grants.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">{g.email}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(g.granted_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                disabled={removingEmail === g.email}
                onClick={() => void handleRevoke(g.email)}
                className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-red-500 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="size-3.5" />
                {language === 'en' ? 'Revoke' : 'Quitar'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
