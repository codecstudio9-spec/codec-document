import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/language-context';
import { useAuth } from '../contexts/auth-context';
import { toast } from 'sonner';
import { isAdminEmail } from '../utils/admin-access';
import { verifyPaypalOrder, redeemPromoCode } from '../../lib/paypal-verify';
import { watchAndUnlockBodyScroll } from '../utils/paypal-scroll-fix';
import { CheckCircle2, Gift, Lock, ShieldCheck, Sparkles, Zap, Tag } from 'lucide-react';
import { OnboardingModal } from './auth/OnboardingModal';

// Real numbers behind the free tier — 2 documents + 2 signatures per
// rolling 72h window (user-limits-service.ts: DOCUMENT_LIMIT_72H /
// SIGNATURE_REQUEST_LIMIT_72H). 720h in a 30-day month / 72h ≈ 10 windows,
// so 2 × 10 = 20 of each per month — an honest "up to" approximation of a
// rolling window, not a hard calendar-month cap.
const FREE_DOCS_PER_MONTH_APPROX = 20;
const FREE_SIGS_PER_MONTH_APPROX = 20;

type Product = {
  hostedButtonId: string;
  planId: 'monthly' | 'semiannual' | 'annual';
  price: string;
  titleEs: string;
  titleEn: string;
  taglineEs: string;
  taglineEn: string;
  descriptionEs: string[];
  descriptionEn: string[];
  featured?: boolean;
  glow: string;
  icon: 'sparkles' | 'zap' | 'shield';
  savingsLabelEs: string;
  savingsLabelEn: string;
};

// Same feature set across all 3 plans — only price/term differ.
const SHARED_FEATURES_EN = [
  'Access to all legal document templates',
  'Unlimited Smart Quotes',
  'Electronic signatures included',
  'Identity verification',
  'Audit trail',
  'QR remote signing',
  'PDF generation and download',
  'Cloud access',
];
const SHARED_FEATURES_ES = [
  'Acceso a todas las plantillas de documentos legales',
  'Cotizaciones Inteligentes ilimitadas',
  'Firmas electrónicas incluidas',
  'Verificación de identidad',
  'Registro de auditoría',
  'Firma remota por QR',
  'Generación y descarga de PDF',
  'Acceso en la nube',
];

const PRODUCTS: Product[] = [
  {
    hostedButtonId: '57ERMWNY3UGQ8',
    planId: 'monthly',
    price: '$29.99',
    titleEs: 'Plan Mensual',
    titleEn: 'Monthly Plan',
    taglineEs: 'Creación ilimitada de documentos',
    taglineEn: 'Unlimited document creation',
    descriptionEs: SHARED_FEATURES_ES,
    descriptionEn: SHARED_FEATURES_EN,
    glow: 'rgba(59,130,246,0.45)',
    icon: 'sparkles',
    savingsLabelEs: 'Ideal para empezar hoy',
    savingsLabelEn: 'Perfect to start today',
  },
  {
    hostedButtonId: '6TN8ZW2A8CG24',
    planId: 'semiannual',
    price: '$134.99',
    titleEs: 'Plan 6 Meses',
    titleEn: '6-Month Plan',
    taglineEs: 'Ahorra 25% frente al plan mensual',
    taglineEn: 'Save 25% compared to monthly billing',
    descriptionEs: SHARED_FEATURES_ES,
    descriptionEn: SHARED_FEATURES_EN,
    featured: true,
    glow: 'rgba(37,99,235,0.70)',
    icon: 'zap',
    savingsLabelEs: 'AHORRA 25%',
    savingsLabelEn: 'SAVE 25%',
  },
  {
    hostedButtonId: 'VX6Q5YJ49S5JE',
    planId: 'annual',
    price: '$251.99',
    titleEs: 'Plan Anual',
    titleEn: 'Annual Plan',
    taglineEs: 'El mejor valor — ahorra 30%',
    taglineEn: 'Best value — Save 30%',
    descriptionEs: SHARED_FEATURES_ES,
    descriptionEn: SHARED_FEATURES_EN,
    glow: 'rgba(245,158,11,0.60)',
    icon: 'shield',
    savingsLabelEs: 'AHORRA 30%',
    savingsLabelEn: 'SAVE 30%',
  },
];

const iconByPlan = {
  sparkles: Sparkles,
  zap: Zap,
  shield: ShieldCheck,
} as const;

let sdkPromise: Promise<void> | null = null;

function ensurePayPalSdk(clientId: string) {
  // If already loaded (by this component or paypal-checkout-backend.tsx), reuse it
  if ((window as any).paypal?.Buttons) return Promise.resolve();
  // SDK may have been destroyed by paypal-checkout-backend's cleanup — reset the stale promise
  // so we reload fresh instead of returning a resolved promise with no window.paypal
  sdkPromise = null;

  sdkPromise = new Promise<void>((resolve, reject) => {
    // Accept either our script tag OR the one from paypal-checkout-backend
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-dynamic-sdk="true"], script[data-paypal-checkout-sdk="true"]',
    );
    if (existing) {
      if ((window as any).paypal?.Buttons) { resolve(); return; }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('PayPal SDK load failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = [
      `https://www.paypal.com/sdk/js`,
      `?client-id=${encodeURIComponent(clientId)}`,
      `&currency=USD`,
      `&intent=capture`,
      `&components=buttons`,
      `&enable-funding=card,applepay`,
      `&disable-funding=venmo`,
    ].join('');
    script.async = true;
    script.setAttribute('data-paypal-dynamic-sdk', 'true');
    script.onload = () => resolve();
    script.onerror = () => {
      sdkPromise = null;
      reject(new Error('PayPal SDK load failed'));
    };
    document.body.appendChild(script);
  });

  return sdkPromise;
}

export function PricingSection() {
  const { language } = useLanguage();
  const { user, isAdmin, refreshSubscription, refreshPurchasedDocuments } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [checkoutReady, setCheckoutReady] = useState(false);
  // Promo code — same server-side redemption already used by
  // PremiumDownloadModal.tsx / PaypalSignatureCheckout.tsx, this modal was
  // just missing the field to enter one at all.
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const API_BASE_URL = import.meta.env.VITE_PAYPAL_API_URL || '/api';
  const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string ?? '';

  const copy = useMemo(() => ({
    title: language === 'en' ? 'Choose your plan or package' : 'Elige tu plan o paquete',
    subtitle: language === 'en' ? 'Premium legal plans with dynamic checkout.' : 'Planes legales premium con checkout dinámico.',
    buyNow: language === 'en' ? 'Buy now' : 'Comprar ahora',
    signInMsg: language === 'en' ? 'Please complete your customer details to continue.' : 'Completa tus datos de cliente para continuar.',
    close: language === 'en' ? 'Close' : 'Cerrar',
    badge: language === 'en' ? 'MOST POPULAR' : 'MÁS POPULAR',
    ctaPrimary: language === 'en' ? 'Pay with PayPal' : 'Pagar con PayPal',
    ctaSecondary: language === 'en' ? 'Pay with card or Apple Pay' : 'Pagar con tarjeta o Apple Pay',
    topPill: language === 'en' ? 'Premium Access' : 'Acceso Premium',
    subtitle2: language === 'en' ? 'Secure checkout, instant activation and full legal productivity.' : 'Pago seguro, activación inmediata y productividad legal completa.',
    customerInfo: language === 'en' ? 'Customer information' : 'Datos del cliente',
    fullName: language === 'en' ? 'Full name' : 'Nombre completo',
    email: language === 'en' ? 'Email' : 'Correo electrónico',
    continueToPay: language === 'en' ? 'Continue to payment' : 'Continuar al pago',
    fillFields: language === 'en' ? 'Enter your data to unlock secure checkout.' : 'Ingresa tus datos para habilitar el checkout seguro.',
  }), [language]);

  // PayPal's SDK can lock body scroll while its card-fields overlay is
  // expanded, without our code getting a lifecycle event to react to.
  useEffect(() => {
    if (!modalOpen) return;
    return watchAndUnlockBodyScroll();
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen || !selectedProduct || !checkoutReady) return;

    let cancelled = false;

    const mountButtons = async () => {
      await ensurePayPalSdk(PAYPAL_CLIENT_ID);
      if (cancelled) return;

      const container = document.getElementById('paypal-checkout-modal-container');
      if (!container) return;
      container.innerHTML = '';

      await (window as any).paypal.Buttons({
        style: { layout: 'vertical' },
        createOrder: (_data: any, actions: any) => {
          const numericPrice = selectedProduct.price.replace(/[^0-9.]/g, '');
          return actions.order.create({
            purchase_units: [{
              description: language === 'en' ? selectedProduct.titleEn : selectedProduct.titleEs,
              custom_id: payerEmail || user?.email || '',
              amount: { currency_code: 'USD', value: numericPrice },
            }],
          });
        },
        onApprove: async (data: any, actions: any) => {
          const order = await actions.order.capture();
          const orderId = order?.id || data?.orderID || data?.orderId || '';

          // Server confirms with PayPal (real payment, correct amount, not
          // reused) and activates the plan itself — this used to POST to an
          // unauthenticated endpoint that trusted whatever hostedButtonId/
          // orderId the browser sent, with no verification against PayPal.
          const planProductMap: Record<Product['planId'], 'sub_monthly' | 'sub_semiannual' | 'sub_annual'> = {
            monthly: 'sub_monthly', semiannual: 'sub_semiannual', annual: 'sub_annual',
          };
          try {
            await verifyPaypalOrder({ orderId, product: planProductMap[selectedProduct.planId] });
          } catch (err) {
            toast.error(
              language === 'en'
                ? `Could not verify payment: ${err instanceof Error ? err.message : String(err)}`
                : `No se pudo verificar el pago: ${err instanceof Error ? err.message : String(err)}`,
            );
            return;
          }

          await Promise.allSettled([refreshSubscription(), refreshPurchasedDocuments()]);
          toast.success(language === 'en' ? 'Payment processed successfully.' : 'Pago procesado con éxito.');
          closeModal();
        },
        onError: () => {
          toast.error(language === 'en' ? 'Could not initialize PayPal checkout.' : 'No se pudo inicializar el checkout de PayPal.');
        },
      }).render('#paypal-checkout-modal-container');
    };

    mountButtons().catch(() => {
      toast.error(language === 'en' ? 'PayPal failed to load.' : 'PayPal no pudo cargarse.');
    });

    return () => {
      cancelled = true;
      const container = document.getElementById('paypal-checkout-modal-container');
      if (container) { try { container.innerHTML = ''; } catch (_) {} }
    };
  }, [API_BASE_URL, PAYPAL_CLIENT_ID, checkoutReady, language, modalOpen, payerEmail, refreshPurchasedDocuments, refreshSubscription, selectedProduct, user?.email]);

  const restoreBodyScroll = () => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.removeAttribute('data-scroll-locked');
  };

  const openCheckout = (product: Product) => {
    setPayerName('');
    setPayerEmail(user?.email || '');
    setCheckoutReady(false);
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    restoreBodyScroll();
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const planProductMap: Record<Product['planId'], 'sub_monthly' | 'sub_semiannual' | 'sub_annual'> = {
        monthly: 'sub_monthly', semiannual: 'sub_semiannual', annual: 'sub_annual',
      };
      await redeemPromoCode(code, selectedProduct ? { product: planProductMap[selectedProduct.planId] } : undefined);
      await Promise.allSettled([refreshSubscription(), refreshPurchasedDocuments()]);
      toast.success(language === 'en' ? 'Promo code applied — plan activated!' : '¡Código aplicado — plan activado!');
      closeModal();
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : (language === 'en' ? 'Invalid code.' : 'Código inválido.'));
    } finally {
      setPromoLoading(false);
    }
  };

  const handleContinueToPay = () => {
    const validEmail = /.+@.+\..+/.test(String(payerEmail || '').trim());
    if (!payerName.trim() || !validEmail) {
      toast.error(copy.signInMsg);
      return;
    }
    setCheckoutReady(true);
  };

  return (
    <section id="plan-ultimate" className="border-b border-slate-100 bg-gradient-to-b from-blue-50/50 to-white py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            <ShieldCheck className="size-3.5" /> {copy.topPill}
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900">{copy.title}</h2>
          <p className="mt-3 text-base text-slate-500 md:text-lg">{copy.subtitle}</p>
          <p className="mt-1 text-sm text-slate-400">{copy.subtitle2}</p>
        </div>

        <div className="grid gap-6 items-stretch mt-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free plan — a real, numbered plan card instead of a vague
              "try it free" banner, so a signed-up user can point at it and
              say "I'm on the free plan" and see exactly what upgrading buys
              them. Numbers are the real 72h rolling-window limits from
              user-limits-service.ts (2 documents + 2 signatures), converted
              to an approximate monthly figure people actually think in. */}
          <article className="relative rounded-3xl p-[1px]" style={{ background: 'rgba(16,185,129,0.35)' }}>
            <div className="h-full rounded-3xl bg-white p-5 md:p-7 border border-slate-100" style={{ boxShadow: '0 8px 30px -8px rgba(16,185,129,0.25)' }}>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <Gift className="size-3.5" />
                <span>{language === 'en' ? 'NO CREDIT CARD' : 'SIN TARJETA'}</span>
              </div>

              <h3 className="text-2xl font-bold text-slate-900">{language === 'en' ? 'Free Plan' : 'Plan Gratuito'}</h3>
              <p className="mt-2 text-4xl font-extrabold text-slate-900">$0</p>
              <p className="mt-1 text-sm font-medium text-emerald-600">
                {language === 'en' ? 'Perfect to try it out' : 'Perfecto para probarlo'}
              </p>

              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                  <span>
                    {language === 'en'
                      ? `2 documents every 72 hours (~${FREE_DOCS_PER_MONTH_APPROX}/month)`
                      : `2 documentos cada 72 horas (~${FREE_DOCS_PER_MONTH_APPROX}/mes)`}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                  <span>
                    {language === 'en'
                      ? `2 e-signatures every 72 hours (~${FREE_SIGS_PER_MONTH_APPROX}/month)`
                      : `2 firmas electrónicas cada 72 horas (~${FREE_SIGS_PER_MONTH_APPROX}/mes)`}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                  <span>{language === 'en' ? 'Full legal document editor' : 'Editor de documentos legales completo'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                  <span>{language === 'en' ? 'Identity verification & audit trail' : 'Verificación de identidad y auditoría'}</span>
                </li>
              </ul>

              {user ? (
                <div className="mt-6 w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
                  {language === 'en' ? 'Your current plan' : 'Tu plan actual'}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setOnboardingOpen(true)}
                  className="mt-6 w-full rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  {language === 'en' ? 'Start free' : 'Empezar gratis'}
                </button>
              )}
              <p className="mt-2 text-center text-xs text-slate-400">
                {language === 'en' ? 'Upgrade anytime for unlimited access' : 'Actualiza cuando quieras para acceso ilimitado'}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Lock className="size-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">
                  {language === 'en' ? 'Secure · ESIGN compliant' : 'Seguro · ESIGN compliant'}
                </span>
              </div>
            </div>
          </article>

          {PRODUCTS.map((product) => (
            <article
              key={product.hostedButtonId}
              className="relative rounded-3xl p-[1px] transition-all duration-300 sm:hover:scale-105"
              style={{
                background: product.featured
                  ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #1d4ed8 100%)'
                  : product.planId === 'annual'
                  ? 'linear-gradient(135deg, #b45309 0%, #fbbf24 50%, #b45309 100%)'
                  : 'rgba(148,163,184,0.30)',
              }}
            >
              <div
                className="h-full rounded-3xl bg-white p-5 md:p-7 border border-slate-100"
                style={{ boxShadow: `0 8px 30px -8px ${product.glow}` }}
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  {(() => {
                    const Icon = iconByPlan[product.icon];
                    return <Icon className="size-3.5" />;
                  })()}
                  <span>{language === 'en' ? product.savingsLabelEn : product.savingsLabelEs}</span>
                </div>

                {product.featured && (
                  <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-xs font-black text-white shadow-[0_4px_12px_rgba(37,99,235,0.4)]">
                    {language === 'en' ? product.savingsLabelEn : product.savingsLabelEs}
                  </p>
                )}
                {!product.featured && product.planId === 'annual' && (
                  <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-black text-amber-950">
                    {language === 'en' ? product.savingsLabelEn : product.savingsLabelEs}
                  </p>
                )}

                <h3 className="text-2xl font-bold text-slate-900">{language === 'en' ? product.titleEn : product.titleEs}</h3>
                <p className="mt-2 text-4xl font-extrabold text-slate-900">{product.price}</p>
                <p className="mt-1 text-sm font-medium text-blue-600">
                  {language === 'en' ? product.taglineEn : product.taglineEs}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {(language === 'en' ? product.descriptionEn : product.descriptionEs).map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

              <button
                type="button"
                onClick={() => openCheckout(product)}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#0070ba] via-[#1546a0] to-[#003087] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110"
              >
                {copy.ctaPrimary}
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">{copy.ctaSecondary}</p>
              {/* Per-card trust micro-badge */}
              <div className="mt-3 flex items-center justify-center gap-1.5">
                <Lock className="size-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">
                  {language === 'en' ? 'Secure · ESIGN compliant' : 'Seguro · ESIGN compliant'}
                </span>
              </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ── ESIGN / UETA Trust Strip ────────────────────────────────────────── */}
      <div className="mt-10 flex flex-col items-center gap-3 px-4 text-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-3">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span className="text-xs font-bold text-emerald-700">ESIGN Act Compliant</span>
          <span className="text-slate-300">·</span>
          <Lock className="size-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">UETA Compliant</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">SHA-256 Audit Trail</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500">PayPal Encrypted Checkout</span>
        </div>
        <p className="max-w-2xl text-xs text-slate-500">
          {language === 'en'
            ? 'Secure, legally binding, and fully compliant with the US Federal ESIGN Act and the Uniform Electronic Transactions Act (UETA). All document hashes are cryptographically signed via SHA-256 immutable audit trails.'
            : 'Seguro, legalmente vinculante y totalmente compatible con la Ley Federal ESIGN y la Ley Uniforme de Transacciones Electrónicas (UETA). Todos los hashes de documentos están firmados criptográficamente mediante SHA-256.'}
        </p>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-8 sm:items-center">
          <div className="my-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900">
                {language === 'en' ? selectedProduct?.titleEn : selectedProduct?.titleEs}
              </h4>
              <button type="button" className="text-sm text-slate-600" onClick={closeModal}>{copy.close}</button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 mb-3">
              <p className="text-sm font-semibold text-slate-900">{copy.customerInfo}</p>
              <p className="text-xs text-slate-500 mb-2">{copy.fillFields}</p>
              <div className="grid gap-2">
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder={copy.fullName}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder={copy.email}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                {!checkoutReady && (
                  <button
                    type="button"
                    onClick={handleContinueToPay}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                  >
                    {copy.continueToPay}
                  </button>
                )}
              </div>
            </div>
            {/* Promo code */}
            {!isAdmin && (
              <div className="mb-3">
                {!promoOpen ? (
                  <button
                    type="button"
                    onClick={() => setPromoOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    <Tag className="size-3" />
                    {language === 'en' ? 'Have a promo code?' : '¿Tienes un código de descuento?'}
                  </button>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Tag className="size-3" />
                      {language === 'en' ? 'Promo code' : 'Código de descuento'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleApplyPromo(); }}
                        placeholder={language === 'en' ? 'Enter code' : 'Ingresa el código'}
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase tracking-wide outline-none focus:border-indigo-400"
                        disabled={promoLoading}
                      />
                      <button
                        type="button"
                        onClick={() => void handleApplyPromo()}
                        disabled={promoLoading || !promoInput.trim()}
                        className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-40"
                      >
                        {promoLoading ? (language === 'en' ? 'Checking…' : 'Verificando…') : (language === 'en' ? 'Apply' : 'Aplicar')}
                      </button>
                    </div>
                    {promoError && <p className="mt-1.5 text-xs text-red-500">{promoError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Trust badge above PayPal buttons */}
            {checkoutReady && !isAdmin && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-800">
                  ESIGN Act &amp; UETA Compliant · SHA-256 audit trail · PayPal encrypted checkout
                </p>
              </div>
            )}

            {/* Admin bypass — skip real payment */}
            {isAdmin ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
                <p className="text-sm font-semibold text-emerald-800">
                  🛡 Admin bypass — {user?.email || 'admin'}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await Promise.allSettled([refreshSubscription(), refreshPurchasedDocuments()]);
                    toast.success(
                      language === 'en'
                        ? 'Admin simulation complete — subscription activated'
                        : 'Simulación admin completada — suscripción activada',
                    );
                    closeModal();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition"
                >
                  <ShieldCheck className="size-4" />
                  {language === 'en' ? 'Simulate successful payment' : 'Simular pago exitoso'}
                </button>
              </div>
            ) : (
              <div id="paypal-checkout-modal-container" className="min-h-[220px]" />
            )}
          </div>
        </div>
      )}

      <OnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        contextMessage={language === 'en' ? 'Register free for the Free Plan' : 'Regístrate gratis para el Plan Gratuito'}
      />
    </section>
  );
}