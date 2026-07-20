import { ArrowRight, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { ARTICLES, type Article } from '../../data/article-content';

const T = {
  en: {
    freeBadge: 'Free to use — no credit card required',
    ctaButton: 'Try it free',
    faqHeading: 'Frequently asked questions',
    relatedHeading: 'Keep reading',
  },
  es: {
    freeBadge: 'Gratis — no necesitas tarjeta de crédito',
    ctaButton: 'Probar gratis',
    faqHeading: 'Preguntas frecuentes',
    relatedHeading: 'Sigue leyendo',
  },
};

/** Small, repeatable "this is free" banner — dropped once mid-article and
 * once at the end, since the whole point of this content push is to make
 * Codec Document itself the visible answer to "how do I actually do this",
 * not just rank for the topic. */
function InlineCta({ article }: { article: Article }) {
  const t = T[article.language];
  return (
    <div className="my-10 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-indigo-700 shadow-sm">
            <CheckCircle2 className="size-3.5" />
            {t.freeBadge}
          </p>
          <p className="mt-2 max-w-md text-sm font-semibold text-slate-700">{article.ctaBody}</p>
        </div>
        <a
          href={article.ctaHref}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
        >
          {t.ctaButton}
          <ArrowRight className="size-4" />
        </a>
      </div>
    </div>
  );
}

function RelatedArticles({ current }: { current: Article }) {
  const related = ARTICLES.filter((a) => a.region === current.region && a.slug !== current.slug).slice(0, 4);
  if (related.length === 0) return null;
  const t = T[current.language];
  return (
    <section className="border-t border-slate-100 bg-slate-50 py-14">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <h3 className="mb-5 text-lg font-bold text-slate-900">{t.relatedHeading}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {related.map((a) => (
              <a
                key={a.slug}
                href={`/blog/${a.slug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-indigo-300 hover:shadow-sm"
              >
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">{a.title}</span>
                <ArrowRight className="size-4 shrink-0 text-slate-300 group-hover:text-indigo-500" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ArticleLanding({ data }: { data: Article }) {
  const t = T[data.language];
  const canonicalUrl = `${SITE_URL}/blog/${data.slug}`;
  // Splits the body roughly in half so the inline CTA lands naturally
  // between sections instead of always right after the intro.
  const midpoint = Math.max(1, Math.ceil(data.sections.length / 2));
  const firstHalf = data.sections.slice(0, midpoint);
  const secondHalf = data.sections.slice(midpoint);

  return (
    <div>
      <SEOHead
        title={`${data.title} | Codec Document`}
        description={data.metaDescription}
        keywords={data.keywords}
        canonicalUrl={canonicalUrl}
        ogType="article"
      />
      <StructuredData />
      <LandingHeader />

      <article className="bg-white">
        {/* Header */}
        <header className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700">
                {data.category}
              </span>
              <h1 className="mt-4 text-3xl font-black leading-tight text-slate-900 md:text-4xl">{data.title}</h1>
              <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {data.dateLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {data.readMinutes} {data.language === 'en' ? 'min read' : 'min de lectura'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="py-12">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              {data.intro.map((p, i) => (
                <p key={i} className="mb-4 text-lg leading-relaxed text-slate-700">{p}</p>
              ))}

              {firstHalf.map((section, i) => (
                <section key={i} className="mt-10">
                  <h2 className="mb-3 text-2xl font-bold text-slate-900">{section.heading}</h2>
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="mb-4 leading-relaxed text-slate-600">{p}</p>
                  ))}
                  {section.bullets && (
                    <ul className="mb-4 space-y-2">
                      {section.bullets.map((b, k) => (
                        <li key={k} className="flex items-start gap-2.5 leading-relaxed text-slate-600">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-indigo-500" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <InlineCta article={data} />

              {secondHalf.map((section, i) => (
                <section key={i} className="mt-10">
                  <h2 className="mb-3 text-2xl font-bold text-slate-900">{section.heading}</h2>
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="mb-4 leading-relaxed text-slate-600">{p}</p>
                  ))}
                  {section.bullets && (
                    <ul className="mb-4 space-y-2">
                      {section.bullets.map((b, k) => (
                        <li key={k} className="flex items-start gap-2.5 leading-relaxed text-slate-600">
                          <CheckCircle2 className="mt-1 size-4 shrink-0 text-indigo-500" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              {/* FAQ */}
              {data.faq.length > 0 && (
                <section className="mt-14">
                  <h2 className="mb-5 text-2xl font-bold text-slate-900">{t.faqHeading}</h2>
                  <div className="space-y-3">
                    {data.faq.map((item, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="mb-1.5 font-bold text-slate-900">{item.q}</p>
                        <p className="leading-relaxed text-slate-600">{item.a}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Closing CTA */}
              <div className="mt-14 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-center sm:p-10">
                <h3 className="text-2xl font-black text-white">{data.ctaHeading}</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{data.ctaBody}</p>
                <a
                  href={data.ctaHref}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
                >
                  {data.ctaLabel}
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>

      <RelatedArticles current={data} />
      <LandingFooter />
    </div>
  );
}
