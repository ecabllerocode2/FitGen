import { useEffect, useState } from 'react';
import { AppEyebrow, AppProgress } from './ui/AppPrimitives';
import {
  SESSION_GENERATION_STEPS,
  SESSION_GENERATION_STEP_MS,
} from '../utils/sessionGenerationContext';

interface SessionGeneratingOverlayProps {
  message?: string;
}

export function SessionGeneratingOverlay({ message }: SessionGeneratingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % SESSION_GENERATION_STEPS.length);
    }, SESSION_GENERATION_STEP_MS);
    return () => clearInterval(interval);
  }, []);

  const progress = ((stepIndex + 1) / SESSION_GENERATION_STEPS.length) * 100;
  const stepLabel = message ?? SESSION_GENERATION_STEPS[stepIndex];

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col overflow-hidden">
      <div className="px-6 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="max-w-sm mx-auto">
          <AppProgress
            value={progress}
            label="Sesión de hoy"
            meta={`${stepIndex + 1} / ${SESSION_GENERATION_STEPS.length}`}
          />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <AppEyebrow>Prescripción diaria</AppEyebrow>
        <h2 className="text-2xl font-bold text-white mt-4 mb-3 leading-tight">Diseñando tu rutina</h2>
        <p className="text-[15px] text-zinc-400 max-w-[18rem] leading-relaxed">{stepLabel}</p>
      </div>
      <div className="pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center">
        <span className="w-1 h-1 rounded-full bg-lime-500/50 animate-pulse" />
      </div>
    </div>
  );
}
