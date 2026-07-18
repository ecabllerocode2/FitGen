import { LOAD_CONVENTIONS, type LoadConvention } from './loadConvention';

const DUMBBELL_PER_HAND_KG = buildDumbbellInventory();

function buildDumbbellInventory(maxKg = 50) {
  const weights = new Set<number>([2.5]);
  for (let kg = 1; kg <= 10; kg += 1) weights.add(kg);
  for (let kg = 12; kg <= maxKg; kg += 2) weights.add(kg);
  for (let kg = 15; kg <= maxKg; kg += 10) weights.add(kg);
  return [...weights].sort((a, b) => a - b);
}

function buildBarbellTotals(maxKg = 260) {
  const totals: number[] = [];
  for (let total = 20; total <= maxKg; total += 5) totals.push(total);
  return totals;
}

function buildMachineStackInventory(maxKg = 200) {
  const weights: number[] = [];
  for (let kg = 5; kg <= maxKg; kg += 5) weights.push(kg);
  return weights;
}

function getAllowedWeights(convention: LoadConvention) {
  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
    case LOAD_CONVENTIONS.UNILATERAL:
      return DUMBBELL_PER_HAND_KG;
    case LOAD_CONVENTIONS.MACHINE_STACK:
      return buildMachineStackInventory();
    default:
      return buildBarbellTotals();
  }
}

export function snapToGymWeight(
  weightKg: number | null | undefined,
  convention: LoadConvention,
  direction: 'down' | 'up' | 'nearest' = 'down',
): number | null {
  if (weightKg == null || Number.isNaN(weightKg) || weightKg <= 0) return null;

  const allowed = getAllowedWeights(convention);
  if (!allowed.length) return Math.round(weightKg * 10) / 10;

  if (direction === 'down') {
    let best = allowed[0];
    for (const candidate of allowed) {
      if (candidate <= weightKg + 1e-9) best = candidate;
      else break;
    }
    return best;
  }

  if (direction === 'up') {
    for (const candidate of allowed) {
      if (candidate >= weightKg - 1e-9) return candidate;
    }
    return allowed[allowed.length - 1];
  }

  let nearest = allowed[0];
  let bestDistance = Math.abs(weightKg - nearest);
  for (const candidate of allowed) {
    const distance = Math.abs(weightKg - candidate);
    if (distance < bestDistance) {
      nearest = candidate;
      bestDistance = distance;
    }
  }
  return nearest;
}

export function getWeightInputStep(convention: LoadConvention): number {
  switch (convention) {
    case LOAD_CONVENTIONS.DUMBBELL_PER_HAND:
    case LOAD_CONVENTIONS.UNILATERAL:
      return 1;
    default:
      return 5;
  }
}
