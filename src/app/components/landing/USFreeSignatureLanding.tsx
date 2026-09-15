import { MapPin, ArrowRight, FileSignature } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { useLanguage, FixedLanguageProvider } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { StateLawHighlights } from './StateLawHighlights';
import { BenefitCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, PhotoProofSection } from './LandingSections';
import { US_FREE_SIGNATURE_STATES, type USFreeSignatureState } from '../../data/us-free-signature-state-content';

/** Cross-links to the other 14 state pages in this cluster, so the batch
 * reads as a deliberate cluster to a crawler instead of 15 isolated
 * pages, same reasoning as OtherStateHubs in StateLegalDocumentsLanding. */
function OtherFreeSignatureStates({ current }: { current: string }) {
  const others = US_FREE_SIGNATURE_STATES.filter((s) => s.slug !== current);
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">Free digital signature in other states</h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {others.map((s) => (
              <a
                key={s.slug}
                href={`/free-digital-signature-${s.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {s.name}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-slate-400">
            Looking for a specific document type instead?{' '}
            <a href="/free-digital-signature" className="font-semibold text-indigo-600 hover:underline">See every free document type</a>
          </p>
        </div>
      </div>
    </section>
  );
}

/** The real, unique body text per state, in two plain paragraphs. This is
 * what keeps the 15 pages in this batch from reading as a find and
 * replace template: everything below it (hero, highlights, benefit cards)
 * follows the same proven structure as StateLegalDocumentsLanding, but
 * this section is written fresh for each state with real, verifiable
 * facts, never filler. */
function StateIntro({ state }: { state: USFreeSignatureState }) {
  const { language } = useLanguage();
  return (
    <section className="relative bg-white py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-slate-700">
          <p>{language === 'en' ? state.introEn : state.introEs}</p>
          <p>{language === 'en' ? state.localEn : state.localEs}</p>
        </div>
      </div>
    </section>
  );
}

export function USFreeSignatureLanding({ state }: { state: USFreeSignatureState }) {
  return (
    <FixedLanguageProvider defaultLanguage="en">
      <USFreeSignatureLandingContent state={state} />
    </FixedLanguageProvider>
  );
}

function USFreeSignatureLandingContent({ state }: { state: USFreeSignatureState }) {
  const title = `Free Digital Signature in ${state.name} | CodecDocument`;
  const desc = `Sign documents electronically for free in ${state.name}. Real identity verification, a SHA-256 audit trail, and full legal validity under the E-SIGN Act and ${state.name}'s own Uniform Electronic Transactions Act (${state.lawBadge}).`;
  const canonicalUrl = `${SITE_URL}/free-digital-signature-${state.slug}`;

  return (
    <div>
      <SEOHead
        title={title}
        description={desc}
        keywords={`free digital signature ${state.name}, free electronic signature ${state.name}, e-sign ${state.abbreviation}, sign documents online free ${state.name}`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge={state.abbreviation}
        color="#2563eb"
        icon={MapPin}
        previewLabel={`${state.name} Signature Preview`}
        backgroundImage="/imagen2.jpg"
        titleAccentEn="Free Digital Signature" titleAccentEs="Free Digital Signature"
        titleRestEn={`in ${state.name}`} titleRestEs={`in ${state.name}`}
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Sign a Document Free" ctaLabelEs="Sign a Document Free"
        ctaHref="/firma-electronica"
        secondaryLabelEn="See Pricing" secondaryLabelEs="See Pricing"
        secondaryHref="/pricing"
        trustBadges={[
          { en: 'No Credit Card', es: 'No Credit Card' },
          { en: 'Instant Access', es: 'Instant Access' },
          { en: 'Identity Verified', es: 'Identity Verified' },
          { en: 'SHA-256 Audit Trail', es: 'SHA-256 Audit Trail' },
        ]}
      />

      <StateIntro state={state} />
      <StateLawHighlights stateName={state.name} stateNameEs={state.name} highlights={state.highlights} />

      <PhotoProofSection
        image="/images/home/why-1-pointing.jpg"
        captionEn="Open the app, fill it in, sign. That's the whole process."
        captionEs="Open the app, fill it in, sign. That's the whole process."
        pointsEn={['No credit card required', 'A free document and signature every 72 hours', 'Works on any phone or computer']}
        pointsEs={['No credit card required', 'A free document and signature every 72 hours', 'Works on any phone or computer']}
      />
      <BenefitCards />
      <HowItWorksTimeline
        headingEn={`How to sign a document online in ${state.name}`} headingEs={`How to sign a document online in ${state.name}`}
        lastStepDescEn={`Download a clean PDF with a SHA-256 audit trail, valid under ${state.name} and federal law.`}
        lastStepDescEs={`Download a clean PDF with a SHA-256 audit trail, valid under ${state.name} and federal law.`}
      />
      <SocialProofBand
        complianceItems={['Identity Verified', 'SHA-256 Audit Trail', 'SSL / TLS Encrypted']}
        taglineEn={`Used by freelancers, landlords, and small businesses across ${state.name}.`}
        taglineEs={`Used by freelancers, landlords, and small businesses across ${state.name}.`}
      />
      <FAQAccordion
        items={state.faqs}
        heading={<h2 className="text-3xl font-black text-slate-900 md:text-4xl">Frequently asked questions</h2>}
      />
      <OtherFreeSignatureStates current={state.slug} />

      <section className="relative bg-slate-950 py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.18), transparent)' }} />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
              <FileSignature className="size-3.5" /> Free Plan
            </span>
            <h3 className="mb-3 text-2xl font-black text-white md:text-3xl">
              Sign your first {state.name} document free today
            </h3>
            <p className="mb-6 text-sm text-white/70">
              No credit card, real identity verification, and a signature that holds up under {state.name} and federal law.
            </p>
            <a
              href="/firma-electronica"
              className="group inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-[0_4px_24px_rgba(99,102,241,0.40)] transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)' }}
            >
              Start Free Now
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
