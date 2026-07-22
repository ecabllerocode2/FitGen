import type { AvatarProgressStage } from '../types';

/** Session thresholds for avatar evolution (5 stages: 0–4). */
export const AVATAR_STAGE_THRESHOLDS = [0, 8, 20, 40, 70] as const;

export const AVATAR_STAGE_LABELS: Record<AvatarProgressStage, string> = {
  0: 'Punto de partida',
  1: 'Primeros cambios',
  2: 'Progreso visible',
  3: 'En forma',
  4: 'Meta fitness',
};

export const AVATAR_STAGE_DESCRIPTIONS: Record<AvatarProgressStage, string> = {
  0: 'Tu cuerpo actual — la base de tu transformación',
  1: 'Empiezas a notar cambios con constancia',
  2: 'Más definición y mejor postura',
  3: 'Cerca de tu mejor versión',
  4: 'Tu avatar refleja tu dedicación',
};

export function computeAvatarProgressStage(completedSessions: number): AvatarProgressStage {
  let stage: AvatarProgressStage = 0;
  for (let i = AVATAR_STAGE_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (completedSessions >= AVATAR_STAGE_THRESHOLDS[i]) {
      stage = i as AvatarProgressStage;
      break;
    }
  }
  return stage;
}

export function sessionsUntilNextAvatarStage(completedSessions: number): number | null {
  const stage = computeAvatarProgressStage(completedSessions);
  if (stage >= 4) return null;
  const nextThreshold = AVATAR_STAGE_THRESHOLDS[stage + 1];
  return Math.max(0, nextThreshold - completedSessions);
}

export function nextAvatarStageThreshold(completedSessions: number): number | null {
  const stage = computeAvatarProgressStage(completedSessions);
  if (stage >= 4) return null;
  return AVATAR_STAGE_THRESHOLDS[stage + 1];
}

/** @deprecated Use computeAvatarProgressStage */
export const PHYSIQUE_THRESHOLDS = AVATAR_STAGE_THRESHOLDS;
/** @deprecated Use AVATAR_STAGE_LABELS */
export const PHYSIQUE_TIER_LABELS = AVATAR_STAGE_LABELS;
/** @deprecated Use computeAvatarProgressStage */
export const computePhysiqueTier = computeAvatarProgressStage;
