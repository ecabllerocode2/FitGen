import type {
  AvatarConfig,
  AvatarGender,
  AvatarProgressStage,
  AvatarStartingBuild,
} from '../types';
import { AVAILABLE_AVATAR_STAGES, resolvePhysiqueTierAsset } from './stageAssets';

export { AVAILABLE_AVATAR_STAGES, resolvePhysiqueTierAsset };
/** @deprecated Use AVAILABLE_AVATAR_STAGES */
export const AVAILABLE_PHYSIQUE_TIERS = AVAILABLE_AVATAR_STAGES;

const AVATAR_BASE = '/assets/avatar';

export const DEFAULT_STARTING_BUILD: AvatarStartingBuild = 'slender';

export function resolveAvatarStartingBuild(
  appearance: AvatarConfig['appearance'],
): AvatarStartingBuild {
  return appearance.startingBuild ?? DEFAULT_STARTING_BUILD;
}

export function resolveAvatarBodySrc(
  gender: AvatarGender,
  progressStage: AvatarProgressStage,
  startingBuild: AvatarStartingBuild = DEFAULT_STARTING_BUILD,
): string {
  const effectiveStage = resolvePhysiqueTierAsset(progressStage);
  return `${AVATAR_BASE}/${gender}/${startingBuild}/stage-${effectiveStage}.png`;
}

export function resolveAvatarPresentation(config: AvatarConfig) {
  const gender = config.appearance.gender ?? 'male';
  const startingBuild = resolveAvatarStartingBuild(config.appearance);
  const prestige = (config.baseStage ?? 0) > 0;

  return {
    src: resolveAvatarBodySrc(gender, config.progressStage, startingBuild),
    prestige,
    startingBuild,
  };
}

export const GENDER_OPTIONS = [
  { id: 'male' as const, label: 'Hombre' },
  { id: 'female' as const, label: 'Mujer' },
];

export const STARTING_BUILD_OPTIONS: {
  id: AvatarStartingBuild;
  label: string;
  description: string;
}[] = [
  {
    id: 'soft',
    label: 'Con más peso',
    description: 'Cuerpo más suave; tu avatar irá perdiendo grasa y ganando músculo poco a poco',
  },
  {
    id: 'slender',
    label: 'Delgado sin músculo',
    description: 'Base delgada; ganarás definición y volumen muscular con cada sesión',
  },
  {
    id: 'ectomorph',
    label: 'Muy delgado',
    description: 'Complexión muy flaca; el cambio será ganancia muscular gradual y visible',
  },
];

/** @deprecated Use STARTING_BUILD_OPTIONS */
export const BODY_BUILD_OPTIONS = STARTING_BUILD_OPTIONS;
/** @deprecated Use DEFAULT_STARTING_BUILD */
export const DEFAULT_BODY_BUILD = DEFAULT_STARTING_BUILD;
/** @deprecated Use resolveAvatarStartingBuild */
export const resolveAvatarBodyBuild = resolveAvatarStartingBuild;
