import React, { useEffect, useRef, useState } from 'react';
import { Dumbbell } from 'lucide-react';

/** Normalize catalog/R2 URLs so path segments with spaces/unicode always resolve. */
export function normalizeExerciseImageUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment) => {
        if (!segment) return segment;
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join('/');
    return parsed.toString();
  } catch {
    return trimmed;
  }
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
  /** object-cover thumbnails vs object-contain hero frames */
  fit?: 'cover' | 'contain';
};

/**
 * Reliable exercise media loader for overview + player.
 * Retries the same URL (no cache-bust query that can break R2),
 * falls back to the second frame, and ignores abort errors from remounts.
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
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(candidates.length === 0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCandidateIndex(0);
    setAttempt(0);
    setFailed(candidates.length === 0);
  }, [imageUrl, imageUrl2]);

  const activeUrl = !failed ? candidates[candidateIndex] : undefined;
  const resolvedImgClass =
    imgClassName ??
    (fit === 'contain' ? 'w-full h-full object-contain' : 'w-full h-full object-cover');

  const handleError = () => {
    // Remounts / StrictMode aborts often fire onError — don't treat as permanent fail.
    if (!mountedRef.current) return;

    if (attempt < 2) {
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        setAttempt((prev) => prev + 1);
      }, 120 * (attempt + 1));
      return;
    }

    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
      setAttempt(0);
      return;
    }

    setFailed(true);
  };

  if (!activeUrl) {
    return (
      <div className={`flex items-center justify-center bg-zinc-800 ${className}`}>
        {icon ?? <Dumbbell className="w-6 h-6 text-zinc-500" />}
      </div>
    );
  }

  return (
    <div className={className}>
      <img
        key={`${activeUrl}#${attempt}`}
        src={activeUrl}
        alt={alt}
        className={resolvedImgClass}
        decoding="async"
        loading="lazy"
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

/** Two-frame flip used on the workout player exercise screen. */
export function AnimatedExerciseMedia({
  imageUrl1,
  imageUrl2,
  exerciseName,
  className = '',
}: AnimatedExerciseMediaProps) {
  const primary = normalizeExerciseImageUrl(imageUrl1);
  const secondary = normalizeExerciseImageUrl(imageUrl2);
  const [showFirst, setShowFirst] = useState(true);
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [secondaryFailed, setSecondaryFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setShowFirst(true);
    setPrimaryFailed(false);
    setSecondaryFailed(false);
    setAttempt(0);
  }, [primary, secondary]);

  useEffect(() => {
    if (!primary || !secondary || primaryFailed || secondaryFailed) return;
    const interval = window.setInterval(() => setShowFirst((v) => !v), 1500);
    return () => window.clearInterval(interval);
  }, [primary, secondary, primaryFailed, secondaryFailed]);

  const current =
    showFirst
      ? (!primaryFailed ? primary : !secondaryFailed ? secondary : undefined)
      : (!secondaryFailed ? secondary : !primaryFailed ? primary : undefined);

  const handleError = () => {
    if (!mountedRef.current) return;
    if (attempt < 2) {
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        setAttempt((n) => n + 1);
      }, 120 * (attempt + 1));
      return;
    }
    if (showFirst && primary) setPrimaryFailed(true);
    else if (secondary) setSecondaryFailed(true);
    else if (primary) setPrimaryFailed(true);
  };

  return (
    <div className={`relative w-full aspect-video bg-zinc-800 rounded-2xl overflow-hidden ${className}`}>
      {current ? (
        <>
          <img
            key={`${current}#${attempt}`}
            src={current}
            alt={exerciseName}
            className="w-full h-full object-contain transition-opacity duration-500"
            decoding="async"
            onError={handleError}
          />
          {primary && secondary && !primaryFailed && !secondaryFailed && (
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
