import { useEffect, useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft,
  BarChart3,
  Dumbbell,
  Flame,
  Scale,
  Target,
  Trophy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  fetchAdminUserDetail,
  type AdminSessionSummary,
  type AdminUserDetail,
  type AdminUserRow,
} from '../../api/admin';
import { AdminBarChart, AdminDualLineChart } from './AdminCharts';

type Props = {
  authToken: string;
  user: AdminUserRow;
  onBack: () => void;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return format(parseISO(iso), 'd MMM yyyy, HH:mm', { locale: es });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: es });
  } catch {
    return '';
  }
}

function deltaClass(deltaPct: number | null): string {
  if (deltaPct == null) return 'text-zinc-500';
  if (Math.abs(deltaPct) <= 5) return 'text-lime-400';
  if (deltaPct > 0) return 'text-sky-400';
  return 'text-amber-400';
}

function formatDelta(deltaPct: number | null): string {
  if (deltaPct == null) return '—';
  const sign = deltaPct > 0 ? '+' : '';
  return `${sign}${deltaPct}%`;
}

export default function AdminUserDetailView({ authToken, user, onBack }: Props) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAdminUserDetail(authToken, user.uid);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, user.uid]);

  const volumePoints =
    detail?.charts.volumeBySession.map((p) => ({
      value: p.volumeKg,
      label: p.label,
    })) ?? [];

  const prescribedPoints =
    detail?.charts.loadBySession.map((p) => ({
      value: p.avgPrescribedKg,
      label: p.label,
    })) ?? [];

  const actualPoints =
    detail?.charts.loadBySession.map((p) => ({
      value: p.avgActualKg,
      label: p.label,
    })) ?? [];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 mt-0.5 text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Volver a la lista"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-white truncate">{user.name}</h2>
          <p className="text-xs text-zinc-500 truncate">{user.email ?? user.uid}</p>
          <p className="text-[10px] text-zinc-600 mt-1 capitalize">
            {user.status.replace('_', ' ')}
            {detail?.user.experienceLevel ? ` · ${detail.user.experienceLevel}` : ''}
            {detail?.user.hasActiveMesocycle
              ? ` · meso ${detail.user.mesocycleStatus ?? 'activo'}`
              : ''}
          </p>
        </div>
      </div>

      {loading && !detail && (
        <p className="text-sm text-zinc-500 py-10 text-center">Cargando estadísticas…</p>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {detail && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat
              icon={Trophy}
              label="Sesiones"
              value={String(detail.gamification.lifetimeSessionsCompleted)}
            />
            <MiniStat
              icon={Flame}
              label="Racha"
              value={`${detail.gamification.currentStreakDays}d`}
              accent
            />
            <MiniStat
              icon={Dumbbell}
              label="Volumen"
              value={
                detail.stats.totalVolumeKg > 0
                  ? `${Math.round(detail.stats.totalVolumeKg)}`
                  : '—'
              }
              suffix="kg"
            />
            <MiniStat
              icon={Target}
              label="Adherencia"
              value={
                detail.stats.adherenceRatePct != null
                  ? `${Math.round(detail.stats.adherenceRatePct)}%`
                  : '—'
              }
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Δ carga promedio{' '}
              <span className={`font-semibold tabular-nums ${deltaClass(detail.stats.avgLoadDeltaPct)}`}>
                {formatDelta(detail.stats.avgLoadDeltaPct)}
              </span>
              {' · '}
              {detail.stats.heavierThanPrescribed} más pesado · {detail.stats.lighterThanPrescribed} más
              ligero · {detail.stats.onTargetWithin5Pct} ±5%
              {detail.stats.avgVolumeKg != null
                ? ` · ~${Math.round(detail.stats.avgVolumeKg)} kg/sesión`
                : ''}
            </p>
          </div>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-lime-400" />
              <h3 className="text-sm font-semibold text-white">Volumen por sesión</h3>
            </div>
            <p className="text-[10px] text-zinc-600">Últimas {detail.stats.archivedSessions} archivadas</p>
            <AdminBarChart points={volumePoints} emptyLabel="Sin volumen registrado aún" />
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Prescrito vs usado</h3>
            </div>
            <p className="text-[10px] text-zinc-600">
              Promedio de cargas comparables por sesión (kg)
            </p>
            <AdminDualLineChart
              prescribed={prescribedPoints}
              actual={actualPoints}
              emptyLabel="Aún no hay pares prescrito/usado"
            />
          </section>

          {detail.ledgerHighlights.length > 0 && (
            <section className="rounded-xl border border-zinc-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
                <h3 className="text-sm font-semibold text-white">Últimos pesos (ledger)</h3>
                <p className="text-[10px] text-zinc-600 mt-0.5">Historial compacto por ejercicio</p>
              </div>
              <ul className="divide-y divide-zinc-800/80 max-h-56 overflow-y-auto">
                {detail.ledgerHighlights.map((entry) => (
                  <li
                    key={entry.exerciseId}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{entry.exerciseName}</p>
                      <p className="text-[10px] text-zinc-600 truncate">
                        {entry.muscleGroup ?? '—'}
                        {entry.updatedAt ? ` · ${formatRelative(entry.updatedAt)}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <p className="text-sm font-semibold text-white">
                        {entry.lastWeightKg != null ? `${entry.lastWeightKg} kg` : '—'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {entry.lastReps != null ? `${entry.lastReps} reps` : ''}
                        {entry.e1RM != null ? ` · e1RM ${entry.e1RM}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
              <h3 className="text-sm font-semibold text-white">Sesiones recientes</h3>
            </div>
            {detail.sessions.length === 0 ? (
              <p className="text-xs text-zinc-600 px-4 py-8 text-center">Sin sesiones archivadas</p>
            ) : (
              <ul className="divide-y divide-zinc-800/80">
                {detail.sessions.map((session, index) => {
                  const rowId = session.sessionId ?? session.completedAt ?? `session-${index}`;
                  return (
                    <SessionRow
                      key={rowId}
                      session={session}
                      expanded={expandedSessionId === rowId}
                      onToggle={() => {
                        setExpandedSessionId((prev) => (prev === rowId ? null : rowId));
                      }}
                    />
                  );
                })}
              </ul>
            )}
          </section>

          <p className="text-[10px] text-zinc-700 text-center pb-2">
            Última sesión {formatDate(detail.user.lastSessionAt)}
            {detail.generatedAt
              ? ` · actualizado ${format(parseISO(detail.generatedAt), 'HH:mm:ss')}`
              : ''}
          </p>
        </>
      )}
    </div>
  );
}

function SessionRow({
  session,
  expanded,
  onToggle,
}: {
  session: AdminSessionSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 hover:bg-zinc-900/60 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{session.sessionFocus}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {formatDate(session.completedAt)}
              {session.durationLabel ? ` · ${session.durationLabel}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right text-[10px] text-zinc-500 tabular-nums">
              <p>{session.volumeKg != null ? `${Math.round(session.volumeKg)} kg` : '—'}</p>
              <p className={deltaClass(session.avgDeltaPct)}>{formatDelta(session.avgDeltaPct)}</p>
            </div>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-600" />
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 text-[9px] uppercase tracking-wider text-zinc-600 font-semibold border-b border-zinc-800/80">
              <span>Ejercicio</span>
              <span className="text-right">Presc.</span>
              <span className="text-right">Usado</span>
              <span className="text-right">Δ</span>
            </div>
            <ul className="divide-y divide-zinc-800/60 max-h-64 overflow-y-auto">
              {session.exercises.map((ex, i) => (
                <li
                  key={`${ex.exerciseId ?? ex.exerciseName}-${i}`}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 items-center"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] text-zinc-300 truncate">{ex.exerciseName}</p>
                    {ex.isBodyweight && (
                      <p className="text-[9px] text-zinc-600">Peso corporal</p>
                    )}
                  </div>
                  <span className="text-[11px] text-sky-400/90 tabular-nums text-right w-12">
                    {ex.prescribedKg != null ? ex.prescribedKg : '—'}
                  </span>
                  <span className="text-[11px] text-lime-400/90 tabular-nums text-right w-12">
                    {ex.actualKg != null ? ex.actualKg : '—'}
                  </span>
                  <span className={`text-[11px] tabular-nums text-right w-12 ${deltaClass(ex.deltaPct)}`}>
                    {formatDelta(ex.deltaPct)}
                  </span>
                </li>
              ))}
            </ul>
            {session.avgPrescribedKg != null && session.avgActualKg != null && (
              <p className="px-3 py-2 text-[10px] text-zinc-600 border-t border-zinc-800/80">
                Promedio sesión: {session.avgPrescribedKg} kg prescrito → {session.avgActualKg} kg usado
              </p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  suffix,
  accent,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3">
      <div className="flex items-center gap-1.5 text-zinc-500">
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-lime-400' : ''}`} />
        <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${accent ? 'text-lime-400' : 'text-white'}`}>
        {value}
        {suffix ? <span className="text-xs font-medium text-zinc-500 ml-1">{suffix}</span> : null}
      </p>
    </div>
  );
}
