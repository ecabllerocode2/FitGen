/** Effective load factors for bodyweight volume (fraction of body mass per rep). */

export const BODYWEIGHT_EFFECTIVE_LOAD_FACTORS: Record<string, number> = {
  Empuje_H: 0.65,
  Empuje_V: 0.75,
  Traccion_H: 0.6,
  Traccion_V: 1.0,
  Rodilla: 1.0,
  Cadera: 0.9,
  Core: 0.2,
  General: 0.5,
};

export type BodyweightExerciseMeta = {
  movementPattern?: string;
  patronMovimiento?: string;
  bodyweightEffectiveLoadFactor?: number;
  isBodyweight?: boolean;
  loadMode?: string;
  actualWeightKg?: number | null;
};

export type BodyweightSet = {
  load?: number | null;
  weightKg?: number | null;
  actualWeightKg?: number | null;
  reps?: number;
};

export function getExerciseMovementPattern(exercise: BodyweightExerciseMeta = {}): string {
  return exercise.movementPattern ?? exercise.patronMovimiento ?? 'General';
}

export function getBodyweightEffectiveLoadFactor(exercise: BodyweightExerciseMeta = {}): number {
  if (typeof exercise.bodyweightEffectiveLoadFactor === 'number') {
    return exercise.bodyweightEffectiveLoadFactor;
  }
  const pattern = getExerciseMovementPattern(exercise);
  return BODYWEIGHT_EFFECTIVE_LOAD_FACTORS[pattern] ?? BODYWEIGHT_EFFECTIVE_LOAD_FACTORS.General;
}

export function getBodyweightBaseLoadKg(
  exercise: BodyweightExerciseMeta,
  bodyWeightKg: number | null | undefined,
): number | null {
  if (!bodyWeightKg || bodyWeightKg <= 0) return null;
  return bodyWeightKg * getBodyweightEffectiveLoadFactor(exercise);
}

export function resolveSetLoadKgForVolume(
  set: BodyweightSet,
  exercise: BodyweightExerciseMeta,
  bodyWeightKg?: number | null,
): number | null {
  const isBodyweight = exercise.isBodyweight === true || exercise.loadMode === 'bodyweight';
  if (isBodyweight) {
    const base = getBodyweightBaseLoadKg(exercise, bodyWeightKg);
    if (base == null) return null;
    const added =
      set.load ??
      set.weightKg ??
      set.actualWeightKg ??
      exercise.actualWeightKg ??
      0;
    const addedKg = typeof added === 'number' && added > 0 ? added : 0;
    return base + addedKg;
  }

  const load =
    set.load ??
    set.weightKg ??
    set.actualWeightKg ??
    exercise.actualWeightKg ??
    null;
  if (load == null || load <= 0) return null;
  return load;
}
