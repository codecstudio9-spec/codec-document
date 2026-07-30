import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Upload, FileType2, Save, Loader, Plus, Trash2, Shield, Copy, Check, ExternalLink,
  ChevronDown, Lock, ListChecks,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { useCompany } from '../hooks/useCompany';
import { detectFields, type DetectedField, type DetectedFieldType } from '../../lib/docxTemplateEngine';
import {
  createDocxTemplate, updateDocxTemplate, uploadDocxTemplateFile, getDocxTemplateForOwner,
  type TemplateSigner,
} from '../services/docx-template-service';
import type { SecurityConfig } from '../services/sign-transaction-service';
import { SecurityConfigModal } from '../components/SecurityConfigModal';
import { SITE_URL } from '../config/site';
import { useVoiceSpeak } from '../hooks/useVoiceGuide';

const DEFAULT_SECURITY: SecurityConfig = {
  standardSignature: true, requireSelfie: false, requireIdPhoto: false,
  requireSmsOtp: false, requireEsignConsent: false, advancedAuditTrail: false, requireBiometric: false,
};

const FIELD_TYPE_LABELS: Record<DetectedFieldType, { en: string; es: string }> = {
  text: { en: 'Short answer', es: 'Respuesta corta' },
  date: { en: 'Date', es: 'Fecha' },
  number: { en: 'Number', es: 'Número' },
  choice: { en: 'Multiple choice', es: 'Opción múltiple' },
};

export function MyDocxTemplateEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { speak } = useVoiceSpeak();
  const { company, isCompanyAdmin } = useCompany();

  // Field DEFINITIONS (the {{tag}} -> label/type/required mapping) are
  // only editable by a company admin once this user belongs to a company
  // — a regular employee still sees the list (read-only) but can't change
  // what the template asks for. An individual user with no company at all
  // is unaffected (company is null -> always editable), same as today.
  const canEditFields = !company || isCompanyAdmin;

  const [loading, setLoading] = useState(isEditMode);
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [docxFileUrl, setDocxFileUrl] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState<DetectedField[]>([]);
  const [fieldsOpen, setFieldsOpen] = useState(false);
  const [signers, setSigners] = useState<TemplateSigner[]>([{ role: 'variable', label: language === 'en' ? 'Signer 1' : 'Firmante 1' }]);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(DEFAULT_SECURITY);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [instructionsEs, setInstructionsEs] = useState('');
  const [instructionsEn, setInstructionsEn] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  useEffect(() => {
    speak(docxFileUrl
      ? {
        es: 'Revisa los campos detectados en tu documento, ajusta el tipo si hace falta, define los firmantes, y guarda la plantilla para obtener tu enlace público.',
        en: 'Review the fields detected in your document, adjust the type if needed, define the signers, and save the template to get your public link.',
      }
      : {
        es: 'Sube tu archivo de Word con variables entre llaves dobles, por ejemplo nombre cliente entre llaves.',
        en: 'Upload your Word file with variables in double braces, for example client name in braces.',
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(docxFileUrl)]);

  useEffect(() => {
    if (!isEditMode || !id) return;
    getDocxTemplateForOwner(id).then((t) => {
      if (!t) { setError(language === 'en' ? 'Template not found.' : 'Plantilla no encontrada.'); setLoading(false); return; }
      setTemplateName(t.name);
      setDocxFileUrl(t.docxFileUrl);
      setFields(t.detectedFields);
      setSigners(t.signers.length > 0 ? t.signers : [{ role: 'variable', label: language === 'en' ? 'Signer 1' : 'Firmante 1' }]);
      setSecurityConfig(t.securityConfig);
      setInstructionsEs(t.instructionsEs);
      setInstructionsEn(t.instructionsEn);
      setLoading(false);
    }).catch(() => { setError(language === 'en' ? 'Could not load the template.' : 'No se pudo cargar la plantilla.'); setLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  const handleFileSelect = async (file?: File | null) => {
    if (!file) return;
    const isDocx = file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml');
    if (!isDocx) {
      setError(language === 'en' ? 'Only .docx (Word) files are supported.' : 'Solo se admiten archivos .docx (Word).');
      return;
    }
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      const detected = detectFields(buffer);
      if (detected.length === 0) {
        setError(language === 'en'
          ? 'No {{variables}} were found in this document. Add at least one, e.g. {{client_name}}.'
          : 'No se encontraron {{variables}} en este documento. Agrega al menos una, ej. {{nombre_cliente}}.');
        return;
      }
      setFields(detected);
      setFieldsOpen(true);
      setDocxFile(file);
      // Object URL only for the "file selected" UI state below — the real
      // stored URL comes from uploadDocxTemplateFile on save.
      setDocxFileUrl(URL.createObjectURL(file));
      if (!templateName) setTemplateName(file.name.replace(/\.docx$/i, ''));
    } catch {
      setError(language === 'en' ? 'Could not read this .docx file — is it a valid Word document?' : 'No se pudo leer este archivo .docx — ¿es un documento de Word válido?');
    }
  };

  const updateField = (key: string, patch: Partial<DetectedField>) => {
    if (!canEditFields) return;
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  };
  const removeField = (key: string) => {
    if (!canEditFields) return;
    setFields((prev) => prev.filter((f) => f.key !== key));
  };

  const addFixedSigner = () => {
    setSigners((prev) => [...prev, {
      role: 'fixed',
      label: language === 'en' ? `Signer ${prev.length + 1}` : `Firmante ${prev.length + 1}`,
      name: '', email: '',
    }]);
  };
  const updateSigner = (index: number, patch: Partial<TemplateSigner>) => {
    setSigners((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };
  const removeSigner = (index: number) => setSigners((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!user?.id) return;
    if (!templateName.trim()) { setError(language === 'en' ? 'Give your template a name.' : 'Ponle un nombre a tu plantilla.'); return; }
    if (fields.length === 0) { setError(language === 'en' ? 'Your document needs at least one {{variable}}.' : 'Tu documento necesita al menos una {{variable}}.'); return; }
    const invalidFixedSigner = signers.find((s) => s.role === 'fixed' && !s.promotedToField && !s.name?.trim());
    if (invalidFixedSigner) {
      setError(language === 'en' ? 'Give every fixed signer a name, or convert them to a variable.' : 'Ponle nombre a cada firmante fijo, o conviértelo en variable.');
      return;
    }

    setError(''); setIsSaving(true);
    try {
      let fileUrl = docxFileUrl && !docxFileUrl.startsWith('blob:') ? docxFileUrl : null;
      if (!fileUrl) {
        if (!docxFile) throw new Error(language === 'en' ? 'Upload a .docx file first.' : 'Sube primero un archivo .docx.');
        fileUrl = await uploadDocxTemplateFile(user.id, docxFile);
      }

      if (isEditMode && id) {
        await updateDocxTemplate(id, {
          name: templateName.trim(), detectedFields: fields, signers, securityConfig,
          instructionsEs: instructionsEs.trim(), instructionsEn: instructionsEn.trim(),
        });
        toast.success(language === 'en' ? 'Template updated!' : '¡Plantilla actualizada!');
        navigate('/my-templates');
        return;
      }

      const created = await createDocxTemplate({
        userId: user.id, name: templateName.trim(), docxFileUrl: fileUrl,
        detectedFields: fields, signers, securityConfig,
        instructionsEs: instructionsEs.trim(), instructionsEn: instructionsEn.trim(),
      });
      setSavedSlug(created.publicSlug);
      toast.success(language === 'en' ? 'Template saved!' : '¡Plantilla guardada!');
      speak({
        es: 'Tu plantilla se guardó correctamente. Copia el enlace público y compártelo con quien deba llenarlo y firmarlo.',
        en: 'Your template was saved successfully. Copy the public link and share it with whoever needs to fill it in and sign.',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(language === 'en' ? 'Could not save the template.' : 'No se pudo guardar la plantilla.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Sign in to create a template' : 'Inicia sesión para crear una plantilla'}</p>
        <Link to="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">{language === 'en' ? 'Go home' : 'Ir al inicio'}</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50"><Loader className="size-8 animate-spin text-indigo-500" /></div>;
  }

  if (savedSlug) {
    const link = `${SITE_URL}/t/${savedSlug}`;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-50 px-4 text-center">
        <div className="rounded-full bg-emerald-100 p-5"><Check className="size-10 text-emerald-600" /></div>
        <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'Your template is ready' : 'Tu plantilla está lista'}</h1>
        <p className="max-w-md text-sm text-slate-500">
          {language === 'en'
            ? 'Share this link with anyone who needs to fill it in and sign — it always stays the same, and each person who opens it gets their own document.'
            : 'Comparte este enlace con quien deba llenarlo y firmarlo — siempre es el mismo, y cada persona que lo abra obtiene su propio documento.'}
        </p>
        <div className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <input readOnly value={link} className="min-w-0 flex-1 truncate bg-transparent px-3 text-sm font-mono text-slate-600 outline-none" />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(link)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
          >
            <Copy className="size-3.5" /> {language === 'en' ? 'Copy' : 'Copiar'}
          </button>
          <a href={link} target="_blank" rel="noreferrer" className="flex shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 text-slate-400 hover:text-slate-700">
            <ExternalLink className="size-4" />
          </a>
        </div>
        <button type="button" onClick={() => navigate('/my-templates')} className="mt-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
          {language === 'en' ? 'Back to My Templates' : 'Volver a Mis Plantillas'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate('/my-templates')} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'My Templates' : 'Mis Plantillas'}
        </button>

        <h1 className="text-2xl font-black text-slate-900">
          {isEditMode ? (language === 'en' ? 'Edit Word Template' : 'Editar Plantilla Word') : (language === 'en' ? 'New Word Template' : 'Nueva Plantilla Word')}
        </h1>

        {!docxFileUrl ? (
          <section className="mx-auto mt-6 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-900">{language === 'en' ? 'Upload your Word document' : 'Sube tu documento de Word'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {language === 'en'
                  ? 'Mark every fillable field with {{double braces}}, e.g. {{client_name}}, {{signing_date:date}}, {{payment_method:Cash;Card}}.'
                  : 'Marca cada campo con {{llaves dobles}}, ej. {{nombre_cliente}}, {{fecha_firma:fecha}}, {{metodo_pago:Efectivo;Tarjeta}}.'}
              </p>
            </div>
            <label className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/40 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/50">
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                onChange={(e) => void handleFileSelect(e.target.files?.[0])}
              />
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm"><Upload className="size-8 text-slate-500" /></div>
              <p className="text-base font-semibold text-slate-900">{language === 'en' ? 'Drag your .docx here' : 'Arrastra tu .docx aquí'}</p>
              <span className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {language === 'en' ? 'Choose file' : 'Elegir archivo'}
              </span>
            </label>
            {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          </section>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <FileType2 className="size-5 shrink-0 text-indigo-500" />
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={language === 'en' ? 'Template name' : 'Nombre de la plantilla'}
                  className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-400"
                />
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave()}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg disabled:opacity-50"
              >
                {isSaving ? <Loader className="size-4 animate-spin" /> : <Save className="size-4" />}
                {language === 'en' ? 'Save template' : 'Guardar plantilla'}
              </button>
            </div>
            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            {/* Detected fields — collapsible drawer; field DEFINITIONS are
                admin-only once this user belongs to a company (see
                canEditFields above), everyone else can still see them. */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setFieldsOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-700">
                    <ListChecks className="size-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                      {language === 'en' ? `Detected fields (${fields.length})` : `Campos detectados (${fields.length})`}
                    </p>
                    {!canEditFields && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <Lock className="size-3" />
                        {language === 'en' ? 'Only a company admin can edit these' : 'Solo un administrador de tu empresa puede editarlos'}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronDown className={`size-4 shrink-0 text-slate-400 transition-transform ${fieldsOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {fieldsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="space-y-2 px-5 pb-5">
                      {fields.map((f) => canEditFields ? (
                        <div key={f.key} className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:flex-row sm:items-center">
                          <code className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-100">{`{{${f.key}}}`}</code>
                          <input
                            value={f.label}
                            onChange={(e) => updateField(f.key, { label: e.target.value })}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
                          />
                          <select
                            value={f.type}
                            onChange={(e) => updateField(f.key, { type: e.target.value as DetectedFieldType, options: e.target.value === 'choice' ? (f.options ?? ['']) : undefined })}
                            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold outline-none focus:border-indigo-400"
                          >
                            {(Object.keys(FIELD_TYPE_LABELS) as DetectedFieldType[]).map((t) => (
                              <option key={t} value={t}>{FIELD_TYPE_LABELS[t][language]}</option>
                            ))}
                          </select>
                          {f.type === 'choice' && (
                            <input
                              value={(f.options ?? []).join(';')}
                              onChange={(e) => updateField(f.key, { options: e.target.value.split(';').map((o) => o.trim()).filter(Boolean) })}
                              placeholder={language === 'en' ? 'Option1;Option2' : 'Opcion1;Opcion2'}
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-400"
                            />
                          )}
                          <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <input type="checkbox" checked={f.required} onChange={(e) => updateField(f.key, { required: e.target.checked })} />
                            {language === 'en' ? 'Required' : 'Obligatorio'}
                          </label>
                          <button type="button" onClick={() => removeField(f.key)} className="shrink-0 text-slate-300 hover:text-red-600">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div key={f.key} className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:flex-row sm:items-center">
                          <code className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-[11px] font-bold text-slate-100">{`{{${f.key}}}`}</code>
                          <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{f.label}</span>
                          <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{FIELD_TYPE_LABELS[f.type][language]}</span>
                          {f.required && (
                            <span className="shrink-0 text-xs font-semibold text-slate-400">{language === 'en' ? 'Required' : 'Obligatorio'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Signers */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">{language === 'en' ? 'Signers' : 'Firmantes'}</h2>
              <div className="space-y-2">
                {signers.map((s, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                    {s.role === 'variable' ? (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700">
                          {language === 'en' ? 'Variable' : 'Variable'}
                        </span>
                        <p className="text-sm font-semibold text-slate-700">{s.label}</p>
                        <p className="ml-auto text-xs text-slate-400">
                          {language === 'en' ? 'Whoever opens the link fills this in' : 'Quien abre el enlace lo llena'}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                          {language === 'en' ? 'Fixed' : 'Fijo'}
                        </span>
                        {s.promotedToField ? (
                          <p className="text-xs text-slate-500">
                            {language === 'en' ? 'Converted to a variable field — collected from whoever fills the link.' : 'Convertido en campo variable — se pide a quien llena el enlace.'}
                          </p>
                        ) : (
                          <>
                            <input
                              value={s.name ?? ''}
                              onChange={(e) => updateSigner(i, { name: e.target.value })}
                              placeholder={language === 'en' ? 'Name' : 'Nombre'}
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
                            />
                            <input
                              value={s.email ?? ''}
                              onChange={(e) => updateSigner(i, { email: e.target.value })}
                              placeholder={language === 'en' ? 'Email' : 'Correo electrónico'}
                              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-indigo-400"
                            />
                          </>
                        )}
                        <label className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <input type="checkbox" checked={Boolean(s.promotedToField)} onChange={(e) => updateSigner(i, { promotedToField: e.target.checked })} />
                          {language === 'en' ? 'Make variable' : 'Convertir a variable'}
                        </label>
                        <button type="button" onClick={() => removeSigner(i)} className="shrink-0 text-slate-300 hover:text-red-600">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addFixedSigner}
                className="mt-3 flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-bold text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
              >
                <Plus className="size-3.5" /> {language === 'en' ? 'Add fixed signer' : 'Agregar firmante fijo'}
              </button>
            </section>

            {/* Security & Verification — deliberately the most visually
                prominent section on this page (gradient border + icon
                badge), since this is a legal/trust decision, not just
                another form field. What's set here becomes the DEFAULT
                security applied whenever this template is used, but stays
                fully overridable per document (e.g. from "Fill before
                sending" on My Templates) — never locked in. */}
            <section
              className="relative overflow-hidden rounded-3xl p-[1.5px] shadow-md"
              style={{ background: 'linear-gradient(135deg,#2563eb 0%,#7c3aed 55%,#0891b2 100%)' }}
            >
              <div className="flex flex-col gap-4 rounded-[22px] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl"
                    style={{ background: 'linear-gradient(135deg,#60a5fa 0%,#2563eb 100%)', boxShadow: '0 3px 10px rgba(37,99,235,0.4)' }}
                  >
                    <Shield className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{language === 'en' ? 'Security & Verification' : 'Seguridad y Verificación'}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {Object.values(securityConfig).filter(Boolean).length} {language === 'en' ? 'option(s) active' : 'opción(es) activa(s)'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {language === 'en'
                        ? "Applies as the default every time this template is used — whoever generates a document can still adjust it for that one send."
                        : 'Se aplica por defecto cada vez que se use esta plantilla — quien genere un documento podrá ajustarlo para ese envío.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(true)}
                  className="shrink-0 rounded-xl px-5 py-2.5 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)', boxShadow: '0 3px 0 #172554, 0 5px 14px rgba(29,78,216,0.45), 0 1px 0 rgba(255,255,255,0.25) inset' }}
                >
                  {language === 'en' ? 'Configure' : 'Configurar'}
                </button>
              </div>
            </section>

            {/* Instructions */}
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-sm font-black uppercase tracking-wide text-slate-400">
                {language === 'en' ? 'Instructions for whoever signs (optional)' : 'Instrucciones para quien firma (opcional)'}
              </h2>
              <p className="mb-3 text-xs text-slate-400">
                {language === 'en'
                  ? "Leave blank to use our default 4-step instructions."
                  : 'Déjalo en blanco para usar nuestras instrucciones genéricas de 4 pasos.'}
              </p>
              <textarea
                value={language === 'en' ? instructionsEn : instructionsEs}
                onChange={(e) => (language === 'en' ? setInstructionsEn(e.target.value) : setInstructionsEs(e.target.value))}
                rows={3}
                placeholder={language === 'en' ? 'e.g. Have your ID ready before you start.' : 'ej. Ten tu identificación a la mano antes de empezar.'}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
              />
            </section>
          </div>
        )}
      </div>

      <SecurityConfigModal
        open={securityModalOpen}
        language={language}
        initialConfig={securityConfig}
        onConfirm={(config) => { setSecurityConfig(config); setSecurityModalOpen(false); }}
        onCancel={() => setSecurityModalOpen(false)}
      />
    </div>
  );
}
