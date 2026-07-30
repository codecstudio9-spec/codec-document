import { useEffect, useState } from 'react';
import { Sparkles, ShieldAlert, FileText, Loader, ClipboardPaste } from 'lucide-react';
import { DesktopAppShell } from '../../components/desktop/DesktopAppShell';
import { useLanguage } from '../../contexts/language-context';
import { useAuth } from '../../contexts/auth-context';
import { CARD_RADIUS, DARK_GRADIENT } from '../../styles/mobile-theme';
import { AiReviewPanel } from '../../components/ai-review-panel';
import { listMySentTransactions, type SignTransaction } from '../../services/sign-transaction-service';
import { buildGuestDocumentContent } from '../../utils/guest-document-content';
import { getDocumentTranslation } from '../../data/document-translations';

function humanizeDocType(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function labelForTx(tx: SignTransaction, language: 'en' | 'es'): string {
  const date = new Date(tx.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', { day: '2-digit', month: 'short' });
  if (tx.document_type === 'custom-template') {
    return `${language === 'en' ? 'Custom template' : 'Plantilla personalizada'} — ${date}`;
  }
  const name = getDocumentTranslation(tx.document_type, 'name', language) || humanizeDocType(tx.document_type);
  return `${name} — ${date}`;
}

/**
 * Real AI document review — either paste text directly, or pick one of
 * your own sent/created documents (resolved via the same
 * buildGuestDocumentContent() helper the guest-signer download flow uses)
 * and get a risk / missing-clause analysis via the ai-document-review Edge
 * Function (Groq). Replaces the earlier "Coming soon" placeholder now that
 * this capability genuinely exists, gated to paid plans / admin (see
 * AiReviewPanel).
 */
export function DesktopAI() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [mode, setMode] = useState<'paste' | 'pick'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [myTransactions, setMyTransactions] = useState<SignTransaction[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [resolvingTx, setResolvingTx] = useState(false);
  const [pickError, setPickError] = useState('');

  useEffect(() => {
    if (mode !== 'pick' || !user?.id || myTransactions.length > 0) return;
    setLoadingList(true);
    listMySentTransactions(user.id)
      .then(setMyTransactions)
      .finally(() => setLoadingList(false));
  }, [mode, user?.id, myTransactions.length]);

  const handlePickTx = async (txId: string) => {
    const tx = myTransactions.find((t) => t.id === txId);
    if (!tx) return;
    setResolvingTx(true);
    setPickError('');
    try {
      const { content } = await buildGuestDocumentContent(tx, language);
      setPastedText(content);
    } catch {
      setPickError(language === 'en' ? 'Could not load that document.' : 'No se pudo cargar ese documento.');
    } finally {
      setResolvingTx(false);
    }
  };

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
              ? 'Paste a document, or pick one of your own, to flag legal risks and clauses that may be missing.'
              : 'Pega un documento, o elige uno de los tuyos, para detectar riesgos legales y cláusulas que podrían faltar.'}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          {/* Mode toggle */}
          <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setMode('paste')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${mode === 'paste' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <ClipboardPaste className="size-3.5" />
              {language === 'en' ? 'Paste text' : 'Pegar texto'}
            </button>
            <button
              type="button"
              onClick={() => setMode('pick')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${mode === 'pick' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <FileText className="size-3.5" />
              {language === 'en' ? 'Pick a document' : 'Elegir un documento'}
            </button>
          </div>

          {mode === 'pick' && (
            <div className="mb-4">
              {loadingList ? (
                <p className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader className="size-3.5 animate-spin" />
                  {language === 'en' ? 'Loading your documents…' : 'Cargando tus documentos…'}
                </p>
              ) : myTransactions.length === 0 ? (
                <p className="text-xs text-slate-400">
                  {language === 'en' ? "You haven't sent any documents to sign yet." : 'Aún no has enviado documentos a firmar.'}
                </p>
              ) : (
                <select
                  onChange={(e) => e.target.value && void handlePickTx(e.target.value)}
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="" disabled>{language === 'en' ? 'Choose a document…' : 'Elige un documento…'}</option>
                  {myTransactions.map((tx) => (
                    <option key={tx.id} value={tx.id}>{labelForTx(tx, language)}</option>
                  ))}
                </select>
              )}
              {resolvingTx && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Loader className="size-3.5 animate-spin" />
                  {language === 'en' ? 'Loading document text…' : 'Cargando texto del documento…'}
                </p>
              )}
              {pickError && <p className="mt-2 text-xs font-semibold text-red-600">{pickError}</p>}
            </div>
          )}

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
