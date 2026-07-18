import { PenLine, ArrowRight, ShieldCheck, Camera, FileCheck } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { useLanguage } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { CountryLawHighlights } from './CountryLawHighlights';
import { BenefitCards, IncludedCards, HowItWorksTimeline, SocialProofBand, FAQAccordion } from './LandingSections';
import { LATAM_COUNTRIES, LATAM_GENERAL_FAQ, type LatamCountryConfig } from '../../data/latam-signature-seo-content';

/** Cross-links to the other 5 LatAm country pages — same reasoning as
 * OtherStateHubs in StateLegalDocumentsLanding.tsx: completes the
 * cluster so a visitor (or a crawler) can move between every country
 * page without going back through the sitemap. */
function OtherCountryLinks({ current }: { current: string }) {
  const { language } = useLanguage();
  const others = LATAM_COUNTRIES.filter((c) => c.slug !== current);
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">
            {language === 'en' ? 'Also available in' : 'También disponible en'}
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {others.map((c) => (
              <a
                key={c.slug}
                href={`/firma-electronica-${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span>{c.flag}</span>
                {language === 'en' ? c.name : c.nameEs}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** One shared template, instantiated once per LatAm country (see
 * src/app/pages/landings/firma-electronica-*.tsx) — same premium
 * dark-hero design system as the US state/doctype pages, but scoped to
 * e-signature only, and with locally-accurate legal-compliance copy
 * (own law citations, no ESIGN Act / UETA claims) instead of reusing
 * the US pages' claims. Same product, same pricing/plans as the rest of
 * the platform — this only changes which law is cited and which
 * language/market the copy is written for. */
export function CountrySignatureLanding({ country }: { country: LatamCountryConfig }) {
  const { language } = useLanguage();

  const title = `Firma Electrónica en ${country.nameEs} | Válida y Legal — CodecDocument`;
  const desc = language === 'en'
    ? `Sign documents electronically in ${country.name}, fully compliant with local law (${country.lawBadgeEn}). Free plan, identity verification, and a SHA-256 audit trail on every signature.`
    : `Firma documentos electrónicamente en ${country.nameEs}, con total cumplimiento de la ley local (${country.lawBadgeEs}). Plan gratuito, verificación de identidad y pista de auditoría SHA-256 en cada firma.`;
  const canonicalUrl = `${SITE_URL}/firma-electronica-${country.slug}`;

  const countryFaq = {
    qEn: country.faqEn, qEs: country.faqEs,
    aEn: country.faqAnswerEn, aEs: country.faqAnswerEs,
  };

  const trustBadges = [
    { en: country.lawBadgeEn, es: country.lawBadgeEs },
    { en: 'Full Legal Validity', es: 'Validez Jurídica Plena' },
    { en: 'Identity Verification', es: 'Verificación de Identidad' },
    { en: 'SHA-256 Audit Trail', es: 'Pista de Auditoría SHA-256' },
  ];

  const complianceItems = [
    language === 'en' ? country.lawBadgeEn : country.lawBadgeEs,
    'SHA-256 Audit Trail', 'Verificación de Identidad', 'SSL / TLS Encrypted',
  ];

  return (
    <div>
      <SEOHead
        title={title}
        description={desc}
        keywords={`firma electrónica ${country.nameEs}, firmar documentos ${country.nameEs}, firma digital ${country.nameEs}, e-signature ${country.name}, ${country.lawBadgeEs}`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge={`${country.flag} ${country.code} · FIRMA ELECTRÓNICA`}
        color="#2563eb"
        icon={PenLine}
        previewLabel={language === 'en' ? `${country.name} Signature Audit Preview` : `Vista Previa de Firma — ${country.nameEs}`}
        backgroundImage="/imagen3.jpg"
        titleAccentEn="Electronic Signature" titleAccentEs="Firma Electrónica"
        titleRestEn={`in ${country.name}`} titleRestEs={`en ${country.nameEs}`}
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Sign a Document" ctaLabelEs="Firmar un Documento"
        ctaHref="/firma-electronica"
        secondaryLabelEn="See Pricing" secondaryLabelEs="Ver Precios"
        secondaryHref="/#plan-ultimate"
        trustBadges={trustBadges}
      />

      <IncludedCards
        headingEn={`Built for ${country.name}`} headingEs={`Hecho para ${country.nameEs}`}
        bodyEn={`Every signature is legally valid under ${country.lawBadgeEn}, backed by real identity verification and a cryptographic audit trail — not just a drawn signature on a screen.`}
        bodyEs={`Cada firma tiene validez jurídica bajo la ${country.lawBadgeEs}, respaldada por verificación de identidad real y una pista de auditoría criptográfica — no solo un trazo en la pantalla.`}
        color="#2563eb"
        items={[
          { en: `Signatures legally valid under ${country.lawBadgeEn}.`, es: `Firmas con validez jurídica bajo la ${country.lawBadgeEs}.` },
          { en: 'Selfie + ID capture embedded directly in the PDF audit page.', es: 'Captura de selfie + identificación incrustada directamente en la página de auditoría del PDF.' },
          { en: 'SHA-256 cryptographic hash audit trail for every signed agreement.', es: 'Pista de auditoría con hash criptográfico SHA-256 para cada acuerdo firmado.' },
          { en: 'Same free plan and premium plans available across the whole platform.', es: 'El mismo plan gratuito y los mismos planes premium disponibles en toda la plataforma.' },
        ]}
      />

      <CountryLawHighlights countryName={country.name} countryNameEs={country.nameEs} highlights={country.highlights} />

      <BenefitCards
        items={[
          { icon: PenLine, en: 'Secure Signatures', es: 'Firmas Seguras' },
          { icon: Camera, en: 'Identity Verification', es: 'Verificación de Identidad' },
          { icon: FileCheck, en: 'Audit Trail', es: 'Pista de Auditoría' },
          { icon: ShieldCheck, en: 'Legally Valid', es: 'Con Validez Legal' },
        ]}
      />
      <HowItWorksTimeline
        lastStepDescEn={`Receive a clean, watermark-free PDF with SHA-256 audit trail — admissible as evidence under ${country.lawBadgeEn}.`}
        lastStepDescEs={`Recibe un PDF limpio con pista de auditoría SHA-256 — admisible como prueba bajo la ${country.lawBadgeEs}.`}
      />
      <SocialProofBand
        complianceItems={complianceItems}
        taglineEn={`Used by freelancers, landlords, agencies and small businesses across ${country.name}.`}
        taglineEs={`Usado por freelancers, propietarios, agencias y pequeños negocios en toda ${country.nameEs}.`}
      />
      <FAQAccordion items={[countryFaq, ...LATAM_GENERAL_FAQ]} />
      <OtherCountryLinks current={country.slug} />
      <LandingFooter />
    </div>
  );
}
