import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { FileType2, Loader, AlertCircle, ArrowRight, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/language-context';
import { getTemplateBySlugPublic, createCustomTemplateTransaction, type PublicDocxTemplate } from '../services/docx-template-service';
import { LanguageToggle } from '../components/language-toggle';
import { DynamicDocForm } from '../components/templates/DynamicDocForm';

const DEFAULT_INSTRUCTIONS = {
  en: [
    'Fill in your information in the form below.',
    "If asked, verify your identity (selfie, ID photo, or fingerprint/Face ID).",
    'Draw or type your signature.',
    "Confirm — you'll get your signed document ready to download.",
  ],
  es: [
    'Completa tus datos en el formulario de abajo.',
    'Si se te pide, verifica tu identidad (selfie, foto de tu identificación, o huella/Face ID).',
    'Dibuja o escribe tu firma.',
    'Confirma — recibirás tu documento firmado listo para descargar.',
  ],
};

export function TemplateFillPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<PublicDocxTemplate | null | undefined>(undefined); // undefined = loading
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getTemplateBySlugPublic(slug).then(setTemplate).catch(() => setTemplate(null));
  }, [slug]);

  const setFieldValue = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const missingRequired = (template?.detectedFields ?? []).filter((f) => f.required && !values[f.key]?.trim());

  const handleSubmit = async () => {
    if (!template || !slug) return;
    if (missingRequired.length > 0) {
      toast.error(language === 'en' ? 'Fill in all required fields first.' : 'Completa todos los campos obligatorios primero.');
      return;
    }
    setSubmitting(true);
    try {
      const txId = await createCustomTemplateTransaction(slug, values);
      navigate(`/sign/${txId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : (language === 'en' ? 'Could not start signing.' : 'No se pudo iniciar la firma.'));
      setSubmitting(false);
    }
  };

  if (template === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader className="size-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">{language === 'en' ? 'Loading document...' : 'Cargando documento...'}</p>
      </div>
    );
  }

  if (template === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <div className="rounded-full bg-red-100 p-4"><AlertCircle className="size-10 text-red-500" /></div>
        <h1 className="text-xl font-bold text-slate-800">{language === 'en' ? 'Link not found' : 'Enlace no encontrado'}</h1>
        <p className="max-w-sm text-sm text-slate-500">
          {language === 'en'
            ? "This template link doesn't exist. Check the link or contact whoever sent it to you."
            : 'Este enlace de plantilla no existe. Revisa el enlace o contacta a quien te lo envió.'}
        </p>
      </div>
    );
  }

  const instructions = (language === 'en' ? template.instructionsEn : template.instructionsEs) || '';
  const defaultSteps = DEFAULT_INSTRUCTIONS[language];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="rounded-lg bg-indigo-600 p-1.5"><FileType2 className="size-4 text-white" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight text-slate-800">Codec Document</p>
          <p className="truncate text-xs leading-tight text-slate-500">{template.name}</p>
        </div>
        <LanguageToggle />
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 py-6 pb-10">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-indigo-900">
            <ListChecks className="size-4" /> {language === 'en' ? 'How this works' : 'Cómo funciona'}
          </h2>
          {instructions ? (
            <p className="text-sm leading-relaxed text-indigo-800">{instructions}</p>
          ) : (
            <ol className="list-decimal space-y-1 pl-4 text-sm leading-relaxed text-indigo-800">
              {defaultSteps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <DynamicDocForm fields={template.detectedFields} values={values} onChange={setFieldValue} language={language} />

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(180deg,#818cf8 0%,#4f46e5 38%,#4338ca 68%,#312e81 100%)', boxShadow: '0 3px 0 #312e81' }}
          >
            {submitting
              ? <><Loader className="size-4 animate-spin" /> {language === 'en' ? 'Starting...' : 'Iniciando...'}</>
              : <>{language === 'en' ? 'Continue to sign' : 'Continuar para firmar'} <ArrowRight className="size-4" /></>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
