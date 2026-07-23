import { useMemo } from 'react';
import { AppPrimaryButton, AppShell } from './ui/AppPrimitives';
import SessionShareCard from './SessionShareCard';
import { pickMotivationalPhrase } from '../utils/motivationalPhrases';
import { useWeightUnit } from '../context/WeightUnitContext';

export interface SessionCelebrationData {
  sessionFocus: string;
  durationLabel: string;
  exerciseCount: number;
  totalSets: number;
  totalWeightKg?: number | null;
  muscles?: string[];
  completedAt?: string;
}

interface SessionCelebrationProps {
  data: SessionCelebrationData;
  onDone: () => void;
  footerText?: string;
}

export default function SessionCelebration({ data, onDone, footerText }: SessionCelebrationProps) {
  const phrase = useMemo(() => pickMotivationalPhrase(), []);
  const { activeUnit } = useWeightUnit();

  const shareData = useMemo(
    () => ({
      sessionFocus: data.sessionFocus,
      durationLabel: data.durationLabel,
      exerciseCount: data.exerciseCount,
      totalSets: data.totalSets,
      totalWeightKg: data.totalWeightKg,
      volumeUnit: activeUnit,
      muscles: data.muscles,
      phrase,
      completedAt: data.completedAt ?? new Date().toISOString(),
      aspect: '4:5' as const,
      footerText,
    }),
    [data, phrase, footerText, activeUnit],
  );

  return (
    <AppShell className="justify-center">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-sm mx-auto w-full">
        <div className="w-full mb-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80 mb-2">Sesión completada</p>
          <h1 className="text-2xl font-bold text-white leading-snug">¡Buen trabajo!</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Personaliza tu tarjeta con foto opcional y compártela.
          </p>
        </div>

        <SessionShareCard data={shareData} showPhotoOptions showAspectToggle />

        <div className="w-full mt-4">
          <AppPrimaryButton onClick={onDone}>Listo</AppPrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}
