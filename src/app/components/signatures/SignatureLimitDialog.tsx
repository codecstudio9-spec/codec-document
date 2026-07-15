import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '../ui/dialog';
import { PaypalSignatureCheckout } from './PaypalSignatureCheckout';
import { useAuth } from '../../contexts/auth-context';

interface SignatureLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  /** When the next free slot opens (72h rolling window) — null if unknown. */
  nextSlotAt: Date | null;
  /** Called once payment succeeds, so the caller can retry the action that was blocked. */
  onUnlocked: () => void;
}

function formatWait(nextSlotAt: Date | null): string {
  if (!nextSlotAt) return '';
  const ms = nextSlotAt.getTime() - Date.now();
  if (ms <= 0) return '';
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  return hours <= 1
    ? ' Vuelve a intentarlo en menos de 1 hora, o'
    : ` Vuelve a intentarlo en ${hours} horas, o`;
}

/**
 * Premium, on-brand replacement for the plain white/black-border alert that
 * used to show "Alcanzaste el límite gratuito de solicitudes de firma de
 * hoy (2/día)..." — no emojis, real Dialog (Radix/Shadcn) with backdrop
 * blur, responsive on mobile (full-width with margins) and desktop
 * (fixed max-w-md card). Offers a working upgrade path inline instead of a
 * dead end.
 */
export function SignatureLimitDialog({
  open, onOpenChange, userId, nextSlotAt, onUnlocked,
}: SignatureLimitDialogProps) {
  const [showCheckout, setShowCheckout] = useState(false);
  const { signInWithGoogle } = useAuth();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setShowCheckout(false);
      }}
    >
      <DialogContent className="max-w-md border-white/10 bg-slate-950 p-0 text-white sm:max-w-lg [&>button]:text-white/50 [&>button]:hover:text-white">
        <div className="pointer-events-none absolute inset-0 rounded-lg" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.18), transparent)' }} />
        <div className="relative p-6">
          {!showCheckout ? (
            <>
              <DialogHeader className="items-center text-center sm:text-center">
                <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/30">
                  <AlertTriangle className="size-7 text-amber-400" />
                </div>
                <DialogTitle className="text-xl font-black text-white">
                  Límite de firmas gratuitas alcanzado
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-white/60">
                  Has alcanzado el límite de solicitudes de firma gratuitas (máximo permitido cada 72 horas).
                  Mejora tu plan para seguir firmando sin interrupciones.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 40%, #1d4ed8 100%)', boxShadow: '0 4px 0 #1e3a8a, 0 8px 24px rgba(29,78,216,0.55)' }}
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Zap className="size-4" />
                  Mejorar mi plan
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10"
                >
                  {formatWait(nextSlotAt)} cerrar
                </button>
              </div>
            </>
          ) : userId ? (
            <PaypalSignatureCheckout
              userId={userId}
              onSuccess={() => {
                onUnlocked();
                onOpenChange(false);
              }}
            />
          ) : (
            // Anonymous: paypal-verify only grants credit when it can
            // resolve a userId from the caller's JWT, so a payment flow
            // here would take money without unlocking anything. Offer a
            // free sign-in instead — same fix as the electronic-signature
            // paywall overlay.
            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-center backdrop-blur-xl">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 ring-1 ring-indigo-400/20">
                <ShieldCheck className="size-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Inicia sesión para continuar</h3>
              <p className="mt-1 text-sm text-white/50">
                Ya usaste tus solicitudes de firma gratuitas como invitado. Crea una cuenta gratis (o inicia sesión) para seguir, o desbloquea más con un pago.
              </p>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                Continuar con Google
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
