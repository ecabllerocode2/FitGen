import { useMemo } from 'react';
import type { AvatarAppearance, AvatarConfig } from '../types';
import { computePhysiqueTier, PHYSIQUE_TIER_LABELS } from './physique';
import AvatarDisplay from './AvatarDisplay';

type AvatarPreviewProps = {
  appearance: AvatarAppearance;
  completedSessions: number;
  baseStage?: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
};

export default function AvatarPreview({
  appearance,
  completedSessions,
  baseStage = 0,
  size = 120,
  showLabel = true,
  className = '',
}: AvatarPreviewProps) {
  const physiqueTier = useMemo(
    () => computePhysiqueTier(completedSessions),
    [completedSessions],
  );

  const config: AvatarConfig = useMemo(
    () => ({
      appearance,
      physiqueTier,
      baseStage,
    }),
    [appearance, physiqueTier, baseStage],
  );

  const tierLabel = PHYSIQUE_TIER_LABELS[physiqueTier];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative rounded-2xl bg-black p-1">
        <AvatarDisplay config={config} size={size} />
      </div>

      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-semibold text-lime-400">{tierLabel}</p>
          <p className="text-[10px] text-zinc-500">
            Nivel físico · {completedSessions} sesiones
          </p>
        </div>
      )}
    </div>
  );
}

export { AvatarPreview };
