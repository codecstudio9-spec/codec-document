import { FileSignature, Home, Briefcase, Handshake, TrendingUp, Car, type LucideIcon } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { useLanguage } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from './LandingSections';
import type { DocType, DocTypeState } from '../../data/doctype-state-seo-content';
import type { CitySeoConfig } from '../../data/city-seo-content';

const DOC_TYPE_ICONS: Record<DocType, LucideIcon> = {
  nda: FileSignature,
  'lease-agreement': Home,
  'independent-contractor': Briefcase,
  'service-agreement': Handshake,
  'promissory-note': TrendingUp,
  'vehicle-bill-of-sale': Car,
};

/** Document-type × city page (first: NDA/Lease/etc. in San Jose,
 * California) — mirrors DocTypeStateLanding, but the city name lives ONLY
 * in the SEO <title>/description/keywords (real "NDA San Jose" search
 * intent). The hero and body reuse California's real per-document legal
 * facts (docState.facts) as-is and talk about California law, never the
 * city name, per explicit instruction. */
export function CityDocTypeLanding({ city, docState }: { city: CitySeoConfig; docState: DocTypeState }) {
  const { language } = useLanguage();
  const state = city.state;
  const docLabel = language === 'en' ? docState.docTypeLabelEn : docState.docTypeLabelEs;

  const title = `${docState.docTypeLabelEn} in ${city.cityName}, ${state.name} — Free Template & E-Signature | CodecDocument`;
  const desc = `Create a ${docState.docTypeLabelEn} in ${city.cityName}, ${state.name} with ${state.name}-specific legal language. Free template, instant preview, and ESIGN Act compliant electronic signature with identity verification.`;
  const canonicalUrl = `${SITE_URL}/${docState.docType}-${city.slug}`;

  const heroTitleEn = `${docState.docTypeLabelEn} under ${state.name} Law`;
  const heroTitleEs = `${docState.docTypeLabelEs} bajo la Ley de ${state.nameEs}`;

  return (
    <div>
      <SEOHead
        title={title}
        description={desc}
        keywords={`${docState.docTypeLabelEn} ${city.cityName}, ${docState.docTypeLabelEn} template ${city.cityName}, free ${docState.docTypeLabelEn} ${state.name}`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId={docState.generatorPath.replace('/generator/', '')}
        badge={`${docState.docTypeLabelEn.toUpperCase()} · ${state.abbreviation}`}
        color="#2563eb"
        icon={DOC_TYPE_ICONS[docState.docType]}
        previewLabel={`${docState.docTypeLabelEn} Preview`}
        backgroundImage="/imagen4.jpg"
        titleAccentEn={heroTitleEn} titleAccentEs={heroTitleEs}
        titleRestEn="" titleRestEs=""
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn={`Create My ${docState.docTypeLabelEn}`} ctaLabelEs={`Crear mi ${docState.docTypeLabelEs}`}
        ctaHref={docState.generatorPath}
        secondaryLabelEn="Sign a Document" secondaryLabelEs="Firmar un Documento"
        secondaryHref="/firma-electronica"
      />

      <IncludedCards
        headingEn={`What's inside your ${state.name} ${docState.docTypeLabelEn}`}
        headingEs={`Qué incluye tu ${docState.docTypeLabelEs} de ${state.nameEs}`}
        bodyEn={`Every clause reflects ${state.name} law, so you don't have to research it yourself.`}
        bodyEs={`Cada cláusula refleja la ley de ${state.nameEs}, para que no tengas que investigarla tú mismo.`}
        color="#2563eb"
        items={docState.facts}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion
        items={[
          { qEn: docState.faqEn, qEs: docState.faqEs, aEn: docState.faqAnswerEn, aEs: docState.faqAnswerEs },
          ...DEFAULT_FAQ,
        ]}
        heading={
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            {language === 'en' ? `${docLabel} in ${state.name} — FAQ` : `${docLabel} en ${state.nameEs} — Preguntas Frecuentes`}
          </h2>
        }
      />
      <LandingFooter />
    </div>
  );
}
