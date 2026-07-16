import { FileText, PenLine, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/language-context';

const QUICK_CARDS = [
  { icon: FileText, labelEs: 'Documentos', labelEn: 'Documents', action: 'scroll' as const },
  { icon: PenLine, labelEs: 'Firmas', labelEn: 'Signatures', action: 'firma' as const },
  { icon: ShieldCheck, labelEs: 'Verificación', labelEn: 'Verification', action: 'scroll' as const },
  { icon: Sparkles, labelEs: 'IA Legal', labelEn: 'Legal AI', action: 'scroll' as const },
];

/**
 * Replaces the full-screen hero/slider as the FIRST thing a signed-out
 * mobile visitor sees — the traditional landing (hero, comparison table,
 * pricing, testimonials, footer) still exists below it in the normal
 * scroll flow, nothing was deleted, this just stops leading with a giant
 * background photo on a small screen. Once signed in, this never renders
 * at all — the visitor is on /app instead (see MobileAppShell).
 */
export function MobileLandingIntro({ onOpenSignIn }: { onOpenSignIn: () => void }) {
  const { language } = useLanguage();

  const scrollToDocuments = () => {
    document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCardClick = (action: 'scroll' | 'firma') => {
    if (action === 'firma') { window.location.href = '/firma-electronica'; return; }
    scrollToDocuments();
  };

  return (
    <div className="px-4 pb-8 pt-6" style={{ background: '#F8FAFC' }}>
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
        <button
          type="button"
          onClick={scrollToDocuments}
          className="flex w-full items-center justify-center gap-2 text-white transition active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            borderRadius: 16,
            height: 56,
            fontWeight: 700,
            fontSize: 15,
            boxShadow: '0 10px 24px rgba(37,99,235,0.35)',
          }}
        >
          {language === 'en' ? 'Create document' : 'Crear documento'} <ArrowRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={scrollToDocuments}
          className="flex w-full items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 transition active:scale-[0.98]"
          style={{ borderRadius: 16, height: 52, fontWeight: 600, fontSize: 14 }}
        >
          {language === 'en' ? 'View templates' : 'Ver plantillas'}
        </button>
      </div>

      {/* Quick cards */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {QUICK_CARDS.map(({ icon: Icon, labelEs, labelEn, action }) => (
          <button
            key={labelEs}
            type="button"
            onClick={() => handleCardClick(action)}
            className="flex flex-col items-start gap-2.5 rounded-2xl bg-white p-4 text-left transition active:scale-[0.97]"
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50">
              <Icon className="size-4.5 text-indigo-600" />
            </div>
            <span className="text-sm font-bold text-slate-900">{language === 'en' ? labelEn : labelEs}</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenSignIn}
        className="mt-5 w-full text-center text-xs font-semibold text-blue-600"
      >
        {language === 'en' ? 'Already have an account? Sign in' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  );
}
