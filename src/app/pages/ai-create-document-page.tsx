import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, FileText, Loader, Download, PenLine, RotateCcw, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { parsePastedDocument, type FormattedDocument } from '../utils/parse-pasted-document';
import { loadDocumentBrandingForUser } from '../services/branding-service';
import { AiFormattedDocumentPreview } from '../components/ai-document/AiFormattedDocumentPreview';
import { renderHtmlToPdf } from '../utils/render-html-to-pdf';
import { triggerDownload } from '../utils/download';
import { setPendingSignFile } from '../utils/pending-sign-file';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';
import type { DocumentBranding } from '../types/document';

/**
 * "Crear nuevo" — paste text drafted elsewhere (Word, an email, any AI chat
 * tool) and get back a company-branded document, then either download it
 * or hand it straight into the existing signing flow
 * (electronic-signature-page.tsx already covers every option asked for:
 * self-sign with optional selfie/camera capture, send to someone else
 * without signing, or both). The text→title+sections split is plain string
 * parsing (see utils/parse-pasted-document.ts) — reformatting into a
 * letterhead layout doesn't need an AI call, so this never makes one.
 */
export function AiCreateDocumentPage() {
  const { session, user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { speak } = useVoiceSpeak();
  const previewRef = useRef<HTMLDivElement>(null);

  const [rawText, setRawText] = useState('');
  const [formatted, setFormatted] = useState<FormattedDocument | null>(null);
  const [branding, setBranding] = useState<DocumentBranding>({});
  const [exporting, setExporting] = useState<'download' | 'sign' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    loadDocumentBrandingForUser(user.id).then(setBranding).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!session) return;
    if (formatted) return;
    speak({
      es: 'Pega aquí el texto completo de tu documento, sin recortarlo, y toca crear documento. Lo convertimos en un documento profesional con el membrete de tu empresa, listo para descargar o enviar a firmar.',
      en: 'Paste the complete text of your document here, without cutting it short, and tap create document. We turn it into a professional document with your company letterhead, ready to download or send for signature.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, Boolean(formatted)]);

  useEffect(() => {
    if (!formatted) return;
    speak({
      es: 'Tu documento está listo. Revísalo y usa los botones de arriba para descargarlo o enviarlo a firmar.',
      en: 'Your document is ready. Review it and use the buttons above to download it or send it for signature.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(formatted)]);

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

  const handleGenerate = () => {
    if (!rawText.trim()) return;
    setError('');
    try {
      setFormatted(parsePastedDocument(rawText.trim(), language));
    } catch (e) {
      const message = e instanceof Error ? e.message : (language === 'en' ? 'Could not format the document' : 'No se pudo formatear el documento');
      setError(message);
      toast.error(message);
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
      // /electronic-signature is the public marketing landing page
      // (routes.tsx), not the actual signing tool — that lives at
      // /firma-electronica (ProtectedSignaturePage, which mounts
      // electronic-signature-page.tsx, the component that actually reads
      // the pending file via consumePendingSignFile()).
      navigate('/firma-electronica');
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
        <FileText className="size-6 text-indigo-600" />
        {language === 'en' ? 'Create new' : 'Crear nuevo'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {language === 'en'
          ? 'Paste the complete text from Word, an email, or any AI tool, and we turn it into a real document with your company\'s letterhead, ready to download or send for signature.'
          : 'Pega el texto completo de Word, un correo, o cualquier IA, y lo convertimos en un documento real con el membrete de tu empresa, listo para descargar o enviar a firmar.'}
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
            disabled={!rawText.trim()}
            onClick={handleGenerate}
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="size-4" />
            {language === 'en' ? 'Create document' : 'Crear documento'}
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
