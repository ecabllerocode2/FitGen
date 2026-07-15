/** Share card PNG generation — canvas-based, mobile-friendly download/share. */

import { formatTotalWeightKg } from './sessionWeight';

export type ShareCardAspect = '4:5' | '9:16';

export interface ShareCardData {
  sessionFocus: string;
  durationLabel: string;
  exerciseCount: number;
  totalSets: number;
  totalWeightKg?: number | null;
  muscles?: string[];
  phrase?: string;
  completedAt?: string;
  photoDataUrl?: string | null;
  aspect?: ShareCardAspect;
}

/** @deprecated use ShareCardData */
export type CelebrationCardSnapshot = ShareCardData;

const DIMENSIONS: Record<ShareCardAspect, { width: number; height: number }> = {
  '4:5': { width: 540, height: 675 },
  '9:16': { width: 540, height: 960 },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
) {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
}

function drawBrandGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, height * 0.35, 0, height);
  gradient.addColorStop(0, 'rgba(9, 9, 11, 0.05)');
  gradient.addColorStop(0.45, 'rgba(9, 9, 11, 0.55)');
  gradient.addColorStop(1, 'rgba(9, 9, 11, 0.94)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const accent = ctx.createLinearGradient(0, 0, width, height);
  accent.addColorStop(0, 'rgba(132, 204, 22, 0.08)');
  accent.addColorStop(1, 'rgba(132, 204, 22, 0)');
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, height);
}

function drawPlainBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#18181b');
  bg.addColorStop(0.55, '#09090b');
  bg.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(132, 204, 22, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

function formatCompletedLabel(iso?: string): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return null;
  }
}

function buildBullets(data: ShareCardData): string[] {
  const bullets: string[] = [];
  bullets.push(`${data.exerciseCount} ejercicios · ${data.totalSets} series`);
  if (data.durationLabel && data.durationLabel !== '—') {
    bullets.push(`${data.durationLabel} de entrenamiento`);
  }
  if (data.muscles?.length) {
    bullets.push(data.muscles.slice(0, 4).join(' · '));
  }
  return bullets;
}

function measureWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(/\s+/);
  let line = '';
  let lines = 1;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines += 1;
      line = word;
    } else {
      line = test;
    }
  }
  return lines * lineHeight;
}

function drawBottomScrim(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  panelStartRatio: number,
) {
  const panelStart = height * panelStartRatio;
  const gradient = ctx.createLinearGradient(0, panelStart - 48, 0, height);
  gradient.addColorStop(0, 'rgba(9, 9, 11, 0)');
  gradient.addColorStop(0.25, 'rgba(9, 9, 11, 0.72)');
  gradient.addColorStop(1, 'rgba(9, 9, 11, 0.96)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, panelStart - 48, width, height - panelStart + 48);
  return panelStart;
}

function drawBulletsDown(
  ctx: CanvasRenderingContext2D,
  bullets: string[],
  x: number,
  startY: number,
  maxWidth: number,
): number {
  let y = startY;
  for (const bullet of bullets) {
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(x + 5, y + 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e4e4e7';
    ctx.font = '500 14px system-ui, -apple-system, sans-serif';
    y = wrapText(ctx, bullet, x + 18, y + 12, maxWidth - 18, 20) + 10;
  }
  return y;
}

export async function renderShareCardCanvas(
  data: ShareCardData,
  scale = 2,
): Promise<string> {
  const aspect = data.aspect ?? '4:5';
  const { width, height } = DIMENSIONS[aspect];
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.scale(scale, scale);

  if (data.photoDataUrl) {
    try {
      const photo = await loadImage(data.photoDataUrl);
      drawCoverImage(ctx, photo, width, height);
      drawBrandGradient(ctx, width, height);
    } catch {
      drawPlainBackground(ctx, width, height);
    }
  } else {
    drawPlainBackground(ctx, width, height);
  }

  const pad = 28;
  const maxTextWidth = width - pad * 2;
  const panelStart = drawBottomScrim(ctx, width, height, aspect === '9:16' ? 0.48 : 0.45);

  ctx.fillStyle = '#84cc16';
  ctx.font = '700 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('FITGEN', pad, pad + 12);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(163, 230, 53, 0.85)';
  ctx.font = '600 10px system-ui, -apple-system, sans-serif';
  ctx.fillText(aspect === '9:16' ? 'STORY' : 'FEED', width - pad, pad + 12);
  ctx.textAlign = 'left';

  const footerY = height - 22;
  ctx.fillStyle = 'rgba(132, 204, 22, 0.9)';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Entrenamiento completado con FitGen', pad, footerY);

  const dateLabel = formatCompletedLabel(data.completedAt);
  const weightLabel = formatTotalWeightKg(data.totalWeightKg ?? null);
  const bullets = buildBullets(data);

  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  const titleHeight = measureWrapText(ctx, data.sessionFocus, maxTextWidth, 32);
  ctx.font = '500 13px system-ui, -apple-system, sans-serif';
  const phraseHeight = data.phrase
    ? measureWrapText(ctx, data.phrase, maxTextWidth, 18) + 12
    : 0;
  const weightHeight = weightLabel ? 36 : 0;
  const bulletHeight = bullets.length * 28 + 8;
  const dateHeight = dateLabel ? 20 : 0;

  const contentHeight = dateHeight + titleHeight + 12 + weightHeight + bulletHeight + phraseHeight + 16;
  let y = Math.max(panelStart + 16, footerY - contentHeight - 8);

  if (dateLabel) {
    ctx.fillStyle = '#71717a';
    ctx.font = '600 10px system-ui, -apple-system, sans-serif';
    ctx.fillText(dateLabel.toUpperCase(), pad, y + 12);
    y += dateHeight;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  y = wrapText(ctx, data.sessionFocus, pad, y + 28, maxTextWidth, 32) + 10;

  if (weightLabel) {
    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${weightLabel} movidos`, pad, y + 24);
    y += weightHeight;
  }

  y = drawBulletsDown(ctx, bullets, pad, y + 4, maxTextWidth);

  if (data.phrase) {
    ctx.fillStyle = '#71717a';
    ctx.font = 'italic 13px system-ui, -apple-system, sans-serif';
    wrapText(ctx, data.phrase, pad, y + 16, maxTextWidth, 18);
  }

  return canvas.toDataURL('image/png');
}

export async function renderShareCardPreviewUrl(data: ShareCardData): Promise<string> {
  return renderShareCardCanvas(data, 2);
}

/** Sync legacy renderer — plain card without photo. */
export function renderCelebrationCardCanvas(data: ShareCardData, scale = 2): string {
  const aspect = data.aspect ?? '4:5';
  const { width, height } = DIMENSIONS[aspect];
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.scale(scale, scale);
  drawPlainBackground(ctx, width, height);

  ctx.fillStyle = '#84cc16';
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('FITGEN', 24, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('¡Sesión completada!', 24, 72);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px system-ui, sans-serif';
  if (data.phrase) wrapText(ctx, data.phrase, 24, 98, width - 48, 20);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 18px system-ui, sans-serif';
  wrapText(ctx, data.sessionFocus, 24, 160, width - 48, 22);

  const weightLabel = formatTotalWeightKg(data.totalWeightKg ?? null);
  if (weightLabel) {
    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(weightLabel, 24, 210);
  }

  return canvas.toDataURL('image/png');
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadShareCardPng(data: ShareCardData, filename: string) {
  const dataUrl = await renderShareCardCanvas(data, 2);
  const blob = await dataUrlToBlob(dataUrl);
  await triggerBlobDownload(blob, filename);
}

export async function shareShareCardPng(data: ShareCardData) {
  const dataUrl = await renderShareCardCanvas(data, 2);
  const blob = await dataUrlToBlob(dataUrl);
  const file = new File([blob], 'fitgen-sesion.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }

  await triggerBlobDownload(blob, 'fitgen-sesion.png');
}

export async function downloadCelebrationPng(data: ShareCardData, filename: string) {
  await downloadShareCardPng(data, filename);
}

export async function shareCelebrationPng(data: ShareCardData) {
  await shareShareCardPng(data);
}

export function isCelebrationCardExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

function readCelebrationSnapshot(element: HTMLElement): ShareCardData | null {
  if (!element.hasAttribute('data-celebration-card')) return null;
  const focusEl = element.querySelector('[data-celebration-focus]');
  const phraseEl = element.querySelector('[data-celebration-phrase]');
  const statEls = element.querySelectorAll('[data-celebration-stat]');
  const musclesEl = element.querySelector('[data-celebration-muscles]');
  const weightEl = element.querySelector('[data-celebration-weight]');
  return {
    sessionFocus: focusEl?.textContent?.trim() ?? 'Entrenamiento',
    phrase: phraseEl?.textContent?.trim(),
    durationLabel: statEls[0]?.textContent?.trim() ?? '—',
    exerciseCount: Number(statEls[1]?.textContent?.trim() ?? 0),
    totalSets: Number(statEls[2]?.textContent?.trim() ?? 0),
    totalWeightKg: weightEl ? Number(weightEl.textContent?.replace(/\D/g, '') || 0) : null,
    muscles: musclesEl?.textContent?.trim()?.split(' · '),
    aspect: '4:5',
  };
}

function inlineComputedStyles(source: Element, target: Element) {
  if (!(source instanceof HTMLElement) || !(target instanceof HTMLElement)) return;
  const computed = window.getComputedStyle(source);
  for (const key of computed) {
    target.style.setProperty(key, computed.getPropertyValue(key));
  }
  const sourceChildren = source.children;
  const targetChildren = target.children;
  for (let i = 0; i < sourceChildren.length; i++) {
    inlineComputedStyles(sourceChildren[i], targetChildren[i]);
  }
}

export async function elementToPngDataUrl(element: HTMLElement, scale = 2): Promise<string> {
  const celebration = readCelebrationSnapshot(element);
  if (celebration) {
    return renderShareCardCanvas(celebration, scale);
  }

  const rect = element.getBoundingClientRect();
  const width = Math.max(Math.ceil(rect.width), 320);
  const height = Math.max(Math.ceil(rect.height), 400);

  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.background = '#09090b';
  inlineComputedStyles(element, clone);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        ${new XMLSerializer().serializeToString(clone)}
      </foreignObject>
    </svg>`;

  const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  try {
    const img = await loadImage(encoded);
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas no disponible');
    ctx.scale(scale, scale);
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } catch {
    return renderCelebrationCardCanvas(
      { sessionFocus: 'Entrenamiento', durationLabel: '—', exerciseCount: 0, totalSets: 0 },
      scale,
    );
  }
}

export async function downloadPngFromElement(element: HTMLElement, filename: string) {
  const dataUrl = await elementToPngDataUrl(element);
  const blob = await dataUrlToBlob(dataUrl);
  await triggerBlobDownload(blob, filename);
}

export async function sharePngFromElement(element: HTMLElement) {
  const dataUrl = await elementToPngDataUrl(element);
  const blob = await dataUrlToBlob(dataUrl);
  const file = new File([blob], 'fitgen-sesion.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
    return;
  }

  await triggerBlobDownload(blob, 'fitgen-sesion.png');
}
