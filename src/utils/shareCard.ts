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

function wrapTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let cursorY = y;
  ctx.textAlign = 'center';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, centerX, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, centerX, cursorY);
  ctx.textAlign = 'left';
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

function drawDesignedBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  aspect: ShareCardAspect,
) {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#141416');
  bg.addColorStop(0.5, '#09090b');
  bg.addColorStop(1, '#050506');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const glowTop = ctx.createRadialGradient(width * 0.85, height * 0.12, 0, width * 0.85, height * 0.12, width * 0.55);
  glowTop.addColorStop(0, 'rgba(132, 204, 22, 0.18)');
  glowTop.addColorStop(1, 'rgba(132, 204, 22, 0)');
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, width, height);

  const glowBottom = ctx.createRadialGradient(width * 0.15, height * 0.88, 0, width * 0.15, height * 0.88, width * 0.45);
  glowBottom.addColorStop(0, 'rgba(163, 230, 53, 0.1)');
  glowBottom.addColorStop(1, 'rgba(163, 230, 53, 0)');
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(132, 204, 22, 0.22)';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  const ringY = aspect === '9:16' ? height * 0.38 : height * 0.42;
  ctx.strokeStyle = 'rgba(132, 204, 22, 0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(width / 2, ringY, width * 0.32, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStatTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  accent = false,
) {
  ctx.fillStyle = 'rgba(24, 24, 27, 0.92)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(63, 63, 70, 0.9)';
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = accent ? '#a3e635' : '#ffffff';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(value, x + w / 2, y + h / 2 - 2);
  ctx.fillStyle = '#71717a';
  ctx.font = '600 10px system-ui, -apple-system, sans-serif';
  ctx.fillText(label, x + w / 2, y + h / 2 + 16);
  ctx.textAlign = 'left';
}

function drawHeaderBadges(
  ctx: CanvasRenderingContext2D,
  width: number,
  pad: number,
  aspect: ShareCardAspect,
) {
  ctx.fillStyle = '#84cc16';
  ctx.font = '700 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('FITGEN', pad, pad + 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(163, 230, 53, 0.85)';
  ctx.font = '600 10px system-ui, -apple-system, sans-serif';
  ctx.fillText(aspect === '9:16' ? 'STORY' : 'FEED', width - pad, pad + 12);
  ctx.textAlign = 'left';
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

function renderDesignShareCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ShareCardData,
  aspect: ShareCardAspect,
) {
  drawDesignedBackground(ctx, width, height, aspect);
  const pad = 32;
  const maxTextWidth = width - pad * 2;
  drawHeaderBadges(ctx, width, pad, aspect);

  const dateLabel = formatCompletedLabel(data.completedAt);
  const weightLabel = formatTotalWeightKg(data.totalWeightKg ?? null);
  const centerY = aspect === '9:16' ? height * 0.36 : height * 0.34;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#a3e635';
  ctx.font = '700 10px system-ui, -apple-system, sans-serif';
  ctx.fillText('SESIÓN COMPLETADA', width / 2, centerY - 56);

  if (dateLabel) {
    ctx.fillStyle = '#71717a';
    ctx.font = '600 10px system-ui, -apple-system, sans-serif';
    ctx.fillText(dateLabel.toUpperCase(), width / 2, centerY - 36);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  wrapTextCentered(ctx, data.sessionFocus, width / 2, centerY - 8, maxTextWidth, 34);

  if (weightLabel) {
    ctx.fillStyle = '#a3e635';
    ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
    ctx.fillText(weightLabel, width / 2, centerY + 72);
    ctx.fillStyle = '#71717a';
    ctx.font = '600 12px system-ui, -apple-system, sans-serif';
    ctx.fillText('movidos en total', width / 2, centerY + 98);
  }

  const tilesY = weightLabel ? centerY + 130 : centerY + 48;
  const gap = 10;
  const tileW = (maxTextWidth - gap * 2) / 3;
  const tileH = 64;
  drawStatTile(ctx, pad, tilesY, tileW, tileH, data.durationLabel || '—', 'DURACIÓN', true);
  drawStatTile(ctx, pad + tileW + gap, tilesY, tileW, tileH, String(data.exerciseCount), 'EJERCICIOS');
  drawStatTile(ctx, pad + (tileW + gap) * 2, tilesY, tileW, tileH, String(data.totalSets), 'SERIES');

  let belowY = tilesY + tileH + 24;
  if (data.muscles?.length) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 13px system-ui, -apple-system, sans-serif';
    belowY = wrapTextCentered(
      ctx,
      data.muscles.slice(0, 4).join(' · '),
      width / 2,
      belowY,
      maxTextWidth,
      20,
    ) + 16;
  }

  if (data.phrase) {
    ctx.fillStyle = '#71717a';
    ctx.font = 'italic 14px system-ui, -apple-system, sans-serif';
    wrapTextCentered(ctx, `"${data.phrase}"`, width / 2, belowY, maxTextWidth - 16, 20);
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(132, 204, 22, 0.9)';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Entrenamiento completado con FitGen', width / 2, height - 24);
  ctx.textAlign = 'left';
}

function renderPhotoOverlayShareCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: ShareCardData,
  aspect: ShareCardAspect,
) {
  const pad = 28;
  const maxTextWidth = width - pad * 2;
  drawBottomScrim(ctx, width, height, aspect === '9:16' ? 0.48 : 0.45);
  drawHeaderBadges(ctx, width, pad, aspect);

  const footerY = height - 22;
  ctx.fillStyle = 'rgba(132, 204, 22, 0.9)';
  ctx.font = '600 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Entrenamiento completado con FitGen', pad, footerY);

  const dateLabel = formatCompletedLabel(data.completedAt);
  const weightLabel = formatTotalWeightKg(data.totalWeightKg ?? null);
  const bullets = buildBullets(data);
  const panelStart = height * (aspect === '9:16' ? 0.48 : 0.45);

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

  const hasPhoto = Boolean(data.photoDataUrl);

  if (hasPhoto) {
    try {
      const photo = await loadImage(data.photoDataUrl!);
      drawCoverImage(ctx, photo, width, height);
      drawBrandGradient(ctx, width, height);
    } catch {
      drawDesignedBackground(ctx, width, height, aspect);
      renderDesignShareCard(ctx, width, height, data, aspect);
      return canvas.toDataURL('image/png');
    }
    renderPhotoOverlayShareCard(ctx, width, height, data, aspect);
  } else {
    drawDesignedBackground(ctx, width, height, aspect);
    renderDesignShareCard(ctx, width, height, data, aspect);
  }

  return canvas.toDataURL('image/png');
}

export async function renderShareCardPreviewUrl(data: ShareCardData): Promise<string> {
  return renderShareCardCanvas(data, 2);
}

/** Sync legacy renderer — delegates to design-only card. */
export function renderCelebrationCardCanvas(data: ShareCardData, scale = 2): string {
  const aspect = data.aspect ?? '4:5';
  const { width, height } = DIMENSIONS[aspect];
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.scale(scale, scale);
  drawDesignedBackground(ctx, width, height, aspect);
  renderDesignShareCard(ctx, width, height, data, aspect);
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
