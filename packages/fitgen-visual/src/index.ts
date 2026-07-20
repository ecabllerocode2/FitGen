export type {
  AvatarAppearance,
  AvatarConfig,
  AvatarGender,
  FitCoinVariant,
  PhysiqueTier,
} from './types';

export { default as FitCoin, FitCoinSvg } from './fitcoin/FitCoin';
export { default as AvatarDisplay } from './avatar/AvatarDisplay';
export { default as AvatarPreview } from './avatar/AvatarPreview';
export {
  resolveAvatarBodySrc,
  resolveAvatarPresentation,
  resolvePhysiqueTierAsset,
  AVAILABLE_PHYSIQUE_TIERS,
  GENDER_OPTIONS,
} from './avatar/resolveAvatarAssets';
export {
  computePhysiqueTier,
  physiqueMorph,
  PHYSIQUE_THRESHOLDS,
  PHYSIQUE_TIER_LABELS,
} from './avatar/physique';
