import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Zap, ChevronLeft, ChevronRight, Upload, PenLine, Palette, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';

/** Same exact mechanics as ModernHero (rotating background carousel +
 * auto-scrolling glass card strip) — shown instead of ModernHero for
 * visitors detected outside the US (see modern-home-page.tsx). Only the
 * CONTENT changes: no US state/document claims, and the 4 universal
 * actions (upload, sign, personalize, certify) replace the 6 US
 * document templates, since those mean nothing for a Colombian rental
 * or an Argentine NDA. Same visual energy, different data. */

const SLIDES = [
  {
    image: '/imagen1.jpg',
    text1Es: 'Sube, Firma y Certifica', text2Es: 'tus documentos en línea.',
    text1En: 'Upload, Sign & Certify', text2En: 'your documents online.',
    subEs: 'Sube tu documento, personalízalo con tu marca, fírmalo con validez legal, y descarga el certificado — todo desde un solo lugar.',
    subEn: 'Upload your document, personalize it with your brand, sign it with legal validity, and download the certificate — all in one place.',
  },
  {
    image: '/imagen2.jpg',
    text1Es: 'Personalización', text2Es: 'con tu logo y marca.',
    text1En: 'Personalization', text2En: 'with your logo and brand.',
    subEs: 'Logo empresarial, membrete y pie de página automáticos en cada documento que generes o envíes a firmar.',
    subEn: 'Company logo, header and footer automatically applied to every document you generate or send to sign.',
  },
  {
    image: '/imagen3.jpg',
    text1Es: 'Firma Electrónica', text2Es: 'segura y verificable.',
    text1En: 'Electronic Signature', text2En: 'secure and verifiable.',
    subEs: 'Verificación de identidad con biometría. Pista de auditoría SHA-256 con geolocalización e IP automático.',
    subEn: 'Identity verification with biometric authentication. SHA-256 audit trail with automatic geolocation and IP logging.',
  },
  {
    image: '/imagen4.jpg',
    text1Es: 'Certificado de Firma', text2Es: 'incluido en cada documento.',
    text1En: 'Signature Certificate', text2En: 'included in every document.',
    subEs: 'Evidencia legal completa: identidad verificada, fecha, hora, IP y hash SHA-256, dentro del mismo PDF firmado.',
    subEn: 'Complete legal evidence: verified identity, date, time, IP and SHA-256 hash, inside the same signed PDF.',
  },
];

const ACTIONS: Array<{ icon: LucideIcon; titleEn: string; titleEs: string; badge: string; color: string; route: string }> = [
  { icon: Upload, titleEn: 'Create\nDocument', titleEs: 'Crear\nDocumento', badge: 'SUBIR PDF', color: '#2563eb', route: '/firma-electronica' },
  { icon: PenLine, titleEn: 'Sign\nDocument', titleEs: 'Firmar\nDocumento', badge: 'FIRMA', color: '#7c3aed', route: '/firma-electronica' },
  { icon: Palette, titleEn: 'Personalize\nDocument', titleEs: 'Personalizar\nDocumento', badge: 'MARCA', color: '#059669', route: '/my-branding' },
  { icon: ShieldCheck, titleEn: 'Certify\nDocument', titleEs: 'Certificar\nDocumento', badge: 'EVIDENCIA', color: '#dc2626', route: '/firma-electronica' },
];

const SIMULATED_LINES = [100, 76, 92, 58, 85];
const INTERVAL_MS = 5500;

const textVariants = {
  enter: (dir: number) => ({ y: dir >= 0 ? 24 : -24, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir >= 0 ? -16 : 16, opacity: 0 }),
};

function ActionCard({ action, language }: { action: typeof ACTIONS[0]; language: 'en' | 'es' }) {
  const Icon = action.icon;
  const title = language === 'en' ? action.titleEn : action.titleEs;
  return (
    <a
      href={action.route}
      style={{
        width: '178px', flexShrink: 0, borderRadius: '20px',
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
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} color="white" />
          </div>
          <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.90)', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '2px 7px', borderRadius: '20px' }}>{action.badge}</span>
        </div>
        <p style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', lineHeight: 1.35, marginBottom: '10px', whiteSpace: 'pre-line' }}>{title}</p>
        <div style={{ marginBottom: '12px' }}>
          {SIMULATED_LINES.map((w, i) => (
            <div key={i} style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.20)', marginBottom: '5px', width: `${w}%` }} />
          ))}
        </div>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', marginBottom: '10px' }} />
        <div style={{
          width: '100%', borderRadius: '10px',
          background: `linear-gradient(180deg, ${action.color}dd, ${action.color})`,
          boxShadow: `0 3px 0 ${action.color}99, 0 5px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)`,
          color: 'white', fontWeight: 800, fontSize: '10px', textAlign: 'center',
          padding: '8px 0', letterSpacing: '0.04em', textShadow: '0 1px 2px rgba(0,0,0,0.30)',
        }}>{language === 'en' ? 'Start' : 'Empezar'}</div>
      </div>
    </a>
  );
}

export function LatamHero() {
  const { language } = useLanguage();
  const [[current, direction], setSlide] = useState([0, 1]);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    SLIDES.forEach((s) => { const img = new Image(); img.src = s.image; });
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setSlide(([p]) => [(p + 1) % SLIDES.length, 1]), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  const goTo = (next: number, dir: number) => {
    const idx = ((next % SLIDES.length) + SLIDES.length) % SLIDES.length;
    setSlide([idx, dir]);
    setPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPaused(false), 9000);
  };

  const prev = () => goTo(current - 1, -1);
  const next = () => goTo(current + 1, 1);
  const trackX = `${-current * (100 / SLIDES.length)}%`;

  const carouselCards = [...ACTIONS, ...ACTIONS];
  const trustChips = language === 'en'
    ? ['Legally Valid', 'Biometric Evidence', 'Signature Certificate', 'Your Own Branding']
    : ['Con Validez Legal', 'Evidencia Biométrica', 'Certificado de Firma', 'Con tu Propia Marca'];

  return (
    <section
      className="relative min-h-[88vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <style>{`
        @keyframes latamCardScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Background strip */}
      <div className="absolute inset-0">
        <motion.div
          className="flex h-full"
          style={{ width: `${SLIDES.length * 100}%`, willChange: 'transform' }}
          animate={{ x: trackX }}
          transition={{ duration: 0.72, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {SLIDES.map((slide) => (
            <div key={slide.image} className="relative h-full shrink-0" style={{ width: `${100 / SLIDES.length}%` }}>
              <img src={slide.image} alt="" className="h-full w-full object-cover" loading="eager" draggable={false} />
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(100deg, rgba(5,10,24,0.94) 0%, rgba(5,10,24,0.78) 38%, rgba(5,10,24,0.52) 62%, rgba(5,10,24,0.28) 100%)' }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

      <div className="relative z-10 flex min-h-[88vh] items-center">
        {/* LEFT — text */}
        <div className="flex w-full flex-col justify-center px-5 pt-20 pb-14 sm:px-8 sm:pt-24 sm:pb-16 lg:w-[54%] lg:px-12 xl:px-16 lg:pt-0 lg:pb-0 lg:py-16">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold tracking-wider text-white/55 backdrop-blur-sm">
            <span className="flex size-1.5 rounded-full bg-blue-400" />
            {String(current + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </div>

          <div className="relative min-h-[180px] sm:min-h-[200px] lg:min-h-[240px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={textVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1 className="mb-3 text-3xl font-black leading-[1.1] tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.60)] sm:text-4xl lg:text-[3.1rem]">
                  <span className="text-blue-400">{language === 'en' ? SLIDES[current].text1En : SLIDES[current].text1Es}</span>{' '}
                  <span className="text-white">{language === 'en' ? SLIDES[current].text2En : SLIDES[current].text2Es}</span>
                </h1>
                <p className="text-sm font-medium leading-relaxed text-white/65 drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] sm:text-base md:text-lg">
                  {language === 'en' ? SLIDES[current].subEn : SLIDES[current].subEs}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trustChips.map((chip) => (
                    <span key={chip} className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300 backdrop-blur-sm">
                      {'✓'} {chip}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CTAs */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href="/firma-electronica"
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:px-7 sm:py-4"
              style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)', boxShadow: '0 4px 0 #1e3a8a, 0 8px 24px rgba(29,78,216,0.55)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 0 #1e3a8a, 0 12px 32px rgba(29,78,216,0.65)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 0 #1e3a8a, 0 8px 24px rgba(29,78,216,0.55)'; }}
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

          {/* Slide controls */}
          <div className="mt-8 flex items-center gap-3">
            <button type="button" onClick={prev} aria-label="Previous"
              className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white/60 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/35 hover:text-white">
              <ChevronLeft className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              {SLIDES.map((_, i) => (
                <button key={i} type="button" onClick={() => goTo(i, i > current ? 1 : -1)} aria-label={`Slide ${i + 1}`}
                  className={['h-1.5 rounded-full transition-all duration-500', i === current ? 'w-7 bg-white shadow-[0_0_6px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/30 hover:bg-white/55'].join(' ')}
                />
              ))}
            </div>
            <button type="button" onClick={next} aria-label="Next"
              className="flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white/60 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/35 hover:text-white">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* RIGHT — moving action-card carousel, desktop only */}
        <div className="hidden lg:flex lg:w-[46%] flex-col items-center justify-center py-16 pr-6">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/35">
            {language === 'en' ? 'Click any card to start' : 'Haz clic en una tarjeta para empezar'}
          </p>

          <div
            className="relative w-full overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            }}
          >
            <div
              className="flex gap-4 py-3"
              style={{ width: 'max-content', animation: 'latamCardScroll 22s linear infinite', willChange: 'transform' }}
            >
              {carouselCards.map((action, i) => (
                <ActionCard key={`card-${i}`} action={action} language={language} />
              ))}
            </div>
          </div>

          <p className="mt-4 text-[10px] font-semibold text-white/28">
            {language === 'en' ? 'Upload, sign, personalize, certify · 2026' : 'Sube, firma, personaliza, certifica · 2026'}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/95 via-white/35 to-transparent sm:h-12" />
    </section>
  );
}
