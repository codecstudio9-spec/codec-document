import { ArrowRight } from 'lucide-react';
import { SEOHead } from '../../components/seo-head';
import { StructuredData } from '../../components/structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from '../../components/landing/LandingHeader';
import { LandingFooter } from '../../components/landing/LandingFooter';
import { ARTICLES } from '../../data/article-content';

export default function BlogIndex() {
  const us = ARTICLES.filter((a) => a.region === 'us');
  const latam = ARTICLES.filter((a) => a.region === 'latam');

  return (
    <div>
      <SEOHead
        title="E-Signature & Digital Document Guides | Codec Document Blog"
        description="Free, educational guides on electronic signatures, NDAs, digital contracts, and paperless workflows for businesses in the US and Latin America."
        keywords="e-signature blog, digital signature guides, firma electronica blog, NDA guide, digital contracts"
        canonicalUrl={`${SITE_URL}/blog`}
      />
      <StructuredData />
      <LandingHeader />

      <section className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-black text-slate-900 md:text-5xl">Guides &amp; Recursos</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-500">
            Everything you need to know about electronic signatures, contracts, and going paperless —
            para empresas en Estados Unidos y Latinoamérica.
          </p>
        </div>
      </section>

      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-5 text-xl font-black text-slate-900">United States</h2>
            <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {us.map((a) => (
                <a
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                    {a.category}
                  </span>
                  <span className="font-bold text-slate-900 group-hover:text-indigo-700">{a.title}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    Read more <ArrowRight className="size-3.5" />
                  </span>
                </a>
              ))}
            </div>

            <h2 className="mb-5 text-xl font-black text-slate-900">Latinoamérica</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {latam.map((a) => (
                <a
                  key={a.slug}
                  href={`/blog/${a.slug}`}
                  className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="inline-flex w-fit items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                    {a.category}
                  </span>
                  <span className="font-bold text-slate-900 group-hover:text-indigo-700">{a.title}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                    Leer más <ArrowRight className="size-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
