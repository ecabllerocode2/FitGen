import { useState } from 'react';
import { BatteryCharging, Moon, Brain, Activity } from 'lucide-react';
import type {
  ReadinessData,
  EnergyLevel,
  SorenessLevel,
  SleepQuality,
  StressLevel,
  ExternalFatigue,
} from '../types/session';
import {
  AppBackButton,
  AppEyebrow,
  AppOptionButton,
  AppPrimaryButton,
  AppProgress,
  AppScaleRow,
} from './ui/AppPrimitives';

interface ReadinessFormProps {
  onSubmit: (data: ReadinessData) => void;
  onBack?: () => void;
  isLoading?: boolean;
}

const energyLabels: Record<number, string> = {
  5: 'Óptimo — listo para rendir',
  4: 'Bueno — motivado',
  3: 'Normal',
  2: 'Bajo — poca energía',
  1: 'Agotado',
};

const sorenessLabels: Record<number, string> = {
  1: 'Sin dolor — recuperado',
  2: 'Leve — ligera tensión',
  3: 'Moderado — DOMS perceptible',
  4: 'Alto — limita el movimiento',
  5: 'Severo — dolor intenso',
};

const sleepLabels: Record<number, string> = {
  5: 'Excelente — 8+ h reparadoras',
  4: 'Bien — 7–8 h de calidad',
  3: 'Normal — 6–7 h',
  2: 'Mal — poco o mala calidad',
  1: 'Muy mal — < 4 h',
};

const stressLabels: Record<number, string> = {
  1: 'Muy relajado',
  2: 'Relajado',
  3: 'Normal — estrés cotidiano',
  4: 'Estresado',
  5: 'Muy estresado — abrumado',
};

const externalFatigueOptions: { value: ExternalFatigue; label: string; desc: string }[] = [
  { value: 'none', label: 'Ninguna', desc: 'Día sedentario normal' },
  { value: 'low', label: 'Baja', desc: 'Caminata ligera, oficina' },
  { value: 'moderate', label: 'Moderada', desc: 'Trabajo activo, mucho tiempo de pie' },
  { value: 'high', label: 'Alta', desc: 'Trabajo físico o deporte recreativo' },
  { value: 'extreme', label: 'Extrema', desc: 'Mudanza, maratón, evento intenso' },
];

const STEPS = [
  { id: 'energy', eyebrow: 'Energía', title: '¿Cómo está tu batería hoy?', icon: BatteryCharging },
  { id: 'soreness', eyebrow: 'Recuperación', title: '¿Cómo sientes los músculos?', icon: Activity },
  { id: 'sleep', eyebrow: 'Sueño', title: '¿Cómo dormiste anoche?', icon: Moon },
  { id: 'stress', eyebrow: 'Estrés', title: '¿Cómo está tu carga mental?', icon: Brain },
  { id: 'external', eyebrow: 'Extra', title: '¿Fatiga fuera del gym?', icon: Activity },
] as const;

export default function ReadinessForm({ onSubmit, onBack, isLoading = false }: ReadinessFormProps) {
  const [step, setStep] = useState(0);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(3);
  const [sorenessLevel, setSorenessLevel] = useState<SorenessLevel>(2);
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>(3);
  const [stressLevel, setStressLevel] = useState<StressLevel>(3);
  const [externalFatigue, setExternalFatigue] = useState<ExternalFatigue>('none');

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === STEPS.length - 1;

  const handleSubmit = () => {
    const data: ReadinessData = {
      energyLevel,
      sorenessLevel,
      sleepQuality,
      stressLevel,
    };
    if (externalFatigue !== 'none') {
      data.externalFatigue = externalFatigue;
    }
    onSubmit(data);
  };

  const handleNext = () => {
    if (isLast) handleSubmit();
    else setStep((s) => s + 1);
  };

  const handleStepBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else onBack?.();
  };

  const StepIcon = current.icon;

  return (
    <div className="flex flex-col min-h-[min(70dvh,32rem)]">
      <div className="mb-8">
        <AppProgress value={progress} label="Pre-sesión" meta={`${step + 1} / ${STEPS.length}`} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-5">
          <StepIcon className="w-4 h-4 text-lime-500/80" />
          <AppEyebrow>{current.eyebrow}</AppEyebrow>
        </div>
        <h3 className="text-2xl font-bold text-white leading-tight mb-8">{current.title}</h3>

        {step === 0 && (
          <AppScaleRow value={energyLevel} onChange={(v) => setEnergyLevel(v as EnergyLevel)} labels={energyLabels} />
        )}
        {step === 1 && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <AppOptionButton
                key={n}
                selected={sorenessLevel === n}
                onClick={() => setSorenessLevel(n as SorenessLevel)}
                compact
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold tabular-nums text-lime-400/90 w-6 shrink-0">{n}</span>
                  <span className="text-sm leading-snug">{sorenessLabels[n]}</span>
                </div>
              </AppOptionButton>
            ))}
          </div>
        )}
        {step === 2 && (
          <AppScaleRow value={sleepQuality} onChange={(v) => setSleepQuality(v as SleepQuality)} labels={sleepLabels} />
        )}
        {step === 3 && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <AppOptionButton
                key={n}
                selected={stressLevel === n}
                onClick={() => setStressLevel(n as StressLevel)}
                compact
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold tabular-nums text-lime-400/90 w-6 shrink-0">{n}</span>
                  <span className="text-sm leading-snug">{stressLabels[n]}</span>
                </div>
              </AppOptionButton>
            ))}
          </div>
        )}
        {step === 4 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-500 mb-2">Opcional — déjalo en Ninguna si fue un día normal.</p>
            {externalFatigueOptions.map((option) => (
              <AppOptionButton
                key={option.value}
                selected={externalFatigue === option.value}
                onClick={() => setExternalFatigue(option.value)}
              >
                <div>
                  <p className="font-semibold text-sm">{option.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{option.desc}</p>
                </div>
              </AppOptionButton>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 space-y-3">
        {(step > 0 || onBack) && (
          <div className="flex justify-center">
            <AppBackButton onClick={handleStepBack} label={step > 0 ? 'Anterior' : 'Cancelar'} />
          </div>
        )}
        <AppPrimaryButton onClick={handleNext} disabled={isLoading}>
          {isLoading ? 'Generando…' : isLast ? 'Generar sesión' : 'Continuar'}
        </AppPrimaryButton>
      </div>
    </div>
  );
}
