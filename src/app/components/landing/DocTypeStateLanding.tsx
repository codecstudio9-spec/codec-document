import { FileSignature, Home, ArrowRight } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { useLanguage } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from './LandingSections';
import type { DocTypeState } from '../../data/doctype-state-seo-content';

const STATE_SLUGS = ['california', 'texas', 'florida', 'new-york', 'illinois', 'pennsylvania'];
const STATE_NAMES: Record<string, { en: string; es: string }> = {
  california: { en: 'California', es: 'California' },
  texas: { en: 'Texas', es: 'Texas' },
  florida: { en: 'Florida', es: 'Florida' },
  'new-york': { en: 'New York', es: 'Nueva York' },
  illinois: { en: 'Illinois', es: 'Illinois' },
  pennsylvania: { en: 'Pennsylvania', es: 'Pensilvania' },
};

/** Cross-links to the same document type in the other 5 states — the
 * "connected pages" the user asked for: a visitor comparing NDA rules in
 * two states, or a multi-state landlord, can jump directly instead of
 * re-searching. Real internal links also help search engines discover
 * and rank the whole cluster together. */
function OtherStatesLinks({ current, docType, labelEn, labelEs }: {
  current: string; docType: 'nda' | 'lease-agreement'; labelEn: string; labelEs: string;
}) {
  const { language } = useLanguage();
  const others = STATE_SLUGS.filter((s) => s !== current);
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">
            {language === 'en' ? `${labelEn} rules in other states` : `Reglas de ${labelEs} en otros estados`}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {others.map((slug) => (
              <a
                key={slug}
                href={`/${docType}-${slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {language === 'en' ? STATE_NAMES[slug].en : STATE_NAMES[slug].es}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function DocTypeStateLanding({ data }: { data: DocTypeState }) {
  const { language } = useLanguage();
  const isNda = data.docType === 'nda';
  const docLabel = language === 'en' ? data.docTypeLabelEn : data.docTypeLabelEs;
  const stateLabel = language === 'en' ? data.stateName : data.stateNameEs;

  const title = `${data.docTypeLabelEn} for ${data.stateName} — Free Template & E-Signature | CodecDocument`;
  const desc = `Create a ${data.docTypeLabelEn} for ${data.stateName} with state-specific legal language. Free template, instant preview, and ESIGN Act compliant electronic signature with identity verification.`;
  const canonicalUrl = `${SITE_URL}/${data.docType}-${data.stateSlug}`;

  return (
    <div>
      <SEOHead
        title={title}
        description={desc}
        keywords={`${data.docTypeLabelEn} ${data.stateName}, ${data.docTypeLabelEn} template ${data.stateAbbr}, free ${data.docTypeLabelEn} ${data.stateName}`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId={data.docType === 'nda' ? 'nda' : 'residential-lease'}
        badge={`${data.docTypeLabelEn.toUpperCase()} · ${data.stateAbbr}`}
        color="#2563eb"
        icon={isNda ? FileSignature : Home}
        previewLabel={`${data.docTypeLabelEn} Preview`}
        backgroundImage="/imagen4.jpg"
        titleAccentEn={`${data.docTypeLabelEn} for ${data.stateName}`} titleAccentEs={`${data.docTypeLabelEs} para ${data.stateNameEs}`}
        titleRestEn="" titleRestEs=""
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn={`Create My ${data.docTypeLabelEn}`} ctaLabelEs={`Crear mi ${data.docTypeLabelEs}`}
        ctaHref={data.generatorPath}
        secondaryLabelEn="Sign a Document" secondaryLabelEs="Firmar un Documento"
        secondaryHref="/firma-electronica"
      />

      <IncludedCards
        headingEn={`What's inside your ${data.stateName} ${data.docTypeLabelEn}`}
        headingEs={`Qué incluye tu ${data.docTypeLabelEs} de ${data.stateNameEs}`}
        bodyEn={`Every clause reflects ${data.stateName} law, so you don't have to research it yourself.`}
        bodyEs={`Cada cláusula refleja la ley de ${data.stateNameEs}, para que no tengas que investigarla tú mismo.`}
        color="#2563eb"
        items={data.facts}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion
        items={[
          { qEn: data.faqEn, qEs: data.faqEs, aEn: data.faqAnswerEn, aEs: data.faqAnswerEs },
          ...DEFAULT_FAQ,
        ]}
        heading={
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            {language === 'en' ? `${docLabel} in ${stateLabel} — FAQ` : `${docLabel} en ${stateLabel} — Preguntas Frecuentes`}
          </h2>
        }
      />
      <OtherStatesLinks current={data.stateSlug} docType={data.docType} labelEn={data.docTypeLabelEn} labelEs={data.docTypeLabelEs} />
      <LandingFooter />
    </div>
  );
}
