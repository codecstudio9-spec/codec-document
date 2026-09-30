/**
 * Una sola plantilla para las veinte páginas de intención de Estados Unidos.
 *
 * Veinte archivos idénticos que sólo cambian una constante son veinte sitios
 * donde arreglar el mismo fallo. La página resuelve su contenido desde la
 * ruta actual, igual que ContadorDianLanding hace con las de Colombia.
 *
 * ── Idioma fijo en inglés ────────────────────────────────────────────────
 *
 * Envuelta en FixedLanguageProvider con `en`, como exige CLAUDE.md para toda
 * página indexable: el idioma de una landing no puede depender de la IP desde
 * la que Googlebot rastree, o el contenido que se indexa cambia según el país
 * desde el que se pida.
 *
 * ── Por qué no lleva `country` en StructuredData ─────────────────────────
 *
 * Porque estas páginas SÍ son de Estados Unidos, que es justo el caso para el
 * que StructuredData trae sus valores por defecto (ESIGN Act, UETA). Pasar un
 * país aquí sería sustituir una afirmación correcta por otra.
 */

import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight, Check, FileText, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { FixedLanguageProvider, useLanguage } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { FAQAccordion } from './LandingSections';
import { PAGINA_US_POR_SLUG, hermanasDe, type PaginaUS } from '../../data/us-intent-seo-content';
import { enEspanol, etiquetaDocumentoEs, TEXTOS_US } from '../../data/us-seo-content-es';

function Contenido({ pagina }: { pagina: PaginaUS }) {
  const url = `${SITE_URL}/${pagina.slug}`;
  const [foto1, foto2, foto3] = pagina.fotos;
  // Las páginas por profesión son treinta: se muestran seis vecinas en vez
  // de tres para que el grupo quede bien enlazado entre sí.
  const esSector = pagina.grupo === 'industry';
  const hermanas = useMemo(() => hermanasDe(pagina.slug, esSector ? 6 : 3), [pagina.slug, esSector]);

  // El acordeón habla los dos idiomas aunque esta página sea sólo inglés:
  // se rellenan ambos con el mismo texto en vez de dejar el español vacío,
  // que dejaría el acordeón en blanco si alguien cambiara el proveedor.
  // Versión en español cuando el visitante elige ES y la página la tiene.
  // El SEO de arriba (título, meta, datos estructurados) sigue en inglés a
  // propósito: es el contenido por defecto de la URL, el que ve Googlebot.
  const { language } = useLanguage();
  const v = language === 'es' ? enEspanol(pagina) : pagina;
  const traducida = v !== pagina;
  const T = TEXTOS_US[traducida ? 'es' : 'en'];
  const faq = v.faq.map((f) => ({ qEn: f.q, qEs: f.q, aEn: f.a, aEs: f.a }));
  const nombreHermana = (h: PaginaUS) => {
    const hv = traducida ? enEspanol(h) : h;
    return esSector && hv.audiencia ? hv.audiencia : hv.h1;
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead title={pagina.titleTag} description={pagina.metaDescription} canonicalUrl={url} />
      {/* Su propio FAQ, no el genérico del sitio: Google exige que el marcado
          coincida con lo que la página muestra. */}
      <StructuredData faq={pagina.faq} />
      <LandingHeader />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-28 md:pt-36">
        <div className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                <Scale className="size-3" />
                {T.pais}
              </span>
              <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-slate-900 md:text-5xl">
                {v.h1}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">
                {v.intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
                >
                  {v.cta}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/electronic-signature"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-400"
                >
                  {T.comoFunciona}
                </Link>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="size-3.5" />
                {T.confianza}
              </p>
            </div>

            <div className="relative">
              <img
                src={foto1}
                alt={`${v.h1} — ${T.altFirma}`}
                loading="eager"
                width={1000}
                height={750}
                className="w-full rounded-3xl object-cover shadow-2xl"
                style={{ aspectRatio: '4 / 3' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── El problema ─────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <img
              src={foto2}
              alt={`${v.problema.titulo} — ${T.altRevisar}`}
              loading="lazy"
              width={1000}
              height={750}
              className="w-full rounded-3xl object-cover shadow-xl"
              style={{ aspectRatio: '4 / 3' }}
            />
            <div>
              <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">
                {v.problema.titulo}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                {v.problema.texto}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Qué incluye ─────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-center text-3xl font-black text-slate-900 md:text-4xl">
              {esSector ? T.comoAyuda(v.audiencia) : T.queCubre}
            </h2>
            <div className="grid gap-5 md:grid-cols-2">
              {v.puntos.map((p) => (
                <div key={p.titulo} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                  <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-emerald-50">
                    <Check className="size-4 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{p.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── La ley ──────────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-slate-50/60 p-8 md:p-10">
            <div className="mb-4 flex size-10 items-center justify-center rounded-2xl bg-slate-900">
              <Scale className="size-5 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{v.ley.titulo}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{v.ley.texto}</p>
            <p className="mt-5 text-xs leading-relaxed text-slate-400">
              {T.avisoLegal}
            </p>
          </div>
        </div>
      </section>

      {/* ── Un caso real ────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                {esSector ? T.ejemplo : T.enLaPractica}
              </span>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">
                {v.caso.titulo}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300">{v.caso.texto}</p>
            </div>
            <img
              src={foto3}
              alt={`${v.caso.titulo} — ${T.altArchivado}`}
              loading="lazy"
              width={1000}
              height={750}
              className="w-full rounded-3xl object-cover shadow-2xl"
              style={{ aspectRatio: '4 / 3' }}
            />
          </div>
        </div>
      </section>

      {/* ── Qué dejar por escrito (sólo páginas por profesión) ──────── */}
      {v.checklist && (
        <section className="bg-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-3xl font-black text-slate-900 md:text-4xl">
                {v.checklist.titulo}
              </h2>
              <ul className="mt-8 space-y-3">
                {v.checklist.items.map((item) => (
                  <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 ring-1 ring-slate-100">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <FAQAccordion
        items={faq}
        heading={
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            {T.preguntas}
          </h2>
        }
      />

      {/* ── Documentos que usa este público ─────────────────────────── */}
      {v.documentos && v.documentos.length > 0 && (
        <section className="bg-white py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-center text-2xl font-black text-slate-900 md:text-3xl">
                {T.documentosDe(v.audiencia)}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {v.documentos.map((d) => (
                  <Link
                    key={d.to}
                    to={d.to}
                    className="group flex items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-800 ring-1 ring-slate-100 transition hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200"
                  >
                    {traducida ? etiquetaDocumentoEs(d) : d.label}
                    <ArrowRight className="size-4 shrink-0 text-slate-400 group-hover:text-indigo-600" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Enlazado interno del grupo ──────────────────────────────── */}
      {hermanas.length > 0 && (
        <section className="bg-slate-50 py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-center text-xl font-black text-slate-900">
                {esSector ? T.tambienPara : T.relacionados}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {hermanas.map((h) => (
                  <Link
                    key={h.slug}
                    to={`/${h.slug}`}
                    className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:ring-indigo-200"
                  >
                    <FileText className="mb-2 size-4 text-indigo-500" />
                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">
                      {nombreHermana(h)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                      {(traducida ? enEspanol(h) : h).metaDescription}
                    </p>
                  </Link>
                ))}
              </div>
              {esSector && (
                <p className="mt-6 text-center">
                  <Link to="/industries" className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
                    {T.verTodas}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Cierre ──────────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="mx-auto mb-4 size-6 text-indigo-500" />
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{v.cta}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            {T.cierre}
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            {v.cta}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

export default function USIntentLanding() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  const pagina = PAGINA_US_POR_SLUG.get(slug);

  // Si la ruta no corresponde a ninguna página, no se inventa contenido: se
  // deja que el enrutador siga hasta el 404 real.
  if (!pagina) return null;

  return (
    <FixedLanguageProvider defaultLanguage="en">
      <Contenido pagina={pagina} />
    </FixedLanguageProvider>
  );
}
