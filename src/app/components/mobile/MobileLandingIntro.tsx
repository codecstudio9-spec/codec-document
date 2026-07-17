import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { FileText, PenLine, ShieldCheck, Sparkles, ArrowRight, FolderOpen } from 'lucide-react';
import { useLanguage } from '../../contexts/language-context';
import { useMobileSignIn } from './MobileAppShell';
import { CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT } from '../../styles/mobile-theme';

const QUICK_CARDS = [
  { icon: FileText, labelEs: 'Documentos', labelEn: 'Documents', href: '/app/templates' },
  { icon: PenLine, labelEs: 'Firmas', labelEn: 'Signatures', href: '/firma-electronica' },
  { icon: ShieldCheck, labelEs: 'Verificación', labelEn: 'Verification', href: '/app/templates' },
  { icon: Sparkles, labelEs: 'IA Legal', labelEn: 'Legal AI', href: '/app/templates' },
];

/**
 * The "Inicio" screen inside the /app shell for a signed-out mobile
 * visitor — real navigation into other /app/* views (no scrollIntoView
 * anywhere), so it behaves like a screen of the app rather than a section
 * of a page. Once signed in, MobileDashboardHome swaps this out for the
 * real dashboard entirely — this never renders alongside stats/greeting.
 */
export function MobileLandingIntro() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const openSignIn = useMobileSignIn();

  return (
    <div className="px-4 pb-8 pt-6">
      <div>
        <h1 className="text-2xl font-black leading-tight text-slate-900">
          {language === 'en' ? 'Legal documents, done right' : 'Documentos legales, bien hechos'}
        </h1>
        <div className="mt-3 space-y-1.5">
          {(language === 'en'
            ? ['Create legal documents', 'Sign documents', 'Verify identity']
            : ['Crear documentos legales', 'Firmar documentos', 'Verificar identidad']
          ).map((line) => (
            <p key={line} className="flex items-center gap-2 text-sm text-slate-500">
              <span className="size-1.5 rounded-full bg-blue-500" />
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-2.5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => navigate('/app/templates')}
          className="flex w-full items-center justify-center gap-2 text-white"
          style={{
            background: BLUE_GRADIENT,
            borderRadius: 16,
            height: 56,
            fontWeight: 700,
            fontSize: 15,
            boxShadow: '0 14px 28px rgba(37,99,235,0.35)',
          }}
        >
          {language === 'en' ? 'Create document' : 'Crear documento'} <ArrowRight className="size-4" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => navigate('/app/templates')}
          className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700"
          style={{ borderRadius: 16, height: 52, fontWeight: 600, fontSize: 14 }}
        >
          {language === 'en' ? 'View templates' : 'Ver plantillas'}
        </motion.button>
      </div>

      {/* Quick cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {QUICK_CARDS.map(({ icon: Icon, labelEs, labelEn, href }) => (
          <motion.button
            key={labelEs}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => navigate(href)}
            className="flex flex-col items-start gap-2.5 bg-white p-4 text-left"
            style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50">
              <Icon className="size-4.5 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-slate-900">{language === 'en' ? labelEn : labelEs}</span>
          </motion.button>
        ))}
      </div>

      {/* Custom templates promo — my-templates is behind ProtectedRoute,
          so a signed-out tap opens the sign-in sheet directly instead of
          silently bouncing back to this same screen. */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={openSignIn}
        className="mt-3 flex w-full items-center gap-3 p-4 text-left"
        style={{ borderRadius: CARD_RADIUS, background: 'linear-gradient(135deg,#312e81,#1e1b4b)' }}
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
          <FolderOpen className="size-5 text-indigo-200" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{language === 'en' ? 'Upload your own templates' : 'Sube tus propias plantillas'}</p>
          <p className="mt-0.5 text-xs text-white/50">{language === 'en' ? 'Mark the fields once, reuse forever' : 'Marca los campos una vez, reúsalo siempre'}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-white/40" />
      </motion.button>

      <button
        type="button"
        onClick={openSignIn}
        className="mt-5 w-full text-center text-xs font-semibold text-blue-600"
      >
        {language === 'en' ? 'Already have an account? Sign in' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  );
}
