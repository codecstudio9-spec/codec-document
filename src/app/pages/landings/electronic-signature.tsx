import { PenLine } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { LandingHero } from '../../components/landing/LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from '../../components/landing/LandingSections';

export default function ElectronicSignatureLanding() {
  const title = 'Free Electronic Signature Platform | CodecDocument';
  const desc = 'ESIGN Act compliant electronic signatures with selfie identity verification, geolocation audit trail and secure online signing for NDAs, leases, service agreements and more.';
  const canonicalUrl = `${SITE_URL}/electronic-signature`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge="E-SIGNATURE"
        color="#2563eb"
        icon={PenLine}
        previewLabel="Signature Audit Preview"
        backgroundImage="/imagen3.jpg"
        titleAccentEn="Electronic Signatures" titleAccentEs="Electronic Signatures"
        titleRestEn="— Create, Sign & Verify" titleRestEs="— Create, Sign & Verify"
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Sign a Document" ctaLabelEs="Sign a Document"
        ctaHref="/firma-electronica"
        secondaryLabelEn="Sign NDA" secondaryLabelEs="Sign NDA"
        secondaryHref="/generator/nda"
      />

      <IncludedCards
        headingEn="Why choose our e-signature workflow?" headingEs="Why choose our e-signature workflow?"
        bodyEn="CodecDocument combines secure digital signing with identity verification so every signature is traceable, legally compliant, and ready for review by contracts teams or attorneys."
        bodyEs="CodecDocument combines secure digital signing with identity verification so every signature is traceable, legally compliant, and ready for review by contracts teams or attorneys."
        color="#2563eb"
        items={[
          { en: 'Selfie + ID capture embedded directly in PDF audit pages.', es: 'Selfie + ID capture embedded directly in PDF audit pages.' },
          { en: 'SHA-256 hash audit trail for every signed agreement.', es: 'SHA-256 hash audit trail for every signed agreement.' },
          { en: 'Geolocation and timestamp logging for signer validation.', es: 'Geolocation and timestamp logging for signer validation.' },
          { en: 'Daily free signatures with premium unlimited signing plans.', es: 'Daily free signatures with premium unlimited signing plans.' },
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
