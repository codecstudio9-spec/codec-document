import { motion } from 'motion/react';
import { ArrowRight, Zap, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../contexts/language-context';

const TRUST_BADGES = [
  { en: 'ESIGN Compliant', es: 'Conforme ESIGN' },
  { en: 'UETA Compliant', es: 'Conforme UETA' },
  { en: 'Audit Trail Included', es: 'Pista de auditoría incluida' },
  { en: 'Identity Verification', es: 'Verificación de identidad' },
];

const MOCK_LINES = [100, 78, 92, 60, 85, 45];

/** Glassmorphism document-preview mockup — same visual language as the
 * template cards in the Home hero carousel (GlassCard in modern-hero.tsx),
 * but this is a static mockup, not a real document render. */
function DocumentPreviewMock({ badge, color, icon: Icon, previewLabel }: {
  badge: string; color: string; icon: LucideIcon; previewLabel: string;
}) {
  return (
    <div
      className="w-full max-w-sm rounded-3xl p-0 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.16)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.14)',
      }}
    >
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex size-11 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
            <Icon size={20} color="white" />
          </div>
          <span className="rounded-full px-3 py-1 text-[10px] font-black tracking-widest text-white/90" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)' }}>
            {badge}
          </span>
        </div>
        <p className="mb-4 text-sm font-bold text-white/90">{previewLabel}</p>
        <div className="mb-5 space-y-2">
          {MOCK_LINES.map((w, i) => (
            <div key={i} className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.14)', width: `${w}%` }} />
          ))}
        </div>
        <div className="mb-4 h-px" style={{ background: 'rgba(255,255,255,0.10)' }} />
        <div className="flex items-center gap-2">
          <div className="h-9 flex-1 rounded-xl border-2 border-dashed" style={{ borderColor: 'rgba(255,255,255,0.18)' }} />
          <div className="h-9 w-20 rounded-xl" style={{ background: `${color}33`, border: `1px solid ${color}55` }} />
        </div>
      </div>
    </div>
  );
}

export function LandingHero({
  documentId, badge, color, icon, previewLabel,
  titleAccentEn, titleAccentEs, titleRestEn, titleRestEs,
  subtitleEn, subtitleEs, ctaLabelEn, ctaLabelEs,
  ctaHref, secondaryLabelEn, secondaryLabelEs, secondaryHref,
}: {
  documentId: string;
  badge: string;
  color: string;
  icon: LucideIcon;
  previewLabel: string;
  titleAccentEn: string;
  titleAccentEs: string;
  titleRestEn: string;
  titleRestEs: string;
  subtitleEn: string;
  subtitleEs: string;
  ctaLabelEn: string;
  ctaLabelEs: string;
  /** Override the primary CTA target — defaults to /generator/:documentId */
  ctaHref?: string;
  secondaryLabelEn?: string;
  secondaryLabelEs?: string;
  secondaryHref?: string;
}) {
  const { language } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
      {/* Radial glow + grid, same treatment as Home's dark sections */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 60% at 20% 20%, ${color}22, transparent), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(99,102,241,0.16), transparent)` }} />
      <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* LEFT — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/60 backdrop-blur-sm">
              <span className="flex size-1.5 rounded-full" style={{ background: color }} />
              {badge}
            </span>

            <h1 className="mb-4 text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              <span style={{ color }}>{language === 'en' ? titleAccentEn : titleAccentEs}</span>{' '}
              <span>{language === 'en' ? titleRestEn : titleRestEs}</span>
            </h1>

            <p className="mb-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg">
              {language === 'en' ? subtitleEn : subtitleEs}
            </p>

            {/* Trust badges */}
            <div className="mb-8 flex flex-wrap gap-2">
              {TRUST_BADGES.map((chip) => (
                <span key={chip.en} className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300 backdrop-blur-sm">
                  ✓ {language === 'en' ? chip.en : chip.es}
                </span>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={ctaHref ?? `/generator/${documentId}`}
                className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-7 py-4 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)', boxShadow: '0 4px 0 #1e3a8a, 0 8px 24px rgba(29,78,216,0.55)' }}
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <Zap className="size-4 shrink-0" />
                {language === 'en' ? ctaLabelEn : ctaLabelEs}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </a>
              <a
                href={secondaryHref ?? `/generator/${documentId}`}
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/22 bg-white/10 px-7 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/16"
              >
                {language === 'en' ? (secondaryLabelEn ?? 'View Sample') : (secondaryLabelEs ?? 'Ver Ejemplo')}
              </a>
            </div>
          </motion.div>

          {/* RIGHT — document preview mock */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <DocumentPreviewMock badge={badge} color={color} icon={icon} previewLabel={previewLabel} />
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/95 via-white/25 to-transparent sm:h-14" />
    </section>
  );
}
