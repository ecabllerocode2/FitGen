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

export async function fetchBillingStatus(token: string): Promise<BillingStatus> {
  const res = await authenticatedFetch(`${BILLING_BASE}/status`, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'No se pudo cargar el estado de suscripción');
  return json as BillingStatus;
}

export async function createAthleteSubscription(
  token: string,
  options?: { payerEmail?: string },
): Promise<{
  initPoint: string;
  alreadyActive?: boolean;
  preapprovalId?: string;
  amountMxn?: number;
}> {
  const res = await authenticatedFetch(`${BILLING_BASE}/mp/create-subscription`, token, {
    method: 'POST',
    body: JSON.stringify({
      payerEmail: options?.payerEmail?.trim() || undefined,
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
