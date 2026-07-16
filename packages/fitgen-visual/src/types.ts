export type AvatarGender = 'male' | 'female';
export type SkinToneId = 'light' | 'medium' | 'tan' | 'brown' | 'dark';
export type HairStyleId = 'short' | 'medium' | 'long' | 'buzz' | 'bald';
export type EyeColorId = 'brown' | 'blue' | 'green' | 'hazel';

export type AvatarAppearance = {
  gender: AvatarGender;
  skinTone: SkinToneId;
  hairStyle: HairStyleId;
  eyeColor: EyeColorId;
  /** Cosmetic skin id from shop (future). */
  skinId?: string | null;
};

export type PhysiqueTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AvatarConfig = {
  appearance: AvatarAppearance;
  /** Derived from completed sessions; drives body morph. */
  physiqueTier: PhysiqueTier;
  /** Prestige from perfect weeks (roadmap baseStage). */
  baseStage?: number;
};

export type FitCoinVariant = 'ui' | 'hero';

export type AvatarLayerId =
  | 'pedestal'
  | 'body'
  | 'outfit'
  | 'hair'
  | 'accessories'
  | 'prestige';

export type AvatarLayer = {
  id: AvatarLayerId;
  src: string;
  alt?: string;
};
