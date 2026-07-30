/**
 * Download page for a COMPLETED custom Word-template signature —
 * registered at the literal path /preview/custom-template (react-router's
 * ranking gives a static path priority over the generic /preview/:documentType
 * route in preview-page.tsx, so this intercepts without touching that
 * file at all).
 *
 * Deliberately a separate, small page rather than another branch inside
 * preview-page.tsx: that file's rendering assumes a template.id looked up
 * in templates.ts/templates-es.ts (built-in document types) throughout —
 * a docx-templated document doesn't fit that shape, and retrofitting it
 * in place would risk the many other document types that already depend
 * on that file working exactly as they do today.
 *
 * Reuses exactly the same sessionStorage contract stashSignedTransactionForDownload
 * (sign-transaction-service.ts) already writes for every other document
 * type, and the same PDFGenerator entry point — so this document gets
 * identical signature-block/identity-verification/biometric-badge
 * rendering as any other signed document on the platform. The only new
 * piece is computing `content`: merge the docx with the filled-in values
 * (docxTemplateEngine.renderDocxTemplate) and extract its text
 * (extractTextFromDocx) instead of interpolating templates.ts.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileType2, Loader, Download, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { getDocxTemplateForOwner } from '../services/docx-template-service';
import { fetchDocxArrayBuffer, renderDocxTemplate } from '../../lib/docxTemplateEngine';
import { renderDocxToPageImages } from '../utils/render-docx-pages';
import { PDFGenerator } from '../services/pdf-generator';
import { saveDocumentRecord } from '../services/documents-service';
import { triggerDownload } from '../utils/download';
import { detectSignerCountryCode } from '../../lib/geo';
import { resolveJurisdiction } from '../data/signature-jurisdictions';

interface StashedSig { id: string; name: string; sigDataUrl: string }

export function CustomTemplatePreviewPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'generating' | 'done' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const savedData = sessionStorage.getItem('documentData');
    if (!savedData) { setStatus('error'); setError(language === 'en' ? 'No document data found.' : 'No se encontraron datos del documento.'); return; }
    let parsed: { templateId?: string; values?: Record<string, string> };
    try { parsed = JSON.parse(savedData); } catch { setStatus('error'); setError(language === 'en' ? 'Corrupted document data.' : 'Datos del documento corruptos.'); return; }
    if (!parsed.templateId) { setStatus('error'); setError(language === 'en' ? 'This document has no linked template.' : 'Este documento no tiene una plantilla vinculada.'); return; }

    getDocxTemplateForOwner(parsed.templateId).then((t) => {
      if (!t) { setStatus('error'); setError(language === 'en' ? 'Template not found.' : 'Plantilla no encontrada.'); return; }
      setTemplateName(t.name);
      setStatus('ready');
    }).catch(() => { setStatus('error'); setError(language === 'en' ? 'Could not load the template.' : 'No se pudo cargar la plantilla.'); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (!user?.id) return;
    setStatus('generating');
    try {
      const savedData = JSON.parse(sessionStorage.getItem('documentData') || '{}') as { templateId: string; values: Record<string, string> };
      const template = await getDocxTemplateForOwner(savedData.templateId);
      if (!template) throw new Error(language === 'en' ? 'Template not found.' : 'Plantilla no encontrada.');

      const docxBytes = await fetchDocxArrayBuffer(template.docxFileUrl);
      const mergedBytes = renderDocxTemplate(docxBytes, savedData.values ?? {});
      const richContentPages = await renderDocxToPageImages(mergedBytes);

      const ownerSigUrl = sessionStorage.getItem('userSignatureDataUrl') || undefined;
      const coSignersJson = sessionStorage.getItem('coSigners');
      const coSigners: StashedSig[] = coSignersJson ? JSON.parse(coSignersJson) : [];
      const recipientSig = coSigners.find((s) => s.id === 'recipient');

      const identitySelfie = sessionStorage.getItem('identitySelfie') || undefined;
      const identityIdDocFront = sessionStorage.getItem('identityIdDocFront') || undefined;
      const identityIdDocBack = sessionStorage.getItem('identityIdDocBack') || undefined;
      const identityBiometricRaw = sessionStorage.getItem('identityBiometric');
      const identityBiometric = identityBiometricRaw ? JSON.parse(identityBiometricRaw) : undefined;

      const jurisdiction = resolveJurisdiction((await detectSignerCountryCode()) || null);
      const fileName = `${template.name.replace(/[^a-z0-9]+/gi, '-')}.pdf`;

      const blob = await PDFGenerator.generateBlob({
        content: '',
        richContentPages,
        title: template.name,
        fileName,
        language,
        showWatermark: false,
        jurisdiction,
        leftSig: ownerSigUrl ? { dataUrl: ownerSigUrl, name: language === 'en' ? 'Sender' : 'Remitente' } : undefined,
        rightSig: recipientSig ? { dataUrl: recipientSig.sigDataUrl, name: recipientSig.name } : undefined,
        mirrorLanguage: language,
        identitySelfie,
        identityIdDocFront,
        identityIdDocBack,
        identityBiometric,
      });

      await triggerDownload(blob, fileName);
      setStatus('done');
      toast.success(language === 'en' ? 'Document downloaded!' : '¡Documento descargado!');

      saveDocumentRecord(user.id, savedData.templateId, template.name).catch((err) => {
        console.error('saveDocumentRecord failed:', err);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus('error');
      toast.error(language === 'en' ? 'Could not generate the document.' : 'No se pudo generar el documento.');
    }
  };

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader className="size-8 animate-spin text-indigo-600" /></div>;
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <div className="rounded-full bg-red-100 p-4"><AlertCircle className="size-10 text-red-500" /></div>
        <p className="max-w-sm text-sm font-semibold text-red-700">{error}</p>
        <button type="button" onClick={() => navigate('/my-documents')} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">
          {language === 'en' ? 'Go to My Documents' : 'Ir a Mis Documentos'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 p-6 text-center">
      <div className="rounded-full bg-indigo-100 p-5"><FileType2 className="size-10 text-indigo-600" /></div>
      <h1 className="text-xl font-black text-slate-900">{templateName}</h1>
      <p className="max-w-sm text-sm text-slate-500">
        {language === 'en' ? 'Your signed document is ready to generate and download.' : 'Tu documento firmado está listo para generar y descargar.'}
      </p>
      <button
        type="button"
        disabled={status === 'generating'}
        onClick={() => void handleGenerate()}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-60"
      >
        {status === 'generating'
          ? <><Loader className="size-4 animate-spin" /> {language === 'en' ? 'Generating...' : 'Generando...'}</>
          : <><Download className="size-4" /> {status === 'done' ? (language === 'en' ? 'Download again' : 'Descargar de nuevo') : (language === 'en' ? 'Generate & download PDF' : 'Generar y descargar PDF')}</>
        }
      </button>
      {status === 'done' && (
        <button type="button" onClick={() => navigate('/my-documents')} className="text-sm font-semibold text-slate-500 hover:text-slate-700">
          {language === 'en' ? 'Go to My Documents' : 'Ir a Mis Documentos'}
        </button>
      )}
    </div>
  );
}
