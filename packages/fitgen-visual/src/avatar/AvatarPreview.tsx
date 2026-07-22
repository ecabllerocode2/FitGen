import { useMemo } from 'react';
import type { AvatarAppearance, AvatarConfig } from '../types';
import {
  AVATAR_STAGE_LABELS,
  computeAvatarProgressStage,
  nextAvatarStageThreshold,
  sessionsUntilNextAvatarStage,
} from './physique';
import AvatarDisplay from './AvatarDisplay';

type AvatarPreviewProps = {
  appearance: AvatarAppearance;
  completedSessions: number;
  baseStage?: number;
  size?: number;
  showLabel?: boolean;
  showProgressHint?: boolean;
  className?: string;
};

export default function AvatarPreview({
  appearance,
  completedSessions,
  baseStage = 0,
  size = 120,
  showLabel = true,
  showProgressHint = false,
  className = '',
}: AvatarPreviewProps) {
  const progressStage = useMemo(
    () => computeAvatarProgressStage(completedSessions),
    [completedSessions],
  );

  const config: AvatarConfig = useMemo(
    () => ({
      appearance,
      progressStage,
      baseStage,
    }),
    [appearance, progressStage, baseStage],
  );

  const stageLabel = AVATAR_STAGE_LABELS[progressStage];
  const sessionsToNext = sessionsUntilNextAvatarStage(completedSessions);
  const nextThreshold = nextAvatarStageThreshold(completedSessions);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative rounded-2xl bg-black p-1">
        <AvatarDisplay config={config} size={size} />
      </div>

      {showLabel && (
        <div className="text-center">
          <p className="text-xs font-semibold text-lime-400">{stageLabel}</p>
          <p className="text-[10px] text-zinc-500">
            Evolución · {completedSessions} sesiones
          </p>
          {showProgressHint && sessionsToNext != null && nextThreshold != null && (
            <p className="text-[10px] text-lime-400/80 mt-1">
              {sessionsToNext === 0
                ? `¡Próximo cambio en la etapa ${progressStage + 1}!`
                : `${sessionsToNext} sesión${sessionsToNext === 1 ? '' : 'es'} para el siguiente cambio`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export { AvatarPreview };
