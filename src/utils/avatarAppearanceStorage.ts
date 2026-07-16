import type { AvatarAppearance, AvatarGender } from '@fitgen/visual';

const STORAGE_KEY_PREFIX = 'fitgen.avatar.appearance';

const DEFAULT_APPEARANCE: AvatarAppearance = {
  gender: 'male',
  skinTone: 'medium',
  hairStyle: 'short',
  eyeColor: 'brown',
};

type StoredAppearance = AvatarAppearance & {
  /** When set, overrides profile gender (arena customizer). */
  genderOverride?: AvatarGender | null;
};

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

function loadStoredAppearance(userId?: string): StoredAppearance {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_APPEARANCE };
    const parsed = JSON.parse(raw) as Partial<StoredAppearance>;
    return {
      ...DEFAULT_APPEARANCE,
      ...parsed,
      gender: parsed.gender === 'female' ? 'female' : 'male',
    };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

/**
 * Resolves avatar appearance for the current user.
 * Profile gender drives the base character unless the user picked an override in the arena.
 */
export function resolveAvatarAppearance(
  profileGender?: string | null,
  userId?: string,
): AvatarAppearance {
  const stored = loadStoredAppearance(userId);
  const fromProfile = profileGenderToAvatarGender(profileGender);
  const gender = stored.genderOverride ?? (profileGender ? fromProfile : stored.gender);

  return {
    gender,
    skinTone: stored.skinTone,
    hairStyle: stored.hairStyle,
    eyeColor: stored.eyeColor,
    skinId: stored.skinId,
  };
}

/** @deprecated Prefer resolveAvatarAppearance(profileGender, userId) */
export function loadAvatarAppearance(): AvatarAppearance {
  return { ...DEFAULT_APPEARANCE };
}

export function saveAvatarAppearance(
  appearance: AvatarAppearance,
  options?: { userId?: string; genderOverride?: AvatarGender | null },
): void {
  const payload: StoredAppearance = {
    ...appearance,
    genderOverride: options?.genderOverride ?? null,
  };
  try {
    localStorage.setItem(storageKey(options?.userId), JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
}

export function saveAvatarGenderOverride(
  gender: AvatarGender,
  userId?: string,
): void {
  const current = resolveAvatarAppearance(undefined, userId);
  saveAvatarAppearance(
    { ...current, gender },
    { userId, genderOverride: gender },
  );
}

export function clearAvatarGenderOverride(userId?: string): void {
  const stored = loadStoredAppearance(userId);
  const { genderOverride: _, ...rest } = stored;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(rest));
  } catch {
    // ignore
  }
}
