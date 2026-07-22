import { API_ENDPOINTS, authenticatedFetch } from '../config/api';

export type AdminUserRow = {
  uid: string;
  name: string;
  email: string | null;
  status: string;
  lastSessionAt: string | null;
  trainedToday: boolean;
  activeThisWeek: boolean;
  totalSessions: number;
  fitCoins: number;
  seasonPoints: number;
  currentStreak: number;
  experienceLevel: string | null;
  createdAt: string | null;
};

export type AdminUsersOverview = {
  success: boolean;
  generatedAt: string;
  summary: {
    totalUsers: number;
    activeToday: number;
    activeThisWeek: number;
    totalSessions: number;
    pendingApproval: number;
    approved: number;
    averageSessions: number;
  };
  users: AdminUserRow[];
};

export type AdminSessionExerciseLoad = {
  exerciseId: string | null;
  exerciseName: string;
  muscleGroup: string | null;
  prescribedKg: number | null;
  actualKg: number | null;
  deltaKg: number | null;
  deltaPct: number | null;
  isBodyweight: boolean;
  loadMode: string | null;
};

export type AdminSessionSummary = {
  sessionId: string | null;
  completedAt: string | null;
  sessionFocus: string;
  weekNumber: number | null;
  dayOfWeek: number | null;
  durationLabel: string | null;
  volumeKg: number | null;
  exerciseCount: number;
  comparableCount: number;
  avgDeltaPct: number | null;
  avgPrescribedKg: number | null;
  avgActualKg: number | null;
  exercises: AdminSessionExerciseLoad[];
};

export type AdminUserDetail = {
  success: boolean;
  generatedAt: string;
  user: {
    uid: string;
    name: string;
    email: string | null;
    status: string;
    experienceLevel: string | null;
    currentWeightKg: number | null;
    timezone: string;
    createdAt: string | null;
    lastSessionAt: string | null;
    hasActiveSession: boolean;
    hasActiveMesocycle: boolean;
    mesocycleStatus: string | null;
  };
  gamification: {
    lifetimeSessionsCompleted: number;
    currentStreakDays: number;
    longestStreakDays: number;
    fitCoinsBalance: number;
    seasonPoints: number;
    seasonSessionsCompleted: number;
    lifetimeWeeksPerfect: number;
    lifetimeMesocyclesCompleted: number;
  };
  stats: {
    archivedSessions: number;
    totalVolumeKg: number;
    avgVolumeKg: number | null;
    comparableLifts: number;
    avgLoadDeltaPct: number | null;
    heavierThanPrescribed: number;
    lighterThanPrescribed: number;
    onTargetWithin5Pct: number;
    adherenceRatePct: number | null;
  };
  charts: {
    volumeBySession: Array<{
      date: string;
      label: string;
      volumeKg: number | null;
      avgPrescribedKg: number | null;
      avgActualKg: number | null;
      avgDeltaPct: number | null;
    }>;
    loadBySession: Array<{
      date: string;
      label: string;
      volumeKg: number | null;
      avgPrescribedKg: number | null;
      avgActualKg: number | null;
      avgDeltaPct: number | null;
    }>;
  };
  ledgerHighlights: Array<{
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string | null;
    lastWeightKg: number | null;
    lastReps: number | null;
    e1RM: number | null;
    previousE1RM: number | null;
    updatedAt: string | null;
  }>;
  sessions: AdminSessionSummary[];
};

export async function fetchAdminUsersOverview(authToken: string): Promise<AdminUsersOverview> {
  const res = await authenticatedFetch(API_ENDPOINTS.ADMIN_USERS_OVERVIEW, authToken);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<AdminUsersOverview>;
}

export async function fetchAdminUserDetail(authToken: string, uid: string): Promise<AdminUserDetail> {
  const url = `${API_ENDPOINTS.ADMIN_USER_DETAIL}?uid=${encodeURIComponent(uid)}`;
  const res = await authenticatedFetch(url, authToken);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<AdminUserDetail>;
}
