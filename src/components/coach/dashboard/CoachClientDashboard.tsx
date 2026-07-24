import { useState } from 'react';
import {
  Activity,
  AlertCircle,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Dumbbell,
  MessageCircle,
  Scale,
  TrendingUp,
} from 'lucide-react';
import type { CoachInsight } from '../../../types/coach';
import type {
  CoachClientDashboardData,
  CoachSessionSummary,
  LoadComparison,
  SessionExerciseSummary,
} from '../../../types/coachDashboard';

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

function formatKg(value: number | null) {
  if (value == null) return '—';
  return `${value.toFixed(1)} kg`;
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

interface CoachClientDashboardProps {
  client: CoachClientDashboardData;
}

export default function CoachClientDashboard({ client }: CoachClientDashboardProps) {
  const [copied, setCopied] = useState(false);
  const name = (client.profileData?.name as string) ?? 'Cliente';
  const { anthropometrics, checkin, mesocycle, liveSession, metrics, insights, sessionHistory } = client;

  const copyReminder = async () => {
    try {
      await navigator.clipboard.writeText(checkin.reminderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Status hero */}
      <section className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Cliente</p>
            <h2 className="text-xl font-bold text-white mt-1">{name}</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {client.trainingProfile.fitnessGoal ?? 'Sin objetivo'}
              {client.trainingProfile.trainingDaysPerWeek
                ? ` · ${client.trainingProfile.trainingDaysPerWeek} días/sem`
                : ''}
            </p>
          </div>
          {liveSession?.isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-500/15 text-lime-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-lime-500/30">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              Entrenando
            </span>
          )}
        </div>
      </section>

      {/* Check-in alert */}
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
                  ? `Último registro hace ${checkin.daysSince ?? '—'} días. Pídele peso y medidas.`
                  : 'Aún no ha registrado peso ni medidas en la app.'}
              </p>
              <p className="text-xs text-zinc-500 mt-3 rounded-lg bg-zinc-950/60 border border-zinc-800 p-3 leading-relaxed">
                {checkin.reminderMessage}
              </p>
              <button
                type="button"
                onClick={() => void copyReminder()}
                className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-amber-300 hover:text-amber-200"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Mensaje copiado' : 'Copiar mensaje para WhatsApp'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Vitals */}
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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-zinc-500">IMC</p>
              <p className="text-lg font-bold mt-1">
                {anthropometrics.bmi ?? '—'}
                {anthropometrics.bmiCategory && (
                  <span className="text-sm font-normal text-zinc-500 ml-2">
                    {anthropometrics.bmiCategory}
                  </span>
                )}
              </p>
            </div>
            {checkin.lastCheckinAt && !checkin.needsCheckin && (
              <span className="text-[10px] text-lime-400/80 uppercase tracking-wide">Check-in al día</span>
            )}
          </div>
          {checkin.trend.messages.length > 0 && (
            <p className="text-[11px] text-zinc-500 mt-2">{checkin.trend.messages.join(' · ')}</p>
          )}
        </div>
      </section>

      {/* Adherence metrics */}
      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-zinc-800 p-3 text-center">
          <p className="text-[10px] text-zinc-500">7 días</p>
          <p className="text-xl font-bold mt-1">{metrics.adherence7}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-3 text-center">
          <p className="text-[10px] text-zinc-500">28 días</p>
          <p className="text-xl font-bold mt-1">{metrics.adherence28}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 p-3 text-center">
          <p className="text-[10px] text-zinc-500">Meta/sem</p>
          <p className="text-xl font-bold mt-1">{metrics.expectedSessionsPerWeek}</p>
        </div>
      </section>

      {/* Live session */}
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
          <div className="mt-4 space-y-2">
            {liveSession.exercises.slice(0, 6).map((ex: SessionExerciseSummary) => (
              <div key={ex.exerciseId} className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 truncate pr-2">{ex.name}</span>
                <span className="text-zinc-500 shrink-0">
                  {ex.setsPrescribed}× {formatKg(ex.prescribedLoadKg)}
                </span>
              </div>
            ))}
            {liveSession.exercises.length > 6 && (
              <p className="text-[10px] text-zinc-600">+{liveSession.exercises.length - 6} ejercicios más</p>
            )}
          </div>
        </section>
      )}

      {/* Last completed session quick view */}
      {!liveSession?.isLive && client.lastCompletedSession && (
        <section>
          <h3 className="text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-zinc-500" />
            Última sesión completada
          </h3>
          <SessionHistoryCard session={client.lastCompletedSession} />
        </section>
      )}

      {/* Mesocycle split */}
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

      {/* Physiological context */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">Contexto fisiológico</h3>
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
                {client.trainingProfile.musclePriorities.map((p: { muscle: string; intensity: string }) => p.muscle).join(', ')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Insights */}
      {insights.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-zinc-500" />
            Señales para orientar
          </h3>
          <div className="space-y-2">
            {insights.map((insight: CoachInsight) => (
              <div
                key={insight.id}
                className={`rounded-xl border p-3 text-sm ${
                  insight.severity === 'high'
                    ? 'border-red-500/20 bg-red-500/5'
                    : insight.severity === 'medium'
                      ? 'border-amber-500/20 bg-amber-500/5'
                      : 'border-zinc-800 bg-zinc-900/40'
                }`}
              >
                <p className="font-medium text-zinc-200">{insight.title}</p>
                <p className="text-zinc-500 mt-1 text-xs">{insight.message}</p>
                <p className="text-lime-400/80 text-xs mt-2">{insight.suggestion}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Session history */}
      {sessionHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-zinc-200">Historial de sesiones</h3>
            <span className="text-[10px] text-zinc-600">
              {sessionHistory.length}/{client.sessionHistoryLimit} guardadas
            </span>
          </div>
          <p className="text-[11px] text-zinc-600 mb-3">
            FitGen conserva hasta {client.sessionHistoryLimit} sesiones recientes por atleta en Firestore.
          </p>
          <div className="space-y-2">
            {sessionHistory.map((session: CoachSessionSummary) => (
              <SessionHistoryCard key={session.id} session={session} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
