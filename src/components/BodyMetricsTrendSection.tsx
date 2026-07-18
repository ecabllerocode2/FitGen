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

export default function BodyMetricsTrendSection({ entries, onRegister }: BodyMetricsTrendSectionProps) {
  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)),
    [entries],
  );

  const weights = sorted.map((e) => e.weightKg).filter((v): v is number => v != null);
  const waists = sorted.map((e) => e.waistCm).filter((v): v is number => v != null);
  const latest = sorted.at(-1);

  if (!sorted.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-semibold text-white">Composición corporal</h3>
        <p className="text-sm text-zinc-500 mt-2">
          Aún no hay check-ins. Registra peso y cintura cada ~14 días.
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

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Composición corporal</h3>
          {latest ? (
            <p className="text-xs text-zinc-500 mt-1">
              Último: {format(parseISO(latest.recordedAt), "d MMM yyyy", { locale: es })}
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
        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Peso</p>
          <p className="text-xl font-bold text-white tabular-nums">
            {latest?.weightKg != null ? `${latest.weightKg} kg` : '—'}
          </p>
          <Sparkline values={weights} color="#a3e635" />
        </div>
        <div className="rounded-xl bg-zinc-950/80 border border-zinc-800 p-3">
          <p className="text-[10px] uppercase text-zinc-500">Cintura</p>
          <p className="text-xl font-bold text-white tabular-nums">
            {latest?.waistCm != null ? `${latest.waistCm} cm` : '—'}
          </p>
          <Sparkline values={waists} color="#38bdf8" />
        </div>
      </div>

      <ul className="space-y-2 max-h-32 overflow-y-auto">
        {[...sorted].reverse().slice(0, 6).map((entry) => (
          <li key={entry.id} className="flex justify-between text-xs text-zinc-400">
            <span>{format(parseISO(entry.recordedAt), 'd MMM', { locale: es })}</span>
            <span className="tabular-nums">
              {entry.weightKg != null ? `${entry.weightKg} kg` : '—'}
              {entry.waistCm != null ? ` · ${entry.waistCm} cm` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
