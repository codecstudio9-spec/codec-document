import { Home } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { LandingHero } from '../../components/landing/LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from '../../components/landing/LandingSections';
import { StateQuickLinks } from '../../components/landing/StateQuickLinks';

export default function OnlineLeaseAgreementLanding() {
  const title = 'Free Online Lease Agreement Generator | CodecDocument';
  const desc = 'Create state-specific residential lease agreements online. Fill forms, preview, sign electronically, and get identity verification with audit-ready PDFs.';
  const canonicalUrl = `${SITE_URL}/online-lease-agreement`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge="LEASE"
        color="#2563eb"
        icon={Home}
        previewLabel="Lease Agreement Preview"
        backgroundImage="/imagen1.jpg"
        titleAccentEn="Online Lease" titleAccentEs="Online Lease"
        titleRestEn="Agreement Generator" titleRestEs="Agreement Generator"
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Start Lease Agreement" ctaLabelEs="Start Lease Agreement"
      />

      <IncludedCards
        headingEn="Why use our Lease Generator?" headingEs="Why use our Lease Generator?"
        bodyEn="Generate lease agreements with built-in state compliance and e-signatures so you can reduce risk, speed move-ins, and protect your rental business."
        bodyEs="Generate lease agreements with built-in state compliance and e-signatures so you can reduce risk, speed move-ins, and protect your rental business."
        color="#2563eb"
        items={[
          { en: 'State-specific lease terms for all 50 states.', es: 'State-specific lease terms for all 50 states.' },
          { en: 'Tenant selfie + ID verification with geolocation.', es: 'Tenant selfie + ID verification with geolocation.' },
          { en: 'Audit-ready signed PDFs with tamper indication.', es: 'Audit-ready signed PDFs with tamper indication.' },
          { en: 'Modern mobile-friendly signing flow for landlords.', es: 'Modern mobile-friendly signing flow for landlords.' },
        ]}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion items={DEFAULT_FAQ} />
      <StateQuickLinks docType="lease-agreement" labelEn="Lease Agreement" labelEs="Contrato de Arrendamiento" />
      <LandingFooter />
    </div>
  );
}
