import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { useLanguage } from '../../contexts/language-context';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import {
  getDocumentTemplate,
  getStateBySlug,
  getStateNameEs,
  getCanonicalUrl,
  buildLandingTitle,
  buildLandingDescription,
  buildLandingKeywords,
  getTranslatedDocumentName,
} from '../../utils/seo';

export default function StateDocumentLanding() {
  const { language } = useLanguage();
  const { documentType, stateSlug } = useParams<{ documentType: string; stateSlug: string }>();
  const document = useMemo(() => getDocumentTemplate(documentType || ''), [documentType]);
  const state = useMemo(() => (stateSlug ? getStateBySlug(stateSlug) : null), [stateSlug]);

  if (!document || !state) {
    return (
      <main className="max-w-4xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">{language === 'es' ? 'Página no encontrada' : 'Page not found'}</h1>
        <p className="mt-4 text-slate-600">
          {language === 'es'
            ? 'El documento o el estado solicitado no está disponible. Por favor elige una opción válida.'
            : 'The requested document or state is not available. Please choose a valid option.'}
        </p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-3 text-white hover:bg-indigo-700">
          {language === 'es' ? 'Ir a la página principal' : 'Go to homepage'}
        </Link>
      </main>
    );
  }

  const documentName = getTranslatedDocumentName(documentType || '', language);
  const stateDisplayName = language === 'es' ? getStateNameEs(state) : state;
  const title = buildLandingTitle(documentName, stateDisplayName, language);
  const description = buildLandingDescription(documentName, stateDisplayName, language);
  const keywords = buildLandingKeywords(documentName, stateDisplayName, language);
  const canonicalUrl = getCanonicalUrl(`/landing/${documentType}/${stateSlug}`);

  return (
    <div>
      <SEOHead title={title} description={description} keywords={keywords} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <main className="max-w-5xl mx-auto py-16 px-6">
        <h1 className="text-3xl font-bold">
          {documentName} {language === 'es' ? 'para' : 'in'} {stateDisplayName}
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          {language === 'es'
            ? `Crea un ${documentName.toLowerCase()} adaptado para ${stateDisplayName}. Prévisualízalo, descárgalo y fírmalo con verificación de identidad y auditoría.`
            : `Create a ${documentName.toLowerCase()} tailored for ${stateDisplayName}. Preview, download, and sign securely with identity verification and e-signature audit trail.`}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              {language === 'es' ? 'Qué incluye' : 'What’s included'}
            </h2>
            <ul className="mt-4 list-disc pl-6 text-slate-700">
              <li>
                {language === 'es'
                  ? `Lenguaje específico para ${stateDisplayName}`
                  : `State-specific language for ${stateDisplayName}`}
              </li>
              <li>{language === 'es' ? 'Firma electrónica compatible con ESIGN Act' : 'ESIGN Act compliant electronic signature'}</li>
              <li>{language === 'es' ? 'Verificación de identidad integrada y reporte de auditoría' : 'Built-in identity verification and audit report'}</li>
              <li>{language === 'es' ? 'PDF descargable listo para uso comercial o revisión legal' : 'Downloadable PDF ready for business or legal review'}</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold">{language === 'es' ? 'Listo para comenzar?' : 'Ready to start?'}</h2>
            <p className="mt-4 text-slate-700">
              {language === 'es'
                ? `Utiliza nuestro generador inteligente para completar tu ${documentName.toLowerCase()} en minutos.`
                : `Use our intelligent document generator to build your ${documentName.toLowerCase()} in minutes.`}
            </p>
            <Link to={`/generator/${documentType}`} className="mt-6 inline-flex rounded-lg bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700">
              {language === 'es' ? 'Crear mi documento' : 'Create your document'}
            </Link>
          </div>
        </div>
        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">
            {language === 'es'
              ? `Por qué un ${documentName.toLowerCase()} para ${stateDisplayName}`
              : `Why a ${documentName.toLowerCase()} for ${stateDisplayName}`}
          </h2>
          <p className="mt-4 text-slate-700">
            {language === 'es'
              ? 'Usar una plantilla específica por estado reduce riesgos, mejora la aplicabilidad y asegura que tu documento refleje las reglas y términos locales.'
              : 'Using a state-specific template helps reduce risk, improve enforceability, and ensure your document reflects local rules and terminology.'}
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold">{language === 'es' ? 'Configuración rápida' : 'Fast setup'}</p>
              <p className="mt-2 text-slate-600">
                {language === 'es' ? 'Responde preguntas simples y obtén un documento completo al instante.' : 'Answer simple questions and get a complete document instantly.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold">{language === 'es' ? 'Listo para uso legal' : 'Legal readiness'}</p>
              <p className="mt-2 text-slate-600">
                {language === 'es'
                  ? 'Incluye las cláusulas y avisos más comunes para tu estado.'
                  : 'Includes the most common state clauses and disclosure language.'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <p className="font-semibold">{language === 'es' ? 'Firma y verificación' : 'Signature + verification'}</p>
              <p className="mt-2 text-slate-600">
                {language === 'es'
                  ? 'Recopila firmas, selfies y datos de auditoría en un solo flujo.'
                  : 'Collect signatures, selfies, and audit data in a single flow.'}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
