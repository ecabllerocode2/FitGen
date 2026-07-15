/** Main-block training volume (Σ kg × reps). Bodyweight uses effective load. */

import {
  resolveSetLoadKgForVolume,
  type BodyweightExerciseMeta,
} from './bodyweightEffectiveLoad';

type PerformanceSet = {
  completed?: boolean;
  reps?: number;
  load?: number | null;
  weightKg?: number | null;
  actualWeightKg?: number | null;
};

type PerformanceExercise = BodyweightExerciseMeta & {
  sets?: PerformanceSet[];
  actualSets?: PerformanceSet[];
  actualReps?: number | null;
};

export function isBodyweightPerformanceExercise(exercise: PerformanceExercise): boolean {
  if (exercise.isBodyweight === true) return true;
  if (exercise.loadMode === 'bodyweight') return true;
  return false;
}

export function computeMainBlockVolumeKg(
  performance: unknown,
  bodyWeightKg?: number | null,
): number | null {
  if (!Array.isArray(performance) || performance.length === 0) return null;

  let total = 0;
  let hasVolumeSet = false;

  for (const raw of performance as PerformanceExercise[]) {
    const sets = raw.sets ?? raw.actualSets ?? [];
    for (const set of sets) {
      if (set.completed === false) continue;
      const load = resolveSetLoadKgForVolume(set, raw, bodyWeightKg);
      const reps = set.reps ?? raw.actualReps ?? 0;
      if (load == null || !reps) continue;
      hasVolumeSet = true;
      total += load * reps;
    }
  }

  if (!hasVolumeSet) return null;
  return Math.round(total);
}

/** @deprecated alias */
export const computeTotalWeightKg = computeMainBlockVolumeKg;

export function computeMainBlockVolumeFromLogs(
  mainBlock: Array<BodyweightExerciseMeta & { exerciseId?: string; id?: string }>,
  exerciseLogs: Record<string, Array<{ weight?: number | null; reps?: number }>>,
  isBodyweight: (ex: BodyweightExerciseMeta & { exerciseId?: string; id?: string }) => boolean,
  bodyWeightKg?: number | null,
): number | null {
  let total = 0;
  let hasVolumeSet = false;

  for (const ex of mainBlock) {
    const exerciseId = ex.exerciseId ?? ex.id;
    if (!exerciseId) continue;

    const exerciseMeta = {
      ...ex,
      isBodyweight: isBodyweight(ex),
      loadMode: ex.loadMode ?? (isBodyweight(ex) ? 'bodyweight' : undefined),
    };

    for (const log of exerciseLogs[exerciseId] ?? []) {
      if (!log.reps) continue;
      const load = resolveSetLoadKgForVolume(
        { load: log.weight, reps: log.reps },
        exerciseMeta,
        bodyWeightKg,
      );
      if (load == null) continue;
      hasVolumeSet = true;
      total += load * log.reps;
    }
  }

  return hasVolumeSet ? Math.round(total) : null;
}

/** @deprecated */
export const computeTotalWeightFromLogs = (
  exerciseLogs: Record<string, Array<{ weight?: number | null; reps?: number }>>,
  bodyWeightKg?: number | null,
) => {
  let total = 0;
  let hasVolumeSet = false;
  for (const logs of Object.values(exerciseLogs)) {
    for (const log of logs) {
      if (!log.reps) continue;
      const load = resolveSetLoadKgForVolume({ load: log.weight }, {}, bodyWeightKg);
      if (load == null) continue;
      hasVolumeSet = true;
      total += load * log.reps;
    }
  }
  return hasVolumeSet ? Math.round(total) : null;
};

export function formatVolumeKg(kg: number | null | undefined): string | null {
  if (kg == null || kg <= 0) return null;
  return `${kg.toLocaleString('es-MX')} kg`;
}

/** @deprecated */
export const formatTotalWeightKg = formatVolumeKg;

/** Profile field used for bodyweight volume at session time. */
export function resolveProfileBodyWeightKg(
  profileData?: { currentWeightKg?: number; initialWeight?: number } | null,
): number | null {
  const weight = profileData?.currentWeightKg ?? profileData?.initialWeight;
  return weight != null && weight > 0 ? weight : null;
}
