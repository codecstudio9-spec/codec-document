import { useEffect, useState } from 'react';
import { Code2, Plus, Loader, Trash2, Copy, Check, KeyRound, Webhook as WebhookIcon, PlayCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useLanguage } from '../../contexts/language-context';
import {
  getMyCompany, createCompany,
  listApiKeys, generateApiKey, revokeApiKey, type ApiKey,
  listWebhooks, createWebhook, deleteWebhook, WEBHOOK_EVENT_TYPES, type Webhook,
} from '../../services/company-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

const API_BASE = 'https://yxzchnldmfsgdtbjurey.supabase.co/functions/v1/api-v1';

/**
 * Platform-admin-only view of the public REST API (`supabase/functions/
 * api-v1`) — generate/revoke `cd_live_` keys, register webhooks, and see
 * exactly how to call it, all in one place, without needing to be part of
 * a company someone else manages. Reuses the same company-scoped API-key/
 * webhook RPCs the "Fase 2/3" enterprise module already has (any company
 * owner/admin can already do this from /my-company) — this page just
 * gives the platform admin a dedicated, always-available spot for it,
 * gated by AdminRoute like DesktopAdminInstitutions.tsx.
 */
export function DesktopAdminApi() {
  return (
    <DesktopAppShell>
      <ApiContent />
    </DesktopAppShell>
  );
}

function ApiContent() {
  const { language } = useLanguage();
  const tr = (es: string, en: string) => (language === 'en' ? en : es);

  const [hasCompany, setHasCompany] = useState<boolean | null>(null);
  const [creatingCompany, setCreatingCompany] = useState(false);

  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [webhooks, setWebhooks] = useState<Webhook[] | null>(null);
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([...WEBHOOK_EVENT_TYPES]);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const load = () => {
    getMyCompany().then((c) => {
      setHasCompany(Boolean(c));
      if (!c) return;
      listApiKeys().then(setKeys).catch(() => setKeys([]));
      listWebhooks().then(setWebhooks).catch(() => setWebhooks([]));
    });
  };

  useEffect(() => { load(); }, []);

  const handleCreateCompany = async () => {
    setCreatingCompany(true);
    try {
      await createCompany(tr('Espacio de Codec Document', 'Codec Document Workspace'));
      toast.success(tr('Espacio creado', 'Workspace created'));
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('No se pudo crear el espacio', 'Could not create the workspace'));
    } finally {
      setCreatingCompany(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!newKeyName.trim()) return;
    setGenerating(true);
    try {
      const created = await generateApiKey(newKeyName.trim());
      setRevealedKey(created.api_key);
      setNewKeyName('');
      listApiKeys().then(setKeys).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('No se pudo generar la clave', 'Could not generate the key'));
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeKey = async (key: ApiKey) => {
    const confirmed = window.confirm(tr(`¿Revocar "${key.name}"? Dejará de funcionar de inmediato.`, `Revoke "${key.name}"? It will stop working immediately.`));
    if (!confirmed) return;
    setRevokingId(key.id);
    try {
      await revokeApiKey(key.id);
      if (revealedKey && key.id === keys?.find((k) => k.id === key.id)?.id) setRevealedKey(null);
      listApiKeys().then(setKeys).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('No se pudo revocar', 'Could not revoke it'));
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch { /* clipboard permission denied — still visible to copy by hand */ }
  };

  const handleAddWebhook = async () => {
    if (!webhookUrl.trim().startsWith('https://')) {
      toast.error(tr('La URL debe empezar con https://', 'The URL must start with https://'));
      return;
    }
    if (webhookEvents.length === 0) {
      toast.error(tr('Elige al menos un evento', 'Choose at least one event'));
      return;
    }
    setSavingWebhook(true);
    try {
      await createWebhook(webhookUrl.trim(), webhookEvents);
      toast.success(tr('Webhook agregado', 'Webhook added'));
      setWebhookUrl(''); setAddingWebhook(false);
      listWebhooks().then(setWebhooks).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('No se pudo agregar el webhook', 'Could not add the webhook'));
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    setDeletingWebhookId(id);
    try {
      await deleteWebhook(id);
      listWebhooks().then(setWebhooks).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tr('No se pudo eliminar', 'Could not delete it'));
    } finally {
      setDeletingWebhookId(null);
    }
  };

  const handleTestNow = async () => {
    if (!revealedKey) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/company`, {
        headers: { Authorization: `Bearer ${revealedKey}` },
      });
      const body = await res.json();
      setTestResult(`HTTP ${res.status}\n${JSON.stringify(body, null, 2)}`);
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : String(err));
    } finally {
      setTesting(false);
    }
  };

  const exampleKey = revealedKey || 'cd_live_TU_CLAVE_AQUI';

  if (hasCompany === null) {
    return <div className="flex justify-center py-20"><Loader className="size-6 animate-spin text-slate-300" /></div>;
  }

  if (!hasCompany) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Building2 className="mx-auto mb-3 size-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">
          {tr('Necesitas un espacio de trabajo para generar claves de API', 'You need a workspace to generate API keys')}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {tr('Las claves y los webhooks se guardan por espacio de trabajo, no por cuenta individual.', 'Keys and webhooks are stored per workspace, not per individual account.')}
        </p>
        <button
          type="button"
          disabled={creatingCompany}
          onClick={() => void handleCreateCompany()}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {creatingCompany ? <Loader className="size-4 animate-spin" /> : <Building2 className="size-4" />}
          {tr('Crear mi espacio', 'Create my workspace')}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
        <Code2 className="size-6 text-indigo-600" />
        {tr('API', 'API')}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {tr('Genera claves para integrar Codec Document con cualquier plataforma externa, y configura webhooks para que te avisen en tiempo real. Solo tú ves esta página.', 'Generate keys to integrate Codec Document with any external platform, and set up webhooks to get notified in real time. Only you see this page.')}
      </p>

      {/* ── API Keys ─────────────────────────────────────────────────── */}
      <div className="mt-6 bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <KeyRound className="size-4" /> {tr('Claves de API', 'API Keys')}
        </p>

        {revealedKey && (
          <div className="mt-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-bold text-amber-800">
              {tr('Copia esta clave ahora, no se volverá a mostrar completa.', 'Copy this key now, it will never be shown in full again.')}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs">{revealedKey}</code>
              <button type="button" onClick={() => void copyKey(revealedKey)} className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">
                {copiedKey ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copiedKey ? tr('Copiado', 'Copied') : tr('Copiar', 'Copy')}
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <input
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder={tr('Nombre de la clave (ej. "Integración con CRM")', 'Key name (e.g. "CRM integration")')}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            disabled={!newKeyName.trim() || generating}
            onClick={() => void handleGenerateKey()}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {generating ? <Loader className="size-4 animate-spin" /> : <Plus className="size-4" />}
            {tr('Generar', 'Generate')}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {keys === null ? (
            <div className="h-12 animate-pulse rounded-xl bg-slate-50" />
          ) : keys.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-400">{tr('Aún no tienes claves', 'No keys yet')}</p>
          ) : keys.map((key) => (
            <div key={key.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{key.name}</p>
                <p className="font-mono text-xs text-slate-400">
                  {key.key_prefix}… · {new Date(key.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-CO')}
                  {key.revoked_at && <span className="ml-2 text-red-500">{tr('Revocada', 'Revoked')}</span>}
                </p>
              </div>
              {!key.revoked_at && (
                <button
                  type="button"
                  disabled={revokingId === key.id}
                  onClick={() => void handleRevokeKey(key)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  title={tr('Revocar', 'Revoke')}
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Webhooks ─────────────────────────────────────────────────── */}
      <div className="mt-4 bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <p className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
          <WebhookIcon className="size-4" /> {tr('Webhooks', 'Webhooks')}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          {tr('Recibe un POST en tu propia URL cuando pase algo, como un documento completado o una firma enviada o completada. Cada entrega va firmada con HMAC-SHA256 (header X-Codec-Signature) usando el secreto de ese webhook.', 'Get a POST to your own URL when something happens, like a document completed or a signature sent or completed. Every delivery is HMAC-SHA256 signed (X-Codec-Signature header) using that webhook\'s own secret.')}
        </p>

        <div className="mt-3 space-y-2">
          {webhooks === null ? (
            <div className="h-12 animate-pulse rounded-xl bg-slate-50" />
          ) : webhooks.length === 0 ? (
            <p className="py-2 text-center text-xs text-slate-400">{tr('Sin webhooks configurados', 'No webhooks configured')}</p>
          ) : webhooks.map((wh) => (
            <div key={wh.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{wh.url}</p>
                <p className="text-xs text-slate-400">{wh.events.join(', ')}</p>
              </div>
              <button
                type="button"
                disabled={deletingWebhookId === wh.id}
                onClick={() => void handleDeleteWebhook(wh.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        {addingWebhook ? (
          <div className="mt-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-3">
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://tu-servidor.com/webhooks/codec-document"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {WEBHOOK_EVENT_TYPES.map((ev) => (
                <label key={ev} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs">
                  <input
                    type="checkbox"
                    checked={webhookEvents.includes(ev)}
                    onChange={(e) => setWebhookEvents((prev) => (e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev)))}
                  />
                  {ev}
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setAddingWebhook(false)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-500">
                {tr('Cancelar', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={savingWebhook}
                onClick={() => void handleAddWebhook()}
                className="flex-1 rounded-xl bg-indigo-600 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {savingWebhook ? <Loader className="mx-auto size-3.5 animate-spin" /> : tr('Guardar', 'Save')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingWebhook(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-indigo-200/70 py-2.5 text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            <Plus className="size-4" /> {tr('Agregar webhook', 'Add webhook')}
          </button>
        )}
      </div>

      {/* ── Documentación ────────────────────────────────────────────── */}
      <div className="mt-4 bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <p className="text-sm font-bold text-slate-700">{tr('Cómo usarla', 'How to use it')}</p>
        <p className="mt-1 text-xs text-slate-500">
          {tr('Base:', 'Base:')} <code className="rounded bg-slate-100 px-1.5 py-0.5">{API_BASE}</code>. {tr('Autenticación con', 'Authenticate with')} <code className="rounded bg-slate-100 px-1.5 py-0.5">Authorization: Bearer cd_live_...</code>.
        </p>

        <div className="mt-3 space-y-3 text-xs">
          {[
            { method: 'GET', path: '/company', desc: tr('Datos de tu empresa', 'Your company\'s info') },
            { method: 'GET', path: '/users', desc: tr('Miembros del equipo', 'Team members') },
            { method: 'GET', path: '/documents', desc: tr('Últimos 100 documentos', 'Last 100 documents') },
            { method: 'POST', path: '/documents', desc: tr('Crear un documento, body: {"name": "..."}', 'Create a document, body: {"name": "..."}') },
            { method: 'GET', path: '/documents/:id', desc: tr('Un documento por id', 'One document by id') },
            { method: 'DELETE', path: '/documents/:id', desc: tr('Eliminar un documento', 'Delete a document') },
            { method: 'POST', path: '/signatures', desc: tr('Pedir firma, body: {"document_id","name","email"}', 'Request a signature, body: {"document_id","name","email"}') },
            { method: 'GET', path: '/signatures/:id', desc: tr('Estado de una firma', 'A signature\'s status') },
          ].map((ep) => (
            <div key={`${ep.method}-${ep.path}`} className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 rounded bg-slate-900 px-1.5 py-0.5 font-mono font-bold text-white">{ep.method}</span>
              <div className="min-w-0">
                <code className="text-slate-700">{ep.path}</code>
                <p className="text-slate-400">{ep.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs font-bold text-slate-600">{tr('Prueba desde tu terminal', 'Try it from your terminal')}</p>
        <pre className="mt-1.5 overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
{`curl "${API_BASE}/documents" \\
  -H "Authorization: Bearer ${exampleKey}"`}
        </pre>

        <div className="mt-4">
          <button
            type="button"
            disabled={!revealedKey || testing}
            onClick={() => void handleTestNow()}
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {testing ? <Loader className="size-3.5 animate-spin" /> : <PlayCircle className="size-3.5" />}
            {tr('Probar ahora (GET /company)', 'Test now (GET /company)')}
          </button>
          {!revealedKey && (
            <p className="mt-1.5 text-[11px] text-slate-400">
              {tr('Genera una clave arriba para poder probarla aquí mismo.', 'Generate a key above to test it right here.')}
            </p>
          )}
          {testResult && (
            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-emerald-300">{testResult}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
