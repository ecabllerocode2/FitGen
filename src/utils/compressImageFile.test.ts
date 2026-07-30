import { describe, expect, it } from 'vitest';
import { computeResize } from '../utils/compressImageFile';

describe('compressImageFile helpers', () => {
  it('leaves small images unchanged', () => {
    expect(computeResize(800, 600, 1280)).toEqual({ width: 800, height: 600 });
  });

  it('caps the long edge', () => {
    expect(computeResize(4000, 3000, 1280)).toEqual({ width: 1280, height: 960 });
  });
});
