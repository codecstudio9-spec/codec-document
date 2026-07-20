import { Shield, BadgeCheck, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../contexts/language-context';
import { STATES } from '../../data/doctype-state-seo-content';
import { LATAM_COUNTRIES } from '../../data/latam-signature-seo-content';

/**
 * Same visual language as the Home page footer (dark, pre-footer CTA strip,
 * 4-column layout, compliance badges) — a separate component so landing
 * pages don't depend on Home's internal state/anchors.
 */
export function LandingFooter() {
  const { language } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-400">
      {/* Pre-footer CTA strip */}
      <div className="border-b border-white/8 bg-gradient-to-r from-blue-600 to-indigo-600 py-8 md:py-10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-black text-white sm:text-2xl md:text-3xl">
            {language === 'en' ? 'Ready to sign your first document?' : '¿Listo para firmar tu primer documento?'}
          </h3>
          <p className="mt-2 text-blue-100">
            {language === 'en'
              ? 'Create your free account in 30 seconds. No credit card required.'
              : 'Crea tu cuenta gratis en 30 segundos. Sin tarjeta de crédito.'}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/firma-electronica"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <CheckCircle2 className="size-4" />
              {language === 'en' ? 'Get Started Free' : 'Empezar Gratis'}
            </a>
            <a
              href="/#plan-ultimate"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              {language === 'en' ? 'View Plans' : 'Ver Planes'}
            </a>
          </div>
        </div>
      </div>

      {/* Footer body */}
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-10 md:gap-10 md:mb-12">
            {/* Col 1: Brand */}
            <div className="lg:col-span-1">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_16px_rgba(99,102,241,0.4)]">
                  <Shield className="size-5 text-white" />
                </div>
                <span translate="no" className="notranslate text-base font-black text-white">
                  Codec <span className="text-indigo-400">Document</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400">
                {language === 'en'
                  ? 'Free intelligent legal document generator and ESIGN Act compliant e-signature platform for the United States.'
                  : 'Editor inteligente gratuito de documentos legales y plataforma de firma electrónica conforme con ESIGN para EE. UU.'}
              </p>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
                {language === 'en' ? 'Product' : 'Producto'}
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/" className="transition hover:text-white">{language === 'en' ? 'Templates' : 'Plantillas'}</a></li>
                <li><a href="/firma-electronica" className="transition hover:text-white">{language === 'en' ? 'E-Signatures' : 'Firmas Electrónicas'}</a></li>
                <li><a href="/my-documents" className="transition hover:text-white">{language === 'en' ? 'My Documents' : 'Mis Documentos'}</a></li>
                <li><a href="/#plan-ultimate" className="transition hover:text-amber-300 text-amber-400/70">{language === 'en' ? 'Pricing' : 'Precios'}</a></li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
                {language === 'en' ? 'Resources' : 'Recursos'}
              </h4>
              <ul className="space-y-3 text-sm">
                <li><a href="/blog" className="transition hover:text-white">{language === 'en' ? 'Guides & Blog' : 'Guías y Blog'}</a></li>
                <li><a href="/free-legal-documents" className="transition hover:text-white">{language === 'en' ? 'Free Legal Docs' : 'Documentos Legales Gratis'}</a></li>
                <li><a href="/electronic-signature" className="transition hover:text-white">{language === 'en' ? 'E-Signature Platform' : 'Plataforma de Firma Electrónica'}</a></li>
                <li><a href="/nda-generator" className="transition hover:text-white">{language === 'en' ? 'NDA Generator' : 'Generador de NDA'}</a></li>
                <li><a href="/online-lease-agreement" className="transition hover:text-white">{language === 'en' ? 'Lease Agreement' : 'Contrato de Arrendamiento'}</a></li>
                <li><a href="/promissory-note" className="transition hover:text-white">{language === 'en' ? 'Promissory Note' : 'Pagaré Comercial'}</a></li>
              </ul>
            </div>

            {/* Col 4: Compliance */}
            <div>
              <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
                {language === 'en' ? 'Compliance' : 'Cumplimiento'}
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: 'ESIGN Act Compliant', sub: '15 U.S.C. § 7001' },
                  { label: 'UETA Compliant', sub: 'All 50 U.S. States' },
                  { label: 'SHA-256 Audit Trail', sub: 'Tamper-evident' },
                  { label: 'SSL / TLS Encrypted', sub: 'End-to-end secure' },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-300">{c.label}</p>
                      <p className="text-[10px] text-slate-600">{c.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Popular states — internal links so the state SEO pages are
              crawlable from every landing page, not just the sitemap. */}
          <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">{language === 'en' ? 'Popular states:' : 'Estados populares:'}</span>
            {STATES.map((s, i, arr) => (
              <span key={s.slug}>
                <a href={`/legal-documents-${s.slug}`} className="transition hover:text-white">{language === 'en' ? s.name : s.nameEs}</a>
                {i < arr.length - 1 && <span className="text-slate-700">,</span>}
              </span>
            ))}
          </div>

          {/* LatAm country flags — quick navigation to each country's
              e-signature page, kept at the bottom of every landing page
              (not competing with the hero) so it reads as a footer nav
              element, same spirit as "Popular states" above. */}
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-600">{language === 'en' ? 'Also in Latin America:' : 'También en Latinoamérica:'}</span>
            {LATAM_COUNTRIES.map((c) => (
              <a
                key={c.slug}
                href={`/firma-electronica-${c.slug}`}
                className="inline-flex items-center gap-1 transition hover:text-white"
              >
                <span>{c.flag}</span>
                {language === 'en' ? c.name : c.nameEs}
              </a>
            ))}
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} <span translate="no" className="notranslate">Codec Document</span>. {language === 'en' ? 'All rights reserved.' : 'Todos los derechos reservados.'}
              {' · '}
              <a href="https://www.codecstudio.online/" target="_blank" rel="noopener noreferrer" className="transition hover:text-white">
                {language === 'en' ? 'Designed by' : 'Diseñado por'} <span translate="no" className="notranslate">Codec Studio</span>
              </a>
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <a href="/terms" className="transition hover:text-white">{language === 'en' ? 'Terms' : 'Términos'}</a>
              <a href="/privacy" className="transition hover:text-white">{language === 'en' ? 'Privacy' : 'Privacidad'}</a>
              <a href="/refund-policy" className="transition hover:text-white">{language === 'en' ? 'Refunds' : 'Reembolsos'}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
