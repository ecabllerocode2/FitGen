import type { AvatarProgressStage } from '../types';

/** Highest progress stage with a dedicated asset on disk. Increase as art is added. */
export const AVAILABLE_AVATAR_STAGES: AvatarProgressStage = 4;

export function resolvePhysiqueTierAsset(stage: AvatarProgressStage): AvatarProgressStage {
  return Math.min(stage, AVAILABLE_AVATAR_STAGES) as AvatarProgressStage;
}

/** @deprecated Use AVAILABLE_AVATAR_STAGES */
export const AVAILABLE_PHYSIQUE_TIERS = AVAILABLE_AVATAR_STAGES;
