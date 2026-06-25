/**
 * CONFIGURACIÓN DE PAYPAL - CODEC DOCUMENT (MODO PRODUCCIÓN)
 * 
 * ⚠️ IMPORTANTE: Esta plataforma está configurada en MODO LIVE (PRODUCCIÓN)
 * Todos los pagos que se procesen serán REALES.
 * 
 * Para recibir pagos en tu cuenta PayPal Business:
 * 1. Reemplaza 'YOUR_LIVE_CLIENT_ID_HERE' con tu Client ID de producción
 * 2. Guarda este archivo
 * 3. ¡Listo! Los pagos irán directamente a tu cuenta PayPal
 */

export const PAYPAL_CONFIG = {
  // ────────────────────────────────────────────────────────────────────────
  // MODO ACTUAL
  // ────────────────────────────────────────────────────────────────────────
  // Cambia esto a 'live' cuando tengas tu cuenta Business real y quieras
  // recibir pagos reales en tu PayPal
  
  mode: 'sandbox' as 'sandbox' | 'live',
  
  // ────────────────────────────────────────────────────────────────────────
  // CREDENCIALES SANDBOX (Pruebas)
  // ────────────────────────────────────────────────────────────────────────
  sandbox: {
    clientId: 'Admipg5R4jQHbYbFjO4J8K_jTXOvQVSH58XDU7IbuZQWaLHjxHDQA7KGsPmpHBgvZfgGfXWjqGdEBZSS',
    // La secret key NO se usa en el frontend por seguridad
    // Solo se usa si tienes un backend que procesa pagos
  },
  
  // ────────────────────────────────────────────────────────────────────────
  // CREDENCIALES LIVE (Producción) - PAGOS REALES
  // ────────────────────────────────────────────────────────────────────────
  // ⚠️ IMPORTANTE: Para recibir pagos reales:
  // 
  // 1. Crea una cuenta PayPal Business (si no tienes):
  //    https://www.paypal.com/businesssignup
  // 
  // 2. Verifica tu cuenta business (conecta tu banco)
  // 
  // 3. Obtén tus credenciales LIVE:
  //    a. Ve a: https://www.paypal.com/merchantapps/appcenter/acceptpayments/checkout
  //    b. Click en "Get Started" o "Accept Payments"
  //    c. En la configuración, asegúrate de estar en modo "Live" (NO "Sandbox")
  //    d. Copia tu Client ID de producción
  //    e. Pégalo abajo reemplazando 'YOUR_LIVE_CLIENT_ID_HERE'
  // 
  // 4. Cambia mode: 'sandbox' a mode: 'live' arriba
  // 
  // 5. LISTO! Los pagos irán directamente a tu cuenta PayPal Business
  
  live: {
    clientId: 'AaFMRm1KSIJEz0kJKM67udEkeL_GrZ8P3a7Vt6yHdQC5ioSk_DoaTKpiiXHiRHW10HLHg_J2O2PCNi3q',
    // La secret key NO se usa en el frontend por seguridad
  },
};

export const PAYPAL_HOSTED_BUTTONS = {
  'residential-lease': { hostedButtonId: 'R8LKGZGEJW92S', type: 'sdk' as const },
  nda: { hostedButtonId: 'Y224HPMUPC5S4', type: 'form' as const },
  'independent-contractor': { hostedButtonId: 'WMPH3Q5VC9HJA', type: 'form' as const },
  'bill-of-sale-vehicle': { hostedButtonId: 'Y7S4VZPGTG5MY', type: 'form' as const },
  'service-agreement': { hostedButtonId: 'X6YHYUBYM6GEU', type: 'form' as const },
  'promissory-note': { hostedButtonId: 'J42UB8NQ2BH8J', type: 'form' as const },
} as const;

const PAYPAL_HOSTED_BUTTON_ALIASES: Record<string, keyof typeof PAYPAL_HOSTED_BUTTONS> = {
  // Variantes comunes por formato de ID
  residential_lease: 'residential-lease',
  lease: 'residential-lease',
  contrato_arriendo: 'residential-lease',

  independent_contractor: 'independent-contractor',
  contractor: 'independent-contractor',

  bill_of_sale_vehicle: 'bill-of-sale-vehicle',
  billofsalevehicle: 'bill-of-sale-vehicle',
  bill_of_sale: 'bill-of-sale-vehicle',

  service_agreement: 'service-agreement',
  services_agreement: 'service-agreement',

  promissory_note: 'promissory-note',
  promissorynote: 'promissory-note',
};

export const PAYPAL_LEASE_SDK_CLIENT_ID =
  PAYPAL_CONFIG.live.clientId;

export function getHostedButtonConfig(documentId: string) {
  const normalized = (documentId || '').trim().toLowerCase();

  const direct = PAYPAL_HOSTED_BUTTONS[normalized as keyof typeof PAYPAL_HOSTED_BUTTONS];
  if (direct) return direct;

  const aliasKey = normalized.replace(/-/g, '_');
  const mappedKey = PAYPAL_HOSTED_BUTTON_ALIASES[aliasKey] ?? PAYPAL_HOSTED_BUTTON_ALIASES[normalized];
  if (mappedKey) return PAYPAL_HOSTED_BUTTONS[mappedKey];

  return null;
}

// ────────────────────────────────────────────────────────────────────────
// HELPER PARA OBTENER EL CLIENT ID ACTUAL
// ────────────────────────────────────────────────────────────────────────
export function getPayPalClientId(): string {
  if (PAYPAL_CONFIG.mode === 'sandbox') {
    return PAYPAL_CONFIG.sandbox.clientId;
  } else {
    return PAYPAL_CONFIG.live.clientId;
  }
}

export function isPayPalConfigured(): boolean {
  const clientId = getPayPalClientId();
  return clientId !== '' && clientId !== 'YOUR_LIVE_CLIENT_ID_HERE';
}

export function getPayPalMode(): 'sandbox' | 'live' {
  return PAYPAL_CONFIG.mode;
}

// ── Document price matrix ─────────────────────────────────────────────────
export const DOCUMENT_PRICES: Record<string, number> = {
  'residential-lease':      7.00,
  'bill-of-sale-vehicle':   7.00,
  'promissory-note':        7.00,
  'nda':                    9.99,
  'independent-contractor': 9.99,
  'service-agreement':      9.99,
};
export const STANDALONE_SIG_PRICE = 3.00;
export const DEFAULT_DOC_PRICE    = 7.00;

export function getDocumentPrice(documentId: string): number {
  if (documentId === 'sig') return STANDALONE_SIG_PRICE;
  return DOCUMENT_PRICES[documentId] ?? DEFAULT_DOC_PRICE;
}

// ── Subscription plan IDs (PayPal dashboard → Products & Plans) ───────────
export const PAYPAL_SUBSCRIPTION_PLANS = {
  monthly: {
    planId:  (import.meta.env.VITE_PAYPAL_PLAN_MONTHLY    as string) || '',
    price:   79.99,
    period:  '1 month'  as const,
    savings: null       as null,
  },
  semiannual: {
    planId:  (import.meta.env.VITE_PAYPAL_PLAN_SEMIANNUAL as string) || '',
    price:   269.99,
    period:  '6 months' as const,
    savings: 'Save 44%' as string | null,
  },
  annual: {
    planId:  (import.meta.env.VITE_PAYPAL_PLAN_ANNUAL     as string) || '',
    price:   519.99,
    period:  '1 year'   as const,
    savings: 'Best Value' as string | null,
  },
} as const;

export type PlanKey = keyof typeof PAYPAL_SUBSCRIPTION_PLANS;

// Admin master bypass code
export const ADMIN_MASTER_CODE =
  (import.meta.env.VITE_ADMIN_MASTER_CODE as string) || 'CODEC_ADMIN_2026';

// ════════════════════════════════════════════════════════════════════════════
// 📝 NOTAS IMPORTANTES
// ════════════════════════════════════════════════════════════════════════════
// 
// DIFERENCIAS ENTRE SANDBOX Y LIVE:
// 
// SANDBOX (Pruebas):
// ✅ Puedes probar todo el flujo de pago
// ✅ Puedes ver cómo se verá para los clientes
// ✅ Crear órdenes, cancelar pagos, etc.
// ❌ NO recibes dinero real
// ❌ Necesitas cuentas de prueba especiales
// ❌ Los pagos no aparecen en tu PayPal real
// 
// LIVE (Producción):
// ✅ Recibes DINERO REAL en tu cuenta PayPal Business
// ✅ Los clientes pagan con sus cuentas PayPal reales
// ✅ Puedes retirar el dinero a tu banco
// ⚠️ PayPal cobra comisiones (típicamente 2.9% + $0.30 USD por transacción)
// ⚠️ Debes tener una cuenta Business verificada
// 
// COMISIONES DE PAYPAL (USA):
// - Transacciones domésticas: 2.9% + $0.30 USD
// - Transacciones internacionales: 4.4% + comisión fija
// - Ejemplo: Si vendes un documento a $10, recibes ~$9.41 ($10 - $0.29 - $0.30)
// 
// RETIRO DE FONDOS:
// - Puedes transferir el dinero de PayPal a tu cuenta bancaria
// - Transferencias normalmente toman 1-3 días hábiles
// - No hay costo por transferir a tu banco en USA
// 
// PROTECCIÓN AL VENDEDOR:
// - PayPal ofrece protección contra contracargos para bienes digitales
// - Asegúrate de entregar los documentos inmediatamente después del pago
// - Guarda registros de todas las transacciones
// 
// ════════════════════════════════════════════════════════════════════════════