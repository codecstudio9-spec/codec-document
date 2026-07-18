import { ArrowRight, Check, Zap } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { LandingHero } from './LandingHero';
import { BenefitCards, HowItWorksTimeline, SocialProofBand, FAQAccordion, type FaqItem } from './LandingSections';
import { FREE_FEATURE_PAGES, FREE_PLAN_FACTS_ES, type FreeFeatureConfig } from '../../data/free-feature-seo-content';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

/** Free-plan facts block — the one thing EVERY page in this batch must
 * show clearly per the spec, kept as its own component so the exact
 * same 4 facts + CTA render identically everywhere instead of being
 * retyped per page. */
function FreePlanBlock() {
  return (
    <section className="relative bg-slate-950 py-16 md:py-20">
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(37,99,235,0.18), transparent)' }} />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
            <Zap className="size-3.5" /> Plan Gratuito
          </span>
          <div className="grid gap-3 text-left sm:grid-cols-2">
            {FREE_PLAN_FACTS_ES.map((fact) => (
              <div key={fact} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/5 px-4 py-3">
                <Check className="size-4 shrink-0 text-emerald-400" />
                <span className="text-sm font-medium text-white/80">{fact}</span>
              </div>
            ))}
          </div>
          <a
            href="/firma-electronica"
            className="group mt-6 inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-[0_4px_24px_rgba(99,102,241,0.40)] transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)' }}
          >
            Empieza Gratis Ahora
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
}

/** Cross-links to the other 6 pages in this batch — same "complete the
 * cluster" reasoning as OtherStateHubs / OtherCountryLinks. */
function OtherFreeFeatureLinks({ current }: { current: string }) {
  const others = FREE_FEATURE_PAGES.filter((p) => p.slug !== current);
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">Más funciones gratuitas</h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {others.map((p) => (
              <a
                key={p.slug}
                href={`/${p.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {p.h1AccentEs} {p.h1RestEs}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-slate-400">
            ¿Buscas la ley específica de tu país?{' '}
            {LATAM_COUNTRIES.map((c, i) => (
              <span key={c.slug}>
                <a href={`/firma-electronica-${c.slug}`} className="font-semibold text-indigo-600 hover:underline">{c.nameEs}</a>
                {i < LATAM_COUNTRIES.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

export function FreeFeatureLanding({ page }: { page: FreeFeatureConfig }) {
  const canonicalUrl = `${SITE_URL}/${page.slug}`;
  const Icon = page.icon;

  const faq: FaqItem = {
    qEn: page.faqQEs, qEs: page.faqQEs,
    aEn: page.faqAEs, aEs: page.faqAEs,
  };

  return (
    <div>
      <SEOHead
        title={page.titleEs}
        description={page.descEs}
        keywords={`${page.h1AccentEs.toLowerCase()} ${page.h1RestEs.toLowerCase()}, firma electronica gratis, firmar documentos gratis online`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge={page.badgeEs}
        color={page.color}
        icon={Icon}
        previewLabel={page.h1AccentEs}
        backgroundImage="/imagen1.jpg"
        titleAccentEn={page.h1AccentEs} titleAccentEs={page.h1AccentEs}
        titleRestEn={page.h1RestEs} titleRestEs={page.h1RestEs}
        subtitleEn={page.descEs} subtitleEs={page.descEs}
        ctaLabelEn="Empieza Gratis Ahora" ctaLabelEs="Empieza Gratis Ahora"
        ctaHref="/firma-electronica"
        secondaryLabelEn="Ver Precios" secondaryLabelEs="Ver Precios"
        secondaryHref="/#plan-ultimate"
        trustBadges={[
          { en: 'Sin Tarjeta de Crédito', es: 'Sin Tarjeta de Crédito' },
          { en: 'Acceso Inmediato', es: 'Acceso Inmediato' },
          { en: 'Identidad Verificada', es: 'Identidad Verificada' },
          { en: 'Auditoría SHA-256', es: 'Auditoría SHA-256' },
        ]}
      />

      <section className="relative bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{page.includedHeadingEs}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-slate-500">{page.includedBodyEs}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {page.includedItemsEs.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ borderLeftWidth: 3, borderLeftColor: page.color }}
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full" style={{ background: `${page.color}1a` }}>
                    <Check className="size-3.5" style={{ color: page.color }} />
                  </span>
                  <p className="text-sm font-medium leading-relaxed text-slate-700">{item}</p>
                </div>
              ))}
            </div>
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
        taglineEn="Usado por freelancers, empresas y profesionales en toda Latinoamérica."
        taglineEs="Usado por freelancers, empresas y profesionales en toda Latinoamérica."
      />
      <FreePlanBlock />
      <FAQAccordion items={[faq]} heading={<h2 className="text-3xl font-black text-slate-900 md:text-4xl">Preguntas frecuentes</h2>} />
      <OtherFreeFeatureLinks current={page.slug} />
      <LandingFooter />
    </div>
  );
}
