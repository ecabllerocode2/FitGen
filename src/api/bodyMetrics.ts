import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { BodyCheckinStatus, BodyMetricEntry, BodyMetricsCheckinPayload } from '../types/bodyMetrics';

export async function fetchBodyCheckinStatus(token: string) {
  const res = await authenticatedFetch(API_ENDPOINTS.BODY_METRICS_CHECKIN, token, {
    method: 'GET',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'No se pudo cargar el estado del check-in');
  }
  return data as {
    success: boolean;
    status: BodyCheckinStatus;
    recent: BodyMetricEntry[];
    latest: BodyMetricEntry | null;
  };
}

export async function submitBodyCheckin(token: string, payload: BodyMetricsCheckinPayload) {
  const res = await authenticatedFetch(API_ENDPOINTS.BODY_METRICS_CHECKIN, token, {
    method: 'POST',
    body: JSON.stringify({ metrics: payload }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? 'No se pudo guardar el check-in');
  }
  return data as {
    success: boolean;
    entry: BodyMetricEntry;
    status: BodyCheckinStatus;
  };
}
