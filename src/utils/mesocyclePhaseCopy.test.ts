import { describe, expect, it } from 'vitest';
import { getMesocyclePhaseCopy } from './mesocyclePhaseCopy';

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
