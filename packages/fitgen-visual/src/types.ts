export type AvatarGender = 'male' | 'female';

/** Starting body the user picks (onboarding or GYM). */
export type AvatarStartingBuild = 'soft' | 'slender' | 'ectomorph';

/** @deprecated Use AvatarStartingBuild — kept for migration from localStorage. */
export type AvatarBodyBuild = 'lean' | 'athletic' | 'robust';

export type AvatarAppearance = {
  gender: AvatarGender;
  startingBuild?: AvatarStartingBuild;
};

/** Progress stage 0 (start) → 4 (peak fitness). Derived from completed sessions. */
export type AvatarProgressStage = 0 | 1 | 2 | 3 | 4;

/** @deprecated Use AvatarProgressStage */
export type PhysiqueTier = AvatarProgressStage;

export type AvatarConfig = {
  appearance: AvatarAppearance;
  /** Derived from completed sessions; drives stage image. */
  progressStage: AvatarProgressStage;
  /** Prestige from perfect weeks (roadmap baseStage). */
  baseStage?: number;
};

export type FitCoinVariant = 'ui' | 'hero';

export const AVATAR_STARTING_BUILDS: AvatarStartingBuild[] = ['soft', 'slender', 'ectomorph'];
