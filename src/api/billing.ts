import { API_BASE_URL, authenticatedFetch } from '../config/api';

const BILLING_BASE = `${API_BASE_URL}/api/billing`;

export type BillingStatus = {
  allowed: boolean;
  reason: string;
  subscriptionStatus: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  amountMxn: number;
  trialDays: number;
  mpConfigured: boolean;
  mpPreapprovalId: string | null;
};

export type CouponValidation = {
  valid: boolean;
  code?: string;
  amountMxn?: number;
  remaining?: number;
  label?: string;
  error?: string;
  codeError?: string;
};

export async function fetchBillingStatus(token: string): Promise<BillingStatus> {
  const res = await authenticatedFetch(`${BILLING_BASE}/status`, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar el estado de suscripción');
  return json as BillingStatus;
}

export async function validateBillingCoupon(
  token: string,
  couponCode: string,
): Promise<CouponValidation> {
  const res = await authenticatedFetch(`${BILLING_BASE}/coupons/validate`, token, {
    method: 'POST',
    body: JSON.stringify({ couponCode: couponCode.trim() }),
  });
  const json = await res.json();
  if (!res.ok) {
    return {
      valid: false,
      error: json.error ?? 'Cupón no válido',
      codeError: json.code,
    };
  }
  return json as CouponValidation;
}

export async function createAthleteSubscription(
  token: string,
  options?: { payerEmail?: string; couponCode?: string },
): Promise<{
  initPoint: string;
  alreadyActive?: boolean;
  preapprovalId?: string;
  amountMxn?: number;
  couponCode?: string | null;
}> {
  const res = await authenticatedFetch(`${BILLING_BASE}/mp/create-subscription`, token, {
    method: 'POST',
    body: JSON.stringify({
      payerEmail: options?.payerEmail?.trim() || undefined,
      couponCode: options?.couponCode?.trim() || undefined,
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error ?? 'No se pudo iniciar el pago') as Error & { code?: string };
    err.code = json.code;
    throw err;
  }
  return json;
}

export async function syncAthleteSubscription(token: string): Promise<{
  allowed: boolean;
  subscriptionStatus: string | null;
  synced?: boolean;
  alreadyActive?: boolean;
}> {
  const res = await authenticatedFetch(`${BILLING_BASE}/mp/sync`, token, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? 'No se pudo sincronizar la suscripción');
  }
  return json;
}

export async function cancelAthleteSubscription(token: string): Promise<{
  success: boolean;
  subscriptionStatus: string | null;
  message?: string;
}> {
  const res = await authenticatedFetch(`${BILLING_BASE}/mp/cancel`, token, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? 'No se pudo cancelar la suscripción');
  }
  return json;
}
