import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Download, ImagePlus, Share2, Sparkles } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import {
  downloadShareCardPng,
  renderShareCardCanvas,
  renderShareCardPreviewUrl,
  shareShareCardPng,
  type ShareCardAspect,
  type ShareCardData,
} from '../utils/shareCard';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';

interface SessionShareCardProps {
  data: ShareCardData;
  className?: string;
  showPhotoOptions?: boolean;
  showAspectToggle?: boolean;
  compact?: boolean;
  /** recentSessions doc id — enables R2 persistence of the rendered card */
  archivedSessionId?: string | null;
  /** Previously stored card URL (with or without photo) */
  persistedCardUrl?: string | null;
  /** Upload design card once on mount (celebration flow). Hub uses photo-only uploads. */
  persistOnMount?: boolean;
  onCardPersisted?: (url: string, expiresAt: string | null) => void;
}

async function persistCelebrationCard(
  archivedSessionId: string,
  imageBase64: string,
): Promise<{ url: string; expiresAt: string | null } | null> {
  const user = getAuth().currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  const response = await authenticatedFetch(API_ENDPOINTS.SESSION_CELEBRATION_CARD, token, {
    method: 'POST',
    body: JSON.stringify({ archivedSessionId, imageBase64 }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.stored || !payload?.celebrationCardUrl) {
    return null;
  }
  return {
    url: payload.celebrationCardUrl as string,
    expiresAt: (payload.celebrationCardExpiresAt as string | null) ?? null,
  };
}

export default function SessionShareCard({
  data,
  className = '',
  showPhotoOptions = true,
  showAspectToggle = true,
  compact = false,
  archivedSessionId = null,
  persistedCardUrl = null,
  persistOnMount = false,
  onCardPersisted,
}: SessionShareCardProps) {
  const [aspect, setAspect] = useState<ShareCardAspect>(data.aspect ?? '4:5');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(data.photoDataUrl ?? null);
  const [previewUrl, setPreviewUrl] = useState<string>(persistedCardUrl ?? '');
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const [persistNotice, setPersistNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRef = useRef<number | null>(null);
  const photoTouchedRef = useRef(false);
  const mountPersistedRef = useRef(false);
  const uploadGenRef = useRef(0);

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
    const canReusePersisted =
      Boolean(persistedCardUrl) &&
      !photoDataUrl &&
      !photoTouchedRef.current &&
      aspect === (data.aspect ?? '4:5');

    if (canReusePersisted && persistedCardUrl) {
      setPreviewUrl(persistedCardUrl);
      return () => {
        cancelled = true;
      };
    }

    void renderShareCardPreviewUrl(cardData).then((url) => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [cardData, persistedCardUrl, photoDataUrl, aspect, data.aspect]);

  // Persist to R2 (30-day TTL): once on celebration mount, and whenever the user changes the photo.
  useEffect(() => {
    if (!archivedSessionId) return;

    const shouldPersistPhoto = photoTouchedRef.current;
    const shouldPersistMount =
      persistOnMount && !mountPersistedRef.current && !photoTouchedRef.current;
    if (!shouldPersistPhoto && !shouldPersistMount) return;

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
    }

    uploadTimerRef.current = window.setTimeout(() => {
      const gen = ++uploadGenRef.current;
      void (async () => {
        try {
          const imageBase64 = await renderShareCardCanvas(cardData, 2);
          if (gen !== uploadGenRef.current) return;
          const stored = await persistCelebrationCard(archivedSessionId, imageBase64);
          if (gen !== uploadGenRef.current || !stored) return;
          if (shouldPersistMount) mountPersistedRef.current = true;
          onCardPersisted?.(stored.url, stored.expiresAt);
          if (shouldPersistPhoto) {
            setPersistNotice(
              photoDataUrl
                ? 'Foto guardada en tu tarjeta por 30 días'
                : 'Tarjeta actualizada sin foto',
            );
          }
        } catch (err) {
          console.warn('No se pudo persistir tarjeta de celebración:', err);
        }
      })();
    }, 700);

    return () => {
      if (uploadTimerRef.current) {
        window.clearTimeout(uploadTimerRef.current);
      }
    };
  }, [archivedSessionId, photoDataUrl, aspect, cardData, onCardPersisted, persistOnMount]);

  useEffect(() => {
    if (!persistNotice) return;
    const timer = window.setTimeout(() => setPersistNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [persistNotice]);

  const handlePhotoFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        photoTouchedRef.current = true;
        uploadGenRef.current += 1; // invalidate in-flight design-only uploads
        setPhotoDataUrl(reader.result);
      }
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
                  onClick={() => {
                    photoTouchedRef.current = true;
                    uploadGenRef.current += 1;
                    setPhotoDataUrl(null);
                  }}
                  className="rounded-xl border border-zinc-800 px-3 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Quitar
                </button>
              )}
            </div>
          )}
          {persistNotice && (
            <p className="text-[11px] text-lime-400/90 text-center">{persistNotice}</p>
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
