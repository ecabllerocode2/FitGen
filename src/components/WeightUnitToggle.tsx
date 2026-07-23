import { formatUnitLabel, type WeightUnit } from '../utils/weightUnits';

interface WeightUnitToggleProps {
  unit: WeightUnit;
  onChange: (unit: WeightUnit) => void;
  className?: string;
}

export default function WeightUnitToggle({ unit, onChange, className = '' }: WeightUnitToggleProps) {
  return (
    <div
      className={`inline-flex rounded-xl bg-zinc-900 ring-1 ring-zinc-800 p-0.5 ${className}`}
      role="group"
      aria-label="Unidad de peso"
    >
      {(['kg', 'lb'] as const).map((option) => {
        const active = unit === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-w-[2.75rem] px-3 py-1.5 rounded-[0.65rem] text-xs font-semibold transition-colors ${
              active
                ? 'bg-lime-500 text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            aria-pressed={active}
          >
            {formatUnitLabel(option)}
          </button>
        );
      })}
    </div>
  );
}
