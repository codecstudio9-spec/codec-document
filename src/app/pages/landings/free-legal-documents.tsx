import { motion } from 'motion/react';
import { FileText, Home, Settings, DollarSign, ArrowRight } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { LandingHero } from '../../components/landing/LandingHero';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from '../../components/landing/LandingSections';

const QUICK_LINKS = [
  { label: 'Create NDA', route: '/generator/nda', icon: FileText, color: '#7c3aed' },
  { label: 'Create Lease Agreement', route: '/generator/residential-lease', icon: Home, color: '#2563eb' },
  { label: 'Create Service Agreement', route: '/generator/service-agreement', icon: Settings, color: '#dc2626' },
  { label: 'Create Promissory Note', route: '/generator/promissory-note', icon: DollarSign, color: '#d97706' },
];

function QuickLinksGrid() {
  return (
    <section className="relative bg-slate-950 pb-16 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.a
                key={item.route}
                href={item.route}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/8"
              >
                <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: `${item.color}33`, border: `1px solid ${item.color}55` }}>
                  <Icon className="size-4.5" style={{ color: item.color }} />
                </div>
                <p className="text-sm font-bold text-white">{item.label}</p>
                <span className="flex items-center gap-1 text-xs font-semibold text-white/40 transition group-hover:text-white/70">
                  {'Start now'}
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-1" />
                </span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function FreeLegalDocumentsLanding() {
  const title = 'Free Legal Documents | CodecDocument';
  const desc = 'Create free legal documents online with state-specific templates, ESIGN-compliant signing, and identity verification. Start for free today.';
  const canonicalUrl = `${SITE_URL}/free-legal-documents`;

  return (
    <div>
      <SEOHead title={title} description={desc} canonicalUrl={canonicalUrl} />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="nda"
        badge="FREE"
        color="#4f46e5"
        icon={FileText}
        previewLabel="Legal Document Preview"
        titleAccentEn="Free" titleAccentEs="Free"
        titleRestEn="Legal Documents" titleRestEs="Legal Documents"
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Get Started Free" ctaLabelEs="Get Started Free"
      />

      <QuickLinksGrid />

      <IncludedCards
        headingEn="Why CodecDocument?" headingEs="Why CodecDocument?"
        bodyEn="Build legally structured documents fast, with state-specific language that improves reliability and reduces review time. Our platform combines free templates, audit-ready signing, and identity verification so you can launch with confidence."
        bodyEs="Build legally structured documents fast, with state-specific language that improves reliability and reduces review time. Our platform combines free templates, audit-ready signing, and identity verification so you can launch with confidence."
        color="#4f46e5"
        items={[
          { en: 'Free legal document templates for top business and personal agreements.', es: 'Free legal document templates for top business and personal agreements.' },
          { en: 'ESIGN Act compliant electronic signature and audit trail.', es: 'ESIGN Act compliant electronic signature and audit trail.' },
          { en: 'State-specific clauses for all 50 U.S. states.', es: 'State-specific clauses for all 50 U.S. states.' },
          { en: 'Fast online delivery with no hidden fees.', es: 'Fast online delivery with no hidden fees.' },
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
