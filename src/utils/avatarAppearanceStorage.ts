import type { AvatarAppearance, AvatarGender, AvatarStartingBuild } from '@fitgen/visual';
import { DEFAULT_STARTING_BUILD } from '@fitgen/visual';

const STORAGE_KEY_PREFIX = 'fitgen.avatar.appearance';

function storageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY_PREFIX}.${userId}` : STORAGE_KEY_PREFIX;
}

export function profileGenderToAvatarGender(gender?: string | null): AvatarGender {
  if (!gender) return 'male';
  const normalized = gender.trim().toLowerCase();
  if (normalized === 'femenino' || normalized === 'f' || normalized === 'female') {
    return 'female';
  }
  if (normalized === 'masculino' || normalized === 'm' || normalized === 'male') {
    return 'male';
  }
  return 'male';
}

const LEGACY_BODY_BUILD_MAP: Record<string, AvatarStartingBuild> = {
  robust: 'soft',
  athletic: 'slender',
  lean: 'ectomorph',
};

type StoredAppearance = {
  genderOverride?: AvatarGender | null;
  startingBuild?: AvatarStartingBuild;
  /** @deprecated migrated to startingBuild */
  bodyBuild?: string;
};

function loadStored(userId?: string): StoredAppearance {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as StoredAppearance;
  } catch {
    return {};
  }
}

function resolveExplicitStartingBuild(
  stored: StoredAppearance,
  profileStartingBuild?: AvatarStartingBuild | null,
): AvatarStartingBuild | undefined {
  if (stored.startingBuild) return stored.startingBuild;
  if (stored.bodyBuild && LEGACY_BODY_BUILD_MAP[stored.bodyBuild]) {
    return LEGACY_BODY_BUILD_MAP[stored.bodyBuild];
  }
  if (profileStartingBuild) return profileStartingBuild;
  return undefined;
}

/** Resolves avatar gender and optional starting build (only when user has chosen). */
export function resolveAvatarAppearance(
  profileGender?: string | null,
  userId?: string,
  profileStartingBuild?: AvatarStartingBuild | null,
): AvatarAppearance {
  const stored = loadStored(userId);
  const fromProfile = profileGenderToAvatarGender(profileGender);
  const gender = stored.genderOverride ?? (profileGender ? fromProfile : 'male');
  const startingBuild = resolveExplicitStartingBuild(stored, profileStartingBuild);

  return startingBuild ? { gender, startingBuild } : { gender };
}

/** Build used for rendering — falls back to default when user has not chosen yet. */
export function resolveAvatarStartingBuildForDisplay(
  _profileGender?: string | null,
  userId?: string,
  profileStartingBuild?: AvatarStartingBuild | null,
): AvatarStartingBuild {
  const stored = loadStored(userId);
  return resolveExplicitStartingBuild(stored, profileStartingBuild) ?? DEFAULT_STARTING_BUILD;
}

export function saveAvatarStartingBuild(
  startingBuild: AvatarStartingBuild,
  userId?: string,
): void {
  const stored = loadStored(userId);
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify({ ...stored, startingBuild, bodyBuild: undefined }),
    );
  } catch {
    // ignore
  }
}

/** @deprecated Use saveAvatarStartingBuild */
export const saveAvatarBodyBuild = saveAvatarStartingBuild;

export function saveAvatarGenderOverride(gender: AvatarGender, userId?: string): void {
  const stored = loadStored(userId);
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ ...stored, genderOverride: gender }));
  } catch {
    // ignore
  }
}

export function clearAvatarGenderOverride(userId?: string): void {
  const stored = loadStored(userId);
  const { genderOverride: _, ...rest } = stored;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(rest));
  } catch {
    // ignore
  }
}

export function hasAvatarStartingBuildChosen(
  profileStartingBuild?: AvatarStartingBuild | null,
  userId?: string,
): boolean {
  const stored = loadStored(userId);
  return Boolean(resolveExplicitStartingBuild(stored, profileStartingBuild));
}
