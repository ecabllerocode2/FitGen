/**
 * Downscale/compress a user photo before keeping it in memory as a data URL.
 * Camera captures on mid/low Android devices often OOM if we FileReader the full JPEG.
 */

const DEFAULT_MAX_EDGE = 1280;
const DEFAULT_QUALITY = 0.82;

/** @internal exported for tests */
export function computeResize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Returns a JPEG data URL capped at maxEdge on the long side.
 */
export async function compressImageFileToDataUrl(
  file: File,
  options: { maxEdge?: number; quality?: number } = {},
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen');
  }

  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;

  let source: ImageBitmap | null = null;
  let resized: ImageBitmap | null = null;

  try {
    source = await createImageBitmap(file);
    const sized = computeResize(source.width, source.height, maxEdge);

    let drawSource: ImageBitmap = source;
    if (sized.width !== source.width || sized.height !== source.height) {
      try {
        resized = await createImageBitmap(source, 0, 0, source.width, source.height, {
          resizeWidth: sized.width,
          resizeHeight: sized.height,
          resizeQuality: 'medium',
        });
        drawSource = resized;
      } catch {
        // Fall back to drawing the full bitmap into a smaller canvas.
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = sized.width;
    canvas.height = sized.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');
    ctx.drawImage(drawSource, 0, 0, sized.width, sized.height);

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    canvas.width = 0;
    canvas.height = 0;
    return dataUrl;
  } finally {
    resized?.close();
    source?.close();
  }
}
