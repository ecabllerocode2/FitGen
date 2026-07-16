import { useMemo } from 'react';
import { AvatarDisplay, FitCoin, computePhysiqueTier, PHYSIQUE_TIER_LABELS } from '@fitgen/visual';
import type { AvatarAppearance } from '@fitgen/visual';
import { formatFitCoins } from '../../utils/gamificationDisplay';

type ProgressArenaCardProps = {
  fitCoins: number;
  seasonPoints: number;
  currentStreak: number;
  unlockedAchievements: number;
  totalSessions?: number;
  avatarBaseStage?: number;
  avatarAppearance: AvatarAppearance;
  onOpen: () => void;
};

export default function ProgressArenaCard({
  fitCoins,
  seasonPoints,
  currentStreak,
  unlockedAchievements,
  totalSessions = 0,
  avatarBaseStage = 0,
  avatarAppearance,
  onOpen,
}: ProgressArenaCardProps) {
  const physiqueTier = useMemo(
    () => computePhysiqueTier(totalSessions),
    [totalSessions],
  );

  const avatarConfig = useMemo(
    () => ({
      appearance: avatarAppearance,
      physiqueTier,
      baseStage: avatarBaseStage,
    }),
    [avatarAppearance, physiqueTier, avatarBaseStage],
  );

  const tierLabel = PHYSIQUE_TIER_LABELS[physiqueTier];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-center transition-transform active:scale-[0.98]"
    >
      <div className="relative flex items-end justify-center overflow-hidden rounded-3xl bg-black py-2 min-h-[240px]">
        <AvatarDisplay config={avatarConfig} size={220} />
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-medium">
            {tierLabel}
          </p>
          <p className="text-[11px] text-zinc-600 mt-0.5">
            {unlockedAchievements} logros · Toca para abrir tu arena
          </p>
        </div>

        <div className="flex items-start justify-center gap-8 sm:gap-12">
          <StatItem label="FitCoins" value={formatFitCoins(fitCoins)} icon={<FitCoin size={14} />} />
          <StatItem label="Puntos" value={formatFitCoins(seasonPoints)} />
          <StatItem label="Racha" value={`${currentStreak}d`} accent />
        </div>
      </div>
    </button>
  );
}

function StatItem({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="min-w-[4.5rem]">
      <div className="flex items-center justify-center gap-1 text-zinc-500">
        {icon}
        <span className="text-[9px] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p
        className={`text-xl font-semibold tabular-nums mt-1 ${
          accent ? 'text-orange-400/90' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
