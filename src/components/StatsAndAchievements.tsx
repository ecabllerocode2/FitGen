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
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppEyebrow } from './ui/AppPrimitives';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';

interface HistorySession {
  feedback?: {
    completedAt?: string;
  };
  [key: string]: unknown;
}

interface CelebrationCard {
  id: string;
  celebrationCardUrl: string;
  celebrationCardExpiresAt?: string;
  celebrationSummary: {
    sessionFocus: string;
    durationLabel: string;
    exerciseCount: number;
    totalSets: number;
    muscles?: string[];
    completedAt?: string;
  };
}

interface StatsAndAchievementsProps {
  userProfile: {
    createdAt: string;
    lastWorkoutDate?: string;
    _history?: Record<string, HistorySession>;
    currentMesocycle?: {
      currentWeek: number;
      progress: number;
      mesocyclePlan?: {
        microcycles?: Array<{
          week: number;
          sessions: Array<{
            dayOfWeek: string;
            sessionFocus: string;
          }>;
        }>;
      };
      startDate?: string;
    };
    profileData?: {
      name?: string;
    };
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

const StatsAndAchievements: React.FC<StatsAndAchievementsProps> = ({
  userProfile,
  onClose,
  initialSection = 'stats',
}) => {
  const [celebrations, setCelebrations] = useState<CelebrationCard[]>([]);
  const [loadingCelebrations, setLoadingCelebrations] = useState(true);
  const [activeSection, setActiveSection] = useState<'stats' | 'celebrations'>(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    const loadCelebrations = async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const res = await authenticatedFetch(API_ENDPOINTS.SESSION_CELEBRATIONS, token);
        if (!res.ok) return;
        const data = await res.json();
        setCelebrations(data.celebrations ?? []);
      } catch (err) {
        console.warn('No se pudieron cargar celebraciones:', err);
      } finally {
        setLoadingCelebrations(false);
      }
    };
    loadCelebrations();
  }, []);
  // Calcular estadísticas
  const stats = useMemo(() => {
    const history = userProfile._history || {};
    const historyArray = Object.values(history);
    const totalSessions = historyArray.length;
    const createdDate = parseISO(userProfile.createdAt);
    const daysSinceJoined = differenceInDays(new Date(), createdDate);
    
    // Calcular racha actual
    let currentStreak = 0;
    if (userProfile.lastWorkoutDate) {
      const lastWorkout = parseISO(userProfile.lastWorkoutDate);
      const daysSinceLastWorkout = differenceInDays(new Date(), lastWorkout);
      if (daysSinceLastWorkout <= 2) {
        // Contar sesiones consecutivas
        const sortedSessions = historyArray
          .sort((a, b) => 
            new Date(b.feedback?.completedAt || 0).getTime() - 
            new Date(a.feedback?.completedAt || 0).getTime()
          );
        
        currentStreak = 1;
        for (let i = 1; i < sortedSessions.length; i++) {
          const prevSession = sortedSessions[i - 1];
          const currSession = sortedSessions[i];
          const prevDate = new Date(prevSession.feedback?.completedAt || 0);
          const currDate = new Date(currSession.feedback?.completedAt || 0);
          const daysDiff = differenceInDays(prevDate, currDate);
          
          if (daysDiff <= 3) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
    }
    
    // Calcular semanas completadas basado en el mesociclo actual
    let weeksCompleted = 0;
    let currentWeekProgress = 0;
    let currentWeekTarget = 0;
    let currentWeekMessage = '';
    
    if (userProfile.currentMesocycle?.mesocyclePlan?.microcycles) {
      const microcycles = userProfile.currentMesocycle.mesocyclePlan.microcycles;
      const mesocycleStartDate = userProfile.currentMesocycle.startDate 
        ? parseISO(userProfile.currentMesocycle.startDate) 
        : null;
      
      if (mesocycleStartDate) {
        // Agrupar sesiones por semana
        const sessionsByWeek: Record<number, number> = {};
        
        historyArray.forEach((session) => {
          const sessionDate = session.feedback?.completedAt 
            ? parseISO(session.feedback.completedAt) 
            : null;
          
          if (sessionDate && sessionDate >= mesocycleStartDate) {
            const weeksSinceStart = Math.floor(
              differenceInDays(sessionDate, mesocycleStartDate) / 7
            ) + 1;
            
            sessionsByWeek[weeksSinceStart] = (sessionsByWeek[weeksSinceStart] || 0) + 1;
          }
        });
        
        // Contar semanas completadas (donde se cumplieron todas las sesiones programadas)
        microcycles.forEach((microcycle) => {
          const weekNum = microcycle.week;
          const sessionsPlanned = microcycle.sessions.length;
          const sessionsCompleted = sessionsByWeek[weekNum] || 0;
          
          if (sessionsCompleted >= sessionsPlanned) {
            weeksCompleted++;
          }
          
          // Si es la semana actual, guardar el progreso
          if (weekNum === userProfile.currentMesocycle?.currentWeek) {
            currentWeekProgress = sessionsCompleted;
            currentWeekTarget = sessionsPlanned;
            
            // Verificar si la semana ya pasó y no se completó
            const weekEndDate = new Date(mesocycleStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + (weekNum * 7));
            
            if (new Date() > weekEndDate && sessionsCompleted < sessionsPlanned) {
              currentWeekMessage = `Esta semana no pudiste completar todas las sesiones (${sessionsCompleted}/${sessionsPlanned}), ¡pero sabemos que la siguiente semana lo vas a lograr! 💪`;
            }
          }
        });
      }
    }
    
    // Calcular mesociclos completados (80% de sesiones en los últimos 30 días)
    let monthsCompleted = 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSessions = historyArray.filter((session) => {
      const sessionDate = session.feedback?.completedAt 
        ? parseISO(session.feedback.completedAt) 
        : null;
      return sessionDate && sessionDate >= thirtyDaysAgo;
    });
    
    // Asumiendo 4 sesiones por semana, en 30 días hay aproximadamente 17 sesiones esperadas
    // 80% de 17 = ~14 sesiones
    const expectedSessionsInMonth = 17;
    const requiredForCompletion = Math.ceil(expectedSessionsInMonth * 0.8);
    
    if (recentSessions.length >= requiredForCompletion) {
      monthsCompleted = 1;
    }
    
    return {
      totalSessions,
      currentStreak,
      weeksCompleted,
      monthsCompleted,
      daysSinceJoined,
      currentWeekProgress,
      currentWeekTarget,
      currentWeekMessage,
    };
  }, [userProfile]);

  // Definir logros/insignias
  const achievements: Achievement[] = useMemo(() => {
    const firstSessionDate = userProfile._history 
      ? Object.values(userProfile._history)[0]?.feedback?.completedAt || undefined
      : undefined;

    return [
      {
        id: 'first-session',
        title: '¡Primera Sesión!',
        description: 'Completaste tu primera sesión de entrenamiento',
        icon: <Dumbbell className="w-8 h-8" />,
        unlocked: stats.totalSessions >= 1,
        unlockedDate: firstSessionDate,
      },
      {
        id: 'first-week',
        title: 'Primera Semana',
        description: 'Completaste todas las sesiones programadas en una semana',
        icon: <Calendar className="w-8 h-8" />,
        unlocked: stats.weeksCompleted >= 1,
        progress: stats.currentWeekProgress,
        target: stats.currentWeekTarget || 4,
      },
      {
        id: 'first-month',
        title: 'Primer Mesociclo',
        description: 'Completaste al menos el 80% de sesiones en los últimos 30 días',
        icon: <Trophy className="w-8 h-8" />,
        unlocked: stats.monthsCompleted >= 1,
      },
      {
        id: 'streak-7',
        title: 'Racha de 7 Días',
        description: 'Mantuviste una racha de 7 sesiones consecutivas',
        icon: <Flame className="w-8 h-8" />,
        unlocked: stats.currentStreak >= 7,
        progress: Math.min(stats.currentStreak, 7),
        target: 7,
      },
      {
        id: 'dedication',
        title: 'Dedicación',
        description: 'Completaste 10 sesiones de entrenamiento',
        icon: <Star className="w-8 h-8" />,
        unlocked: stats.totalSessions >= 10,
        progress: Math.min(stats.totalSessions, 10),
        target: 10,
      },
      {
        id: 'warrior',
        title: 'Guerrero/a del Fitness',
        description: 'Completaste 25 sesiones de entrenamiento',
        icon: <Medal className="w-8 h-8" />,
        unlocked: stats.totalSessions >= 25,
        progress: Math.min(stats.totalSessions, 25),
        target: 25,
      },
      {
        id: 'legend',
        title: 'Leyenda del Gimnasio',
        description: 'Completaste 50 sesiones de entrenamiento',
        icon: <Crown className="w-8 h-8" />,
        unlocked: stats.totalSessions >= 50,
        progress: Math.min(stats.totalSessions, 50),
        target: 50,
      },
      {
        id: 'consistency',
        title: 'Consistencia',
        description: 'Llevas más de 30 días desde que empezaste',
        icon: <TrendingUp className="w-8 h-8" />,
        unlocked: stats.daysSinceJoined >= 30,
        progress: Math.min(stats.daysSinceJoined, 30),
        target: 30,
      },
    ];
  }, [stats, userProfile._history]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  // Próximo objetivo
  const nextGoal = lockedAchievements[0];

  // Mensajes motivacionales
  const motivationalMessages = useMemo(() => [
    '💪 Cada sesión te acerca más a tu mejor versión',
    '🔥 La consistencia es la clave del éxito',
    '⚡ No se trata de ser el mejor, sino de ser mejor que ayer',
    '🎯 Tu único límite eres tú mismo',
    '🚀 El progreso es progreso, sin importar qué tan pequeño',
    '💎 Los campeones se hacen cuando nadie está mirando',
    '🏆 El dolor de hoy es la fuerza de mañana',
  ], []);

  const [randomMessage] = useState(() => 
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );

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

        <div className="overflow-y-auto max-h-[calc(92dvh-8rem)] px-6 py-6 space-y-8">
          <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveSection('stats')}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                activeSection === 'stats'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Estadísticas
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('celebrations')}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                activeSection === 'celebrations'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sesiones recientes
            </button>
          </div>

          {activeSection === 'celebrations' ? (
            <section className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
                  Últimos 7 días
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Tarjetas de tus sesiones completadas. Descárgalas o compártelas cuando quieras.
                </p>
              </div>

              {loadingCelebrations ? (
                <p className="text-sm text-zinc-500 py-8 text-center">Cargando resúmenes…</p>
              ) : celebrations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center">
                  <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                  <p className="text-sm text-zinc-500">
                    Aún no hay tarjetas guardadas. Completa una sesión para ver tu resumen aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {celebrations.map((item) => {
                    const summary = item.celebrationSummary;
                    const completedLabel = summary.completedAt
                      ? format(parseISO(summary.completedAt), "d MMM · HH:mm", { locale: es })
                      : null;
                    return (
                      <article
                        key={item.id}
                        className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
                      >
                        <img
                          src={item.celebrationCardUrl}
                          alt={`Resumen de ${summary.sessionFocus}`}
                          className="w-full aspect-[4/5] object-cover bg-zinc-950"
                          loading="lazy"
                        />
                        <div className="p-4 space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{summary.sessionFocus}</p>
                            {completedLabel ? (
                              <p className="text-xs text-zinc-500 mt-0.5">{completedLabel}</p>
                            ) : null}
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={item.celebrationCardUrl}
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
                                      text: `Completé ${summary.sessionFocus} con FitGen.`,
                                      url: item.celebrationCardUrl,
                                    });
                                  } else {
                                    window.open(item.celebrationCardUrl, '_blank');
                                  }
                                } catch {
                                  // user cancelled share
                                }
                              }}
                              className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-xs font-medium text-zinc-200 hover:border-zinc-600"
                            >
                              Compartir
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
          <>
          <div className="grid grid-cols-2 gap-px bg-zinc-800 rounded-xl overflow-hidden">
            <div className="bg-zinc-950 p-4">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-4 h-4 text-lime-500/70" />
                <span className="text-2xl font-bold text-white tabular-nums">{stats.totalSessions}</span>
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Sesiones</p>
            </div>

            <div className="bg-zinc-950 p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-4 h-4 text-lime-500/70" />
                <span className="text-2xl font-bold text-white tabular-nums">{stats.currentStreak}</span>
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Racha</p>
            </div>

            <div className="bg-zinc-950 p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-4 h-4 text-lime-500/70" />
                <span className="text-2xl font-bold text-white tabular-nums">{stats.weeksCompleted}</span>
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Semanas</p>
            </div>

            <div className="bg-zinc-950 p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-4 h-4 text-lime-500/70" />
                <span className="text-2xl font-bold text-white tabular-nums">{stats.daysSinceJoined}</span>
              </div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Días activo</p>
            </div>
          </div>

          <div className="py-4 border-y border-zinc-800/90">
            <p className="text-sm text-zinc-400 leading-relaxed">{randomMessage}</p>
          </div>
          {stats.currentWeekMessage && (
            <div className="py-4 border-b border-zinc-800/90">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Esta semana</p>
              <p className="text-sm text-zinc-400">{stats.currentWeekMessage}</p>
            </div>
          )}
          {nextGoal && (
            <div className="py-4 border-b border-zinc-800/90">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Próximo logro</p>
              <p className="text-base font-semibold text-white mb-1">{nextGoal.title}</p>
              <p className="text-sm text-zinc-500 mb-3">{nextGoal.description}</p>
              {nextGoal.progress !== undefined && nextGoal.target && (
                <div>
                  <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-500 transition-all duration-500"
                      style={{ width: `${(nextGoal.progress / nextGoal.target) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 tabular-nums">
                    {nextGoal.progress} / {nextGoal.target}
                  </p>
                </div>
              )}
            </div>
          )}

          {unlockedAchievements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-lime-500/70" />
                Desbloqueados ({unlockedAchievements.length})
              </h3>
              <div className="space-y-0">
                {unlockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-4 py-4 border-b border-zinc-800/90 last:border-0"
                  >
                    <div className="text-lime-500/80 shrink-0">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm">{achievement.title}</h4>
                      <p className="text-sm text-zinc-500 mt-0.5">{achievement.description}</p>
                      {achievement.unlockedDate && (
                        <p className="text-[10px] text-zinc-600 mt-2">
                          {format(parseISO(achievement.unlockedDate), "d MMM yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-lime-500 shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {lockedAchievements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-500 mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Por desbloquear ({lockedAchievements.length})
              </h3>
              <div className="space-y-0">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-start gap-4 py-4 border-b border-zinc-800/90 last:border-0 opacity-70"
                  >
                    <div className="text-zinc-600 shrink-0">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-zinc-400 text-sm">{achievement.title}</h4>
                      <p className="text-sm text-zinc-600 mt-0.5 mb-2">{achievement.description}</p>
                      {achievement.progress !== undefined && achievement.target && (
                        <div>
                          <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-zinc-600 transition-all duration-500"
                              style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-zinc-600 mt-1.5 tabular-nums">
                            {achievement.progress} / {achievement.target}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.totalSessions === 0 && (
            <div className="text-center py-10">
              <Dumbbell className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Tu viaje empieza hoy</h3>
              <p className="text-sm text-zinc-500">Completa tu primera sesión para desbloquear logros</p>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsAndAchievements;
