import { API_BASE_URL, authenticatedFetch } from '../config/api';
import type {
  CoachClientSummary,
  CoachInsight,
  CoachNote,
  CoachProfile,
  ShareBranding,
} from '../types/coach';
import type { CoachClientDashboardData } from '../types/coachDashboard';

const COACH_BASE = `${API_BASE_URL}/api/coach`;
const JOIN_BASE = `${API_BASE_URL}/api/join`;
const ATHLETE_BASE = `${API_BASE_URL}/api/athlete`;

export async function registerCoach(
  token: string,
  data: { displayName: string; publicName?: string; bio?: string },
) {
  const res = await authenticatedFetch(`${COACH_BASE}/register`, token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al registrar coach');
  return json as { success: boolean; coach: CoachProfile };
}

export async function fetchCoachMe(token: string) {
  const res = await authenticatedFetch(`${COACH_BASE}/me`, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al cargar coach');
  return json as {
    coach: CoachProfile;
    summary: {
      activeClientCount: number;
      seatsConsumedLifetime: number;
      seatLimit: number;
      plan: string;
      alerts: Array<CoachInsight & { athleteId: string; athleteName: string }>;
    };
  };
}

export async function createCoachInvite(token: string) {
  const res = await authenticatedFetch(`${COACH_BASE}/invites`, token, { method: 'POST' });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json.error ?? 'No se pudo crear invite') as Error & {
      code?: string;
      requiresPremium?: boolean;
    };
    err.code = json.code;
    err.requiresPremium = json.requiresPremium;
    throw err;
  }
  return json as {
    invite: { id: string; joinPath: string; joinUrl: string; expiresAt: string };
    token: string;
  };
}

export async function fetchCoachClients(token: string) {
  const res = await authenticatedFetch(`${COACH_BASE}/clients`, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al cargar clientes');
  return json.clients as CoachClientSummary[];
}

export async function fetchCoachClientDetail(token: string, athleteId: string) {
  const res = await authenticatedFetch(`${COACH_BASE}/clients/${athleteId}`, token);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al cargar cliente');
  return json.client as CoachClientDashboardData;
}

export async function saveClientTrainingProfile(
  token: string,
  athleteId: string,
  profileData: Record<string, unknown>,
  generateMesocycle = false,
) {
  const res = await authenticatedFetch(`${COACH_BASE}/clients/${athleteId}/training-profile`, token, {
    method: 'PATCH',
    body: JSON.stringify({ profileData, generateMesocycle }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al guardar perfil técnico');
  return json as {
    success: boolean;
    profileChange?: { tier: string; message: string; requiresSessionClear?: boolean };
    profileCompleteness?: { readyForMesocycle: boolean };
    mesocycle?: unknown;
  };
}

export async function generateClientMesocycle(token: string, athleteId: string) {
  const res = await authenticatedFetch(`${COACH_BASE}/clients/${athleteId}/mesocycle/generate`, token, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al generar mesociclo');
  return json;
}

export async function releaseClient(token: string, athleteId: string) {
  const res = await authenticatedFetch(`${COACH_BASE}/clients/${athleteId}/release`, token, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al archivar cliente');
  return json;
}

export async function addClientNote(token: string, athleteId: string, text: string) {
  const res = await authenticatedFetch(`${COACH_BASE}/clients/${athleteId}/notes`, token, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al guardar nota');
  return json.note as CoachNote;
}

export async function coachSwapExercise(
  token: string,
  athleteId: string,
  body: { exerciseIdToReplace: string; reason?: string },
) {
  const res = await authenticatedFetch(`${COACH_BASE}/clients/${athleteId}/swap-exercise`, token, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al cambiar ejercicio');
  return json;
}

export async function lookupJoinInvite(joinToken: string) {
  const res = await fetch(`${JOIN_BASE}/${joinToken}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Enlace inválido');
  return json as {
    coach: { publicName: string; displayName: string; bio: string };
    invite: { id: string; expiresAt: string };
  };
}

export async function acceptJoinInvite(
  token: string,
  joinToken: string,
  profileData: Record<string, unknown>,
) {
  const res = await authenticatedFetch(`${JOIN_BASE}/${joinToken}/accept`, token, {
    method: 'POST',
    body: JSON.stringify({ profileData }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Error al unirse');
  return json;
}

export async function fetchShareBranding(token: string) {
  const res = await authenticatedFetch(`${ATHLETE_BASE}/share-branding`, token);
  const json = await res.json();
  if (!res.ok) {
    return {
      footer: 'default' as const,
      footerText: 'Entrenamiento completado con FitGen',
    } satisfies ShareBranding;
  }
  return {
    footer: json.branding?.footer ?? 'default',
    coachName: json.branding?.coachName,
    footerText: json.footerText ?? 'Entrenamiento completado con FitGen',
  } satisfies ShareBranding;
}
