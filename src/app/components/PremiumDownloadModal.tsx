import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  X, Crown, ShieldCheck, Download, Tag, TicketPercent, Check, Lock, Zap, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../contexts/auth-context';
import {
  PAYPAL_SUBSCRIPTION_PLANS,
  getDocumentPrice,
  PAYPAL_LEASE_SDK_CLIENT_ID,
  type PlanKey,
} from '../config/paypal';
import { verifyPaypalOrder, redeemPromoCode } from '../../lib/paypal-verify';
import { watchAndUnlockBodyScroll } from '../utils/paypal-scroll-fix';

// ── kept for backward compatibility with any existing import
export const SINGLE_DOC_PRICE = 7.99;

// ── module-level SDK state — separate from paypal-checkout-backend.tsx ─────
let modalSdkPromise: Promise<void> | null = null;

function loadVaultSdk(clientId: string): Promise<void> {
  if (modalSdkPromise) return modalSdkPromise;
  modalSdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('paypal-modal-sdk');
    if (existing) { resolve(); return; }
    const script = document.createElement('script');
    script.id  = 'paypal-modal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&vault=true&components=buttons&enable-funding=card`;
    script.onload  = () => resolve();
    script.onerror = () => { modalSdkPromise = null; reject(new Error('PayPal SDK failed')); };
    document.head.appendChild(script);
  });
  return modalSdkPromise;
}

function cleanupVaultSdk() {
  const el = document.getElementById('paypal-modal-sdk');
  if (el) el.remove();
  try { delete (window as Record<string, unknown>).paypal; } catch { /* noop */ }
  modalSdkPromise = null;
}

// ── plan display metadata ──────────────────────────────────────────────────
const PLAN_META: Record<PlanKey, {
  colorBorder: string; colorBg: string; colorDot: string;
  badge: string | null; badgeColor: string;
  labelEn: string; labelEs: string;
  priceLabel: string;
}> = {
  monthly: {
    colorBorder: 'border-blue-400',
    colorBg:     'bg-blue-50',
    colorDot:    'bg-blue-500',
    badge:       null,
    badgeColor:  '',
    labelEn:     'Monthly',
    labelEs:     'Mensual',
    priceLabel:  '$79.99 / mo',
  },
  semiannual: {
    colorBorder: 'border-emerald-400',
    colorBg:     'bg-emerald-50',
    colorDot:    'bg-emerald-500',
    badge:       'SAVE 44%',
    badgeColor:  'bg-emerald-500 text-white',
    labelEn:     '6-Month',
    labelEs:     '6 Meses',
    priceLabel:  '$269.99 / 6 mo',
  },
  annual: {
    colorBorder: 'border-amber-400',
    colorBg:     'bg-amber-50',
    colorDot:    'bg-amber-500',
    badge:       'BEST VALUE',
    badgeColor:  'bg-amber-500 text-white',
    labelEn:     'Annual',
    labelEs:     'Anual',
    priceLabel:  '$519.99 / year',
  },
};

const BENEFITS = [
  'Unlimited documents',
  'Unlimited signatures',
  'QR remote signing',
  'Cloud workspace',
  'Priority support',
];

// ── body scroll lock ───────────────────────────────────────────────────────
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.body.removeAttribute('data-scroll-locked');
    };
  }, [active]);
}

// ── props ──────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  documentId: string;
  onSuccess: (orderId: string) => void;
  language: 'en' | 'es';
  price?: number;
  reason?: '72h_limit' | 'always';
}

// ═══════════════════════════════════════════════════════════════════════════
export function PremiumDownloadModal({
  open,
  onOpenChange,
  documentName,
  documentId,
  onSuccess,
  language,
  price,
  reason = 'always',
}: Props) {
  const { isAdmin, user, signInWithGoogle } = useAuth();

  const [mode, setMode]                   = useState<'single' | 'subscription'>('single');
  const [selectedPlan, setSelectedPlan]   = useState<PlanKey>('annual');
  const [email, setEmail]                 = useState('');
  const [promoInput, setPromoInput]       = useState('');
  const [promoApplied, setPromoApplied]   = useState(false);
  const [promoError, setPromoError]       = useState('');
  const [promoLoading, setPromoLoading]   = useState(false);
  const [sdkError, setSdkError]           = useState(false);
  const [sdkLoading, setSdkLoading]       = useState(false);

  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const overlayRef         = useRef<HTMLDivElement>(null);

  const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid  = emailRegex.test(email.trim());
  const effectivePrice = price ?? getDocumentPrice(documentId);
  const plan           = PAYPAL_SUBSCRIPTION_PLANS[selectedPlan];
  const planIsReady    = plan.planId && !plan.planId.startsWith('PLAN_PLACEHOLDER');

  useBodyScrollLock(open);

  // PayPal's SDK can lock body scroll while its card-fields overlay is
  // expanded, without our code getting a lifecycle event to react to.
  useEffect(() => {
    if (!open) return;
    return watchAndUnlockBodyScroll();
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setMode('single');
      setEmail('');
      setPromoInput('');
      setPromoApplied(false);
      setPromoError('');
      setSdkError(false);
    }
  }, [open]);

  // PayPal cleanup when modal closes or unmounts
  useLayoutEffect(() => {
    if (!open) {
      if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = '';
      cleanupVaultSdk();
    }
    return () => {
      if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = '';
      cleanupVaultSdk();
    };
  }, [open]);

  // Mount / re-mount PayPal buttons
  useEffect(() => {
    if (!open) return;

    const isSingle = mode === 'single';
    const shouldRender = isSingle
      ? isEmailValid && !promoApplied
      : !!user && !!planIsReady;

    if (!shouldRender) {
      if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = '';
      return;
    }

    let cancelled = false;
    setSdkLoading(true);
    setSdkError(false);

    loadVaultSdk(PAYPAL_LEASE_SDK_CLIENT_ID)
      .then(() => {
        if (cancelled) return;
        const pp = (window as Record<string, unknown>).paypal as Record<string, unknown> | undefined;
        if (!pp?.Buttons) throw new Error('PayPal Buttons not available');

        if (paypalContainerRef.current) paypalContainerRef.current.innerHTML = '';

        type PayPalActions = {
          order: { create: (o: unknown) => Promise<string>; capture: () => Promise<{ id: string }> };
          subscription: { create: (o: unknown) => Promise<string> };
        };

        const buttonsConfig: Record<string, unknown> = {
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          onError: (err: unknown) => { console.error('[Modal PayPal]', err); setSdkError(true); },
        };

        if (isSingle) {
          buttonsConfig.createOrder = (_: unknown, actions: PayPalActions) =>
            actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [{
                description: documentName,
                amount: { currency_code: 'USD', value: effectivePrice.toFixed(2) },
              }],
            });
          buttonsConfig.onApprove = async (_: unknown, actions: PayPalActions) => {
            const order = await actions.order.capture();
            try {
              // Server confirms with PayPal (real payment, correct amount)
              // before the download gate is lifted — never trust capture()
              // resolving in the browser alone.
              await verifyPaypalOrder({ orderId: order.id, product: 'doc_single', documentId });
              onSuccess(order.id);
              onOpenChange(false);
            } catch (err) {
              console.error('[Modal PayPal] verification failed:', err);
              setSdkError(true);
            }
          };
        } else {
          const planProductMap: Record<PlanKey, 'sub_monthly' | 'sub_semiannual' | 'sub_annual'> = {
            monthly: 'sub_monthly', semiannual: 'sub_semiannual', annual: 'sub_annual',
          };
          buttonsConfig.createSubscription = (_: unknown, actions: PayPalActions) =>
            actions.subscription.create({ plan_id: plan.planId });
          buttonsConfig.onApprove = async (data: { subscriptionID?: string }, actions: PayPalActions) => {
            const subId = data.subscriptionID
              ?? (actions.subscription as unknown as { subscriptionID?: string }).subscriptionID
              ?? '';
            try {
              // Server confirms the subscription is ACTIVE and its plan_id
              // matches the requested tier, then activates it server-side.
              await verifyPaypalOrder({
                subscriptionId: subId,
                product: planProductMap[selectedPlan],
              });
              onSuccess(`SUB-${subId}`);
              onOpenChange(false);
            } catch (err) {
              console.error('[Modal PayPal] subscription verification failed:', err);
              setSdkError(true);
            }
          };
        }

        const Buttons = (pp.Buttons as (c: Record<string, unknown>) => { render: (el: HTMLElement) => void });
        const buttons = Buttons(buttonsConfig);
        if (paypalContainerRef.current) {
          buttons.render(paypalContainerRef.current);
        }
      })
      .catch(() => { if (!cancelled) setSdkError(true); })
      .finally(() => { if (!cancelled) setSdkLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, isEmailValid, selectedPlan, promoApplied, user]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onOpenChange]);

  // Promo code redemption — validity, expiry, redemption cap and the actual
  // grant all happen server-side (public.promo_codes + paypal-verify Edge
  // Function). The old client-side array of valid codes was shipped in the
  // JS bundle, so anyone could read it in devtools and redeem for free with
  // no limit; this closes that.
  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      await redeemPromoCode(code);
      setPromoApplied(true);
      onSuccess(`PROMO-${code}`);
      onOpenChange(false);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : (language === 'en' ? 'Invalid promo code.' : 'Código inválido.'));
      setPromoApplied(false);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onOpenChange(false);
  };

  if (!open) return null;

  const t = (en: string, es: string) => language === 'en' ? en : es;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[9900] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={t('Unlock document', 'Desbloquear documento')}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl my-4"
        >
          {/* Top accent */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

          {/* Close */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>

          <div className="px-6 pb-7 pt-7">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-100">
                <Download className="size-7 text-indigo-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {reason === '72h_limit'
                  ? t('Free quota reached', 'Cuota gratuita agotada')
                  : t('Unlock your clean PDF', 'Desbloquea tu PDF limpio')}
              </h2>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                {reason === '72h_limit'
                  ? t(
                      'You used your 2 free documents today. Pay for this one or unlock unlimited access.',
                      'Usaste tus 2 documentos gratuitos de hoy. Paga este documento o desbloquea acceso ilimitado.',
                    )
                  : documentName}
              </p>
            </div>

            {/* ── Admin fast bypass ───────────────────────────────────── */}
            {isAdmin && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
                <p className="text-sm font-semibold text-emerald-800">🛡 {t('Admin bypass active', 'Bypass de administrador activo')}</p>
                <button
                  type="button"
                  onClick={() => { onSuccess('ADMIN-BYPASS'); onOpenChange(false); }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition"
                >
                  <ShieldCheck className="size-4" />
                  {t('Download without payment', 'Descargar sin pago')}
                </button>
              </div>
            )}

            {/* ── Mode tabs ───────────────────────────────────────────── */}
            <div className="mb-5 flex gap-1 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode('single')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                  mode === 'single'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Download className="inline size-4 mr-1.5 -mt-0.5" />
                {t('Pay per Download', 'Pago por Descarga')}
              </button>
              <button
                type="button"
                onClick={() => setMode('subscription')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${
                  mode === 'subscription'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Crown className="inline size-4 mr-1.5 -mt-0.5" />
                {t('Unlimited Access', 'Acceso Ilimitado')}
              </button>
            </div>

            {/* ── Two-panel layout ─────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row gap-5">

              {/* ── LEFT: Single payment ─────────────────────────────── */}
              <AnimatePresence mode="wait">
                {mode === 'single' && (
                  <motion.div
                    key="single"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 overflow-hidden"
                  >
                    {/* Price header */}
                    <div className="flex items-center justify-between border-b border-indigo-100 px-4 py-3 bg-white/60">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">
                          {t('Single document download', 'Descarga de documento único')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {t('One-time · No watermark', 'Pago único · Sin marca de agua')}
                        </p>
                      </div>
                      <span className="text-2xl font-black text-indigo-700 shrink-0">
                        ${effectivePrice.toFixed(2)}
                      </span>
                    </div>

                    <div className="px-4 py-4 space-y-3">
                      {/* Email */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                          {t('Email for receipt', 'Correo para recibo')} *
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      {/* Promo code */}
                      <div>
                        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Tag className="size-3" />
                          {t('Have a promo code?', '¿Tienes un código de descuento?')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') void handleApplyPromo(); }}
                            placeholder={t('Enter code', 'Ingresa el código')}
                            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase tracking-wide outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            disabled={promoLoading}
                          />
                          <button
                            type="button"
                            onClick={() => void handleApplyPromo()}
                            disabled={promoLoading || !promoInput.trim()}
                            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-40"
                          >
                            {promoLoading ? t('Checking…', 'Verificando…') : t('Apply', 'Aplicar')}
                          </button>
                        </div>
                        {promoError && <p className="mt-1.5 text-xs text-red-500">{promoError}</p>}
                        {promoApplied && (
                          <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <TicketPercent className="size-3.5 text-emerald-600" />
                            <span className="text-xs font-semibold text-emerald-700">
                              {t('100% discount applied!', '¡100% descuento aplicado!')}
                            </span>
                            <span className="ml-auto text-xs font-black text-emerald-700">$0.00</span>
                          </div>
                        )}
                      </div>

                      {/* PayPal buttons — single */}
                      <div>
                        {!isEmailValid && (
                          <p className="text-xs text-slate-400 text-center py-2">
                            {t('Enter a valid email to continue', 'Ingresa un correo válido para continuar')}
                          </p>
                        )}
                        {isEmailValid && sdkLoading && (
                          <div className="flex justify-center py-3">
                            <div className="size-5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                          </div>
                        )}
                        {isEmailValid && sdkError && (
                          <p className="text-xs text-red-500 text-center py-2">
                            {t('PayPal unavailable. Try again.', 'PayPal no disponible. Intenta de nuevo.')}
                          </p>
                        )}
                        <div ref={paypalContainerRef} id="paypal-modal-single-container" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── RIGHT: Subscription ─────────────────────────────── */}
                {mode === 'subscription' && (
                  <motion.div
                    key="subscription"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 space-y-3"
                  >
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                      {t('Choose a plan', 'Elige un plan')}
                    </p>

                    {/* Plan cards */}
                    {(Object.keys(PAYPAL_SUBSCRIPTION_PLANS) as PlanKey[]).map((key) => {
                      const meta = PLAN_META[key];
                      const planData = PAYPAL_SUBSCRIPTION_PLANS[key];
                      const isSelected = selectedPlan === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedPlan(key)}
                          className={`relative w-full rounded-2xl border-2 p-4 text-left transition-all duration-150 ${
                            isSelected
                              ? `${meta.colorBorder} ${meta.colorBg} shadow-md`
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                          }`}
                        >
                          {/* Badge */}
                          {meta.badge && (
                            <span className={`absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-black ${meta.badgeColor}`}>
                              {meta.badge}
                            </span>
                          )}
                          <div className="flex items-center gap-3">
                            {/* Radio dot */}
                            <div className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isSelected ? `${meta.colorBorder} ${meta.colorDot}` : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <div className="size-2 rounded-full bg-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {language === 'en' ? meta.labelEn : meta.labelEs}
                                </span>
                                <span className="text-base font-black text-slate-900 shrink-0">
                                  {meta.priceLabel}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {t(`Billed every ${planData.period}`, `Facturado cada ${planData.period}`)}
                              </p>
                            </div>
                          </div>

                          {/* Benefits when selected */}
                          {isSelected && (
                            <motion.ul
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-3 pt-3 border-t border-slate-200/60 space-y-1.5"
                            >
                              {BENEFITS.map((b) => (
                                <li key={b} className="flex items-center gap-2 text-xs text-slate-700">
                                  <Zap className="size-3 text-indigo-500 shrink-0" />
                                  {b}
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </button>
                      );
                    })}

                    {/* Subscription PayPal button area */}
                    <div className="pt-1">
                      {!user && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                          <Lock className="size-4 text-slate-400 mx-auto mb-1.5" />
                          <p className="mb-3 text-xs text-slate-500">
                            {t('Please sign in to subscribe', 'Inicia sesión para suscribirte')}
                          </p>
                          <button
                            type="button"
                            onClick={() => void signInWithGoogle()}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                          >
                            {t('Sign in with Google', 'Iniciar sesión con Google')}
                            <ArrowRight className="size-3.5" />
                          </button>
                        </div>
                      )}
                      {user && !planIsReady && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                          <p className="mb-3 text-xs font-semibold text-amber-700">
                            {t(
                              'Recurring subscriptions are being finalized. Pay for this period now instead — same price, no auto-renewal.',
                              'Las suscripciones recurrentes se están terminando de configurar. Paga este período ahora en su lugar — mismo precio, sin renovación automática.',
                            )}
                          </p>
                          <a
                            href="/#plan-ultimate"
                            onClick={() => onOpenChange(false)}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                          >
                            {t('View Plans & Pay', 'Ver Planes y Pagar')}
                            <ArrowRight className="size-3.5" />
                          </a>
                        </div>
                      )}
                      {user && planIsReady && (
                        <>
                          {sdkLoading && (
                            <div className="flex justify-center py-3">
                              <div className="size-5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
                            </div>
                          )}
                          {sdkError && (
                            <p className="text-xs text-red-500 text-center py-2">
                              {t('PayPal unavailable. Try again.', 'PayPal no disponible. Intenta de nuevo.')}
                            </p>
                          )}
                          <div ref={paypalContainerRef} id="paypal-modal-sub-container" />
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Trust strip ──────────────────────────────────────────── */}
            <div className="mt-4 flex items-center justify-center gap-1.5">
              <ShieldCheck className="size-3 text-emerald-500" />
              <span className="text-[10px] text-slate-400">
                ESIGN Act · UETA · SHA-256 · {t('No account required', 'Sin cuenta requerida')}
              </span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
