import { useState } from 'react';
import { Sparkles, ShieldAlert } from 'lucide-react';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useLanguage } from '../../contexts/language-context';
import { CARD_RADIUS, DARK_GRADIENT } from '../../styles/mobile-theme';
import { AiReviewPanel } from '../../components/ai-review-panel';

/**
 * Real AI document review — paste any document text and get a risk /
 * missing-clause analysis via the ai-document-review Edge Function (Groq).
 * Replaces the earlier "Coming soon" placeholder now that this capability
 * genuinely exists, gated to paid plans / admin (see AiReviewPanel).
 */
export function DesktopAI() {
  const { language } = useLanguage();
  const [pastedText, setPastedText] = useState('');

  return (
    <DesktopAppShell>
      <div className="mx-auto max-w-3xl">
        <div className="p-8 text-white" style={{ borderRadius: CARD_RADIUS, background: DARK_GRADIENT, boxShadow: '0 20px 40px rgba(15,23,42,0.22)' }}>
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles className="size-6 text-indigo-300" />
          </div>
          <h1 className="text-2xl font-black">{language === 'en' ? 'AI Document Review' : 'Revisión de Documento con IA'}</h1>
          <p className="mt-2 max-w-md text-sm text-white/50">
            {language === 'en'
              ? 'Paste the text of a document to flag legal risks and clauses that may be missing.'
              : 'Pega el texto de un documento para detectar riesgos legales y cláusulas que podrían faltar.'}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <ShieldAlert className="size-3.5" />
            {language === 'en' ? 'Document text' : 'Texto del documento'}
          </label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={10}
            placeholder={language === 'en' ? 'Paste your document text here…' : 'Pega aquí el texto de tu documento…'}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
          />
          <div className="mt-4">
            <AiReviewPanel content={pastedText} />
          </div>
        </div>
      </div>
    </DesktopAppShell>
  );
}
