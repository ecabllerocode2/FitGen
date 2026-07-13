import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { 
  Play, 
  Clock, 
  Flame, 
  Dumbbell, 
  Wind, 
  Info,
  Layers,
  Repeat,
  Activity,
  Layers3, 
  RefreshCw, 
  Sparkles,
  Target,
  AlertCircle,
  Weight
} from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { GeneratedSession } from '../types/session';
import { normalizeSession } from '../utils/sessionNormalizer';
import { markSessionReviewed } from '../utils/sessionReviewContext';
import ExerciseSwapReasonModal, { type SwapReason } from './ExerciseSwapReasonModal';
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

const getExerciseSets = (ex: FlexibleExercise): number => {
  return ex.sets || ex.prescripcion?.series || 1;
};

const getExerciseReps = (ex: FlexibleExercise): string | number => {
  return ex.reps || ex.prescripcion?.reps || ex.prescripcion?.repsOTiempo || '-';
};

const getExerciseRIR = (ex: FlexibleExercise): number | undefined => {
  return ex.rirTarget ?? ex.prescripcion?.rirObjetivo;
};

const getExerciseTempo = (ex: FlexibleExercise): string | undefined => {
  return ex.tempo || ex.prescripcion?.tempo;
};

const getExerciseRest = (ex: FlexibleExercise): number | string | undefined => {
  return ex.descanso || ex.prescripcion?.descanso;
};

const getExerciseImage = (ex: FlexibleExercise): string | undefined => {
  return ex.imageUrl || ex.imagenUrl || ex.url_img_0;
};

const getExerciseWeight = (ex: FlexibleExercise): string | undefined => {
  return ex.peso;
};

const getYoutubeThumbnailUrl = (url?: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/default.jpg`; 
};

// Helpers: sanear notas
const sanitizeNotes = (s?: string | null) : string | null => {
  if (!s) return null;
  return s.replace(/\*/g, '').trim();
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

  return (
    <div className="relative flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0 pr-10">
      <div className="w-12 h-12 bg-zinc-700 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Flame className="w-5 h-5 text-orange-400 opacity-50" />
        )}
      </div>
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
  const sets = getExerciseSets(exercise);
  const reps = getExerciseReps(exercise);
  const rir = getExerciseRIR(exercise);
  const tempo = getExerciseTempo(exercise);
  const rest = getExerciseRest(exercise);
  const weight = getExerciseWeight(exercise);
  const thumbnail = getYoutubeThumbnailUrl(exercise.videoUrl);
  const image = thumbnail || getExerciseImage(exercise);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0 relative group">
      {/* Imagen */}
      <div className="w-16 h-16 bg-zinc-700 rounded-lg shrink-0 flex items-center justify-center overflow-hidden relative">
        {isSwapping && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Dumbbell className="w-6 h-6 text-zinc-500 opacity-50" />
        )}
      </div>
      
      {/* Contenido */}
      <div className="flex-1 min-w-0 pr-8">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1.5 truncate">
          {name}
        </h4>
        
        {/* Badges de prescripción */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
            <Layers className="w-3 h-3 text-lime-500" />
            <span className="font-bold">{sets}</span>
            <span className="text-zinc-500">×</span>
            <span className="font-bold">{reps}</span>
          </div>
          
          {rir !== undefined && (
            <div className="flex items-center gap-1 bg-lime-500/10 px-2 py-0.5 rounded text-xs text-lime-400 border border-lime-500/30">
              <Activity className="w-3 h-3" />
              <span className="font-bold">RIR {rir}</span>
            </div>
          )}
          
          {tempo && (
            <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded text-xs text-purple-400 border border-purple-500/30">
              <span className="font-bold">{tempo}</span>
            </div>
          )}
        </div>

        {/* Peso y descanso */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
          {weight && (
            <span className="flex items-center gap-1">
              <Weight className="w-3 h-3" />
              {weight}
            </span>
          )}
          {rest && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {rest}s
            </span>
          )}
          {exercise.parteCuerpo && (
            <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
              {exercise.parteCuerpo}
            </span>
          )}
        </div>

        {/* NUEVO: Indicadores de Progresión (API V2) */}
        {exercise.indicadores && (
          <div className="mt-2 space-y-1.5">
            {/* Progresión de Peso */}
            {exercise.indicadores.pesoAnterior && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500">Anterior:</span>
                <span className="text-zinc-400">{exercise.indicadores.pesoAnterior}</span>
                {weight && weight !== exercise.indicadores.pesoAnterior && (
                  <span className="text-green-400 flex items-center gap-1">
                    <span>→</span>
                    <span className="font-semibold">{weight}</span>
                    <span className="text-green-500">↗</span>
                  </span>
                )}
              </div>
            )}

            {/* e1RM Estimado */}
            {exercise.indicadores.e1RMEstimado && (
              <div className="flex items-center gap-2 text-xs bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                <span className="text-blue-400">e1RM:</span>
                <span className="text-blue-300 font-semibold">{exercise.indicadores.e1RMEstimado}</span>
                {exercise.indicadores.porcentajeObjetivo && (
                  <span className="text-blue-400">({exercise.indicadores.porcentajeObjetivo})</span>
                )}
              </div>
            )}

            {/* Alerta de Meseta */}
            {exercise.indicadores.esMeseta && (
              <div className="flex items-center gap-2 text-xs bg-amber-500/10 px-2 py-1 rounded border border-amber-500/30">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400">Posible meseta detectada - Ajuste aplicado</span>
              </div>
            )}
          </div>
        )}

        {/* NUEVO: Peso Exploratorio (Semana 1) */}
        {(exercise.prescripcion?.pesoSugerido === 'Exploratorio' || weight === 'Exploratorio') && exercise.prescripcion?.explicacion && (
          <div className="mt-2 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/30">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-indigo-300 mb-0.5">🔍 Peso Exploratorio</p>
                <p className="text-xs text-indigo-200 leading-relaxed">
                  {sanitizeNotes(exercise.prescripcion.explicacion)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Botón swap */}
      {onSwap && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSwap();
          }}
          disabled={isSwapping}
          className="absolute right-0 top-3 p-2 rounded-full bg-transparent hover:bg-zinc-700 text-zinc-500 hover:text-lime-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Cambiar ejercicio"
        >
          {!isSwapping && <RefreshCw className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

const CoreExerciseRow = ({ exercise }: { exercise: FlexibleExercise }) => {
  const name = getExerciseName(exercise);
  const image = exercise.url_img_0 || exercise.imagenUrl || getExerciseImage(exercise);
  const repsOrTime = exercise.prescripcion?.repsOTiempo || `${exercise.reps || exercise.prescripcion?.reps} reps`;
  const isIsometric = exercise.prescripcion?.tipo === 'isometrico';
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
      <div className="w-14 h-14 bg-zinc-700 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Layers3 className="w-5 h-5 text-yellow-400 opacity-50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1 truncate">
          {name}
        </h4>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
            <Layers className="w-3 h-3 text-yellow-500" />
            <span className="font-bold">{exercise.prescripcion?.series || 1}</span> Series
          </div>
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
            {isIsometric ? (
              <Clock className="w-3 h-3 text-yellow-500" />
            ) : (
              <Repeat className="w-3 h-3 text-yellow-500" />
            )}
            <span className="font-bold">{repsOrTime}</span>
          </div>
          {exercise.prescripcion?.notaUnilateral && (
            <span className="text-xs text-zinc-500">{sanitizeNotes(exercise.prescripcion.notaUnilateral)}</span>
          )}
        </div>
        {sanitizeNotes(exercise.notas) && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{sanitizeNotes(exercise.notas)}</p>
        )}
      </div>
    </div>
  );
};

const CooldownExerciseRow = ({ exercise }: { exercise: FlexibleExercise }) => {
  const name = getExerciseName(exercise);
  const image = getExerciseImage(exercise);
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
      <div className="w-12 h-12 bg-zinc-700 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Wind className="w-5 h-5 text-cyan-400 opacity-50" />
        )}
      </div>
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
    if (data.session) setCurrentSession(data.session as GeneratedSession);
  };

  const executeMainSwap = async (
    exerciseId: string,
    reason: SwapReason,
    excludeEquipment: boolean,
    stationIndex: number,
    exerciseIndex: number,
  ) => {
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) throw new Error('Error de autenticación');
    const token = await user.getIdToken();
    const response = await authenticatedFetch(API_ENDPOINTS.SESSION_SWAP_EXERCISE, token, {
      method: 'POST',
      body: JSON.stringify({ exerciseIdToReplace: exerciseId, reason, excludeEquipment }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'No se encontró alternativa');
    }
    if (data.session) {
      setCurrentSession(data.session as GeneratedSession);
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

  const handleConfirmSwap = async (reason: SwapReason, excludeEquipment: boolean) => {
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
  const totalMainSets = mainBlockExercises.reduce((acc: number, ex: any) => acc + (ex.sets || ex.prescripcion?.series || 1), 0);
  const objectiveText = sanitizeNotes(currentSession.education?.objetivoDelDia);

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

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-lime-500/70" />
              {currentSession.summary?.duracionEstimada || '~45 min'}
            </span>
            <span className="flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5 text-lime-500/70" />
              {currentSession.summary?.ejerciciosTotales || totalMainExercises} ejercicios
            </span>
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-lime-500/70" />
              RPE {currentSession.trainingParameters?.rpeTarget || 7}
            </span>
          </div>

          {currentSession.summary?.musculosTrabajos && currentSession.summary.musculosTrabajos.length > 0 && (
            <p className="text-xs text-zinc-600 mt-4 leading-relaxed">
              {currentSession.summary.musculosTrabajos.join(' · ')}
            </p>
          )}

          {isPreflight && objectiveText && (
            <p className="text-sm text-zinc-400 mt-4 leading-relaxed line-clamp-3">{objectiveText}</p>
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
        
        <SwapTip />

        {/* OBJETIVO DEL DÍA — solo en vista completa */}
        {!isPreflight && currentSession.education && (
          <AppAccordion title="Tu objetivo" defaultOpen>
            <div className="space-y-3">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {sanitizeNotes(currentSession.education.objetivoDelDia)}
              </p>
              {sanitizeNotes(currentSession.education.consejoTecnico) && (
                <div className="bg-lime-500/5 border border-lime-500/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-lime-300">
                    {sanitizeNotes(currentSession.education.consejoTecnico)}
                  </p>
                </div>
              )}
            </div>
          </AppAccordion>
        )}

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
          <AppAccordion title="Bloque principal" badge={`${totalMainSets} series`} defaultOpen={isPreflight}>
            {((currentSession.mainBlock?.bloques || (currentSession.mainBlock as any)?.estaciones) as FlexibleStation[]).map((station, stationIdx) => (
              <div key={stationIdx} className="mb-5 last:mb-0">
                {/* Header de estación */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 bg-lime-500/20 rounded-full flex items-center justify-center text-lime-400 font-bold text-xs">
                    {stationIdx + 1}
                  </span>
                  <span className="text-sm font-medium text-zinc-300">
                    Estación {stationIdx + 1}
                  </span>
                  {station.tipo && station.tipo !== 'estacion' && station.tipo !== 'simple' && (
                    <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      {station.tipo}
                    </span>
                  )}
                </div>
                
                {/* Ejercicios de la estación */}
                <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50">
                  {station.ejercicios && station.ejercicios.map((ejercicio, ejIdx) => (
                    <MainExerciseRow 
                      key={ejercicio.id || ejIdx}
                      exercise={ejercicio}
                      onSwap={() => handleSwapExercise(stationIdx, ejIdx, ejercicio)}
                      isSwapping={swappingId === ejercicio.id}
                    />
                  ))}
                </div>
              </div>
            ))}
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

        {!isPreflight && currentSession.cooldown?.fases && currentSession.cooldown.fases.length > 0 && (
          <AppAccordion
            title={currentSession.cooldown.nombre || 'Enfriamiento'}
            badge={`${currentSession.cooldown.duracionEstimada || 8} min`}
          >
            {currentSession.cooldown.fases.map((fase: any, faseIdx: number) => (
              <div key={faseIdx} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{fase.icono}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                    {fase.fase}
                  </span>
                  <span className="text-xs text-zinc-500">{fase.duracion} min</span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">{fase.descripcion}</p>
                
                {fase.contenido?.ejercicios && fase.contenido.ejercicios.length > 0 && (
                  <div className="bg-zinc-900 rounded-lg p-2">
                    {fase.contenido.ejercicios.map((ejercicio: any, ejIdx: number) => (
                      <CooldownExerciseRow key={ejercicio.id || ejIdx} exercise={ejercicio} />
                    ))}
                  </div>
                )}
                
                {fase.contenido?.instrucciones && !fase.contenido.ejercicios && (
                  <p className="text-xs text-zinc-500 italic bg-zinc-900 rounded-lg p-3">
                    {fase.contenido.instrucciones}
                  </p>
                )}
              </div>
            ))}
          </AppAccordion>
        )}

        {!isPreflight && currentSession.education?.cienciaDestacada && (
          <AppAccordion title="Ciencia del día">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-300">
                {currentSession.education.cienciaDestacada.titulo}
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {currentSession.education.cienciaDestacada.contenido}
              </p>
              <p className="text-xs text-zinc-500 italic">
                Fuente: {currentSession.education.cienciaDestacada.fuente}
              </p>
            </div>
          </AppAccordion>
        )}

        {!isPreflight && currentSession.tipOfTheDay && (
          <div className="py-4 border-b border-zinc-800/90">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600 mb-2">Tip del día</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{currentSession.tipOfTheDay}</p>
          </div>
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
        onClose={() => setSwapTarget(null)}
        onConfirm={handleConfirmSwap}
        loading={swappingId !== null}
      />

    </AppShell>
  );
};

export default WorkoutOverview;
