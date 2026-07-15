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

// Log de debug para verificar la configuración
console.log('🔧 API Configuration:', {
  mode: import.meta.env.MODE,
  backendUrl: API_BASE_URL,
  env: import.meta.env.VITE_BACKEND_URL
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
  
  // Usuario
  USER_PROFILE: `${API_BASE_URL}/api/user/profile`,
  USER_PROFILE_SAVE: `${API_BASE_URL}/api/profile/save`,
  
  // Otros endpoints que puedas necesitar
  ANALYTICS: `${API_BASE_URL}/api/analytics`,
} as const;

/**
 * Helper para crear headers de autenticación
 */
export const createAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

/**
 * Helper para realizar peticiones autenticadas
 */
export const authenticatedFetch = async (
  endpoint: string, 
  token: string, 
  options: RequestInit = {}
) => {
  return fetch(endpoint, {
    ...options,
    headers: {
      ...createAuthHeaders(token),
      ...options.headers,
    },
  });
};

/**
 * Información del entorno actual
 */
export const ENV_INFO = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  currentBackendUrl: API_BASE_URL,
} as const;