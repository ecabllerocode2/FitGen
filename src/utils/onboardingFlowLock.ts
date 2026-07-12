const ONBOARDING_FLOW_KEY = 'fitgen_onboarding_flow';

export function isOnboardingFlowActive(): boolean {
  try {
    return sessionStorage.getItem(ONBOARDING_FLOW_KEY) === '1';
  } catch {
    return false;
  }
}

export function startOnboardingFlowLock(): void {
  try {
    sessionStorage.setItem(ONBOARDING_FLOW_KEY, '1');
    window.dispatchEvent(new Event('fitgen-onboarding-flow'));
  } catch {
    /* ignore */
  }
}

export function endOnboardingFlowLock(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
    window.dispatchEvent(new Event('fitgen-onboarding-flow'));
  } catch {
    /* ignore */
  }
}

export function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
