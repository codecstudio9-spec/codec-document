import { Briefcase } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { LandingHero } from '../../components/landing/LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from '../../components/landing/LandingSections';
import { StateQuickLinks } from '../../components/landing/StateQuickLinks';

export default function IndependentContractorLanding() {
  const title = 'Independent Contractor Agreement | CodecDocument';
  const desc = 'Create independent contractor agreements quickly. Protect your freelance work with clear payment terms, scope, and secure online signatures.';
  const canonicalUrl = `${SITE_URL}/independent-contractor-agreement`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="independent-contractor"
        badge="FREELANCE"
        color="#059669"
        icon={Briefcase}
        previewLabel="Contractor Agreement Preview"
        backgroundImage="/imagen4.jpg"
        titleAccentEn="Independent Contractor" titleAccentEs="Independent Contractor"
        titleRestEn="Agreement" titleRestEs="Agreement"
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Create Agreement" ctaLabelEs="Create Agreement"
      />

      <IncludedCards
        headingEn="Protect your freelance business" headingEs="Protect your freelance business"
        bodyEn="Build contracts that clearly define scope, payment schedule, deliverables, and ownership rights so both parties know what to expect."
        bodyEs="Build contracts that clearly define scope, payment schedule, deliverables, and ownership rights so both parties know what to expect."
        color="#059669"
        items={[
          { en: 'Custom payment terms and milestone language.', es: 'Custom payment terms and milestone language.' },
          { en: 'Clear intellectual property and confidentiality sections.', es: 'Clear intellectual property and confidentiality sections.' },
          { en: 'ESIGN-compliant signature collection and PDF audit reports.', es: 'ESIGN-compliant signature collection and PDF audit reports.' },
          { en: 'Fast contract generation for one-off gigs or ongoing retainers.', es: 'Fast contract generation for one-off gigs or ongoing retainers.' },
        ]}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion items={DEFAULT_FAQ} />
      <StateQuickLinks docType="independent-contractor" labelEn="Independent Contractor Agreement" labelEs="Contrato de Contratista Independiente" />
      <LandingFooter />
    </div>
  );
}
