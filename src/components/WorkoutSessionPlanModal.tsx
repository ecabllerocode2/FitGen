import { X, RefreshCw } from 'lucide-react';
import type { GeneratedSession } from '../types/session';

interface FlexibleExercise {
  id?: string;
  exerciseId?: string;
  nombre?: string;
  name?: string;
  exerciseName?: string;
  sets?: number;
  reps?: string | number;
  prescripcion?: { series?: number; reps?: string | number };
}

interface WorkoutSessionPlanModalProps {
  session: GeneratedSession;
  onClose: () => void;
  onSwapExercise?: (exerciseId: string, name: string, stationIndex: number, exerciseIndex: number) => void;
  swappingId?: string | null;
}

function getBlocks(session: GeneratedSession) {
  const mb = session.mainBlock as any;
  if (Array.isArray(mb?.bloques)) return mb.bloques;
  if (Array.isArray(mb?.estaciones)) return mb.estaciones;
  if (Array.isArray(mb) && (mb[0]?.exerciseId || mb[0]?.id)) {
    return [{ ejercicios: mb }];
  }
  return [];
}

export default function WorkoutSessionPlanModal({
  session,
  onClose,
  onSwapExercise,
  swappingId,
}: WorkoutSessionPlanModalProps) {
  const blocks = getBlocks(session);

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[88dvh] flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">Tu rutina</p>
            <h2 className="text-lg font-bold text-white mt-1">{session.sessionFocus ?? 'Entrenamiento'}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {session.warmup?.length ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Calentamiento</h3>
              <ul className="space-y-2">
                {session.warmup.map((ex: FlexibleExercise, idx: number) => (
                  <li key={ex.id ?? idx} className="text-sm text-zinc-300 py-2 border-b border-zinc-800/80">
                    {ex.nombre ?? ex.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {blocks.map((block: any, stationIndex: number) => (
            <section key={stationIndex}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Bloque {stationIndex + 1}
              </h3>
              <ul className="space-y-2">
                {(block.ejercicios ?? []).map((ex: FlexibleExercise, exerciseIndex: number) => {
                  const id = ex.id ?? ex.exerciseId ?? `${stationIndex}-${exerciseIndex}`;
                  const name = ex.nombre ?? ex.name ?? ex.exerciseName ?? 'Ejercicio';
                  const sets = ex.sets ?? ex.prescripcion?.series ?? '—';
                  const reps = ex.reps ?? ex.prescripcion?.reps ?? '';
                  return (
                    <li
                      key={id}
                      className="flex items-center justify-between gap-3 py-3 border-b border-zinc-800/80"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {sets} series{reps ? ` · ${reps} reps` : ''}
                        </p>
                      </div>
                      {onSwapExercise && (
                        <button
                          type="button"
                          onClick={() => onSwapExercise(id, name, stationIndex, exerciseIndex)}
                          disabled={swappingId === id}
                          className="shrink-0 p-2 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"
                          aria-label={`Cambiar ${name}`}
                        >
                          <RefreshCw className={`w-4 h-4 ${swappingId === id ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {session.coreBlock?.ejercicios?.length ? (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Core</h3>
              <ul className="space-y-2">
                {session.coreBlock.ejercicios.map((ex: FlexibleExercise, idx: number) => (
                  <li key={ex.id ?? idx} className="text-sm text-zinc-300 py-2 border-b border-zinc-800/80">
                    {ex.nombre ?? ex.name}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
