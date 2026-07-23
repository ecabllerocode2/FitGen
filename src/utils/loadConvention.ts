import {
  formatUnitLabel,
  formatWeightNumber,
  toDisplayWeight,
  type WeightUnit,
} from './weightUnits';

export const LOAD_CONVENTIONS = {
  BARBELL_TOTAL: 'barbell_total',
  DUMBBELL_PER_HAND: 'dumbbell_per_hand',
  UNILATERAL: 'unilateral',
  MACHINE_STACK: 'machine_stack',
  BODYWEIGHT: 'bodyweight',
} as const;

export type LoadConvention = (typeof LOAD_CONVENTIONS)[keyof typeof LOAD_CONVENTIONS];

function normalizeEquipo(equipo: unknown): string[] {
  if (!equipo) return [];
  return (Array.isArray(equipo) ? equipo : [equipo])
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function inferConventionFromMetadata(exercise: Record<string, unknown>): LoadConvention | null {
  const nombre = String(exercise.exerciseName ?? exercise.nombre ?? exercise.name ?? '');
  const exerciseId = String(exercise.exerciseId ?? exercise.id ?? '');
  const haystack = `${nombre} ${exerciseId}`;

  if (/\b(unilateral|una mano|un brazo|single[-_ ]arm|one[-_ ]arm)\b/i.test(haystack)) {
    return LOAD_CONVENTIONS.UNILATERAL;
  }

  if (/\b(goblet|plie|plié)\b/i.test(haystack) && /mancuerna|dumbbell|kettlebell/i.test(haystack)) {
    return LOAD_CONVENTIONS.BARBELL_TOTAL;
  }

  if (/\bmancuernas\b|\bdumbbells\b/i.test(haystack) || /dumbbell_/i.test(exerciseId)) {
    return LOAD_CONVENTIONS.DUMBBELL_PER_HAND;
  }

  if (/\bmancuerna\b|\bdumbbell\b|\bkettlebell\b/i.test(haystack)) {
    return exercise.isUnilateral === true
      ? LOAD_CONVENTIONS.UNILATERAL
      : LOAD_CONVENTIONS.DUMBBELL_PER_HAND;
  }

  if (/\bbarra\b|\bbarbell\b/i.test(haystack)) {
    return LOAD_CONVENTIONS.BARBELL_TOTAL;
  }

  if (/\bmáquina\b|\bmaquina\b|\bpolea\b|\bcable\b/i.test(haystack)) {
    return LOAD_CONVENTIONS.MACHINE_STACK;
  }

  return null;
}

export function resolveLoadConvention(exercise: object = {}): LoadConvention {
  const ex = exercise as Record<string, unknown>;
  const stored = ex.loadConvention;
  if (typeof stored === 'string' && Object.values(LOAD_CONVENTIONS).includes(stored as LoadConvention)) {
    return stored as LoadConvention;
  }
  if (ex.loadMode === 'bodyweight' || ex.isBodyweight === true) {
    return LOAD_CONVENTIONS.BODYWEIGHT;
  }

  const equipo = normalizeEquipo(ex.equipo);
  const joined = equipo.join(' ').toLowerCase();

  if (/peso corporal|bodyweight|corporal/i.test(joined)) {
    return LOAD_CONVENTIONS.BODYWEIGHT;
  }

  if (ex.isUnilateral === true) {
    return LOAD_CONVENTIONS.UNILATERAL;
  }

  const inferredUnilateral = inferConventionFromMetadata(ex);
  if (inferredUnilateral === LOAD_CONVENTIONS.UNILATERAL) {
    return LOAD_CONVENTIONS.UNILATERAL;
  }

  const isDumbbellLike = /mancuerna|dumbbell|kettlebell|kettelbell/i.test(joined);
  const isBarbellLike = /barra|barbell|smith/i.test(joined);
  const isMachineLike = /máquina|maquina|polea|cable|selectorizado|stack|máquina de palancas/i.test(joined);

  if (isDumbbellLike && !isBarbellLike) {
    return LOAD_CONVENTIONS.DUMBBELL_PER_HAND;
  }
  if (isMachineLike && !isBarbellLike && !isDumbbellLike) {
    return LOAD_CONVENTIONS.MACHINE_STACK;
  }
  if (isBarbellLike) {
    return LOAD_CONVENTIONS.BARBELL_TOTAL;
  }
  if (isDumbbellLike) {
    return LOAD_CONVENTIONS.DUMBBELL_PER_HAND;
  }

  const inferred = inferConventionFromMetadata(ex);
  if (inferred) return inferred;

  return LOAD_CONVENTIONS.BARBELL_TOTAL;
}

export function formatLoadLabel(
  kg: number | null | undefined,
  convention: LoadConvention,
  options: { approximate?: boolean; exploratory?: boolean; unit?: WeightUnit } = {},
): string | null {
  if (options.exploratory) return 'Exploratorio';
  if (kg == null || Number.isNaN(kg)) return null;

  const unit = options.unit ?? 'kg';
  const display = toDisplayWeight(kg, unit, convention) ?? kg;
  const prefix = options.approximate ? '~' : '';
  const unitLabel = formatUnitLabel(unit);
  const value = `${prefix}${formatWeightNumber(display, unit)} ${unitLabel}`;

  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
      return `${value} / mano`;
    case LOAD_CONVENTIONS.UNILATERAL:
      return `${value} / lado`;
    case LOAD_CONVENTIONS.MACHINE_STACK:
      return `${value} (máquina)`;
    case LOAD_CONVENTIONS.BARBELL_TOTAL:
      return value;
    default:
      return value;
  }
}

export function getWeightInputLabel(convention: LoadConvention, unit: WeightUnit = 'kg'): string {
  const unitLabel = formatUnitLabel(unit);
  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
      return `Peso (${unitLabel} / mano)`;
    case LOAD_CONVENTIONS.UNILATERAL:
      return `Peso (${unitLabel} / lado)`;
    case LOAD_CONVENTIONS.MACHINE_STACK:
      return `Peso (${unitLabel} máquina)`;
    default:
      return `Peso (${unitLabel})`;
  }
}

export function getWeightUnitSuffix(convention: LoadConvention, unit: WeightUnit = 'kg'): string {
  const unitLabel = formatUnitLabel(unit);
  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
      return `${unitLabel} / mano`;
    case LOAD_CONVENTIONS.UNILATERAL:
      return `${unitLabel} / lado`;
    default:
      return unitLabel;
  }
}

export function getLoadConventionHint(convention: LoadConvention): string | null {
  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
      return 'Registra el peso de cada mancuerna, no el total de ambas.';
    case LOAD_CONVENTIONS.UNILATERAL:
      return 'Registra el peso del lado que estás trabajando en esta serie.';
    default:
      return null;
  }
}
