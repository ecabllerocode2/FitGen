import { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Award,
  Calendar,
  Crown,
  Home,
  Image,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { fetchRecentSessions, type RecentSessionRow } from '../utils/recentSessions';
import { db } from '../firebase';
import { pickMotivationalPhraseForDate } from '../utils/motivationalPhrases';
import { fetchGamificationSummary } from '../api/gamification';
import type { AchievementSection, AchievementView, GamificationSummary } from '../types/gamification';
import { achievementIcon } from '../utils/achievementIcons';
import { computeMainBlockVolumeKg, resolveProfileBodyWeightKg } from '../utils/sessionWeight';
import type { ShareCardData } from '../utils/shareCard';
import FitCoinIcon from './gamification/FitCoinIcon';
import { formatFitCoins, formatSeasonLabel } from '../utils/gamificationDisplay';
import HubHomeTab from './gamification/HubHomeTab';
import HubAchievementsTab from './gamification/HubAchievementsTab';
import HubSeasonTab from './gamification/HubSeasonTab';
import HubSessionsTab, { buildSessionHistoryItem } from './gamification/HubSessionsTab';
import HubRankingTab from './gamification/HubRankingTab';
import HubShopTab from './gamification/HubShopTab';
import BodyMetricsTrendSection from './BodyMetricsTrendSection';
import BodyMetricsCheckinModal from './BodyMetricsCheckinModal';
import { fetchBodyCheckinStatus } from '../api/bodyMetrics';
import type { BodyMetricEntry } from '../types/bodyMetrics';
import type { AvatarAppearance, AvatarStartingBuild } from '@fitgen/visual';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import {
  buildMesocycleWeekMessages,
  resolveMesocycleCurrentWeek,
} from '../utils/mesocycleWeekProgress';
import {
  profileGenderToAvatarGender,
  resolveAvatarAppearance,
  resolveAvatarStartingBuildForDisplay,
  saveAvatarStartingBuild,
  hasAvatarStartingBuildChosen,
} from '../utils/avatarAppearanceStorage';

export type HubTab = 'home' | 'achievements' | 'season' | 'sessions' | 'ranking' | 'shop';

interface HistorySession {
  id: string;
  sessionFocus: string;
  completedAt: string | null;
  weekNumber?: number | null;
  dayOfWeek?: string | null;
  summary?: {
    durationLabel?: string;
    exerciseCount?: number;
    totalSets?: number;
    totalWeightKg?: number;
    muscles?: string[];
  };
  performance?: unknown;
  celebrationCardUrl?: string | null;
  celebrationCardExpiresAt?: string | null;
  celebrationSummary?: RecentSessionRow['celebrationSummary'];
}

interface StatsAndAchievementsProps {
  userId: string;
  authToken: string;
  seedSessions?: RecentSessionRow[];
  userProfile: {
    createdAt?: string;
    lastWorkoutDate?: string;
    currentMesocycle?: {
      currentWeek?: number;
      progress?: number;
      mesocyclePlan?: {
        microcycles?: Array<{
          week: number;
          sessions: Array<{ dayOfWeek: string; sessionFocus: string; isRestDay?: boolean }>;
        }>;
      };
      startDate?: string;
      durationWeeks?: number;
    };
    profileData?: {
      name?: string;
      gender?: string;
      currentWeightKg?: number;
      initialWeight?: number;
      avatarStartingBuild?: AvatarStartingBuild;
    };
    bodyMetrics?: {
      entries?: BodyMetricEntry[];
    };
  };
  onClose: () => void;
  initialSection?: 'stats' | 'celebrations';
  initialTab?: HubTab;
  seedGamification?: GamificationSummary | null;
  onGamificationUpdated?: (summary: GamificationSummary) => void;
}

const HUB_TABS: Array<{ id: HubTab; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'achievements', label: 'Logros', icon: Award },
  { id: 'season', label: 'Temporada', icon: Calendar },
  { id: 'sessions', label: 'Sesiones', icon: Image },
  { id: 'ranking', label: 'Ranking', icon: Crown },
  { id: 'shop', label: 'Tienda', icon: ShoppingBag },
];

function resolveInitialTab(initialSection?: 'stats' | 'celebrations', initialTab?: HubTab): HubTab {
  if (initialTab) return initialTab;
  if (initialSection === 'celebrations') return 'sessions';
  return 'home';
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  target?: number;
  category?: string;
  milestone?: boolean;
}

function mapAchievementView(row: AchievementView): Achievement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: achievementIcon(row.id),
    unlocked: row.unlocked,
    unlockedDate: row.unlockedAt ?? undefined,
    progress: row.progress,
    target: row.target,
    category: row.category,
    milestone: row.milestone,
  };
}

function mapAchievementSection(section: AchievementSection) {
  return {
    ...section,
    achievements: section.achievements.map(mapAchievementView),
    nextLocked: section.nextLocked ? mapAchievementView(section.nextLocked) : null,
  };
}

function mapRow(row: RecentSessionRow): HistorySession {
  return {
    id: row.id,
    sessionFocus: row.sessionFocus ?? 'Entrenamiento',
    completedAt: row.completedAt ?? row.archivedAt ?? null,
    weekNumber: row.weekNumber,
    dayOfWeek: row.dayOfWeek ?? null,
    summary: {
      durationLabel: row.summary?.duracionEstimada ?? row.celebrationSummary?.durationLabel ?? '—',
      exerciseCount: row.summary?.ejerciciosTotales ?? row.celebrationSummary?.exerciseCount ?? 0,
      totalSets: row.summary?.seriesTotales ?? row.celebrationSummary?.totalSets ?? 0,
      totalWeightKg:
        row.summary?.totalWeightKg ??
        row.celebrationSummary?.totalWeightKg ??
        undefined,
      muscles: row.summary?.musculosTrabajos ?? row.celebrationSummary?.muscles ?? [],
    },
    performance: row.performance,
    celebrationCardUrl: row.celebrationCardUrl ?? null,
    celebrationCardExpiresAt: row.celebrationCardExpiresAt ?? null,
    celebrationSummary: row.celebrationSummary ?? undefined,
  };
}

function sessionDate(session: HistorySession): Date | null {
  const raw =
    session.completedAt ??
    session.celebrationSummary?.completedAt ??
    null;
  if (!raw) return null;
  try {
    return parseISO(raw);
  } catch {
    return null;
  }
}

function historyToShareData(
  item: HistorySession,
  bodyWeightKg?: number | null,
): ShareCardData {
  const summary = item.celebrationSummary ?? item.summary;
  const volumeBodyWeight =
    (summary as { volumeBodyWeightKg?: number } | undefined)?.volumeBodyWeightKg ??
    bodyWeightKg ??
    null;
  const totalWeightKg =
    item.celebrationSummary?.totalWeightKg ??
    summary?.totalWeightKg ??
    computeMainBlockVolumeKg(item.performance, volumeBodyWeight);

  return {
    sessionFocus: item.sessionFocus ?? 'Entrenamiento',
    durationLabel: summary?.durationLabel ?? '—',
    exerciseCount: summary?.exerciseCount ?? 0,
    totalSets: summary?.totalSets ?? 0,
    totalWeightKg,
    muscles: summary?.muscles ?? [],
    phrase: pickMotivationalPhraseForDate(
      item.completedAt ?? item.celebrationSummary?.completedAt ?? undefined,
    ),
    completedAt: item.completedAt ?? item.celebrationSummary?.completedAt ?? undefined,
    aspect: '4:5',
  };
}

const StatsAndAchievements: React.FC<StatsAndAchievementsProps> = ({
  userId,
  authToken,
  seedSessions = [],
  userProfile,
  onClose,
  initialSection = 'stats',
  initialTab,
  seedGamification = null,
  onGamificationUpdated,
}) => {
  const [history, setHistory] = useState<HistorySession[]>(() =>
    seedSessions.filter((s) => s.completed !== false).map(mapRow),
  );
  const [loadingHistory, setLoadingHistory] = useState(seedSessions.length === 0);
  const [loadingGamification, setLoadingGamification] = useState(!seedGamification);
  const [gamification, setGamification] = useState<GamificationSummary | null>(seedGamification);
  const [activeTab, setActiveTab] = useState<HubTab>(() =>
    resolveInitialTab(initialSection, initialTab),
  );
  const [avatarAppearance, setAvatarAppearance] = useState<AvatarAppearance>(() =>
    resolveAvatarAppearance(
      userProfile.profileData?.gender,
      userId,
      userProfile.profileData?.avatarStartingBuild,
    ),
  );
  const [savingAvatar, setSavingAvatar] = useState(false);
  const profileStartingBuild = userProfile.profileData?.avatarStartingBuild ?? null;
  const avatarGender = profileGenderToAvatarGender(userProfile.profileData?.gender);
  const avatarChosen = hasAvatarStartingBuildChosen(profileStartingBuild, userId);
  const displayStartingBuild = resolveAvatarStartingBuildForDisplay(
    userProfile.profileData?.gender,
    userId,
    profileStartingBuild,
  );
  const [bodyMetricEntries, setBodyMetricEntries] = useState<BodyMetricEntry[]>(
    () => userProfile.bodyMetrics?.entries ?? [],
  );
  const [showBodyCheckinModal, setShowBodyCheckinModal] = useState(false);
  const profileBodyWeightKg = useMemo(
    () => resolveProfileBodyWeightKg(userProfile?.profileData),
    [userProfile?.profileData],
  );

  useEffect(() => {
    setActiveTab(resolveInitialTab(initialSection, initialTab));
  }, [initialSection, initialTab]);

  useEffect(() => {
    setAvatarAppearance(
      resolveAvatarAppearance(
        userProfile.profileData?.gender,
        userId,
        userProfile.profileData?.avatarStartingBuild,
      ),
    );
  }, [
    userProfile.profileData?.gender,
    userProfile.profileData?.avatarStartingBuild,
    userId,
  ]);

  const handleSaveAvatarStartingBuild = async (build: AvatarStartingBuild) => {
    saveAvatarStartingBuild(build, userId);
    setAvatarAppearance((prev) => ({ ...prev, startingBuild: build }));

    if (!authToken) return;

    setSavingAvatar(true);
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.USER_PROFILE_SAVE, authToken, {
        method: 'POST',
        body: JSON.stringify({
          action: 'profile_metadata_update',
          profileData: { avatarStartingBuild: build },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        console.warn('No se pudo guardar avatar en perfil:', data?.error);
      }
    } catch (err) {
      console.warn('Error guardando avatar:', err);
    } finally {
      setSavingAvatar(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const loadHistory = async () => {
      try {
        const rows = await fetchRecentSessions(db, userId, 40);
        if (cancelled) return;
        setHistory(rows.filter((s) => s.completed !== false).map(mapRow));
      } catch (err) {
        console.warn('No se pudo cargar historial:', err);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };

    if (seedSessions.length > 0) {
      setHistory(seedSessions.filter((s) => s.completed !== false).map(mapRow));
      setLoadingHistory(false);
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [userId, seedSessions]);

  useEffect(() => {
    if (seedGamification) {
      setGamification(seedGamification);
    }
  }, [seedGamification]);

  useEffect(() => {
    if (!authToken) {
      setLoadingGamification(false);
      return;
    }
    let cancelled = false;

    const loadGamification = async () => {
      setLoadingGamification(true);
      try {
        const summary = await fetchGamificationSummary(authToken);
        if (!cancelled && summary) {
          setGamification(summary);
          onGamificationUpdated?.(summary);
        }
      } catch (err) {
        console.warn('No se pudo cargar gamificación:', err);
      } finally {
        if (!cancelled) setLoadingGamification(false);
      }
    };

    void loadGamification();
    return () => {
      cancelled = true;
    };
  }, [authToken, userId, onGamificationUpdated]);

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    void fetchBodyCheckinStatus(authToken)
      .then((data) => {
        if (!cancelled && data.recent?.length) {
          setBodyMetricEntries(data.recent.slice().reverse());
        }
      })
      .catch((err) => console.warn('No se pudo cargar métricas corporales:', err));
    return () => {
      cancelled = true;
    };
  }, [authToken, userProfile.bodyMetrics?.entries?.length]);

  const stats = useMemo(() => {
    const datedSessions = history
      .map((s) => ({ session: s, date: sessionDate(s) }))
      .filter((row): row is { session: HistorySession; date: Date } => row.date != null)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const activeDayKeys = new Set(
      datedSessions.map(({ date }) => format(date, 'yyyy-MM-dd')),
    );

    const totalSessions =
      gamification?.counters.lifetimeSessionsCompleted ?? datedSessions.length;

    const activeDays =
      gamification?.counters.lifetimeActiveDays ?? activeDayKeys.size;

    let currentStreak =
      gamification?.counters.currentStreakDays ?? 0;
    if (!gamification && datedSessions.length > 0) {
      const uniqueDays = [...activeDayKeys].sort().reverse();
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const yesterdayKey = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      if (uniqueDays[0] === todayKey || uniqueDays[0] === yesterdayKey) {
        currentStreak = 1;
        for (let i = 1; i < uniqueDays.length; i++) {
          const prev = parseISO(uniqueDays[i - 1]);
          const curr = parseISO(uniqueDays[i]);
          if (differenceInDays(prev, curr) <= 3) currentStreak++;
          else break;
        }
      }
    }

    const weeksCompleted = gamification?.counters.lifetimeWeeksPerfect ?? 0;

    const mesocycle = userProfile.currentMesocycle;
    const currentWeek = resolveMesocycleCurrentWeek(mesocycle);
    const microcycles = mesocycle?.mesocyclePlan?.microcycles;

    const weekMessages = buildMesocycleWeekMessages(
      microcycles,
      currentWeek,
      datedSessions.map(({ session }) => session),
    );

    const currentWeekProgress = weekMessages.done;
    const currentWeekTarget = weekMessages.planned;
    const currentWeekMessage = weekMessages.currentWeekMessage;
    const previousWeekMessage = weekMessages.previousWeekMessage;

    const mesocyclesCompleted =
      gamification?.counters.lifetimeMesocyclesCompleted ?? 0;

    const monthsCompleted = mesocyclesCompleted;

    const lastSessionDate = datedSessions[0]?.date ?? null;

    return {
      totalSessions,
      currentStreak,
      weeksCompleted,
      monthsCompleted,
      activeDays,
      currentWeekProgress,
      currentWeekTarget,
      currentWeekMessage,
      previousWeekMessage,
      lastSessionDate,
      seasonPoints: gamification?.counters.seasonPoints ?? 0,
      mesocyclesCompleted,
    };
  }, [history, userProfile.currentMesocycle, gamification]);

  const achievementSections = useMemo(() => {
    if (gamification?.achievementSections?.length) {
      return gamification.achievementSections.map(mapAchievementSection);
    }
    return [];
  }, [gamification]);

  const achievements: Achievement[] = useMemo(() => {
    if (gamification?.achievements?.length) {
      return gamification.achievements.map(mapAchievementView);
    }

    return [
      {
        id: 'first-session',
        title: 'Primera sesión',
        description: 'Completaste tu primera sesión de entrenamiento',
        icon: achievementIcon('first-session'),
        unlocked: stats.totalSessions >= 1,
      },
      {
        id: 'first-week',
        title: 'Primera semana',
        description: 'Completaste todas las sesiones programadas en una semana',
        icon: achievementIcon('first-week'),
        unlocked: stats.weeksCompleted >= 1,
        progress: stats.currentWeekProgress,
        target: stats.currentWeekTarget || 1,
      },
      {
        id: 'first-month',
        title: 'Primer mesociclo',
        description: 'Completaste al menos el 80% de sesiones en los últimos 30 días',
        icon: achievementIcon('first-month'),
        unlocked: stats.monthsCompleted >= 1,
        progress: Math.min(stats.totalSessions, 14),
        target: 14,
      },
      {
        id: 'streak-7',
        title: 'Racha de 7 días',
        description: 'Mantuviste una racha de 7 días activos',
        icon: achievementIcon('streak-7'),
        unlocked: stats.currentStreak >= 7,
        progress: Math.min(stats.currentStreak, 7),
        target: 7,
      },
      {
        id: 'dedication',
        title: 'Dedicación',
        description: 'Completaste 10 sesiones de entrenamiento',
        icon: achievementIcon('dedication'),
        unlocked: stats.totalSessions >= 10,
        progress: Math.min(stats.totalSessions, 10),
        target: 10,
      },
      {
        id: 'warrior',
        title: 'Guerrero del fitness',
        description: 'Completaste 25 sesiones de entrenamiento',
        icon: achievementIcon('warrior'),
        unlocked: stats.totalSessions >= 25,
        progress: Math.min(stats.totalSessions, 25),
        target: 25,
      },
      {
        id: 'legend',
        title: 'Leyenda del gimnasio',
        description: 'Completaste 50 sesiones de entrenamiento',
        icon: achievementIcon('legend'),
        unlocked: stats.totalSessions >= 50,
        progress: Math.min(stats.totalSessions, 50),
        target: 50,
      },
      {
        id: 'consistency',
        title: 'Consistencia',
        description: 'Entrenaste en 10 días distintos',
        icon: achievementIcon('consistency'),
        unlocked: stats.activeDays >= 10,
        progress: Math.min(stats.activeDays, 10),
        target: 10,
      },
    ];
  }, [stats, gamification]);

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);
  const nextGoal = gamification?.nextAchievement
    ? mapAchievementView(gamification.nextAchievement)
    : lockedAchievements[0];
  const motivationalMessage = pickMotivationalPhraseForDate(
    stats.lastSessionDate?.toISOString() ?? userProfile.lastWorkoutDate,
  );

  const sessionHistoryItems = useMemo(
    () =>
      history.map((item) => {
        const completed = sessionDate(item);
        return buildSessionHistoryItem(
          item,
          historyToShareData(item, profileBodyWeightKg),
          completed,
        );
      }),
    [history, profileBodyWeightKg],
  );

  const fitCoins = gamification?.counters.fitCoinsBalance ?? seedGamification?.counters.fitCoinsBalance ?? 0;
  const seasonPoints = gamification?.counters.seasonPoints ?? seedGamification?.counters.seasonPoints ?? 0;
  const seasonId = gamification?.counters.currentSeasonId ?? seedGamification?.counters.currentSeasonId ?? '2026-07';
  const seasonSessions = gamification?.counters.seasonSessionsCompleted ?? seedGamification?.counters.seasonSessionsCompleted ?? 0;
  const seasonWeeksPerfect = gamification?.counters.seasonWeeksPerfect ?? seedGamification?.counters.seasonWeeksPerfect ?? 0;

  return (
    <div className="fixed inset-0 bg-zinc-950/95 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[92dvh] overflow-hidden flex flex-col">
        <div className="relative shrink-0 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 border-b border-zinc-800/90 overflow-hidden">
          <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-lime-500/10 blur-3xl" />
          <button
            type="button"
            onClick={onClose}
            className="relative mb-4 p-2 -ml-2 text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-lime-400/90">
                  GYM FitGen
                </p>
              </div>
              <h2 className="text-2xl font-bold text-white mt-2 leading-tight">
                {userProfile.profileData?.name || 'Atleta'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 capitalize">
                {formatSeasonLabel(seasonId)} · Progreso y recompensas
              </p>
            </div>
            <div className="shrink-0 rounded-2xl border border-lime-500/20 bg-lime-500/10 px-3 py-2 text-right">
              <div className="flex items-center justify-end gap-1.5">
                <FitCoinIcon size={16} />
                <span className="text-[9px] uppercase tracking-wider text-lime-400 font-semibold">FitCoins</span>
              </div>
              <p className="text-lg font-bold text-white tabular-nums mt-0.5">{formatFitCoins(fitCoins)}</p>
            </div>
          </div>

          <div className="relative mt-4 -mx-1 overflow-x-auto scrollbar-none">
            <div className="flex gap-1.5 p-1 min-w-max">
              {HUB_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-semibold transition-colors ${
                    activeTab === id
                      ? 'bg-lime-500/15 text-lime-300 ring-1 ring-lime-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loadingHistory || (loadingGamification && !gamification) ? (
            <p className="text-sm text-zinc-500 py-10 text-center">Cargando tu GYM…</p>
          ) : (
            <>
              {activeTab === 'home' && (
                <>
                  <HubHomeTab
                    athleteName={userProfile.profileData?.name || 'Atleta'}
                    fitCoins={fitCoins}
                    seasonPoints={seasonPoints}
                    totalSessions={stats.totalSessions}
                    currentStreak={stats.currentStreak}
                    weeksCompleted={stats.weeksCompleted}
                    mesocyclesCompleted={stats.mesocyclesCompleted}
                    activeDays={stats.activeDays}
                    lastSessionDate={stats.lastSessionDate}
                    motivationalMessage={motivationalMessage}
                    currentWeekMessage={stats.currentWeekMessage}
                    previousWeekMessage={stats.previousWeekMessage}
                    mesocycleWeekDone={stats.currentWeekProgress}
                    mesocycleWeekPlanned={stats.currentWeekTarget}
                    avatarBaseStage={gamification?.avatar.baseStage ?? 0}
                    avatarAppearance={{
                      ...avatarAppearance,
                      startingBuild: displayStartingBuild,
                    }}
                    avatarGender={avatarGender}
                    avatarStartingBuild={avatarChosen ? displayStartingBuild : null}
                    onSaveAvatarStartingBuild={handleSaveAvatarStartingBuild}
                    savingAvatar={savingAvatar}
                    nextGoal={nextGoal ?? null}
                    onGoAchievements={() => setActiveTab('achievements')}
                    onGoSeason={() => setActiveTab('season')}
                  />
                  <div className="mt-5">
                    <BodyMetricsTrendSection
                      entries={bodyMetricEntries}
                      onRegister={() => setShowBodyCheckinModal(true)}
                    />
                  </div>
                </>
              )}

              {activeTab === 'achievements' && (
                <HubAchievementsTab
                  achievementSections={achievementSections}
                  unlockedCount={unlockedAchievements.length}
                  totalCount={achievements.length}
                />
              )}

              {activeTab === 'season' && (
                <HubSeasonTab
                  seasonId={seasonId}
                  seasonPoints={seasonPoints}
                  seasonSessions={seasonSessions}
                  seasonWeeksPerfect={seasonWeeksPerfect}
                  fitCoins={fitCoins}
                />
              )}

              {activeTab === 'sessions' && (
                <HubSessionsTab loading={loadingHistory} items={sessionHistoryItems} />
              )}

              {activeTab === 'ranking' && (
                <HubRankingTab
                  authToken={authToken}
                  seasonPoints={seasonPoints}
                  seasonId={seasonId}
                />
              )}

              {activeTab === 'shop' && (
                <HubShopTab
                  authToken={authToken}
                  fitCoins={fitCoins}
                  onBalanceChange={(balance) => {
                    setGamification((current) =>
                      current
                        ? {
                            ...current,
                            counters: { ...current.counters, fitCoinsBalance: balance },
                          }
                        : current,
                    );
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <BodyMetricsCheckinModal
        open={showBodyCheckinModal}
        authToken={authToken}
        initialWeightKg={
          userProfile.profileData?.currentWeightKg ?? userProfile.profileData?.initialWeight
        }
        onClose={() => setShowBodyCheckinModal(false)}
        onSaved={() => {
          void fetchBodyCheckinStatus(authToken)
            .then((data) => {
              if (data.recent?.length) setBodyMetricEntries(data.recent.slice().reverse());
            })
            .catch(() => undefined);
        }}
      />
    </div>
  );
};

export default StatsAndAchievements;
