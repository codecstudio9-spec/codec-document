import { MapPin, FileSignature, Home, Briefcase, Handshake, TrendingUp, Car, ArrowRight } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { useLanguage } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { StateLawHighlights } from './StateLawHighlights';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, DEFAULT_FAQ } from './LandingSections';
import type { StateSeoConfig } from '../../data/state-seo-content';
import { STATES } from '../../data/doctype-state-seo-content';

/** Cross-links to the other state hub pages — completes the cluster so a
 * visitor comparing states, or Google crawling the cluster, can move
 * between every state hub without going back through the sitemap. */
function OtherStateHubs({ current }: { current: string }) {
  const { language } = useLanguage();
  const others = STATES.filter((s) => s.slug !== current);
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">
            {language === 'en' ? 'Other states' : 'Otros estados'}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {others.map((s) => (
              <a
                key={s.slug}
                href={`/legal-documents-${s.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {language === 'en' ? s.name : s.nameEs}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Links down into the doc-type × state pages for this state — the state
 * hub is the entry point, these are where a visitor with a specific
 * document in mind actually converts. */
function DocTypeLinks({ state }: { state: StateSeoConfig }) {
  const { language } = useLanguage();
  const links = [
    { href: `/nda-${state.slug}`, icon: FileSignature, en: 'NDA', es: 'NDA' },
    { href: `/lease-agreement-${state.slug}`, icon: Home, en: 'Lease Agreement', es: 'Contrato de Arrendamiento' },
    { href: `/independent-contractor-${state.slug}`, icon: Briefcase, en: 'Independent Contractor', es: 'Contratista Independiente' },
    { href: `/service-agreement-${state.slug}`, icon: Handshake, en: 'Service Agreement', es: 'Acuerdo de Servicio' },
    { href: `/promissory-note-${state.slug}`, icon: TrendingUp, en: 'Promissory Note', es: 'Pagaré' },
    { href: `/vehicle-bill-of-sale-${state.slug}`, icon: Car, en: 'Vehicle Bill of Sale', es: 'Compraventa de Vehículo' },
  ];
  return (
    <section className="relative bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">
            {language === 'en' ? `${state.name} document templates` : `Plantillas de documentos de ${state.nameEs}`}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
              >
                <l.icon className="size-4 text-indigo-500" />
                {language === 'en' ? l.en : l.es}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

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
      <DocTypeLinks state={state} />

      <BenefitCards />
      <HowItWorksTimeline />
      <SocialProofBand />
      <FAQAccordion items={[stateFaq, ...DEFAULT_FAQ]} />
      <OtherStateHubs current={state.slug} />
      <LandingFooter />
    </div>
  );
}
