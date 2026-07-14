import { ShieldCheck } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { LandingHero } from '../../components/landing/LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from '../../components/landing/LandingSections';

export default function NdaGeneratorLanding() {
  const title = 'Free NDA Generator | CodecDocument';
  const desc = 'Generate NDAs tailored to your business and state. Sign securely online with identity verification and a full audit trail.';
  const canonicalUrl = `${SITE_URL}/nda-generator`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="nda"
        badge="NDA"
        color="#7c3aed"
        icon={ShieldCheck}
        previewLabel="NDA Preview"
        titleAccentEn="NDA" titleAccentEs="NDA"
        titleRestEn="Generator" titleRestEs="Generator"
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Create Free NDA" ctaLabelEs="Create Free NDA"
      />

      <IncludedCards
        headingEn="Why NDAs matter" headingEs="Why NDAs matter"
        bodyEn="Protect your business, employees, and partners with a legally sound NDA. Our generator helps you lock in confidentiality terms quickly and consistently."
        bodyEs="Protect your business, employees, and partners with a legally sound NDA. Our generator helps you lock in confidentiality terms quickly and consistently."
        color="#7c3aed"
        items={[
          { en: 'Customize parties, duration, and disclosure scope.', es: 'Customize parties, duration, and disclosure scope.' },
          { en: 'Use state-specific governance clauses for reliability.', es: 'Use state-specific governance clauses for reliability.' },
          { en: 'Sign online with biometric identity capture.', es: 'Sign online with biometric identity capture.' },
          { en: 'Download an audit-ready PDF for every transaction.', es: 'Download an audit-ready PDF for every transaction.' },
        ]}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion items={DEFAULT_FAQ} />
      <LandingFooter />
    </div>
  );
}
