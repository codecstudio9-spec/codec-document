import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Sparkles, Loader, Download, PenLine, RotateCcw, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import {
  formatPastedDocumentWithAi, AiReviewUpgradeRequiredError, type AiFormattedDocument,
} from '../services/ai-review-service';
import { loadDocumentBrandingForUser } from '../services/branding-service';
import { AiFormattedDocumentPreview } from '../components/ai-document/AiFormattedDocumentPreview';
import { renderHtmlToPdf } from '../utils/render-html-to-pdf';
import { triggerDownload } from '../utils/download';
import { setPendingSignFile } from '../utils/pending-sign-file';
import type { DocumentBranding } from '../types/document';

/**
 * "Crear nuevo" — paste text drafted elsewhere (any AI chat tool) and get
 * back a professionally structured, company-branded document, then either
 * download it or hand it straight into the existing signing flow
 * (electronic-signature-page.tsx already covers every option asked for:
 * self-sign with optional selfie/camera capture, send to someone else
 * without signing, or both).
 */
export function AiCreateDocumentPage() {
  const { session, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);

  const [rawText, setRawText] = useState('');
  const [formatting, setFormatting] = useState(false);
  const [formatted, setFormatted] = useState<AiFormattedDocument | null>(null);
  const [branding, setBranding] = useState<DocumentBranding>({});
  const [exporting, setExporting] = useState<'download' | 'sign' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadDocumentBrandingForUser(user.id).then(setBranding).catch(() => {});
  }, [user?.id]);

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <Lock className="size-10 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">
          {language === 'en' ? 'Sign in to create a document' : 'Inicia sesión para crear un documento'}
        </p>
        <button type="button" onClick={() => navigate('/')} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {language === 'en' ? 'Back to home' : 'Volver al inicio'}
        </button>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!rawText.trim()) return;
    setFormatting(true);
    setError('');
    try {
      const result = await formatPastedDocumentWithAi(rawText.trim(), language);
      setFormatted(result);
    } catch (e) {
      const message = e instanceof AiReviewUpgradeRequiredError
        ? e.message
        : e instanceof Error ? e.message : (language === 'en' ? 'Could not format the document' : 'No se pudo formatear el documento');
      setError(message);
      toast.error(message);
    } finally {
      setFormatting(false);
    }
  };

  const buildPdfBlob = async (): Promise<Blob | null> => {
    if (!previewRef.current) return null;
    return renderHtmlToPdf(previewRef.current, formatted?.title || 'documento');
  };

  const handleDownload = async () => {
    setExporting('download');
    try {
      const blob = await buildPdfBlob();
      if (!blob) throw new Error(language === 'en' ? 'Could not generate the PDF' : 'No se pudo generar el PDF');
      const fileName = `${(formatted?.title || 'documento').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)}.pdf`;
      // triggerDownload (not a hand-rolled <a download> click) — iOS
      // Safari doesn't reliably honor `download` on a blob: URL, especially
      // right after an async PDF-generation step like this one; this
      // utility already routes through the native share sheet on iOS
      // instead. See utils/download.ts.
      await triggerDownload(blob, fileName);
      toast.success(language === 'en' ? 'Document downloaded' : 'Documento descargado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not download the document' : 'No se pudo descargar el documento'));
    } finally {
      setExporting(null);
    }
  };

  const handleSendToSign = async () => {
    setExporting('sign');
    try {
      const blob = await buildPdfBlob();
      if (!blob) throw new Error(language === 'en' ? 'Could not generate the PDF' : 'No se pudo generar el PDF');
      const fileName = `${(formatted?.title || 'documento').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });
      setPendingSignFile(file);
      navigate('/electronic-signature');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not prepare the document for signing' : 'No se pudo preparar el documento para firmar'));
      setExporting(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="size-4" /> {language === 'en' ? 'Back' : 'Volver'}
      </button>

      <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900">
        <Sparkles className="size-6 text-indigo-600" />
        {language === 'en' ? 'Create new' : 'Crear nuevo'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {language === 'en'
          ? 'Paste text you drafted with any AI tool — we\'ll format it into a professional document with your company branding.'
          : 'Pega el texto que redactaste con cualquier IA — lo formateamos como un documento profesional con la marca de tu empresa.'}
      </p>

      {!formatted ? (
        <div className="mt-6">
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={language === 'en'
              ? 'Paste your document text here…'
              : 'Pega aquí el texto de tu documento…'}
            rows={16}
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-800 outline-none focus:border-indigo-400"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            disabled={!rawText.trim() || formatting}
            onClick={() => void handleGenerate()}
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {formatting ? <Loader className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {formatting
              ? (language === 'en' ? 'Formatting…' : 'Formateando…')
              : (language === 'en' ? 'Generate professional document' : 'Generar documento profesional')}
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFormatted(null)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" /> {language === 'en' ? 'Edit text' : 'Editar texto'}
            </button>
            <div className="flex-1" />
            <button
              type="button"
              disabled={exporting !== null}
              onClick={() => void handleDownload()}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {exporting === 'download' ? <Loader className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
              {language === 'en' ? 'Download' : 'Descargar'}
            </button>
            <button
              type="button"
              disabled={exporting !== null}
              onClick={() => void handleSendToSign()}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {exporting === 'sign' ? <Loader className="size-3.5 animate-spin" /> : <PenLine className="size-3.5" />}
              {language === 'en' ? 'Send to sign' : 'Enviar a firma'}
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-6">
            <AiFormattedDocumentPreview ref={previewRef} document={formatted} branding={branding} language={language} />
          </div>
        </div>
      )}
    </div>
  );
}
