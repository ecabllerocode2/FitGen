import { LOAD_CONVENTIONS, type LoadConvention } from './loadConvention';

export type WeightUnit = 'kg' | 'lb';

export const KG_TO_LB = 2.2046226218;

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === 'kg' || value === 'lb';
}

export function normalizeWeightUnit(value: unknown, fallback: WeightUnit = 'kg'): WeightUnit {
  return isWeightUnit(value) ? value : fallback;
}

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

function roundToStep(value: number, step: number, direction: 'down' | 'up' | 'nearest' = 'nearest'): number {
  if (step <= 0) return value;
  const ratio = value / step;
  if (direction === 'down') return Math.floor(ratio + 1e-9) * step;
  if (direction === 'up') return Math.ceil(ratio - 1e-9) * step;
  return Math.round(ratio) * step;
}

export function getSnapStep(unit: WeightUnit, convention: LoadConvention): number {
  if (unit === 'kg') {
    switch (convention) {
      case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
      case LOAD_CONVENTIONS.UNILATERAL:
        return 1;
      default:
        return 5;
    }
  }

  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
    case LOAD_CONVENTIONS.UNILATERAL:
      return 2.5;
    default:
      return 5;
  }
}

export function getInputStep(unit: WeightUnit, convention: LoadConvention): number {
  return getSnapStep(unit, convention);
}

export function snapInDisplayUnit(
  value: number,
  unit: WeightUnit,
  convention: LoadConvention,
  direction: 'down' | 'up' | 'nearest' = 'nearest',
): number {
  const step = getSnapStep(unit, convention);
  const snapped = roundToStep(value, step, direction);
  return Math.round(snapped * 100) / 100;
}

export function toDisplayWeight(
  kg: number | null | undefined,
  unit: WeightUnit,
  convention: LoadConvention,
): number | null {
  if (kg == null || Number.isNaN(kg) || kg <= 0) return null;
  if (unit === 'kg') {
    return snapInDisplayUnit(kg, 'kg', convention);
  }
  return snapInDisplayUnit(kgToLb(kg), 'lb', convention);
}

export function fromDisplayWeight(
  display: number | null | undefined,
  unit: WeightUnit,
  convention: LoadConvention,
): number | null {
  if (display == null || Number.isNaN(display) || display < 0) return null;
  const snapped = snapInDisplayUnit(display, unit, convention);
  const kg = unit === 'kg' ? snapped : lbToKg(snapped);
  return Math.round(kg * 1000) / 1000;
}

export function formatWeightNumber(value: number, _unit: WeightUnit): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, '');
}

export function formatUnitLabel(unit: WeightUnit): string {
  return unit === 'lb' ? 'lb' : 'kg';
}

export function formatVolume(
  kg: number | null | undefined,
  unit: WeightUnit = 'kg',
): string | null {
  if (kg == null || kg <= 0) return null;
  if (unit === 'lb') {
    const lb = Math.round(kgToLb(kg));
    return `${lb.toLocaleString('es-MX')} lb`;
  }
  return `${kg.toLocaleString('es-MX')} kg`;
}
