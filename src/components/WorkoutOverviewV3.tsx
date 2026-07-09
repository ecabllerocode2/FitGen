import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { 
  ChevronDown, 
  ChevronUp, 
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
  BookOpen,
  AlertCircle,
  Weight
} from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { GeneratedSession } from '../types/session';
import { normalizeSession } from '../utils/sessionNormalizer';

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

// Helpers: sanear notas y formatear timestamps (para depuración de zonas horarias)
const sanitizeNotes = (s?: string | null) : string | null => {
  if (!s) return null;
  return s.replace(/\*/g, '').trim();
};

const formatSessionTimestamp = (session: any): string | null => {
  const ts = session?.generatedAt || session?.meta?.generatedAt || session?.meta?.date || session?.meta?.createdAt;
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);

  try {
    // Preferir formato moderno si el entorno lo soporta
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short', timeZoneName: 'short' } as any);
  } catch (err) {
    try {
      // Fallback a Intl.DateTimeFormat con opciones básicas (más compatibles)
      return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' } as any).format(d);
    } catch (err2) {
      // Último recurso: toLocaleString sin opciones
      try {
        return d.toLocaleString();
      } catch (err3) {
        return d.toUTCString();
      }
    }
  }
};

// ==================== COMPONENTES UI ====================

const SwapTip = () => (
  <div className="mx-0 mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
    <div className="bg-indigo-500/20 p-1.5 rounded-full mt-0.5 shrink-0">
      <Sparkles className="w-4 h-4 text-indigo-400" />
    </div>
    <div>
      <p className="text-xs text-indigo-200 font-medium">Personaliza tu sesión</p>
      <p className="text-[10px] text-indigo-300/80 leading-relaxed">
        ¿No te gusta un ejercicio o te falta equipo? Toca el botón <RefreshCw className="w-3 h-3 inline mx-0.5" /> para cambiarlo.
      </p>
    </div>
  </div>
);

const AccordionSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false, 
  colorClass = "text-zinc-100",
  badge,
  count
}: { 
  title: string;
  icon: any;
  children: React.ReactNode;
  defaultOpen?: boolean;
  colorClass?: string;
  badge?: string;
  count?: number;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700/50 mb-4 shadow-sm">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-zinc-800/50 active:bg-zinc-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full bg-zinc-700/50 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-200 text-sm uppercase tracking-wide">{title}</span>
            {count !== undefined && (
              <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-400">
                {count}
              </span>
            )}
            {badge && (
              <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-400">{badge}</span>
            )}
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-zinc-700/50 bg-zinc-900/30">
          {children}
        </div>
      )}
    </div>
  );
};

// ==================== COMPONENTES DE EJERCICIO ====================

const WarmupExerciseRow = ({ exercise }: { exercise: FlexibleExercise }) => {
  const name = getExerciseName(exercise);
  const image = getExerciseImage(exercise);
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-zinc-800 last:border-0">
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
  // Aceptar distintas formas de session que puedan llegar desde Firestore
  const normalized = normalizeSession(initialSession) || initialSession;
  const [currentSession, setCurrentSession] = useState<GeneratedSession>(normalized as GeneratedSession);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const handleStartSession = () => {
    console.log("Iniciando sesión...");
    navigate('/workout/player'); 
  };

  const handleSwapExercise = async (
    stationIndex: number, 
    exerciseIndex: number, 
    oldExercise: FlexibleExercise
  ) => {
    setSwappingId(oldExercise.id);
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      setSwappingId(null);
      return alert("Error de autenticación. Por favor, vuelva a iniciar sesión.");
    }
    
    let userToken: string;
    try {
      userToken = await user.getIdToken();
    } catch (e) {
      setSwappingId(null);
      console.error("Error al obtener el token:", e);
      return alert("No se pudo obtener el token de usuario. Inténtalo de nuevo.");
    }
    
    // Recolectar todos los IDs de ejercicios actuales para excluirlos
    const mainBlocksForIds = currentSession.mainBlock?.bloques || (currentSession.mainBlock as any)?.estaciones || [];
    const allIds = [
      ...(currentSession.warmup?.map((e:any) => e.id) || []),
      ...((mainBlocksForIds as any).flatMap((s: any) => s.ejercicios?.map((e: any) => e.id) || []) || []),
      ...(currentSession.coreBlock?.ejercicios?.map((e:any) => e.id) || []),
      ...(currentSession.cooldown?.fases?.flatMap((f: any) => f.contenido?.ejercicios?.map((e: any) => e.id) || []) || [])
    ];

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.SESSION_SWAP_EXERCISE, userToken, { 
        method: 'POST',
        body: JSON.stringify({
          exerciseIdToReplace: oldExercise.id,
        })
      });

      if (response.status === 401) {
        throw new Error("Sesión expirada o token inválido. Por favor, vuelve a iniciar sesión.");
      }
      
      const data = await response.json();
      if (response.ok && data.success && data.session) {
        setCurrentSession(data.session as GeneratedSession);
      } else if (response.ok && data.success && data.newExercise) {
        setCurrentSession(prevSession => {
          const newSession = JSON.parse(JSON.stringify(prevSession)) as any;

          const blocks = newSession.mainBlock?.bloques || newSession.mainBlock?.estaciones || [];
          if (blocks && blocks[stationIndex]) {
            blocks[stationIndex].ejercicios = blocks[stationIndex].ejercicios || [];
            blocks[stationIndex].ejercicios[exerciseIndex] = data.newExercise;
          } else {
            // Fallback: intentar colocar en first block si no existe índice solicitado
            if (blocks && blocks[0] && blocks[0].ejercicios) {
              blocks[0].ejercicios[exerciseIndex] = data.newExercise;
            }
          }

          // Asegurar que ambos nombres (bloques/estaciones) estén actualizados
          if (!newSession.mainBlock.bloques && newSession.mainBlock.estaciones) {
            newSession.mainBlock.bloques = newSession.mainBlock.estaciones;
          } else if (!newSession.mainBlock.estaciones && newSession.mainBlock.bloques) {
            newSession.mainBlock.estaciones = newSession.mainBlock.bloques;
          }

          return newSession as GeneratedSession;
        });
      } else {
        alert(data.error || "No se encontró una alternativa adecuada.");
      }
    } catch (error) {
      console.error("Error swapping exercise:", error);
      alert(error instanceof Error ? error.message : "Error al conectar con el servidor.");
    } finally {
      setSwappingId(null);
    }
  };

  // Calcular totales para los badges
  const mainBlocksForTotals = currentSession.mainBlock?.bloques || (currentSession.mainBlock as any)?.estaciones || [];
  const mainBlockExercises = (mainBlocksForTotals as any).flatMap((s: any) => s.ejercicios || []) || [];
  const totalMainExercises = mainBlockExercises.length;
  const totalMainSets = mainBlockExercises.reduce((acc: number, ex: any) => acc + (ex.sets || ex.prescripcion?.series || 1), 0);

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-28">
      
      {/* HEADER DE SESIÓN */}
      <header className="relative pt-8 pb-6 px-5 bg-linear-to-b from-zinc-800 to-zinc-900 border-b border-zinc-700/50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-bold text-lime-500 uppercase tracking-wider mb-1">
              {currentSession.dayOfWeek} • Semana {currentSession.weekNumber}
            </p>
            <h1 className="text-2xl font-bold text-white leading-tight">
              {currentSession.sessionFocus}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">{currentSession.phase}</p>
            {formatSessionTimestamp(currentSession) && (
              <p className="text-xs text-zinc-500 mt-1">Generado: {formatSessionTimestamp(currentSession)}</p>
            )}
            {/* Debug: comparar día calculado por servidor vs día en el cliente (por zona horaria) */}
            {(() => {
              const cs: any = currentSession as any;
              const ts = currentSession.generatedAt || cs.meta?.generatedAt || cs.meta?.date || null;
              if (!ts) return null;
              const localWeekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(new Date(ts));
              const serverDay = (currentSession.dayOfWeek || '').toLowerCase();
              const localDay = (localWeekday || '').toLowerCase();
              if (serverDay && localDay && serverDay !== localDay) {
                return (
                  <p className="text-xs text-amber-400 mt-1">Nota: día del servidor: <span className="font-semibold text-zinc-100">{currentSession.dayOfWeek}</span> • día local detectado: <span className="font-semibold text-zinc-100 capitalize">{localWeekday}</span>. Posible desalineación por zona horaria.</p>
                );
              }
              return null;
            })()}
          </div>
          <div className="bg-lime-500/10 p-3 rounded-xl border border-lime-500/20">
            <Dumbbell className="w-6 h-6 text-lime-500" />
          </div>
        </div>
        
        {/* Stats rápidos */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <Clock className="w-4 h-4 text-lime-500" />
            <span className="text-zinc-300">{currentSession.summary?.duracionEstimada || '~45 min'}</span> 
          </div>
          
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <Dumbbell className="w-4 h-4 text-lime-500" />
            <span className="text-zinc-300">{currentSession.summary?.ejerciciosTotales || totalMainExercises} ejercicios</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <Target className="w-4 h-4 text-lime-500" />
            <span className="text-zinc-300">RPE {currentSession.trainingParameters?.rpeTarget || 7}</span>
          </div>
        </div>

        {/* Músculos trabajados */}
        {currentSession.summary?.musculosTrabajos && currentSession.summary.musculosTrabajos.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentSession.summary.musculosTrabajos.map((musculo, idx) => (
              <span key={idx} className="text-xs bg-lime-500/10 text-lime-400 px-2 py-1 rounded-full border border-lime-500/20">
                {musculo}
              </span>
            ))}
          </div>
        )}
      </header>

      <main className="px-5 py-5 space-y-2">
        
        <SwapTip />

        {/* OBJETIVO DEL DÍA */}
        {currentSession.education && (
          <AccordionSection 
            title="Tu Objetivo" 
            icon={Target} 
            defaultOpen={true}
            colorClass="text-lime-400"
          >
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
          </AccordionSection>
        )}

        {/* CALENTAMIENTO */}
        {currentSession.warmup && currentSession.warmup.length > 0 && (
          <AccordionSection 
            title="Calentamiento" 
            icon={Flame} 
            defaultOpen={false}
            colorClass="text-orange-400"
            count={currentSession.warmup.length}
          >
            <div className="bg-zinc-900 rounded-lg p-2">
              {currentSession.warmup.map((ejercicio: any, idx: number) => (
                <WarmupExerciseRow key={ejercicio.id || idx} exercise={ejercicio} />
              ))}
            </div>
          </AccordionSection>
        )}

        {/* BLOQUE PRINCIPAL */}
        {((currentSession.mainBlock?.bloques && currentSession.mainBlock.bloques.length > 0) || ((currentSession.mainBlock as any)?.estaciones && (currentSession.mainBlock as any).estaciones.length > 0)) && (
          <AccordionSection 
            title="Bloque Principal" 
            icon={Dumbbell} 
            defaultOpen={true}
            colorClass="text-lime-400"
            badge={`${totalMainSets} series`}
          >
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
          </AccordionSection>
        )}

        {/* BLOQUE DE CORE */}
        {currentSession.coreBlock && currentSession.coreBlock.ejercicios && (
          <AccordionSection 
            title={currentSession.coreBlock.nombre || 'Core'} 
            icon={Layers3} 
            defaultOpen={false}
            colorClass="text-yellow-400"
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
          </AccordionSection>
        )}

        {/* VUELTA A LA CALMA */}
        {currentSession.cooldown?.fases && currentSession.cooldown.fases.length > 0 && (
          <AccordionSection 
            title={currentSession.cooldown.nombre || 'Enfriamiento'} 
            icon={Wind} 
            defaultOpen={false}
            colorClass="text-cyan-400"
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
          </AccordionSection>
        )}

        {/* CIENCIA DEL DÍA */}
        {currentSession.education?.cienciaDestacada && (
          <AccordionSection 
            title="Ciencia del Día" 
            icon={BookOpen} 
            defaultOpen={false}
            colorClass="text-blue-400"
          >
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
          </AccordionSection>
        )}

        {/* TIP DEL DÍA */}
        {currentSession.tipOfTheDay && (
          <div className="bg-linear-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-lime-500/20 p-2 rounded-full shrink-0">
                <Info className="w-4 h-4 text-lime-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-lime-400 uppercase tracking-wider mb-1">Tip del día</p>
                <p className="text-sm text-zinc-300">{currentSession.tipOfTheDay}</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* BOTÓN DE INICIO FIJO */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-linear-to-t from-zinc-900 via-zinc-900/95 to-transparent z-50 safe-area-bottom">
        <button 
          onClick={handleStartSession}
          className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-2xl shadow-[0_0_30px_rgba(132,204,22,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <Play className="w-5 h-5 fill-current" />
          COMENZAR SESIÓN
        </button>
      </div>

    </div>
  );
};

export default WorkoutOverview;
