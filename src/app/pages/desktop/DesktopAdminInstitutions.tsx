import { useEffect, useState } from 'react';
import { Building2, Plus, Loader, Trash2, Users, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useLanguage } from '../../contexts/language-context';
import {
  adminListInstitutions, adminProvisionInstitution, adminDeleteInstitution, type Institution,
} from '../../services/company-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

/**
 * Platform-admin-only — provisions an institution (name + email domain)
 * before any of its users have ever signed in. Once provisioned, anyone
 * signing in with that domain sees DomainJoinPrompt.tsx on their
 * dashboard and can join with one click — the first to do so becomes
 * 'owner', everyone after that 'user' (see join_company_by_domain() in
 * supabase/migrations/20260919010000_admin_institution_provisioning.sql).
 * Ordinary users and even company owners never see this page — only
 * isAdmin (gated by the route itself, see routes.tsx).
 */
export function DesktopAdminInstitutions() {
  return (
    <DesktopAppShell>
      <InstitutionsContent />
    </DesktopAppShell>
  );
}

function InstitutionsContent() {
  const { language } = useLanguage();
  const [institutions, setInstitutions] = useState<Institution[] | null>(null);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [seats, setSeats] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  const load = () => {
    adminListInstitutions().then(setInstitutions).catch((err) => {
      toast.error(err instanceof Error ? err.message : 'No se pudo cargar la lista');
      setInstitutions([]);
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!name.trim() || !domain.trim()) return;
    setCreating(true);
    try {
      await adminProvisionInstitution(name.trim(), domain.trim(), seats.trim() ? Number(seats) : null);
      toast.success(language === 'en' ? 'Institution provisioned' : 'Institución aprovisionada');
      setName(''); setDomain(''); setSeats('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not provision it' : 'No se pudo aprovisionar'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (inst: Institution) => {
    if (inst.member_count > 0) {
      toast.error(language === 'en'
        ? 'Remove its members from /my-company first'
        : 'Primero quita sus miembros desde /my-company');
      return;
    }
    const confirmed = window.confirm(
      language === 'en' ? `Delete "${inst.name}"?` : `¿Eliminar "${inst.name}"?`,
    );
    if (!confirmed) return;
    setDeletingId(inst.id);
    try {
      await adminDeleteInstitution(inst.id);
      toast.success(language === 'en' ? 'Deleted' : 'Eliminada');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not delete it' : 'No se pudo eliminar'));
    } finally {
      setDeletingId(null);
    }
  };

  const copyDomain = async (d: string) => {
    try {
      await navigator.clipboard.writeText(d);
      setCopiedDomain(d);
      setTimeout(() => setCopiedDomain(null), 2000);
    } catch {
      // clipboard permission denied — the domain is still visible to copy by hand
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
        <Building2 className="size-6 text-indigo-600" />
        {language === 'en' ? 'Institutions (SSO)' : 'Instituciones (SSO)'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {language === 'en'
          ? 'Register an institution by name and email domain — anyone who signs in with that domain gets offered to join automatically. Only you see this page.'
          : 'Registra una institución por nombre y dominio de correo — cualquiera que inicie sesión con ese dominio recibirá la opción de unirse automáticamente. Solo tú ves esta página.'}
      </p>

      <div className="mt-6 bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <p className="mb-3 text-sm font-bold text-slate-700">
          {language === 'en' ? 'New institution' : 'Nueva institución'}
        </p>
        <div className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={language === 'en' ? 'Institution name' : 'Nombre de la institución'}
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="institucion.edu.co"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <input
            value={seats}
            onChange={(e) => setSeats(e.target.value.replace(/\D/g, ''))}
            placeholder={language === 'en' ? 'Seats' : 'Asientos'}
            inputMode="numeric"
            className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            disabled={!name.trim() || !domain.trim() || creating}
            onClick={() => void handleCreate()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {creating ? <Loader className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {language === 'en'
            ? 'Leave seats blank for unlimited members (legacy flat plan).'
            : 'Deja asientos vacío para miembros ilimitados (plan plano legado).'}
        </p>
      </div>

      <div className="mt-6 space-y-2.5">
        {institutions === null ? (
          [0, 1].map((i) => <div key={i} className="h-20 animate-pulse bg-white" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }} />)
        ) : institutions.length === 0 ? (
          <div className="bg-white px-6 py-10 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <Building2 className="mx-auto mb-2 size-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">
              {language === 'en' ? 'No institutions provisioned yet' : 'Aún no hay instituciones aprovisionadas'}
            </p>
          </div>
        ) : (
          institutions.map((inst) => (
            <div key={inst.id} className="flex items-center gap-3 bg-white p-4" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Building2 className="size-4 text-indigo-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{inst.name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                  <button type="button" onClick={() => void copyDomain(inst.domain)} className="flex items-center gap-1 font-mono hover:text-slate-600">
                    {inst.domain}
                    {copiedDomain === inst.domain ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                  </button>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {inst.member_count}{inst.plan_seats ? `/${inst.plan_seats}` : ''} {language === 'en' ? 'members' : 'miembros'}
                  </span>
                  {inst.owner_email && (
                    <>
                      <span>·</span>
                      <span>{language === 'en' ? 'Owner:' : 'Dueño:'} {inst.owner_email}</span>
                    </>
                  )}
                </div>
              </div>
              {inst.member_count === 0 && (
                <button
                  type="button"
                  disabled={deletingId === inst.id}
                  onClick={() => void handleDelete(inst)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 disabled:opacity-50"
                  title={language === 'en' ? 'Delete' : 'Eliminar'}
                >
                  <Trash2 className="size-4 text-slate-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
