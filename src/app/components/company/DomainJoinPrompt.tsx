import { useEffect, useState } from 'react';
import { Building2, Loader, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth-context';
import { useLanguage } from '../../contexts/language-context';
import { findCompanyByMyDomain, joinCompanyByDomain, type CompanyDomainMatch } from '../../services/company-service';

const DISMISS_KEY_PREFIX = 'codec_domain_join_dismissed_';

/**
 * The "institutional SSO" onboarding moment — mounted in both app shells
 * (Desktop/Mobile) so it's seen right after login regardless of which
 * page the user lands on first, instead of requiring them to find
 * Configuración → Empresa themselves (that page's own domain-match
 * prompt still exists as a fallback). findCompanyByMyDomain() already
 * returns nothing server-side if the caller already belongs to a
 * company, so this only ever renders for someone who doesn't have one
 * yet and whose email domain matches an institution the platform admin
 * provisioned (see DesktopAdminInstitutions.tsx).
 */
export function DomainJoinPrompt() {
  const { session } = useAuth();
  const { language } = useLanguage();
  const [match, setMatch] = useState<CompanyDomainMatch | null>(null);
  const [joining, setJoining] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    findCompanyByMyDomain().then((m) => {
      if (m && localStorage.getItem(DISMISS_KEY_PREFIX + m.id) === '1') return;
      setMatch(m);
    }).catch(() => {});
  }, [session?.user?.id]);

  if (!match || dismissed) return null;

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinCompanyByDomain();
      toast.success(language === 'en' ? `Joined ${match.name}` : `Te uniste a ${match.name}`);
      setMatch(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not join' : 'No se pudo unir'));
    } finally {
      setJoining(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY_PREFIX + match.id, '1');
    setDismissed(true);
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white">
        <Building2 className="size-4 text-indigo-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-indigo-900">
          {language === 'en' ? `Your email belongs to ${match.name}` : `Tu correo pertenece a ${match.name}`}
        </p>
        <p className="text-xs text-indigo-600">
          {language === 'en'
            ? 'Join their workspace to share documents and settings with your team.'
            : 'Únete a su espacio de trabajo para compartir documentos y ajustes con tu equipo.'}
        </p>
      </div>
      <button
        type="button"
        disabled={joining}
        onClick={() => void handleJoin()}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {joining && <Loader className="size-3 animate-spin" />}
        {language === 'en' ? 'Join' : 'Unirme'}
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-indigo-400 hover:bg-indigo-100"
        title={language === 'en' ? 'Not now' : 'Ahora no'}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
