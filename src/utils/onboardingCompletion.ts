import type { MesocycleGenerationProfile } from './splitGenerationContext';
import { isOnboardingFlowActive } from './onboardingFlowLock';

const COMPLETION_KEY = 'fitgen_onboarding_completion';

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

export function readOnboardingCompletion(): OnboardingCompletionState | null {
  if (!isOnboardingFlowActive()) return null;
  try {
    const raw = sessionStorage.getItem(COMPLETION_KEY);
    return raw ? (JSON.parse(raw) as OnboardingCompletionState) : null;
  } catch {
    return null;
  }
}

export function writeOnboardingCompletion(state: OnboardingCompletionState): void {
  try {
    sessionStorage.setItem(COMPLETION_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('fitgen-onboarding-flow'));
  } catch {
    /* ignore */
  }
}

export function patchOnboardingCompletion(patch: Partial<OnboardingCompletionState>): void {
  const prev = readOnboardingCompletion();
  if (!prev) return;
  writeOnboardingCompletion({ ...prev, ...patch });
}

export function clearOnboardingCompletionStorage(): void {
  try {
    sessionStorage.removeItem(COMPLETION_KEY);
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
