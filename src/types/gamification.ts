export interface GamificationCounters {
  lifetimeSessionsCompleted: number;
  lifetimeActiveDays: number;
  lifetimeWeeksPerfect: number;
  lifetimeMesocyclesCompleted: number;
  currentStreakDays: number;
  longestStreakDays: number;
  seasonPoints: number;
  seasonSessionsCompleted: number;
  fitCoinsBalance: number;
  currentSeasonId: string;
}

export interface AchievementView {
  id: string;
  title: string;
  description: string;
  category: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
}

export interface GamificationSummary {
  success: boolean;
  counters: GamificationCounters;
  avatar: {
    baseStage: number;
    equippedSkinId: string | null;
    equippedFrameId: string | null;
    equippedCelebrationId: string | null;
  };
  achievements: AchievementView[];
  unlockedCount: number;
  nextAchievement: AchievementView | null;
  updatedAt: string;
}

export interface GamificationDelta {
  seasonPointsEarned: number;
  fitCoinsEarned: number;
  newAchievements: Array<{
    id: string;
    title: string;
    description: string;
    unlockedAt: string;
  }>;
  avatarStageUp: boolean;
  currentStreakDays: number;
  weekPerfectBonus?: boolean;
  lifetimeSessionsCompleted: number;
}
