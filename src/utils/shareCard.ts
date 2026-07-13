/** Export a DOM node to PNG data URL (no external deps). */
export async function elementToPngDataUrl(element: HTMLElement, scale = 2): Promise<string> {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);

  const xmlns = 'http://www.w3.org/1999/xhtml';
  const clone = element.cloneNode(true) as HTMLElement;
  clone.setAttribute('xmlns', xmlns);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        ${new XMLSerializer().serializeToString(clone)}
      </foreignObject>
    </svg>`;

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url);
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
  } finally {
    URL.revokeObjectURL(url);
  }
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

  if (navigator.share) {
    await navigator.share({ title, text, url: window.location.origin });
    return;
  }

  await downloadPngFromElement(element, 'fitgen-sesion.png');
}
