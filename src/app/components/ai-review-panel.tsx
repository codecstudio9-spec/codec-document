import { useState } from 'react';
import { Link } from 'react-router';
import { Sparkles, Loader, ShieldAlert, ListChecks, Lock, Lightbulb } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { useAuth } from '../contexts/auth-context';
import { reviewDocumentWithAi, AiReviewUpgradeRequiredError, type AiReviewResult, type AiRiskItem } from '../services/ai-review-service';

interface AiReviewPanelProps {
  /** Plain-text document content to send for review — caller resolves
   * whatever template/docx merging it already does for preview/PDF. */
  content: string;
  className?: string;
}

const SEVERITY_STYLE: Record<AiRiskItem['severity'], { border: string; bg: string; text: string; labelEn: string; labelEs: string }> = {
  high:   { border: 'border-red-300',    bg: 'bg-red-50',    text: 'text-red-700',    labelEn: 'High risk',   labelEs: 'Riesgo alto' },
  medium: { border: 'border-amber-300',  bg: 'bg-amber-50',  text: 'text-amber-700',  labelEn: 'Medium risk', labelEs: 'Riesgo medio' },
  low:    { border: 'border-slate-300',  bg: 'bg-slate-50',  text: 'text-slate-600',  labelEn: 'Low risk',    labelEs: 'Riesgo bajo' },
};

/**
 * Drop-in "Analizar con IA" button + results, reused across the document
 * editor, both preview pages, and the dashboard AI page — one place to get
 * the gating/loading/error states right instead of four near-duplicates.
 * Client-side gating (isAdmin/subscriptionActive) is only a UX nicety; the
 * ai-document-review Edge Function re-checks the same thing server-side.
 */
export function AiReviewPanel({ content, className }: AiReviewPanelProps) {
  const { language } = useLanguage();
  const { isAdmin, subscriptionActive } = useAuth();
  const canUseAi = isAdmin || subscriptionActive;

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiReviewResult | null>(null);
  const [error, setError] = useState('');

  const runReview = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      setResult(await reviewDocumentWithAi(content, language));
    } catch (err) {
      setError(
        err instanceof AiReviewUpgradeRequiredError
          ? err.message
          : err instanceof Error ? err.message : (language === 'en' ? 'Something went wrong.' : 'Algo salió mal.'),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!canUseAi) {
    return (
      <div className={`rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 ${className ?? ''}`}>
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
            <Lock className="size-4 text-indigo-600" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {language === 'en' ? 'AI Document Review' : 'Revisión de Documento con IA'}
            </p>
            <p className="text-xs text-slate-500">
              {language === 'en' ? 'Available on paid plans — flag risks and missing clauses.' : 'Disponible en planes pagos — detecta riesgos y cláusulas faltantes.'}
            </p>
          </div>
        </div>
        <Link
          to="/pricing"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
        >
          <Sparkles className="size-3.5" />
          {language === 'en' ? 'See plans' : 'Ver planes'}
        </Link>
      </div>
    );
  }

  const risks = result?.risks ?? [];
  const missingClauses = result?.missingClauses ?? [];

  return (
    <div className={className}>
      {!result && (
        <button
          type="button"
          onClick={() => void runReview()}
          disabled={loading || !content.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)] disabled:opacity-50"
        >
          {loading ? <Loader className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading
            ? (language === 'en' ? 'Analyzing…' : 'Analizando…')
            : (language === 'en' ? 'Analyze with AI' : 'Analizar con IA')}
        </button>
      )}

      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}

      {result && (
        <div className="mt-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600">
              <Sparkles className="size-3.5" />
              {language === 'en' ? 'AI Review' : 'Revisión con IA'}
            </div>
            <button
              type="button"
              onClick={() => { setResult(null); void runReview(); }}
              className="text-xs font-semibold text-slate-400 transition hover:text-slate-600"
            >
              {language === 'en' ? 'Re-analyze' : 'Analizar de nuevo'}
            </button>
          </div>

          <p className="text-sm text-slate-700">{result.summary}</p>

          {risks.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <ShieldAlert className="size-3.5" />
                {language === 'en' ? 'Risks found' : 'Riesgos encontrados'}
              </p>
              <ul className="space-y-2">
                {risks.map((r, i) => {
                  const sev = SEVERITY_STYLE[r.severity] ?? SEVERITY_STYLE.medium;
                  return (
                    <li key={i} className={`rounded-lg border ${sev.border} ${sev.bg} p-2.5 text-xs`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800">{r.title}</p>
                        <span className={`shrink-0 rounded-full border ${sev.border} px-2 py-0.5 text-[10px] font-bold ${sev.text}`}>
                          {language === 'en' ? sev.labelEn : sev.labelEs}
                        </span>
                      </div>
                      <p className="mt-0.5 text-slate-600">{r.detail}</p>
                      {r.suggestion && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-white/70 p-1.5">
                          <Lightbulb className="mt-0.5 size-3 shrink-0 text-indigo-500" />
                          <p className="text-slate-600">{r.suggestion}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {missingClauses.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-rose-700">
                <ListChecks className="size-3.5" />
                {language === 'en' ? 'Possibly missing' : 'Posiblemente faltante'}
              </p>
              <ul className="space-y-2">
                {missingClauses.map((c, i) => (
                  <li key={i} className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs">
                    <p className="font-bold text-rose-800">{c.title}</p>
                    <p className="mt-0.5 text-rose-700/80">{c.detail}</p>
                    {c.suggestion && (
                      <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-white/70 p-1.5">
                        <Lightbulb className="mt-0.5 size-3 shrink-0 text-indigo-500" />
                        <p className="text-rose-700/80">{c.suggestion}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {risks.length === 0 && missingClauses.length === 0 && (
            <p className="mt-3 text-xs font-semibold text-emerald-600">
              {language === 'en' ? 'No obvious risks or missing clauses detected.' : 'No se detectaron riesgos ni cláusulas faltantes evidentes.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
