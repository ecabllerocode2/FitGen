import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  Gauge,
  MessageCircle,
  Scale,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { CoachInsight } from '../../../types/coach';
import type {
  CoachClientDashboardData,
  CoachSessionSummary,
  LoadComparison,
  SessionExerciseSummary,
} from '../../../types/coachDashboard';
import { CoachBarChart, CoachSparkline } from './CoachCharts';

function loadComparisonLabel(c: LoadComparison) {
  if (c === 'on_target') return 'En objetivo';
  if (c === 'under') return 'Por debajo';
  if (c === 'over') return 'Por encima';
  return '—';
}

function loadComparisonClass(c: LoadComparison) {
  if (c === 'on_target') return 'text-lime-400';
  if (c === 'under') return 'text-amber-300';
  if (c === 'over') return 'text-sky-300';
  return 'text-zinc-500';
}

function formatKg(value: number | null | undefined) {
  if (value == null) return '—';
  return `${Number(value).toFixed(1)} kg`;
}

function severityStyles(severity: CoachInsight['severity']) {
  if (severity === 'high') return 'border-red-500/25 bg-red-500/5';
  if (severity === 'medium') return 'border-amber-500/25 bg-amber-500/5';
  return 'border-zinc-800 bg-zinc-900/50';
}

function SessionExerciseTable({ session }: { session: CoachSessionSummary }) {
  if (!session.exercises.length) {
    return <p className="text-xs text-zinc-500">Sin detalle de ejercicios.</p>;
  }

  return (
    <div className="space-y-2">
      {session.exercises.map((ex: SessionExerciseSummary) => (
        <div key={ex.exerciseId} className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{ex.name}</p>
              {ex.muscleGroup && <p className="text-[10px] text-zinc-600 mt-0.5">{ex.muscleGroup}</p>}
            </div>
            <span className={`text-[10px] font-medium ${loadComparisonClass(ex.loadComparison)}`}>
              {loadComparisonLabel(ex.loadComparison)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
            <div>
              <p className="text-zinc-600">Prescrito</p>
              <p className="text-zinc-300">{formatKg(ex.prescribedLoadKg)}</p>
            </div>
            <div>
              <p className="text-zinc-600">Usado</p>
              <p className="text-zinc-300">{formatKg(ex.actualLoadKg)}</p>
            </div>
            <div>
              <p className="text-zinc-600">Series</p>
              <p className="text-zinc-300">
                {ex.setsCompleted}/{ex.setsPrescribed || '—'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionHistoryCard({ session }: { session: CoachSessionSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{session.sessionFocus}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {session.dayOfWeek ? `${session.dayOfWeek} · ` : ''}
            Semana {session.weekNumber ?? '—'}
            {session.completedAt
              ? ` · ${new Date(session.completedAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {session.failureSetCount != null && session.failureSetCount > 0 && (
            <span className="text-[9px] uppercase tracking-wide text-red-400">RIR 0</span>
          )}
          {session.jointPain && (
            <span className="text-[9px] uppercase tracking-wide text-amber-400">Dolor</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-zinc-800/80 pt-3 space-y-3">
          <div className="flex flex-wrap gap-2 text-[10px]">
            {session.durationLabel && (
              <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">{session.durationLabel}</span>
            )}
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">
              {session.setsCompleted}/{session.setsPrescribed} series
            </span>
            {session.avgRir != null && (
              <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">RIR medio {session.avgRir}</span>
            )}
            {session.readinessEnergy != null && (
              <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">
                Energía {session.readinessEnergy}/5
              </span>
            )}
            {session.totalVolumeKg != null && (
              <span className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-400">
                Volumen {Math.round(session.totalVolumeKg)} kg
              </span>
            )}
          </div>
          <SessionExerciseTable session={session} />
        </div>
      )}
    </div>
  );
}

function MotorInsightCard({ insight }: { insight: CoachInsight }) {
  return (
    <div className={`rounded-2xl border p-4 ${severityStyles(insight.severity)}`}>
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 rounded-lg p-1.5 ${
            insight.severity === 'high'
              ? 'bg-red-500/15 text-red-300'
              : insight.severity === 'medium'
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-zinc-800 text-zinc-400'
          }`}
        >
          {insight.severity === 'high' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-100">{insight.title}</p>
            {insight.category && (
              <span className="text-[9px] uppercase tracking-wide text-zinc-600">{insight.category}</span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{insight.message}</p>
          <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
            <span className="text-zinc-400 font-medium">Qué hacer tú: </span>
            {insight.suggestion}
          </p>
          {insight.systemAction && (
            <div className="mt-3 rounded-xl border border-lime-500/15 bg-lime-500/5 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-lime-400/80 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Qué hace FitGen
              </p>
              <p className="text-xs text-lime-100/80 leading-relaxed">{insight.systemAction}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CoachClientDashboardProps {
  client: CoachClientDashboardData;
}

export default function CoachClientDashboard({ client }: CoachClientDashboardProps) {
  const [copied, setCopied] = useState(false);
  const name = (client.profileData?.name as string) ?? 'Cliente';
  const { anthropometrics, checkin, mesocycle, liveSession, metrics, insights, sessionHistory } = client;
  const charts = client.charts ?? { volumeBySession: [], weightHistory: [], strengthHighlights: [] };

  const copyReminder = async () => {
    try {
      await navigator.clipboard.writeText(checkin.reminderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const volumePoints = charts.volumeBySession.map((p) => ({
    value: p.volumeKg,
    label: p.label,
  }));
  const rirPoints = charts.volumeBySession.map((p) => ({
    value: p.avgRir,
    label: p.label,
  }));
  const weightPoints = charts.weightHistory.map((p) => ({
    value: p.weightKg,
    label: new Date(p.date).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
  }));
  const completionPoints = charts.volumeBySession.map((p) => ({
    value: p.completionRate != null ? Math.round(p.completionRate * 100) : null,
    label: p.label,
  }));

  const highInsights = insights.filter((i) => i.severity === 'high');
  const otherInsights = insights.filter((i) => i.severity !== 'high');

  return (
    <div className="space-y-6 pb-4 lg:pb-8">
      {/* Hero */}
      <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Panel de supervisión</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mt-1 tracking-tight">{name}</h2>
            <p className="text-sm text-zinc-500 mt-2">
              {client.trainingProfile.fitnessGoal ?? 'Sin objetivo'}
              {client.trainingProfile.trainingDaysPerWeek
                ? ` · ${client.trainingProfile.trainingDaysPerWeek} días/sem`
                : ''}
              {mesocycle ? ` · Semana ${mesocycle.currentWeek}/${mesocycle.durationWeeks}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {liveSession?.isLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-500/15 text-lime-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-lime-500/30">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                Entrenando ahora
              </span>
            )}
            {highInsights.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 text-red-300 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-red-500/25">
                {highInsights.length} alerta{highInsights.length === 1 ? '' : 's'} crítica{highInsights.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: '7 días', value: metrics.adherence7 },
            { label: '28 días', value: metrics.adherence28 },
            { label: 'Meta/sem', value: metrics.expectedSessionsPerWeek },
            { label: 'Peso', value: anthropometrics.weightKg != null ? `${anthropometrics.weightKg}` : '—' },
            { label: 'IMC', value: anthropometrics.bmi ?? '—' },
            {
              label: 'Sin sesión',
              value: metrics.daysSinceLastSession != null ? `${metrics.daysSinceLastSession}d` : '—',
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-zinc-900/70 border border-zinc-800/80 px-3 py-2.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-lg font-bold text-white mt-0.5 tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Desktop: alerts | charts ; Mobile: stacked */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Motor alerts column */}
        <div className="xl:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-lime-400" />
              Motor FitGen
            </h3>
            <span className="text-[10px] text-zinc-600">{insights.length} señales</span>
          </div>

          {insights.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
              Sin alertas del motor. El plan y las cargas van en rango.
            </div>
          ) : (
            <div className="space-y-3">
              {[...highInsights, ...otherInsights].map((insight) => (
                <MotorInsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}

          {checkin.needsCheckin && (
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-200">
                    {checkin.overdue ? 'Check-in atrasado' : 'Check-in pendiente'}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {checkin.lastCheckinAt
                      ? `Último registro hace ${checkin.daysSince ?? '—'} días.`
                      : 'Aún no ha registrado peso ni medidas.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyReminder()}
                    className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-amber-300 hover:text-amber-200"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Mensaje copiado' : 'Copiar mensaje WhatsApp'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Progress charts column */}
        <div className="xl:col-span-7 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-lime-400" />
            Progreso medible
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">Volumen por sesión</p>
              <p className="text-xs text-zinc-600 mb-3">kg totales del bloque principal</p>
              <CoachBarChart points={volumePoints} emptyLabel="Completa sesiones para ver volumen" />
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">RIR medio</p>
              <p className="text-xs text-zinc-600 mb-3">Más bajo = más cerca del fallo</p>
              <CoachBarChart
                points={rirPoints}
                color="#fbbf24"
                emptyLabel="Sin RIR registrado aún"
              />
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1">% series completadas</p>
              <p className="text-xs text-zinc-600 mb-3">Umbral saludable ≥ 80%</p>
              <CoachBarChart
                points={completionPoints}
                color="#38bdf8"
                emptyLabel="Sin datos de series"
              />
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Peso corporal</p>
                <Scale className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              <p className="text-lg font-bold text-white mb-1">{formatKg(anthropometrics.weightKg)}</p>
              {checkin.trend.messages.length > 0 && (
                <p className="text-[11px] text-zinc-500 mb-2">{checkin.trend.messages.join(' · ')}</p>
              )}
              <CoachSparkline points={weightPoints} emptyLabel="Pide un check-in para ver tendencia" />
              {charts.weightHistory.length > 0 && (
                <div className="mt-3 space-y-1 max-h-28 overflow-y-auto scrollbar-hide">
                  {[...charts.weightHistory].reverse().slice(0, 5).map((entry) => (
                    <div key={entry.date} className="flex justify-between text-[11px] text-zinc-500">
                      <span>
                        {new Date(entry.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-zinc-300 tabular-nums">
                        {entry.weightKg.toFixed(1)} kg
                        {entry.waistCm != null ? ` · cintura ${entry.waistCm}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {charts.strengthHighlights.length > 0 && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500 mb-3">e1RM destacados</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {charts.strengthHighlights.map((lift) => {
                  const delta =
                    lift.previousE1RM != null && lift.previousE1RM > 0
                      ? Math.round(((lift.e1RM - lift.previousE1RM) / lift.previousE1RM) * 100)
                      : null;
                  return (
                    <div key={lift.exerciseId ?? lift.name} className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-3">
                      <p className="text-xs text-zinc-300 truncate">{lift.name}</p>
                      <p className="text-lg font-bold text-white mt-1 tabular-nums">{lift.e1RM.toFixed(1)} kg</p>
                      {delta != null && (
                        <p className={`text-[10px] mt-1 ${delta >= 0 ? 'text-lime-400' : 'text-amber-300'}`}>
                          {delta >= 0 ? '+' : ''}
                          {delta}% vs anterior
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Secondary grid: live/history + meso + physiology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 space-y-4">
          {liveSession?.isLive && (
            <section className="rounded-2xl border border-lime-500/30 bg-lime-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell className="w-4 h-4 text-lime-400" />
                <h3 className="text-sm font-semibold text-lime-200">Sesión en curso</h3>
              </div>
              <p className="text-sm text-white font-medium">{liveSession.sessionFocus}</p>
              <p className="text-xs text-zinc-500 mt-1">
                {liveSession.dayOfWeek} · Semana {liveSession.weekNumber}
                {liveSession.phase ? ` · ${liveSession.phase}` : ''}
              </p>
              <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">{liveSession.note}</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {liveSession.exercises.map((ex: SessionExerciseSummary) => (
                  <div
                    key={ex.exerciseId}
                    className="flex items-center justify-between text-xs rounded-lg bg-zinc-950/40 px-3 py-2"
                  >
                    <span className="text-zinc-300 truncate pr-2">{ex.name}</span>
                    <span className="text-zinc-500 shrink-0">
                      {ex.setsPrescribed}× {formatKg(ex.prescribedLoadKg)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!liveSession?.isLive && client.lastCompletedSession && (
            <section>
              <h3 className="text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-zinc-500" />
                Última sesión completada
              </h3>
              <SessionHistoryCard session={client.lastCompletedSession} />
            </section>
          )}

          {sessionHistory.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-zinc-200">Historial</h3>
                <span className="text-[10px] text-zinc-600">
                  {sessionHistory.length}/{client.sessionHistoryLimit}
                </span>
              </div>
              <div className="space-y-2 max-h-[28rem] overflow-y-auto scrollbar-hide pr-1">
                {sessionHistory.map((session: CoachSessionSummary) => (
                  <SessionHistoryCard key={session.id} session={session} />
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Scale className="w-3.5 h-3.5" />
                <p className="text-[10px] uppercase tracking-wide">Peso</p>
              </div>
              <p className="text-lg font-bold">{formatKg(anthropometrics.weightKg)}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center gap-2 text-zinc-500 mb-1">
                <Activity className="w-3.5 h-3.5" />
                <p className="text-[10px] uppercase tracking-wide">Estatura</p>
              </div>
              <p className="text-lg font-bold">
                {anthropometrics.heightCm ? `${anthropometrics.heightCm} cm` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 col-span-2">
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">IMC</p>
              <p className="text-lg font-bold mt-1">
                {anthropometrics.bmi ?? '—'}
                {anthropometrics.bmiCategory && (
                  <span className="text-sm font-normal text-zinc-500 ml-2">{anthropometrics.bmiCategory}</span>
                )}
              </p>
            </div>
          </section>

          {mesocycle && (
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-sm font-semibold text-zinc-200">Mesociclo</h3>
                </div>
                <span className="text-[10px] text-zinc-500">
                  Sem {mesocycle.currentWeek}/{mesocycle.durationWeeks}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {mesocycle.goal} · {mesocycle.splitType?.replace(/_/g, ' ') ?? 'Split'}
              </p>
              <div className="h-1.5 rounded-full bg-zinc-800 mt-3 overflow-hidden">
                <div
                  className="h-full bg-lime-500 transition-all"
                  style={{ width: `${mesocycle.progressPercent}%` }}
                />
              </div>
              <div className="mt-4 space-y-1.5">
                {mesocycle.weeklySplit.map((slot: { day: string; focus: string; isRest: boolean }) => (
                  <div
                    key={slot.day}
                    className={`flex items-center justify-between text-xs rounded-lg px-2 py-1.5 ${
                      slot.isRest ? 'text-zinc-600' : 'text-zinc-300 bg-zinc-950/40'
                    }`}
                  >
                    <span className="w-20">{slot.day}</span>
                    <span className="flex-1 text-right">{slot.isRest ? 'Descanso' : slot.focus}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-zinc-500" />
              Contexto fisiológico
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-zinc-950/50 p-2">
                <p className="text-zinc-600">Composición</p>
                <p className="text-zinc-300 mt-0.5">
                  {client.trainingProfile.bodyCompositionGoal?.replace(/_/g, ' ') ?? '—'}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-950/50 p-2">
                <p className="text-zinc-600">Experiencia</p>
                <p className="text-zinc-300 mt-0.5">
                  {client.trainingProfile.trainingAgeMonths
                    ? `${client.trainingProfile.trainingAgeMonths} meses`
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-950/50 p-2 col-span-2">
                <p className="text-zinc-600">Lesiones / limitaciones</p>
                <p className="text-zinc-300 mt-0.5">
                  {client.trainingProfile.injuriesOrLimitations?.length
                    ? client.trainingProfile.injuriesOrLimitations.join(', ')
                    : 'Ninguna reportada'}
                </p>
              </div>
              {client.trainingProfile.musclePriorities?.length > 0 && (
                <div className="rounded-lg bg-zinc-950/50 p-2 col-span-2">
                  <p className="text-zinc-600">Prioridades musculares</p>
                  <p className="text-zinc-300 mt-0.5">
                    {client.trainingProfile.musclePriorities
                      .map((p: { muscle: string }) => p.muscle)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
