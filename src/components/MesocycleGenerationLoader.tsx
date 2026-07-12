import { useEffect, useMemo, useState } from 'react';
import { Loader2, FlaskConical, CheckCircle2 } from 'lucide-react';
import {
  buildGenerationScienceContext,
  type MesocycleGenerationProfile,
} from '../utils/splitGenerationContext';

interface MesocycleGenerationLoaderProps {
  title?: string;
  subtitle?: string;
  profile: MesocycleGenerationProfile;
  phase?: 'saving' | 'generating';
  /** Pasos extra al evaluar un mesociclo previo */
  evaluationMode?: boolean;
}

export default function MesocycleGenerationLoader({
  title,
  subtitle,
  profile,
  phase = 'generating',
  evaluationMode = false,
}: MesocycleGenerationLoaderProps) {
  const context = useMemo(() => buildGenerationScienceContext(profile), [profile]);

  const steps = useMemo(() => {
    if (!evaluationMode) return context.steps;
    return [
      {
        id: 'eval',
        title: 'Evaluación del mesociclo anterior',
        detail:
          'Tu feedback de dificultad, molestias y progreso ajusta el volumen del próximo bloque dentro de MEV–MRV.',
      },
      ...context.steps,
    ];
  }, [context.steps, evaluationMode]);

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (phase === 'saving') return;

    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = (prev + 1) % steps.length;
        setCompletedSteps((done) => new Set([...done, prev]));
        return next;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [phase, steps.length]);

  const heading =
    title ?? (phase === 'saving' ? 'Guardando tu perfil…' : 'Diseñando tu mesociclo');
  const sub =
    subtitle ??
    (phase === 'saving'
      ? 'Preparando datos para el motor de periodización…'
      : 'Aplicando el modelo científico de FitGen a tu caso');

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-lime-500/15 flex items-center justify-center mb-5 ring-1 ring-lime-500/30">
            <Loader2 className="w-10 h-10 text-lime-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{heading}</h2>
          <p className="text-zinc-400 text-sm">{sub}</p>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-4 h-4 text-lime-400 shrink-0" />
            <p className="text-xs font-bold text-lime-400 uppercase tracking-wider">
              Variables de tu caso
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
            <div>
              <dt className="text-zinc-500 text-xs">Objetivo</dt>
              <dd className="text-zinc-200 font-medium">{context.goal}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-xs">Nivel</dt>
              <dd className="text-zinc-200 font-medium">{context.experienceLevel}</dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-xs">Sesiones / semana</dt>
              <dd className="text-zinc-200 font-medium">
                {context.trainingDays}
                {context.requestedDays ? ` (de ${context.requestedDays} solicitados)` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 text-xs">Split previsto</dt>
              <dd className="text-zinc-200 font-medium">{context.splitLabel}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-zinc-500 text-xs">Duración del bloque</dt>
              <dd className="text-zinc-200 font-medium">
                {context.durationWeeks} semanas (incluye deload final)
              </dd>
            </div>
          </dl>
        </div>

        {phase === 'generating' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
              Proceso científico en curso
            </p>
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isDone = completedSteps.has(index) && !isActive;
              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-4 transition-all duration-500 ${
                    isActive
                      ? 'border-lime-500/50 bg-lime-500/10 shadow-[0_0_20px_rgba(132,204,22,0.08)]'
                      : isDone
                        ? 'border-zinc-800 bg-zinc-900/40 opacity-70'
                        : 'border-zinc-800/80 bg-zinc-900/30 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-lime-500" />
                      ) : (
                        <span
                          className={`block w-2 h-2 rounded-full mt-1.5 ${
                            isActive ? 'bg-lime-400 animate-pulse' : 'bg-zinc-600'
                          }`}
                        />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          isActive ? 'text-lime-300' : 'text-zinc-300'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{step.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
