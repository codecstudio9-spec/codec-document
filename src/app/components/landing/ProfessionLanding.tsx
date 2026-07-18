import { ArrowRight, Check } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { BenefitCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, type FaqItem } from './LandingSections';
import { PROFESSION_PAGES, type ProfessionConfig } from '../../data/profession-seo-content';

/** Cross-links to the other 7 profession pages — same "complete the
 * cluster" pattern used across every SEO batch this session. */
function OtherProfessionLinks({ current }: { current: string }) {
  const others = PROFESSION_PAGES.filter((p) => p.slug !== current);
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">También para tu sector</h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {others.map((p) => (
              <a
                key={p.slug}
                href={`/firma-electronica-para-${p.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {p.h1RestEs.replace('para ', '')}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfessionLanding({ profession }: { profession: ProfessionConfig }) {
  const canonicalUrl = `${SITE_URL}/firma-electronica-para-${profession.slug}`;
  const Icon = profession.icon;

  const faq: FaqItem = {
    qEn: profession.faqQEs, qEs: profession.faqQEs,
    aEn: profession.faqAEs, aEs: profession.faqAEs,
  };

  return (
    <div>
      <SEOHead
        title={profession.titleEs}
        description={profession.descEs}
        keywords={`firma electronica ${profession.slug}, firma electronica para ${profession.slug}, firmar documentos ${profession.slug}`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge={profession.badgeEs}
        color={profession.color}
        icon={Icon}
        previewLabel={profession.h1AccentEs}
        backgroundImage="/imagen4.jpg"
        titleAccentEn={profession.h1AccentEs} titleAccentEs={profession.h1AccentEs}
        titleRestEn={profession.h1RestEs} titleRestEs={profession.h1RestEs}
        subtitleEn={profession.painPointEs} subtitleEs={profession.painPointEs}
        ctaLabelEn="Empieza Gratis Ahora" ctaLabelEs="Empieza Gratis Ahora"
        ctaHref="/firma-electronica"
        secondaryLabelEn="Ver Precios" secondaryLabelEs="Ver Precios"
        secondaryHref="/#plan-ultimate"
        trustBadges={[
          { en: 'Sin Tarjeta de Crédito', es: 'Sin Tarjeta de Crédito' },
          { en: 'Identidad Verificada', es: 'Identidad Verificada' },
          { en: 'Auditoría SHA-256', es: 'Auditoría SHA-256' },
          { en: 'Tu Propia Marca', es: 'Tu Propia Marca' },
        ]}
      />

      <section className="relative bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Casos de uso frecuentes</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {profession.useCasesEs.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ borderLeftWidth: 3, borderLeftColor: profession.color }}
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: `${profession.color}1a` }}>
                    <Check className="size-3.5" style={{ color: profession.color }} />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{profession.includedHeadingEs}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500">{profession.includedBodyEs}</p>
          </div>
        </div>
      </section>

      <BenefitCards />
      <HowItWorksTimeline
        headingEn="Cómo firmar un documento online" headingEs="Cómo firmar un documento online"
        lastStepDescEn="Recibe un PDF limpio con pista de auditoría SHA-256 — con validez legal según la ley de tu país."
        lastStepDescEs="Recibe un PDF limpio con pista de auditoría SHA-256 — con validez legal según la ley de tu país."
      />
      <SocialProofBand
        complianceItems={['Identidad Verificada', 'SHA-256 Audit Trail', 'SSL / TLS Encrypted']}
        taglineEn={`Usado por profesionales del sector en toda Latinoamérica.`}
        taglineEs={`Usado por profesionales del sector en toda Latinoamérica.`}
      />
      <FAQAccordion items={[faq]} heading={<h2 className="text-3xl font-black text-slate-900 md:text-4xl">Preguntas frecuentes</h2>} />
      <OtherProfessionLinks current={profession.slug} />
      <LandingFooter />
    </div>
  );
}
