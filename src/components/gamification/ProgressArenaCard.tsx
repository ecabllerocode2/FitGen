import { ChevronRight, Flame, Sparkles, Trophy } from 'lucide-react';
import FitCoinIcon from './FitCoinIcon';
import { formatFitCoins, formatSeasonLabel } from '../../utils/gamificationDisplay';

type ProgressArenaCardProps = {
  fitCoins: number;
  seasonPoints: number;
  currentStreak: number;
  unlockedAchievements: number;
  seasonId?: string;
  onOpen: () => void;
};

export default function ProgressArenaCard({
  fitCoins,
  seasonPoints,
  currentStreak,
  unlockedAchievements,
  seasonId,
  onOpen,
}: ProgressArenaCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border border-lime-500/20 bg-gradient-to-br from-lime-500/10 via-zinc-900 to-zinc-950 p-4 text-left transition-all active:scale-[0.99] hover:border-lime-500/35"
    >
      <div className="pointer-events-none absolute -top-10 -right-8 h-28 w-28 rounded-full bg-lime-400/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-lime-400/90">
              Arena FitGen
            </p>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5 leading-tight">
            Tu progreso, recompensas y ranking
          </h2>
          <p className="text-xs text-zinc-500 mt-1 capitalize">
            {formatSeasonLabel(seasonId)} · Temporada activa
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-lime-500/25 bg-lime-500/10 p-2 text-lime-300 transition-transform group-hover:translate-x-0.5">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-lime-500/15 bg-zinc-950/50 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-lime-400">
            <FitCoinIcon size={16} />
            <span className="text-[9px] uppercase tracking-wider font-semibold">FitCoins</span>
          </div>
          <p className="text-lg font-bold text-white tabular-nums mt-1">{formatFitCoins(fitCoins)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Puntos</span>
          </div>
          <p className="text-lg font-bold text-white tabular-nums mt-1">{formatFitCoins(seasonPoints)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-orange-400/90">
            <Flame className="w-3.5 h-3.5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Racha</span>
          </div>
          <p className="text-lg font-bold text-white tabular-nums mt-1">{currentStreak}d</p>
        </div>
      </div>

      <p className="relative mt-3 text-[11px] text-zinc-500">
        {unlockedAchievements} logros desbloqueados · Toca para entrar a tu arena
      </p>
    </button>
  );
}
