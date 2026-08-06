import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Globe, Bell, ShieldCheck, FileText, Mail, ChevronRight, LogOut, LayoutTemplate, Palette, Building2, Contact, Receipt, Download, Share, PlusSquare } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useInstallPrompt } from '../../hooks/use-install-prompt';
import { SUPPORT_EMAIL } from '../../config/site';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';
import { AdminMarketingSettings } from '../../components/settings/AdminMarketingSettings';

export function DesktopSettings() {
  return (
    <DesktopAppShell>
      <SettingsContent />
    </DesktopAppShell>
  );
}

function SettingsContent() {
  const { logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [showIosHelp, setShowIosHelp] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Settings' : 'Configuración'}</h1>

      <div className="mt-6 space-y-6">
        {/* Preferences */}
        <div>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{language === 'en' ? 'Preferences' : 'Preferencias'}</p>
          <div className="bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50">
                  <Globe className="size-4 text-slate-500" />
                </div>
                <span className="text-sm font-semibold text-slate-800">{language === 'en' ? 'Language' : 'Idioma'}</span>
              </div>
              <div className="flex gap-1.5 rounded-full bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setLanguage('es')}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition"
                  style={language === 'es' ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}
                >
                  Español
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className="rounded-full px-3 py-1.5 text-xs font-bold transition"
                  style={language === 'en' ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Install app */}
        {!isStandalone && (
          <div>
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{language === 'en' ? 'App' : 'Aplicación'}</p>
            <button
              type="button"
              onClick={() => { if (isIOS) setShowIosHelp((v) => !v); else void promptInstall(); }}
              disabled={!isIOS && !canInstall}
              className="flex w-full items-center gap-3 bg-white p-5 text-left disabled:opacity-50"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><Download className="size-4 text-slate-500" /></div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'Install app' : 'Instalar app'}</span>
                <span className="block text-xs text-slate-400">
                  {isIOS
                    ? (language === 'en' ? 'Show install instructions for iPhone' : 'Ver instrucciones de instalación para iPhone')
                    : canInstall
                      ? (language === 'en' ? 'Add Codec Document to your device' : 'Agrega Codec Document a tu dispositivo')
                      : (language === 'en' ? 'Not available in this browser yet' : 'Aún no disponible en este navegador')}
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </button>
            {showIosHelp && (
              <div className="mt-2.5 flex items-start gap-3 bg-slate-900 p-5" style={{ borderRadius: CARD_RADIUS }}>
                <Share className="mt-0.5 size-4 shrink-0 text-indigo-400" />
                <p className="text-xs leading-relaxed text-slate-300">
                  {language === 'en'
                    ? <>Tap Share, then <span className="inline-flex items-center gap-1 font-semibold text-white"><PlusSquare className="size-3.5" /> Add to Home Screen</span>.</>
                    : <>Toca Compartir y luego <span className="inline-flex items-center gap-1 font-semibold text-white"><PlusSquare className="size-3.5" /> Agregar a inicio</span>.</>}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Custom templates & branding */}
        <div>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{language === 'en' ? 'Your business' : 'Tu negocio'}</p>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate('/my-templates')}
              className="flex w-full items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><LayoutTemplate className="size-4 text-slate-500" /></div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'My templates' : 'Mis plantillas'}</span>
                <span className="block text-xs text-slate-400">{language === 'en' ? 'Upload your own documents with fillable fields' : 'Sube tus propios documentos con campos llenables'}</span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-branding')}
              className="flex w-full items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><Palette className="size-4 text-slate-500" /></div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'Company branding' : 'Marca de tu empresa'}</span>
                <span className="block text-xs text-slate-400">{language === 'en' ? 'Logo, header/footer text and watermark' : 'Logo, texto de encabezado/pie y marca de agua'}</span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-company')}
              className="flex w-full items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><Building2 className="size-4 text-slate-500" /></div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'Company workspace' : 'Empresa'}</span>
                <span className="block text-xs text-slate-400">{language === 'en' ? 'Team, roles and corporate account' : 'Equipo, roles y cuenta corporativa'}</span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-contacts')}
              className="flex w-full items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><Contact className="size-4 text-slate-500" /></div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'Contacts' : 'Contactos'}</span>
                <span className="block text-xs text-slate-400">{language === 'en' ? 'Everyone who has signed or received a document' : 'Quiénes han firmado o recibido tus documentos'}</span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/my-quotes')}
              className="flex w-full items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><Receipt className="size-4 text-slate-500" /></div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'Smart Quotes' : 'Cotizaciones Inteligentes'}</span>
                <span className="block text-xs text-slate-400">{language === 'en' ? 'Create, send and get quotes signed' : 'Crea, envía y firma cotizaciones'}</span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{language === 'en' ? 'Notifications' : 'Notificaciones'}</p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/notifications')}
            className="flex w-full items-center gap-3 bg-white p-5 text-left"
            style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50">
              <Bell className="size-4 text-slate-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-slate-800">{language === 'en' ? 'View unread signed documents' : 'Ver documentos firmados sin leer'}</span>
            <ChevronRight className="size-4 text-slate-300" />
          </button>
        </div>

        <AdminMarketingSettings />

        {/* Security & support */}
        <div>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{language === 'en' ? 'Security & support' : 'Seguridad y soporte'}</p>
          <div className="space-y-2.5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><Mail className="size-4 text-slate-500" /></div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'Contact support' : 'Contactar soporte'}</span>
                <span className="block text-xs text-slate-400">{SUPPORT_EMAIL}</span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </a>
            <Link to="/privacy" className="flex items-center gap-3 bg-white p-5 text-left" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><ShieldCheck className="size-4 text-slate-500" /></div>
              <span className="flex-1 text-sm font-semibold text-slate-800">{language === 'en' ? 'Privacy policy' : 'Política de privacidad'}</span>
              <ChevronRight className="size-4 text-slate-300" />
            </Link>
            <Link to="/terms" className="flex items-center gap-3 bg-white p-5 text-left" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-50"><FileText className="size-4 text-slate-500" /></div>
              <span className="flex-1 text-sm font-semibold text-slate-800">{language === 'en' ? 'Terms of service' : 'Términos de servicio'}</span>
              <ChevronRight className="size-4 text-slate-300" />
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex w-full items-center gap-3 bg-white p-5 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: '#FEF2F2' }}><LogOut className="size-4" style={{ color: '#EF4444' }} /></div>
              <span className="flex-1 text-sm font-semibold" style={{ color: '#EF4444' }}>{language === 'en' ? 'Sign out' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
