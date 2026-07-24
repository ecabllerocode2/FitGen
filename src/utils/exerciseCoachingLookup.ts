import coachingIndex from '../../public/exercise-coaching-index.json';

type CoachingHint = { d?: string; c?: string[] };
const index = coachingIndex as Record<string, CoachingHint>;

export function enrichExerciseCoachingFields<T extends Record<string, unknown>>(exercise: T): T {
  const id = String(exercise.exerciseId ?? exercise.id ?? '').trim();
  if (!id) return exercise;

  const hint = index[id];
  if (!hint) return exercise;

  const hasCorrecciones =
    Array.isArray(exercise.correcciones) && (exercise.correcciones as unknown[]).length > 0;

  return {
    ...exercise,
    descripcion: exercise.descripcion || hint.d || exercise.descripcion,
    instrucciones: exercise.instrucciones || hint.d || exercise.instrucciones,
    correcciones: hasCorrecciones ? exercise.correcciones : hint.c ?? exercise.correcciones,
  };
}
