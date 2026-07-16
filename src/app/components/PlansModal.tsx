import { X } from 'lucide-react';
import { PricingSection } from './pricing-section';

/**
 * "Ver planes" from inside the authenticated app (mobile /app/profile,
 * desktop /dashboard/profile) used to just navigate to "/#plan-ultimate"
 * — the pricing anchor on the public landing. That broke once signed-in
 * visitors started getting redirected straight out of "/" (mobile → /app,
 * desktop → /dashboard): the anchor scroll never had a chance to happen
 * before the redirect fired, so the plans never appeared. This renders
 * the exact same PricingSection (real plans, real PayPal checkout) in a
 * modal instead, so it works regardless of that redirect.
 */
export function PlansModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] overflow-y-auto bg-black/70">
      <div className="sticky top-0 z-10 flex justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="-mt-16">
        <PricingSection />
      </div>
    </div>
  );
}
