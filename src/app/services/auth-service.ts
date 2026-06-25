const API_BASE_URL = import.meta.env.VITE_PAYPAL_API_URL || '/api';

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

export interface AuthUser {
  email: string;
  name?: string;
  picture?: string;
  isAdmin?: boolean;
}

export interface SubscriptionStatus {
  email: string;
  unlimitedActive: boolean;
  subscriptionActive?: boolean;
  annualPriceUsd: number;
  planCode: string;
  isAdmin?: boolean;
}

export interface UserPurchasedDocument {
  documentId: string;
  documentName?: string;
  orderId?: string;
  purchasedAt: string;
}

export async function loginWithGoogleIdToken(idToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    await throwApiError(response, 'No se pudo iniciar sesión');
  }
  const data = await safeJson(response);
  if (!data) throw new Error('Respuesta vacía del servidor de autenticación');
  return data;
}

const SUBSCRIPTION_FALLBACK: SubscriptionStatus = {
  email: '',
  unlimitedActive: false,
  subscriptionActive: false,
  annualPriceUsd: 180,
  planCode: 'free',
};

export async function fetchSubscriptionStatus(token: string): Promise<SubscriptionStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/subscription/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return SUBSCRIPTION_FALLBACK;
    const data = await safeJson<SubscriptionStatus>(response);
    return data ?? SUBSCRIPTION_FALLBACK;
  } catch {
    return SUBSCRIPTION_FALLBACK;
  }
}

export async function fetchMyPurchasedDocuments(token: string): Promise<UserPurchasedDocument[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/purchases/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    const data = await safeJson<{ documents?: UserPurchasedDocument[] }>(response);
    return data?.documents || [];
  } catch {
    return [];
  }
}

export async function saveMyPurchasedDocument(
  token: string,
  payload: { documentId: string; documentName?: string; orderId?: string }
) {
  const response = await fetch(`${API_BASE_URL}/purchases/me`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    await throwApiError(response, 'No se pudo guardar la compra del documento');
  }
  return (await safeJson(response)) ?? { success: true };
}
