import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Upload, FileText, Save, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/auth-context';
import { useLanguage } from '../contexts/language-context';
import { TemplateFieldEditor } from '../components/templates/TemplateFieldEditor';
import { createTemplate, uploadTemplateFile, type PlacedField } from '../services/template-service';
import { useVoiceGuide } from '../hooks/useVoiceGuide';
import { VoiceGuideToggle } from '../components/voice/VoiceGuideToggle';

export function MyTemplateEditorPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [fields, setFields] = useState<PlacedField[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { speak } = useVoiceGuide();

  useEffect(() => {
    speak(pdfBytes
      ? {
        es: 'Haz clic en cualquier parte del documento para agregar un campo de nombre, fecha o firma. Cuando termines, ponle un nombre a la plantilla y guárdala.',
        en: 'Click anywhere on the document to add a name, date, or signature field. When you’re done, give the template a name and save it.',
      }
      : {
        es: 'Bienvenido a Codec Document. Sube el documento en PDF sobre el que quieres crear tu plantilla.',
        en: 'Welcome to Codec Document. Upload the PDF document you want to build your template on.',
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(pdfBytes)]);

  const handleFileSelect = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(language === 'en' ? 'Only PDF files are supported.' : 'Solo se admiten archivos PDF.');
      return;
    }
    setError('');
    const bytes = new Uint8Array(await file.arrayBuffer());
    setPdfBytes(bytes);
    setPdfFile(file);
    if (!templateName) setTemplateName(file.name.replace(/\.pdf$/i, ''));
  };

  const handleSave = async () => {
    if (!user?.id || !pdfFile || !pdfBytes) return;
    if (!templateName.trim()) { setError(language === 'en' ? 'Give your template a name.' : 'Ponle un nombre a tu plantilla.'); return; }
    if (fields.length === 0) { setError(language === 'en' ? 'Add at least one field.' : 'Agrega al menos un campo.'); return; }
    setError(''); setIsSaving(true);
    try {
      const fileUrl = await uploadTemplateFile(user.id, pdfFile);
      const templateId = await createTemplate({ userId: user.id, name: templateName.trim(), fileUrl, fields });
      toast.success(language === 'en' ? 'Template saved!' : '¡Plantilla guardada!');
      speak({
        es: 'Tu plantilla se guardó correctamente. Gracias por usar Codec Document.',
        en: 'Your template was saved successfully. Thank you for using Codec Document.',
      });
      navigate(`/my-templates/${templateId}/fill`);
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => navigate('/my-templates')} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
            <ArrowLeft className="size-4" />
            {language === 'en' ? 'My Templates' : 'Mis Plantillas'}
          </button>
          <VoiceGuideToggle />
        </div>

        <h1 className="text-2xl font-black text-slate-900">{language === 'en' ? 'New Template' : 'Nueva Plantilla'}</h1>

        {!pdfBytes ? (
          <section className="mx-auto mt-6 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-slate-900">{language === 'en' ? 'Upload your document' : 'Sube tu documento'}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {language === 'en' ? 'Only PDF for now.' : 'Por ahora solo PDF.'}
              </p>
            </div>
            <label className="group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/40 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50/50">
              <input type="file" accept="application/pdf" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(e) => void handleFileSelect(e.target.files?.[0])} />
              <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm"><Upload className="size-8 text-slate-500" /></div>
              <p className="text-base font-semibold text-slate-900">{language === 'en' ? 'Drag your PDF here' : 'Arrastra tu PDF aquí'}</p>
              <span className="mt-5 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                {language === 'en' ? 'Choose file' : 'Elegir archivo'}
              </span>
            </label>
            {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
          </section>
        ) : (
          <>
            <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <FileText className="size-5 shrink-0 text-indigo-500" />
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
            {error && <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>}

            <div className="mt-4">
              <TemplateFieldEditor pdfBytes={pdfBytes} fields={fields} onFieldsChange={setFields} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
