import { useEffect, useState } from 'react';
import { Shield, FileText, PenLine, QrCode, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useLanguage } from '../../contexts/language-context';
import { LanguageToggle } from '../language-toggle';

/**
 * Same visual language as the sticky header on the Home page (dark,
 * glassmorphism on scroll, blue/indigo glow) — kept as a separate,
 * simplified component (no mega-menu / user-menu / onboarding-modal wiring)
 * so it can be reused on SEO landing pages without touching any of the
 * Home page's own state or business logic.
 */
export function LandingHeader() {
  const { language } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { href: '/', icon: FileText, labelEn: 'Templates', labelEs: 'Plantillas' },
    { href: '/free-legal-documents', icon: FileText, labelEn: 'Free Docs', labelEs: 'Documentos gratis' },
    { href: '/firma-electronica', icon: QrCode, labelEn: 'Signatures', labelEs: 'Firmas' },
  ];

  return (
    <header
      className={[
        'sticky top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-white/8 bg-slate-950/90 shadow-[0_4px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl'
          : 'border-b border-transparent bg-slate-950',
      ].join(' ')}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <a href="/" className="group flex items-center gap-2.5">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-shadow duration-300 group-hover:shadow-[0_0_28px_rgba(99,102,241,0.7)]">
              <Shield className="size-5 text-white" />
              <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
            </div>
            <div>
              <span translate="no" className="notranslate block text-base font-black tracking-tight text-white">
                Codec <span className="text-indigo-400">Document</span>
              </span>
              <span className="block text-[10px] font-medium text-white/35 leading-none">
                {language === 'en' ? 'Legal · Signatures · AI' : 'Legal · Firmas · IA'}
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-white/60 transition hover:bg-white/8 hover:text-white"
                >
                  <Icon className="size-4" />
                  {language === 'en' ? item.labelEn : item.labelEs}
                </a>
              );
            })}
            <a
              href="/#plan-ultimate"
              className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium text-amber-400/80 transition hover:bg-amber-400/10 hover:text-amber-300"
            >
              {language === 'en' ? 'Plans' : 'Planes'}
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/firma-electronica"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-[0_0_16px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_0_24px_rgba(99,102,241,0.6)]"
            >
              <PenLine className="size-3.5" />
              {language === 'en' ? 'Sign now' : 'Firmar ahora'}
            </a>
            <LanguageToggle />
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden flex size-9 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-white/70 transition hover:bg-white/12 hover:text-white"
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/8 bg-slate-950 md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-1 px-4 py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/8 hover:text-white"
                  >
                    <Icon className="size-4" />
                    {language === 'en' ? item.labelEn : item.labelEs}
                  </a>
                );
              })}
              <a
                href="/firma-electronica"
                className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-2.5 text-sm font-bold text-white"
              >
                <PenLine className="size-3.5" />
                {language === 'en' ? 'Sign now' : 'Firmar ahora'}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
