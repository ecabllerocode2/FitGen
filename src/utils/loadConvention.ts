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

  const isDumbbellLike = /mancuerna|dumbbell|kettlebell|kettelbell/i.test(joined);
  const isBarbellLike = /barra|barbell|smith/i.test(joined);
  const isMachineLike = /máquina|maquina|polea|cable|selectorizado|stack|máquina de palancas/i.test(joined);

  if (ex.isUnilateral === true) {
    return LOAD_CONVENTIONS.UNILATERAL;
  }
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

  return LOAD_CONVENTIONS.BARBELL_TOTAL;
}

export function formatLoadLabel(
  kg: number | null | undefined,
  convention: LoadConvention,
  options: { approximate?: boolean; exploratory?: boolean } = {},
): string | null {
  if (options.exploratory) return 'Exploratorio';
  if (kg == null || Number.isNaN(kg)) return null;

  const prefix = options.approximate ? '~' : '';
  const value = `${prefix}${kg} kg`;

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

export function getWeightInputLabel(convention: LoadConvention): string {
  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
      return 'Peso (kg / mano)';
    case LOAD_CONVENTIONS.UNILATERAL:
      return 'Peso (kg / lado)';
    case LOAD_CONVENTIONS.MACHINE_STACK:
      return 'Peso (kg máquina)';
    default:
      return 'Peso (kg)';
  }
}
