const ONBOARDING_FLOW_KEY = 'fitgen_onboarding_flow';
const ONBOARDING_DATA_KEY = 'fitgen_onboarding_flow_data';
const ONBOARDING_MESO_KEY = 'fitgen_onboarding_pending_meso';

export type StoredOnboardingPhase = 'saving' | 'generating' | 'preview';

export interface OnboardingFlowData {
  phase: StoredOnboardingPhase;
  startedAt: number;
  loaderSequenceDone?: boolean;
}

export function isOnboardingFlowActive(): boolean {
  try {
    return sessionStorage.getItem(ONBOARDING_FLOW_KEY) === '1';
  } catch {
    return false;
  }
}

export function readOnboardingFlowData(): OnboardingFlowData | null {
  if (!isOnboardingFlowActive()) return null;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_DATA_KEY);
    if (!raw) {
      return { phase: 'saving', startedAt: Date.now() };
    }
    return JSON.parse(raw) as OnboardingFlowData;
  } catch {
    return { phase: 'saving', startedAt: Date.now() };
  }
}

export function writeOnboardingFlowData(patch: Partial<OnboardingFlowData>): void {
  if (!isOnboardingFlowActive()) return;
  try {
    const prev = readOnboardingFlowData() ?? { phase: 'saving', startedAt: Date.now() };
    sessionStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {
    /* ignore */
  }
}

export function readPendingMesocycle<T = unknown>(): T | null {
  if (!isOnboardingFlowActive()) return null;
  try {
    const raw = sessionStorage.getItem(ONBOARDING_MESO_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writePendingMesocycle(mesocycle: unknown): void {
  if (!isOnboardingFlowActive()) return;
  try {
    sessionStorage.setItem(ONBOARDING_MESO_KEY, JSON.stringify(mesocycle));
  } catch {
    /* ignore */
  }
}

export function clearPendingMesocycle(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_MESO_KEY);
  } catch {
    /* ignore */
  }
}

export function clearOnboardingFlowStorage(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_DATA_KEY);
    sessionStorage.removeItem(ONBOARDING_MESO_KEY);
  } catch {
    /* ignore */
  }
}

export function startOnboardingFlowLock(phase: StoredOnboardingPhase = 'saving'): void {
  try {
    const alreadyActive = sessionStorage.getItem(ONBOARDING_FLOW_KEY) === '1';
    const existing = alreadyActive ? readOnboardingFlowData() : null;

    sessionStorage.setItem(ONBOARDING_FLOW_KEY, '1');
    sessionStorage.setItem(
      ONBOARDING_DATA_KEY,
      JSON.stringify({
        phase: existing?.phase ?? phase,
        startedAt: existing?.startedAt ?? Date.now(),
        loaderSequenceDone: existing?.loaderSequenceDone ?? false,
      }),
    );
    if (!alreadyActive) {
      sessionStorage.removeItem(ONBOARDING_MESO_KEY);
    }
    window.dispatchEvent(new Event('fitgen-onboarding-flow'));
  } catch {
    /* ignore */
  }
}

export function endOnboardingFlowLock(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
    clearOnboardingFlowStorage();
    window.dispatchEvent(new Event('fitgen-onboarding-flow'));
  } catch {
    /* ignore */
  }
}

export function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
