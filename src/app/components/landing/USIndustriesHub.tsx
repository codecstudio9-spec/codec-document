/**
 * /industries — el índice de las treinta páginas por profesión.
 *
 * Es la página central del grupo: enlaza a todas las páginas por profesión y
 * todas enlazan de vuelta aquí. Sin ella, Google vería treinta páginas sueltas
 * descubiertas sólo por el sitemap; con ella, ve un grupo temático deliberado.
 *
 * Idioma fijo en inglés, como toda página indexable de Estados Unidos (ver
 * CLAUDE.md): el contenido no puede cambiar según la IP de Googlebot.
 */

import { Link } from 'react-router';
import { ArrowRight, Briefcase } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { FixedLanguageProvider } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { INDUSTRIES_HUB, PAGINAS_US_SECTORES } from '../../data/us-industry-seo-content';


const FAQ = [
  { q: 'Is Codec Document only for large companies?', a: 'No. Most of the industries listed here are small businesses and independent professionals. You can start free without a credit card and upgrade only when you send documents every week.' },
  { q: 'Do my clients need an account to sign?', a: 'No. Clients, tenants, employees and vendors sign through a secure link in their browser, on a phone or a computer.' },
  { q: 'Are electronic signatures legally valid in the United States?', a: 'Yes. Under the ESIGN Act, 15 U.S.C. § 7001, and state versions of the Uniform Electronic Transactions Act, an electronic signature has the same legal effect as a handwritten one, with a few exceptions such as wills in many states and certain court documents.' },
];

function Contenido() {
  return (
    <div className="min-h-screen bg-white">
      <SEOHead title={INDUSTRIES_HUB.titleTag} description={INDUSTRIES_HUB.metaDescription} canonicalUrl={`${SITE_URL}${INDUSTRIES_HUB.path}`} />
      <StructuredData faq={FAQ} />
      <LandingHeader />

      <section className="bg-gradient-to-b from-slate-50 to-white pt-28 md:pt-36">
        <div className="container mx-auto max-w-4xl px-4 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
            <Briefcase className="size-3" />
            Industries
          </span>
          <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-slate-900 md:text-5xl">
            {INDUSTRIES_HUB.h1}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-slate-600">{INDUSTRIES_HUB.intro}</p>
        </div>
      </section>

      <section className="bg-white pb-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PAGINAS_US_SECTORES.map((p) => (
              <Link
                key={p.slug}
                to={`/${p.slug}`}
                className="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:ring-indigo-200"
              >
                <span className="flex items-center justify-between text-base font-black text-slate-900 group-hover:text-indigo-700">
                  {p.audiencia}
                  <ArrowRight className="size-4 text-slate-300 group-hover:text-indigo-600" />
                </span>
                <span className="mt-2 text-sm leading-relaxed text-slate-500">{p.metaDescription}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-3xl font-black text-slate-900">Common questions</h2>
          <div className="space-y-4">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl bg-white p-6 ring-1 ring-slate-100">
                <h3 className="text-base font-bold text-slate-900">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

export default function USIndustriesHub() {
  return (
    <FixedLanguageProvider defaultLanguage="en">
      <Contenido />
    </FixedLanguageProvider>
  );
}
