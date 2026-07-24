/**
 * Configuración central para URLs de API y endpoints
 * Se encarga de manejar las diferentes URLs según el entorno
 */

/**
 * URL base del backend según el entorno
 * - Desarrollo: http://localhost:3000
 * - Producción: URL definida en variables de entorno
 */
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

/** Optional — bypass Vercel Deployment Protection on preview backend (Settings → Deployment Protection). */
const VERCEL_PROTECTION_BYPASS = import.meta.env.VITE_VERCEL_PROTECTION_BYPASS as
  | string
  | undefined;

function protectionBypassHeaders(): Record<string, string> {
  if (!VERCEL_PROTECTION_BYPASS) return {};
  return {
    'x-vercel-protection-bypass': VERCEL_PROTECTION_BYPASS,
    'x-vercel-set-bypass-cookie': 'true',
  };
}

// Log de debug para verificar la configuración
console.log('🔧 API Configuration:', {
  mode: import.meta.env.MODE,
  backendUrl: API_BASE_URL,
  env: import.meta.env.VITE_BACKEND_URL,
  hasProtectionBypass: Boolean(VERCEL_PROTECTION_BYPASS),
});

/**
 * Endpoints de la API centralizados
 */
export const API_ENDPOINTS = {
  // Sesiones - V2 es el endpoint principal
  SESSION_GENERATE: `${API_BASE_URL}/api/session/generateV2`, // Cambiado a V2 por defecto
  SESSION_GENERATE_V2: `${API_BASE_URL}/api/session/generateV2`,
  SESSION_COMPLETE: `${API_BASE_URL}/api/session/complete`,
  SESSION_CELEBRATION_CARD: `${API_BASE_URL}/api/session/celebration-card`,
  SESSION_CELEBRATIONS: `${API_BASE_URL}/api/session/celebrations`,
  SESSION_HISTORY: `${API_BASE_URL}/api/session/history`,
  SESSION_DISCARD_STALE: `${API_BASE_URL}/api/session/discard-stale`,
  SESSION_SWAP_EXERCISE: `${API_BASE_URL}/api/session/swap-exercise`,
  SESSION_SWAP_WARMUP: `${API_BASE_URL}/api/session/swap-warmup-exercise`,
  EXERCISE_PREFERENCES: `${API_BASE_URL}/api/profile/exercise-preferences`,
  
  // Mesociclos
  MESOCYCLE_GENERATE: `${API_BASE_URL}/api/mesocycle/generate`,
  MESOCYCLE_EVALUATE: `${API_BASE_URL}/api/mesocycle/evaluate`,

  BODY_METRICS_CHECKIN: `${API_BASE_URL}/api/body-metrics/checkin`,
  
  // Usuario
  USER_PROFILE: `${API_BASE_URL}/api/user/profile`,
  USER_PROFILE_SAVE: `${API_BASE_URL}/api/profile/save`,

  GAMIFICATION_SUMMARY: `${API_BASE_URL}/api/gamification/summary`,
  GAMIFICATION_LEADERBOARD: `${API_BASE_URL}/api/gamification/leaderboard`,
  GAMIFICATION_OPT_IN: `${API_BASE_URL}/api/gamification/opt-in-leaderboard`,
  GAMIFICATION_EQUIP: `${API_BASE_URL}/api/gamification/equip`,
  SHOP_CATALOG: `${API_BASE_URL}/api/shop/catalog`,
  SHOP_PURCHASE: `${API_BASE_URL}/api/shop/purchase`,
  SHOP_REDEEM_PREMIUM: `${API_BASE_URL}/api/shop/redeem-premium`,
  ADMIN_USERS_OVERVIEW: `${API_BASE_URL}/api/admin/users-overview`,
  ADMIN_USER_DETAIL: `${API_BASE_URL}/api/admin/user-detail`,
  ADMIN_COACH_SET_PLAN: `${API_BASE_URL}/api/admin/coach-set-plan`,

  // Coach platform
  COACH_REGISTER: `${API_BASE_URL}/api/coach/register`,
  COACH_ME: `${API_BASE_URL}/api/coach/me`,
  COACH_INVITES: `${API_BASE_URL}/api/coach/invites`,
  COACH_CLIENTS: `${API_BASE_URL}/api/coach/clients`,
  ATHLETE_SHARE_BRANDING: `${API_BASE_URL}/api/athlete/share-branding`,
  
  // Otros endpoints que puedas necesitar
  ANALYTICS: `${API_BASE_URL}/api/analytics`,
} as const;

/**
 * Helper para crear headers de autenticación
 */
export const createAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  ...protectionBypassHeaders(),
});

/**
 * Helper para realizar peticiones autenticadas
 */
export const authenticatedFetch = async (
  endpoint: string,
  token: string,
  options: RequestInit = {},
) => {
  const mergedHeaders = {
    ...createAuthHeaders(token),
    ...(options.headers as Record<string, string> | undefined),
  };

  return fetch(endpoint, {
    ...options,
    headers: mergedHeaders,
  });
};

const NETWORK_ERROR_RE =
  /load failed|failed to fetch|networkerror|network request failed|fetch failed|the internet connection appears to be offline/i;

export function isNetworkFetchError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  if (err.name === 'TypeError') return true;
  return NETWORK_ERROR_RE.test(err.message);
}

export function humanizeFetchError(err: unknown, fallback: string): string {
  if (isNetworkFetchError(err)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

/**
 * Authenticated fetch with retries for transient iOS Safari network failures
 * ("Load failed" / TypeError). Does not retry HTTP 4xx/5xx responses.
 */
export async function authenticatedFetchWithRetry(
  endpoint: string,
  token: string,
  options: RequestInit = {},
  retries = 3,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await authenticatedFetch(endpoint, token, options);
    } catch (err) {
      lastError = err;
      if (!isNetworkFetchError(err) || attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

/**
 * Información del entorno actual
 */
export const ENV_INFO = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  currentBackendUrl: API_BASE_URL,
} as const;