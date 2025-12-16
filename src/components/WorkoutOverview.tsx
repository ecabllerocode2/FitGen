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
  Sparkles 
} from 'lucide-react';

const getYoutubeThumbnailUrl = (url?: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;

  if (!videoId) return null;

  // Se usa 'default.jpg' (calidad básica, máxima compatibilidad)
  return `https://img.youtube.com/vi/${videoId}/default.jpg`; 
};

interface Exercise {
  id: string;
  name: string;
  instructions?: string;
  durationOrReps?: string; 
  sets?: number;           
  targetReps?: string;
  targetRIR?: number;  // ⭐ NUEVO V5
  loadProgression?: string;  // ⭐ NUEVO V5
  technique?: string;  // ⭐ NUEVO V5
  rpe?: number;
  notes?: string;
  imageUrl?: string | null;
  musculoObjetivo?: string;
  equipo?: string; 
  suggestedLoad?: string;
  url?: string;
  performanceData?: {  // ⭐ NUEVO V5
    plannedSets?: number;
    actualSets?: Array<{
      set: number;
      reps: number;
      rir: number;
      load: string;
    }>;
  };
}

interface Block {
  blockType: 'station' | 'superset' | 'circuit';
  restBetweenSetsSec: number;
  restBetweenExercisesSec: number;
  exercises: Exercise[];
}

interface SessionData {
  sessionGoal: string;
  estimatedDurationMin: number;
  intensityLevel?: string;
  warmup: { exercises: Exercise[] };
  mainBlocks: Block[];
  coreBlocks?: Block[];
  cooldown: { exercises: Exercise[] };
  meta?: any;
}

interface WorkoutOverviewProps {
  session: SessionData;
}

const SwapTip = () => (
  <div className="mx-5 mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
    <div className="bg-indigo-500/20 p-1.5 rounded-full mt-0.5">
      <Sparkles className="w-4 h-4 text-indigo-400" />
    </div>
    <div>
      <p className="text-xs text-indigo-200 font-medium">Personaliza tu sesión</p>
      <p className="text-[10px] text-indigo-300/80 leading-relaxed">
        ¿No te gusta un ejercicio o te falta equipo? Toca el botón <RefreshCw className="w-3 h-3 inline mx-0.5" /> para cambiarlo por 
        una alternativa equivalente.
      </p>
    </div>
  </div>
);

const AccordionSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false, 
  colorClass = "text-zinc-100" 
}: { 
  title: string, 
  icon: any, 
  children: React.ReactNode, 
  defaultOpen?: boolean, 
  colorClass?: string 
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
          <span className="font-bold text-zinc-200 text-sm uppercase tracking-wide">{title}</span>
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

const ExerciseRow = ({ 
    exercise, 
    isSimple = false, 
    onSwap, 
    isSwapping 
}: { 
    exercise: Exercise, 
    isSimple?: boolean, 
    onSwap?: () => void,
    isSwapping?: boolean
}) => {
    const thumbnail = getYoutubeThumbnailUrl(exercise.url);
    const finalImageUrl = thumbnail || exercise.imageUrl;

    return (
        <div className="flex items-start gap-4 py-3 border-b border-zinc-800 last:border-0 relative group">
          
          <div 
          className="w-16 h-16 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative">
              {isSwapping && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                  </div>
              )}
              {finalImageUrl ? (
                <img src={finalImageUrl} alt={exercise.name} className="w-full h-full object-cover" />
              ) : (
                  <Dumbbell className="w-6 h-6 text-zinc-500 opacity-50" />
              )}
          </div>
          
          <div className="flex-1 min-w-0 pr-8"> 
            <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1 truncate">
              {exercise.name}
            </h4>
            
            {isSimple ?
            (
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {exercise.durationOrReps || "A criterio"}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
                  <Layers className="w-3 h-3 text-lime-500" />
                  <span className="font-bold">{exercise.sets}</span> Series
                </div>
                <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
                  <Repeat className="w-3 h-3 text-lime-500" />
                  <span className="font-bold">{exercise.targetReps}</span> Reps
                </div>
                {exercise.targetRIR !== undefined && (
                  <div className="flex items-center gap-1 bg-lime-500/10 px-2 py-0.5 rounded text-xs text-lime-400 border border-lime-500/30">
                    <Activity className="w-3 h-3" />
                    <span className="font-bold">RIR {exercise.targetRIR}</span>
                  </div>
                )}
                {exercise.technique && exercise.technique !== 'standard' && (
                  <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded text-xs text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-3 h-3" />
                    <span className="font-bold">
                      {exercise.technique === 'tempo_3-0-3' ? 'Tempo 3-0-3' : exercise.technique === 'rest_pause' ? 'Rest-Pause' : exercise.technique}
                    </span>
                  </div>
                )}
              </div>
            )}

            {exercise.notes && (
              <p className="text-xs text-zinc-500 mt-2 italic flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {exercise.notes}
              </p>
            )}
          </div>
          
          {!isSimple && onSwap && (
              <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onSwap();
                }}
                disabled={isSwapping}
                className="absolute right-0 top-3 p-2 rounded-full bg-transparent hover:bg-zinc-700 text-zinc-500 hover:text-lime-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Cambiar ejercicio"
              >
                {!isSwapping && <RefreshCw className={`w-4 h-4`} />}
              </button>
          )}
        </div>
    );
};

const WorkoutOverview: React.FC<WorkoutOverviewProps> = ({ session: initialSession }) => {
  const navigate = useNavigate();
  const [currentSession, setCurrentSession] = useState<SessionData>(initialSession);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const handleStartSession = () => {
    console.log("Iniciando sesión...");
    navigate('/workout/player'); 
  };

  const handleSwapExercise = async (
    blockType: 'warmup' | 'main' | 'core' | 'cooldown', 
    blockIndex: number, 
    exerciseIndex: number, 
    oldExercise: Exercise
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
    
    // @ts-ignore
    const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/session/swap-exercise`;
    const allIds = [
        ...currentSession.warmup.exercises.map(e => e.id),
        ...currentSession.cooldown.exercises.map(e => e.id),
        ...currentSession.mainBlocks.flatMap(b => b.exercises.map(e => e.id)),
        ...(currentSession.coreBlocks?.flatMap(b => b.exercises.map(e => e.id)) || [])
    ];
    try {
        const response = await fetch(endpoint, { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}` 
            },
            body: JSON.stringify({
                blockType,
                blockIndex,
                exerciseIndex,
                targetId: oldExercise.id, 
                excludedIds: allIds, 
                userInventory: currentSession.meta?.availableEquipment || ["Gimnasio completo"] 
            })
        });

        if (response.status === 401) {
             throw new Error("Sesión expirada o token inválido. Por favor, vuelve a iniciar sesión.");
        }
        
        const data = await response.json();
        if (response.ok && data.success && data.newExercise) {
            
            setCurrentSession(prevSession => {
                const newSession = JSON.parse(JSON.stringify(prevSession));
                
                if (blockType === 'warmup') {
                    newSession.warmup.exercises[exerciseIndex] = data.newExercise;
                } else if (blockType === 'cooldown') {
                    newSession.cooldown.exercises[exerciseIndex] = data.newExercise;
                } else if (blockType === 'main') {
                    newSession.mainBlocks[blockIndex].exercises[exerciseIndex] = data.newExercise;
                } else if (blockType === 'core' && newSession.coreBlocks) {
                    newSession.coreBlocks[blockIndex].exercises[exerciseIndex] = data.newExercise;
                }
                
                return newSession;
            });
        } else {
            alert(data.error || "No se encontró una alternativa adecuada para tu equipo.");
        }

    } catch (error) {
        console.error("Error swapping exercise:", error);
        alert(error instanceof Error ? error.message : "Error al conectar con el servidor. Inténtalo de nuevo.");
    } finally {
        setSwappingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-28">
      
      {/* 1. HEADER DE SESIÓN */}
      <header className="relative pt-8 pb-6 px-6 bg-zinc-800 rounded-b-3xl border-b border-zinc-700 shadow-xl z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
             <p className="text-xs font-bold text-lime-500 uppercase tracking-wider mb-1">Sesión de Hoy</p>
             <h1 
             className="text-2xl font-bold text-white leading-tight max-w-[80%]">
               {currentSession.sessionGoal || "Entrenamiento Personalizado"}
             </h1>
          </div>
          <div className="bg-zinc-700/50 p-2 rounded-lg">
            <Dumbbell className="w-6 h-6 text-zinc-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-zinc-400">
           <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
             <Clock className="w-4 h-4 text-lime-500" />
             <span>{currentSession.estimatedDurationMin ||
             60} min</span> 
           </div>
           
           <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
             <Activity className={`w-4 h-4 ${
                 currentSession.intensityLevel?.includes('Alta') ?
                 'text-red-500' : 
                 currentSession.intensityLevel?.includes('Baja') ?
                 'text-blue-400' : 'text-orange-500'
             }`} />
             <span>{currentSession.intensityLevel ||
             "Media"}</span>
           </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-2">
        
        <SwapTip />

        {/* 2. CALENTAMIENTO */}
        <AccordionSection 
          title="Calentamiento" 
          icon={Flame} 
          defaultOpen={false}
          colorClass="text-orange-400 bg-orange-500/10"
        >
          {currentSession.warmup.exercises.map((ex, idx) => (
            <div key={ex.id + idx} className="relative z-10 bg-zinc-900 mb-3 last:mb-0 rounded-xl p-2 border border-zinc-800/50 shadow-sm">
                <ExerciseRow 
                    exercise={ex} 
                    isSimple={true} 
                    onSwap={() => handleSwapExercise('warmup', 0, idx, ex)} 
                    isSwapping={swappingId === ex.id}
                />
            </div>
          ))}
        </AccordionSection>

        {/* 3. BLOQUES PRINCIPALES */}
        {currentSession.mainBlocks.map((block, index) => {
            
            const isComplex = block.blockType === 'superset' ||
            block.blockType === 'circuit';
            const blockTitle = isComplex 
                ?
                `Bloque ${index + 1} (${block.blockType === 'superset' ? 'Superserie' : 'Circuito'})` 
                : `Bloque ${index + 1}`;
            return (
              <AccordionSection 
                key={`main-${index}`} 
                title={blockTitle} 
                icon={Dumbbell} 
                defaultOpen={false}
                colorClass={isComplex 
                ? "text-purple-400 bg-purple-500/10" : "text-lime-400 bg-lime-500/10"}
              >
                <div className="relative">
                  {/* Línea visual para conectar ejercicios si es Superserie/Circuito */}
                  {isComplex && (
                    <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-zinc-700 rounded-full z-0"></div>
                  )}
                  
                  {block.exercises.map((ex, idx) => (
                    <div key={ex.id + idx} className="relative z-10 bg-zinc-900 mb-3 last:mb-0 rounded-xl p-2 border 
                    border-zinc-800/50 shadow-sm">
                      <ExerciseRow 
                          exercise={ex} 
                          isSimple={false}
                          onSwap={() => handleSwapExercise('main', index, idx, ex)}
                          isSwapping={swappingId === ex.id}
                      />
                    </div>
                  ))}
    
                </div>
                
                {/* Footer del Bloque (Descansos) */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500 bg-zinc-950/30 p-2 rounded-lg border border-zinc-800 border-dashed">
                   <Clock className="w-3.5 h-3.5" 
                   />
                   <span>Descanso entre series: <strong className="text-zinc-300">{block.restBetweenSetsSec}s</strong></span>
                </div>
              </AccordionSection>
            );
        })}

        {/* 4. BLOQUE DE CORE */}
        {currentSession.coreBlocks && currentSession.coreBlocks.length > 0 && (
            <AccordionSection 
                title="Bloque de Core" 
                icon={Layers3} 
                defaultOpen={false} 
                colorClass="text-yellow-400 bg-yellow-500/10"
            >
                {currentSession.coreBlocks.map((block, index) => (
                    <div key={`core-${index}`} className="relative mb-4">
                        <p className="text-xs text-zinc-400 font-medium mb-2">Rutina de Estabilidad {index + 1}</p>
 
                        {block.exercises.map((ex, idx) => (
                           <div key={ex.id + idx} className="relative z-10 bg-zinc-900 mb-3 last:mb-0 rounded-xl p-2 border border-zinc-800/50 shadow-sm">
                            <ExerciseRow 
                                exercise={ex} 
                                isSimple={false}
                                onSwap={() => handleSwapExercise('core', index, idx, ex)}
                                isSwapping={swappingId === ex.id}
                            />
                           </div>
                        ))}
                         <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500 bg-zinc-950/30 p-2 rounded-lg border border-zinc-800 border-dashed">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Descanso entre series: <strong className="text-zinc-300">{block.restBetweenSetsSec}s</strong></span>
                        </div>
                    </div>
                ))}
            </AccordionSection>
        )}

        {/* 5. VUELTA A LA CALMA */}
        <AccordionSection 
          title="Vuelta a la Calma" 
          icon={Wind} 
          defaultOpen={false}
          colorClass="text-cyan-400 bg-cyan-500/10"
        >
          {currentSession.cooldown.exercises.map((ex, idx) => (
             <div key={ex.id + idx} className="relative 
             z-10 bg-zinc-900 mb-3 last:mb-0 rounded-xl p-2 border border-zinc-800/50 shadow-sm">
                <ExerciseRow 
                    exercise={ex} 
                    isSimple={true} 
                    onSwap={() => handleSwapExercise('cooldown', 0, idx, ex)} 
                    isSwapping={swappingId === ex.id}
                />
            </div>
          ))}
        </AccordionSection>

      </main>

      {/* 6. STICKY FOOTER - BOTÓN DE INICIO */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent z-50">
        <button 
          onClick={handleStartSession}
          className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-5 h-5 fill-current" />
          COMENZAR SESIÓN
        </button>
      </div>

    </div>
  );
};

export default WorkoutOverview;