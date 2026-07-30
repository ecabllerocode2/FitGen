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

export interface GamificationPreferences {
  showInLeaderboard: boolean;
  publicDisplayName: string | null;
}

export interface GamificationInventory {
  frames: string[];
  celebrations: string[];
  shareTemplates?: string[];
}

export interface GamificationSummary {
  success: boolean;
  counters: GamificationCounters;
  avatar: {
    baseStage: number;
    equippedFrameId: string | null;
    equippedCelebrationId: string | null;
    equippedShareTemplateId?: string | null;
  };
  achievements: AchievementView[];
  achievementSections?: AchievementSection[];
  unlockedCount: number;
  nextAchievement: AchievementView | null;
  preferences?: GamificationPreferences;
  inventory?: GamificationInventory;
  updatedAt: string;
  retentionFeed?: RetentionMilestone[];
  unreadRetentionCount?: number;
  strengthHighlights?: StrengthHighlight[];
}

export interface RetentionMilestone {
  id: string;
  type: 'mesocycle_midpoint' | 'e1rm_gain' | 'e1rm_pr' | string;
  title: string;
  body: string;
  dedupeKey?: string;
  createdAt: string;
  readAt: string | null;
  meta?: Record<string, unknown>;
}

export interface StrengthHighlight {
  exerciseId: string;
  name: string;
  e1RM: number;
  previousE1RM: number | null;
  movementPattern?: string;
  lastWeightKg?: number;
  updatedAt?: string;
}

export interface GamificationRewardBreakdown {
  label: string;
  points: number;
  fitCoins: number;
}

export interface GamificationE1rmRecord {
  exerciseId: string;
  exerciseName: string;
  previousE1RM?: number | null;
  newE1RM?: number;
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
  volumeMetTarget?: boolean;
  weeklyCapHit?: boolean;
  lifetimeSessionsCompleted?: number;
  mesocycleCounted?: boolean;
  lifetimeMesocyclesCompleted?: number;
  breakdown?: GamificationRewardBreakdown[];
  newSeasonPointsTotal?: number;
  newFitCoinsTotal?: number;
  e1rmRecords?: GamificationE1rmRecord[];
}

export interface LeaderboardEntry {
  rank: number | null;
  userId: string;
  displayName: string;
  seasonPoints: number;
  seasonSessionsCompleted?: number;
  avatarStage?: number;
}

export interface LeaderboardResponse {
  success: boolean;
  seasonId: string;
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  myRank: number | null;
  mySeasonPoints: number;
  showInLeaderboard: boolean;
  publicDisplayName: string | null;
}

export interface ShopItem {
  id: string;
  type: 'frame' | 'celebration' | 'shareTemplate';
  name: string;
  description: string;
  price: number;
  rarity: string;
  previewKey: string;
  owned: boolean;
}

export interface ShopCatalogResponse {
  success: boolean;
  fitCoinsBalance: number;
  items: ShopItem[];
}

export const MILESTONE_ACHIEVEMENT_IDS = new Set([
  'sessions-100',
  'sessions-365',
  'sessions-500',
]);

export function isMilestoneAchievement(id: string): boolean {
  return MILESTONE_ACHIEVEMENT_IDS.has(id);
}
