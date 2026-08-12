import { useEffect, useState } from 'react';
import { KeyRound, Loader, Trash2, UserPlus, Gift, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import {
  grantAnalyticsAccess, revokeAnalyticsAccess, listAnalyticsAdmins,
  grantFreeMonths, listPlanGifts,
  type AnalyticsAdminGrant, type PlanGift,
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

  // Regalo de meses de plan. Va en esta misma pantalla porque es la misma
  // gestión —dar algo a alguien por su correo— aunque lo que se da sea
  // distinto: aquí acceso, allí plan.
  const [regalos, setRegalos] = useState<PlanGift[]>([]);
  const [correoRegalo, setCorreoRegalo] = useState('');
  const [meses, setMeses] = useState(1);
  const [notaRegalo, setNotaRegalo] = useState('');
  const [regalando, setRegalando] = useState(false);

  const load = () => {
    listAnalyticsAdmins().then(setGrants).catch(() => setGrants([]));
    listPlanGifts().then(setRegalos).catch(() => {});
  };

  const regalarMeses = async () => {
    const correo = correoRegalo.trim();
    if (!correo.includes('@')) {
      toast.error(language === 'en' ? 'Enter a valid email.' : 'Escribe un correo válido.');
      return;
    }
    setRegalando(true);
    try {
      const r = await grantFreeMonths(correo, meses, notaRegalo.trim() || undefined);
      const hasta = new Date(r.expiresAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      toast.success(language === 'en'
        ? `${meses} month(s) granted to ${r.email} — active until ${hasta}.`
        : `${meses} ${meses === 1 ? 'mes regalado' : 'meses regalados'} a ${r.email} — activo hasta el ${hasta}.`);
      setCorreoRegalo(''); setNotaRegalo('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setRegalando(false);
    }
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

      {/* ── Regalar meses de plan ─────────────────────────────────────── */}
      <div className="mt-8 border-t border-slate-100 pt-6">
        <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Gift className="size-4 text-emerald-500" />
          {language === 'en' ? 'Give free months of the plan' : 'Regalar meses de plan gratis'}
        </p>
        <p className="mb-4 mt-1 text-xs text-slate-500">
          {language === 'en'
            ? 'Goes to one person by email and activates on its own — no code to type. If they already have a plan, the time is added to what they have left.'
            : 'Va a una persona por su correo y se activa sola — no hay código que escribir. Si ya tiene plan, el tiempo se suma a lo que le quede.'}
        </p>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            type="email"
            value={correoRegalo}
            onChange={(e) => setCorreoRegalo(e.target.value)}
            placeholder="persona@correo.com"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400"
          />
          <div className="flex items-center gap-2">
            <select
              value={meses}
              onChange={(e) => setMeses(Number(e.target.value))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-400"
            >
              {[1, 2, 3, 6, 12].map((m) => (
                <option key={m} value={m}>
                  {m} {language === 'en' ? (m === 1 ? 'month' : 'months') : (m === 1 ? 'mes' : 'meses')}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={regalando}
              onClick={() => void regalarMeses()}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
            >
              {regalando ? <Loader className="size-3.5 animate-spin" /> : <Gift className="size-3.5" />}
              {language === 'en' ? 'Give' : 'Regalar'}
            </button>
          </div>
        </div>

        <input
          value={notaRegalo}
          onChange={(e) => setNotaRegalo(e.target.value)}
          placeholder={language === 'en' ? 'Internal note (optional)' : 'Nota interna (opcional)'}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-400"
        />

        <div className="mt-4 space-y-1.5">
          {regalos.length === 0 ? (
            <p className="py-2 text-center text-xs text-slate-400">
              {language === 'en' ? 'Nothing given yet.' : 'Aún no has regalado ningún mes.'}
            </p>
          ) : regalos.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold text-slate-700">{r.email}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-700">
                {r.months} {language === 'en' ? (r.months === 1 ? 'month' : 'months') : (r.months === 1 ? 'mes' : 'meses')}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <CalendarClock className="size-3" />
                {language === 'en' ? 'until' : 'hasta el'}{' '}
                {new Date(r.expiresAt).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {r.note && <span className="text-[11px] italic text-slate-400">«{r.note}»</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
