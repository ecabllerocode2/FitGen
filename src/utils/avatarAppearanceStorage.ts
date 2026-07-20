import type { AvatarAppearance, AvatarGender } from '@fitgen/visual';

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

function loadStoredGenderOverride(userId?: string): AvatarGender | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { genderOverride?: AvatarGender | null };
    return parsed.genderOverride === 'female' ? 'female' : parsed.genderOverride === 'male' ? 'male' : null;
  } catch {
    return null;
  }
}

/** Resolves avatar gender from profile (static PNG per gender/tier). */
export function resolveAvatarAppearance(
  profileGender?: string | null,
  userId?: string,
): AvatarAppearance {
  const fromProfile = profileGenderToAvatarGender(profileGender);
  const override = loadStoredGenderOverride(userId);
  return { gender: override ?? (profileGender ? fromProfile : 'male') };
}

export function saveAvatarGenderOverride(gender: AvatarGender, userId?: string): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify({ genderOverride: gender }));
  } catch {
    // ignore quota / private mode
  }
}

export function clearAvatarGenderOverride(userId?: string): void {
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
