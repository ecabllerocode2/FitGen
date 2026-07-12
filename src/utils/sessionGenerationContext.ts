/** Minimum time the session-generation overlay stays visible (shorter than mesocycle loader). */
export const SESSION_GENERATION_STEP_MS = 2600;
export const MIN_SESSION_GENERATION_DISPLAY_MS = 9500;

export const SESSION_GENERATION_STEPS = [
  'Interpretando tu readiness de hoy',
  'Seleccionando ejercicios del mesociclo',
  'Calculando series, RIR y cargas',
  'Diseñando calentamiento RAMP específico',
] as const;

export function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
