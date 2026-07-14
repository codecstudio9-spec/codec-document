import { useEffect, useState } from 'react';
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { ShieldCheck, Zap, Infinity, Loader, CheckCircle, XCircle, RefreshCw, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { getPayPalClientId } from '../../config/paypal';
import { verifyPaypalOrder } from '../../../lib/paypal-verify';
import { watchAndUnlockBodyScroll } from '../../utils/paypal-scroll-fix';

interface PaypalSignatureCheckoutProps {
  userId: string;
  onSuccess: (plan: 'single' | 'monthly') => void;
}

type Plan = 'single' | 'monthly';

const PLANS: Array<{
  id: Plan;
  price: number;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  badge?: string;
  color: string;
  glow: string;
}> = [
  {
    id: 'single',
    price: 3,
    label: 'Una Firma',
    sublabel: 'Válida para este documento',
    icon: <Zap className="size-5" />,
    color: 'from-blue-600 to-indigo-600',
    glow: 'shadow-blue-500/30',
  },
  {
    id: 'monthly',
    price: 50,
    label: 'Plan Mensual',
    sublabel: 'Firmas ilimitadas por 30 días',
    badge: 'Más Popular',
    icon: <Infinity className="size-5" />,
    color: 'from-emerald-600 to-teal-600',
    glow: 'shadow-emerald-500/30',
  },
];

export function PaypalSignatureCheckout({ userId, onSuccess }: PaypalSignatureCheckoutProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('single');
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  const clientId = getPayPalClientId();
  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  // PayPal's card-fields overlay can lock body scroll on its own, outside
  // any lifecycle event this component gets — see paypal-scroll-fix.ts.
  useEffect(() => watchAndUnlockBodyScroll(), []);

  const handleApprove = async (orderId: string) => {
    setProcessing(true);
    try {
      // Server verifies the order with PayPal's REST API (real payment,
      // correct amount, not reused) and grants the credit/plan itself —
      // this component no longer writes user_credits directly.
      await verifyPaypalOrder({
        orderId,
        product: selectedPlan === 'single' ? 'sig_single' : 'sig_monthly',
      });
      setSucceeded(true);
      toast.success('¡Pago confirmado! Ya puedes continuar con tu firma.');
      onSuccess(selectedPlan);
    } catch (err) {
      toast.error(`Error al activar plan: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-400/30 bg-emerald-950/40 px-6 py-10 text-center">
        <CheckCircle className="size-14 text-emerald-400" />
        <div>
          <p className="text-lg font-bold text-white">¡Listo! Acceso desbloqueado</p>
          <p className="text-sm text-white/60">
            {selectedPlan === 'monthly' ? 'Plan mensual activo por 30 días' : '1 crédito de firma disponible'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 ring-1 ring-indigo-400/20">
          <ShieldCheck className="size-6 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white">Desbloquear firma digital</h3>
        <p className="mt-1 text-sm text-white/50">
          Elige tu plan. El PDF certificado estará disponible al instante.
        </p>
      </div>

      {/* Plan selector */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPlan(p.id)}
            className={[
              'relative flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-200',
              selectedPlan === p.id
                ? 'border-white/30 bg-white/10 ring-2 ring-white/20'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
            ].join(' ')}
          >
            {p.badge && (
              <span className="absolute -top-2.5 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {p.badge}
              </span>
            )}
            <div className={`flex size-8 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-white`}>
              {p.icon}
            </div>
            <p className="text-sm font-bold text-white">{p.label}</p>
            <p className="text-[11px] text-white/50">{p.sublabel}</p>
            <p className="mt-1 text-xl font-black text-white">
              ${p.price.toFixed(2)} <span className="text-xs font-normal text-white/40">USD</span>
            </p>
            {selectedPlan === p.id && (
              <span className="absolute right-3 top-3 flex size-4 items-center justify-center rounded-full bg-white/20">
                <span className="size-1.5 rounded-full bg-white" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Trust badges */}
      <div className="mb-5 flex flex-wrap justify-center gap-3 text-[11px] text-white/40">
        <span className="inline-flex items-center gap-1"><Lock className="size-3" /> Pago 100% seguro</span>
        <span className="inline-flex items-center gap-1"><Zap className="size-3" /> Acceso instantáneo</span>
        <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3" /> SHA-256 certificado</span>
      </div>

      {/* PayPal button */}
      {processing ? (
        <div className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-4 text-sm text-white/70">
          <Loader className="size-4 animate-spin" />
          Activando tu plan…
        </div>
      ) : clientId ? (
        <PayPalScriptProvider
          options={{ clientId, currency: 'USD', intent: 'capture', components: 'buttons' }}
        >
          <PayPalButtonsArea plan={plan} selectedPlan={selectedPlan} onApprove={handleApprove} />
        </PayPalScriptProvider>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          <XCircle className="size-4 shrink-0" />
          PayPal no configurado. Agrega VITE_PAYPAL_CLIENT_ID al .env.local
        </div>
      )}
    </div>
  );
}

/**
 * Lives inside <PayPalScriptProvider> and reads the real script-load status
 * via usePayPalScriptReducer(). The old code passed an `onError` prop
 * directly to PayPalScriptProvider — that prop doesn't exist on this
 * library's ScriptProviderProps (confirmed by tsc), so it silently did
 * nothing. If the SDK script failed to load (ad-blocker, offline, slow
 * mobile network), the button area just rendered blank with zero feedback
 * — a dead end for the user. This shows a real loading/error state instead.
 */
function PayPalButtonsArea({
  plan, selectedPlan, onApprove,
}: {
  plan: (typeof PLANS)[number];
  selectedPlan: Plan;
  onApprove: (orderId: string) => Promise<void>;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-red-400/20 bg-red-950/30 px-4 py-4 text-center text-xs text-red-300">
        <XCircle className="size-5" />
        No se pudo cargar PayPal. Revisa tu conexión o desactiva bloqueadores de anuncios.
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
        >
          <RefreshCw className="size-3.5" />
          Reintentar
        </button>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl bg-white/10 py-4 text-sm text-white/70">
        <Loader className="size-4 animate-spin" />
        Cargando PayPal…
      </div>
    );
  }

  return (
    <PayPalButtons
      key={selectedPlan} // force remount when plan changes
      style={{ layout: 'vertical', color: 'blue', shape: 'rect', label: 'pay', height: 48, tagline: false }}
      forceReRender={[plan.price]}
      createOrder={(_data, actions) =>
        actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              description: `Codec Document · ${plan.label}`,
              amount: {
                currency_code: 'USD',
                value: plan.price.toFixed(2),
              },
            },
          ],
          application_context: {
            brand_name: 'Codec Document',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
          },
        })
      }
      onApprove={async (data, actions) => {
        const order = await actions.order!.capture();
        await onApprove(order.id || data.orderID || '');
      }}
      onCancel={() => toast.info('Pago cancelado. Puedes intentarlo de nuevo.')}
      onError={() => toast.error('Error con PayPal. Intenta de nuevo.')}
    />
  );
}
