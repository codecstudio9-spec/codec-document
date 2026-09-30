import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, FileText, Loader, Download, PenLine, RotateCcw, Lock, X, UserPlus, Mic, Square, Upload, FolderPlus, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { parsePastedDocument, type FormattedDocument } from '../utils/parse-pasted-document';
import { loadDocumentBrandingForUser } from '../services/branding-service';
import { AiFormattedDocumentPreview, type DocumentSigner } from '../components/ai-document/AiFormattedDocumentPreview';
import { renderHtmlToPdf } from '../utils/render-html-to-pdf';
import { triggerDownload } from '../utils/download';
import { setPendingSignFile } from '../utils/pending-sign-file';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';
import type { DocumentBranding } from '../types/document';
import { useDictation, unirDictado } from '../hooks/use-dictation';
import { textoADocx, contarCampos } from '../utils/text-to-docx-template';
import { detectFields } from '../../lib/docxTemplateEngine';
import { createDocxTemplate, uploadDocxTemplateFile, DEFAULT_SECURITY_CONFIG } from '../services/docx-template-service';

/**
 * "Crea un documento nuevo" — paste text drafted elsewhere (Word, an
 * email, any AI chat tool) and get back a company-branded document, then
 * either download it or hand it straight into the existing signing flow
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
  const [signers, setSigners] = useState<DocumentSigner[]>([]);
  const [formatted, setFormatted] = useState<FormattedDocument | null>(null);
  const [branding, setBranding] = useState<DocumentBranding>({});
  const [exporting, setExporting] = useState<'download' | 'sign' | 'template' | null>(null);
  const [importando, setImportando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dictar el texto en vez de pegarlo: el mismo reconocimiento de voz que usa
  // el resto de la plataforma, que añade lo dicho al final de lo escrito.
  const { escuchando, parcial, alternar: alternarDictado, detener: detenerDictado, soportado: dictadoSoportado } = useDictation({
    language,
    onTexto: (trozo) => setRawText((prev) => unirDictado(prev, trozo)),
    onError: (m) => toast.error(m),
  });
  const [error, setError] = useState('');

  const namedSigners = signers.filter((s) => s.name.trim());

  useEffect(() => {
    if (!user?.id) return;
    loadDocumentBrandingForUser(user.id).then(setBranding).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!session) return;
    if (formatted) return;
    speak({
      es: 'Aquí conviertes cualquier texto en un documento con el membrete de tu empresa. Tienes tres formas de traerlo: pegarlo, dictarlo con el botón «Dictar el texto», o importar un Word. Si lo vas a reutilizar, escribe entre corchetes donde va cada dato, por ejemplo corchete nombre del cliente, o deja una raya larga: al guardarlo como plantilla, cada uno se vuelve un campo que se llena o se dicta, y los títulos en mayúsculas se vuelven secciones. Si quieres, agrega quién firma, con su correo, y generamos su enlace de firma. Cuando estés listo, toca crear documento.',
      en: 'Here you turn any text into a document with your company letterhead. You can bring it in three ways: paste it, dictate it with the "Dictate the text" button, or import a Word file. If you will reuse it, write the detail in brackets where it goes, for example bracket client name, or leave a long line: when you save it as a template, each one becomes a field you can fill in or dictate, and titles in capitals become sections. If you like, add who signs, with their email, and we create their signing link. When you are ready, tap create document.',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, Boolean(formatted)]);

  useEffect(() => {
    if (!formatted) return;
    speak({
      es: 'Tu documento está listo. Revísalo. Arriba puedes descargarlo, enviarlo a firmar, o guardarlo como plantilla para volver a usarlo desde Mis plantillas, con formulario, dictado y enlace público.',
      en: 'Your document is ready. Review it. Above you can download it, send it for signature, or save it as a template to reuse it from My Templates, with a form, dictation and a public link.',
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

  /** Trae el texto de un Word o un .txt, para no tener que copiarlo y pegarlo. */
  const importarArchivo = async (file: File) => {
    setImportando(true);
    try {
      let texto = '';
      if (/\.docx$/i.test(file.name)) {
        const mammoth = await import('mammoth');
        texto = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
      } else if (/\.(txt|md)$/i.test(file.name) || file.type.startsWith('text/')) {
        texto = await file.text();
      } else {
        throw new Error(language === 'en' ? 'Use a Word (.docx) or text (.txt) file.' : 'Usa un archivo de Word (.docx) o de texto (.txt).');
      }
      if (!texto.trim()) throw new Error(language === 'en' ? 'The file has no text.' : 'El archivo no tiene texto.');
      setRawText(texto.trim());
      toast.success(language === 'en' ? 'Text imported. Review it and create the document.' : 'Texto importado. Revísalo y crea el documento.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not read the file' : 'No se pudo leer el archivo'));
    } finally {
      setImportando(false);
    }
  };

  /**
   * Guarda el documento como plantilla en «Mis plantillas»: se arma un Word
   * con los huecos ([Nombre], ____) convertidos en campos, y se abre en el
   * editor de plantillas para revisar los campos, las secciones y las firmas.
   */
  const guardarComoPlantilla = async () => {
    if (!user?.id || !rawText.trim()) return;
    setExporting('template');
    try {
      const buf = textoADocx(rawText);
      const nombre = (formatted?.title || (language === 'en' ? 'New document' : 'Documento nuevo')).slice(0, 120);
      const archivo = new File([buf], `${nombre.replace(/[\\/:*?"<>|]+/g, '-').slice(0, 60)}.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = await uploadDocxTemplateFile(user.id, archivo);
      const creada = await createDocxTemplate({
        userId: user.id,
        name: nombre,
        docxFileUrl: url,
        detectedFields: detectFields(buf),
        signers: [{ role: 'variable', label: language === 'en' ? 'Signer 1' : 'Firmante 1' }],
        securityConfig: DEFAULT_SECURITY_CONFIG,
        instructionsEn: '',
        instructionsEs: '',
      });
      toast.success(language === 'en' ? 'Saved in My Templates' : 'Guardado en Mis plantillas');
      navigate(`/my-templates/${creada.id}/edit-docx`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : (language === 'en' ? 'Could not save the template' : 'No se pudo guardar la plantilla'));
      setExporting(null);
    }
  };

  const camposDetectados = contarCampos(rawText);

  const handleGenerate = () => {
    detenerDictado();
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
      // Signer #1 pre-fills "Tu nombre legal"; signers #2+ (with an
      // email) auto-become real signing links on the signing tool —
      // see utils/pending-sign-file.ts. Signers #2+ named WITHOUT an
      // email can't get a link auto-created (createSigningLink needs
      // somewhere to send it), but their name shouldn't just silently
      // disappear either — queue them as signersNeedingEmail so the
      // signing tool pre-fills their name for the sender, who only has
      // to add the missing email.
      const otherSigners = namedSigners.slice(1);
      const additionalSigners = otherSigners
        .filter((s): s is DocumentSigner & { email: string } => Boolean(s.email?.trim()))
        .map((s) => ({ name: s.name, email: s.email.trim() }));
      const signersNeedingEmail = otherSigners
        .filter((s) => !s.email?.trim())
        .map((s) => ({ name: s.name }));
      setPendingSignFile(file, namedSigners[0]?.name, additionalSigners, signersNeedingEmail);
      if (signersNeedingEmail.length > 0) {
        const names = signersNeedingEmail.map((s) => s.name).join(', ');
        toast.info(language === 'en'
          ? `${names} ${signersNeedingEmail.length > 1 ? "don't" : "doesn't"} have an email, so their signing link wasn't created automatically — add it in the next step to send it.`
          : `${names} no ${signersNeedingEmail.length > 1 ? 'tienen' : 'tiene'} correo, así que su enlace de firma no se generó automáticamente — agrégalo en el siguiente paso para enviárselo.`);
      }
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
        {language === 'en' ? 'Create a new document' : 'Crea un documento nuevo'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {language === 'en'
          ? 'Paste the complete text from Word, an email, or any AI tool, and we turn it into a real document with your company\'s letterhead, ready to download or send for signature.'
          : 'Pega el texto completo de Word, un correo, o cualquier IA, y lo convertimos en un documento real con el membrete de tu empresa, listo para descargar o enviar a firmar.'}
      </p>

      {!formatted ? (
        <div className="mt-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {dictadoSoportado && (
              <button
                type="button"
                onClick={alternarDictado}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  escuchando ? 'bg-red-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {escuchando ? <Square className="size-3.5 fill-current" /> : <Mic className="size-3.5" />}
                {escuchando
                  ? (language === 'en' ? 'Stop dictating' : 'Detener dictado')
                  : (language === 'en' ? 'Dictate the text' : 'Dictar el texto')}
              </button>
            )}
            <button
              type="button"
              disabled={importando}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {importando ? <Loader className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {language === 'en' ? 'Import Word or .txt' : 'Importar Word o .txt'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.txt,.md,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void importarArchivo(f); e.target.value = ''; }}
            />
          </div>
          <textarea
            value={rawText + (parcial ? (rawText ? ' ' : '') + parcial : '')}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={language === 'en'
              ? 'Paste your document text here…'
              : 'Pega aquí el texto de tu documento…'}
            rows={16}
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-800 outline-none focus:border-indigo-400"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          {/* Cómo convertirlo después en plantilla. Los huecos que ya traen
              los textos de Word o de una IA ([Nombre], ____) son justo los
              campos del formulario: basta con dejarlos. */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {language === 'en'
                ? <>Want to reuse it? Write <b>[Client name]</b> or <b>______</b> where each detail goes. When you save it as a template, each one becomes a field you can fill in or dictate, and titles in CAPITALS become form sections.</>
                : <>¿Lo vas a reutilizar? Escribe <b>[Nombre del cliente]</b> o <b>______</b> donde va cada dato. Al guardarlo como plantilla, cada uno se vuelve un campo que se llena o se dicta, y los títulos en MAYÚSCULAS se vuelven secciones del formulario.</>}
              {camposDetectados > 0 && (
                <b className="ml-1">
                  {language === 'en' ? `${camposDetectados} field(s) detected.` : `${camposDetectados} campo(s) detectado(s).`}
                </b>
              )}
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-800">
              {language === 'en' ? 'Who will sign this document?' : 'Quién firma este documento'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {language === 'en'
                ? 'Optional. Add each signer\'s name and ID number to print their signature line. Add an email too and we\'ll automatically create their signing link when you send this to sign. Add no one and we leave a blank signature space instead.'
                : 'Opcional. Agrega el nombre y número de documento de cada firmante para imprimir su línea de firma. Si además agregas su correo, creamos su enlace de firma automáticamente al enviar a firmar. Si no agregas a nadie, dejamos un espacio de firma en blanco.'}
            </p>

            {signers.length > 0 && (
              <div className="mt-3 space-y-2">
                {signers.map((signer, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 p-2">
                    <input
                      value={signer.name}
                      onChange={(e) => setSigners((prev) => prev.map((s, j) => (j === i ? { ...s, name: e.target.value } : s)))}
                      placeholder={language === 'en' ? 'Full name' : 'Nombre completo'}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                    <input
                      value={signer.idNumber}
                      onChange={(e) => setSigners((prev) => prev.map((s, j) => (j === i ? { ...s, idNumber: e.target.value } : s)))}
                      placeholder={language === 'en' ? 'ID number' : 'Número de documento'}
                      className="w-36 shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                    <input
                      value={signer.email ?? ''}
                      onChange={(e) => setSigners((prev) => prev.map((s, j) => (j === i ? { ...s, email: e.target.value } : s)))}
                      placeholder={language === 'en' ? 'Email (optional)' : 'Correo (opcional)'}
                      type="email"
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => setSigners((prev) => prev.filter((_, j) => j !== i))}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-600"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setSigners((prev) => [...prev, { name: '', idNumber: '', email: '' }])}
              className="mt-3 flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <UserPlus className="size-3.5" />
              {language === 'en' ? 'Add signer' : 'Agregar firmante'}
            </button>
          </div>

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
              onClick={() => void guardarComoPlantilla()}
              title={language === 'en' ? 'Reuse it from My Templates, with a form, dictation and a public link' : 'Reutilízalo desde Mis plantillas, con formulario, dictado y enlace público'}
              className="flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              {exporting === 'template' ? <Loader className="size-3.5 animate-spin" /> : <FolderPlus className="size-3.5" />}
              {language === 'en' ? 'Save as template' : 'Guardar como plantilla'}
              {camposDetectados > 0 && <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] text-white">{camposDetectados}</span>}
            </button>
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
            <AiFormattedDocumentPreview ref={previewRef} document={formatted} branding={branding} language={language} signers={namedSigners} />
          </div>
        </div>
      )}
    </div>
  );
}
