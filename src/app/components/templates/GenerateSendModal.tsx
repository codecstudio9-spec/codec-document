import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileType2, X, Loader, ArrowRight, Copy, Check, ExternalLink, Shield, Pencil, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { DocxTemplate } from '../../services/docx-template-service';
import { createCustomTemplateTransaction } from '../../services/docx-template-service';
import type { SecurityConfig } from '../../services/sign-transaction-service';
import { SecurityConfigModal } from '../SecurityConfigModal';
import { SITE_URL } from '../../config/site';
import { DynamicDocForm } from './DynamicDocForm';

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
 */
export function GenerateSendModal({ template, language, onClose }: GenerateSendModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [securityOverride, setSecurityOverride] = useState<SecurityConfig | null>(null);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resultLink, setResultLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const open = Boolean(template);
  const effectiveSecurity = securityOverride ?? template?.securityConfig;
  const activeCount = effectiveSecurity ? Object.values(effectiveSecurity).filter(Boolean).length : 0;

  const handleClose = () => {
    setValues({}); setSecurityOverride(null); setResultLink(null); setCopied(false); setShowValidation(false);
    onClose();
  };

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
            className="max-h-[90vh] w-full max-w-xl overflow-hidden bg-white"
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
                    {language === 'en' ? 'Fill it in, then send only for a signature' : 'Llénalo tú, y envíalo solo para firmar'}
                  </p>
                </div>
                <button type="button" onClick={handleClose} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-5 sm:p-7">
              {resultLink ? (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <div className="rounded-full bg-emerald-100 p-4"><Check className="size-8 text-emerald-600" /></div>
                  <h3 className="text-lg font-black text-slate-900">{language === 'en' ? 'Signing link ready' : 'Enlace de firma listo'}</h3>
                  <p className="max-w-sm text-sm text-slate-500">
                    {language === 'en'
                      ? 'Send this one-time link to your recipient — the document is already filled in, they just review and sign.'
                      : 'Envía este enlace único a tu destinatario — el documento ya está lleno, solo debe revisarlo y firmarlo.'}
                  </p>
                  <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                    <input readOnly value={resultLink} className="min-w-0 flex-1 truncate bg-transparent px-3 text-sm font-mono text-slate-600 outline-none" />
                    <button type="button" onClick={handleCopy} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">
                      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? (language === 'en' ? 'Copied' : 'Copiado') : (language === 'en' ? 'Copy' : 'Copiar')}
                    </button>
                    <a href={resultLink} target="_blank" rel="noreferrer" className="flex shrink-0 items-center justify-center rounded-xl bg-white p-2 text-slate-400 hover:text-slate-700">
                      <ExternalLink className="size-4" />
                    </a>
                  </div>
                  <button type="button" onClick={handleClose} className="mt-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
                    {language === 'en' ? 'Done' : 'Listo'}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <DynamicDocForm fields={template.detectedFields} values={values} onChange={(k, v) => setValues((p) => ({ ...p, [k]: v }))} language={language} invalidKeys={invalidKeys} />

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Shield className="size-4 shrink-0 text-blue-600" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-900">
                          {language === 'en' ? 'Security for this document' : 'Seguridad para este documento'}
                        </p>
                        <p className="text-[11px] text-blue-700">
                          {activeCount} {language === 'en' ? 'option(s) active' : 'opción(es) activa(s)'}
                          {!securityOverride && (language === 'en' ? ' · template default' : ' · valor por defecto de la plantilla')}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {securityOverride && (
                        <button type="button" onClick={() => setSecurityOverride(null)} title={language === 'en' ? 'Reset to template default' : 'Restablecer al valor por defecto'} className="flex size-8 items-center justify-center rounded-lg text-blue-400 hover:bg-blue-100 hover:text-blue-700">
                          <RotateCcw className="size-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => setSecurityModalOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
                        <Pencil className="size-3.5" /> {language === 'en' ? 'Adjust' : 'Ajustar'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void handleGenerate()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition active:translate-y-0.5 disabled:opacity-60"
                    style={{ background: 'linear-gradient(180deg,#818cf8 0%,#4f46e5 38%,#4338ca 68%,#312e81 100%)', boxShadow: '0 3px 0 #312e81, 0 5px 14px rgba(67,56,202,0.4), 0 1px 0 rgba(255,255,255,0.2) inset' }}
                  >
                    {generating
                      ? <><Loader className="size-4 animate-spin" /> {language === 'en' ? 'Generating...' : 'Generando...'}</>
                      : <>{language === 'en' ? 'Generate signing link' : 'Generar enlace de firma'} <ArrowRight className="size-4" /></>}
                  </button>
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
