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

export async function fetchAdminUsersOverview(authToken: string): Promise<AdminUsersOverview | null> {
  const res = await authenticatedFetch(API_ENDPOINTS.ADMIN_USERS_OVERVIEW, authToken);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return res.json() as Promise<AdminUsersOverview>;
}
