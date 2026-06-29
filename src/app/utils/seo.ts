import { documentTemplates } from '../data/templates';
import { getDocumentTranslation } from '../data/document-translations';
import { US_STATES, STATE_NAMES_ES } from '../data/state-variations';

const slugify = (value: string) =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export const stateSlugMap = US_STATES.reduce<Record<string, string>>((acc, state) => {
  acc[slugify(state)] = state;
  return acc;
}, {});

export const getStateBySlug = (slug: string) => stateSlugMap[slug] || null;
export const getStateNameEs = (state: string) => STATE_NAMES_ES[state] || state;

export const getDocumentTemplate = (documentType: string) =>
  documentTemplates.find((template) => template.id === documentType) || null;

export const getTranslatedDocumentName = (documentType: string, language: 'en' | 'es') => {
  if (language === 'es') {
    const translation = getDocumentTranslation(documentType, 'name', 'es');
    return translation || getDocumentTemplate(documentType)?.name || documentType;
  }

  return getDocumentTemplate(documentType)?.name || documentType;
};

export const getCanonicalUrl = (pathname: string) =>
  `https://codecdocument.com${pathname.startsWith('/') ? pathname : `/${pathname}`}`;

export const buildLandingTitle = (documentName: string, state: string, language: 'en' | 'es' = 'en') =>
  language === 'es'
    ? `${documentName} para ${state} | Generador de Documentos Legales` 
    : `${documentName} Template in ${state} | Free Legal Form Generator`;

export const buildLandingDescription = (documentName: string, state: string, language: 'en' | 'es' = 'en') =>
  language === 'es'
    ? `Genera un ${documentName.toLowerCase()} para ${state}. Crea un documento legal específico para el estado, prévisualízalo al instante y fírmalo en línea con evidencia de auditoría.`
    : `Generate a ${documentName.toLowerCase()} for ${state}. Create a state-specific legal document, preview it instantly, and sign it online with audit evidence.`;

export const buildLandingKeywords = (documentName: string, state: string, language: 'en' | 'es' = 'en') =>
  language === 'es'
    ? `${documentName.toLowerCase()} ${state.toLowerCase()} plantilla, ${documentName.toLowerCase()} ${state.toLowerCase()}, formulario legal ${state.toLowerCase()}, ${documentName.toLowerCase()} en línea`
    : `${documentName.toLowerCase()} ${state.toLowerCase()} template, ${documentName.toLowerCase()} ${state.toLowerCase()}, ${state.toLowerCase()} legal form, ${documentName.toLowerCase()} online`;

export const getPilotStateDocumentCombos = () => [
  { documentType: 'residential-lease', stateSlug: 'texas' },
  { documentType: 'residential-lease', stateSlug: 'florida' },
  { documentType: 'nda', stateSlug: 'california' },
  { documentType: 'nda', stateSlug: 'new-york' },
  { documentType: 'independent-contractor', stateSlug: 'texas' },
  { documentType: 'independent-contractor', stateSlug: 'california' },
  { documentType: 'service-agreement', stateSlug: 'florida' },
  { documentType: 'service-agreement', stateSlug: 'texas' },
  { documentType: 'promissory-note', stateSlug: 'california' },
  { documentType: 'promissory-note', stateSlug: 'florida' },
  { documentType: 'bill-of-sale-vehicle', stateSlug: 'california' },
  { documentType: 'bill-of-sale-vehicle', stateSlug: 'texas' },
];
