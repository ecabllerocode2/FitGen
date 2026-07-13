function parseDurationSeconds(value: unknown): number | null {
  if (!value) return null;
  const match = String(value).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder} min` : `${hours}h`;
}

export function getMainBlockExercises(session: any): any[] {
  if (Array.isArray(session.mainBlock)) return session.mainBlock;
  const blocks = session.mainBlock?.bloques ?? session.mainBlock?.estaciones ?? [];
  return blocks.flatMap((block: any) => block.ejercicios ?? []);
}

export function estimateSessionDuration(session: any): {
  duracionEstimada: string;
  duracionMinutos: number;
  ejerciciosTotales: number;
  seriesTotales: number;
} {
  if (session.summary?.duracionMinutos && session.summary?.duracionEstimada) {
    return {
      duracionEstimada: session.summary.duracionEstimada,
      duracionMinutos: session.summary.duracionMinutos,
      ejerciciosTotales: session.summary.ejerciciosTotales ?? getMainBlockExercises(session).length,
      seriesTotales: session.summary.seriesTotales ?? 0,
    };
  }

  let totalSeconds = 0;
  const WORK_SECONDS_PER_SET = 45;
  const TRANSITION_SECONDS = 30;

  for (const item of session.warmup ?? []) {
    totalSeconds += item.durationSeconds ?? parseDurationSeconds(item.duracion) ?? 45;
  }

  const mainExercises = getMainBlockExercises(session);
  for (const ex of mainExercises) {
    const sets = ex.sets ?? ex.prescripcion?.series ?? 3;
    const rest = ex.restSeconds ?? ex.prescripcion?.descanso ?? 90;
    totalSeconds += sets * WORK_SECONDS_PER_SET;
    totalSeconds += Math.max(0, sets - 1) * rest;
    totalSeconds += TRANSITION_SECONDS;
  }

  totalSeconds += (session.cooldown?.duracionEstimada ?? 8) * 60;

  const minutes = Math.max(15, Math.round(totalSeconds / 60));
  const seriesTotales = mainExercises.reduce(
    (sum, ex) => sum + (ex.sets ?? ex.prescripcion?.series ?? 0),
    0,
  );

  return {
    duracionEstimada: formatDurationMinutes(minutes),
    duracionMinutos: minutes,
    ejerciciosTotales: mainExercises.length,
    seriesTotales,
  };
}
