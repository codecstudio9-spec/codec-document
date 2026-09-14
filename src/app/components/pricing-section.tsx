import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../contexts/language-context';
import { useAuth } from '../contexts/auth-context';
import { toast } from 'sonner';
import { isAdminEmail } from '../utils/admin-access';
import { verifyPaypalOrder, redeemPromoCode, consultarDescuento, type DescuentoDeBono } from '../../lib/paypal-verify';
import { watchAndUnlockBodyScroll } from '../utils/paypal-scroll-fix';
import { CheckCircle2, Gift, Lock, ShieldCheck, Sparkles, Zap, Tag, Building2, Minus, Plus, Layers } from 'lucide-react';
import { OnboardingModal } from './auth/OnboardingModal';
import { EnterpriseLeadModal } from './EnterpriseLeadModal';

// Plan Empresa — por asiento, con descuento escalonado por volumen, desde 1
// usuario (ya no exige un mínimo de 5 a precio plano). Vendido aquí (la
// página pública de precios) además del plan plano existente en
// /my-company — ver 20260907120000_enterprise_seats_and_team_visibility.sql
// y el branch 'company_seats_monthly' en la Edge Function paypal-verify.
//
// MUY IMPORTANTE: `businessPricePerSeat` de abajo debe coincidir EXACTO con
// `pricePerSeat` en supabase/functions/paypal-verify/index.ts — esa función
// del servidor es la que de verdad valida y cobra el pago; si se cambia un
// escalón aquí sin cambiarlo allá, el checkout empieza a rechazar pagos
// (o peor, a cobrar de más/de menos) por "importe no coincide".
const BUSINESS_LIST_PRICE = 69; // precio de lista (1-4 usuarios)
const BUSINESS_MIN_SEATS = 1;
const BUSINESS_CUSTOM_TIER_SEATS = 30; // a partir de aquí ya no hay precio fijo
const BUSINESS_DEFAULT_SEATS = 5;
const BUSINESS_DOCS_PER_SEAT_PER_MONTH = 750;

// Devuelve null a partir de BUSINESS_CUSTOM_TIER_SEATS: ese nivel no tiene
// precio por asiento fijo, se cotiza aparte con el equipo comercial.
function businessPricePerSeat(seats: number): number | null {
  if (seats >= BUSINESS_CUSTOM_TIER_SEATS) return null;
  if (seats >= 20) return 55;
  if (seats >= 10) return 59;
  if (seats >= 5) return 64;
  return BUSINESS_LIST_PRICE;
}

// Individual paid-plan document allowance — replaces the old, literal
// "unlimited documents" claim across every plan card. Purely display copy
// for now: user-limits-service.ts (consumeDocumentLimit72h) still treats
// any paid plan as fully unmetered (isPremium => always allowed, no
// monthly counter at all) — actually enforcing this 150/user/month cap
// would need its own calendar-month counter, separate from the free
// plan's 72h rolling window, which is a bigger backend change than this
// pricing-page pass. Flagged to the user rather than silently built.
const PAID_DOCS_PER_MONTH = 150;

// User-facing free-plan numbers — deliberately a flat "N per month" claim,
// not "every 72 hours". The actual quota is enforced as a 2-per-72h rolling
// window server-side (user-limits-service.ts: DOCUMENT_LIMIT_72H /
// SIGNATURE_REQUEST_LIMIT_72H) — that accounting is internal only and
// should never surface in copy; 18 is the conservative monthly figure we
// show customers instead.
const FREE_DOCS_PER_MONTH = 18;
const FREE_SIGS_PER_MONTH = 18;

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

// Same feature set across all 3 plans — only price/term differ. The
// document-limit line goes first and on its own so it reads as the plan's
// headline characteristic, not buried in the list — see PAID_DOCS_PER_MONTH.
const SHARED_FEATURES_EN = [
  `Up to ${PAID_DOCS_PER_MONTH} documents per month per user`,
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
  `Hasta ${PAID_DOCS_PER_MONTH} documentos al mes por usuario`,
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
    taglineEs: 'Facturación mensual, cancela cuando quieras',
    taglineEn: 'Monthly billing, cancel anytime',
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
  const navigate = useNavigate();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [checkoutReady, setCheckoutReady] = useState(false);
  // Plan Empresa — modal propio (importe dinámico según asientos, en vez
  // de un Product de precio fijo como los otros 3 planes).
  const [enterpriseSeats, setEnterpriseSeats] = useState(BUSINESS_DEFAULT_SEATS);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [enterpriseCompanyName, setEnterpriseCompanyName] = useState('');
  const [enterpriseCheckoutReady, setEnterpriseCheckoutReady] = useState(false);
  // Cotización personalizada para 30+ usuarios o necesidades especiales,
  // reutiliza el mismo formulario ya usado en la home page.
  const [enterpriseLeadOpen, setEnterpriseLeadOpen] = useState(false);
  const clampedSeats = Math.max(BUSINESS_MIN_SEATS, enterpriseSeats);
  const isCustomTier = clampedSeats >= BUSINESS_CUSTOM_TIER_SEATS;
  const enterprisePerSeat = useMemo(() => businessPricePerSeat(clampedSeats), [clampedSeats]);
  const enterpriseTotal = useMemo(() => (enterprisePerSeat === null ? null : clampedSeats * enterprisePerSeat), [clampedSeats, enterprisePerSeat]);
  const enterpriseListTotal = useMemo(() => clampedSeats * BUSINESS_LIST_PRICE, [clampedSeats]);
  const enterpriseSavingsMonthly = enterpriseTotal === null ? 0 : Math.max(0, enterpriseListTotal - enterpriseTotal);
  const enterpriseSavingsAnnual = enterpriseSavingsMonthly * 12;
  const enterpriseDocsIncluded = clampedSeats * BUSINESS_DOCS_PER_SEAT_PER_MONTH;
  const formatNumber = (n: number) => n.toLocaleString(language === 'en' ? 'en-US' : 'es-CO');
  const seatWord = (n: number) => (language === 'en' ? (n === 1 ? 'user' : 'users') : n === 1 ? 'usuario' : 'usuarios');
  // Promo code — same server-side redemption already used by
  // PremiumDownloadModal.tsx / PaypalSignatureCheckout.tsx, this modal was
  // just missing the field to enter one at all.
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  /** Bono que no es del 100%: no activa el plan por sí solo, rebaja el
   *  importe que se cobra por PayPal. Esta pantalla vende los planes como
   *  pago único (Orders API), así que aquí el descuento es simplemente un
   *  importe menor — no hace falta un plan de PayPal aparte. */
  const [promoParcial, setPromoParcial] = useState<DescuentoDeBono | null>(null);
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
          const listaBase = Number(selectedProduct.price.replace(/[^0-9.]/g, ''));
          // Con bono se cobra el importe que calculó el SERVIDOR. El servidor
          // lo vuelve a calcular al verificar, así que retocar esta cifra
          // desde el navegador sólo consigue que el pago sea rechazado.
          const aCobrar = promoParcial?.discountedAmount ?? listaBase;
          return actions.order.create({
            purchase_units: [{
              description: language === 'en' ? selectedProduct.titleEn : selectedProduct.titleEs,
              custom_id: payerEmail || user?.email || '',
              amount: { currency_code: 'USD', value: aCobrar.toFixed(2) },
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
            await verifyPaypalOrder({
              orderId,
              product: planProductMap[selectedProduct.planId],
              promoCode: promoParcial?.code,
            });
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
    // `promoParcial` va en las dependencias porque el botón de PayPal se
    // construye con un importe fijo: sin esto, aplicar un bono cambiaría el
    // texto en pantalla pero cobraría el precio entero.
  }, [API_BASE_URL, PAYPAL_CLIENT_ID, checkoutReady, language, modalOpen, payerEmail, refreshPurchasedDocuments, refreshSubscription, selectedProduct, user?.email, promoParcial]);

  useEffect(() => {
    if (!enterpriseModalOpen) return;
    return watchAndUnlockBodyScroll();
  }, [enterpriseModalOpen]);

  useEffect(() => {
    // isCustomTier (30+ usuarios) nunca debería llegar aquí — ese nivel usa
    // el botón "Solicitar cotización", no este checkout — pero se revisa
    // igual antes de montar el botón de PayPal para nunca enviarle un
    // importe vacío.
    if (!enterpriseModalOpen || !enterpriseCheckoutReady || isCustomTier || enterpriseTotal === null) return;
    const totalToCharge = enterpriseTotal;

    let cancelled = false;

    const mountButtons = async () => {
      await ensurePayPalSdk(PAYPAL_CLIENT_ID);
      if (cancelled) return;

      const container = document.getElementById('paypal-checkout-enterprise-container');
      if (!container) return;
      container.innerHTML = '';

      await (window as any).paypal.Buttons({
        style: { layout: 'vertical' },
        createOrder: (_data: any, actions: any) => actions.order.create({
          purchase_units: [{
            description: `${language === 'en' ? 'Enterprise Plan' : 'Plan Empresa'} (${enterpriseSeats} ${seatWord(enterpriseSeats)})`,
            custom_id: payerEmail || user?.email || '',
            amount: { currency_code: 'USD', value: totalToCharge.toFixed(2) },
          }],
        }),
        onApprove: async (data: any, actions: any) => {
          const order = await actions.order.capture();
          const orderId = order?.id || data?.orderID || data?.orderId || '';
          try {
            await verifyPaypalOrder({
              orderId,
              product: 'company_seats_monthly',
              seats: enterpriseSeats,
              companyName: enterpriseCompanyName,
            });
          } catch (err) {
            toast.error(
              language === 'en'
                ? `Could not verify payment: ${err instanceof Error ? err.message : String(err)}`
                : `No se pudo verificar el pago: ${err instanceof Error ? err.message : String(err)}`,
            );
            return;
          }

          toast.success(language === 'en' ? 'Enterprise plan activated!' : '¡Plan Empresa activado!');
          closeEnterpriseModal();
          navigate('/my-company');
        },
        onError: () => {
          toast.error(language === 'en' ? 'Could not initialize PayPal checkout.' : 'No se pudo inicializar el checkout de PayPal.');
        },
      }).render('#paypal-checkout-enterprise-container');
    };

    mountButtons().catch(() => {
      toast.error(language === 'en' ? 'PayPal failed to load.' : 'PayPal no pudo cargarse.');
    });

    return () => {
      cancelled = true;
      const container = document.getElementById('paypal-checkout-enterprise-container');
      if (container) { try { container.innerHTML = ''; } catch (_) {} }
    };
    // `enterpriseSeats`/`enterpriseTotal` van en las dependencias por la
    // misma razón que `promoParcial` arriba: el botón de PayPal se crea con
    // un importe fijo, así que cambiar el número de asientos con el modal
    // ya abierto necesita reconstruir el botón con el nuevo total.
  }, [PAYPAL_CLIENT_ID, enterpriseCheckoutReady, enterpriseCompanyName, enterpriseModalOpen, enterpriseSeats, enterpriseTotal, isCustomTier, language, navigate, payerEmail, user?.email]);

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

  const openEnterpriseCheckout = () => {
    if (!user) {
      setOnboardingOpen(true);
      return;
    }
    setPayerName(user.name || '');
    setPayerEmail(user.email || '');
    setEnterpriseCompanyName('');
    setEnterpriseCheckoutReady(false);
    setEnterpriseModalOpen(true);
  };

  const closeEnterpriseModal = () => {
    setEnterpriseModalOpen(false);
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
      const contexto = selectedProduct ? { product: planProductMap[selectedProduct.planId] } : undefined;

      // Primero se pregunta cuánto descuenta, sin canjear. Un bono parcial
      // canjeado aquí se gastaría sin haber cobrado el resto.
      if (contexto) {
        const info = await consultarDescuento(code, contexto);
        if (info && info.discountPct < 100) {
          setPromoParcial(info);
          setPromoError('');
          toast.success(language === 'en'
            ? `${info.discountPct}% off applied — pay below to finish.`
            : `${info.discountPct}% de descuento aplicado — paga abajo para terminar.`);
          return;
        }
      }

      await redeemPromoCode(code, contexto);
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
                      ? `${FREE_DOCS_PER_MONTH} documents per month`
                      : `${FREE_DOCS_PER_MONTH} documentos al mes`}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                  <span>
                    {language === 'en'
                      ? `${FREE_SIGS_PER_MONTH} e-signatures per month`
                      : `${FREE_SIGS_PER_MONTH} firmas electrónicas al mes`}
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

        {/* Plan Empresa — banda ancha aparte de la grilla de 4 columnas
            (Gratis + 3 planes): precio variable por asientos, no encaja en
            una tarjeta de precio fijo. */}
        <div className="mt-6 overflow-hidden rounded-3xl border-2 border-slate-800 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
                <Building2 className="size-3.5" />
                {language === 'en' ? 'For teams' : 'Para equipos'}
              </div>
              <h3 className="text-2xl font-black text-white md:text-3xl">
                {language === 'en' ? 'Business Plan' : 'Plan Empresa'}
              </h3>
              <p className="mt-1.5 text-sm text-slate-300">
                {language === 'en'
                  ? 'For teams of any size, a shared workspace with roles, a super-admin who oversees every teammate\'s documents and signatures, and your own company branding. The more users, the lower the price per user.'
                  : 'Para equipos de cualquier tamaño, un espacio compartido con roles, un súper administrador que supervisa los documentos y firmas de todo el equipo, y tu propia marca (branding) en cada documento. A más usuarios, menor precio por usuario.'}
              </p>
              <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {[
                  language === 'en' ? 'Everything in every plan above' : 'Todo lo de los planes anteriores',
                  language === 'en' ? 'Team roles & permissions' : 'Roles y permisos de equipo',
                  language === 'en' ? 'Super-admin sees all team activity' : 'Súper admin ve toda la actividad del equipo',
                  language === 'en' ? 'Custom branding on every document' : 'Marca propia en cada documento',
                  language === 'en' ? 'API access & webhooks' : 'Acceso a API y webhooks',
                  language === 'en' ? 'Priority support' : 'Soporte prioritario',
                  language === 'en' ? 'Unlimited external signers' : 'Firmantes externos ilimitados',
                  language === 'en'
                    ? `${BUSINESS_DOCS_PER_SEAT_PER_MONTH} documents per user / month`
                    : `${BUSINESS_DOCS_PER_SEAT_PER_MONTH} documentos por usuario al mes`,
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {/* Tabla de descuento por volumen, para que el usuario vea de
                  entrada por qué el precio por usuario baja al subir la
                  cantidad, sin tener que adivinar moviendo el selector. */}
              <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                {[
                  { range: '1-4', price: 69, custom: false },
                  { range: '5-9', price: 64, custom: false },
                  { range: '10-19', price: 59, custom: false },
                  { range: '20-29', price: 55, custom: false },
                  { range: '30+', price: null, custom: true },
                ].map((tier) => {
                  const isActiveTier = tier.custom ? isCustomTier : businessPricePerSeat(clampedSeats) === tier.price;
                  return (
                    <div
                      key={tier.range}
                      className={`rounded-xl border px-2 py-1.5 text-center transition ${
                        isActiveTier ? 'border-indigo-400 bg-indigo-500/20' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <p className="text-[10px] font-semibold text-slate-400">
                        {tier.range} {language === 'en' ? 'users' : 'usuarios'}
                      </p>
                      <p className={`text-sm font-black ${isActiveTier ? 'text-indigo-300' : 'text-white'}`}>
                        {tier.custom
                          ? (language === 'en' ? 'Custom' : 'A medida')
                          : `$${tier.price}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 rounded-2xl bg-white/5 p-5 md:w-80">
              <p className="text-xs font-semibold text-slate-400">
                {language === 'en' ? `From $${BUSINESS_LIST_PRICE} / user / month` : `Desde $${BUSINESS_LIST_PRICE} usd / usuario / mes`}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {language === 'en' ? 'Price drops automatically as your team grows' : 'El precio baja automáticamente al crecer tu equipo'}
              </p>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs font-semibold text-slate-300">{language === 'en' ? 'Users' : 'Usuarios'}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEnterpriseSeats((n) => Math.max(BUSINESS_MIN_SEATS, n - 1))}
                    className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                    aria-label={language === 'en' ? 'Fewer users' : 'Menos usuarios'}
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <input
                    type="number"
                    min={BUSINESS_MIN_SEATS}
                    value={enterpriseSeats}
                    onChange={(e) => {
                      const n = Math.floor(Number(e.target.value));
                      setEnterpriseSeats(Number.isFinite(n) ? Math.max(BUSINESS_MIN_SEATS, n) : BUSINESS_MIN_SEATS);
                    }}
                    className="w-12 rounded-lg border border-white/10 bg-transparent text-center text-sm font-black text-white outline-none focus:border-indigo-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setEnterpriseSeats((n) => Math.max(BUSINESS_MIN_SEATS, n) + 1)}
                    className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
                    aria-label={language === 'en' ? 'More users' : 'Más usuarios'}
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>

              {isCustomTier ? (
                <>
                  <p className="mt-3 text-2xl font-black text-white">
                    {language === 'en' ? 'Custom pricing' : 'Precio personalizado'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {language === 'en'
                      ? 'Negotiated with our sales team for 30+ users'
                      : 'Negociado con nuestro equipo comercial para 30 o más usuarios'}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-3xl font-black text-white">
                    ${enterpriseTotal !== null ? enterpriseTotal.toLocaleString(language === 'en' ? 'en-US' : 'es-CO') : ''}
                    <span className="text-sm font-semibold text-slate-400">/{language === 'en' ? 'mo' : 'mes'}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    ${enterprisePerSeat} × {clampedSeats} {seatWord(clampedSeats)}
                  </p>

                  {/* Ahorro frente al precio de lista, solo tiene sentido
                      mostrarlo cuando el escalón actual ya trae descuento. */}
                  {enterpriseSavingsMonthly > 0 && (
                    <div className="mt-2.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-2">
                      <p className="text-[11px] text-emerald-300">
                        {language === 'en' ? 'List price' : 'Precio sin descuento'}:{' '}
                        <span className="line-through">${formatNumber(enterpriseListTotal)}</span>
                      </p>
                      <p className="text-xs font-bold text-emerald-300">
                        {language === 'en'
                          ? `You save $${formatNumber(enterpriseSavingsMonthly)}/mo · $${formatNumber(enterpriseSavingsAnnual)}/yr`
                          : `Ahorras $${formatNumber(enterpriseSavingsMonthly)}/mes · $${formatNumber(enterpriseSavingsAnnual)}/año`}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                <Layers className="size-3.5 shrink-0 text-indigo-300" />
                <p className="text-xs font-semibold text-slate-200">
                  {formatNumber(enterpriseDocsIncluded)} {language === 'en' ? 'documents included/mo' : 'documentos incluidos/mes'}
                </p>
              </div>

              <button
                type="button"
                onClick={isCustomTier ? () => setEnterpriseLeadOpen(true) : openEnterpriseCheckout}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:brightness-110"
              >
                {isCustomTier
                  ? (language === 'en' ? 'Request a quote' : 'Solicitar cotización')
                  : (language === 'en' ? 'Get started' : 'Comenzar')}
              </button>
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                <Lock className="size-3 text-slate-500" />
                <span className="text-[10px] text-slate-500">
                  {language === 'en' ? 'Secure · ESIGN compliant' : 'Seguro · ESIGN compliant'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise — sin precio fijo, cotización personalizada para
            equipos grandes/necesidades especiales (>30 usuarios, API,
            integraciones, migración). Reutiliza el mismo formulario de
            EnterpriseLeadModal ya usado en la home page. */}
        <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h4 className="text-lg font-black text-slate-900">Enterprise</h4>
            <p className="mt-0.5 text-sm text-slate-500">
              {language === 'en'
                ? 'Custom quote for 30+ users, higher volumes, integrations, API, migration, and special implementations.'
                : 'Cotización personalizada para más de 30 usuarios, volúmenes superiores, integraciones, API, migración e implementaciones especiales.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEnterpriseLeadOpen(true)}
            className="shrink-0 rounded-xl border-2 border-slate-800 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-800 hover:text-white"
          >
            {language === 'en' ? 'Request a quote' : 'Solicitar cotización'}
          </button>
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
                    {promoParcial && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2">
                        <Tag className="size-3.5 shrink-0 text-indigo-600" />
                        <span className="text-xs font-semibold text-indigo-700">
                          {language === 'en'
                            ? `${promoParcial.discountPct}% off — pay below to finish`
                            : `${promoParcial.discountPct}% de descuento — paga abajo para terminar`}
                        </span>
                        {promoParcial.discountedAmount !== null && (
                          <span className="ml-auto shrink-0 text-xs font-black text-indigo-700">
                            ${promoParcial.discountedAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
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

      {enterpriseModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-4 py-8 sm:items-center">
          <div className="my-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-bold text-slate-900">
                {language === 'en' ? 'Enterprise Plan' : 'Plan Empresa'}
              </h4>
              <button type="button" className="text-sm text-slate-600" onClick={closeEnterpriseModal}>{copy.close}</button>
            </div>

            <div className="mb-3 space-y-0.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800">
              <p>
                {clampedSeats} {seatWord(clampedSeats)} · ${enterprisePerSeat}/{language === 'en' ? 'user' : 'usuario'} · ${formatNumber(enterpriseTotal ?? 0)} {language === 'en' ? '/ month' : '/ mes'}
              </p>
              <p className="text-xs font-medium text-indigo-600">
                {formatNumber(enterpriseDocsIncluded)} {language === 'en' ? 'documents included/mo' : 'documentos incluidos/mes'}
              </p>
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
                <input
                  type="text"
                  value={enterpriseCompanyName}
                  onChange={(e) => setEnterpriseCompanyName(e.target.value)}
                  placeholder={language === 'en' ? 'Company name' : 'Nombre de tu empresa'}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-slate-400">
                  {language === 'en'
                    ? 'Only used if you don\'t have a company workspace yet — you can rename it anytime from "My Company".'
                    : 'Solo se usa si aún no tienes un espacio de empresa — puedes cambiarlo cuando quieras desde "Mi Empresa".'}
                </p>
                {!enterpriseCheckoutReady && (
                  <button
                    type="button"
                    onClick={() => {
                      const validEmail = /.+@.+\..+/.test(String(payerEmail || '').trim());
                      if (!payerName.trim() || !validEmail) { toast.error(copy.signInMsg); return; }
                      setEnterpriseCheckoutReady(true);
                    }}
                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                  >
                    {copy.continueToPay}
                  </button>
                )}
              </div>
            </div>

            {enterpriseCheckoutReady && !isAdmin && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-800">
                  ESIGN Act &amp; UETA Compliant · SHA-256 audit trail · PayPal encrypted checkout
                </p>
              </div>
            )}

            {isAdmin ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
                <p className="text-sm font-semibold text-emerald-800">
                  🛡 Admin bypass — {user?.email || 'admin'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    toast.success(
                      language === 'en'
                        ? 'Admin bypass — no charge needed for this account.'
                        : 'Bypass de admin — esta cuenta no necesita pagar.',
                    );
                    closeEnterpriseModal();
                    navigate('/my-company');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 transition"
                >
                  <ShieldCheck className="size-4" />
                  {language === 'en' ? 'Go to My Company' : 'Ir a Mi Empresa'}
                </button>
              </div>
            ) : (
              <div id="paypal-checkout-enterprise-container" className="min-h-[220px]" />
            )}
          </div>
        </div>
      )}

      <OnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        contextMessage={language === 'en' ? 'Register free for the Free Plan' : 'Regístrate gratis para el Plan Gratuito'}
      />

      <EnterpriseLeadModal open={enterpriseLeadOpen} onOpenChange={setEnterpriseLeadOpen} />
    </section>
  );
}