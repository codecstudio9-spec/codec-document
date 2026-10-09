/**
 * Una sola plantilla para las treinta páginas de intención de Colombia
 * (co-intent-seo-content.ts). Resuelve su contenido desde la ruta, igual que
 * USIntentLanding.
 *
 * ── Idioma fijo en español y datos estructurados de Colombia ─────────────
 *
 * Envuelta en FixedLanguageProvider con `es`, como exige CLAUDE.md: el
 * contenido indexado no puede depender de la IP desde la que rastree Google.
 * StructuredData recibe el país (Ley 527 de 1999) para no afirmar en una
 * página colombiana que cumple la ESIGN Act de Estados Unidos.
 *
 * ── Carga por grupo ──────────────────────────────────────────────────────
 *
 * Sólo se descarga el archivo del grupo de la página (unos 5-8 textos), no
 * los treinta. Las tarjetas de páginas relacionadas usan el índice liviano
 * generado en el build.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowRight, Check, FileText, Scale, ShieldCheck, Sparkles } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { FixedLanguageProvider } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { FAQAccordion } from './LandingSections';
import type { PaginaCO, ModuloCO } from '../../data/co-intent-seo-content';
import { INDICE_CO, type IndiceCO } from '../../data/co-pages-index.generated';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const CARGADORES: Record<ModuloCO, () => Promise<PaginaCO[]>> = {
  firma: () => import('../../data/co-paginas-firma').then((m) => m.PAGINAS_CO_FIRMA),
  laboral: () => import('../../data/co-paginas-laboral').then((m) => m.PAGINAS_CO_LABORAL),
  negocios: () => import('../../data/co-paginas-negocios').then((m) => m.PAGINAS_CO_NEGOCIOS),
  dinero: () => import('../../data/co-paginas-dinero').then((m) => m.PAGINAS_CO_DINERO),
};
const INDICE_POR_SLUG = new Map(INDICE_CO.map((p) => [p.slug, p]));
const COLOMBIA = LATAM_COUNTRIES.find((c) => c.slug === 'colombia');
const HUB = { path: '/firma-electronica-colombia', label: 'Firma electrónica en Colombia' };

function Contenido({ pagina }: { pagina: PaginaCO }) {
  const url = `${SITE_URL}/${pagina.slug}`;
  const [foto1, foto2, foto3] = pagina.fotos;
  const hermanas = useMemo(
    () => (INDICE_POR_SLUG.get(pagina.slug)?.hermanas ?? []).map((s) => INDICE_POR_SLUG.get(s)).filter((h): h is IndiceCO => Boolean(h)),
    [pagina.slug],
  );
  const faq = pagina.faq.map((f) => ({ qEn: f.q, qEs: f.q, aEn: f.a, aEs: f.a }));

  return (
    <div className="min-h-screen bg-white">
      <SEOHead title={pagina.titleTag} description={pagina.metaDescription} canonicalUrl={url} />
      <StructuredData
        language="es"
        faq={pagina.faq}
        country={COLOMBIA ? {
          name: COLOMBIA.name,
          nameEs: COLOMBIA.nameEs,
          lawBadgeEn: COLOMBIA.lawBadgeEn,
          lawBadgeEs: COLOMBIA.lawBadgeEs,
        } : undefined}
      />
      <LandingHeader />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-28 md:pt-36">
        <div className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                <Scale className="size-3" />
                Colombia · Ley 527 de 1999
              </span>
              <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-slate-900 md:text-5xl">
                {pagina.h1}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">{pagina.intro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={pagina.ctaTo}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
                >
                  {pagina.cta}
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to={HUB.path}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-400"
                >
                  Cómo funciona la firma
                </Link>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck className="size-3.5" />
                Gratis para empezar · Válido bajo la Ley 527 de 1999 · Registro de auditoría en cada firma
              </p>
            </div>
            <div className="relative">
              <img
                src={foto1}
                alt={`${pagina.h1} — preparando y firmando el documento en línea`}
                loading="eager"
                // React 18 no reconoce fetchPriority; el atributo HTML va en minúsculas.
                {...{ fetchpriority: 'high' }}
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
              alt={`${pagina.problema.titulo} — revisando el documento antes de firmar`}
              loading="lazy"
              width={1000}
              height={750}
              className="w-full rounded-3xl object-cover shadow-xl"
              style={{ aspectRatio: '4 / 3' }}
            />
            <div>
              <h2 className="text-3xl font-black leading-tight text-slate-900 md:text-4xl">{pagina.problema.titulo}</h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600">{pagina.problema.texto}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo ayuda ──────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-10 text-center text-3xl font-black text-slate-900 md:text-4xl">Cómo te ayuda Codec Document</h2>
            <div className="grid gap-5 md:grid-cols-2">
              {pagina.puntos.map((p) => (
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
            <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{pagina.ley.titulo}</h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{pagina.ley.texto}</p>
            <p className="mt-5 text-xs leading-relaxed text-slate-400">
              Esta es información general sobre la ley colombiana, no asesoría jurídica para tu caso. Las normas cambian; ante dudas, consulta a un abogado.
            </p>
          </div>
        </div>
      </section>

      {/* ── Un caso ─────────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Un ejemplo ilustrativo</span>
              <h2 className="mt-3 text-3xl font-black leading-tight text-white md:text-4xl">{pagina.caso.titulo}</h2>
              <p className="mt-5 text-base leading-relaxed text-slate-300">{pagina.caso.texto}</p>
            </div>
            <img
              src={foto3}
              alt={`${pagina.caso.titulo} — el documento firmado y archivado`}
              loading="lazy"
              width={1000}
              height={750}
              className="w-full rounded-3xl object-cover shadow-2xl"
              style={{ aspectRatio: '4 / 3' }}
            />
          </div>
        </div>
      </section>

      {/* ── Qué debe incluir ────────────────────────────────────────── */}
      {pagina.checklist && (
        <section className="bg-white py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-3xl font-black text-slate-900 md:text-4xl">{pagina.checklist.titulo}</h2>
              <ul className="mt-8 space-y-3">
                {pagina.checklist.items.map((item) => (
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
        heading={<h2 className="text-3xl font-black text-slate-900 md:text-4xl">Preguntas frecuentes</h2>}
      />

      {/* ── Enlazado interno ────────────────────────────────────────── */}
      {hermanas.length > 0 && (
        <section className="bg-slate-50 py-14">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-5xl">
              <h2 className="mb-6 text-center text-xl font-black text-slate-900">Documentos relacionados</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {hermanas.map((h) => (
                  <Link
                    key={h.slug}
                    to={`/${h.slug}`}
                    className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:ring-indigo-200"
                  >
                    <FileText className="mb-2 size-4 text-indigo-500" />
                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">{h.h1}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{h.metaDescription}</p>
                  </Link>
                ))}
              </div>
              <p className="mt-6 text-center">
                <Link to={HUB.path} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
                  {HUB.label}: todas las guías para Colombia →
                </Link>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Cierre ──────────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="mx-auto mb-4 size-6 text-indigo-500" />
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">{pagina.cta}</h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600">
            Sube el modelo que ya usas, llena los datos viendo el documento y envíalo a firmar por WhatsApp, correo o código QR. La otra parte no necesita cuenta, y cada firma queda con su registro de auditoría.
          </p>
          <Link
            to={pagina.ctaTo}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02]"
          >
            {pagina.cta}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function Cargador({ slug }: { slug: string }) {
  const indice = INDICE_POR_SLUG.get(slug);
  const [pagina, setPagina] = useState<PaginaCO | null>(null);
  useEffect(() => {
    if (!indice) return;
    let vivo = true;
    setPagina(null);
    CARGADORES[indice.modulo]()
      .then((todas) => { if (vivo) setPagina(todas.find((p) => p.slug === slug) ?? null); })
      .catch(() => { /* sin red: queda el contenido estático del HTML */ });
    return () => { vivo = false; };
  }, [slug, indice]);
  if (!pagina) return <div className="min-h-screen bg-white" />;
  return <Contenido pagina={pagina} />;
}

export default function COIntentLanding() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!INDICE_POR_SLUG.has(slug)) return null;
  return (
    <FixedLanguageProvider defaultLanguage="es">
      <Cargador slug={slug} />
    </FixedLanguageProvider>
  );
}
