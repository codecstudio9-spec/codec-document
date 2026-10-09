import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileType2, X, Loader, Eye, EyeOff, Copy, Check, ExternalLink, Shield, Pencil, RotateCcw, Mail, Send, Download, MessageCircle, Smartphone, Plus, AlertTriangle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DocxTemplate } from '../../services/docx-template-service';
import { createCustomTemplateTransaction } from '../../services/docx-template-service';
import type { SecurityConfig } from '../../services/sign-transaction-service';
import { SecurityConfigModal } from '../SecurityConfigModal';
import { SITE_URL } from '../../config/site';
import { DynamicDocForm } from './DynamicDocForm';
import { VistaPreviaDocumento } from './VistaPreviaDocumento';
import { useAuth } from '../../contexts/auth-context';
import { saveDocumentRecord } from '../../services/documents-service';
import { sendSigningInvitation } from '../../services/signing-email-service';
import { downloadFilledTemplatePdf } from '../../services/template-download';
import { InPersonSignModal } from '../signatures/InPersonSignModal';
import { nombrePersonaDeValores, tituloDeDocumento } from '../../utils/nombre-del-documento';

interface GenerateSendModalProps {
  template: DocxTemplate | null;
  language: 'en' | 'es';
  onClose: () => void;
}

/**
 * ZapSign-style "llenar antes de enviar" — the template OWNER (or a
 * teammate their company shared the template with) fills in the fields
 * themselves right here, then a ONE-TIME /sign/:id link is generated for
 * a specific recipient to just review and sign — unlike the permanent
 * /t/:slug link, which anyone can open to fill AND sign for themselves.
 * Reuses create_custom_template_transaction (the exact same RPC the
 * public fill page uses) with intent: 'fill_send' and an optional
 * security override that applies to only this one document, never
 * touching the template's own stored default.
 *
 * Dropbox Sign-style flow (2026-10-08): one screen — who signs (optional
 * email), the template's fields, then ONE primary action: "Enviar a firmar"
 * (creates the document, saves it to Mis documentos and emails the signer
 * via Resend in a single click) or "Descargar PDF". What's typed is kept as
 * a per-template draft in localStorage, so closing the modal by accident
 * doesn't lose it.
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const draftKey = (templateId: string) => `codec:template-draft:${templateId}`;

function readDraft(templateId: string): { values: Record<string, string>; email: string } | null {
  try {
    const raw = localStorage.getItem(draftKey(templateId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function writeDraft(templateId: string, values: Record<string, string>, email: string) {
  try {
    if (Object.values(values).some((v) => v?.trim()) || email.trim()) {
      localStorage.setItem(draftKey(templateId), JSON.stringify({ values, email }));
    } else {
      localStorage.removeItem(draftKey(templateId));
    }
  } catch { /* storage unavailable — the draft is a convenience only */ }
}
function clearDraft(templateId: string) {
  try { localStorage.removeItem(draftKey(templateId)); } catch { /* ignore */ }
}
export function GenerateSendModal({ template, language, onClose }: GenerateSendModalProps) {
  // Quién está llenando esto es el dueño de la plantilla, con sesión: aquí el
  // dictado con IA sí funciona, y lo único que cambia según el plan es cómo se
  // lo cuenta la guía por voz.
  const { user, unlimitedActive, subscriptionActive, isAdmin } = useAuth();
  const tienePremium = Boolean(unlimitedActive || subscriptionActive || isAdmin);
  const [values, setValues] = useState<Record<string, string>>({});
  const [securityOverride, setSecurityOverride] = useState<SecurityConfig | null>(null);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resultLink, setResultLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailResult, setEmailResult] = useState<{ ok: true; to: string } | { ok: false; error: string } | null>(null);
  const [inPersonOpen, setInPersonOpen] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  // «Ver documento mientras lleno»: opcional, apagado por defecto. Se
  // recuerda en este navegador para quien lo prefiere siempre abierto.
  const [verDocumento, setVerDocumento] = useState<boolean>(() => {
    try { return localStorage.getItem('codec_ver_documento') === '1'; } catch { return false; }
  });
  const [campoActivo, setCampoActivo] = useState<string | null>(null);
  const [pestanaMovil, setPestanaMovil] = useState<'datos' | 'documento'>('datos');
  const alternarVerDocumento = () => {
    setVerDocumento((v) => {
      try { localStorage.setItem('codec_ver_documento', v ? '0' : '1'); } catch { /* sin almacenamiento */ }
      return !v;
    });
    setPestanaMovil('documento');
  };

  // Restore the draft when a template opens; persist it while typing.
  useEffect(() => {
    if (!template) return;
    const draft = readDraft(template.id);
    if (draft) {
      setValues(draft.values ?? {});
      setRecipientEmail(draft.email ?? '');
      setDraftRestored(Object.keys(draft.values ?? {}).length > 0);
    }
  }, [template?.id]);
  useEffect(() => {
    if (template && !resultLink) writeDraft(template.id, values, recipientEmail);
  }, [template?.id, values, recipientEmail, resultLink]);

  const open = Boolean(template);
  const effectiveSecurity = securityOverride ?? template?.securityConfig;
  const activeCount = effectiveSecurity ? Object.values(effectiveSecurity).filter(Boolean).length : 0;

  const resetForm = () => {
    setValues({}); setSecurityOverride(null); setResultLink(null); setCopied(false);
    setRecipientEmail(''); setSendingEmail(false); setShowValidation(false);
    setEmailResult(null); setDraftRestored(false);
  };
  const handleClose = () => {
    resetForm();
    onClose();
  };
  const handleDiscardDraft = () => {
    if (template) clearDraft(template.id);
    setValues({}); setRecipientEmail(''); setDraftRestored(false); setShowValidation(false);
  };

  const emailValid = EMAIL_RE.test(recipientEmail.trim());

  const missingRequired = (template?.detectedFields ?? []).filter((f) => f.required && !values[f.key]?.trim());
  const invalidKeys = showValidation ? new Set(missingRequired.map((f) => f.key)) : undefined;

  const handleGenerate = async () => {
    if (!template) return;
    if (missingRequired.length > 0) {
      setShowValidation(true);
      toast.error(language === 'en' ? 'Fill in all required fields first.' : 'Completa todos los campos obligatorios primero.');
      return;
    }
    setGenerating(true);
    try {
      const txId = await createCustomTemplateTransaction(template.publicSlug, values, {
        securityOverride: securityOverride ?? undefined,
        intent: 'fill_send',
      });
      setResultLink(`${SITE_URL}/sign/${txId}`);
      clearDraft(template.id);

      // Queda en «Mis documentos» y en los recientes del inicio, con el nombre
      // de la persona de la que es.
      //
      // Antes no quedaba en ningún sitio: enviar a firmar desde una plantilla
      // de Word era el único camino del producto que no dejaba rastro en la
      // lista de documentos, así que un colegio con cincuenta matrículas
      // enviadas veía esa lista vacía.
      if (user?.id) {
        const titulo = tituloDeDocumento(
          template.name,
          nombrePersonaDeValores(values, template.detectedFields),
          language,
        );
        saveDocumentRecord(user.id, template.id, titulo).catch((err) => {
          console.error('saveDocumentRecord (plantilla Word):', err);
        });
      }

      // Un solo clic: si ya escribió el correo, la invitación sale ya. Si el
      // correo falla, el documento igual queda creado y el enlace a la vista.
      if (emailValid) {
        const to = recipientEmail.trim();
        try {
          await sendSigningInvitation(txId, to);
          setEmailResult({ ok: true, to });
        } catch (err) {
          setEmailResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not generate the link.' : 'No se pudo generar el enlace.'));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!resultLink) return;
    navigator.clipboard.writeText(resultLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const handleSendInvitation = async () => {
    if (!resultLink || !emailValid) return;
    setSendingEmail(true);
    const to = recipientEmail.trim();
    try {
      const transactionId = resultLink.split('/').pop();
      if (!transactionId) throw new Error('No se pudo identificar el documento para enviar');
      await sendSigningInvitation(transactionId, to);
      setEmailResult({ ok: true, to });
      toast.success(language === 'en' ? 'Signing invitation sent.' : 'Invitación de firma enviada.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : (language === 'en' ? 'Could not send the invitation.' : 'No se pudo enviar la invitación.');
      setEmailResult({ ok: false, error: msg });
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDownload = async () => {
    if (!template) return;
    if (missingRequired.length > 0) {
      setShowValidation(true);
      toast.error(language === 'en' ? 'Fill in all required fields first.' : 'Completa todos los campos obligatorios primero.');
      return;
    }
    setDownloading(true);
    try {
      await downloadFilledTemplatePdf(template, values, language, user?.id);
      toast.success(language === 'en' ? 'PDF downloaded and saved to My documents.' : 'PDF descargado y guardado en Mis documentos.');
    } catch (err) {
      console.error('downloadFilledTemplatePdf:', err);
      toast.error(language === 'en' ? 'Could not generate the PDF.' : 'No se pudo generar el PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const waHref = resultLink
    ? `https://wa.me/?text=${encodeURIComponent(
        language === 'en'
          ? `Please review and sign "${template?.name ?? ''}": ${resultLink}`
          : `Te envío "${template?.name ?? ''}" para que lo revises y firmes: ${resultLink}`,
      )}`
    : '';

  const dividido = verDocumento && !resultLink;

  return (
    <AnimatePresence>
      {open && template && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(10px)' }}
          onClick={handleClose}
        >
          <motion.div
            className={`max-h-[90vh] w-full overflow-hidden bg-white transition-[max-width] duration-300 ${verDocumento && !resultLink ? 'max-w-6xl' : 'max-w-xl'}`}
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ borderRadius: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 12px 32px rgba(15,23,42,0.10), 0 32px 80px rgba(15,23,42,0.16)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6" style={{ background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)', borderBottom: '1px solid #e2e8f0' }}>
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: 'linear-gradient(90deg,#2563eb 0%,#7c3aed 60%,#0891b2 100%)' }} />
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg,#60a5fa 0%,#2563eb 100%)', boxShadow: '0 3px 10px rgba(37,99,235,0.35)' }}>
                  <FileType2 className="size-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-black text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-500">
                    {language === 'en' ? 'Fill in the fields, then send for signature or download' : 'Llena los datos y envíalo a firmar o descárgalo'}
                  </p>
                </div>
                {!resultLink && (
                  <button
                    type="button"
                    onClick={alternarVerDocumento}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${verDocumento ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'}`}
                  >
                    {verDocumento ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    <span className="hidden sm:inline">
                      {verDocumento ? (language === 'en' ? 'Hide document' : 'Ocultar documento') : (language === 'en' ? 'See document' : 'Ver documento')}
                    </span>
                  </button>
                )}
                <button type="button" onClick={handleClose} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className={dividido ? 'flex h-[calc(90vh-88px)] flex-col md:flex-row' : ''}>
            {dividido && (
              <div className="flex shrink-0 gap-1 border-b border-slate-100 bg-slate-50 p-1.5 md:hidden">
                {(['datos', 'documento'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPestanaMovil(p)}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold ${pestanaMovil === p ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    {p === 'datos' ? (language === 'en' ? 'Details' : 'Datos') : (language === 'en' ? 'Document' : 'Documento')}
                  </button>
                ))}
              </div>
            )}
            <div className={`overflow-y-auto p-5 sm:p-7 ${dividido ? `min-h-0 flex-1 md:w-[46%] md:flex-none md:border-r md:border-slate-100 ${pestanaMovil === 'documento' ? 'hidden md:block' : ''}` : 'max-h-[calc(90vh-88px)]'}`}>
              {resultLink ? (
                <div className="flex flex-col items-center gap-4 py-2 text-center">
                  <div className="rounded-full bg-emerald-100 p-4"><Check className="size-8 text-emerald-600" /></div>
                  <h3 className="text-lg font-black text-slate-900">
                    {emailResult?.ok
                      ? (language === 'en' ? 'Sent for signature' : 'Enviado a firmar')
                      : (language === 'en' ? 'Document ready to sign' : 'Documento listo para firmar')}
                  </h3>
                  <p className="max-w-sm text-sm text-slate-500">
                    {emailResult?.ok
                      ? (language === 'en'
                          ? <>We emailed <strong className="text-slate-700">{emailResult.to}</strong> a link to review and sign. It's saved in My documents, and you'll be notified when it's signed.</>
                          : <>Le enviamos a <strong className="text-slate-700">{emailResult.to}</strong> un enlace para revisarlo y firmarlo. Quedó guardado en Mis documentos y te avisaremos cuando lo firme.</>)
                      : (language === 'en'
                          ? 'Saved in My documents. Share this one-time link — the document is already filled in, they just review and sign.'
                          : 'Quedó guardado en Mis documentos. Comparte este enlace único: el documento ya está lleno, solo deben revisarlo y firmarlo.')}
                  </p>

                  {emailResult && !emailResult.ok && (
                    <div className="flex w-full items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <span>{language === 'en' ? 'The email could not be sent: ' : 'No se pudo enviar el correo: '}{emailResult.error}</span>
                    </div>
                  )}

                  <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <Link2 className="ml-2 size-4 shrink-0 text-slate-400" />
                    <input readOnly value={resultLink} className="min-w-0 flex-1 truncate bg-transparent px-1 text-sm font-mono text-slate-600 outline-none" />
                    <button type="button" onClick={handleCopy} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? (language === 'en' ? 'Copied' : 'Copiado') : (language === 'en' ? 'Copy' : 'Copiar')}
                    </button>
                    <a href={resultLink} target="_blank" rel="noreferrer" className="flex shrink-0 items-center justify-center rounded-xl bg-white p-2 text-slate-400 hover:text-slate-700">
                      <ExternalLink className="size-4" />
                    </a>
                  </div>

                  <div className="grid w-full grid-cols-3 gap-2">
                    <a href={waHref} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100">
                      <MessageCircle className="size-4" /> WhatsApp
                    </a>
                    <button type="button" onClick={() => setInPersonOpen(true)}
                      className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                      <Smartphone className="size-4" /> {language === 'en' ? 'In person' : 'En persona'}
                    </button>
                    <button type="button" onClick={() => void handleDownload()} disabled={downloading}
                      className="flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[11px] font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-60">
                      {downloading ? <Loader className="size-4 animate-spin" /> : <Download className="size-4" />} PDF
                    </button>
                  </div>

                  {!emailResult?.ok && (
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                      <input
                        type="email"
                        value={recipientEmail}
                        onChange={(event) => setRecipientEmail(event.target.value)}
                        placeholder={language === 'en' ? 'Signer email' : 'Correo de quien va a firmar'}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        disabled={sendingEmail || !emailValid}
                        onClick={() => void handleSendInvitation()}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {sendingEmail ? <Loader className="size-3.5 animate-spin" /> : <Mail className="size-3.5" />}
                        {emailResult && !emailResult.ok
                          ? (language === 'en' ? 'Retry' : 'Reintentar')
                          : (language === 'en' ? 'Send by email' : 'Enviar por correo')}
                      </button>
                    </div>
                  )}

                  <div className="mt-1 flex w-full gap-2">
                    <button type="button" onClick={resetForm}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-bold text-indigo-700 hover:bg-indigo-100">
                      <Plus className="size-4" /> {language === 'en' ? 'Send another' : 'Enviar otro'}
                    </button>
                    <button type="button" onClick={handleClose}
                      className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200">
                      {language === 'en' ? 'Done' : 'Listo'}
                    </button>
                  </div>

                  <InPersonSignModal
                    open={inPersonOpen}
                    onClose={() => setInPersonOpen(false)}
                    link={resultLink}
                    signerName=""
                  />
                </div>
              ) : (
                <div className="space-y-5">
                  {draftRestored && (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <span>{language === 'en' ? 'We restored what you had typed.' : 'Recuperamos lo que habías escrito.'}</span>
                      <button type="button" onClick={handleDiscardDraft} className="shrink-0 font-bold underline-offset-2 hover:underline">
                        {language === 'en' ? 'Start over' : 'Empezar de cero'}
                      </button>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <label className="block text-xs font-black uppercase tracking-wide text-slate-500" htmlFor="gsm-signer-email">
                      {language === 'en' ? 'Who signs?' : '¿Quién va a firmar?'}
                    </label>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-indigo-400">
                      <Mail className="size-4 shrink-0 text-slate-400" />
                      <input
                        id="gsm-signer-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={recipientEmail}
                        onChange={(event) => setRecipientEmail(event.target.value)}
                        placeholder={language === 'en' ? 'signer@email.com (optional)' : 'correo@delfirmante.com (opcional)'}
                        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      {language === 'en'
                        ? "We'll email them the signing link. Leave it empty to share the link yourself."
                        : 'Le enviaremos el enlace de firma por correo. Déjalo vacío si prefieres compartir el enlace tú.'}
                    </p>
                  </div>

                  <DynamicDocForm onCampoEnfocado={setCampoActivo} nombreDocumento={template.name} tienePremium={tienePremium} docxFileUrl={template.docxFileUrl} fields={template.detectedFields} values={values} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} language={language} invalidKeys={invalidKeys} />

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <Shield className="size-4 shrink-0 text-slate-500" />
                      <p className="truncate text-[11px] text-slate-600">
                        {language === 'en' ? 'Signer verification: ' : 'Verificación del firmante: '}
                        <strong>{activeCount}</strong> {language === 'en' ? 'option(s)' : 'opción(es)'}
                        {!securityOverride && (language === 'en' ? ' · template default' : ' · de la plantilla')}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {securityOverride && (
                        <button type="button" onClick={() => setSecurityOverride(null)} title={language === 'en' ? 'Reset to template default' : 'Restablecer al valor por defecto'} className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700">
                          <RotateCcw className="size-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => setSecurityModalOpen(true)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50">
                        <Pencil className="size-3" /> {language === 'en' ? 'Adjust' : 'Ajustar'}
                      </button>
                    </div>
                  </div>

                  <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col gap-2 border-t border-slate-100 bg-white/95 px-5 pb-5 pt-3 backdrop-blur sm:-mx-7 sm:-mb-7 sm:flex-row sm:px-7 sm:pb-7">
                    <button
                      type="button"
                      disabled={generating || downloading}
                      onClick={() => void handleGenerate()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition active:translate-y-0.5 disabled:opacity-60"
                      style={{ background: 'linear-gradient(180deg,#818cf8 0%,#4f46e5 38%,#4338ca 68%,#312e81 100%)', boxShadow: '0 3px 0 #312e81, 0 5px 14px rgba(67,56,202,0.4), 0 1px 0 rgba(255,255,255,0.2) inset' }}
                    >
                      {generating
                        ? <><Loader className="size-4 animate-spin" /> {emailValid ? (language === 'en' ? 'Sending...' : 'Enviando...') : (language === 'en' ? 'Creating...' : 'Creando...')}</>
                        : emailValid
                          ? <><Send className="size-4" /> {language === 'en' ? 'Send for signature' : 'Enviar a firmar'}</>
                          : <><Link2 className="size-4" /> {language === 'en' ? 'Create signing link' : 'Crear enlace de firma'}</>}
                    </button>
                    <button
                      type="button"
                      disabled={generating || downloading}
                      onClick={() => void handleDownload()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {downloading ? <Loader className="size-4 animate-spin" /> : <Download className="size-4" />}
                      {language === 'en' ? 'Download PDF' : 'Descargar PDF'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {dividido && (
              <div className={`min-h-0 flex-1 ${pestanaMovil === 'datos' ? 'hidden md:block' : ''}`}>
                <VistaPreviaDocumento
                  docxFileUrl={template.docxFileUrl}
                  clauseOverrides={template.clauseOverrides}
                  extraClauses={template.extraClauses}
                  fields={template.detectedFields}
                  values={values}
                  language={language}
                  campoActivo={campoActivo}
                />
              </div>
            )}
            </div>
          </motion.div>

          <SecurityConfigModal
            open={securityModalOpen}
            language={language}
            initialConfig={effectiveSecurity}
            onConfirm={(config) => { setSecurityOverride(config); setSecurityModalOpen(false); }}
            onCancel={() => setSecurityModalOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
