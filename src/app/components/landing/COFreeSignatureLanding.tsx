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
import { CO_FREE_SIGNATURE_CITIES, type COFreeSignatureCity } from '../../data/co-free-signature-city-content';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

/** Enlaces cruzados a las otras 14 ciudades del lote, para que el
 * conjunto se lea como un clúster deliberado ante Google en vez de 15
 * páginas aisladas, la misma lógica que OtherFreeSignatureStates para
 * Estados Unidos. */
function OtherFreeSignatureCities({ current }: { current: string }) {
  const others = CO_FREE_SIGNATURE_CITIES.filter((c) => c.slug !== current);
  return (
    <section className="relative border-t border-slate-100 bg-white py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-5 text-lg font-bold text-slate-900">Firma digital gratis en otras ciudades</h3>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {others.map((c) => (
              <a
                key={c.slug}
                href={`/firma-digital-gratis-${c.slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {c.nameEs}
                <ArrowRight className="size-3.5" />
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-slate-400">
            ¿Buscas la ley de otro país?{' '}
            {LATAM_COUNTRIES.map((co, i) => (
              <span key={co.slug}>
                <a href={`/firma-electronica-${co.slug}`} className="font-semibold text-indigo-600 hover:underline">{co.nameEs}</a>
                {i < LATAM_COUNTRIES.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

/** El texto real y único por ciudad, en dos párrafos sencillos. Esto es
 * lo que evita que las 15 páginas del lote se lean como una plantilla con
 * el nombre cambiado: todo lo demás (hero, tarjetas, beneficios) sigue la
 * misma estructura ya probada de StateLegalDocumentsLanding, pero esta
 * sección se escribe de cero para cada ciudad con hechos reales y
 * verificables, nunca relleno genérico. */
function CityIntro({ city }: { city: COFreeSignatureCity }) {
  const { language } = useLanguage();
  return (
    <section className="relative bg-white py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-slate-700">
          <p>{language === 'es' ? city.introEs : city.introEn}</p>
          <p>{language === 'es' ? city.localEs : city.localEn}</p>
        </div>
      </div>
    </section>
  );
}

export function COFreeSignatureLanding({ city }: { city: COFreeSignatureCity }) {
  return (
    <FixedLanguageProvider defaultLanguage="es">
      <COFreeSignatureLandingContent city={city} />
    </FixedLanguageProvider>
  );
}

function COFreeSignatureLandingContent({ city }: { city: COFreeSignatureCity }) {
  const title = `Firma Digital Gratis en ${city.nameEs} | CodecDocument`;
  const desc = `Firma documentos electrónicamente gratis en ${city.nameEs}. Verificación de identidad real, pista de auditoría SHA-256 y plena validez legal bajo la Ley 527 de 1999 y el Decreto 2364 de 2012.`;
  const canonicalUrl = `${SITE_URL}/firma-digital-gratis-${city.slug}`;

  return (
    <div>
      <SEOHead
        title={title}
        description={desc}
        keywords={`firma digital gratis ${city.nameEs}, firma electronica gratis ${city.nameEs}, firmar documentos online gratis ${city.nameEs}`}
        canonicalUrl={canonicalUrl}
      />
      <StructuredData language="es" country={{ name: 'Colombia', nameEs: 'Colombia', lawBadgeEs: 'Ley 527 de 1999', lawBadgeEn: 'Law 527 of 1999' }} />
      <LandingHeader />

      <LandingHero
        documentId="residential-lease"
        badge={city.department.toUpperCase()}
        color="#059669"
        icon={MapPin}
        previewLabel={`Vista previa ${city.nameEs}`}
        backgroundImage="/imagen2.jpg"
        titleAccentEn="Free Digital Signature" titleAccentEs="Firma Digital Gratis"
        titleRestEn={`in ${city.nameEn}`} titleRestEs={`en ${city.nameEs}`}
        subtitleEn={desc} subtitleEs={desc}
        ctaLabelEn="Firma Gratis Ahora" ctaLabelEs="Firma Gratis Ahora"
        ctaHref="/firma-electronica"
        secondaryLabelEn="Ver Precios" secondaryLabelEs="Ver Precios"
        secondaryHref="/pricing"
        trustBadges={[
          { en: 'Sin Tarjeta de Crédito', es: 'Sin Tarjeta de Crédito' },
          { en: 'Acceso Inmediato', es: 'Acceso Inmediato' },
          { en: 'Identidad Verificada', es: 'Identidad Verificada' },
          { en: 'Auditoría SHA-256', es: 'Auditoría SHA-256' },
        ]}
      />

      <CityIntro city={city} />
      <StateLawHighlights stateName="Colombia" stateNameEs="Colombia" highlights={city.highlights} />

      <PhotoProofSection
        image="/images/home/why-1-pointing.jpg"
        captionEn="Open the app, fill it in, sign."
        captionEs="Abre la app, completa, firma. Así de simple."
        pointsEn={['No credit card', 'A free document and signature every 72 hours', 'Works on any phone or computer']}
        pointsEs={['Sin tarjeta de crédito', 'Un documento y una firma gratis cada 72 horas', 'Funciona en cualquier celular o computador']}
        color="#059669"
      />
      <BenefitCards />
      <HowItWorksTimeline
        headingEn="How to sign a document online" headingEs={`Cómo firmar un documento online en ${city.nameEs}`}
        lastStepDescEn="Download a clean PDF with a SHA-256 audit trail, valid under Colombian law."
        lastStepDescEs="Recibe un PDF limpio con pista de auditoría SHA-256, con validez legal bajo la ley colombiana."
      />
      <SocialProofBand
        complianceItems={['Identidad Verificada', 'SHA-256 Audit Trail', 'SSL / TLS Encrypted']}
        taglineEn={`Used by freelancers and businesses in ${city.nameEn}.`}
        taglineEs={`Usado por freelancers, empresas y profesionales en ${city.nameEs}.`}
      />
      <FAQAccordion
        items={city.faqs}
        heading={<h2 className="text-3xl font-black text-slate-900 md:text-4xl">Preguntas frecuentes</h2>}
      />
      <OtherFreeSignatureCities current={city.slug} />

      <section className="relative bg-slate-950 py-16 md:py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(5,150,105,0.18), transparent)' }} />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-300">
              <FileSignature className="size-3.5" /> Plan Gratuito
            </span>
            <h3 className="mb-3 text-2xl font-black text-white md:text-3xl">
              Firma tu primer documento gratis en {city.nameEs}
            </h3>
            <p className="mb-6 text-sm text-white/70">
              Sin tarjeta de crédito, con verificación de identidad real y validez legal bajo la ley colombiana.
            </p>
            <a
              href="/firma-electronica"
              className="group inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 text-sm font-bold text-white shadow-[0_4px_24px_rgba(5,150,105,0.40)] transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(180deg, #34d399 0%, #059669 40%, #047857 100%)' }}
            >
              Empieza Gratis Ahora
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
