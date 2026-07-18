import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, Download, Loader, PenLine, Check, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { SignatureModal } from '../components/signatures/SignatureModal';
import { getTemplate, generateFilledDocument, saveFilledDocument, type CustomTemplate, type PlacedField } from '../services/template-service';
import { markVisitorActivity } from '../services/analytics-service';

export function MyTemplateFillPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<CustomTemplate | null | undefined>(undefined); // undefined = loading
  const [values, setValues] = useState<Record<string, string>>({});
  const [signingFieldId, setSigningFieldId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getTemplate(id).then(setTemplate).catch(() => setTemplate(null));
  }, [id]);

  const setFieldValue = (fieldId: string, value: string) => setValues((prev) => ({ ...prev, [fieldId]: value }));

  const missingRequired = (template?.fields ?? []).filter((f) => f.required && !values[f.id]?.trim());

  const handleGenerate = async () => {
    if (!template) return;
    if (missingRequired.length > 0) {
      toast.error(language === 'en' ? 'Fill in all required fields first.' : 'Completa todos los campos obligatorios primero.');
      return;
    }
    setIsGenerating(true);
    try {
      const bytes = await generateFilledDocument({ templateFileUrl: template.fileUrl, fields: template.fields, values });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      toast.success(language === 'en' ? 'Document generated!' : '¡Documento generado!');
      markVisitorActivity('document', 'custom-template-fill');
      // Best-effort — a save failure must never block the download the
      // user already has in hand via resultUrl above.
      if (user?.id) {
        saveFilledDocument({ userId: user.id, templateName: template.name, templateFileUrl: template.fileUrl, pdfBytes: bytes })
          .catch(() => toast.error(language === 'en' ? 'Downloaded, but could not save it to your dashboard.' : 'Se descargó, pero no se pudo guardar en tu panel.'));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not generate the document.' : 'No se pudo generar el documento.'));
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Sign in to use this template' : 'Inicia sesión para usar esta plantilla'}</p>
        <Link to="/" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">{language === 'en' ? 'Go home' : 'Ir al inicio'}</Link>
      </div>
    );
  }

  if (template === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader className="size-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (template === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
        <p className="text-lg font-bold text-slate-800">{language === 'en' ? 'Template not found' : 'Plantilla no encontrada'}</p>
        <button type="button" onClick={() => navigate('/my-templates')} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white">
          {language === 'en' ? 'My Templates' : 'Mis Plantillas'}
        </button>
      </div>
    );
  }

  const currentSigningField = template.fields.find((f) => f.id === signingFieldId);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button type="button" onClick={() => navigate('/my-templates')} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="size-4" />
          {language === 'en' ? 'My Templates' : 'Mis Plantillas'}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50"><FileText className="size-5 text-indigo-500" /></div>
          <div>
            <h1 className="text-xl font-black text-slate-900">{template.name}</h1>
            <p className="text-sm text-slate-500">
              {language === 'en' ? 'Fill in the fields below, then generate the document.' : 'Completa los campos y genera el documento.'}
            </p>
          </div>
        </div>

        {resultUrl ? (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-200">
              <Check className="size-9 text-white" />
            </div>
            <div>
              <p className="text-lg font-black text-emerald-900">{language === 'en' ? 'Document ready!' : '¡Documento listo!'}</p>
              <p className="mt-1 text-sm text-emerald-700">{language === 'en' ? 'Download it below.' : 'Descárgalo abajo.'}</p>
            </div>
            <a
              href={resultUrl}
              download={`${template.name}.pdf`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:scale-[1.01]"
            >
              <Download className="size-5" />
              {language === 'en' ? 'Download PDF' : 'Descargar PDF'}
            </a>
            <button
              type="button"
              onClick={() => setResultUrl(null)}
              className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
            >
              <RefreshCw className="size-3.5" />
              {language === 'en' ? 'Fill another copy' : 'Llenar otra copia'}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {template.fields.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                {language === 'en' ? 'This template has no fields.' : 'Esta plantilla no tiene campos.'}
              </p>
            ) : (
              template.fields.map((f: PlacedField) => (
                <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    {f.label}{f.required && <span className="text-red-500"> *</span>}
                  </label>
                  {f.type === 'signature' || f.type === 'initials' ? (
                    values[f.id] ? (
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <img src={values[f.id]} alt={f.label} className="h-10 object-contain" />
                        <button type="button" onClick={() => setSigningFieldId(f.id)} className="ml-auto text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                          {language === 'en' ? 'Redo' : 'Rehacer'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSigningFieldId(f.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        <PenLine className="size-4" />
                        {language === 'en' ? 'Sign here' : 'Firmar aquí'}
                      </button>
                    )
                  ) : f.type === 'date' ? (
                    <input
                      type="date"
                      value={values[f.id] ?? ''}
                      onChange={(e) => setFieldValue(f.id, e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[f.id] ?? ''}
                      onChange={(e) => setFieldValue(f.id, e.target.value)}
                      placeholder={f.label}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-400"
                    />
                  )}
                </div>
              ))
            )}

            <button
              type="button"
              disabled={isGenerating || template.fields.length === 0}
              onClick={() => void handleGenerate()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? <Loader className="size-5 animate-spin" /> : <FileText className="size-5" />}
              {language === 'en' ? 'Generate document' : 'Generar documento'}
            </button>
          </div>
        )}
      </div>

      <SignatureModal
        open={signingFieldId !== null}
        onOpenChange={(open) => { if (!open) setSigningFieldId(null); }}
        onConfirm={(dataUrl) => {
          if (signingFieldId) setFieldValue(signingFieldId, dataUrl);
          setSigningFieldId(null);
        }}
        title={currentSigningField?.label || (language === 'en' ? 'Signature' : 'Firma')}
        userId={user?.id}
      />
    </div>
  );
}
