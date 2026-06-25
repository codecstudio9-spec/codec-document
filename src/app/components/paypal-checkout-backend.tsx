import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, XCircle, ShieldCheck } from 'lucide-react';
import { PAYPAL_LEASE_SDK_CLIENT_ID } from '../config/paypal';

interface PayPalCheckoutBackendProps {
  amount: number;
  documentName: string;
  documentId: string;
  documentContent?: string;
  customerEmail?: string;
  isEmailValid?: boolean;
  onSuccess: (orderId: string) => void;
  onError: (error: any) => void;
  onAdminAccess?: () => void;
  language: 'en' | 'es';
}

const ADMIN_EMAIL = 'douglastabordasanchez@gmail.com';

function restoreBodyScroll() {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.body.removeAttribute('data-scroll-locked');
}

let sdkLoadPromise: Promise<void> | null = null;

function loadPayPalSdk(clientId: string): Promise<void> {
  if ((window as any).paypal?.Buttons) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-paypal-checkout-sdk="true"]',
    );
    if (existing) {
      if ((window as any).paypal?.Buttons) { resolve(); return; }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('PayPal SDK failed')), { once: true });
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
    script.setAttribute('data-paypal-checkout-sdk', 'true');
    script.onload = () => resolve();
    script.onerror = () => {
      sdkLoadPromise = null;
      reject(new Error('PayPal SDK load failed'));
    };
    document.body.appendChild(script);
  });

  return sdkLoadPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — the actual PayPal buttons mount point.
// Wrapped in React.memo with a strict custom comparator so it NEVER re-renders
// due to parent form state changes (email typing, promo input, etc.).
// Callbacks are stored in refs so they stay fresh without causing re-renders.
// ─────────────────────────────────────────────────────────────────────────────
function PayPalButtonsCore({
  amount,
  documentName,
  customerEmail,
  isEmailValid,
  onSuccess,
  onError,
  language,
}: Omit<PayPalCheckoutBackendProps, 'documentContent' | 'onAdminAccess'>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const [sdkError, setSdkError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Store callbacks in refs — always current, never stale, never cause re-renders
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Synchronous pre-unmount cleanup — runs BEFORE React removes DOM nodes from the document.
  // Clearing the container here lets PayPal's MutationObserver process the removal while the
  // node is still in the DOM, so PayPal's internal removeChild calls never target orphaned nodes.
  // Destroying the script + window.paypal prevents its observers from firing on subsequent pages.
  useLayoutEffect(() => {
    return () => {
      if (containerRef.current) {
        try { containerRef.current.innerHTML = ''; } catch (_) {}
      }
      document
        .querySelectorAll('script[data-paypal-checkout-sdk="true"], script[data-paypal-dynamic-sdk="true"]')
        .forEach((s) => { try { s.remove(); } catch (_) {} });
      sdkLoadPromise = null;
      try { delete (window as any).paypal; } catch (_) {}
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isEmailValid) return;

    let cancelled = false;
    mountedRef.current = false;

    const mount = async () => {
      try {
        setSdkError(false);
        setLoading(true);

        await loadPayPalSdk(PAYPAL_LEASE_SDK_CLIENT_ID);
        if (cancelled) return;
        // Guard: SDK might have been destroyed by a previous cleanup cycle
        if (!(window as any).paypal?.Buttons) return;

        const container = containerRef.current;
        if (!container) return;

        // Wipe any previous PayPal injection before re-mounting
        try { container.innerHTML = ''; } catch (_) { /* already detached */ }

        await (window as any).paypal
          .Buttons({
            style: {
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay',
              height: 48,
              tagline: false,
            },
            fundingSource: undefined,

            createOrder: (_data: any, actions: any) => {
              setLoading(false);
              return actions.order.create({
                intent: 'CAPTURE',
                purchase_units: [
                  {
                    description: `${documentName} — Codec Document`,
                    custom_id: (customerEmail || '').trim(),
                    soft_descriptor: 'CODEC DOC',
                    amount: {
                      currency_code: 'USD',
                      value: amount.toFixed(2),
                      breakdown: {
                        item_total: { currency_code: 'USD', value: amount.toFixed(2) },
                      },
                    },
                    items: [
                      {
                        name: documentName.slice(0, 127),
                        description: 'Legal Document — Codec Document Platform',
                        unit_amount: { currency_code: 'USD', value: amount.toFixed(2) },
                        quantity: '1',
                        category: 'DIGITAL_GOODS',
                      },
                    ],
                  },
                ],
                application_context: {
                  brand_name: 'Codec Document',
                  shipping_preference: 'NO_SHIPPING',
                  user_action: 'PAY_NOW',
                  payment_method: {
                    payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
                    payer_selected: 'PAYPAL_CREDIT_OR_DEBIT_CARD',
                  },
                },
              });
            },

            onApprove: async (_data: any, actions: any) => {
              setLoading(true);
              restoreBodyScroll();
              try {
                const order = await actions.order!.capture();
                const orderId: string = order?.id ?? _data?.orderID ?? '';
                onSuccessRef.current(orderId);
              } catch (err) {
                console.error('PayPal capture error:', err);
                onErrorRef.current(err);
              } finally {
                setLoading(false);
                restoreBodyScroll();
              }
            },

            onCancel: () => {
              setLoading(false);
              restoreBodyScroll();
            },

            onError: (err: any) => {
              console.error('PayPal button error:', err);
              setLoading(false);
              restoreBodyScroll();
              onErrorRef.current(err);
            },
          })
          .render(containerRef.current!);

        mountedRef.current = true;
      } catch (err) {
        if (!cancelled) {
          setSdkError(true);
          setLoading(false);
        }
      }
    };

    void mount();

    return () => {
      cancelled = true;
      restoreBodyScroll();
      // Container and SDK are cleaned up synchronously by useLayoutEffect above.
      // This async cleanup only needs to stop the in-flight mount() coroutine.
    };
    // Callbacks deliberately excluded — stored in refs above, never cause remounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmailValid, amount, customerEmail, documentName]);

  if (sdkError) {
    return (
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertDescription>
          {language === 'es'
            ? 'Error al cargar PayPal. Verifica tu conexión e intenta de nuevo.'
            : 'Error loading PayPal. Check your connection and try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-3">
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-4 text-sm font-medium text-blue-800">
          <Loader2 className="size-4 animate-spin" />
          {language === 'en' ? 'Processing payment…' : 'Procesando pago…'}
        </div>
      )}

      {/* key="paypal-button-static" prevents React from ever unmounting this node */}
      <div
        key="paypal-button-static"
        ref={containerRef}
        className="relative z-20 min-h-[120px] rounded-lg"
      />

      <p className="text-center text-[11px] text-slate-400">
        {language === 'en'
          ? 'No PayPal account required — pay directly with any debit or credit card.'
          : 'No necesitas cuenta PayPal — paga directamente con cualquier tarjeta de débito o crédito.'}
      </p>
    </div>
  );
}

// Custom memo comparator — only re-render when PayPal-critical props change.
// onSuccess / onError / onAdminAccess are EXCLUDED: they change identity every
// parent render but are kept fresh via refs inside PayPalButtonsCore.
const MemoizedPayPalButtonsCore = memo(PayPalButtonsCore, (prev, next) =>
  prev.amount === next.amount &&
  prev.documentId === next.documentId &&
  prev.customerEmail === next.customerEmail &&
  prev.isEmailValid === next.isEmailValid &&
  prev.language === next.language,
);

// ─────────────────────────────────────────────────────────────────────────────
// Public component — handles admin bypass and email-gate, then delegates to
// MemoizedPayPalButtonsCore which is isolated from parent re-renders.
// ─────────────────────────────────────────────────────────────────────────────
export function PayPalCheckoutBackend({
  amount,
  documentName,
  documentId,
  customerEmail,
  isEmailValid,
  onSuccess,
  onError,
  onAdminAccess,
  language,
}: PayPalCheckoutBackendProps) {
  const isAdmin = (customerEmail || '').trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  if (isAdmin) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-3">
        <p className="text-sm font-semibold text-emerald-800">
          {language === 'en'
            ? '🛡 Admin access verified — bypass payment gate'
            : '🛡 Acceso de administrador verificado — saltar pasarela de pago'}
        </p>
        <button
          type="button"
          onClick={onAdminAccess}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 active:scale-95 transition"
        >
          <ShieldCheck className="size-4" />
          {language === 'en'
            ? 'View unlocked document & download PDF'
            : 'Ver documento desbloqueado y descargar PDF'}
        </button>
      </div>
    );
  }

  if (!isEmailValid) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
        {language === 'en'
          ? 'Enter a valid email address above to unlock the payment buttons.'
          : 'Ingresa un correo electrónico válido arriba para habilitar los botones de pago.'}
      </div>
    );
  }

  return (
    <MemoizedPayPalButtonsCore
      amount={amount}
      documentName={documentName}
      documentId={documentId}
      customerEmail={customerEmail}
      isEmailValid={isEmailValid}
      onSuccess={onSuccess}
      onError={onError}
      language={language}
    />
  );
}
