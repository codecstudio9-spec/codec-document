import { MapPin } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { StateLawHighlights } from './StateLawHighlights';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from './LandingSections';
import type { StateSeoConfig } from '../../data/state-seo-content';

/** One shared template, instantiated once per state (see
 * src/app/pages/landings/state-*.tsx) — same premium dark-hero design
 * system as the document-type landing pages (nda-generator.tsx,
 * electronic-signature.tsx, etc.), but built around a state instead of a
 * document type. Real per-state legal facts (StateLawHighlights) are what
 * keep these from being thin, near-duplicate "doorway pages" across the 6
 * states — everything else reuses the same proven sections/copy. */
export function StateLegalDocumentsLanding({ state }: { state: StateSeoConfig }) {
  const title = `Legal Documents & E-Signatures in ${state.name} | CodecDocument`;
  const desc = `Create legally-vetted documents and ESIGN Act compliant e-signatures for ${state.name}. Free NDA, lease agreement, and contract templates with ${state.name}-specific clauses, identity verification, and audit trail.`;
  const canonicalUrl = `${SITE_URL}/legal-documents-${state.slug}`;

  const stateFaq = {
    qEn: state.faqEn, qEs: state.faqEs,
    aEn: state.faqAnswerEn, aEs: state.faqAnswerEs,
  };

  return (
    <div>
      <SEOHead
        title={title}
        description={desc}
        keywords={`legal documents ${state.name}, electronic signature ${state.name}, e-sign ${state.abbreviation}, lease agreement ${state.name}, NDA ${state.name}`}
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
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Create a Document" ctaLabelEs="Crear un Documento"
        ctaHref="/"
        secondaryLabelEn="Sign a Document" secondaryLabelEs="Firmar un Documento"
        secondaryHref="/firma-electronica"
      />

      <IncludedCards
        headingEn={`Built for ${state.name}`} headingEs={`Hecho para ${state.nameEs}`}
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
