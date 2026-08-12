/**
 * Landing de «Automatización para Contadores» por ciudad.
 *
 * Una sola plantilla para las doce ciudades, con el contenido en
 * contador-dian-seo-content.ts. La página resuelve su configuración desde la
 * ruta actual, en vez de tener doce archivos idénticos que sólo cambian una
 * constante: doce copias es doce sitios donde arreglar el mismo fallo.
 *
 * ── El nombre de la ciudad NO aparece en el texto visible ────────────────
 *
 * Vive en la URL y en el <title>, que es donde Google lo necesita para las
 * búsquedas locales. Pero doce páginas que gritan «— Bogotá», «— Cali»,
 * «— Cartagena» en el titular se leen como lo que son, una plantilla repetida,
 * y eso resta credibilidad justo en la primera línea. En su lugar va el sector
 * económico, que hace el mismo trabajo de reconocimiento —un contador de
 * hotelería sabe que la página le habla a él— sin el efecto de catálogo.
 *
 * ── Vender sin vender ────────────────────────────────────────────────────
 *
 * La página no argumenta por qué comprar. Describe con precisión el trabajo
 * manual que hoy hace el contador —cuántos clics, cuántas horas, en qué se
 * van— y muestra qué queda cuando ese trabajo desaparece. Quien se reconoce
 * en la descripción no necesita que le vendan nada; necesita que le quiten el
 * miedo a probar. De ahí que el único llamado sea empezar gratis, y que el
 * precio aparezca al final, con las garantías al lado.
 *
 * Va envuelta en FixedLanguageProvider con español fijo, como el resto de las
 * landings de LatAm: el idioma de una página indexable no puede depender de la
 * IP desde la que Googlebot rastree (ver CLAUDE.md).
 */

import { Link, useLocation } from 'react-router';
import {
  ArrowRight, Check, Clock, Download, FileSpreadsheet, FileWarning,
  Lock, MousePointerClick, ShieldCheck, Sparkles, Timer, Zap,
} from 'lucide-react';
import { SEOHead } from '../seo-head';
import { StructuredData } from '../structured-data';
import { SITE_URL } from '../../config/site';
import { FixedLanguageProvider } from '../../contexts/language-context';
import { LandingHeader } from './LandingHeader';
import { LandingFooter } from './LandingFooter';
import { FAQAccordion } from './LandingSections';
import { CIUDADES_CONTADOR, CAPACIDADES, type CiudadContadorSeo } from '../../data/contador-dian-seo-content';
import { NECESIDADES_CONTADOR } from '../../data/contador-necesidad-seo-content';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

const COLOMBIA = LATAM_COUNTRIES.find((c) => c.slug === 'colombia')!;

/**
 * Los pasos que hoy hay que dar para bajar UN documento del portal de la DIAN.
 *
 * Están enumerados a propósito, y a propósito son ocho. Contarlos es el
 * argumento: nadie discute que ocho pasos son muchos, y todo contador los
 * reconoce porque los hizo esta misma semana. Multiplicado por trescientos
 * documentos, la cifra habla sola sin que la página tenga que decir nada.
 */
const PASOS_MANUALES = [
  'Entrar al portal de la DIAN y autenticarte',
  'Solicitar el token y esperar el correo',
  'Abrir el correo y entrar con el enlace, antes de que venza',
  'Filtrar el periodo y exportar el listado',
  'Descargar el comprimido de cada documento, uno por uno',
  'Descomprimir cada archivo en una carpeta',
  'Abrir el XML y buscar entre el código las cifras que necesitas',
  'Copiarlas a tu Excel y repetir con el siguiente',
];

function Contenido({ ciudad }: { ciudad: CiudadContadorSeo }) {
  const url = `${SITE_URL}/${ciudad.slug}`;
  // Las paginas por necesidad no tienen ciudad; se distingue por eso.
  const esCiudad = Boolean(ciudad.ciudad);
  const [foto1, foto2, foto3] = ciudad.fotos;

  return (
    <div className="min-h-screen bg-white">
      <SEOHead title={ciudad.titleTag} description={ciudad.metaDescription} canonicalUrl={url} />
      {/* Colombia con su ley real. Dejar la configuración por defecto haría que
          una página que sólo existe para Colombia declarara en su JSON-LD que
          atiende a Estados Unidos bajo la ley ESIGN. */}
      <StructuredData language="es" country={COLOMBIA} />

      <LandingHeader />

      {/* ── Portada ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 pb-16 pt-28 md:pb-24 md:pt-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 70% 60% at 50% 0%, ${ciudad.color}33, transparent)` }}
        />
        <div className="container relative mx-auto px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-white"
                style={{ background: `${ciudad.color}2E`, border: `1px solid ${ciudad.color}66` }}
              >
                <Zap className="size-3.5" /> {ciudad.heroSector}
              </span>

              <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight text-white md:text-5xl">
                <span style={{ color: ciudad.color }}>{ciudad.h1Accent}</span>{' '}
                {ciudad.h1Rest}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-300">{ciudad.subtitulo}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/documentos-electronicos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-black text-white transition hover:brightness-110"
                  style={{ background: ciudad.color, boxShadow: `0 14px 32px ${ciudad.color}59` }}
                >
                  Probar gratis <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#el-trabajo-manual"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Ver cómo funciona
                </a>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Sin tarjeta de crédito · Sin instalar nada · Tus archivos se procesan en tu propio navegador
              </p>
            </div>

            <div className="relative">
              <img
                src={foto1}
                alt="Profesional contable trabajando con documentos electrónicos"
                loading="eager"
                width={1200}
                height={800}
                className="w-full rounded-3xl object-cover shadow-2xl"
                style={{ aspectRatio: '4 / 3' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Lo engorroso: el trabajo manual, contado paso a paso ─────────── */}
      <section id="el-trabajo-manual" className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Lo que hoy toca hacer
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              Ocho pasos. Por cada documento.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Así se baja hoy un solo documento del portal de la DIAN. Ahora multiplícalo por los
              que recibes al mes.
            </p>
          </div>

          <div className="mx-auto mt-10 grid max-w-5xl items-start gap-10 lg:grid-cols-2">
            <ol className="space-y-2.5">
              {PASOS_MANUALES.map((paso, i) => (
                <li key={paso} className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[11px] font-black text-slate-600">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{paso}</span>
                </li>
              ))}
              <li className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: '#FEF2F2' }}>
                <FileWarning className="mt-0.5 size-5 shrink-0 text-red-500" />
                <span className="text-sm font-semibold leading-relaxed text-red-900">
                  Y si el token se vence a mitad — dura 60 minutos y sirve una sola vez — se
                  vuelve a empezar desde el paso 2.
                </span>
              </li>
            </ol>

            <div>
              <img
                src={foto2}
                alt="Trabajo contable manual con documentos y hojas de cálculo"
                loading="lazy"
                width={1200}
                height={800}
                className="w-full rounded-3xl object-cover shadow-lg"
                style={{ aspectRatio: '4 / 3' }}
              />

              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { icono: MousePointerClick, cifra: '8', pie: 'pasos por documento' },
                  { icono: Timer, cifra: '60 min', pie: 'dura el token' },
                  { icono: Clock, cifra: 'días', pie: 'se va el cierre' },
                ].map((m) => (
                  <div key={m.pie} className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                    <m.icono className="mx-auto size-4 text-slate-400" />
                    <div className="mt-1.5 text-lg font-black text-slate-900">{m.cifra}</div>
                    <div className="text-[11px] leading-tight text-slate-500">{m.pie}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── El problema local ───────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-relaxed text-slate-700">{ciudad.intro}</p>

            <h2 className="mt-12 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
              {ciudad.sectorTitulo}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">{ciudad.sectorTexto}</p>

            <div className="mt-8 space-y-4">
              {ciudad.dolores.map((d) => (
                <div key={d.titulo} className="rounded-2xl border border-slate-200 bg-white p-5">
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
                Qué cambia
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{ciudad.respuesta}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── El caso, con cifras ─────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
            <div>
              <img
                src={foto3}
                alt="Contador revisando el cierre del mes"
                loading="lazy"
                width={1200}
                height={800}
                className="w-full rounded-3xl object-cover shadow-lg"
                style={{ aspectRatio: '4 / 3' }}
              />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                La cuenta, en concreto
              </span>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
                {ciudad.caso.titulo}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{ciudad.caso.texto}</p>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Hoy</span>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{ciudad.caso.antes}</p>
                </div>
                <div
                  className="rounded-2xl p-4"
                  style={{ background: `${ciudad.color}0F`, border: `1px solid ${ciudad.color}33` }}
                >
                  <span className="text-[11px] font-black uppercase tracking-wide" style={{ color: ciudad.color }}>
                    Con la herramienta
                  </span>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{ciudad.caso.despues}</p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-slate-500">{ciudad.cierre}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Qué hace ────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="mx-auto max-w-3xl text-center text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
            Todo lo que hace, en un solo lugar
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600">
            Desde bajar los comprimidos del portal hasta dejar el archivo listo para importar en tu
            software contable.
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
            Ocho pasos se vuelven tres
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              { n: '1', t: 'Pide tu token', d: 'Entra al portal de la DIAN y solicítalo. Te llega un correo con un enlace; cópialo y pégalo aquí. Eso es lo único manual que queda.' },
              { n: '2', t: 'Pega los CUFE', d: 'Se descargan solos en la carpeta que elijas, a ritmo controlado. Si ya tienes los comprimidos, arrástralos y ya.' },
              { n: '3', t: 'Descarga tu Excel', d: 'Resumen, documentos, líneas e impuestos. O directamente en el formato de tu software contable.' },
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
        </div>
      </section>

      {/* ── Empezar gratis, y qué pasa después ──────────────────────────── */}
      <section className="bg-slate-950 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              Pruébala con tu propio mes
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-300">
              No hace falta que nos creas nada. Coge los comprimidos que ya tienes descargados,
              suéltalos, y compara el Excel que sale con el que armaste a mano. Si no te ahorra
              tiempo, no vuelves.
            </p>

            <Link
              to="/documentos-electronicos"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-7 py-4 text-sm font-black text-white transition hover:brightness-110"
              style={{ background: ciudad.color, boxShadow: `0 14px 32px ${ciudad.color}59` }}
            >
              <Download className="size-4" /> Empezar gratis
            </Link>

            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {[
                { icono: Check, t: 'Sin tarjeta', d: 'Empiezas con tu correo. No se pide medio de pago para probar.' },
                { icono: Lock, t: 'Tus archivos no viajan', d: 'Los XML se leen en tu navegador. Nunca se suben a un servidor.' },
                { icono: ShieldCheck, t: 'Sin claves de la DIAN', d: 'No se piden ni se guardan. Se usa el token temporal que la DIAN te envía.' },
              ].map((g) => (
                <div key={g.t} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <g.icono className="size-4.5" style={{ color: ciudad.color }} />
                  <h3 className="mt-2.5 text-sm font-black text-white">{g.t}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">{g.d}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              <h3 className="flex items-center gap-2 text-sm font-black text-white">
                <Sparkles className="size-4" style={{ color: ciudad.color }} />
                Cuando quieras más volumen
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                El plan completo cuesta <strong className="text-white">52.900 pesos al mes</strong>,
                sin permanencia y cancelable cuando quieras. Se paga desde Colombia, en pesos, con
                los medios de pago locales. Ningún cobro se hace sin que lo autorices, y el precio
                que ves es el que se cobra: sin cargos ocultos ni renovaciones sorpresa.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Antes de pagar ya sabes exactamente qué recibes, porque lo probaste gratis con tus
                propios documentos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marco legal ─────────────────────────────────────────────────── */}
      <section className="bg-white py-14">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-black text-slate-900">
              Sobre la facturación electrónica en Colombia
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              La facturación electrónica en Colombia se rige por la{' '}
              <strong className="text-slate-900">Resolución DIAN 000042 de 2020</strong> y sus
              modificaciones, que fijan el formato XML bajo el estándar UBL 2.1 y la obligación de
              conservar el documento electrónico. El XML —no el PDF— es el documento con validez: el
              PDF es una representación gráfica. Por eso esta herramienta trabaja siempre sobre el
              XML, que es donde están el CUFE, los códigos de impuesto y las bases gravables tal
              como se reportaron.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Herramienta disponible únicamente para Colombia.
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
            Preguntas de contadores
          </h2>
        }
      />

      {/* ── Enlaces internos ────────────────────────────────────────────
          Una página por ciudad enlaza a las otras ciudades; una por necesidad
          enlaza a las otras necesidades Y a las ciudades. Cruzarlas al azar
          repartiría mal la autoridad: lo que Google entiende como un grupo
          temático son páginas que se citan entre sí porque tratan lo mismo. */}
      {esCiudad ? (
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
      ) : (
        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-sm font-black uppercase tracking-wide text-slate-400">
              Otras preguntas que resuelve
            </h2>
            <div className="mx-auto mt-5 grid max-w-4xl gap-2.5 sm:grid-cols-2">
              {NECESIDADES_CONTADOR.filter((n) => n.slug !== ciudad.slug).slice(0, 8).map((n) => (
                <Link
                  key={n.slug}
                  to={`/${n.slug}`}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {n.h1Accent} {n.h1Rest}
                </Link>
              ))}
            </div>

            <h3 className="mt-10 text-center text-sm font-black uppercase tracking-wide text-slate-400">
              Y en tu ciudad
            </h3>
            <div className="mx-auto mt-4 flex max-w-4xl flex-wrap justify-center gap-2">
              {CIUDADES_CONTADOR.map((c) => (
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
      )}

      <LandingFooter />
    </div>
  );
}

export default function ContadorDianLanding() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\//, '').replace(/\/$/, '');
  // Las veinticuatro paginas -- doce por ciudad y doce por necesidad -- usan
  // esta misma plantilla y se distinguen por su slug.
  const ciudad =
    CIUDADES_CONTADOR.find((c) => c.slug === slug)
    ?? NECESIDADES_CONTADOR.find((n) => n.slug === slug)
    ?? CIUDADES_CONTADOR[0];

  return (
    <FixedLanguageProvider defaultLanguage="es">
      <Contenido ciudad={ciudad} />
    </FixedLanguageProvider>
  );
}

export type { CiudadContadorSeo };
