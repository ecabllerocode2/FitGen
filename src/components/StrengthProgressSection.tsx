import { TrendingUp } from 'lucide-react';
import type { StrengthHighlight } from '../types/gamification';

interface StrengthProgressSectionProps {
  highlights: StrengthHighlight[];
}

export default function StrengthProgressSection({ highlights }: StrengthProgressSectionProps) {
  if (!highlights.length) return null;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-lime-400" />
        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Fuerza estimada (e1RM)</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {highlights.map((lift) => {
          const delta =
            lift.previousE1RM != null && lift.previousE1RM > 0
              ? Math.round(((lift.e1RM - lift.previousE1RM) / lift.previousE1RM) * 100)
              : null;

          return (
            <div
              key={lift.exerciseId ?? lift.name}
              className="rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-3"
            >
              <p className="text-xs text-zinc-300 truncate">{lift.name}</p>
              <p className="text-lg font-bold text-white mt-1 tabular-nums">
                {lift.e1RM.toFixed(1)} kg
              </p>
              {delta != null ? (
                <p className={`text-[10px] mt-1 ${delta >= 0 ? 'text-lime-400' : 'text-amber-300'}`}>
                  {delta >= 0 ? '+' : ''}
                  {delta}% vs anterior
                </p>
              ) : (
                <p className="text-[10px] mt-1 text-zinc-600">Primer registro del bloque</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
