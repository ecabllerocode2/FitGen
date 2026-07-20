export type AvatarGender = 'male' | 'female';

export type AvatarAppearance = {
  gender: AvatarGender;
};

export type PhysiqueTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AvatarConfig = {
  appearance: AvatarAppearance;
  /** Derived from completed sessions; drives which static tier image is shown. */
  physiqueTier: PhysiqueTier;
  /** Prestige from perfect weeks (roadmap baseStage). */
  baseStage?: number;
};

export type FitCoinVariant = 'ui' | 'hero';
