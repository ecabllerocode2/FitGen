import React, { useMemo, useState } from 'react';
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
  Zap,
  Crown,
  Medal,
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorySession {
  feedback?: {
    completedAt?: string;
  };
  [key: string]: unknown;
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
}) => {
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-emerald-500/20">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Tus Estadísticas y Logros
              </h2>
              <p className="text-emerald-100 text-sm">
                {userProfile.profileData?.name || 'Atleta'}, sigue así 🎯
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold text-white">{stats.totalSessions}</span>
              </div>
              <p className="text-xs text-blue-200">Sesiones Totales</p>
            </div>

            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <span className="text-2xl font-bold text-white">{stats.currentStreak}</span>
              </div>
              <p className="text-xs text-orange-200">Racha Actual</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="text-2xl font-bold text-white">{stats.weeksCompleted}</span>
              </div>
              <p className="text-xs text-purple-200">Semanas Completas</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-2xl font-bold text-white">{stats.daysSinceJoined}</span>
              </div>
              <p className="text-xs text-emerald-200">Días desde que Empezaste</p>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-lg font-semibold text-white mb-1">Mensaje del Día</p>
                <p className="text-emerald-100">{randomMessage}</p>
              </div>
            </div>
          </div>
          {/* Current Week Progress Warning */}
          {stats.currentWeekMessage && (
            <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-lg font-semibold text-amber-200 mb-1">Mensaje de Motivación</p>
                  <p className="text-amber-100">{stats.currentWeekMessage}</p>
                </div>
              </div>
            </div>
          )}
          {/* Next Goal */}
          {nextGoal && (
            <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Target className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-200 mb-1">PRÓXIMO OBJETIVO</p>
                  <p className="text-lg font-bold text-white mb-1">{nextGoal.title}</p>
                  <p className="text-sm text-amber-100 mb-3">{nextGoal.description}</p>
                  {nextGoal.progress !== undefined && nextGoal.target && (
                    <div>
                      <div className="flex justify-between text-xs text-amber-200 mb-1">
                        <span>Progreso</span>
                        <span>{nextGoal.progress}/{nextGoal.target}</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-500"
                          style={{ width: `${(nextGoal.progress / nextGoal.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Unlocked Achievements */}
          {unlockedAchievements.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-emerald-400" />
                Logros Desbloqueados ({unlockedAchievements.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {unlockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border-2 border-emerald-500/50 rounded-xl p-4 relative overflow-hidden"
                  >
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1">{achievement.title}</h4>
                        <p className="text-sm text-emerald-100">{achievement.description}</p>
                        {achievement.unlockedDate && (
                          <p className="text-xs text-emerald-300 mt-2">
                            Desbloqueado: {format(parseISO(achievement.unlockedDate), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {lockedAchievements.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-slate-400" />
                Por Desbloquear ({lockedAchievements.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lockedAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 relative overflow-hidden opacity-70"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-3 bg-slate-700/50 rounded-xl text-slate-500">
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-300 mb-1">{achievement.title}</h4>
                        <p className="text-sm text-slate-400 mb-3">{achievement.description}</p>
                        {achievement.progress !== undefined && achievement.target && (
                          <div>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>Progreso</span>
                              <span>{achievement.progress}/{achievement.target}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-slate-600 to-slate-500 h-full transition-all duration-500"
                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {stats.totalSessions === 0 && (
            <div className="text-center py-12">
              <div className="inline-block p-4 bg-slate-800 rounded-full mb-4">
                <Dumbbell className="w-12 h-12 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                ¡Comienza tu Viaje!
              </h3>
              <p className="text-slate-400">
                Completa tu primera sesión para comenzar a desbloquear logros
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsAndAchievements;
