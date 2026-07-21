import React, { useEffect, useRef, useState } from 'react';
import { Dumbbell } from 'lucide-react';

/** Trim / accept catalog URLs as-is (R2 keys are already URL-safe ASCII). */
export function normalizeExerciseImageUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  return trimmed || undefined;
}

export function resolveExerciseImageUrls(ex: {
  imageUrl?: string | null;
  imageUrl2?: string | null;
  imagenUrl?: string | null;
  url_img_0?: string | null;
  url_img_1?: string | null;
}): { primary?: string; secondary?: string } {
  const primary = normalizeExerciseImageUrl(ex.imageUrl || ex.imagenUrl || ex.url_img_0 || null);
  const secondary = normalizeExerciseImageUrl(ex.imageUrl2 || ex.url_img_1 || null);
  if (secondary && secondary === primary) return { primary };
  return { primary, secondary };
}

type ExerciseMediaImageProps = {
  imageUrl?: string | null;
  imageUrl2?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  icon?: React.ReactNode;
  fit?: 'cover' | 'contain';
};

/**
 * Workout media thumbnails.
 * Important: do NOT remount <img> on animation/retries — abort events look like load
 * failures and were incorrectly permanently falling back to the placeholder icon.
 */
export function ExerciseMediaImage({
  imageUrl,
  imageUrl2,
  alt,
  className = '',
  imgClassName,
  icon,
  fit = 'cover',
}: ExerciseMediaImageProps) {
  const candidates = [normalizeExerciseImageUrl(imageUrl), normalizeExerciseImageUrl(imageUrl2)].filter(
    (u, i, arr): u is string => Boolean(u) && arr.indexOf(u) === i,
  );

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [failed, setFailed] = useState(candidates.length === 0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const srcAssignedAtRef = useRef(0);
  const softRetryUsedRef = useRef(false);

  useEffect(() => {
    setCandidateIndex(0);
    setFailed(candidates.length === 0);
    softRetryUsedRef.current = false;
    srcAssignedAtRef.current = Date.now();
  }, [imageUrl, imageUrl2]);

  const activeUrl = !failed ? candidates[candidateIndex] : undefined;
  const resolvedImgClass =
    imgClassName ??
    (fit === 'contain' ? 'w-full h-full object-contain' : 'w-full h-full object-cover');

  const handleError = () => {
    const ageMs = Date.now() - srcAssignedAtRef.current;
    // Aborted loads from remount/parent updates fire onError almost immediately.
    if (ageMs < 500 && activeUrl && !softRetryUsedRef.current) {
      softRetryUsedRef.current = true;
      const img = imgRef.current;
      if (img) {
        const url = activeUrl;
        img.removeAttribute('src');
        requestAnimationFrame(() => {
          if (imgRef.current) {
            srcAssignedAtRef.current = Date.now();
            imgRef.current.src = url;
          }
        });
      }
      return;
    }

    if (candidateIndex + 1 < candidates.length) {
      softRetryUsedRef.current = false;
      srcAssignedAtRef.current = Date.now();
      setCandidateIndex((prev) => prev + 1);
      return;
    }

    setFailed(true);
  };

  if (!activeUrl) {
    return (
      <button
        type="button"
        className={`flex items-center justify-center bg-zinc-800 ${className}`}
        onClick={() => {
          if (candidates.length === 0) return;
          softRetryUsedRef.current = false;
          srcAssignedAtRef.current = Date.now();
          setCandidateIndex(0);
          setFailed(false);
        }}
        aria-label={`Reintentar imagen de ${alt}`}
      >
        {icon ?? <Dumbbell className="w-6 h-6 text-zinc-500" />}
      </button>
    );
  }

  return (
    <div className={className}>
      <img
        ref={imgRef}
        src={activeUrl}
        alt={alt}
        className={resolvedImgClass}
        decoding="async"
        loading="eager"
        draggable={false}
        onLoad={() => {
          softRetryUsedRef.current = false;
        }}
        onError={handleError}
      />
    </div>
  );
}

type AnimatedExerciseMediaProps = {
  imageUrl1?: string | null;
  imageUrl2?: string | null;
  exerciseName: string;
  className?: string;
};

/** Two always-mounted frames; opacity flip avoids abort/onError false failures. */
export function AnimatedExerciseMedia({
  imageUrl1,
  imageUrl2,
  exerciseName,
  className = '',
}: AnimatedExerciseMediaProps) {
  const primary = normalizeExerciseImageUrl(imageUrl1);
  const secondary = normalizeExerciseImageUrl(imageUrl2);
  const [showFirst, setShowFirst] = useState(true);
  const [primaryOk, setPrimaryOk] = useState(Boolean(primary));
  const [secondaryOk, setSecondaryOk] = useState(Boolean(secondary));
  const primaryAssignedAt = useRef(0);
  const secondaryAssignedAt = useRef(0);
  const primarySoftRetryUsed = useRef(false);
  const secondarySoftRetryUsed = useRef(false);

  useEffect(() => {
    setShowFirst(true);
    setPrimaryOk(Boolean(primary));
    setSecondaryOk(Boolean(secondary));
    primaryAssignedAt.current = Date.now();
    secondaryAssignedAt.current = Date.now();
    primarySoftRetryUsed.current = false;
    secondarySoftRetryUsed.current = false;
  }, [primary, secondary]);

  useEffect(() => {
    if (!primaryOk || !secondaryOk) return;
    const interval = window.setInterval(() => setShowFirst((v) => !v), 1500);
    return () => window.clearInterval(interval);
  }, [primaryOk, secondaryOk]);

  const handlePrimaryError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (Date.now() - primaryAssignedAt.current < 500 && primary && !primarySoftRetryUsed.current) {
      primarySoftRetryUsed.current = true;
      const img = event.currentTarget;
      const url = primary;
      img.removeAttribute('src');
      requestAnimationFrame(() => {
        primaryAssignedAt.current = Date.now();
        img.src = url;
      });
      return;
    }
    setPrimaryOk(false);
  };

  const handleSecondaryError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (Date.now() - secondaryAssignedAt.current < 500 && secondary && !secondarySoftRetryUsed.current) {
      secondarySoftRetryUsed.current = true;
      const img = event.currentTarget;
      const url = secondary;
      img.removeAttribute('src');
      requestAnimationFrame(() => {
        secondaryAssignedAt.current = Date.now();
        img.src = url;
      });
      return;
    }
    setSecondaryOk(false);
  };

  const hasAny = (primary && primaryOk) || (secondary && secondaryOk);

  return (
    <div className={`relative w-full aspect-video bg-zinc-800 rounded-2xl overflow-hidden ${className}`}>
      {hasAny ? (
        <>
          {primary && (
            <img
              src={primary}
              alt={exerciseName}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                primaryOk && (showFirst || !secondaryOk) ? 'opacity-100' : 'opacity-0'
              }`}
              decoding="async"
              loading="eager"
              draggable={false}
              onLoad={() => setPrimaryOk(true)}
              onError={handlePrimaryError}
            />
          )}
          {secondary && secondary !== primary && (
            <img
              src={secondary}
              alt=""
              aria-hidden
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                secondaryOk && (!showFirst || !primaryOk) ? 'opacity-100' : 'opacity-0'
              }`}
              decoding="async"
              loading="eager"
              draggable={false}
              onLoad={() => setSecondaryOk(true)}
              onError={handleSecondaryError}
            />
          )}
          {primaryOk && secondaryOk && primary && secondary && secondary !== primary && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors ${showFirst ? 'bg-lime-500' : 'bg-zinc-500'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${!showFirst ? 'bg-lime-500' : 'bg-zinc-500'}`} />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Dumbbell className="w-16 h-16 text-zinc-600" />
        </div>
      )}
    </div>
  );
}

export function preloadExerciseImages(...urls: Array<string | undefined | null>) {
  for (const url of urls) {
    const normalized = normalizeExerciseImageUrl(url);
    if (!normalized) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = normalized;
  }
}
