import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Shield, Menu, X, PenLine } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { LanguageToggle } from '../components/language-toggle';
import { SEOHead } from '../components/seo-head';
import { PricingSection } from '../components/pricing-section';
import { LandingFooter } from '../components/landing/LandingFooter';
import { SITE_URL } from '../config/site';

/**
 * Independent pricing page (/pricing) — extracted out of the home page's
 * embedded #plan-ultimate section so a second pricing model (enterprise /
 * per-seat / whatever comes next) has somewhere to live without turning
 * the home page into a second pricing page too. PricingSection itself
 * (cards, PayPal checkout, promo codes, admin bypass) is reused completely
 * unchanged — only the page chrome around it is new.
 *
 * Deliberately its own small light header instead of the shared
 * LandingHeader (dark, used by every SEO landing page) or Home's own
 * header (stateful mega-menu, not needed here) — matches the new light
 * home page look without touching either of those shared components.
 */
export function PricingPage() {
  const { language } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={language === 'en' ? 'Pricing — Codec Document' : 'Precios — Codec Document'}
        description={language === 'en'
          ? 'Simple, transparent pricing for unlimited legal documents and e-signatures. Try your first document or signature free.'
          : 'Precios simples y transparentes para documentos legales y firmas electrónicas ilimitadas. Tu primer documento o firma va por nuestra cuenta.'}
        canonicalUrl={`${SITE_URL}/pricing`}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="group flex items-center gap-2.5">
              <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_2px_10px_rgba(79,70,229,0.35)]">
                <Shield className="size-5 text-white" />
                <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              </div>
              <span translate="no" className="notranslate block text-base font-black tracking-tight text-slate-900">
                Codec <span className="text-indigo-600">Document</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <a
                href="/firma-electronica"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_2px_10px_rgba(79,70,229,0.35)] transition-all hover:shadow-[0_4px_16px_rgba(79,70,229,0.5)]"
              >
                <PenLine className="size-3.5" />
                {language === 'en' ? 'Sign now' : 'Firmar ahora'}
              </a>
              <LanguageToggle />
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu"
                className="sm:hidden flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
              >
                {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-slate-200 bg-white sm:hidden"
            >
              <div className="container mx-auto px-4 py-3">
                <a
                  href="/firma-electronica"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2.5 text-sm font-bold text-white"
                >
                  <PenLine className="size-3.5" />
                  {language === 'en' ? 'Sign now' : 'Firmar ahora'}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page intro — PricingSection has its own heading, this just frames
          the page above it with a breadcrumb-style back link. */}
      <div className="container mx-auto px-4 pt-6">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition hover:text-slate-600">
          ← {language === 'en' ? 'Back to home' : 'Volver al inicio'}
        </Link>
      </div>

      <PricingSection />

      <LandingFooter />
    </div>
  );
}
