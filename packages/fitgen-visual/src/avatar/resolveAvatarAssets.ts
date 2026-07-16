import type { AvatarAppearance, AvatarConfig, AvatarGender, HairStyleId, PhysiqueTier } from '../types';

/** Highest physique tier with a dedicated asset on disk. Increase as art is added. */
export const AVAILABLE_PHYSIQUE_TIERS: PhysiqueTier = 0;

/**
 * Set true when Blender layer PNGs exist under `{gender}/tier-{n}/`.
 * While false, uses composite `{gender}/tier-{n}.png` (single file).
 */
export const AVATAR_USE_LAYER_STACK = false;

const AVATAR_BASE = '/assets/avatar';

const LAYER_ORDER = ['pedestal', 'body', 'shorts', 'shirt', 'head', 'hair', 'accessories'] as const;

export type AvatarLayerKey = (typeof LAYER_ORDER)[number];

export type AvatarLayerStackItem = {
  key: AvatarLayerKey | `hair-${HairStyleId}`;
  src: string;
};

export type AvatarPresentation =
  | { kind: 'composite'; src: string; prestige: boolean }
  | { kind: 'layers'; layers: AvatarLayerStackItem[]; prestige: boolean };

export function resolvePhysiqueTierAsset(tier: PhysiqueTier): PhysiqueTier {
  return Math.min(tier, AVAILABLE_PHYSIQUE_TIERS) as PhysiqueTier;
}

export function resolveAvatarBodySrc(gender: AvatarGender, tier: PhysiqueTier): string {
  const effectiveTier = resolvePhysiqueTierAsset(tier);
  return `${AVATAR_BASE}/${gender}/tier-${effectiveTier}.png`;
}

function resolveHairLayerFile(hairStyle: HairStyleId): string | null {
  if (hairStyle === 'bald') return null;
  return `hair-${hairStyle}.png`;
}

/** Ordered layer paths for Blender exports (bottom → top). */
export function resolveAvatarLayerStack(
  gender: AvatarGender,
  tier: PhysiqueTier,
  appearance: AvatarAppearance,
): AvatarLayerStackItem[] {
  const effectiveTier = resolvePhysiqueTierAsset(tier);
  const base = `${AVATAR_BASE}/${gender}/tier-${effectiveTier}`;

  const items: AvatarLayerStackItem[] = [
    { key: 'pedestal', src: `${base}/pedestal.png` },
    { key: 'body', src: `${base}/body.png` },
    { key: 'shorts', src: `${base}/shorts.png` },
    { key: 'shirt', src: `${base}/shirt.png` },
    { key: 'head', src: `${base}/head.png` },
  ];

  const hairFile = resolveHairLayerFile(appearance.hairStyle);
  if (hairFile) {
    items.push({
      key: `hair-${appearance.hairStyle}`,
      src: `${base}/${hairFile}`,
    });
  }

  items.push({ key: 'accessories', src: `${base}/accessories.png` });
  return items;
}

export function resolveAvatarPresentation(config: AvatarConfig): AvatarPresentation {
  const gender = config.appearance.gender ?? 'male';
  const prestige = (config.baseStage ?? 0) > 0;

  if (AVATAR_USE_LAYER_STACK) {
    return {
      kind: 'layers',
      layers: resolveAvatarLayerStack(gender, config.physiqueTier, config.appearance),
      prestige,
    };
  }

  return {
    kind: 'composite',
    src: resolveAvatarBodySrc(gender, config.physiqueTier),
    prestige,
  };
}

/** @deprecated Use resolveAvatarPresentation */
export function resolveAvatarLayers(config: AvatarConfig): { bodySrc: string; prestige: boolean } {
  const presentation = resolveAvatarPresentation(config);
  if (presentation.kind === 'layers') {
    return { bodySrc: presentation.layers[presentation.layers.length - 1]?.src ?? '', prestige: presentation.prestige };
  }
  return { bodySrc: presentation.src, prestige: presentation.prestige };
}

export const GENDER_OPTIONS = [
  { id: 'male' as const, label: 'Hombre' },
  { id: 'female' as const, label: 'Mujer' },
];

export const BLENDER_LAYER_EXPORT_ORDER: readonly { file: string; collection: string }[] = [
  { file: 'pedestal.png', collection: 'pedestal' },
  { file: 'body.png', collection: 'body' },
  { file: 'shorts.png', collection: 'shorts-default' },
  { file: 'shirt.png', collection: 'shirt-default' },
  { file: 'head.png', collection: 'head' },
  { file: 'hair-short.png', collection: 'hair-short' },
  { file: 'accessories.png', collection: 'accessories' },
];
