import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Building2, Users, Crown, ShieldCheck, Briefcase, User as UserIcon, Loader, Plus, Trash2, Sparkles, Check, Globe2, Webhook as WebhookIcon, Contact, Key, Copy, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import {
  createCompany, getMyCompany, findCompanyByMyDomain, joinCompanyByDomain,
  addCompanyMember, removeCompanyMember, COMPANY_ROLE_LABELS,
  listApiKeys, generateApiKey, revokeApiKey,
  listWebhooks, createWebhook, deleteWebhook, WEBHOOK_EVENT_TYPES,
  type MyCompany, type CompanyDomainMatch, type CompanyRole, type ApiKey, type GeneratedApiKey, type Webhook,
} from '../services/company-service';

const ROLE_ICONS: Record<CompanyRole, typeof Crown> = { owner: Crown, admin: ShieldCheck, manager: Briefcase, user: UserIcon };

/** Owner/admin only — generate/revoke API keys. The full plaintext key
 * only ever exists in `justGenerated`, right after creation; it's never
 * fetchable again afterwards (only the DB's hash survives), same as
 * Stripe/GitHub API keys. */
function ApiKeysSection({ language }: { language: 'en' | 'es' }) {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [justGenerated, setJustGenerated] = useState<GeneratedApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => { listApiKeys().then(setKeys).catch(() => setKeys([])); };
  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    try {
      const created = await generateApiKey(newKeyName.trim());
      setJustGenerated(created);
      setNewKeyName('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not create the key.' : 'No se pudo crear la clave.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeApiKey(id);
      toast.success(language === 'en' ? 'Key revoked.' : 'Clave revocada.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not revoke the key.' : 'No se pudo revocar la clave.'));
    }
  };

  const handleCopy = async () => {
    if (!justGenerated) return;
    await navigator.clipboard.writeText(justGenerated.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Key className="size-4 text-slate-400" />
        {language === 'en' ? 'API Keys' : 'Claves de API'}
      </p>
      <p className="mb-4 text-xs text-slate-400">
        {language === 'en' ? 'Integrate CodecDocument with your own systems — base URL /api/v1.' : 'Integra CodecDocument con tus propios sistemas — URL base /api/v1.'}
      </p>

      {justGenerated && (
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="mb-1.5 text-xs font-bold text-amber-800">
            {language === 'en' ? 'Copy this key now — you won\'t be able to see it again.' : 'Copia esta clave ahora — no podrás volver a verla.'}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg bg-white px-3 py-2 text-xs text-slate-700">{justGenerated.api_key}</code>
            <button type="button" onClick={() => void handleCopy()} className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">
              {copied ? <CheckCheck className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? (language === 'en' ? 'Copied' : 'Copiado') : (language === 'en' ? 'Copy' : 'Copiar')}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(keys ?? []).filter((k) => !k.revoked_at).map((k) => (
          <div key={k.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
            <Key className="size-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-700">{k.name}</p>
              <p className="truncate text-[11px] text-slate-400">{k.key_prefix}…</p>
            </div>
            <button type="button" onClick={() => void handleRevoke(k.id)} className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700">
              {language === 'en' ? 'Revoke' : 'Revocar'}
            </button>
          </div>
        ))}
        {keys && keys.filter((k) => !k.revoked_at).length === 0 && (
          <p className="py-2 text-center text-xs text-slate-400">{language === 'en' ? 'No active keys yet.' : 'Aún no tienes claves activas.'}</p>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
        <input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder={language === 'en' ? 'Key name (e.g. "Production")' : 'Nombre de la clave (ej. "Producción")'}
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <button
          type="button"
          disabled={generating || !newKeyName.trim()}
          onClick={() => void handleGenerate()}
          className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {generating ? <Loader className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {language === 'en' ? 'Generate' : 'Generar'}
        </button>
      </div>
    </div>
  );
}

/** The Business plan's price/feature list lives ONLY here — never on the
 * main pricing page — per explicit instruction: company pricing stays
 * hidden until the person themselves clicks into "Empresa". */
function BusinessPlanReveal({ language }: { language: 'en' | 'es' }) {
  const features = [
    { en: 'Corporate workspace with multiple users', es: 'Workspace empresarial con múltiples usuarios' },
    { en: 'Roles & permissions (owner/admin/manager/member)', es: 'Roles y permisos (propietario/admin/gerente/miembro)' },
    { en: 'Corporate domain detection', es: 'Detección de dominio corporativo' },
    { en: 'Basic CRM of signers and contacts', es: 'CRM básico de firmantes y contactos' },
    { en: 'Public API access', es: 'Acceso a la API pública' },
    { en: 'Webhooks for your own systems', es: 'Webhooks para tus propios sistemas' },
  ];
  return (
    <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
        <Sparkles className="size-3" /> {language === 'en' ? 'Business Plan' : 'Plan Empresarial'}
      </span>
      <p className="text-3xl font-black text-slate-900">$99.99<span className="text-sm font-semibold text-slate-400">/{language === 'en' ? 'mo' : 'mes'}</span></p>
      <ul className="mt-4 space-y-2">
        {features.map((f) => (
          <li key={f.en} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 size-4 shrink-0 text-indigo-600" />
            {language === 'en' ? f.en : f.es}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Owner/admin only — register webhook URLs + which events fire them.
 * Live HTTP delivery is a separate increment (see the migration file's
 * footer) — this registers the subscription and starts logging matching
 * events into webhook_events immediately, ready for the dispatcher. */
function WebhooksSection({ language }: { language: 'en' | 'es' }) {
  const [hooks, setHooks] = useState<Webhook[] | null>(null);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['document.completed', 'signature.completed']);
  const [creating, setCreating] = useState(false);

  const load = () => { listWebhooks().then(setHooks).catch(() => setHooks([])); };
  useEffect(() => { load(); }, []);

  const toggleEvent = (evt: string) => {
    setEvents((prev) => prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]);
  };

  const handleCreate = async () => {
    if (!url.trim().startsWith('https://')) {
      toast.error(language === 'en' ? 'URL must start with https://' : 'La URL debe empezar con https://');
      return;
    }
    setCreating(true);
    try {
      await createWebhook(url.trim(), events);
      toast.success(language === 'en' ? 'Webhook added.' : 'Webhook agregado.');
      setUrl('');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not add the webhook.' : 'No se pudo agregar el webhook.'));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWebhook(id);
      toast.success(language === 'en' ? 'Webhook removed.' : 'Webhook eliminado.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not remove it.' : 'No se pudo eliminar.'));
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
        <WebhookIcon className="size-4 text-slate-400" /> Webhooks
      </p>
      <p className="mb-4 text-xs text-slate-400">
        {language === 'en' ? 'Get notified on your own systems when a document or signature event happens.' : 'Recibe avisos en tus propios sistemas cuando ocurre un evento de documento o firma.'}
      </p>

      <div className="space-y-2">
        {(hooks ?? []).map((w) => (
          <div key={w.id} className="rounded-xl bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{w.url}</span>
              <button type="button" onClick={() => void handleDelete(w.id)} className="shrink-0 text-slate-300 hover:text-red-500">
                <Trash2 className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{w.events.join(', ')}</p>
          </div>
        ))}
        {hooks && hooks.length === 0 && (
          <p className="py-2 text-center text-xs text-slate-400">{language === 'en' ? 'No webhooks yet.' : 'Aún no tienes webhooks.'}</p>
        )}
      </div>

      <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://tuempresa.com/webhook"
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <div className="flex flex-wrap gap-1.5">
          {WEBHOOK_EVENT_TYPES.map((evt) => (
            <button
              key={evt}
              type="button"
              onClick={() => toggleEvent(evt)}
              className="rounded-full px-3 py-1.5 text-[11px] font-bold transition"
              style={events.includes(evt) ? { background: '#4338CA', color: '#fff' } : { background: '#F1F5F9', color: '#64748B' }}
            >
              {evt}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={creating || !url.trim()}
          onClick={() => void handleCreate()}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {creating ? <Loader className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {language === 'en' ? 'Add webhook' : 'Agregar webhook'}
        </button>
      </div>
    </div>
  );
}

export function MyCompanyPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [myCompany, setMyCompany] = useState<MyCompany | null>(null);
  const [domainMatch, setDomainMatch] = useState<CompanyDomainMatch | null>(null);

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<CompanyRole>('user');
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const company = await getMyCompany();
      setMyCompany(company);
      if (!company) {
        const match = await findCompanyByMyDomain();
        setDomainMatch(match);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) void load(); else setLoading(false); }, [user]);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error(language === 'en' ? 'Company name is required.' : 'El nombre de la empresa es obligatorio.'); return; }
    setCreating(true);
    try {
      await createCompany(name.trim(), domain.trim());
      toast.success(language === 'en' ? 'Company created!' : '¡Empresa creada!');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not create the company.' : 'No se pudo crear la empresa.'));
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinCompanyByDomain();
      toast.success(language === 'en' ? 'Joined the workspace!' : '¡Te uniste al espacio corporativo!');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not join.' : 'No se pudo unir.'));
    } finally {
      setJoining(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await addCompanyMember(inviteEmail.trim(), inviteRole);
      toast.success(language === 'en' ? 'Member added.' : 'Miembro agregado.');
      setInviteEmail('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not add that member.' : 'No se pudo agregar ese miembro.'));
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeCompanyMember(userId);
      toast.success(language === 'en' ? 'Member removed.' : 'Miembro eliminado.');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not remove that member.' : 'No se pudo eliminar ese miembro.'));
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Sign in to manage your company' : 'Inicia sesión para gestionar tu empresa'}</p>
        <Link to="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">{language === 'en' ? 'Go home' : 'Ir al inicio'}</Link>
      </div>
    );
  }

  const canManage = myCompany?.myRole === 'owner' || myCompany?.myRole === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'Back' : 'Volver'}
        </button>

        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
          <Building2 className="size-6 text-indigo-600" />
          {language === 'en' ? 'Company Workspace' : 'Espacio Empresarial'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'en'
            ? 'Bring your whole team into one corporate account, with roles and permissions.'
            : 'Reúne a todo tu equipo en una sola cuenta corporativa, con roles y permisos.'}
        </p>

        {loading ? (
          <div className="mt-8 flex justify-center"><Loader className="size-6 animate-spin text-indigo-500" /></div>
        ) : myCompany ? (
          <div className="mt-6 space-y-5">
            {/* Company card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50">
                  <Building2 className="size-6 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-black text-slate-900">{myCompany.company.name}</p>
                  {myCompany.company.domain && (
                    <p className="flex items-center gap-1 text-xs text-slate-400"><Globe2 className="size-3" />{myCompany.company.domain}</p>
                  )}
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                  {(() => { const Icon = ROLE_ICONS[myCompany.myRole]; return <Icon className="size-3.5" />; })()}
                  {COMPANY_ROLE_LABELS[myCompany.myRole][language]}
                </span>
              </div>
            </div>

            {/* Members */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                <Users className="size-4 text-slate-400" />
                {language === 'en' ? 'Team members' : 'Miembros del equipo'} ({myCompany.members.length})
              </p>
              <div className="space-y-2">
                {myCompany.members.map((m) => {
                  const Icon = ROLE_ICONS[m.role];
                  return (
                    <div key={m.user_id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
                      <Icon className="size-4 shrink-0 text-slate-400" />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{m.email}</span>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500">{COMPANY_ROLE_LABELS[m.role][language]}</span>
                      {canManage && m.user_id !== user.id && (
                        <button type="button" onClick={() => void handleRemove(m.user_id)} className="shrink-0 text-slate-300 hover:text-red-500">
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {canManage && (
                <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={language === 'en' ? 'teammate@company.com' : 'colega@empresa.com'}
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as CompanyRole)}
                    className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                  >
                    <option value="user">{COMPANY_ROLE_LABELS.user[language]}</option>
                    <option value="manager">{COMPANY_ROLE_LABELS.manager[language]}</option>
                    <option value="admin">{COMPANY_ROLE_LABELS.admin[language]}</option>
                  </select>
                  <button
                    type="button"
                    disabled={inviting || !inviteEmail.trim()}
                    onClick={() => void handleInvite()}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {inviting ? <Loader className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    {language === 'en' ? 'Add' : 'Agregar'}
                  </button>
                </div>
              )}
              {canManage && (
                <p className="mt-2 text-xs text-slate-400">
                  {language === 'en'
                    ? 'The teammate must already have a Codec Document account with that email.'
                    : 'El colega ya debe tener una cuenta de Codec Document con ese correo.'}
                </p>
              )}
            </div>

            {/* API keys + Webhooks — owner/admin only, shown here so
                pricing/features stay out of the main pricing page */}
            {canManage && <ApiKeysSection language={language} />}
            {canManage && <WebhooksSection language={language} />}

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6">
              <p className="mb-3 text-sm font-bold text-slate-800">{language === 'en' ? 'Also included in your Business plan' : 'También incluido en tu Plan Empresarial'}</p>
              <Link to="/my-contacts" className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600"><Contact className="size-4 text-indigo-400" /> {language === 'en' ? 'Basic CRM' : 'CRM Básico'}</Link>
            </div>
          </div>
        ) : domainMatch ? (
          <div className="mt-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-6 text-center">
            <Building2 className="mx-auto mb-3 size-10 text-indigo-500" />
            <p className="text-lg font-black text-slate-900">
              {language === 'en' ? `${domainMatch.name} already exists` : `${domainMatch.name} ya existe`}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {language === 'en' ? 'Do you want to join this corporate workspace?' : '¿Deseas unirte a este espacio corporativo?'}
            </p>
            <button
              type="button"
              disabled={joining}
              onClick={() => void handleJoin()}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {joining ? <Loader className="size-4 animate-spin" /> : <Users className="size-4" />}
              {language === 'en' ? 'Join workspace' : 'Unirme al espacio'}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-sm font-bold text-slate-800">{language === 'en' ? 'Create your company workspace' : 'Crea tu espacio empresarial'}</p>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">{language === 'en' ? 'Company name' : 'Nombre de la empresa'}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'en' ? 'Acme Construction' : 'Acme Construcciones'}
                className="mb-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">{language === 'en' ? 'Corporate domain (optional)' : 'Dominio corporativo (opcional)'}</label>
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="acme.com"
                className="mb-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <p className="mb-4 text-xs text-slate-400">
                {language === 'en'
                  ? 'Teammates who sign in with an @acme.com email will be offered to join automatically.'
                  : 'Los colegas que inicien sesión con un correo @acme.com podrán unirse automáticamente.'}
              </p>
              <button
                type="button"
                disabled={creating || !name.trim()}
                onClick={() => void handleCreate()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
              >
                {creating ? <Loader className="size-4 animate-spin" /> : <Building2 className="size-4" />}
                {language === 'en' ? 'Create workspace' : 'Crear espacio empresarial'}
              </button>
            </div>

            <BusinessPlanReveal language={language} />
          </div>
        )}
      </div>
    </div>
  );
}
