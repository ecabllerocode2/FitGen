import { useState, useMemo, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  Trophy,
  Target,
  Calendar,
  Flame,
  Star,
  TrendingUp,
  Award,
  Dumbbell,
  CheckCircle2,
  ArrowLeft,
  Crown,
  Medal,
  Clock,
  Layers,
} from 'lucide-react';
import { format, differenceInDays, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppEyebrow } from './ui/AppPrimitives';
import { fetchRecentSessions, type RecentSessionRow } from '../utils/recentSessions';
import { db } from '../firebase';
import { pickMotivationalPhraseForDate } from '../utils/motivationalPhrases';

interface HistorySession {
  id: string;
  sessionFocus: string;
  completedAt: string | null;
  weekNumber?: number | null;
  summary?: {
    durationLabel?: string;
    exerciseCount?: number;
    totalSets?: number;
    muscles?: string[];
  };
  celebrationCardUrl?: string | null;
  celebrationSummary?: RecentSessionRow['celebrationSummary'];
}

interface StatsAndAchievementsProps {
  userProfile: {
    createdAt?: string;
    lastWorkoutDate?: string;
    currentMesocycle?: {
      currentWeek?: number;
      progress?: number;
      mesocyclePlan?: {
        microcycles?: Array<{
          week: number;
          sessions: Array<{ dayOfWeek: string; sessionFocus: string }>;
        }>;
      };
      startDate?: string;
    };
    profileData?: { name?: string };
  };
  onClose: () => void;
  initialSection?: 'stats' | 'celebrations';
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
}

function mapRow(row: RecentSessionRow): HistorySession {
  return {
    id: row.id,
    sessionFocus: row.sessionFocus ?? 'Entrenamiento',
    completedAt: row.completedAt ?? row.archivedAt ?? null,
    weekNumber: row.weekNumber,
    summary: {
      durationLabel: row.summary?.duracionEstimada ?? row.celebrationSummary?.durationLabel ?? '—',
      exerciseCount: row.summary?.ejerciciosTotales ?? row.celebrationSummary?.exerciseCount ?? 0,
      totalSets: row.summary?.seriesTotales ?? row.celebrationSummary?.totalSets ?? 0,
      muscles: row.summary?.musculosTrabajos ?? row.celebrationSummary?.muscles ?? [],
    },
    celebrationCardUrl: row.celebrationCardUrl ?? null,
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

const StatsAndAchievements: React.FC<StatsAndAchievementsProps> = ({
  userProfile,
  onClose,
  initialSection = 'stats',
}) => {
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeSection, setActiveSection] = useState<'stats' | 'celebrations'>(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const rows = await fetchRecentSessions(db, user.uid, 40);
        setHistory(rows.filter((s) => s.completed !== false).map(mapRow));
      } catch (err) {
        console.warn('No se pudo cargar historial:', err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, []);

  const stats = useMemo(() => {
    const datedSessions = history
      .map((s) => ({ session: s, date: sessionDate(s) }))
      .filter((row): row is { session: HistorySession; date: Date } => row.date != null)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const totalSessions = datedSessions.length;

    const activeDayKeys = new Set(
      datedSessions.map(({ date }) => format(date, 'yyyy-MM-dd')),
    );
    const activeDays = activeDayKeys.size;

    let currentStreak = 0;
    if (datedSessions.length > 0) {
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

    let weeksCompleted = 0;
    let currentWeekProgress = 0;
    let currentWeekTarget = 0;
    let currentWeekMessage = '';

    const mesocycle = userProfile.currentMesocycle;
    if (mesocycle?.mesocyclePlan?.microcycles && mesocycle.startDate) {
      const mesocycleStartDate = parseISO(mesocycle.startDate);
      const sessionsByWeek: Record<number, number> = {};

      datedSessions.forEach(({ date }) => {
        if (date >= mesocycleStartDate) {
          const weekIdx =
            Math.floor(differenceInDays(date, mesocycleStartDate) / 7) + 1;
          sessionsByWeek[weekIdx] = (sessionsByWeek[weekIdx] || 0) + 1;
        }
      });

      mesocycle.mesocyclePlan.microcycles.forEach((microcycle) => {
        const weekNum = microcycle.week;
        const planned = microcycle.sessions.length;
        const done = sessionsByWeek[weekNum] || 0;
        if (done >= planned) weeksCompleted++;

        if (weekNum === mesocycle.currentWeek) {
          currentWeekProgress = done;
          currentWeekTarget = planned;
          const weekEnd = new Date(mesocycleStartDate);
          weekEnd.setDate(weekEnd.getDate() + weekNum * 7);
          if (new Date() > weekEnd && done < planned) {
            currentWeekMessage = `Esta semana completaste ${done} de ${planned} sesiones. La siguiente es una nueva oportunidad.`;
          }
        }
      });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentCount = datedSessions.filter(({ date }) => date >= thirtyDaysAgo).length;
    const monthsCompleted = recentCount >= 14 ? 1 : 0;

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
      lastSessionDate,
    };
  }, [history, userProfile.currentMesocycle]);

  const achievements: Achievement[] = useMemo(() => {
    const firstDate = history.length
      ? [...history]
          .map((s) => sessionDate(s))
          .filter(Boolean)
          .sort((a, b) => (a!.getTime() - b!.getTime()))[0]
          ?.toISOString()
      : undefined;

    return [
      {
        id: 'first-session',
        title: 'Primera sesión',
        description: 'Completaste tu primera sesión de entrenamiento',
        icon: <Dumbbell className="w-7 h-7" />,
        unlocked: stats.totalSessions >= 1,
        unlockedDate: firstDate,
      },
      {
        id: 'first-week',
        title: 'Primera semana',
        description: 'Completaste todas las sesiones programadas en una semana',
        icon: <Calendar className="w-7 h-7" />,
        unlocked: stats.weeksCompleted >= 1,
        progress: stats.currentWeekProgress,
        target: stats.currentWeekTarget || 4,
      },
      {
        id: 'first-month',
        title: 'Primer mesociclo',
        description: 'Completaste al menos el 80% de sesiones en los últimos 30 días',
        icon: <Trophy className="w-7 h-7" />,
        unlocked: stats.monthsCompleted >= 1,
        progress: Math.min(stats.totalSessions, 14),
        target: 14,
      },
      {
        id: 'streak-7',
        title: 'Racha de 7 días',
        description: 'Mantuviste una racha de 7 días activos',
        icon: <Flame className="w-7 h-7" />,
        unlocked: stats.currentStreak >= 7,
        progress: Math.min(stats.currentStreak, 7),
        target: 7,
      },
      {
        id: 'dedication',
        title: 'Dedicación',
        description: 'Completaste 10 sesiones de entrenamiento',
        icon: <Star className="w-7 h-7" />,
        unlocked: stats.totalSessions >= 10,
        progress: Math.min(stats.totalSessions, 10),
        target: 10,
      },
      {
        id: 'warrior',
        title: 'Guerrero del fitness',
        description: 'Completaste 25 sesiones de entrenamiento',
        icon: <Medal className="w-7 h-7" />,
        unlocked: stats.totalSessions >= 25,
        progress: Math.min(stats.totalSessions, 25),
        target: 25,
      },
      {
        id: 'legend',
        title: 'Leyenda del gimnasio',
        description: 'Completaste 50 sesiones de entrenamiento',
        icon: <Crown className="w-7 h-7" />,
        unlocked: stats.totalSessions >= 50,
        progress: Math.min(stats.totalSessions, 50),
        target: 50,
      },
      {
        id: 'consistency',
        title: 'Consistencia',
        description: 'Entrenaste en 10 días distintos',
        icon: <TrendingUp className="w-7 h-7" />,
        unlocked: stats.activeDays >= 10,
        progress: Math.min(stats.activeDays, 10),
        target: 10,
      },
    ];
  }, [stats, history]);

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);
  const nextGoal = lockedAchievements[0];
  const motivationalMessage = pickMotivationalPhraseForDate(
    stats.lastSessionDate?.toISOString() ?? userProfile.lastWorkoutDate,
  );

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return history.filter((s) => {
      const d = sessionDate(s);
      return d && d >= weekStart && d <= weekEnd;
    }).length;
  }, [history]);

  return (
    <div className="fixed inset-0 bg-zinc-950/95 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[92dvh] overflow-hidden">
        <div className="px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5 border-b border-zinc-800/90">
          <button
            type="button"
            onClick={onClose}
            className="mb-5 p-2 -ml-2 text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <AppEyebrow>Progreso</AppEyebrow>
          <h2 className="text-2xl font-bold text-white mt-3">Estadísticas y logros</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {userProfile.profileData?.name || 'Atleta'}
          </p>
        </div>

        <div className="overflow-y-auto max-h-[calc(92dvh-8rem)] px-6 py-6 space-y-6">
          <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveSection('stats')}
              className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-colors ${
                activeSection === 'stats'
                  ? 'bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Estadísticas
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('celebrations')}
              className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-colors ${
                activeSection === 'celebrations'
                  ? 'bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/30'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sesiones ({stats.totalSessions})
            </button>
          </div>

          {activeSection === 'celebrations' ? (
            <section className="space-y-4">
              <p className="text-sm text-zinc-400 leading-relaxed">
                Historial de sesiones completadas. Las tarjetas con imagen aparecen cuando el almacenamiento está activo.
              </p>

              {loadingHistory ? (
                <p className="text-sm text-zinc-500 py-8 text-center">Cargando historial…</p>
              ) : history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center">
                  <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Aún no hay sesiones registradas. Completa tu primer entrenamiento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => {
                    const completed = sessionDate(item);
                    const summary = item.celebrationSummary ?? item.summary;
                    const focus = item.sessionFocus ?? 'Entrenamiento';
                    const cardUrl = item.celebrationCardUrl;
                    const completedLabel = completed
                      ? format(completed, "EEEE d MMM · HH:mm", { locale: es })
                      : null;

                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
                      >
                        {cardUrl ? (
                          <img
                            src={cardUrl}
                            alt={`Resumen de ${focus}`}
                            className="w-full aspect-[4/5] object-cover bg-zinc-950"
                            loading="lazy"
                          />
                        ) : (
                          <div className="px-4 pt-4 pb-2">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-lime-500/70 mb-2">
                              Sesión completada
                            </p>
                            <p className="text-lg font-semibold text-white">{focus}</p>
                            {completedLabel && (
                              <p className="text-xs text-zinc-500 mt-1 capitalize">{completedLabel}</p>
                            )}
                            <div className="grid grid-cols-3 gap-2 mt-4">
                              <div className="rounded-xl bg-zinc-950/80 ring-1 ring-zinc-800 px-2 py-2 text-center">
                                <Clock className="w-3.5 h-3.5 text-zinc-500 mx-auto mb-1" />
                                <p className="text-sm font-semibold text-white tabular-nums">
                                  {summary?.durationLabel ?? '—'}
                                </p>
                              </div>
                              <div className="rounded-xl bg-zinc-950/80 ring-1 ring-zinc-800 px-2 py-2 text-center">
                                <Dumbbell className="w-3.5 h-3.5 text-zinc-500 mx-auto mb-1" />
                                <p className="text-sm font-semibold text-white tabular-nums">
                                  {summary?.exerciseCount ?? 0}
                                </p>
                              </div>
                              <div className="rounded-xl bg-zinc-950/80 ring-1 ring-zinc-800 px-2 py-2 text-center">
                                <Layers className="w-3.5 h-3.5 text-zinc-500 mx-auto mb-1" />
                                <p className="text-sm font-semibold text-white tabular-nums">
                                  {summary?.totalSets ?? 0}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {cardUrl && (
                          <div className="p-4 space-y-3 border-t border-zinc-800/80">
                            <div>
                              <p className="text-sm font-semibold text-white">{focus}</p>
                              {completedLabel && (
                                <p className="text-xs text-zinc-500 mt-0.5 capitalize">{completedLabel}</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={cardUrl}
                                download={`fitgen-${item.id}.png`}
                                className="flex-1 text-center rounded-xl border border-zinc-700 py-2.5 text-xs font-medium text-zinc-200 hover:border-zinc-600"
                              >
                                Descargar
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    if (navigator.share) {
                                      await navigator.share({
                                        title: 'FitGen — Sesión completada',
                                        text: `Completé ${focus} con FitGen.`,
                                        url: cardUrl,
                                      });
                                    } else {
                                      window.open(cardUrl, '_blank');
                                    }
                                  } catch {
                                    /* cancelled */
                                  }
                                }}
                                className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-xs font-medium text-zinc-200 hover:border-zinc-600"
                              >
                                Compartir
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            <>
              {loadingHistory ? (
                <p className="text-sm text-zinc-500 py-6 text-center">Calculando tu progreso…</p>
              ) : (
                <>
                  <div className="rounded-2xl border border-lime-500/20 bg-gradient-to-br from-lime-500/10 via-zinc-900/80 to-zinc-950 p-5">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80 mb-2">
                      Total acumulado
                    </p>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-5xl font-bold text-white tabular-nums leading-none">
                          {stats.totalSessions}
                        </p>
                        <p className="text-sm text-zinc-400 mt-2">
                          {stats.totalSessions === 1 ? 'sesión completada' : 'sesiones completadas'}
                        </p>
                      </div>
                      {stats.lastSessionDate && (
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Última sesión</p>
                          <p className="text-sm text-zinc-300 mt-1">
                            {format(stats.lastSessionDate, "d MMM", { locale: es })}
                          </p>
                        </div>
                      )}
                    </div>
                    {thisWeekCount > 0 && (
                      <p className="text-xs text-lime-400/90 mt-4 pt-4 border-t border-lime-500/10">
                        {thisWeekCount} {thisWeekCount === 1 ? 'sesión' : 'sesiones'} esta semana
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Racha', value: stats.currentStreak, icon: Flame },
                      { label: 'Semanas', value: stats.weeksCompleted, icon: Calendar },
                      { label: 'Días activo', value: stats.activeDays, icon: TrendingUp },
                      { label: 'Logros', value: unlockedAchievements.length, icon: Award },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                      >
                        <Icon className="w-4 h-4 text-lime-500/70 mb-3" />
                        <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
                        <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-4">
                    <p className="text-sm text-zinc-300 leading-relaxed italic">{motivationalMessage}</p>
                  </div>

                  {stats.currentWeekMessage && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
                        Esta semana
                      </p>
                      <p className="text-sm text-zinc-400">{stats.currentWeekMessage}</p>
                    </div>
                  )}

                  {nextGoal && stats.totalSessions > 0 && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-500/70 mb-2">
                        Próximo logro
                      </p>
                      <p className="text-base font-semibold text-white">{nextGoal.title}</p>
                      <p className="text-sm text-zinc-500 mt-1 mb-3">{nextGoal.description}</p>
                      {nextGoal.progress !== undefined && nextGoal.target ? (
                        <div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-lime-500 transition-all duration-500"
                              style={{
                                width: `${Math.min(100, (nextGoal.progress / nextGoal.target) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-2 tabular-nums">
                            {nextGoal.progress} / {nextGoal.target}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {unlockedAchievements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Award className="w-4 h-4 text-lime-500" />
                        Desbloqueados ({unlockedAchievements.length})
                      </h3>
                      <div className="space-y-2">
                        {unlockedAchievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className="flex items-start gap-3 rounded-xl border border-lime-500/25 bg-lime-500/5 px-4 py-3"
                          >
                            <div className="text-lime-400 shrink-0 mt-0.5">{achievement.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white text-sm">{achievement.title}</h4>
                              <p className="text-xs text-zinc-400 mt-0.5">{achievement.description}</p>
                              {achievement.unlockedDate && (
                                <p className="text-[10px] text-lime-500/70 mt-2">
                                  {format(parseISO(achievement.unlockedDate), "d MMM yyyy", { locale: es })}
                                </p>
                              )}
                            </div>
                            <CheckCircle2 className="w-4 h-4 text-lime-500 shrink-0 mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {lockedAchievements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-500 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Por desbloquear ({lockedAchievements.length})
                      </h3>
                      <div className="space-y-2">
                        {lockedAchievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
                          >
                            <div className="text-zinc-600 shrink-0 mt-0.5">{achievement.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-zinc-300 text-sm">{achievement.title}</h4>
                              <p className="text-xs text-zinc-600 mt-0.5 mb-2">{achievement.description}</p>
                              {achievement.progress !== undefined && achievement.target ? (
                                <div>
                                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-zinc-600 transition-all duration-500"
                                      style={{
                                        width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <p className="text-[10px] text-zinc-600 mt-1.5 tabular-nums">
                                    {achievement.progress} / {achievement.target}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stats.totalSessions === 0 && (
                    <div className="text-center py-8 rounded-2xl border border-dashed border-zinc-800">
                      <Dumbbell className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-white mb-2">Tu viaje empieza hoy</h3>
                      <p className="text-sm text-zinc-500 px-6">
                        Completa tu primera sesión para ver estadísticas y desbloquear logros
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsAndAchievements;
