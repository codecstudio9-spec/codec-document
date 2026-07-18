import { MapPin } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { useLanguage } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { StateLawHighlights } from './StateLawHighlights';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from './LandingSections';
import type { CitySeoConfig } from '../../data/city-seo-content';

/** City hub page (first: San Jose, California) — same section layout as
 * StateLegalDocumentsLanding, but the city name is used ONLY in the SEO
 * <title>/description/keywords (real "documents in San Jose" search
 * intent) — the visible hero and body honestly talk about California law,
 * never shouting the city name, per explicit instruction. Real content is
 * California's (city.state), reused as-is — legally accurate, since these
 * documents follow state law, not city ordinances. */
export function CityLegalDocumentsLanding({ city }: { city: CitySeoConfig }) {
  const { language } = useLanguage();
  const state = city.state;

  const title = `Free Legal Documents & E-Signatures in ${city.cityName}, ${state.name} | CodecDocument`;
  const desc = `Create legally-vetted documents and ESIGN Act compliant e-signatures in ${city.cityName}, ${state.name} — under ${state.name} law. Free NDA, lease agreement, and contract templates with identity verification and audit trail.`;
  const canonicalUrl = `${SITE_URL}/${city.slug}`;

  // Hero/body copy — deliberately about California, not "San Jose".
  const heroSubtitle = language === 'en'
    ? `Create legally-vetted documents under ${state.name} law, with ESIGN Act compliant electronic signatures.`
    : `Crea documentos con validez legal bajo las leyes de ${state.nameEs}, con firmas electrónicas conformes a ESIGN Act.`;

  const stateFaq = { qEn: state.faqEn, qEs: state.faqEs, aEn: state.faqAnswerEn, aEs: state.faqAnswerEs };

  return (
    <div>
      <SEOHead
        title={title}
        description={desc}
        keywords={`legal documents ${city.cityName}, electronic signature ${city.cityName}, ${city.cityName} ${state.name} documents, e-sign ${state.abbreviation}`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge={state.abbreviation}
        color="#2563eb"
        icon={MapPin}
        previewLabel={`${state.name} Document Preview`}
        backgroundImage="/imagen2.jpg"
        titleAccentEn={state.name} titleAccentEs={state.nameEs}
        titleRestEn="— Legal Documents & E-Signatures" titleRestEs="— Documentos Legales y Firma Electrónica"
        subtitleEn={heroSubtitle} subtitleEs={heroSubtitle}
        ctaLabelEn="Create a Document" ctaLabelEs="Crear un Documento"
        ctaHref="/"
        secondaryLabelEn="Sign a Document" secondaryLabelEs="Firmar un Documento"
        secondaryHref="/firma-electronica"
      />

      <IncludedCards
        headingEn={`Built for ${state.name} law`} headingEs={`Hecho para las leyes de ${state.nameEs}`}
        bodyEn={`Every template adapts to ${state.name}-specific legal requirements, so your documents reflect local rules from the start.`}
        bodyEs={`Cada plantilla se adapta a los requisitos legales específicos de ${state.nameEs}, para que tus documentos reflejen las reglas locales desde el inicio.`}
        color="#2563eb"
        items={[
          { en: `${state.name}-specific clauses and disclosure language.`, es: `Cláusulas y avisos específicos de ${state.nameEs}.` },
          { en: 'ESIGN Act & UETA compliant electronic signatures.', es: 'Firmas electrónicas conformes a ESIGN Act y UETA.' },
          { en: 'Selfie + ID identity verification embedded in every audit page.', es: 'Verificación de identidad con selfie + ID incluida en cada página de auditoría.' },
          { en: 'Free plan: 2 documents and 2 signatures every 72 hours.', es: 'Plan gratuito: 2 documentos y 2 firmas cada 72 horas.' },
        ]}
      />

      <StateLawHighlights stateName={state.name} stateNameEs={state.nameEs} highlights={state.highlights} />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion items={[stateFaq, ...DEFAULT_FAQ]} />
      <LandingFooter />
    </div>
  );
}
