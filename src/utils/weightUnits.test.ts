import { describe, expect, it } from 'vitest';
import { LOAD_CONVENTIONS } from './loadConvention';
import {
  fromDisplayWeight,
  kgToLb,
  lbToKg,
  snapInDisplayUnit,
  toDisplayWeight,
} from './weightUnits';

describe('weightUnits', () => {
  it('converts kg and lb consistently', () => {
    expect(kgToLb(25)).toBeCloseTo(55.12, 1);
    expect(lbToKg(135)).toBeCloseTo(61.23, 1);
  });

  it('snaps barbell loads to 5 lb increments', () => {
    expect(snapInDisplayUnit(57.3, 'lb', LOAD_CONVENTIONS.BARBELL_TOTAL)).toBe(55);
    expect(snapInDisplayUnit(58.8, 'lb', LOAD_CONVENTIONS.BARBELL_TOTAL)).toBe(60);
  });

  it('round-trips kg through lb display for barbell', () => {
    const kg = 60;
    const displayLb = toDisplayWeight(kg, 'lb', LOAD_CONVENTIONS.BARBELL_TOTAL);
    expect(displayLb).toBe(130);
    const backKg = fromDisplayWeight(displayLb, 'lb', LOAD_CONVENTIONS.BARBELL_TOTAL);
    expect(backKg).toBeCloseTo(lbToKg(130), 2);
  });

  it('round-trips kg through lb display for dumbbells', () => {
    const kg = 22.5;
    const displayLb = toDisplayWeight(kg, 'lb', LOAD_CONVENTIONS.DUMBBELL_PER_HAND);
    expect(displayLb).toBe(50);
    const backKg = fromDisplayWeight(displayLb, 'lb', LOAD_CONVENTIONS.DUMBBELL_PER_HAND);
    expect(backKg).toBeCloseTo(lbToKg(50), 2);
  });

  it('keeps kg display snapped in metric increments', () => {
    expect(toDisplayWeight(62.3, 'kg', LOAD_CONVENTIONS.BARBELL_TOTAL)).toBe(60);
    expect(fromDisplayWeight(60, 'kg', LOAD_CONVENTIONS.BARBELL_TOTAL)).toBe(60);
  });
});
