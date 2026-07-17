import { Car } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { LandingHero } from '../../components/landing/LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from '../../components/landing/LandingSections';
import { StateQuickLinks } from '../../components/landing/StateQuickLinks';

export default function VehicleBillOfSaleLanding() {
  const title = 'Vehicle Bill of Sale | CodecDocument';
  const desc = 'Create a vehicle bill of sale with buyer and seller details, odometer disclosure, and secure e-signatures. Download an audit-ready PDF instantly.';
  const canonicalUrl = `${SITE_URL}/vehicle-bill-of-sale`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="bill-of-sale-vehicle"
        badge="VEHICLE"
        color="#0891b2"
        icon={Car}
        previewLabel="Bill of Sale Preview"
        backgroundImage="/imagen1.jpg"
        titleAccentEn="Vehicle Bill" titleAccentEs="Vehicle Bill"
        titleRestEn="of Sale" titleRestEs="of Sale"
        subtitleEn="Generate a vehicle bill of sale that records sale terms, odometer reading, and signatures. Use online signing and verification."
        subtitleEs="Generate a vehicle bill of sale that records sale terms, odometer reading, and signatures. Use online signing and verification."
        ctaLabelEn="Create Bill of Sale" ctaLabelEs="Create Bill of Sale"
      />

      <IncludedCards
        headingEn="Sell vehicles safely" headingEs="Sell vehicles safely"
        bodyEn="Document the sale with all the information buyers, sellers, and DMV offices expect. Complete the transaction online and keep a secure copy for your records."
        bodyEs="Document the sale with all the information buyers, sellers, and DMV offices expect. Complete the transaction online and keep a secure copy for your records."
        color="#0891b2"
        items={[
          { en: 'Buyer/seller information and vehicle details.', es: 'Buyer/seller information and vehicle details.' },
          { en: 'Odometer disclosure and sale price.', es: 'Odometer disclosure and sale price.' },
          { en: 'ESIGN-compliant signature with audit trail.', es: 'ESIGN-compliant signature with audit trail.' },
          { en: 'Instant downloadable PDF for DMV or title transfer.', es: 'Instant downloadable PDF for DMV or title transfer.' },
        ]}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion items={DEFAULT_FAQ} />
      <StateQuickLinks docType="vehicle-bill-of-sale" labelEn="Vehicle Bill of Sale" labelEs="Contrato de Compraventa de Vehículo" />
      <LandingFooter />
    </div>
  );
}
