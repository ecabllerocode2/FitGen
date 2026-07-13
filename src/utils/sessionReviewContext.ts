const STORAGE_PREFIX = 'fitgen-session-reviewed';

function storageKey(sessionId: string): string {
  return `${STORAGE_PREFIX}:${sessionId}`;
}

/** Marca que el usuario ya revisó o inició esta sesión (evita forzar overview de nuevo). */
export function markSessionReviewed(sessionId: string): void {
  if (!sessionId) return;
  try {
    localStorage.setItem(storageKey(sessionId), new Date().toISOString());
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasSessionBeenReviewed(sessionId: string): boolean {
  if (!sessionId) return false;
  try {
    return Boolean(localStorage.getItem(storageKey(sessionId)));
  } catch {
    return false;
  }
}
