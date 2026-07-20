import type { AvatarConfig, AvatarGender, PhysiqueTier } from '../types';

/** Highest physique tier with a dedicated asset on disk. Increase as art is added. */
export const AVAILABLE_PHYSIQUE_TIERS: PhysiqueTier = 0;

const AVATAR_BASE = '/assets/avatar';

export function resolvePhysiqueTierAsset(tier: PhysiqueTier): PhysiqueTier {
  return Math.min(tier, AVAILABLE_PHYSIQUE_TIERS) as PhysiqueTier;
}

export function resolveAvatarBodySrc(gender: AvatarGender, tier: PhysiqueTier): string {
  const effectiveTier = resolvePhysiqueTierAsset(tier);
  return `${AVATAR_BASE}/${gender}/tier-${effectiveTier}.png`;
}

export function resolveAvatarPresentation(config: AvatarConfig) {
  const gender = config.appearance.gender ?? 'male';
  const prestige = (config.baseStage ?? 0) > 0;

  return {
    src: resolveAvatarBodySrc(gender, config.physiqueTier),
    prestige,
  };
}

export const GENDER_OPTIONS = [
  { id: 'male' as const, label: 'Hombre' },
  { id: 'female' as const, label: 'Mujer' },
];
