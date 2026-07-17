import { TrendingUp } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { LandingHero } from '../../components/landing/LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from '../../components/landing/LandingSections';
import { StateQuickLinks } from '../../components/landing/StateQuickLinks';

export default function PromissoryNoteLanding() {
  const title = 'Free Promissory Note Generator | CodecDocument';
  const desc = 'Create promissory notes for personal or business loans with clear payment terms, interest schedules, and secure e-signatures.';
  const canonicalUrl = `${SITE_URL}/promissory-note`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="promissory-note"
        badge="FINANCE"
        color="#d97706"
        icon={TrendingUp}
        previewLabel="Promissory Note Preview"
        backgroundImage="/imagen2.jpg"
        titleAccentEn="Promissory Note" titleAccentEs="Promissory Note"
        titleRestEn="Generator" titleRestEs="Generator"
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Create Promissory Note" ctaLabelEs="Create Promissory Note"
      />

      <IncludedCards
        headingEn="Loan agreements that protect both parties" headingEs="Loan agreements that protect both parties"
        bodyEn="Create a clear payment agreement for loans between individuals or business partners, with documentation that supports accountability and repayment clarity."
        bodyEs="Create a clear payment agreement for loans between individuals or business partners, with documentation that supports accountability and repayment clarity."
        color="#d97706"
        items={[
          { en: 'Define borrower, lender, loan amount, and repayment terms.', es: 'Define borrower, lender, loan amount, and repayment terms.' },
          { en: 'Include interest rate, due date, and late fee provisions.', es: 'Include interest rate, due date, and late fee provisions.' },
          { en: 'Collect electronic signatures with audit evidence.', es: 'Collect electronic signatures with audit evidence.' },
          { en: 'Download a reliable PDF for your records.', es: 'Download a reliable PDF for your records.' },
        ]}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion items={DEFAULT_FAQ} />
      <StateQuickLinks docType="promissory-note" labelEn="Promissory Note" labelEs="Pagaré" />
      <LandingFooter />
    </div>
  );
}
