import type { AvatarConfig } from '../types';
import { resolveAvatarPresentation } from './resolveAvatarAssets';

type AvatarDisplayProps = {
  config: AvatarConfig;
  size?: number;
  className?: string;
  showPrestige?: boolean;
};

/** Static avatar image (PNG) by gender and physique tier. */
export default function AvatarDisplay({
  config,
  size = 168,
  className = '',
  showPrestige = true,
}: AvatarDisplayProps) {
  const presentation = resolveAvatarPresentation(config);
  const baseStage = config.baseStage ?? 0;
  const prestige = showPrestige && presentation.prestige;

  return (
    <div
      className={`relative flex items-end justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {prestige && (
        <div
          className="pointer-events-none absolute inset-x-[12%] bottom-[8%] aspect-square rounded-full border border-lime-400/35 bg-lime-400/5 blur-[1px]"
          style={{ boxShadow: '0 0 24px rgba(132, 204, 22, 0.15)' }}
        />
      )}

      <div className="relative z-10 h-full w-full">
        <img
          src={presentation.src}
          alt=""
          width={size}
          height={size}
          draggable={false}
          className="h-full w-full object-contain object-bottom select-none"
          loading="lazy"
          decoding="async"
        />
      </div>

      {prestige && (
        <span className="absolute top-1 right-1 z-20 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-500 px-1.5 text-[9px] font-bold text-zinc-950">
          ★{baseStage}
        </span>
      )}
    </div>
  );
}

export { AvatarDisplay };
