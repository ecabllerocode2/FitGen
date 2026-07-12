import { useEffect, useMemo, useState } from 'react';
import { Loader2, FlaskConical, CheckCircle2, CalendarDays } from 'lucide-react';
import {
  buildGenerationScienceContext,
  GENERATION_FINISH_HOLD_MS,
  GENERATION_STEP_MS,
  type MesocycleGenerationProfile,
} from '../utils/splitGenerationContext';

interface MesocycleGenerationLoaderProps {
  title?: string;
  subtitle?: string;
  profile: MesocycleGenerationProfile;
  phase?: 'saving' | 'generating';
  evaluationMode?: boolean;
  /** Se llama cuando el usuario ha visto todos los pasos (tiempo mínimo de lectura). */
  onSequenceComplete?: () => void;
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

  const steps = useMemo(() => {
    if (!evaluationMode) return context.steps;
    return [
      {
        id: 'eval',
        title: 'Evaluando tu mesociclo anterior',
        detail:
          'Tu feedback de dificultad, molestias y progreso ajusta el volumen del próximo bloque dentro de MEV–MRV.',
      },
      ...context.steps,
    ];
  }, [context.steps, evaluationMode]);

  const [activeStep, setActiveStep] = useState(0);
  const [sequenceComplete, setSequenceComplete] = useState(false);

  const highlightedDecisionIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i <= activeStep && i < steps.length; i += 1) {
      const related = steps[i].relatedDecisionId;
      if (related) ids.add(related);
    }
    return ids;
  }, [activeStep, steps]);

  useEffect(() => {
    if (phase === 'saving') return;

    setActiveStep(0);
    setSequenceComplete(false);
  }, [phase, steps.length]);

  useEffect(() => {
    if (phase === 'saving') return;

    if (activeStep >= steps.length - 1) {
      const holdTimer = setTimeout(() => {
        setSequenceComplete(true);
        onSequenceComplete?.();
      }, GENERATION_FINISH_HOLD_MS);
      return () => clearTimeout(holdTimer);
    }

    const timer = setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, GENERATION_STEP_MS);

    return () => clearTimeout(timer);
  }, [phase, activeStep, steps.length, onSequenceComplete]);

  const heading =
    title ?? (phase === 'saving' ? 'Guardando tu perfil…' : 'Diseñando tu mesociclo');
  const sub =
    subtitle ??
    (phase === 'saving'
      ? 'Preparando datos para el motor de periodización…'
      : 'Calculando el plan óptimo para tu caso específico');

  const progressPct = phase === 'generating'
    ? Math.round(((sequenceComplete ? steps.length : activeStep + 1) / steps.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-5 py-8 overflow-y-auto">
      <div className="w-full max-w-md pb-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-lime-500/15 flex items-center justify-center mb-5 ring-1 ring-lime-500/30">
            <Loader2 className="w-10 h-10 text-lime-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{heading}</h2>
          <p className="text-zinc-400 text-sm">{sub}</p>
          {phase === 'generating' && (
            <div className="w-full mt-5">
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-lime-500 transition-all duration-700 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Paso {Math.min(activeStep + 1, steps.length)} de {steps.length}
              </p>
            </div>
          )}
        </div>

        {phase === 'generating' && context.weeklyPlan.length > 0 && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-lime-400 shrink-0" />
              <p className="text-xs font-bold text-lime-400 uppercase tracking-wider">
                Tu split semanal
              </p>
            </div>
            <ul className="space-y-2">
              {context.weeklyPlan.map((session) => (
                <li
                  key={session.day}
                  className="flex items-center justify-between gap-2 text-sm bg-zinc-950/60 rounded-lg px-3 py-2"
                >
                  <span className="text-zinc-500 font-medium w-8 shrink-0">{session.dayShort}</span>
                  <span className="text-zinc-200 text-left flex-1 truncate">{session.sessionFocus}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-4 h-4 text-lime-400 shrink-0" />
            <p className="text-xs font-bold text-lime-400 uppercase tracking-wider">
              Decisiones para tu caso
            </p>
          </div>
          <ul className="space-y-2">
            {context.decisions.map((decision) => {
              const isHighlighted = highlightedDecisionIds.has(decision.id);
              const isDone = sequenceComplete || highlightedDecisionIds.has(decision.id);
              return (
                <li
                  key={decision.id}
                  className={`rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                    isHighlighted
                      ? 'border-lime-500/40 bg-lime-500/10'
                      : isDone
                        ? 'border-zinc-700 bg-zinc-900/50 opacity-80'
                        : 'border-zinc-800/80 bg-zinc-950/40 opacity-45'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-500 mt-0.5 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">{decision.label}</p>
                      <p className="text-sm font-semibold text-zinc-200">{decision.value}</p>
                      {isHighlighted && (
                        <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                          {decision.rationale}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {phase === 'generating' && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">
              Calculando ahora
            </p>
            {steps.map((step, index) => {
              const isActive = index === activeStep && !sequenceComplete;
              const isDone = index < activeStep || sequenceComplete;
              if (!isActive && !isDone) return null;
              return (
                <div
                  key={step.id}
                  className={`rounded-xl border p-3.5 transition-all duration-500 ${
                    isActive
                      ? 'border-lime-500/50 bg-lime-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isDone && !isActive ? (
                        <CheckCircle2 className="w-4 h-4 text-lime-500" />
                      ) : (
                        <span className="block w-2 h-2 rounded-full mt-1.5 bg-lime-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`text-sm font-semibold mb-0.5 ${isActive ? 'text-lime-300' : 'text-zinc-400'}`}>
                        {step.title}
                      </p>
                      {isActive && (
                        <p className="text-xs text-zinc-400 leading-relaxed">{step.detail}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {phase === 'saving' && (
          <p className="text-center text-sm text-zinc-500 animate-pulse">
            Sincronizando perfil con el motor de entrenamiento…
          </p>
        )}
      </div>
    </div>
  );
}
