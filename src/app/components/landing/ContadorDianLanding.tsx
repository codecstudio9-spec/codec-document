/**
 * Landing de «Automatización para Contadores» por ciudad.
 *
 * Una sola plantilla para las doce ciudades, con el contenido en
 * contador-dian-seo-content.ts. La página resuelve su configuración desde la
 * ruta actual, en vez de tener doce archivos idénticos que sólo cambian una
 * constante: doce copias es doce sitios donde arreglar el mismo fallo.
 *
 * Va envuelta en FixedLanguageProvider con español fijo, como el resto de las
 * landings de LatAm. La razón está en CLAUDE.md: el idioma de una página
 * indexable no puede depender de la IP desde la que Googlebot rastree, o el
 * mismo URL devuelve contenidos distintos según quién lo pida.
 */

import { Link, useLocation } from 'react-router';
import { ArrowRight, Check, Download, FileSpreadsheet, ShieldCheck, Zap } from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { FixedLanguageProvider } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { FAQAccordion } from './LandingSections';
import { CIUDADES_CONTADOR, CAPACIDADES, type CiudadContadorSeo } from '../../data/contador-dian-seo-content';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const COLOMBIA = LATAM_COUNTRIES.find((c) => c.slug === 'colombia')!;

function Contenido({ ciudad }: { ciudad: CiudadContadorSeo }) {
  const url = `${SITE_URL}/${ciudad.slug}`;

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={ciudad.titleTag}
        description={ciudad.metaDescription}
        canonicalUrl={url}
      />
      {/* Colombia, con su ley real. Dejar la configuración por defecto haría
          que una página que sólo existe para Colombia declarara en su JSON-LD
          que atiende a Estados Unidos bajo la ley ESIGN. */}
      <StructuredData language="es" country={COLOMBIA} />

      <LandingHeader />

      {/* ── Portada ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 pb-20 pt-28 md:pb-28 md:pt-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${ciudad.color}33, transparent)` }}
        />
        <div className="container relative mx-auto px-4">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white"
            style={{ background: `${ciudad.color}2E`, border: `1px solid ${ciudad.color}66` }}
          >
            <Zap className="size-3.5" /> Solo Colombia · {ciudad.ciudad}, {ciudad.departamento}
          </span>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-white md:text-6xl">
            <span style={{ color: ciudad.color }}>{ciudad.h1Accent}</span>{' '}
            {ciudad.h1Rest}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{ciudad.subtitulo}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/documentos-electronicos"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-white transition hover:brightness-110"
              style={{ background: ciudad.color, boxShadow: `0 14px 32px ${ciudad.color}59` }}
            >
              Probar gratis <ArrowRight className="size-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Sin instalar nada · Los archivos se procesan en tu propio navegador
          </p>
        </div>
      </section>

      {/* ── El problema local ───────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-relaxed text-slate-700">{ciudad.intro}</p>

            <h2 className="mt-12 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {ciudad.sectorTitulo}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{ciudad.sectorTexto}</p>

            <div className="mt-8 space-y-4">
              {ciudad.dolores.map((d) => (
                <div key={d.titulo} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
                  <h3 className="text-base font-black text-slate-900">{d.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d.texto}</p>
                </div>
              ))}
            </div>

            <div
              className="mt-8 rounded-2xl p-6"
              style={{ background: `${ciudad.color}0F`, border: `1px solid ${ciudad.color}33` }}
            >
              <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                <ShieldCheck className="size-4.5" style={{ color: ciudad.color }} />
                Qué cambia con la herramienta
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{ciudad.respuesta}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Qué hace ────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Todo lo que hace, en un solo lugar
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600">
            Desde bajar los comprimidos del portal de la DIAN hasta dejar el archivo listo para
            importar en tu software contable.
          </p>

          <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CAPACIDADES.map((c) => (
              <div key={c.titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span
                  className="mb-3 flex size-10 items-center justify-center rounded-xl"
                  style={{ background: `${ciudad.color}14` }}
                >
                  <FileSpreadsheet className="size-5" style={{ color: ciudad.color }} />
                </span>
                <h3 className="text-sm font-black text-slate-900">{c.titulo}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{c.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Los tres pasos ──────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Cómo se usa en {ciudad.ciudad}
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { n: '1', t: 'Solicita tu token en la DIAN', d: 'Entra al portal de facturación electrónica y pide el token. Te llega un correo con un enlace; cópialo y pégalo en la herramienta. Dura 60 minutos.' },
              { n: '2', t: 'Pega los CUFE o arrastra los ZIP', d: 'Si ya tienes los comprimidos, arrástralos. Si no, pega la lista de CUFE y se descargan solos en la carpeta que elijas.' },
              { n: '3', t: 'Descarga tu Excel', d: 'Sale el archivo con resumen, documentos, líneas e impuestos. O directamente en el formato de tu software contable.' },
            ].map((p) => (
              <div key={p.n}>
                <span
                  className="flex size-11 items-center justify-center rounded-2xl text-lg font-black text-white"
                  style={{ background: ciudad.color }}
                >
                  {p.n}
                </span>
                <h3 className="mt-4 text-base font-black text-slate-900">{p.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/documentos-electronicos"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-black text-white transition hover:brightness-110"
              style={{ background: ciudad.color, boxShadow: `0 14px 32px ${ciudad.color}59` }}
            >
              <Download className="size-4" /> Empezar ahora — es gratis
            </Link>
          </div>
        </div>
      </section>

      {/* ── Marco legal ─────────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-black text-white">Sobre la facturación electrónica en Colombia</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              La facturación electrónica en Colombia se rige por la <strong className="text-white">Resolución
              DIAN 000042 de 2020</strong> y sus modificaciones, que fijan el formato XML bajo el estándar
              UBL 2.1 y la obligación de conservar el documento electrónico. El XML —no el PDF— es el
              documento con validez: el PDF es una representación gráfica. Por eso esta herramienta trabaja
              siempre sobre el XML, que es donde están el CUFE, los códigos de impuesto y las bases
              gravables tal como se reportaron.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Herramienta disponible únicamente para Colombia. No solicita ni almacena tus credenciales de
              la DIAN: el acceso se hace con el token temporal que la propia DIAN envía a tu correo.
            </p>
          </div>
        </div>
      </section>

      <FAQAccordion
        // El acordeón es bilingüe por contrato; aquí el idioma está fijado a
        // español, así que las dos variantes son el mismo texto.
        items={ciudad.faq.map((f) => ({ qEs: f.q, qEn: f.q, aEs: f.a, aEn: f.a }))}
        heading={
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            Preguntas de contadores en {ciudad.ciudad}
          </h2>
        }
      />

      {/* ── Otras ciudades ──────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-sm font-black uppercase tracking-wide text-slate-400">
            Disponible en toda Colombia
          </h2>
          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap justify-center gap-2">
            {CIUDADES_CONTADOR.filter((c) => c.slug !== ciudad.slug).map((c) => (
              <Link
                key={c.slug}
                to={`/${c.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                {c.ciudad}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

export default function ContadorDianLanding() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  const ciudad = CIUDADES_CONTADOR.find((c) => c.slug === slug) ?? CIUDADES_CONTADOR[0];

  return (
    <FixedLanguageProvider defaultLanguage="es">
      <Contenido ciudad={ciudad} />
    </FixedLanguageProvider>
  );
}

/** Ítem de FAQ tal como lo espera FAQAccordion. */
export type { CiudadContadorSeo };
