import { Receipt } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from './LandingSections';
import type { QuoteSeoPageConfig } from '../../data/quote-seo-content';

/** Shared template for the 10 Smart Quotes SEO landing pages (5 US
 * English + 5 LatAm Spanish, see quote-seo-content.ts) — same component
 * set and visual system as every other landing page (LandingHero,
 * IncludedCards, BenefitCards, HowItWorksTimeline, SocialProofBand,
 * FAQAccordion), so these read as real product pages, not flat SEO
 * doorway pages. The CTA goes straight to the real quote builder
 * (/my-quotes/new), not a generic document generator. */
export function QuoteSeoLanding({ page }: { page: QuoteSeoPageConfig }) {
  const canonicalUrl = `${SITE_URL}/${page.slug}`;

  return (
    <div>
      <SEOHead title={page.titleTag} description={page.metaDescription} keywords={page.keywords} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="quote"
        badge={page.badge}
        color="#4338CA"
        icon={Receipt}
        previewLabel={page.language === 'es' ? 'Vista previa de cotización' : 'Quote Preview'}
        backgroundImage="/imagen4.jpg"
        titleAccentEn={page.heroAccent} titleAccentEs={page.heroAccent}
        titleRestEn={page.heroRest} titleRestEs={page.heroRest}
        subtitleEn={page.heroSubtitle} subtitleEs={page.heroSubtitle}
        ctaLabelEn={page.ctaLabel} ctaLabelEs={page.ctaLabel}
        ctaHref="/my-quotes/new"
        secondaryLabelEn={page.secondaryLabel} secondaryLabelEs={page.secondaryLabel}
        secondaryHref="/my-quotes/new"
      />

      <IncludedCards
        headingEn={page.includedHeading} headingEs={page.includedHeading}
        bodyEn={page.includedBody} bodyEs={page.includedBody}
        color="#4338CA"
        items={page.includedItems.map((item) => ({ en: item, es: item }))}
      />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion
        items={[
          { qEn: page.faqQ, qEs: page.faqQ, aEn: page.faqA, aEs: page.faqA },
          ...DEFAULT_FAQ,
        ]}
      />
      <LandingFooter />
    </div>
  );
}
