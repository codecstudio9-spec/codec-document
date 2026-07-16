import { Sparkles, FileSearch, ListChecks, ShieldAlert, PenTool } from 'lucide-react';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useLanguage } from '../../contexts/language-context';
import { CARD_RADIUS, CARD_SHADOW, DARK_GRADIENT } from '../../styles/mobile-theme';

const CAPABILITIES_ES = [
  { icon: FileSearch, title: 'Explicar contratos', desc: 'Traduce cláusulas legales a lenguaje simple.' },
  { icon: ListChecks, title: 'Resumir documentos', desc: 'Puntos clave de un documento largo en segundos.' },
  { icon: ShieldAlert, title: 'Detectar riesgos', desc: 'Señala cláusulas inusuales o potencialmente riesgosas.' },
  { icon: PenTool, title: 'Generar cláusulas', desc: 'Redacta cláusulas a medida para tus documentos.' },
];
const CAPABILITIES_EN = [
  { icon: FileSearch, title: 'Explain contracts', desc: 'Translates legal clauses into plain language.' },
  { icon: ListChecks, title: 'Summarize documents', desc: 'Key points from a long document in seconds.' },
  { icon: ShieldAlert, title: 'Flag risks', desc: 'Highlights unusual or potentially risky clauses.' },
  { icon: PenTool, title: 'Generate clauses', desc: 'Drafts custom clauses for your documents.' },
];

/** Honest placeholder — no fake chat, no simulated responses. This
 * capability genuinely doesn't exist yet; the page says so plainly
 * instead of pretending to be a working assistant. */
export function DesktopAI() {
  const { language } = useLanguage();
  const capabilities = language === 'en' ? CAPABILITIES_EN : CAPABILITIES_ES;

  return (
    <DesktopAppShell>
      <div className="mx-auto max-w-4xl">
        <div className="p-8 text-center text-white" style={{ borderRadius: CARD_RADIUS, background: DARK_GRADIENT, boxShadow: '0 20px 40px rgba(15,23,42,0.22)' }}>
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="size-6 text-indigo-300" />
          </div>
          <h1 className="text-2xl font-black">AI Legal Assistant</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/50">
            {language === 'en'
              ? "Coming soon. We're building an assistant to help you understand and prepare your legal documents."
              : 'Próximamente. Estamos construyendo un asistente que te ayude a entender y preparar tus documentos legales.'}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {capabilities.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 bg-white p-5" style={{ borderRadius: CARD_RADIUS, boxShadow: CARD_SHADOW }}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Icon className="size-4.5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DesktopAppShell>
  );
}
