import type { LucideIcon } from 'lucide-react';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { useMobileSignIn } from './MobileAppShell';
import { useLanguage } from '../../contexts/language-context';
import { CARD_RADIUS, CARD_SHADOW, BLUE_GRADIENT } from '../../styles/mobile-theme';

/** Empty-state shown in place of real data on /app/* screens that need an
 * account (Firmas, Documentos, Perfil) when the visitor isn't signed in —
 * keeps them inside the app-shell instead of bouncing them to another page. */
export function MobileSignInPrompt({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  const openSignIn = useMobileSignIn();
  const { language } = useLanguage();

  return (
    <div className="px-4 pt-8">
      <div className="bg-white px-5 py-10 text-center" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-indigo-50">
          <Icon className="size-5 text-indigo-600" />
        </div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mx-auto mt-1 max-w-[240px] text-xs text-slate-500">{description}</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={openSignIn}
          className="mx-auto mt-5 flex items-center justify-center gap-2 text-white"
          style={{
            background: BLUE_GRADIENT,
            borderRadius: 16,
            height: 48,
            paddingLeft: 20,
            paddingRight: 20,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 10px 24px rgba(37,99,235,0.35)',
          }}
        >
          <LogIn className="size-4" /> {language === 'en' ? 'Sign in' : 'Iniciar sesión'}
        </motion.button>
      </div>
    </div>
  );
}
