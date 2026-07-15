export interface GamificationCounters {
  lifetimeSessionsCompleted: number;
  lifetimeActiveDays: number;
  lifetimeWeeksPerfect: number;
  lifetimeMesocyclesCompleted: number;
  currentStreakDays: number;
  longestStreakDays: number;
  seasonPoints: number;
  seasonSessionsCompleted: number;
  seasonWeeksPerfect: number;
  fitCoinsBalance: number;
  currentSeasonId: string;
}

export interface AchievementView {
  id: string;
  title: string;
  description: string;
  category: string;
  milestone?: boolean;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  target: number;
}

export interface AchievementSection {
  category: string;
  label: string;
  achievements: AchievementView[];
  nextLocked: AchievementView | null;
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
  achievementSections?: AchievementSection[];
  unlockedCount: number;
  nextAchievement: AchievementView | null;
  updatedAt: string;
}

export interface GamificationAchievementUnlock {
  id: string;
  title: string;
  description: string;
  milestone?: boolean;
  unlockedAt: string;
}

export interface GamificationDelta {
  seasonPointsEarned: number;
  fitCoinsEarned: number;
  newAchievements: GamificationAchievementUnlock[];
  avatarStageUp: boolean;
  currentStreakDays?: number;
  weekPerfectBonus?: boolean;
  lifetimeSessionsCompleted?: number;
  mesocycleCounted?: boolean;
  lifetimeMesocyclesCompleted?: number;
}

export const MILESTONE_ACHIEVEMENT_IDS = new Set([
  'sessions-100',
  'sessions-365',
  'sessions-500',
]);

export function isMilestoneAchievement(id: string): boolean {
  return MILESTONE_ACHIEVEMENT_IDS.has(id);
}
