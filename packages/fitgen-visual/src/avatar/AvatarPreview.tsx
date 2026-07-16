import { useMemo } from 'react';
import type { AvatarAppearance, AvatarConfig } from '../types';
import { computePhysiqueTier, PHYSIQUE_TIER_LABELS } from './physique';
import AvatarDisplay from './AvatarDisplay';
import {
  EYE_COLOR_OPTIONS,
  GENDER_OPTIONS,
  HAIR_STYLE_OPTIONS,
  SKIN_TONE_OPTIONS,
} from './tokens';

type AvatarPreviewProps = {
  appearance: AvatarAppearance;
  completedSessions: number;
  baseStage?: number;
  size?: number;
  showLabel?: boolean;
  showCustomizer?: boolean;
  onAppearanceChange?: (next: AvatarAppearance) => void;
  className?: string;
};

export default function AvatarPreview({
  appearance,
  completedSessions,
  baseStage = 0,
  size = 120,
  showLabel = true,
  showCustomizer = false,
  onAppearanceChange,
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

      {showCustomizer && onAppearanceChange && (
        <div className="w-full space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
          <CustomizerRow
            label="Personaje"
            options={GENDER_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={appearance.gender}
            onChange={(gender) =>
              onAppearanceChange({
                ...appearance,
                gender: gender as AvatarAppearance['gender'],
              })
            }
          />
          <CustomizerRow
            label="Piel"
            options={SKIN_TONE_OPTIONS.map((o) => ({
              id: o.id,
              swatch: true,
            }))}
            value={appearance.skinTone}
            onChange={(skinTone) =>
              onAppearanceChange({
                ...appearance,
                skinTone: skinTone as AvatarAppearance['skinTone'],
              })
            }
          />
          <CustomizerRow
            label="Cabello"
            options={HAIR_STYLE_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={appearance.hairStyle}
            onChange={(hairStyle) =>
              onAppearanceChange({
                ...appearance,
                hairStyle: hairStyle as AvatarAppearance['hairStyle'],
              })
            }
          />
          <CustomizerRow
            label="Ojos"
            options={EYE_COLOR_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={appearance.eyeColor}
            onChange={(eyeColor) =>
              onAppearanceChange({
                ...appearance,
                eyeColor: eyeColor as AvatarAppearance['eyeColor'],
              })
            }
          />
          <p className="text-[10px] text-zinc-600 text-center pt-1">
            Piel, cabello y ojos se aplicarán cuando existan capas de arte.
          </p>
        </div>
      )}
    </div>
  );
}

type CustomizerRowProps = {
  label: string;
  options: { id: string; label?: string; swatch?: boolean }[];
  value: string;
  onChange: (id: string) => void;
};

function CustomizerRow({ label, options, value, onChange }: CustomizerRowProps) {
  const skinColors: Record<string, string> = {
    light: '#F5D0B5',
    medium: '#E8B796',
    tan: '#C68642',
    brown: '#8D5524',
    dark: '#4A2912',
  };

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = opt.id === value;
          if (opt.swatch) {
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  active ? 'border-lime-400 ring-2 ring-lime-400/30' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                style={{ background: skinColors[opt.id] ?? '#888' }}
                title={opt.id}
              />
            );
          }
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium transition ${
                active
                  ? 'bg-lime-500/20 text-lime-300 border border-lime-500/40'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {opt.label ?? opt.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { AvatarPreview };
