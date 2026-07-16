import type { EyeColorId, HairStyleId, SkinToneId, AvatarGender } from '../types';

export const GENDER_OPTIONS: { id: AvatarGender; label: string }[] = [
  { id: 'male', label: 'Hombre' },
  { id: 'female', label: 'Mujer' },
];

export const SKIN_TONES: Record<SkinToneId, string> = {
  light: '#F5D0B5',
  medium: '#E8B796',
  tan: '#C68642',
  brown: '#8D5524',
  dark: '#4A2912',
};

export const HAIR_COLORS: Record<HairStyleId, string> = {
  short: '#3D2314',
  medium: '#2C1810',
  long: '#1A0F0A',
  buzz: '#4A4A4A',
  bald: 'transparent',
};

export const EYE_COLORS: Record<EyeColorId, string> = {
  brown: '#5C4033',
  blue: '#4A90D9',
  green: '#3D8B5A',
  hazel: '#8B7355',
};

export const SKIN_TONE_OPTIONS: { id: SkinToneId; label: string }[] = [
  { id: 'light', label: 'Claro' },
  { id: 'medium', label: 'Medio' },
  { id: 'tan', label: 'Bronceado' },
  { id: 'brown', label: 'Moreno' },
  { id: 'dark', label: 'Oscuro' },
];

export const HAIR_STYLE_OPTIONS: { id: HairStyleId; label: string }[] = [
  { id: 'short', label: 'Corto' },
  { id: 'medium', label: 'Medio' },
  { id: 'long', label: 'Largo' },
  { id: 'buzz', label: 'Rapado' },
  { id: 'bald', label: 'Calvo' },
];

export const EYE_COLOR_OPTIONS: { id: EyeColorId; label: string }[] = [
  { id: 'brown', label: 'Café' },
  { id: 'blue', label: 'Azul' },
  { id: 'green', label: 'Verde' },
  { id: 'hazel', label: 'Avellana' },
];
