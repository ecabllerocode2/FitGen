/** Public R2 base used by curated exercise media. */
export const EXERCISE_MEDIA_PUBLIC_BASE =
  'https://pub-8d5fa4786e4142aab39adba9d49ee865.r2.dev';

/**
 * Catalog exercise ids match R2 object stems:
 * `Barbell_Bench_Press` → `.../Barbell_Bench_Press_0.webp`
 */
export function exerciseImageUrlFromId(
  exerciseId?: string | null,
  frame: 0 | 1 = 0,
): string | undefined {
  if (!exerciseId || typeof exerciseId !== 'string') return undefined;
  const id = exerciseId.trim();
  if (!id) return undefined;
  // Harden against path injection; catalog ids are slug-like ASCII.
  if (id.includes('/') || id.includes('\\') || id.includes('..') || id.includes('?')) {
    return undefined;
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(id)) return undefined;
  return `${EXERCISE_MEDIA_PUBLIC_BASE}/${id}_${frame}.webp`;
}

export function firstNonEmpty(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

/** Resolve primary/secondary media for any exercise-shaped object. */
export function resolveExerciseMediaFromFields(ex: {
  id?: string | null;
  exerciseId?: string | null;
  imageUrl?: string | null;
  imageUrl2?: string | null;
  imagenUrl?: string | null;
  url_img_0?: string | null;
  url_img_1?: string | null;
}): { imageUrl?: string; imageUrl2?: string } {
  const id = ex.exerciseId || ex.id || null;
  const imageUrl =
    firstNonEmpty(ex.imageUrl, ex.imagenUrl, ex.url_img_0) ||
    exerciseImageUrlFromId(id, 0);
  const imageUrl2 =
    firstNonEmpty(ex.imageUrl2, ex.url_img_1) ||
    exerciseImageUrlFromId(id, 1);
  return { imageUrl, imageUrl2 };
}
