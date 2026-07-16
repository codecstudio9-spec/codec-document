import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Globe, ShieldCheck, FileText, Mail, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { MobileAppShell } from '../../components/mobile/MobileAppShell';
import { MobileSignInPrompt } from '../../components/mobile/MobileSignInPrompt';
import { SUPPORT_EMAIL } from '../../config/site';
import { CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT } from '../../styles/mobile-theme';

export function MobileSettings() {
  return (
    <MobileAppShell>
      <SettingsContent />
    </MobileAppShell>
  );
}

function SettingsContent() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  if (!user) {
    return (
      <div>
        <div className="px-4 pb-8 pt-6" style={{ background: BLUE_GRADIENT }}>
          <h1 className="text-xl font-black text-white">{language === 'en' ? 'Settings' : 'Ajustes'}</h1>
        </div>
        <MobileSignInPrompt
          icon={ShieldCheck}
          title={language === 'en' ? 'Sign in to see settings' : 'Inicia sesión para ver los ajustes'}
          description={language === 'en' ? 'Language, support and platform policies.' : 'Idioma, soporte y las políticas de la plataforma.'}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 pb-6 pt-6" style={{ background: BLUE_GRADIENT }}>
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} type="button" onClick={() => navigate('/app/profile')} className="flex size-8 items-center justify-center rounded-xl bg-white/15">
            <ArrowLeft className="size-4 text-white" />
          </motion.button>
          <h1 className="text-xl font-black text-white">{language === 'en' ? 'Settings' : 'Ajustes'}</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Language */}
        <div>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{language === 'en' ? 'Language' : 'Idioma'}</p>
          <div className="flex gap-2 bg-white p-1.5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
            <button
              type="button"
              onClick={() => setLanguage('es')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition"
              style={language === 'es' ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}
            >
              <Globe className="size-3.5" /> Español
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition"
              style={language === 'en' ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}
            >
              <Globe className="size-3.5" /> English
            </button>
          </div>
        </div>

        {/* Legal + support */}
        <div>
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{language === 'en' ? 'Support & legal' : 'Soporte y legal'}</p>
          <div className="space-y-2.5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex w-full items-center gap-3 bg-white p-4 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                <Mail className="size-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-800">{language === 'en' ? 'Contact support' : 'Contactar soporte'}</span>
                <span className="block truncate text-xs text-slate-400">{SUPPORT_EMAIL}</span>
              </div>
              <ChevronRight className="size-4 text-slate-300" />
            </a>

            <Link
              to="/privacy"
              className="flex w-full items-center gap-3 bg-white p-4 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                <ShieldCheck className="size-4 text-slate-500" />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-800">{language === 'en' ? 'Privacy policy' : 'Política de privacidad'}</span>
              <ChevronRight className="size-4 text-slate-300" />
            </Link>

            <Link
              to="/terms"
              className="flex w-full items-center gap-3 bg-white p-4 text-left"
              style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50">
                <FileText className="size-4 text-slate-500" />
              </div>
              <span className="flex-1 text-sm font-semibold text-slate-800">{language === 'en' ? 'Terms of service' : 'Términos de servicio'}</span>
              <ChevronRight className="size-4 text-slate-300" />
            </Link>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => void handleLogout()}
          className="flex w-full items-center gap-3 bg-white p-4 text-left"
          style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl" style={{ background: '#FEF2F2' }}>
            <LogOut className="size-4" style={{ color: '#EF4444' }} />
          </div>
          <span className="flex-1 text-sm font-semibold" style={{ color: '#EF4444' }}>{language === 'en' ? 'Sign out' : 'Cerrar sesión'}</span>
        </motion.button>
      </div>
    </div>
  );
}
