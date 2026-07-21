import {
  collection,
  getDocs,
  onSnapshot,
  query,
  limit,
  type Firestore,
} from 'firebase/firestore';

export interface RecentSessionRow {
  id: string;
  sessionFocus?: string;
  completed?: boolean;
  completedAt?: string;
  archivedAt?: string;
  generatedAt?: string;
  dayOfWeek?: string;
  weekNumber?: number;
  summary?: {
    duracionEstimada?: string;
    ejerciciosTotales?: number;
    seriesTotales?: number;
    totalWeightKg?: number;
    musculosTrabajos?: string[];
  };
  performance?: unknown;
  celebrationCardUrl?: string;
  celebrationCardExpiresAt?: string;
  celebrationSummary?: {
    sessionFocus?: string;
    durationLabel?: string;
    exerciseCount?: number;
    totalSets?: number;
    totalWeightKg?: number;
    muscles?: string[];
    completedAt?: string;
  };
}

function rowDate(session: RecentSessionRow): number {
  const raw = session.completedAt ?? session.archivedAt ?? session.generatedAt;
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? 0 : t;
}

export function sortRecentSessions(rows: RecentSessionRow[]): RecentSessionRow[] {
  return [...rows].sort((a, b) => rowDate(b) - rowDate(a));
}

export function mapRecentSessionDoc(id: string, data: Record<string, unknown>): RecentSessionRow {
  return { id, ...(data as Omit<RecentSessionRow, 'id'>) };
}

export async function fetchRecentSessions(
  db: Firestore,
  userId: string,
  max = 40,
): Promise<RecentSessionRow[]> {
  const ref = collection(db, 'users', userId, 'recentSessions');
  try {
    const snap = await getDocs(query(ref, limit(max)));
    return sortRecentSessions(
      snap.docs.map((docSnap) => mapRecentSessionDoc(docSnap.id, docSnap.data())),
    );
  } catch (err) {
    console.warn('fetchRecentSessions failed:', err);
    return [];
  }
}

export function subscribeRecentSessions(
  db: Firestore,
  userId: string,
  onRows: (rows: RecentSessionRow[]) => void,
  max = 40,
) {
  const ref = collection(db, 'users', userId, 'recentSessions');
  return onSnapshot(
    query(ref, limit(max)),
    (snap) => {
      const rows = sortRecentSessions(
        snap.docs.map((docSnap) => mapRecentSessionDoc(docSnap.id, docSnap.data())),
      );
      onRows(rows);
    },
    (err) => console.warn('subscribeRecentSessions failed:', err),
  );
}

export function sessionCompletedOnCalendarDay(
  session: RecentSessionRow | null | undefined,
  day: Date,
): boolean {
  if (!session) return false;
  const raw = session.completedAt ?? session.archivedAt;
  if (!raw) return false;
  try {
    return new Date(raw).toDateString() === day.toDateString();
  } catch {
    return false;
  }
}

/** True when the athlete finished today's scheduled slot, not a stale day carried over. */
export function completedScheduledSessionToday(
  sessions: RecentSessionRow[],
  today: Date,
  todayNameLower: string,
  _currentWeek?: number,
): boolean {
  // Prefer any completion today for today's weekday. Week numbers can drift FE vs BE.
  return sessions.some((session) => {
    if (session.completed === false) return false;
    if (!sessionCompletedOnCalendarDay(session, today)) return false;
    return session.dayOfWeek?.toLowerCase() === todayNameLower;
  });
}
