import { useEffect } from 'react';
import { ArrowRight, Calendar, Clock, CheckCircle2, AlertTriangle, ExternalLink, PlayCircle, Home, ChevronRight } from 'lucide-react';
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
    scenariosHeading: 'How this plays out in practice',
    mistakesHeading: 'The most common mistakes',
    checklistHeading: 'Quick checklist',
    sourcesHeading: 'Sources',
    videoHeading: 'Recommended resources',
    home: 'Home',
    blog: 'Guides',
  },
  es: {
    freeBadge: 'Gratis — no necesitas tarjeta de crédito',
    ctaButton: 'Probar gratis',
    faqHeading: 'Preguntas frecuentes',
    relatedHeading: 'Sigue leyendo',
    scenariosHeading: 'Cómo se ve esto en la práctica',
    mistakesHeading: 'Los errores más comunes',
    checklistHeading: 'Checklist rápido',
    sourcesHeading: 'Fuentes',
    videoHeading: 'Recursos recomendados',
    home: 'Inicio',
    blog: 'Guías',
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

/** Prefers the same topic cluster (a precise, deliberate signal) over the
 * looser "same region" fallback — this is the actual internal-linking
 * mechanism that lets Google recognize a cluster of related pages as one
 * topical authority, instead of a pile of isolated articles. */
function RelatedArticles({ current }: { current: Article }) {
  const t = T[current.language];
  let related: Article[];
  if (current.relatedSlugs?.length) {
    related = current.relatedSlugs
      .map((slug) => ARTICLES.find((a) => a.slug === slug))
      .filter((a): a is Article => Boolean(a));
  } else if (current.topicCluster) {
    related = ARTICLES.filter((a) => a.topicCluster === current.topicCluster && a.slug !== current.slug);
  } else {
    related = ARTICLES.filter((a) => a.region === current.region && a.slug !== current.slug);
  }
  related = related.slice(0, 4);
  if (related.length === 0) return null;
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

function SectionBlock({ section }: { section: Article['sections'][number] }) {
  return (
    <section className="mt-10">
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
  );
}

/** Injects Article + FAQPage + BreadcrumbList JSON-LD — kept local to this
 * component (not the shared StructuredData, which only ever carries the
 * site-wide Organization/SoftwareApplication schemas) since it depends on
 * this specific article's own content. */
function useArticleSchema(data: Article, canonicalUrl: string) {
  const t = T[data.language];
  useEffect(() => {
    const scripts: HTMLScriptElement[] = [];
    const addSchema = (obj: object) => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.text = JSON.stringify(obj);
      document.head.appendChild(el);
      scripts.push(el);
    };

    addSchema({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.metaDescription,
      ...(data.isoDate ? { datePublished: data.isoDate, dateModified: data.isoDate } : {}),
      author: { '@type': 'Organization', name: 'Codec Document' },
      publisher: {
        '@type': 'Organization',
        name: 'Codec Document',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      inLanguage: data.language,
    });

    if (data.faq.length > 0) {
      addSchema({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: data.faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      });
    }

    addSchema({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.home, item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t.blog, item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: data.title, item: canonicalUrl },
      ],
    });

    return () => { scripts.forEach((el) => el.remove()); };
  }, [data, canonicalUrl, t.home, t.blog]);
}

export function ArticleLanding({ data }: { data: Article }) {
  const t = T[data.language];
  const canonicalUrl = `${SITE_URL}/blog/${data.slug}`;
  useArticleSchema(data, canonicalUrl);
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
        {/* Breadcrumb */}
        <div className="border-b border-slate-100 bg-slate-50 py-2.5">
          <div className="container mx-auto px-4">
            <div className="mx-auto flex max-w-3xl items-center gap-1.5 text-xs font-semibold text-slate-400">
              <a href="/" className="flex items-center gap-1 hover:text-indigo-600"><Home className="size-3" />{t.home}</a>
              <ChevronRight className="size-3" />
              <a href="/blog" className="hover:text-indigo-600">{t.blog}</a>
              <ChevronRight className="size-3" />
              <span className="truncate text-slate-500">{data.title}</span>
            </div>
          </div>
        </div>

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
              {data.heroImage && (
                <figure className="mb-8">
                  <img
                    src={data.heroImage.src}
                    alt={data.heroImage.alt}
                    loading="lazy"
                    className="w-full rounded-2xl object-cover"
                    style={{ maxHeight: 420 }}
                  />
                  {data.heroImage.credit && (
                    <figcaption className="mt-1.5 text-right text-[11px] text-slate-400">{data.heroImage.credit}</figcaption>
                  )}
                </figure>
              )}

              {data.intro.map((p, i) => (
                <p key={i} className="mb-4 text-lg leading-relaxed text-slate-700">{p}</p>
              ))}

              {firstHalf.map((section, i) => <SectionBlock key={i} section={section} />)}

              {/* Real-world scenarios by vertical */}
              {data.scenarios && data.scenarios.length > 0 && (
                <section className="mt-10">
                  <h2 className="mb-4 text-2xl font-bold text-slate-900">{t.scenariosHeading}</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {data.scenarios.map((s, i) => (
                      <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-1 text-xs font-black uppercase tracking-wide text-indigo-600">{s.vertical}</p>
                        <p className="text-sm leading-relaxed text-slate-600">{s.scenario}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <InlineCta article={data} />

              {secondHalf.map((section, i) => <SectionBlock key={i} section={section} />)}

              {/* Common mistakes */}
              {data.mistakes && data.mistakes.length > 0 && (
                <section className="mt-14">
                  <h2 className="mb-4 text-2xl font-bold text-slate-900">{t.mistakesHeading}</h2>
                  <div className="space-y-3">
                    {data.mistakes.map((m, i) => (
                      <div key={i} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
                        <div>
                          <p className="font-bold text-slate-900">{m.title}</p>
                          <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{m.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Checklist */}
              {data.checklist && (
                <section className="mt-14 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <h2 className="mb-4 text-xl font-bold text-slate-900">{data.checklist.title}</h2>
                  <ul className="space-y-2.5">
                    {data.checklist.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-slate-300" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Comparison table */}
              {data.comparisonTable && (
                <section className="mt-14">
                  <h2 className="mb-4 text-xl font-bold text-slate-900">{data.comparisonTable.caption}</h2>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full min-w-[480px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          {data.comparisonTable.headers.map((h, i) => (
                            <th key={i} className="border-b border-slate-200 px-4 py-3 text-left font-bold text-slate-700">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.comparisonTable.rows.map((row, i) => (
                          <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/50' : ''}>
                            {row.map((cell, j) => (
                              <td key={j} className="border-b border-slate-100 px-4 py-3 text-slate-600">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

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

              {/* Sources */}
              {data.sources && data.sources.length > 0 && (
                <section className="mt-10">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{t.sourcesHeading}</h3>
                  <ul className="space-y-1.5">
                    {data.sources.map((s, i) => (
                      <li key={i}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
                        >
                          <ExternalLink className="size-3.5" />
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Video resources */}
              {data.videoResources && data.videoResources.length > 0 && (
                <section className="mt-8">
                  <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{t.videoHeading}</h3>
                  <ul className="space-y-1.5">
                    {data.videoResources.map((v, i) => (
                      <li key={i}>
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:underline"
                        >
                          <PlayCircle className="size-3.5" />
                          {v.title} <span className="font-normal text-slate-400">— {v.source}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
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
