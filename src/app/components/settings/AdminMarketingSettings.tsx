import { useEffect, useState } from 'react';
import { Megaphone, Check, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { isAdminEmail } from '../../utils/admin-access';
import { getAppSetting, setAppSetting, META_PIXEL_ID_KEY } from '../../services/app-settings-service';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

/** Owner-only "Marketing" settings card — currently just the Meta/Facebook
 * Pixel ID, editable without a code deploy so ad campaigns can be turned
 * on/off or repointed at a different pixel directly from Settings. Reused
 * by both DesktopSettings and MobileSettings; renders nothing when it
 * shouldn't, so both pages can drop it in unconditionally.
 *
 * Gated on isAdminEmail(), NOT on the broader isAdmin flag, deliberately.
 * isAdmin is also granted by the DB `role` column (see auth-context.tsx's
 * refreshSubscription) so admins can be added without a deploy — but the
 * app_settings RLS policies are guarded by is_admin_user(), which resolves
 * to this one hardcoded address and nothing else. A DB-flagged admin was
 * therefore seeing a field whose Save could only ever fail with an RLS
 * error. Matching the client gate to the server gate hides it from them
 * instead. If more people should manage the pixel later, widen
 * is_admin_user() and this check together — never just this one. */
export function AdminMarketingSettings() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const canManage = isAdminEmail(user?.email);
  const [pixelId, setPixelId] = useState('');
  const [savedPixelId, setSavedPixelId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canManage) return;
    getAppSetting(META_PIXEL_ID_KEY)
      .then((value) => { setPixelId(value ?? ''); setSavedPixelId(value ?? ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [canManage]);

  if (!canManage) return null;

  const dirty = pixelId.trim() !== savedPixelId;

  const handleSave = async () => {
    setSaving(true);
    try {
      await setAppSetting(META_PIXEL_ID_KEY, pixelId.trim());
      setSavedPixelId(pixelId.trim());
      toast.success(language === 'en' ? 'Meta Pixel ID saved' : 'ID de Meta Pixel guardado');
    } catch (e: any) {
      toast.error(e?.message || (language === 'en' ? 'Could not save' : 'No se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
        {language === 'en' ? 'Marketing (owner only)' : 'Marketing (solo propietario)'}
      </p>
      <div className="bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
            <Megaphone className="size-4 text-slate-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-800">
              {language === 'en' ? 'Meta (Facebook/Instagram) Pixel ID' : 'ID de Meta Pixel (Facebook/Instagram)'}
            </span>
            <span className="block text-xs text-slate-400">
              {language === 'en'
                ? 'Loads on every public page and fires PageView + CompleteRegistration for ad conversion tracking.'
                : 'Se carga en cada página pública y dispara PageView + CompleteRegistration para medir conversiones de anuncios.'}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={pixelId}
            onChange={(e) => setPixelId(e.target.value)}
            disabled={loading}
            placeholder={language === 'en' ? 'e.g. 1234567890123456' : 'ej. 1234567890123456'}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-1 focus:ring-indigo-300"
          />
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving || !dirty}
            className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-40"
            style={{ background: '#4338CA' }}
          >
            {saving ? <Loader className="size-4 animate-spin" /> : <Check className="size-4" />}
            {language === 'en' ? 'Save' : 'Guardar'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          {language === 'en'
            ? 'Find this in Meta Events Manager → Data Sources → your Pixel → Settings. Leave empty to disable tracking.'
            : 'Lo encuentras en Meta Events Manager → Fuentes de datos → tu Pixel → Configuración. Déjalo vacío para desactivar el seguimiento.'}
        </p>
      </div>
    </div>
  );
}
