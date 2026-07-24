export type CoachPlan = 'free' | 'premium';

export type ClientStatus =
  | 'invited'
  | 'onboarding_client'
  | 'onboarding_coach'
  | 'active'
  | 'paused'
  | 'released'
  | 'banned_reuse';

export interface ProfileCompleteness {
  personal: boolean;
  training: boolean;
  readyForMesocycle: boolean;
}

export interface CoachProfile {
  id: string;
  userId: string;
  displayName: string;
  publicName: string;
  bio?: string;
  plan: CoachPlan;
  seatLimit: number;
  seatsConsumedLifetime: number;
  activeClientCount: number;
  branding?: { publicName: string };
}

export interface CoachClientSummary {
  athleteId: string;
  status: ClientStatus;
  name: string;
  fitnessGoal: string | null;
  profileCompleteness: ProfileCompleteness | null;
  hasMesocycle: boolean;
  lastSessionAt: string | null;
  activatedAt?: string;
}

export interface CoachInsight {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  suggestion: string;
}

export interface CoachNote {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
}

export interface CoachClientDetail {
  athleteId: string;
  relation: {
    status: ClientStatus;
    notes?: CoachNote[];
    activatedAt?: string;
  };
  profileData: Record<string, unknown>;
  profileCompleteness: ProfileCompleteness | null;
  currentMesocycle: unknown;
  currentSession: {
    sessionId: string;
    sessionFocus: string;
    weekNumber: number;
    completed: boolean;
  } | null;
  recentSessions: Array<{
    id: string;
    sessionFocus: string;
    completed: boolean;
    completedAt?: string;
    weekNumber?: number;
  }>;
  insights: CoachInsight[];
  metrics: {
    adherence7: number;
    adherence28: number;
    daysSinceLastSession: number | null;
    expectedSessionsPerWeek: number;
  };
  notes: CoachNote[];
}

export interface ShareBranding {
  footer: 'default' | 'coached_free' | 'coached_premium';
  coachName?: string;
  footerText: string;
}
