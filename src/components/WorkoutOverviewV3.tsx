import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { 
  Play, 
  Clock, 
  Flame, 
  Dumbbell, 
  Wind, 
  AlertCircle,
  Layers3, 
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { GeneratedSession } from '../types/session';
import { normalizeSession } from '../utils/sessionNormalizer';
import { estimateSessionDuration } from '../utils/estimateWorkoutDuration';
import { markSessionReviewed } from '../utils/sessionReviewContext';
import { formatLoadLabel, resolveLoadConvention } from '../utils/loadConvention';
import { ExerciseMediaImage } from './ExerciseMediaImage';
import ExerciseSwapReasonModal, { type SwapReason } from './ExerciseSwapReasonModal';
import SessionCoachingBrief from './SessionCoachingBrief';
import {
  AppAccordion,
  AppBackButton,
  AppEyebrow,
  AppFixedFooter,
  AppPrimaryButton,
  AppShell,
} from './ui/AppPrimitives';

// ==================== TIPOS FLEXIBLES ====================
// Los datos pueden venir con diferentes estructuras, así que usamos tipos flexibles

interface FlexibleExercise {
  id: string;
  nombre?: string;
  name?: string;
  descripcion?: string;
  correcciones?: string[];
  notasTecnicas?: string;
  sets?: number;
  reps?: number | string;
  peso?: string;
  rpeTarget?: number;
  rirTarget?: number;
  tempo?: string;
  descanso?: string | number;
  equipo?: string[];
  patronMovimiento?: string;
  parteCuerpo?: string;
  imageUrl?: string;
  imageUrl2?: string;
  imagenUrl?: string;
  videoUrl?: string;
  justificacionCarga?: string;
  prescripcion?: {
    series?: number;
    reps?: number | string;
    repsOTiempo?: string;
    descanso?: number;
    rpeObjetivo?: number;
    rirObjetivo?: number;
    tempo?: string;
    tecnicaEspecial?: string;
    tipo?: string;
    notaUnilateral?: string;
    pesoSugerido?: number | string;
    explicacion?: string;
  };
  // NUEVO: Indicadores de progresión (API V2)
  indicadores?: {
    pesoAnterior?: string;
    repsAnterior?: number;
    rirAnterior?: string;
    e1RMEstimado?: string;
    porcentajeObjetivo?: string;
    esMeseta?: boolean;
  };
  notas?: string;
  duracion?: string;
  instrucciones?: string;
  emphasisTag?: string | null;
  url_img_0?: string;
  url_img_1?: string;
  tiempo?: string;
  musculoObjetivo?: string;
}

interface FlexibleStation {
  tipo?: string;
  ejercicios: FlexibleExercise[];
  descansoEntreSeries?: number;
  descansoEntreEjercicios?: number;
}

// ==================== HELPERS ====================

const getExerciseName = (ex: FlexibleExercise): string => {
  return ex.nombre || ex.name || 'Ejercicio';
};

const getExerciseReps = (ex: FlexibleExercise): string => {
  const raw = ex.reps ?? ex.prescripcion?.reps ?? ex.prescripcion?.repsOTiempo;
  if (Array.isArray(raw)) return `${raw[0]}-${raw[1]} reps`;
  if (raw == null || raw === '-') return '';
  const text = String(raw);
  return text.toLowerCase().includes('rep') || text.includes('s') || text.includes('min')
    ? text
    : `${text} reps`;
};

const formatExerciseLoad = (ex: FlexibleExercise): string | null => {
  if ((ex as any).isBodyweight === true || (ex as any).loadMode === 'bodyweight') return 'Peso corporal';
  if (ex.peso) return ex.peso;
  const convention = resolveLoadConvention(ex);
  const prescribed = (ex as any).prescribedLoadKg;
  const suggested = (ex as any).suggestedLoadKg ?? ex.prescripcion?.pesoSugerido;
  if (typeof prescribed === 'number') return formatLoadLabel(prescribed, convention);
  if (typeof suggested === 'number') return formatLoadLabel(suggested, convention, { approximate: true });
  if ((ex as any).loadMode === 'exploratory' || suggested === 'Exploratorio') return 'Exploratorio';
  return null;
};

const getExerciseImage = (ex: FlexibleExercise): string | undefined => {
  return ex.imageUrl || ex.imagenUrl || ex.url_img_0 || undefined;
};

const getExerciseImage2 = (ex: FlexibleExercise): string | undefined => {
  return ex.imageUrl2 || ex.url_img_1 || undefined;
};

// ==================== COMPONENTES UI ====================

const SwapTip = () => (
  <div className="mb-6 py-3 border-b border-zinc-800/90">
    <p className="text-xs text-zinc-500 leading-relaxed">
      <Sparkles className="w-3 h-3 inline mr-1 text-lime-500/70" />
      Toca <RefreshCw className="w-3 h-3 inline mx-0.5" /> en un ejercicio para cambiarlo si no tienes el equipo.
    </p>
  </div>
);

// AccordionSection replaced by AppAccordion from design system

// ==================== COMPONENTES DE EJERCICIO ====================

const WarmupExerciseRow = ({
  exercise,
  onSwap,
  isSwapping,
}: {
  exercise: FlexibleExercise;
  onSwap?: () => void;
  isSwapping?: boolean;
}) => {
  const name = getExerciseName(exercise);
  const image = getExerciseImage(exercise);
  const image2 = getExerciseImage2(exercise);

  return (
    <div className="relative flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0 pr-10">
      <ExerciseMediaImage
        imageUrl={image}
        imageUrl2={image2}
        alt={name}
        className="w-12 h-12 bg-zinc-700 rounded-lg shrink-0 overflow-hidden"
        icon={<Flame className="w-5 h-5 text-orange-400 opacity-50" />}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1 truncate">
          {name}
        </h4>
        <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" />
          {exercise.duracion || (exercise.reps ? `${exercise.reps} reps` : 'A criterio')}
        </p>
        {exercise.instrucciones && (
          <p className="text-xs text-zinc-500 line-clamp-2">{exercise.instrucciones}</p>
        )}
      </div>
      {onSwap && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSwap();
          }}
          disabled={isSwapping}
          className="absolute right-0 top-3 p-2 rounded-full text-zinc-500 hover:text-lime-400 hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Cambiar ejercicio de calentamiento"
        >
          <RefreshCw className={`w-4 h-4 ${isSwapping ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

const MainExerciseRow = ({ 
  exercise, 
  onSwap, 
  isSwapping 
}: { 
  exercise: FlexibleExercise;
  onSwap?: () => void;
  isSwapping?: boolean;
}) => {
  const name = getExerciseName(exercise);
  const reps = getExerciseReps(exercise);
  const load = formatExerciseLoad(exercise);
  const image = getExerciseImage(exercise);
  const image2 = getExerciseImage2(exercise);

  return (
    <div className="flex items-center gap-4 py-4 border-b border-zinc-800/80 last:border-0 relative">
      <div className="w-[4.5rem] h-[4.5rem] bg-zinc-800/80 rounded-2xl shrink-0 overflow-hidden relative ring-1 ring-zinc-800">
        {isSwapping && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        <ExerciseMediaImage
          imageUrl={image}
          imageUrl2={image2}
          alt={name}
          className="w-full h-full"
          icon={<Dumbbell className="w-6 h-6 text-zinc-600" />}
        />
      </div>
      
      <div className="flex-1 min-w-0 pr-10">
        <h4 className="text-[15px] font-semibold text-white leading-snug mb-1 line-clamp-2">
          {name}
        </h4>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-zinc-500">
          {reps && <span>{reps}</span>}
          {reps && load && <span className="text-zinc-700">·</span>}
          {load && (
            <span className={load === 'Exploratorio' ? 'text-lime-400/90' : 'text-zinc-400'}>
              {load}
            </span>
          )}
        </div>

        {exercise.indicadores?.esMeseta && (
          <p className="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            Ajuste por meseta
          </p>
        )}
        {(exercise as FlexibleExercise).emphasisTag === 'priority' && (
          <p className="text-[11px] text-lime-400/90 mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 shrink-0" />
            Prioridad muscular · +1 serie
          </p>
        )}
      </div>
      
      {onSwap && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSwap();
          }}
          disabled={isSwapping}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full text-zinc-600 hover:text-lime-400 hover:bg-zinc-800/80 transition-colors disabled:opacity-50"
          aria-label="Cambiar ejercicio"
        >
          <RefreshCw className={`w-4 h-4 ${isSwapping ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

const CoreExerciseRow = ({ exercise }: { exercise: FlexibleExercise }) => {
  const name = getExerciseName(exercise);
  const image = getExerciseImage(exercise);
  const image2 = getExerciseImage2(exercise);
  const detail = getExerciseReps(exercise) || `${exercise.prescripcion?.series ?? 1} series`;
  
  return (
    <div className="flex items-center gap-4 py-3 border-b border-zinc-800/80 last:border-0">
      <ExerciseMediaImage
        imageUrl={image}
        imageUrl2={image2}
        alt={name}
        className="w-14 h-14 bg-zinc-800/80 rounded-xl shrink-0 overflow-hidden ring-1 ring-zinc-800"
        icon={<Layers3 className="w-5 h-5 text-yellow-500/50" />}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white leading-snug truncate">{name}</h4>
        <p className="text-xs text-zinc-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
};

const CooldownExerciseRow = ({ exercise }: { exercise: FlexibleExercise }) => {
  const name = getExerciseName(exercise);
  const image = getExerciseImage(exercise);
  const image2 = getExerciseImage2(exercise);
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
      <ExerciseMediaImage
        imageUrl={image}
        imageUrl2={image2}
        alt={name}
        className="w-12 h-12 bg-zinc-700 rounded-lg shrink-0 overflow-hidden"
        icon={<Wind className="w-5 h-5 text-cyan-400 opacity-50" />}
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1 truncate">
          {name}
        </h4>
        <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" />
          {exercise.tiempo || '30s'}
        </p>
        {exercise.musculoObjetivo && (
          <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{exercise.musculoObjetivo}</span>
        )}
        {(exercise.instrucciones || exercise.descripcion) && (
          <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
            {exercise.instrucciones ?? exercise.descripcion}
          </p>
        )}
      </div>
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

interface WorkoutOverviewProps {
  session: GeneratedSession;
}

const WorkoutOverview: React.FC<WorkoutOverviewProps> = ({ session: initialSession }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPreflight = (location.state as { preflight?: boolean } | null)?.preflight === true;
  // Aceptar distintas formas de session que puedan llegar desde Firestore
  const normalized = normalizeSession(initialSession) || initialSession;
  const [currentSession, setCurrentSession] = useState<GeneratedSession>(normalized as GeneratedSession);
  const [swappingId, setSwappingId] = useState<string | null>(null);
  const [swapTarget, setSwapTarget] = useState<{
    exerciseId: string;
    name: string;
    equipment: string[];
    kind: 'warmup' | 'main';
    stationIndex?: number;
    exerciseIndex?: number;
  } | null>(null);

  const executeWarmupSwap = async (exerciseId: string, reason: SwapReason, excludeEquipment: boolean) => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) throw new Error('Error de autenticación');
    const token = await user.getIdToken();
    const response = await authenticatedFetch(API_ENDPOINTS.SESSION_SWAP_WARMUP, token, {
      method: 'POST',
      body: JSON.stringify({ exerciseIdToReplace: exerciseId, reason, excludeEquipment }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'No se encontró alternativa');
    }
    if (data.session) setCurrentSession(normalizeSession(data.session) || (data.session as GeneratedSession));
  };

  const executeMainSwap = async (
    exerciseId: string,
    reason: SwapReason,
    excludeEquipment: boolean,
    useAsContinuity: boolean,
    stationIndex: number,
    exerciseIndex: number,
  ) => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) throw new Error('Error de autenticación');
    const token = await user.getIdToken();
    const response = await authenticatedFetch(API_ENDPOINTS.SESSION_SWAP_EXERCISE, token, {
      method: 'POST',
      body: JSON.stringify({
        exerciseIdToReplace: exerciseId,
        reason,
        excludeEquipment,
        useAsContinuity,
      }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'No se encontró alternativa');
    }
    if (data.session) {
      setCurrentSession(normalizeSession(data.session) || (data.session as GeneratedSession));
    } else if (data.newExercise) {
      setCurrentSession((prev) => {
        const newSession = JSON.parse(JSON.stringify(prev)) as GeneratedSession;
        const blocks = (newSession.mainBlock as any)?.bloques || (newSession.mainBlock as any)?.estaciones || [];
        if (blocks[stationIndex]?.ejercicios) {
          blocks[stationIndex].ejercicios[exerciseIndex] = data.newExercise;
        }
        return newSession;
      });
    }
  };

  const handleConfirmSwap = async (
    reason: SwapReason,
    excludeEquipment: boolean,
    useAsContinuity: boolean,
  ) => {
    if (!swapTarget) return;
    setSwappingId(swapTarget.exerciseId);
    try {
      if (swapTarget.kind === 'warmup') {
        await executeWarmupSwap(swapTarget.exerciseId, reason, excludeEquipment);
      } else {
        await executeMainSwap(
          swapTarget.exerciseId,
          reason,
          excludeEquipment,
          useAsContinuity,
          swapTarget.stationIndex ?? 0,
          swapTarget.exerciseIndex ?? 0,
        );
      }
      setSwapTarget(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al cambiar ejercicio');
    } finally {
      setSwappingId(null);
    }
  };

  const handleStartSession = () => {
    const sessionId = currentSession.id ?? (currentSession as { id?: string }).id;
    if (sessionId) markSessionReviewed(sessionId);
    navigate('/workout/player');
  };

  const handleOpenFullReview = () => {
    navigate('/workout/today', { state: { preflight: false }, replace: true });
  };

  const handleSwapExercise = (
    stationIndex: number,
    exerciseIndex: number,
    oldExercise: FlexibleExercise,
  ) => {
    setSwapTarget({
      exerciseId: oldExercise.id,
      name: getExerciseName(oldExercise),
      equipment: Array.isArray(oldExercise.equipo) ? oldExercise.equipo : [],
      kind: 'main',
      stationIndex,
      exerciseIndex,
    });
  };

  const handleSwapWarmup = (exercise: FlexibleExercise) => {
    setSwapTarget({
      exerciseId: exercise.id,
      name: getExerciseName(exercise),
      equipment: Array.isArray(exercise.equipo) ? exercise.equipo : [],
      kind: 'warmup',
    });
  };

  // Calcular totales para los badges
  const mainBlocksForTotals = currentSession.mainBlock?.bloques || (currentSession.mainBlock as any)?.estaciones || [];
  const mainBlockExercises = (mainBlocksForTotals as any).flatMap((s: any) => s.ejercicios || []) || [];
  const totalMainExercises = mainBlockExercises.length;
  const sessionStats = estimateSessionDuration(currentSession);
  const muscleSummary = currentSession.summary?.musculosTrabajos?.length
    ? currentSession.summary.musculosTrabajos
    : (currentSession as { sessionMuscles?: string[] }).sessionMuscles;

  return (
    <AppShell className={isPreflight ? 'pb-8' : 'pb-28'}>
      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 border-b border-zinc-800/90">
        <div className="max-w-sm mx-auto">
          <AppBackButton
            onClick={() => navigate('/')}
            label={isPreflight ? 'Inicio' : 'Inicio'}
          />
          <div className="mt-4">
            <AppEyebrow>
              {isPreflight ? 'Lista para entrenar' : `${currentSession.dayOfWeek} · Semana ${currentSession.weekNumber}`}
            </AppEyebrow>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight mt-4">
            {currentSession.sessionFocus}
          </h1>
          {isPreflight ? (
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              Revisa o cambia ejercicios antes de empezar. Cuando estés listo, pulsa empezar.
            </p>
          ) : currentSession.phase ? (
            <p className="text-sm text-zinc-500 mt-2">{currentSession.phase}</p>
          ) : null}

          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-lime-500/80" />
              {sessionStats.duracionEstimada}
            </span>
            <span className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-lime-500/80" />
              {sessionStats.ejerciciosTotales || totalMainExercises} ejercicios
            </span>
          </div>

          {muscleSummary && muscleSummary.length > 0 && (
            <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
              {muscleSummary.join(' · ')}
            </p>
          )}
        </div>
      </header>

      {isPreflight && (
        <div className="sticky top-0 z-30 px-6 py-4 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80">
          <div className="max-w-sm mx-auto space-y-2">
            <AppPrimaryButton onClick={handleStartSession}>
              <span className="flex items-center justify-center gap-2">
                <Play className="w-5 h-5 fill-current" />
                Empezar ahora
              </span>
            </AppPrimaryButton>
            <button
              type="button"
              onClick={handleOpenFullReview}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 py-1 transition-colors"
            >
              Ver rutina completa
            </button>
          </div>
        </div>
      )}

      <main className="px-6 py-6 max-w-sm mx-auto w-full">

        <SessionCoachingBrief brief={(currentSession as { coachingBrief?: unknown }).coachingBrief as any} />

        <SwapTip />

        {currentSession.warmup && currentSession.warmup.length > 0 && (
          <AppAccordion title="Calentamiento" count={currentSession.warmup.length} defaultOpen={isPreflight}>
            <div className="bg-zinc-900 rounded-lg p-2">
              {currentSession.warmup.map((ejercicio: any, idx: number) => (
                <WarmupExerciseRow
                  key={ejercicio.id || idx}
                  exercise={ejercicio}
                  onSwap={() => handleSwapWarmup(ejercicio)}
                  isSwapping={swappingId === ejercicio.id}
                />
              ))}
            </div>
          </AppAccordion>
        )}

        {((currentSession.mainBlock?.bloques && currentSession.mainBlock.bloques.length > 0) || ((currentSession.mainBlock as any)?.estaciones && (currentSession.mainBlock as any).estaciones.length > 0)) && (
          <AppAccordion title="Bloque principal" count={totalMainExercises} defaultOpen={isPreflight}>
            <div className="rounded-2xl bg-zinc-900/60 ring-1 ring-zinc-800/80 px-4">
              {((currentSession.mainBlock?.bloques || (currentSession.mainBlock as any)?.estaciones) as FlexibleStation[]).flatMap((station) => station.ejercicios ?? []).map((ejercicio, ejIdx) => (
                <MainExerciseRow 
                  key={ejercicio.id || ejIdx}
                  exercise={ejercicio}
                  onSwap={() => {
                    const stationIdx = ((currentSession.mainBlock?.bloques || (currentSession.mainBlock as any)?.estaciones) as FlexibleStation[]).findIndex(
                      (s) => s.ejercicios?.some((e) => e.id === ejercicio.id),
                    );
                    const exerciseIndex = stationIdx >= 0
                      ? ((currentSession.mainBlock?.bloques || (currentSession.mainBlock as any)?.estaciones) as FlexibleStation[])[stationIdx].ejercicios?.findIndex((e) => e.id === ejercicio.id) ?? 0
                      : ejIdx;
                    handleSwapExercise(stationIdx >= 0 ? stationIdx : 0, exerciseIndex, ejercicio);
                  }}
                  isSwapping={swappingId === ejercicio.id}
                />
              ))}
            </div>
          </AppAccordion>
        )}

        {!isPreflight && currentSession.coreBlock && currentSession.coreBlock.ejercicios && (
          <AppAccordion
            title={currentSession.coreBlock.nombre || 'Core'}
            badge={currentSession.coreBlock.rondas ? `${currentSession.coreBlock.rondas} rondas` : undefined}
          >
            {currentSession.coreBlock.instrucciones && (
              <p className="text-xs text-zinc-400 mb-3">{currentSession.coreBlock.instrucciones}</p>
            )}
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50">
              {currentSession.coreBlock.ejercicios.map((ejercicio: any, idx: number) => (
                <CoreExerciseRow key={ejercicio.id || idx} exercise={ejercicio} />
              ))}
            </div>
          </AppAccordion>
        )}

        {(currentSession as { finisher?: { included?: boolean; nombre?: string; durationMinutes?: number; exerciseName?: string; intensityLabel?: string; instrucciones?: string; optional?: boolean } }).finisher?.included && (
          <AppAccordion
            title={(currentSession as any).finisher.nombre || 'Finisher cardio'}
            badge={`${(currentSession as any).finisher.durationMinutes} min · opcional`}
            defaultOpen={isPreflight}
          >
            <div className="rounded-2xl bg-sky-500/10 border border-sky-500/20 p-4 space-y-3">
              <p className="text-sm font-semibold text-white">
                {(currentSession as any).finisher.exerciseName}
              </p>
              <p className="text-xs text-sky-200/80">
                {(currentSession as any).finisher.intensityLabel}
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {(currentSession as any).finisher.instrucciones}
              </p>
              <p className="text-xs text-zinc-500">
                Puedes omitirlo sin afectar tu progresión de fuerza. Hazlo al terminar el bloque principal o más tarde el mismo día.
              </p>
            </div>
          </AppAccordion>
        )}

        {currentSession.cooldown?.fases && currentSession.cooldown.fases.length > 0 && (
          <AppAccordion
            title={currentSession.cooldown.nombre || 'Enfriamiento'}
            badge={`${currentSession.cooldown.duracionEstimada || 8} min`}
          >
            <div className="rounded-2xl bg-zinc-900/60 ring-1 ring-zinc-800/80 px-2">
              {currentSession.cooldown.fases.flatMap((fase: any) => fase.contenido?.ejercicios ?? []).map((ejercicio: any, ejIdx: number) => (
                <CooldownExerciseRow key={ejercicio.id || ejIdx} exercise={ejercicio} />
              ))}
            </div>
          </AppAccordion>
        )}

      </main>

      {!isPreflight && (
        <AppFixedFooter>
          <AppPrimaryButton onClick={handleStartSession}>
            <span className="flex items-center justify-center gap-2">
              <Play className="w-5 h-5 fill-current" />
              Comenzar sesión
            </span>
          </AppPrimaryButton>
        </AppFixedFooter>
      )}

      <ExerciseSwapReasonModal
        open={swapTarget !== null}
        exerciseName={swapTarget?.name ?? ''}
        equipmentTags={swapTarget?.equipment ?? []}
        showContinuityOption={swapTarget?.kind === 'main'}
        onClose={() => setSwapTarget(null)}
        onConfirm={handleConfirmSwap}
        loading={swappingId !== null}
      />

    </AppShell>
  );
};

export default WorkoutOverview;
