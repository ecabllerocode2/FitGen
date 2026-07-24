import type { MesocycleGenerationProfile } from './splitGenerationContext';
import { isOnboardingFlowActive } from './onboardingFlowLock';

const COMPLETION_KEY = 'fitgen_onboarding_completion';
/** localStorage backup — iOS Safari can drop sessionStorage under memory pressure. */
const COMPLETION_BACKUP_KEY = 'fitgen_onboarding_completion_backup';

export type CompletionPhase = 'saving' | 'generating' | 'preview';

export interface OnboardingCompletionState {
  phase: CompletionPhase;
  startedAt: number;
  generationProfile: MesocycleGenerationProfile;
  savePayload: Record<string, unknown>;
  profileSaved: boolean;
  saveInFlight?: boolean;
  mesocycleReady: boolean;
  loaderSequenceDone: boolean;
  generatedMesocycle?: unknown;
  error?: string;
}

function parseCompletion(raw: string | null): OnboardingCompletionState | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingCompletionState;
  } catch {
    return null;
  }
}

export function readOnboardingCompletion(): OnboardingCompletionState | null {
  if (!isOnboardingFlowActive()) return null;
  try {
    const fromSession = parseCompletion(sessionStorage.getItem(COMPLETION_KEY));
    if (fromSession) return fromSession;

    const fromBackup = parseCompletion(localStorage.getItem(COMPLETION_BACKUP_KEY));
    if (fromBackup) {
      try {
        sessionStorage.setItem(COMPLETION_KEY, JSON.stringify(fromBackup));
      } catch {
        /* ignore */
      }
      return fromBackup;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeOnboardingCompletion(state: OnboardingCompletionState): void {
  const raw = JSON.stringify(state);
  try {
    sessionStorage.setItem(COMPLETION_KEY, raw);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(COMPLETION_BACKUP_KEY, raw);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('fitgen-onboarding-flow'));
}

export function patchOnboardingCompletion(patch: Partial<OnboardingCompletionState>): void {
  const prev = readOnboardingCompletion();
  if (!prev) return;
  writeOnboardingCompletion({ ...prev, ...patch });
}

/** Clears error and unlocks the save/generate effect without wiping the payload. */
export function retryOnboardingCompletion(): void {
  const prev = readOnboardingCompletion();
  if (!prev) return;
  const { error: _removed, ...rest } = prev;
  writeOnboardingCompletion({
    ...rest,
    saveInFlight: false,
    phase: rest.profileSaved ? 'generating' : 'saving',
  });
}

export function clearOnboardingCompletionStorage(): void {
  try {
    sessionStorage.removeItem(COMPLETION_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(COMPLETION_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

export function beginOnboardingCompletion(
  generationProfile: MesocycleGenerationProfile,
  savePayload: Record<string, unknown>,
): void {
  clearOnboardingCompletionStorage();
  try {
    sessionStorage.removeItem('fitgen_onboarding_flow');
  } catch {
    /* ignore */
  }

  const state: OnboardingCompletionState = {
    phase: 'saving',
    startedAt: Date.now(),
    generationProfile,
    savePayload,
    profileSaved: false,
    saveInFlight: false,
    mesocycleReady: false,
    loaderSequenceDone: false,
  };

  writeOnboardingCompletion(state);
  try {
    sessionStorage.setItem('fitgen_onboarding_flow', '1');
    window.dispatchEvent(new Event('fitgen-onboarding-flow'));
  } catch {
    /* ignore */
  }
}

export function finishOnboardingCompletion(): void {
  clearOnboardingCompletionStorage();
  try {
    sessionStorage.removeItem('fitgen_onboarding_flow');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('fitgen-onboarding-flow'));
}
