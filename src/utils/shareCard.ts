/** Export a DOM node to PNG data URL (no external deps). */

export interface CelebrationCardSnapshot {
  sessionFocus: string;
  durationLabel: string;
  exerciseCount: number;
  totalSets: number;
  muscles?: string;
  phrase?: string;
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

function readCelebrationSnapshot(element: HTMLElement): CelebrationCardSnapshot | null {
  if (!element.hasAttribute('data-celebration-card')) return null;
  const focusEl = element.querySelector('[data-celebration-focus]');
  const phraseEl = element.querySelector('[data-celebration-phrase]');
  const statEls = element.querySelectorAll('[data-celebration-stat]');
  const musclesEl = element.querySelector('[data-celebration-muscles]');
  return {
    sessionFocus: focusEl?.textContent?.trim() ?? 'Entrenamiento',
    phrase: phraseEl?.textContent?.trim(),
    durationLabel: statEls[0]?.textContent?.trim() ?? '—',
    exerciseCount: Number(statEls[1]?.textContent?.trim() ?? 0),
    totalSets: Number(statEls[2]?.textContent?.trim() ?? 0),
    muscles: musclesEl?.textContent?.trim(),
  };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
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

export function renderCelebrationCardCanvas(data: CelebrationCardSnapshot, scale = 2): string {
  const width = 360;
  const height = 480;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#27272a';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  ctx.fillStyle = '#84cc16';
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('FITGEN', 24, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('¡Sesión completada!', 24, 72);

  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px system-ui, sans-serif';
  if (data.phrase) {
    wrapText(ctx, data.phrase, 24, 98, width - 48, 20);
  }

  ctx.strokeStyle = '#27272a';
  ctx.beginPath();
  ctx.moveTo(24, 140);
  ctx.lineTo(width - 24, 140);
  ctx.stroke();

  ctx.fillStyle = '#52525b';
  ctx.font = '600 10px system-ui, sans-serif';
  ctx.fillText('HOY', 24, 164);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 18px system-ui, sans-serif';
  wrapText(ctx, data.sessionFocus, 24, 188, width - 48, 22);

  const stats = [
    { label: 'duración', value: data.durationLabel },
    { label: 'ejercicios', value: String(data.exerciseCount) },
    { label: 'series', value: String(data.totalSets) },
  ];
  const boxW = (width - 48 - 16) / 3;
  stats.forEach((stat, i) => {
    const bx = 24 + i * (boxW + 8);
    const by = 230;
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, 64, 12);
    ctx.fill();
    ctx.strokeStyle = '#27272a';
    ctx.stroke();
    ctx.fillStyle = i === 0 ? '#a3e635' : '#ffffff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stat.value, bx + boxW / 2, by + 30);
    ctx.fillStyle = '#71717a';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(stat.label, bx + boxW / 2, by + 50);
  });
  ctx.textAlign = 'left';

  if (data.muscles) {
    ctx.fillStyle = '#71717a';
    ctx.font = '12px system-ui, sans-serif';
    wrapText(ctx, data.muscles, 24, 320, width - 48, 18);
  }

  return canvas.toDataURL('image/png');
}

export async function elementToPngDataUrl(element: HTMLElement, scale = 2): Promise<string> {
  const celebration = readCelebrationSnapshot(element);
  if (celebration) {
    return renderCelebrationCardCanvas(celebration, scale);
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
    return renderFallbackCard(element, width, height, scale);
  }
}

function renderFallbackCard(
  element: HTMLElement,
  width: number,
  height: number,
  scale: number,
): string {
  const snapshot = readCelebrationSnapshot(element);
  if (snapshot) return renderCelebrationCardCanvas(snapshot, scale);

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no disponible');
  ctx.scale(scale, scale);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#84cc16';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('FitGen', 24, 36);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  const title = element.querySelector('p')?.textContent ?? '¡Sesión completada!';
  ctx.fillText(title.slice(0, 40), 24, 72);
  ctx.fillStyle = '#a1a1aa';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Entrenamiento completado con FitGen', 24, 100);
  return canvas.toDataURL('image/png');
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function downloadPngFromElement(element: HTMLElement, filename: string) {
  const dataUrl = await elementToPngDataUrl(element);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function sharePngFromElement(element: HTMLElement, title: string, text: string) {
  const dataUrl = await elementToPngDataUrl(element);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], 'fitgen-sesion.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, text, files: [file] });
    return;
  }

  await downloadPngFromElement(element, 'fitgen-sesion.png');
}

export function downloadCelebrationPng(data: CelebrationCardSnapshot, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = renderCelebrationCardCanvas(data);
  link.click();
}

export async function shareCelebrationPng(
  data: CelebrationCardSnapshot,
  title: string,
  text: string,
) {
  const dataUrl = renderCelebrationCardCanvas(data);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], 'fitgen-sesion.png', { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title, text, files: [file] });
    return;
  }

  downloadCelebrationPng(data, 'fitgen-sesion.png');
}

export function isCelebrationCardExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}
