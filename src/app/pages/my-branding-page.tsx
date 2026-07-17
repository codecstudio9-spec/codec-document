import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Upload, Save, Loader, Image as ImageIcon, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { getUserBranding, updateUserBranding, uploadLogo, type UserBranding } from '../services/branding-service';

const EMPTY: UserBranding = {
  companyLogoUrl: null, logoSize: 'medium', headerText: null, footerText: null,
  useWatermark: false, useGlobalBranding: false,
};

export function MyBrandingPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [branding, setBranding] = useState<UserBranding>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getUserBranding(user.id).then((b) => { setBranding(b); setLoading(false); }).catch(() => setLoading(false));
  }, [user?.id]);

  const handleLogoUpload = async (file?: File | null) => {
    if (!file || !user?.id) return;
    setUploadingLogo(true);
    try {
      const url = await uploadLogo(user.id, file);
      setBranding((b) => ({ ...b, companyLogoUrl: url }));
      toast.success(language === 'en' ? 'Logo uploaded' : 'Logo subido');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not upload the logo' : 'No se pudo subir el logo'));
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserBranding(branding);
      toast.success(language === 'en' ? 'Branding saved' : 'Marca guardada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not save' : 'No se pudo guardar'));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Sign in to customize your branding' : 'Inicia sesión para personalizar tu marca'}</p>
        <Link to="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">{language === 'en' ? 'Go home' : 'Ir al inicio'}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'Back' : 'Volver'}
        </button>

        <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Company Branding' : 'Marca de tu Empresa'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'en'
            ? 'Personalize the documents you send for signature — this never changes anything already signed or in progress.'
            : 'Personaliza los documentos que envías a firmar — esto nunca cambia nada ya firmado o en curso.'}
        </p>

        {loading ? (
          <div className="mt-8 flex justify-center"><Loader className="size-6 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Logo */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-slate-800">{language === 'en' ? 'Logo' : 'Logo'}</p>
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {branding.companyLogoUrl ? (
                    <img src={branding.companyLogoUrl} alt="Logo" className="size-full object-contain p-1" />
                  ) : (
                    <ImageIcon className="size-6 text-slate-300" />
                  )}
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleLogoUpload(e.target.files?.[0])} />
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {uploadingLogo ? <Loader className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {language === 'en' ? 'Upload logo' : 'Subir logo'}
                  </button>
                  <p className="mt-1.5 text-xs text-slate-400">PNG, JPG {language === 'en' ? 'or SVG' : 'o SVG'}</p>
                </div>
              </div>

              <p className="mb-1.5 mt-4 text-xs font-semibold text-slate-700">{language === 'en' ? 'Logo size' : 'Tamaño del logo'}</p>
              <div className="flex gap-1.5 rounded-full bg-slate-50 p-1">
                {(['small', 'medium', 'large'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBranding((b) => ({ ...b, logoSize: s }))}
                    className="flex-1 rounded-full px-3 py-1.5 text-xs font-bold transition"
                    style={branding.logoSize === s ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}
                  >
                    {s === 'small' ? (language === 'en' ? 'Small' : 'Pequeño') : s === 'medium' ? (language === 'en' ? 'Medium' : 'Mediano') : (language === 'en' ? 'Large' : 'Grande')}
                  </button>
                ))}
              </div>
            </div>

            {/* Header / footer text */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-slate-800">{language === 'en' ? 'Header & footer text' : 'Texto de encabezado y pie'}</p>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">{language === 'en' ? 'Header (e.g. company slogan)' : 'Encabezado (ej. eslogan de tu empresa)'}</label>
              <input
                value={branding.headerText ?? ''}
                onChange={(e) => setBranding((b) => ({ ...b, headerText: e.target.value }))}
                placeholder={language === 'en' ? 'Your Company — Trusted Since 2020' : 'Tu Empresa — Confianza desde 2020'}
                maxLength={120}
                className="mb-3 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">{language === 'en' ? 'Footer (e.g. contact info)' : 'Pie de página (ej. datos de contacto)'}</label>
              <input
                value={branding.footerText ?? ''}
                onChange={(e) => setBranding((b) => ({ ...b, footerText: e.target.value }))}
                placeholder={language === 'en' ? 'contact@yourcompany.com · +1 555 000 0000' : 'contacto@tuempresa.com · +57 300 000 0000'}
                maxLength={160}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
              />
            </div>

            {/* Toggles */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{language === 'en' ? 'Show header/footer on signing page' : 'Mostrar encabezado/pie en la página de firma'}</p>
                  <p className="text-xs text-slate-400">{language === 'en' ? 'The person signing will see your branding' : 'Quien firme verá tu marca'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBranding((b) => ({ ...b, useGlobalBranding: !b.useGlobalBranding }))}
                  className="relative h-7 w-12 shrink-0 rounded-full transition"
                  style={{ background: branding.useGlobalBranding ? '#2563EB' : '#E2E8F0' }}
                >
                  <span className="absolute top-1 size-5 rounded-full bg-white shadow transition-all" style={{ left: branding.useGlobalBranding ? 24 : 4 }} />
                </button>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 py-2 pt-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{language === 'en' ? 'Watermark on documents' : 'Marca de agua en los documentos'}</p>
                  <p className="text-xs text-slate-400">{language === 'en' ? 'A light watermark on every page' : 'Una marca de agua ligera en cada página'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBranding((b) => ({ ...b, useWatermark: !b.useWatermark }))}
                  className="relative h-7 w-12 shrink-0 rounded-full transition"
                  style={{ background: branding.useWatermark ? '#2563EB' : '#E2E8F0' }}
                >
                  <span className="absolute top-1 size-5 rounded-full bg-white shadow transition-all" style={{ left: branding.useWatermark ? 24 : 4 }} />
                </button>
              </div>
            </div>

            {(branding.headerText || branding.footerText || branding.companyLogoUrl) && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-4">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"><Eye className="size-3.5" />{language === 'en' ? 'Preview' : 'Vista previa'}</p>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
                  {branding.companyLogoUrl && <img src={branding.companyLogoUrl} alt="Logo" className="mx-auto mb-2 object-contain" style={{ height: branding.logoSize === 'small' ? 28 : branding.logoSize === 'large' ? 56 : 40 }} />}
                  {branding.headerText && <p className="text-sm font-bold text-slate-800">{branding.headerText}</p>}
                  <div className="my-3 h-16 rounded-lg border border-dashed border-slate-200 bg-white" />
                  {branding.footerText && <p className="text-xs text-slate-400">{branding.footerText}</p>}
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:opacity-50"
            >
              {isSaving ? <Loader className="size-5 animate-spin" /> : <Save className="size-5" />}
              {language === 'en' ? 'Save branding' : 'Guardar marca'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
