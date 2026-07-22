import {
  AvatarDisplay,
  STARTING_BUILD_OPTIONS,
  resolveAvatarBodySrc,
  type AvatarGender,
  type AvatarStartingBuild,
} from '@fitgen/visual';

type AvatarStartingBuildPickerProps = {
  gender: AvatarGender;
  value: AvatarStartingBuild | null;
  onChange: (build: AvatarStartingBuild) => void;
  previewStage?: 0 | 4;
  disabled?: boolean;
  compact?: boolean;
};

export default function AvatarStartingBuildPicker({
  gender,
  value,
  onChange,
  previewStage = 0,
  disabled = false,
  compact = false,
}: AvatarStartingBuildPickerProps) {
  return (
    <div className={`space-y-3 ${compact ? '' : 'space-y-4'}`}>
      {STARTING_BUILD_OPTIONS.map((option) => {
        const selected = value === option.id;
        const src = resolveAvatarBodySrc(gender, previewStage, option.id);

        return (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.id)}
            className={`w-full rounded-2xl border text-left transition-all ${
              selected
                ? 'border-lime-500/60 bg-lime-500/10 ring-1 ring-lime-500/30'
                : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className={`flex items-center gap-4 ${compact ? 'p-3' : 'p-4'}`}>
              <div className="shrink-0 rounded-xl bg-black p-1">
                <img
                  src={src}
                  alt=""
                  width={compact ? 72 : 88}
                  height={compact ? 72 : 88}
                  className="object-contain object-bottom"
                  draggable={false}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{option.label}</p>
                {!compact && (
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{option.description}</p>
                )}
                {previewStage === 0 && !compact && (
                  <p className="text-[10px] text-lime-400/70 mt-2">
                    Tu meta: versión fitness al completar sesiones
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function AvatarEvolutionPreview({
  gender,
  startingBuild,
}: {
  gender: AvatarGender;
  startingBuild: AvatarStartingBuild;
}) {
  const stages = [0, 4] as const;

  return (
    <div className="flex items-end justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
      {stages.map((stage, index) => (
        <div key={stage} className="flex flex-col items-center gap-2">
          <div className="rounded-lg bg-black p-1">
            <AvatarDisplay
              config={{
                appearance: { gender, startingBuild },
                progressStage: stage,
              }}
              size={72}
              showPrestige={false}
            />
          </div>
          <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
            {index === 0 ? 'Hoy' : 'Meta'}
          </p>
        </div>
      ))}
      <div className="flex-1 flex items-center justify-center px-2 pb-8">
        <div className="h-px flex-1 bg-gradient-to-r from-zinc-700 via-lime-500/40 to-lime-500/80" />
      </div>
    </div>
  );
}
