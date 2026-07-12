import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildGenerationFrames,
  buildGenerationScienceContext,
  GENERATION_FINISH_HOLD_MS,
  GENERATION_SPLIT_REVEAL_MS,
  GENERATION_STEP_MS,
  MIN_GENERATION_DISPLAY_MS,
  MIN_SAVING_DISPLAY_MS,
  type GenerationFrame,
  type MesocycleGenerationProfile,
} from '../utils/splitGenerationContext';
import { waitMs } from '../utils/onboardingFlowLock';

interface MesocycleGenerationLoaderProps {
  title?: string;
  subtitle?: string;
  profile: MesocycleGenerationProfile;
  phase?: 'saving' | 'generating';
  evaluationMode?: boolean;
  onSequenceComplete?: () => void;
}

function frameDuration(frame: GenerationFrame | undefined): number {
  if (!frame) return GENERATION_STEP_MS;
  return frame.type === 'split_reveal' ? GENERATION_SPLIT_REVEAL_MS : GENERATION_STEP_MS;
}

function FrameContent({ frame, visible }: { frame: GenerationFrame; visible: boolean }) {
  const base =
    'w-full max-w-sm mx-auto transition-all duration-700 ease-out ' +
    (visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4');

  if (frame.type === 'split_reveal') {
    return (
      <div className={base}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lime-500/80 mb-4 text-center">
          Tu semana
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 leading-tight">
          {frame.splitLabel}
        </h2>
        <ul className="space-y-0">
          {frame.sessions.map((session, index) => (
            <li
              key={session.day}
              className="flex items-center gap-4 py-3 border-b border-zinc-800/90 last:border-0"
              style={{
                transitionDelay: visible ? `${index * 80}ms` : '0ms',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 500ms ease, transform 500ms ease',
              }}
            >
              <span className="text-xs font-bold text-zinc-500 w-7 shrink-0 tabular-nums">
                {session.dayShort}
              </span>
              <span className="text-sm font-medium text-zinc-100 leading-snug">
                {session.sessionFocus}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (frame.type === 'decision') {
    return (
      <div className={base}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-6 text-center">
          {frame.eyebrow}
        </p>
        <p className="text-3xl sm:text-4xl font-bold text-white text-center leading-[1.15] mb-4">
          {frame.value}
        </p>
        <p className="text-xs font-medium text-lime-400/90 text-center uppercase tracking-wider mb-5">
          {frame.label}
        </p>
        <p className="text-[15px] text-zinc-400 text-center leading-relaxed">{frame.body}</p>
      </div>
    );
  }

  return (
    <div className={base}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-6 text-center">
        {frame.eyebrow}
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center leading-tight mb-5">
        {frame.title}
      </h2>
      <p className="text-[15px] text-zinc-400 text-center leading-relaxed">{frame.body}</p>
    </div>
  );
}

export default function MesocycleGenerationLoader({
  title,
  subtitle,
  profile,
  phase = 'generating',
  evaluationMode = false,
  onSequenceComplete,
}: MesocycleGenerationLoaderProps) {
  const context = useMemo(() => buildGenerationScienceContext(profile), [profile]);
  const onCompleteRef = useRef(onSequenceComplete);
  const mountedAtRef = useRef(Date.now());
  const sequenceDoneRef = useRef(false);

  useEffect(() => {
    onCompleteRef.current = onSequenceComplete;
  }, [onSequenceComplete]);

  const evalStep = useMemo(
    () =>
      evaluationMode
        ? [
            {
              id: 'eval',
              title: 'Evaluando tu mesociclo anterior',
              detail:
                'Tu feedback de dificultad, molestias y progreso ajusta el volumen del próximo bloque dentro de MEV–MRV.',
            },
          ]
        : [],
    [evaluationMode],
  );

  const frames = useMemo(
    () => buildGenerationFrames(context, [...evalStep, ...context.steps]),
    [context, evalStep],
  );

  const [activeFrame, setActiveFrame] = useState(0);
  const [frameVisible, setFrameVisible] = useState(true);
  const [sequenceComplete, setSequenceComplete] = useState(false);

  const tryFinish = async () => {
    if (sequenceDoneRef.current) return;
    const elapsed = Date.now() - mountedAtRef.current;
    const minElapsed = phase === 'saving' ? MIN_SAVING_DISPLAY_MS : MIN_GENERATION_DISPLAY_MS;
    if (elapsed < minElapsed) {
      await waitMs(minElapsed - elapsed);
    }
    sequenceDoneRef.current = true;
    setSequenceComplete(true);
    onCompleteRef.current?.();
  };

  useEffect(() => {
    if (phase !== 'generating') return;
    mountedAtRef.current = Date.now();
    sequenceDoneRef.current = false;
    setActiveFrame(0);
    setFrameVisible(true);
    setSequenceComplete(false);
  }, [phase, frames.length]);

  useEffect(() => {
    if (phase !== 'generating' || sequenceComplete) return;

    if (!frames.length) {
      void tryFinish();
      return;
    }

    const current = frames[activeFrame];
    const duration = frameDuration(current);

    if (activeFrame >= frames.length - 1) {
      const holdTimer = setTimeout(() => {
        void tryFinish();
      }, duration + GENERATION_FINISH_HOLD_MS);
      return () => clearTimeout(holdTimer);
    }

    const advanceTimer = setTimeout(() => {
      setFrameVisible(false);
      setTimeout(() => {
        setActiveFrame((prev) => prev + 1);
        setFrameVisible(true);
      }, 280);
    }, duration);

    return () => clearTimeout(advanceTimer);
  }, [phase, activeFrame, frames, sequenceComplete]);

  const savingHeading = title ?? 'Guardando tu perfil';
  const savingSub =
    subtitle ?? 'Sincronizando datos con el motor de entrenamiento';

  const totalFrames = frames.length || 1;
  const progressPct =
    phase === 'saving'
      ? 8
      : Math.round(((sequenceComplete ? totalFrames : activeFrame + 1) / totalFrames) * 100);

  const statusLabel =
    phase === 'saving'
      ? 'Preparando'
      : frames[activeFrame]?.type === 'split_reveal'
        ? 'Calendario'
        : frames[activeFrame]?.type === 'decision'
          ? 'Decisión'
          : 'Análisis';

  if (phase === 'saving') {
    return (
      <div className="fixed inset-0 z-50 h-[100dvh] bg-zinc-950 flex flex-col overflow-hidden">
        <div className="px-6 pt-[max(2.5rem,env(safe-area-inset-top))]">
          <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-lime-500 transition-all duration-1000 ease-out animate-pulse"
              style={{ width: '35%' }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <h1 className="text-3xl font-bold text-white text-center leading-tight mb-3">
            {savingHeading}
          </h1>
          <p className="text-sm text-zinc-500 text-center max-w-[16rem]">{savingSub}</p>
        </div>

        <div className="pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center">
          <span className="w-1 h-1 rounded-full bg-lime-500/50 animate-pulse" />
        </div>
      </div>
    );
  }

  const currentFrame = frames[activeFrame];

  return (
    <div className="fixed inset-0 z-50 h-[100dvh] bg-zinc-950 flex flex-col overflow-hidden">
      {/* Barra de progreso */}
      <div className="px-6 pt-[max(2.5rem,env(safe-area-inset-top))] shrink-0">
        <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-lime-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            {statusLabel}
          </span>
          <span className="text-[10px] font-medium tabular-nums text-zinc-600">
            {Math.min(activeFrame + 1, totalFrames)} / {totalFrames}
          </span>
        </div>
      </div>

      {/* Contenido — una pantalla, sin scroll */}
      <div className="flex-1 flex items-center justify-center px-6 min-h-0">
        {currentFrame ? (
          <FrameContent key={currentFrame.id + activeFrame} frame={currentFrame} visible={frameVisible} />
        ) : null}
      </div>

      {/* Indicador inferior */}
      <div className="pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center shrink-0">
        <div className="flex gap-1">
          {frames.map((f, i) => (
            <span
              key={f.id}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === activeFrame
                  ? 'w-5 bg-lime-500'
                  : i < activeFrame
                    ? 'w-1 bg-lime-500/40'
                    : 'w-1 bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
