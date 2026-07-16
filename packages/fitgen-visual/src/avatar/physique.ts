import type { PhysiqueTier } from '../types';

/** Session thresholds for physique morph (roadmap Fase 5–6). */
export const PHYSIQUE_THRESHOLDS = [0, 5, 15, 30, 50, 100, 200, 365] as const;

export const PHYSIQUE_TIER_LABELS: Record<PhysiqueTier, string> = {
  0: 'Principiante',
  1: 'Activo',
  2: 'Constante',
  3: 'Comprometido',
  4: 'Atleta',
  5: 'Veterano',
  6: 'Élite',
  7: 'Leyenda',
};

export function computePhysiqueTier(completedSessions: number): PhysiqueTier {
  let tier: PhysiqueTier = 0;
  for (let i = PHYSIQUE_THRESHOLDS.length - 1; i >= 0; i -= 1) {
    if (completedSessions >= PHYSIQUE_THRESHOLDS[i]) {
      tier = i as PhysiqueTier;
      break;
    }
  }
  return tier;
}

/** Morph multipliers per tier — subtle Zdog scale/stroke changes. */
export function physiqueMorph(tier: PhysiqueTier) {
  const t = Math.min(tier, 7);
  return {
    shoulderScale: 1 + t * 0.04,
    armStroke: 6 + t * 0.8,
    chestScale: 1 + t * 0.035,
    torsoHeight: 28 + t * 1.2,
  };
}
