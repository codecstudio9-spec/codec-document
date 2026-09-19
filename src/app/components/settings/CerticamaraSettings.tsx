import { useEffect, useState } from 'react';
import { ShieldCheck, Check, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { getSecretStatus, setSecret, deleteSecret, CERTICAMARA_SECRET_KEY, type SecretStatus } from '../../services/certicamara-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

/**
 * Admin-only — where the real Certicámara API key gets pasted once it
 * exists. Write-only by design: after saving, the key is never shown
 * again (same pattern as a password field) — it's stored in
 * `admin_secrets`, readable only by certicamara-sign's Edge Function via
 * the service-role key, never by any client, not even this admin's own
 * session. See supabase/functions/certicamara-sign/index.ts for what
 * actually happens once this is set (short version: not much yet — the
 * real API call is still pending Certicámara's documentation).
 */
export function CerticamaraSettings() {
  const { isAdmin } = useAuth();
  const { language } = useLanguage();
  const [status, setStatus] = useState<SecretStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    getSecretStatus(CERTICAMARA_SECRET_KEY).then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handleSave = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await setSecret(CERTICAMARA_SECRET_KEY, value.trim());
      setValue('');
      setStatus({ configured: true, updated_at: new Date().toISOString() });
      toast.success(language === 'en' ? 'Certicámara API key saved' : 'API key de Certicámara guardada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not save' : 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      language === 'en' ? 'Remove the saved Certicámara API key?' : '¿Quitar la API key de Certicámara guardada?',
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      await deleteSecret(CERTICAMARA_SECRET_KEY);
      setStatus({ configured: false, updated_at: null });
      toast.success(language === 'en' ? 'Removed' : 'Quitada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not remove it' : 'No se pudo quitar'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {language === 'en' ? 'Certicámara (owner only)' : 'Certicámara (solo propietario)'}
      </p>
      <div className="bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <ShieldCheck className="size-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-800">
              {language === 'en' ? 'Certicámara API key' : 'API key de Certicámara'}
            </span>
            <span className="block text-xs text-slate-400">
              {language === 'en'
                ? 'Once saved, "Certified digital signature" becomes available when sending a document to sign.'
                : 'Una vez guardada, "Firma digital certificada" queda disponible al enviar un documento a firmar.'}
            </span>
          </div>
          {!loading && (
            <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${status?.configured ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {status?.configured && <Check className="size-3" />}
              {status?.configured ? (language === 'en' ? 'Configured' : 'Configurada') : (language === 'en' ? 'Not set' : 'Sin configurar')}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={showValue ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={status?.configured
                ? (language === 'en' ? 'Paste a new key to replace it…' : 'Pega una clave nueva para reemplazarla…')
                : (language === 'en' ? 'Paste your Certicámara API key…' : 'Pega tu API key de Certicámara…')}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={() => setShowValue((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showValue ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <button
            type="button"
            disabled={!value.trim() || saving}
            onClick={() => void handleSave()}
            className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (language === 'en' ? 'Saving…' : 'Guardando…') : (language === 'en' ? 'Save' : 'Guardar')}
          </button>
        </div>

        {!loading && status?.configured && (
          <button
            type="button"
            disabled={deleting}
            onClick={() => void handleDelete()}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            {language === 'en' ? 'Remove key' : 'Quitar clave'}
          </button>
        )}

        <p className="mt-3 text-[11px] text-slate-400">
          {language === 'en'
            ? 'The real signing API call is still pending Certicámara\'s documentation — saving the key here enables the option in the UI, not the live integration yet.'
            : 'La llamada real a la API de firma todavía está pendiente de la documentación de Certicámara — guardar la clave aquí activa la opción en la interfaz, no la integración en vivo todavía.'}
        </p>
      </div>
    </div>
  );
}
