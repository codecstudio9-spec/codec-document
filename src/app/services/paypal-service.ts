/**
 * PayPal Service - Backend Integration
 * 
 * Este servicio se comunica con el servidor backend de PayPal
 * para crear y capturar órdenes de forma segura.
 */

const API_BASE_URL = (import.meta as any).env?.VITE_PAYPAL_API_URL || '/api';

async function safeJson<T = any>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
  const parsed = await safeJson<{ error?: string; message?: string }>(response);
  throw new Error(parsed?.error || parsed?.message || fallbackMessage);
}

export async function createUnlimitedOrder(token: string): Promise<{ id: string; amountUsd: number }> {
  const response = await fetch(`${API_BASE_URL}/subscription/unlimited/create-order`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await throwApiError(response, 'No se pudo crear orden Unlimited');
  }
  const data = await safeJson<{ id: string; amountUsd: number }>(response);
  if (!data) throw new Error('Respuesta vacía al crear orden Unlimited');
  return data;
}

export async function captureUnlimitedOrder(token: string, orderId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/subscription/unlimited/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await throwApiError(response, 'No se pudo capturar orden Unlimited');
  }
  const data = await safeJson(response);
  if (!data) throw new Error('Respuesta vacía al capturar orden Unlimited');
  return data;
}

export async function createPlanOrder(
  token: string,
  planId: 'pro-monthly' | 'business-semiannual' | 'ultimate-annual'
): Promise<{ id: string; amountUsd: number; planId: string }> {
  const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}/create-order`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await throwApiError(response, 'No se pudo crear la orden del plan');
  }
  const data = await safeJson<{ id: string; amountUsd: number; planId: string }>(response);
  if (!data) throw new Error('Respuesta vacía al crear la orden del plan');
  return data;
}

export async function capturePlanOrder(
  token: string,
  planId: 'pro-monthly' | 'business-semiannual' | 'ultimate-annual',
  orderId: string
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/subscription/plans/${planId}/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    await throwApiError(response, 'No se pudo capturar la orden del plan');
  }
  const data = await safeJson(response);
  if (!data) throw new Error('Respuesta vacía al capturar la orden del plan');
  return data;
}

export interface CreateOrderRequest {
  amount: number;
  documentName: string;
  documentId: string;
  customerEmail?: string;
}

export interface CreateOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface CaptureOrderResponse {
  id: string;
  status: string;
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}

/**
 * Check if the PayPal backend server is running
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await safeJson(response);
      console.log('✅ PayPal server is healthy:', data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ PayPal server is not reachable:', error);
    return false;
  }
}

/**
 * Create a PayPal order via backend
 */
export async function createPayPalOrder(
  orderData: CreateOrderRequest
): Promise<CreateOrderResponse> {
  try {
    console.log('📝 Creating PayPal order:', orderData);
    
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to create order');
    }

    const data = await safeJson<CreateOrderResponse>(response);
    if (!data) throw new Error('Empty response when creating order');
    console.log('✅ Order created:', data.id);
    
    return data;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
}

/**
 * Capture a PayPal order payment via backend
 */
export async function capturePayPalOrder(
  orderId: string,
  metadata?: { customerEmail?: string; documentName?: string; documentContent?: string }
): Promise<CaptureOrderResponse> {
  try {
    console.log('💳 Capturing payment for order:', orderId);
    
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata || {}),
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to capture payment');
    }

    const data = await safeJson<CaptureOrderResponse>(response);
    if (!data) throw new Error('Empty response when capturing payment');
    console.log('✅ Payment captured:', data.id);
    
    return data;
  } catch (error) {
    console.error('❌ Error capturing payment:', error);
    throw error;
  }
}

/**
 * Get order details via backend
 */
export async function getOrderDetails(orderId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      await throwApiError(response, 'Failed to get order details');
    }

    return await safeJson(response);
  } catch (error) {
    console.error('❌ Error getting order details:', error);
    throw error;
  }
}

export async function getPurchaseUnlockStatus(orderId: string): Promise<{ unlocked: boolean; purchase?: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/purchases/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      return { unlocked: false };
    }

    if (!response.ok) {
      await throwApiError(response, 'Failed to get purchase status');
    }

    const data = await safeJson<{ unlocked: boolean; purchase?: any }>(response);
    if (!data) return { unlocked: false };
    return data;
  } catch (error) {
    console.error('❌ Error getting purchase status:', error);
    throw error;
  }
}

export interface CreateSignatureRequestPayload {
  orderId: string;
  documentId: string;
  documentName: string;
  documentContent?: string;
  buyerEmail?: string;
  buyerName?: string;
  signerEmail: string;
  signerName: string;
  contractSignerName?: string;
  contractSignerId?: string;
  brandingLogo?: string;
  signaturePlacement?: 'left' | 'right';
  signaturePlacementNotes?: string;
  signatureCoordinates?: {
    page_number: number;
    x_coordinate: number;
    y_coordinate: number;
  };
  feePaymentConfirmed?: boolean;
}

export interface SignaturePricingStatus {
  buyerEmail: string;
  freePerDay: number;
  extraFeeUsd: number;
  dailyUsage: number;
  freeRemaining: number;
  nextRequestFeeUsd: number;
}

export async function createSignatureRequest(payload: CreateSignatureRequestPayload): Promise<{ token: string; guestLink: string; status: string; isAdminBypass?: boolean }> {
  const response = await fetch(`${API_BASE_URL}/signature-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwApiError(response, 'Failed to create signature request');
  }
  const data = await safeJson<{ token: string; guestLink: string; status: string; isAdminBypass?: boolean }>(response);
  if (!data) throw new Error('Respuesta vacía al crear solicitud de firma');
  return data;
}

// Fallback used when the backend is unreachable (ECONNREFUSED / offline dev).
// Must match SIGNATURE_EXTRA_REQUEST_FEE_USD in server/server.js — showing a
// lower fee here than what the server actually charges is a billing bug.
const SIGNATURE_PRICING_FALLBACK: SignaturePricingStatus = {
  buyerEmail: '',
  freePerDay: 1,
  extraFeeUsd: 3.00,
  dailyUsage: 0,
  freeRemaining: 1,
  nextRequestFeeUsd: 0,
};

export async function getSignaturePricingStatus(buyerEmail: string): Promise<SignaturePricingStatus> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/signature-requests/pricing?buyerEmail=${encodeURIComponent(buyerEmail)}`,
    );
    if (!response.ok) {
      // Server is up but returned an error — use fallback, don't throw
      return { ...SIGNATURE_PRICING_FALLBACK, buyerEmail };
    }
    const data = await safeJson<SignaturePricingStatus>(response);
    return data ?? { ...SIGNATURE_PRICING_FALLBACK, buyerEmail };
  } catch {
    // Network error / ECONNREFUSED / proxy unavailable — return defaults so UI stays functional
    return { ...SIGNATURE_PRICING_FALLBACK, buyerEmail };
  }
}

export async function getSignatureRequest(documentIdOrToken: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/signature-requests/${documentIdOrToken}`);
  if (!response.ok) {
    await throwApiError(response, 'Failed to load signature request');
  }
  return await safeJson(response);
}

export async function getSignatureRequestStatus(token: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/signature-requests/${token}`);
  if (!response.ok) {
    await throwApiError(response, 'Failed to load signature request status');
  }
  return await safeJson(response);
}

export async function submitGuestSignature(documentIdOrToken: string, signatureDataUrl: string, signerName?: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/signature-requests/${documentIdOrToken}/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ signatureDataUrl, signerName }),
  });
  if (!response.ok) {
    await throwApiError(response, 'Failed to submit signature');
  }
  return await safeJson(response);
}

export async function getSignatureAuditByOrder(orderId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/signature-requests/order/${orderId}`);
  if (response.status === 404) return { found: false };
  if (!response.ok) {
    await throwApiError(response, 'Failed to load signature audit');
  }
  return await safeJson(response);
}

export async function getSignatureAuditsByOrder(orderId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/signature-requests/order/${orderId}/all`);
  if (response.status === 404) return { found: false, signatures: [] };
  if (!response.ok) {
    await throwApiError(response, 'Failed to load signatures audit');
  }
  return await safeJson(response);
}
