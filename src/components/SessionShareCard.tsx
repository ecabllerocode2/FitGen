import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Download, ImagePlus, Share2, Sparkles } from 'lucide-react';
import {
  downloadShareCardPng,
  renderShareCardPreviewUrl,
  shareShareCardPng,
  type ShareCardAspect,
  type ShareCardData,
} from '../utils/shareCard';

interface SessionShareCardProps {
  data: ShareCardData;
  className?: string;
  showPhotoOptions?: boolean;
  showAspectToggle?: boolean;
  compact?: boolean;
}

export default function SessionShareCard({
  data,
  className = '',
  showPhotoOptions = true,
  showAspectToggle = true,
  compact = false,
}: SessionShareCardProps) {
  const [aspect, setAspect] = useState<ShareCardAspect>(data.aspect ?? '4:5');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(data.photoDataUrl ?? null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardData = useMemo<ShareCardData>(
    () => ({
      ...data,
      aspect,
      photoDataUrl,
    }),
    [data, aspect, photoDataUrl],
  );

  useEffect(() => {
    let cancelled = false;
    void renderShareCardPreviewUrl(cardData).then((url) => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [cardData]);

  const handlePhotoFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPhotoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    setBusy('download');
    try {
      await downloadShareCardPng(cardData, `fitgen-${Date.now()}.png`);
    } catch {
      alert('No se pudo descargar la imagen. Intenta de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    setBusy('share');
    try {
      await shareShareCardPng(cardData);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        alert('No se pudo compartir. Prueba descargar la imagen.');
      }
    } finally {
      setBusy(null);
    }
  };

  const aspectClass = aspect === '9:16' ? 'aspect-[9/16]' : 'aspect-[4/5]';

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 ${aspectClass}`}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={`Resumen ${data.sessionFocus}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-600">
            Generando tarjeta…
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-full bg-zinc-950/70 px-2 py-1 text-[10px] text-lime-400 ring-1 ring-lime-500/30">
          <Sparkles className="inline w-3 h-3 mr-1 -mt-0.5" />
          FitGen
        </div>
      </div>

      {(showAspectToggle || showPhotoOptions) && (
        <div className={`space-y-3 ${compact ? '' : ''}`}>
          {showAspectToggle && (
            <div className="flex gap-2 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800">
              {(['4:5', '9:16'] as ShareCardAspect[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAspect(option)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                    aspect === option
                      ? 'bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {option === '4:5' ? 'Feed 4:5' : 'Story 9:16'}
                </button>
              ))}
            </div>
          )}

          {showPhotoOptions && (
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-700"
              >
                <ImagePlus className="w-4 h-4" />
                Galería
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 cursor-pointer">
                <Camera className="w-4 h-4" />
                Cámara
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {photoDataUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(null)}
                  className="rounded-xl border border-zinc-800 px-3 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Quitar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy !== null || !previewUrl}
          className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-3.5 text-sm font-medium text-zinc-200 hover:border-zinc-700 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {busy === 'download' ? 'Generando…' : 'Descargar PNG'}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={busy !== null || !previewUrl}
          className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-3.5 text-sm font-medium text-zinc-200 hover:border-zinc-700 disabled:opacity-50"
        >
          <Share2 className="w-4 h-4" />
          {busy === 'share' ? 'Abriendo…' : 'Compartir'}
        </button>
      </div>
    </div>
  );
}
