export type {
  AvatarAppearance,
  AvatarBodyBuild,
  AvatarConfig,
  AvatarGender,
  AvatarProgressStage,
  AvatarStartingBuild,
  FitCoinVariant,
  PhysiqueTier,
} from './types';

export { AVATAR_STARTING_BUILDS } from './types';
/** @deprecated Use AVATAR_STARTING_BUILDS */
export { AVATAR_STARTING_BUILDS as AVATAR_BODY_BUILDS } from './types';

export { default as FitCoin, FitCoinSvg } from './fitcoin/FitCoin';
export { default as AvatarDisplay } from './avatar/AvatarDisplay';
export { default as AvatarPreview } from './avatar/AvatarPreview';
export {
  resolveAvatarBodySrc,
  resolveAvatarStartingBuild,
  resolveAvatarPresentation,
  resolvePhysiqueTierAsset,
  AVAILABLE_AVATAR_STAGES,
  AVAILABLE_PHYSIQUE_TIERS,
  DEFAULT_STARTING_BUILD,
  DEFAULT_BODY_BUILD,
  GENDER_OPTIONS,
  STARTING_BUILD_OPTIONS,
  BODY_BUILD_OPTIONS,
  resolveAvatarBodyBuild,
} from './avatar/resolveAvatarAssets';
export {
  computeAvatarProgressStage,
  computePhysiqueTier,
  sessionsUntilNextAvatarStage,
  nextAvatarStageThreshold,
  AVATAR_STAGE_THRESHOLDS,
  AVATAR_STAGE_LABELS,
  AVATAR_STAGE_DESCRIPTIONS,
  PHYSIQUE_THRESHOLDS,
  PHYSIQUE_TIER_LABELS,
} from './avatar/physique';
