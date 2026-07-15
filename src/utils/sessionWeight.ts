/** Total tonnage (kg × reps) from archived session performance rows. */

type PerformanceSet = {
  completed?: boolean;
  reps?: number;
  load?: number | null;
  weightKg?: number | null;
  actualWeightKg?: number | null;
};

type PerformanceExercise = {
  sets?: PerformanceSet[];
  actualSets?: PerformanceSet[];
  actualWeightKg?: number | null;
  actualReps?: number | null;
};

export function computeTotalWeightKg(performance: unknown): number | null {
  if (!Array.isArray(performance) || performance.length === 0) return null;

  let total = 0;
  let hasWeightedSet = false;

  for (const raw of performance as PerformanceExercise[]) {
    const sets = raw.sets ?? raw.actualSets ?? [];
    for (const set of sets) {
      if (set.completed === false) continue;
      const load =
        set.load ??
        set.weightKg ??
        set.actualWeightKg ??
        raw.actualWeightKg ??
        null;
      const reps = set.reps ?? raw.actualReps ?? 0;
      if (load == null || load <= 0 || !reps) continue;
      hasWeightedSet = true;
      total += load * reps;
    }
  }

  if (!hasWeightedSet) return null;
  return Math.round(total);
}

export function computeTotalWeightFromLogs(
  exerciseLogs: Record<string, Array<{ weight?: number | null; reps?: number }>>,
): number | null {
  let total = 0;
  let hasWeightedSet = false;
  for (const logs of Object.values(exerciseLogs)) {
    for (const log of logs) {
      if (log.weight != null && log.weight > 0 && log.reps) {
        total += log.weight * log.reps;
        hasWeightedSet = true;
      }
    }
  }
  return hasWeightedSet ? Math.round(total) : null;
}

export function formatTotalWeightKg(kg: number | null | undefined): string | null {
  if (kg == null || kg <= 0) return null;
  return `${kg.toLocaleString('es-MX')} kg`;
}
