import { describe, expect, it } from 'vitest';
import {
  getDeloadSessionCue,
  getMesocyclePhaseCopy,
  isDeloadPhase,
} from './mesocyclePhaseCopy';

describe('mesocyclePhaseCopy', () => {
  it('explains accumulation week', () => {
    const copy = getMesocyclePhaseCopy('acumulacion');
    expect(copy.title).toMatch(/Acumulación/i);
    expect(copy.explanation.length).toBeGreaterThan(20);
    expect(copy.explanation.toLowerCase()).toMatch(/volumen/);
  });

  it('explains intensification week', () => {
    const copy = getMesocyclePhaseCopy('intensificacion');
    expect(copy.title).toMatch(/Intensificación/i);
    expect(copy.explanation.toLowerCase()).toMatch(/intensidad|carga|rir/);
  });

  it('explains deload week', () => {
    const copy = getMesocyclePhaseCopy('deload');
    expect(copy.title).toMatch(/Descarga/i);
    expect(copy.explanation.toLowerCase()).toMatch(/recuper/);
    expect(copy.explanation.toLowerCase()).toMatch(/peso|rir/);
  });

  it('detects deload phase', () => {
    expect(isDeloadPhase('deload')).toBe(true);
    expect(isDeloadPhase('DELOAD')).toBe(true);
    expect(isDeloadPhase('acumulacion')).toBe(false);
  });

  it('builds deload session cue with RIR target', () => {
    expect(getDeloadSessionCue(3)).toMatch(/RIR 3/);
    expect(getDeloadSessionCue(null)).toMatch(/RIR 3/);
    expect(getDeloadSessionCue(3).toLowerCase()).toMatch(/peso prescrito|fallo/);
  });

  it('falls back to focus label when phase unknown', () => {
    const copy = getMesocyclePhaseCopy(null, 'Foco custom');
    expect(copy.title).toBe('Foco custom');
    expect(copy.explanation.length).toBeGreaterThan(10);
  });

  it('falls back to generic copy when phase and focus are missing', () => {
    const copy = getMesocyclePhaseCopy(undefined, '   ');
    expect(copy.title).toBe('Mesociclo activo');
    expect(copy.shortLabel).toBe('Mesociclo');
    expect(copy.explanation.toLowerCase()).toMatch(/periodizaci|volumen|intensidad/);
  });
});
