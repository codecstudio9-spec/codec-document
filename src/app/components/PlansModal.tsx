import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../contexts/language-context';
import { PricingSection } from './pricing-section';

/**
 * "Ver planes" from inside the authenticated app (mobile /app/profile,
 * desktop /dashboard/profile) used to just navigate to "/#plan-ultimate"
 * — the pricing anchor on the public landing. That broke once signed-in
 * visitors started getting redirected straight out of "/" (mobile → /app,
 * desktop → /dashboard): the anchor scroll never had a chance to happen
 * before the redirect fired, so the plans never appeared. This renders
 * the exact same PricingSection (real plans, real PayPal checkout,
 * untouched) instead — but inside a proper contained modal card (rounded,
 * centered, its own header) rather than the landing section full-bleed
 * on top of a dark overlay, which read as "a webpage stuffed into a
 * popup" from inside the dashboard.
 */
export function PlansModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { language } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-start justify-center overflow-y-auto bg-black/70 p-4 py-8 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl overflow-hidden rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#001220] px-5 py-3.5">
          <p className="text-sm font-bold text-white">
            {language === 'en' ? 'Choose your plan' : 'Elige tu plan'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="size-4.5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-56px)] overflow-y-auto">
          <PricingSection />
        </div>
      </div>
    </div>
  );
}
