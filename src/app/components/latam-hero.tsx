import { motion } from 'motion/react';
import { ArrowRight, Zap, Upload, PenLine, Palette, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

/** Same visual language as ModernHero (background photo, dark gradient
 * overlay, glassmorphism cards) — shown instead of ModernHero for
 * visitors detected outside the US (see modern-home-page.tsx). US
 * document templates aren't the lead here since they mean nothing for
 * a Colombian rental or an Argentine NDA; the 4 core actions (upload,
 * sign, personalize, certify) are universal regardless of country. */

const ACTIONS: Array<{ icon: LucideIcon; titleEn: string; titleEs: string; descEn: string; descEs: string; href: string; color: string }> = [
  { icon: Upload, titleEn: 'Create Document', titleEs: 'Crear Documento', descEn: 'Upload a Word or PDF file', descEs: 'Sube un archivo Word o PDF', href: '/firma-electronica', color: '#2563eb' },
  { icon: PenLine, titleEn: 'Sign Document', titleEs: 'Firmar Documento', descEn: 'Sign online with full legal validity', descEs: 'Firma en línea con validez legal', href: '/firma-electronica', color: '#7c3aed' },
  { icon: Palette, titleEn: 'Personalize Document', titleEs: 'Personalizar Documento', descEn: 'Your logo, header and brand', descEs: 'Tu logo, membrete y marca', href: '/my-branding', color: '#059669' },
  { icon: ShieldCheck, titleEn: 'Certify Document', titleEs: 'Certificar Documento', descEn: 'Generate legal evidence', descEs: 'Genera evidencia legal', href: '/firma-electronica', color: '#dc2626' },
];

const TRUST_CHIPS = [
  { en: 'Legally Valid', es: 'Con Validez Legal' },
  { en: 'Biometric Evidence', es: 'Evidencia Biométrica' },
  { en: 'Signature Certificate', es: 'Certificado de Firma' },
  { en: 'Your Own Branding', es: 'Con tu Propia Marca' },
];

function ActionCard({ action, language }: { action: typeof ACTIONS[0]; language: 'en' | 'es' }) {
  const Icon = action.icon;
  return (
    <a
      href={action.href}
      style={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.10)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.22)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
        padding: '0', overflow: 'hidden', textDecoration: 'none', display: 'block',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 16px 48px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.22)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.18)';
      }}
    >
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${action.color}, ${action.color}88)` }} />
      <div style={{ padding: '18px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
          <Icon size={17} color="white" />
        </div>
        <p style={{ fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3, marginBottom: '4px' }}>
          {language === 'en' ? action.titleEn : action.titleEs}
        </p>
        <p style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
          {language === 'en' ? action.descEn : action.descEs}
        </p>
      </div>
    </a>
  );
}

export function LatamHero() {
  const { language } = useLanguage();

  return (
    <section className="relative min-h-[88vh] overflow-hidden">
      <div className="absolute inset-0">
        <img src="/imagen2.jpg" alt="" className="h-full w-full object-cover" loading="eager" draggable={false} />
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(100deg, rgba(5,10,24,0.94) 0%, rgba(5,10,24,0.78) 38%, rgba(5,10,24,0.52) 62%, rgba(5,10,24,0.28) 100%)' }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

      <div className="relative z-10 flex min-h-[88vh] items-center">
        {/* LEFT — copy */}
        <div className="flex w-full flex-col justify-center px-5 pt-20 pb-14 sm:px-8 sm:pt-24 sm:pb-16 lg:w-[54%] lg:px-12 xl:px-16 lg:pt-0 lg:pb-0 lg:py-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="mb-3 text-3xl font-black leading-[1.1] tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.60)] sm:text-4xl lg:text-[3.1rem]">
              <span className="text-blue-400">{language === 'en' ? 'Sign, Personalize & Certify' : 'Firma, Personaliza y Certifica'}</span>{' '}
              <span className="text-white">{language === 'en' ? 'Your Documents Online' : 'tus Documentos en Línea'}</span>
            </h1>
            <p className="text-sm font-medium leading-relaxed text-white/65 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:text-base md:text-lg">
              {language === 'en'
                ? 'Upload, personalize, sign and certify documents online — with legal validity under your own country\'s law.'
                : 'Sube, personaliza, firma y certifica documentos online — con validez legal según la ley de tu propio país.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {TRUST_CHIPS.map((chip) => (
                <span key={chip.en} className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-sm">
                  {'✓'} {language === 'en' ? chip.en : chip.es}
                </span>
              ))}
            </div>
          </motion.div>

          {/* CTAs */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href="/firma-electronica"
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:px-7 sm:py-4"
              style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)', boxShadow: '0 4px 0 #1e3a8a, 0 8px 24px rgba(29,78,216,0.55)' }}
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Zap className="size-4 shrink-0" />
              {language === 'en' ? 'Start Free Now' : 'Empieza Gratis Ahora'}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <button
              type="button"
              onClick={() => document.getElementById('documents-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/22 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/16 sm:px-7 sm:py-4"
            >
              {language === 'en' ? 'Documents for the US' : 'Documentos para EE. UU.'}
              <ArrowRight className="size-4 opacity-50" />
            </button>
          </div>

          <p className="mt-6 text-[11px] font-semibold text-white/35">
            {language === 'en' ? 'No credit card required · Free document every 72 hours' : 'Sin tarjeta de crédito · Un documento gratis cada 72 horas'}
          </p>
        </div>

        {/* RIGHT — 4 core actions */}
        <div className="hidden lg:flex lg:w-[46%] flex-col items-center justify-center py-16 pr-6">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
            {language === 'en' ? 'Everything you need, in one place' : 'Todo lo que necesitas, en un solo lugar'}
          </p>
          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            {ACTIONS.map((action) => (
              <ActionCard key={action.titleEn} action={action} language={language} />
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/95 via-white/35 to-transparent sm:h-12" />
    </section>
  );
}
