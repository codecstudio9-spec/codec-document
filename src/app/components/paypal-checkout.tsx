import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { getPayPalClientId, isPayPalConfigured, getPayPalMode } from '../config/paypal';

interface PayPalCheckoutProps {
  amount: number;
  documentName: string;
  onSuccess: (orderId: string) => void;
  onError: (error: any) => void;
  language: 'en' | 'es';
}

export function PayPalCheckout({ amount, documentName, onSuccess, onError, language }: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  const PAYPAL_CLIENT_ID = getPayPalClientId();
  const PAYPAL_MODE = getPayPalMode();
  const isConfigured = isPayPalConfigured();

  const initialOptions = {
    clientId: PAYPAL_CLIENT_ID,
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
    locale: language === 'es' ? 'es_US' : 'en_US',
  };

  if (!isConfigured) {
    return (
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertDescription>
          {language === 'es' 
            ? '⚠️ PayPal no está configurado. Por favor configura tu Client ID en /src/app/components/paypal-checkout.tsx'
            : '⚠️ PayPal is not configured. Please set your Client ID in /src/app/components/paypal-checkout.tsx'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      {loading && (
        <div className="flex items-center justify-center py-8 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <Loader2 className="size-6 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-900 font-medium">
            {language === 'es' ? 'Procesando pago...' : 'Processing payment...'}
          </span>
        </div>
      )}

      {scriptError && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="size-4" />
          <AlertDescription>
            {language === 'es'
              ? 'Error al cargar PayPal. Verifica tu conexión e intenta de nuevo.'
              : 'Error loading PayPal. Check your connection and try again.'}
          </AlertDescription>
        </Alert>
      )}

      <PayPalScriptProvider 
        options={initialOptions}
        onError={() => setScriptError(true)}
      >
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay',
            height: 48,
            tagline: false,
          }}
          disabled={loading}
          forceReRender={[amount, language]}
          createOrder={(data, actions) => {
            setLoading(true);
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  description: `${documentName} - Codec Document`,
                  amount: {
                    currency_code: 'USD',
                    value: amount.toFixed(2),
                    breakdown: {
                      item_total: {
                        currency_code: 'USD',
                        value: amount.toFixed(2),
                      },
                    },
                  },
                  items: [
                    {
                      name: documentName,
                      description: 'Professional Legal Document Template',
                      unit_amount: {
                        currency_code: 'USD',
                        value: amount.toFixed(2),
                      },
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
              },
            });
          }}
          onApprove={async (data, actions) => {
            try {
              const order = await actions.order!.capture();
              console.log('✅ Payment successful:', order);
              
              const orderId = order.id || '';
              
              toast.success(
                language === 'es'
                  ? '¡Pago completado exitosamente!'
                  : 'Payment completed successfully!',
                {
                  description: language === 'es'
                    ? `Order ID: ${orderId}`
                    : `Order ID: ${orderId}`,
                  duration: 5000,
                }
              );
              
              setLoading(false);
              onSuccess(orderId);
            } catch (error) {
              console.error('❌ Error capturing payment:', error);
              toast.error(
                language === 'es'
                  ? 'Error al procesar el pago'
                  : 'Error processing payment'
              );
              setLoading(false);
              onError(error);
            }
          }}
          onCancel={() => {
            setLoading(false);
            toast.info(
              language === 'es'
                ? 'Pago cancelado'
                : 'Payment cancelled',
              {
                description: language === 'es'
                  ? 'Puedes intentar de nuevo cuando quieras'
                  : 'You can try again whenever you want'
              }
            );
          }}
          onError={(err) => {
            console.error('❌ PayPal error:', err);
            setLoading(false);
            toast.error(
              language === 'es'
                ? 'Error con PayPal. Intenta de nuevo.'
                : 'PayPal error. Please try again.'
            );
            onError(err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}