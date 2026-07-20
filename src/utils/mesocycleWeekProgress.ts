import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export type MesocycleSessionSlot = {
  dayOfWeek?: string;
  sessionFocus?: string;
  isRestDay?: boolean;
};

export type MesocycleMicrocycle = {
  week: number;
  sessions: MesocycleSessionSlot[];
};

export type CompletedSessionRef = {
  weekNumber?: number | null;
  dayOfWeek?: string | null;
  completedAt?: string | null;
  id?: string;
};

function dayIndex(dayName: string | null | undefined): number {
  if (!dayName) return -1;
  const normalized =
    dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
  return DAY_ORDER.indexOf(normalized);
}

export function todayDayOfWeekEs(): string {
  const raw = format(new Date(), 'EEEE', { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function isTrainingSlot(session: MesocycleSessionSlot): boolean {
  if (session.isRestDay) return false;
  if (session.sessionFocus === 'Descanso') return false;
  return true;
}

export function countPlannedTrainingSessions(microcycle?: MesocycleMicrocycle | null): number {
  if (!microcycle?.sessions?.length) return 0;
  return microcycle.sessions.filter(isTrainingSlot).length;
}

/**
 * Count distinct training days completed in a mesocycle week (matches backend weekCompletion).
 */
export function countCompletedSessionsForWeek(
  sessions: CompletedSessionRef[],
  weekNumber: number,
): number {
  const seen = new Set<string>();
  let done = 0;

  for (const session of sessions) {
    if (session.weekNumber !== weekNumber) continue;
    const dayKey =
      session.dayOfWeek ??
      (session.completedAt ? session.completedAt.slice(0, 10) : null) ??
      session.id ??
      null;
    if (!dayKey || seen.has(dayKey)) continue;
    seen.add(dayKey);
    done += 1;
  }

  return done;
}

export function isMicrocycleWeekClosed(
  microcycle: MesocycleMicrocycle | null | undefined,
  mesocycleCurrentWeek: number,
  weekNumber: number,
): boolean {
  if (weekNumber < mesocycleCurrentWeek) return true;
  if (weekNumber > mesocycleCurrentWeek) return false;
  if (!microcycle?.sessions?.length) return false;

  const trainingDayIndexes = microcycle.sessions
    .filter(isTrainingSlot)
    .map((slot) => dayIndex(slot.dayOfWeek))
    .filter((idx) => idx >= 0);

  if (!trainingDayIndexes.length) return false;

  const lastTrainingDayIdx = Math.max(...trainingDayIndexes);
  const todayIdx = dayIndex(todayDayOfWeekEs());
  return todayIdx > lastTrainingDayIdx;
}

export type MesocycleWeekProgress = {
  weekNumber: number;
  planned: number;
  done: number;
  isCurrentWeek: boolean;
  isClosed: boolean;
  isPerfect: boolean;
};

export function computeMesocycleWeekProgress(
  microcycles: MesocycleMicrocycle[] | undefined,
  currentWeek: number,
  completedSessions: CompletedSessionRef[],
): MesocycleWeekProgress | null {
  if (!microcycles?.length || !currentWeek) return null;

  const micro = microcycles.find((m) => m.week === currentWeek);
  if (!micro) return null;

  const planned = countPlannedTrainingSessions(micro);
  const done = countCompletedSessionsForWeek(completedSessions, currentWeek);
  const isClosed = isMicrocycleWeekClosed(micro, currentWeek, currentWeek);

  return {
    weekNumber: currentWeek,
    planned,
    done,
    isCurrentWeek: true,
    isClosed,
    isPerfect: planned > 0 && done >= planned,
  };
}

export type MesocycleWeekMessages = {
  /** Progress for the active mesocycle week (in progress). */
  currentWeekMessage: string;
  /** Feedback when a mesocycle week already closed incomplete. */
  previousWeekMessage: string;
  planned: number;
  done: number;
};

export function buildMesocycleWeekMessages(
  microcycles: MesocycleMicrocycle[] | undefined,
  currentWeek: number,
  completedSessions: CompletedSessionRef[],
): MesocycleWeekMessages {
  const empty = {
    currentWeekMessage: '',
    previousWeekMessage: '',
    planned: 0,
    done: 0,
  };

  if (!microcycles?.length || !currentWeek) return empty;

  const currentMicro = microcycles.find((m) => m.week === currentWeek);
  const current = computeMesocycleWeekProgress(microcycles, currentWeek, completedSessions);
  if (!current || !currentMicro) return empty;

  let currentWeekMessage = '';
  let previousWeekMessage = '';

  if (!current.isClosed) {
    if (current.planned > 0) {
      if (current.done > 0) {
        currentWeekMessage = `Semana ${current.weekNumber} del mesociclo: llevas ${current.done} de ${current.planned} sesiones.`;
      } else {
        currentWeekMessage = `Semana ${current.weekNumber} del mesociclo: ${current.planned} sesiones planeadas.`;
      }
    }
  } else if (current.planned > 0 && current.done < current.planned) {
    currentWeekMessage = `Cerraste la semana ${current.weekNumber} con ${current.done} de ${current.planned} sesiones. La siguiente es una nueva oportunidad.`;
  } else if (current.isPerfect) {
    currentWeekMessage = `¡Semana ${current.weekNumber} perfecta! Completaste las ${current.planned} sesiones planeadas.`;
  }

  const previousWeek = currentWeek - 1;
  if (previousWeek >= 1) {
    const prevMicro = microcycles.find((m) => m.week === previousWeek);
    const prevPlanned = countPlannedTrainingSessions(prevMicro);
    const prevDone = countCompletedSessionsForWeek(completedSessions, previousWeek);
    const prevClosed = isMicrocycleWeekClosed(prevMicro, currentWeek, previousWeek);

    if (prevClosed && prevPlanned > 0 && prevDone < prevPlanned) {
      previousWeekMessage = `La semana pasada del mesociclo completaste ${prevDone} de ${prevPlanned} sesiones.`;
    }
  }

  return {
    currentWeekMessage,
    previousWeekMessage,
    planned: current.planned,
    done: current.done,
  };
}
