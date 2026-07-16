export type {
  AvatarAppearance,
  AvatarConfig,
  AvatarGender,
  AvatarLayer,
  AvatarLayerId,
  EyeColorId,
  FitCoinVariant,
  HairStyleId,
  PhysiqueTier,
  SkinToneId,
} from './types';

export { default as FitCoin, FitCoinSvg, FitCoinZdogCanvas } from './fitcoin/FitCoin';
export { default as AvatarDisplay } from './avatar/AvatarDisplay';
export { default as AvatarPreview } from './avatar/AvatarPreview';
export {
  resolveAvatarBodySrc,
  resolveAvatarLayerStack,
  resolveAvatarPresentation,
  resolveAvatarLayers,
  resolvePhysiqueTierAsset,
  AVAILABLE_PHYSIQUE_TIERS,
  AVATAR_USE_LAYER_STACK,
  BLENDER_LAYER_EXPORT_ORDER,
} from './avatar/resolveAvatarAssets';
export {
  computePhysiqueTier,
  physiqueMorph,
  PHYSIQUE_THRESHOLDS,
  PHYSIQUE_TIER_LABELS,
} from './avatar/physique';
export {
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  GENDER_OPTIONS,
  SKIN_TONE_OPTIONS,
  HAIR_STYLE_OPTIONS,
  EYE_COLOR_OPTIONS,
} from './avatar/tokens';
