import { isSameDay, parseISO, format, differenceInCalendarWeeks } from 'date-fns';
import { es } from 'date-fns/locale';

export interface SessionDayCheck {
  completed?: boolean;
  generatedAt?: string;
  dayOfWeek?: string;
  weekNumber?: number;
  meta?: { generatedAt?: string };
}

/** True when an incomplete currentSession belongs to today's training slot. */
export function isSessionForToday(
  session: SessionDayCheck | null | undefined,
  today: Date,
  todayNameLower: string,
  currentWeek: number,
): boolean {
  if (!session || session.completed) return false;

  const generatedAt = session.generatedAt ?? session.meta?.generatedAt;
  if (generatedAt) {
    try {
      if (isSameDay(parseISO(generatedAt), today)) return true;
    } catch {
      // fall through to dayOfWeek check
    }
  }

  return (
    session.dayOfWeek?.toLowerCase() === todayNameLower &&
    (session.weekNumber == null || session.weekNumber === currentWeek)
  );
}

/** Whether the user's incomplete currentSession can be opened in the player. */
export function canPlayCurrentSession(
  userProfile: {
    currentSession?: SessionDayCheck | null;
    currentMesocycle?: {
      startDate?: string;
      mesocyclePlan?: { durationWeeks?: number };
    } | null;
  } | null | undefined,
  today: Date = new Date(),
): boolean {
  if (!userProfile?.currentSession) return false;

  const mesocycle = userProfile.currentMesocycle;
  let currentWeek = 1;
  if (mesocycle?.startDate) {
    const startString = String(mesocycle.startDate).split('T')[0];
    const start = new Date(`${startString}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      currentWeek = differenceInCalendarWeeks(today, start, { weekStartsOn: 1 }) + 1;
    }
  }

  const todayNameLower = format(today, 'eeee', { locale: es });
  return isSessionForToday(
    userProfile.currentSession,
    today,
    todayNameLower,
    currentWeek,
  );
}
