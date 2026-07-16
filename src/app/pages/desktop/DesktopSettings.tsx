import { useNavigate, Link } from 'react-router';
import { Globe, Bell, ShieldCheck, FileText, Mail, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { SUPPORT_EMAIL } from '../../config/site';
import { CARD_RADIUS, CARD_SHADOW } from '../../styles/mobile-theme';

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
