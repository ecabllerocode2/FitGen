import type { CoachInsight, CoachNote, ProfileCompleteness } from './coach';

export type LoadComparison = 'under' | 'on_target' | 'over' | 'na';

export interface SessionExerciseSummary {
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  prescribedLoadKg: number | null;
  actualLoadKg: number | null;
  setsPrescribed: number;
  setsCompleted: number;
  loadComparison: LoadComparison;
  completed: boolean;
}

export interface CoachSessionSummary {
  id: string;
  sessionFocus: string;
  weekNumber: number | null;
  dayOfWeek: string | null;
  completed: boolean;
  completedAt: string | null;
  durationLabel: string | null;
  exerciseCount: number;
  setsCompleted: number;
  setsPrescribed: number;
  readinessEnergy: number | null;
  jointPain: boolean;
  totalVolumeKg: number | null;
  exercises: SessionExerciseSummary[];
}

export interface CoachLiveSession {
  isLive: boolean;
  sessionId: string | null;
  sessionFocus: string;
  weekNumber: number | null;
  dayOfWeek: string | null;
  phase: string | null;
  totalExercises: number;
  totalSetsPlanned: number;
  exercises: SessionExerciseSummary[];
  note: string;
}

export interface CoachMesocycleOverview {
  goal: string | null;
  splitType: string | null;
  durationWeeks: number;
  currentWeek: number;
  progressPercent: number;
  status: string;
  weeklySplit: Array<{ day: string; focus: string; isRest: boolean }>;
}

export interface CoachAnthropometrics {
  weightKg: number | null;
  profileWeightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  bmiCategory: string | null;
  age: number | null;
  gender: string | null;
}

export interface CoachCheckinSummary {
  due: boolean;
  overdue: boolean;
  needsCheckin: boolean;
  daysSince: number | null;
  daysUntilDue: number;
  lastCheckinAt: string | null;
  nextCheckinDueAt: string | null;
  intervalDays: number;
  reminderMessage: string;
  recentEntries: Array<{
    recordedAt: string;
    weightKg: number | null;
    waistCm: number | null;
  }>;
  trend: {
    weightTrendKgPerWeek: number;
    waistTrendCmPerWeek: number;
    messages: string[];
  };
}

export interface CoachClientDashboardData {
  athleteId: string;
  relation: {
    status: string;
    notes?: CoachNote[];
    activatedAt?: string;
  };
  profileData: Record<string, unknown>;
  profileCompleteness: ProfileCompleteness | null;
  anthropometrics: CoachAnthropometrics;
  checkin: CoachCheckinSummary;
  mesocycle: CoachMesocycleOverview | null;
  liveSession: CoachLiveSession | null;
  lastCompletedSession: CoachSessionSummary | null;
  sessionHistory: CoachSessionSummary[];
  sessionHistoryLimit: number;
  sessionHistoryCount: number;
  insights: CoachInsight[];
  metrics: {
    adherence7: number;
    adherence28: number;
    daysSinceLastSession: number | null;
    expectedSessionsPerWeek: number;
  };
  trainingProfile: {
    fitnessGoal: string | null;
    trainingDaysPerWeek: number | null;
    trainingAgeMonths: number | null;
    bodyCompositionGoal: string | null;
    focusArea: string | null;
    injuriesOrLimitations: string[];
    musclePriorities: Array<{ muscle: string; intensity: string }>;
  };
  notes: CoachNote[];
}

export interface CoachClientListFlags {
  isTrainingNow: boolean;
  checkinDue: boolean;
  checkinOverdue: boolean;
  currentSessionFocus: string | null;
}
