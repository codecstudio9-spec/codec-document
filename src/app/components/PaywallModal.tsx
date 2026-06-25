import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent } from './ui/dialog';
import {
  CheckCircle2,
  Clock,
  Cloud,
  Crown,
  FileText,
  Lock,
  PenLine,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'document' | 'signature';
  nextFreeAt?: Date | null;
}

function formatTimeLeft(date: Date): string {
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return '0h';
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function scrollToPricing() {
  document.getElementById('plan-ultimate')?.scrollIntoView({ behavior: 'smooth' });
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07 + 0.2, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function PaywallModal({ open, onOpenChange, type, nextFreeAt }: Props) {
  const isDoc = type === 'document';

  const title = isDoc
    ? 'Daily document limit reached'
    : 'Daily signature limit reached';

  const subtitle = isDoc
    ? 'You have used your 2 free daily documents. Resets at midnight UTC.'
    : 'You have used your 2 free daily signature requests. Resets at midnight UTC.';

  const windowHours = '24';

  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg border-0 bg-transparent p-0 shadow-none [&>button]:hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden bg-white"
              style={{
                borderRadius: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.10), 0 28px 64px rgba(0,0,0,0.14)',
              }}
            >
              {/* Header — amber accent band */}
              <div
                className="relative overflow-hidden px-7 py-6"
                style={{
                  background: 'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)',
                  borderBottom: '1px solid #fde68a',
                }}
              >
                {/* Top rainbow line */}
                <div
                  className="absolute inset-x-0 top-0 h-1 rounded-t-[20px]"
                  style={{ background: 'linear-gradient(90deg,#f59e0b,#ef4444,#8b5cf6)' }}
                />
                <div className="flex items-start gap-4">
                  {/* Lock icon — 3D amber */}
                  <div
                    className="shrink-0 rounded-2xl p-3 shadow-[0_3px_0_#b45309,0_6px_16px_rgba(217,119,6,0.4)]"
                    style={{
                      background: 'linear-gradient(180deg,#fbbf24 0%,#f59e0b 40%,#d97706 100%)',
                    }}
                  >
                    <Lock className="size-6 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-black text-amber-900">{title}</h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-amber-700/70">{subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="ml-2 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-amber-500 transition hover:bg-amber-100 hover:text-amber-700"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Countdown chip */}
                <motion.div
                  custom={0} variants={itemVariants} initial="hidden" animate="show"
                  className="mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                    borderColor: '#bfdbfe',
                    boxShadow: '0 1px 4px rgba(37,99,235,0.08)',
                  }}
                >
                  <div
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg,#60a5fa,#2563eb)',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                    }}
                  >
                    <Clock className="size-3.5 text-white" />
                  </div>
                  {nextFreeAt ? (
                    <span className="text-sm text-blue-700">
                      Next reset in:{' '}
                      <span className="font-black text-blue-900">{formatTimeLeft(nextFreeAt)}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-blue-700">
                      Free quota: <span className="font-black text-blue-900">2 per day</span>
                      <span className="text-blue-500/60"> — resets every {windowHours}h</span>
                    </span>
                  )}
                </motion.div>

                {/* Free plan box */}
                <motion.div
                  custom={1} variants={itemVariants} initial="hidden" animate="show"
                  className="mb-5 rounded-2xl border p-4"
                  style={{
                    background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)',
                    borderColor: '#bae6fd',
                    boxShadow: '0 2px 8px rgba(14,165,233,0.08)',
                  }}
                >
                  <p className="mb-2.5 text-[11px] font-black uppercase tracking-wider text-sky-700">
                    Your Free Plan Includes
                  </p>
                  <ul className="space-y-2">
                    {[
                      '2 intelligent documents per day — NDA, leases, contracts',
                      '2 ESIGN Act compliant digital signatures per day',
                      'Full intelligent template editor — no credit card needed',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <div
                          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: 'linear-gradient(135deg,#38bdf8,#0891b2)',
                            boxShadow: '0 1px 4px rgba(8,145,178,0.4)',
                          }}
                        >
                          <CheckCircle2 className="size-2.5 text-white" />
                        </div>
                        <span className="text-xs leading-relaxed text-sky-800/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* CTA buttons */}
                <div className="space-y-3">
                  {/* Single pay — blue 3D */}
                  <motion.button
                    custom={2} variants={itemVariants} initial="hidden" animate="show"
                    type="button"
                    onClick={() => { close(); scrollToPricing(); }}
                    whileHover={{ y: -2, transition: { duration: 0.18, ease: [0.22,1,0.36,1] } }}
                    whileTap={{ y: 1, scale: 0.99 }}
                    className="group relative w-full overflow-hidden rounded-2xl p-4 text-left"
                    style={{
                      background: 'linear-gradient(180deg,#60a5fa 0%,#2563eb 38%,#1d4ed8 68%,#1e3a8a 100%)',
                      boxShadow: '0 3px 0 #172554, 0 6px 20px rgba(29,78,216,0.45), 0 1px 0 rgba(255,255,255,0.25) inset',
                    }}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/50" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/15 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    <div className="relative flex items-center gap-4">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      >
                        <Zap className="size-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">
                          {isDoc ? 'Buy a single document' : 'Pay for this signature'}
                        </p>
                        <p className="text-xs text-blue-100/70">
                          {isDoc ? 'One-time payment, instant access' : 'Immediate access to this signature'}
                        </p>
                      </div>
                      <span className="shrink-0 text-2xl font-black text-white">
                        {isDoc ? '$7' : '$3'}
                      </span>
                    </div>
                  </motion.button>

                  {/* Premium — green 3D */}
                  <motion.button
                    custom={3} variants={itemVariants} initial="hidden" animate="show"
                    type="button"
                    onClick={() => { close(); scrollToPricing(); }}
                    whileHover={{ y: -2, transition: { duration: 0.18, ease: [0.22,1,0.36,1] } }}
                    whileTap={{ y: 1, scale: 0.99 }}
                    className="group relative w-full overflow-hidden rounded-2xl p-4 text-left"
                    style={{
                      background: 'linear-gradient(180deg,#34d399 0%,#10b981 35%,#059669 65%,#065f46 100%)',
                      boxShadow: '0 3px 0 #064e3b, 0 6px 20px rgba(5,150,105,0.45), 0 1px 0 rgba(255,255,255,0.25) inset',
                    }}
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/50" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/15 to-transparent" />
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    <div className="relative flex items-center gap-3">
                      <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.25)]"
                        style={{ background: 'rgba(255,255,255,0.2)' }}
                      >
                        <Crown className="size-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white">Upgrade to Premium</p>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black text-amber-900"
                            style={{ background: '#fef08a' }}
                          >
                            BEST VALUE
                          </span>
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {[
                            { icon: FileText, text: 'Unlimited documents — no daily limit' },
                            { icon: PenLine, text: 'Unlimited e-signatures — no watermarks' },
                            { icon: Cloud, text: 'Cloud Workspace — store & manage all docs' },
                            { icon: ShieldCheck, text: 'Remote QR signing — any device' },
                          ].map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-center gap-1.5 text-[11px] text-emerald-100/70">
                              <Icon className="size-3 shrink-0 text-emerald-200/80" />
                              {text}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-2xl font-black text-white">$39.99</span>
                        <span className="block text-[10px] font-normal text-emerald-100/50">/month</span>
                      </div>
                    </div>
                  </motion.button>
                </div>

                {/* Footer */}
                <motion.div
                  custom={4} variants={itemVariants} initial="hidden" animate="show"
                  className="mt-5 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  <span className="text-[10px] text-slate-400">
                    ESIGN Act · UETA · SHA-256 Audit Trail · No hidden fees
                  </span>
                </motion.div>

                <p className="mt-2 text-center text-[11px] text-slate-400">
                  You can also wait for your free quota to reset automatically.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
