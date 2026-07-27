import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BodyMetricEntry } from '../types/bodyMetrics';

interface BodyMetricsTrendSectionProps {
  entries: BodyMetricEntry[];
  onRegister?: () => void;
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="opacity-80">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

function formatDelta(current?: number | null, previous?: number | null, unit = '') {
  if (current == null || previous == null) return null;
  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return `±0${unit}`;
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}${unit}`;
}

function MetricCard({
  label,
  value,
  unit,
  delta,
  spark,
  color,
}: {
  label: string;
  value?: number | null;
  unit: string;
  delta: string | null;
  spark: number[];
  color: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-3">
      <p className="text-[10px] uppercase text-zinc-500">{label}</p>
      <p className="text-xl font-bold text-white tabular-nums">
        {value != null ? `${value}${unit}` : '—'}
      </p>
      {delta ? (
        <p className={`text-[11px] mt-0.5 tabular-nums ${delta.startsWith('+') ? 'text-amber-400/90' : delta.startsWith('-') ? 'text-lime-400/90' : 'text-zinc-500'}`}>
          vs ant. {delta}
        </p>
      ) : (
        <p className="text-[11px] mt-0.5 text-zinc-600">Sin comparación aún</p>
      )}
      <div className="mt-1">
        <Sparkline values={spark} color={color} />
      </div>
    </div>
  );
}

export default function BodyMetricsTrendSection({ entries, onRegister }: BodyMetricsTrendSectionProps) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    [entries],
  );

  const latest = sorted.at(-1);
  const previous = sorted.length >= 2 ? sorted.at(-2) : undefined;
  const baseline = sorted[0];

  const weights = sorted.map((e) => e.weightKg).filter((v): v is number => v != null);
  const waists = sorted.map((e) => e.waistCm).filter((v): v is number => v != null);
  const hips = sorted.map((e) => e.hipCm).filter((v): v is number => v != null);
  const arms = sorted.map((e) => e.armCm).filter((v): v is number => v != null);
  const thighs = sorted.map((e) => e.thighCm).filter((v): v is number => v != null);

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-white">Composición corporal</h3>
        <p className="text-sm text-zinc-500 mt-2">
          Lleva un registro claro de peso y medidas para ver progreso real cada ~14 días.
        </p>
        {onRegister ? (
          <button
            type="button"
            onClick={onRegister}
            className="mt-4 text-sm font-medium text-lime-400 hover:text-lime-300"
          >
            Registrar primer check-in →
          </button>
        ) : null}
      </div>
    );
  }

  const vsBaselineWeight = formatDelta(latest?.weightKg, baseline?.weightKg, ' kg');
  const vsBaselineWaist = formatDelta(latest?.waistCm, baseline?.waistCm, ' cm');

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Composición corporal</h3>
          {latest ? (
            <p className="text-xs text-zinc-500 mt-1">
              Último: {format(parseISO(latest.recordedAt), "d MMM yyyy", { locale: es })}
              {sorted.length > 1 ? ` · ${sorted.length} registros` : ''}
            </p>
          ) : null}
          {(vsBaselineWeight || vsBaselineWaist) && baseline && baseline.id !== latest?.id ? (
            <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
              Desde el primer registro
              {vsBaselineWeight ? `: peso ${vsBaselineWeight}` : ''}
              {vsBaselineWaist ? `${vsBaselineWeight ? ',' : ':'} cintura ${vsBaselineWaist}` : ''}.
            </p>
          ) : null}
        </div>
        {onRegister ? (
          <button
            type="button"
            onClick={onRegister}
            className="text-xs font-medium text-lime-400 hover:text-lime-300 shrink-0"
          >
            Nuevo check-in
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Peso"
          value={latest?.weightKg}
          unit=" kg"
          delta={formatDelta(latest?.weightKg, previous?.weightKg, ' kg')}
          spark={weights}
          color="#a3e635"
        />
        <MetricCard
          label="Cintura"
          value={latest?.waistCm}
          unit=" cm"
          delta={formatDelta(latest?.waistCm, previous?.waistCm, ' cm')}
          spark={waists}
          color="#38bdf8"
        />
        {(latest?.hipCm != null || hips.length > 0) && (
          <MetricCard
            label="Cadera"
            value={latest?.hipCm}
            unit=" cm"
            delta={formatDelta(latest?.hipCm, previous?.hipCm, ' cm')}
            spark={hips}
            color="#f472b6"
          />
        )}
        {(latest?.armCm != null || arms.length > 0) && (
          <MetricCard
            label="Brazo"
            value={latest?.armCm}
            unit=" cm"
            delta={formatDelta(latest?.armCm, previous?.armCm, ' cm')}
            spark={arms}
            color="#fb923c"
          />
        )}
        {(latest?.thighCm != null || thighs.length > 0) && (
          <MetricCard
            label="Muslo"
            value={latest?.thighCm}
            unit=" cm"
            delta={formatDelta(latest?.thighCm, previous?.thighCm, ' cm')}
            spark={thighs}
            color="#a78bfa"
          />
        )}
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Historial</p>
        <ul className="space-y-2 max-h-40 overflow-y-auto">
          {[...sorted].reverse().slice(0, 10).map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-400"
            >
              <div className="flex justify-between gap-2">
                <span className="text-zinc-300">
                  {format(parseISO(entry.recordedAt), 'd MMM yyyy', { locale: es })}
                </span>
                <span className="tabular-nums text-zinc-200">
                  {entry.weightKg != null ? `${entry.weightKg} kg` : '—'}
                </span>
              </div>
              <p className="mt-1 tabular-nums text-[11px] text-zinc-500 leading-relaxed">
                {[
                  entry.waistCm != null ? `Cintura ${entry.waistCm}` : null,
                  entry.hipCm != null ? `Cadera ${entry.hipCm}` : null,
                  entry.armCm != null ? `Brazo ${entry.armCm}` : null,
                  entry.thighCm != null ? `Muslo ${entry.thighCm}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Sin circunferencias'}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
