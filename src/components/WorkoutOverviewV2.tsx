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
  Zap,
  BookOpen
} from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { 
  GeneratedSession,
  MainExercise,
  WarmupExercise,
  CoreExercise,
  StretchExercise
} from '../types/session';

// Helper para obtener thumbnail de YouTube
const getYoutubeThumbnailUrl = (url?: string | null) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/default.jpg`; 
};

// ==================== COMPONENTES UI ====================

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
  colorClass = "text-zinc-100",
  badge
}: { 
  title: string, 
  icon: any, 
  children: React.ReactNode, 
  defaultOpen?: boolean, 
  colorClass?: string,
  badge?: string
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
          {badge && (
            <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded-full text-zinc-400">{badge}</span>
          )}
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

// Ejercicio de calentamiento (formato simple)
const WarmupExerciseRow = ({ exercise }: { exercise: WarmupExercise }) => {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-zinc-800 last:border-0">
      <div className="w-12 h-12 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {exercise.imagenUrl ? (
          <img src={exercise.imagenUrl} alt={exercise.nombre} className="w-full h-full object-cover" />
        ) : (
          <Flame className="w-5 h-5 text-orange-400 opacity-50" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1">
          {exercise.nombre}
        </h4>
        <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" />
          {exercise.duracion || `${exercise.reps} reps`}
        </p>
        {exercise.instrucciones && (
          <p className="text-xs text-zinc-500 italic">{exercise.instrucciones}</p>
        )}
      </div>
    </div>
  );
};

// Ejercicio principal (formato completo con prescripción)
const MainExerciseRow = ({ 
  exercise, 
  onSwap, 
  isSwapping 
}: { 
  exercise: MainExercise, 
  onSwap?: () => void,
  isSwapping?: boolean
}) => {
  console.log('MainExerciseRow exercise:', exercise);
  const thumbnail = getYoutubeThumbnailUrl(exercise.videoUrl);
  const finalImageUrl = thumbnail || exercise.imagenUrl;

  return (
    <div className="flex items-start gap-4 py-3 border-b border-zinc-800 last:border-0 relative group">
      <div className="w-16 h-16 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden relative">
        {isSwapping && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <RefreshCw className="w-5 h-5 text-white animate-spin" />
          </div>
        )}
        {finalImageUrl ? (
          <img src={finalImageUrl} alt={exercise.nombre} className="w-full h-full object-cover" />
        ) : (
          <Dumbbell className="w-6 h-6 text-zinc-500 opacity-50" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 pr-8">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1 truncate">
          {exercise.nombre}
        </h4>
        
        {/* Badges de prescripción */}
        {exercise.prescripcion && (
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
            <Layers className="w-3 h-3 text-lime-500" />
            <span className="font-bold">{exercise.prescripcion.series}</span> Series
          </div>
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
            <Repeat className="w-3 h-3 text-lime-500" />
            <span className="font-bold">{exercise.prescripcion.reps}</span> Reps
          </div>
          <div className="flex items-center gap-1 bg-lime-500/10 px-2 py-0.5 rounded text-xs text-lime-400 border border-lime-500/30">
            <Activity className="w-3 h-3" />
            <span className="font-bold">RIR {exercise.prescripcion.rirObjetivo}</span>
          </div>
          {exercise.prescripcion.tempo && (
            <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded text-xs text-purple-400 border border-purple-500/30">
              <Sparkles className="w-3 h-3" />
              <span className="font-bold">Tempo {exercise.prescripcion.tempo}</span>
            </div>
          )}
          {exercise.prescripcion.tecnicaEspecial && (
            <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-0.5 rounded text-xs text-orange-400 border border-orange-500/30">
              <Zap className="w-3 h-3" />
              <span className="font-bold">{exercise.prescripcion.tecnicaEspecial}</span>
            </div>
          )}
        </div>
        )}

        {/* Info adicional */}
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          {exercise.prescripcion?.descanso && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {exercise.prescripcion.descanso}s descanso
          </span>
          )}
          {exercise.parteCuerpo && (
            <span className="bg-zinc-800 px-2 py-0.5 rounded">{exercise.parteCuerpo}</span>
          )}
        </div>

        {exercise.notas && (
          <p className="text-xs text-zinc-500 mt-2 italic flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {exercise.notas}
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
          className="absolute right-0 top-3 p-2 rounded-full bg-transparent hover:bg-zinc-700 text-zinc-500 hover:text-lime-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Cambiar ejercicio"
        >
          {!isSwapping && <RefreshCw className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
};

// Ejercicio de core
const CoreExerciseRow = ({ exercise }: { exercise: CoreExercise }) => {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-zinc-800 last:border-0">
      <div className="w-14 h-14 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {exercise.imagenUrl ? (
          <img src={exercise.imagenUrl} alt={exercise.nombre} className="w-full h-full object-cover" />
        ) : (
          <Layers3 className="w-5 h-5 text-yellow-400 opacity-50" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1">
          {exercise.nombre}
        </h4>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
            <Layers className="w-3 h-3 text-yellow-500" />
            <span className="font-bold">{exercise.prescripcion.series}</span> Series
          </div>
          <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
            {exercise.prescripcion.tipo === 'isometrico' ? (
              <>
                <Clock className="w-3 h-3 text-yellow-500" />
                <span className="font-bold">{exercise.prescripcion.repsOTiempo}</span>
              </>
            ) : (
              <>
                <Repeat className="w-3 h-3 text-yellow-500" />
                <span className="font-bold">{exercise.prescripcion.repsOTiempo}</span>
              </>
            )}
          </div>
          {exercise.prescripcion.notaUnilateral && (
            <span className="text-xs text-zinc-500">{exercise.prescripcion.notaUnilateral}</span>
          )}
        </div>
        {exercise.notas && (
          <p className="text-xs text-zinc-500 mt-2 italic">{exercise.notas}</p>
        )}
      </div>
    </div>
  );
};

// Ejercicio de estiramiento
const StretchExerciseRow = ({ exercise }: { exercise: StretchExercise }) => {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-zinc-800 last:border-0">
      <div className="w-12 h-12 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {exercise.imagenUrl ? (
          <img src={exercise.imagenUrl} alt={exercise.nombre} className="w-full h-full object-cover" />
        ) : (
          <Wind className="w-5 h-5 text-cyan-400 opacity-50" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1">
          {exercise.nombre}
        </h4>
        <p className="text-xs text-zinc-400 flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" />
          {exercise.tiempo}
        </p>
        {exercise.musculoObjetivo && (
          <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{exercise.musculoObjetivo}</span>
        )}
        {exercise.instrucciones && (
          <p className="text-xs text-zinc-500 mt-1 italic">{exercise.instrucciones}</p>
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
  const [currentSession, setCurrentSession] = useState<GeneratedSession>(initialSession);
  const [swappingId, setSwappingId] = useState<string | null>(null);

  const handleStartSession = () => {
    console.log("Iniciando sesión...");
    navigate('/workout/player'); 
  };

  const handleSwapExercise = async (
    stationIndex: number, 
    exerciseIndex: number, 
    oldExercise: MainExercise
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
    const allIds = [
      ...(currentSession.warmup?.map(e => e.id) || []),
      ...(currentSession.mainBlock?.bloques?.flatMap(s => s.ejercicios.map(e => e.id)) || []),
      ...(currentSession.coreBlock?.ejercicios?.map(e => e.id) || []),
      ...(currentSession.cooldown?.fases?.flatMap(f => f.contenido?.ejercicios?.map(e => e.id) || []) || [])
    ];

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.SESSION_SWAP_EXERCISE, userToken, { 
        method: 'POST',
        body: JSON.stringify({
          blockType: 'main',
          blockIndex: stationIndex,
          exerciseIndex,
          targetId: oldExercise.id, 
          excludedIds: allIds,
        })
      });

      if (response.status === 401) {
        throw new Error("Sesión expirada o token inválido. Por favor, vuelve a iniciar sesión.");
      }
      
      const data = await response.json();
      if (response.ok && data.success && data.newExercise) {
        setCurrentSession(prevSession => {
          const newSession = JSON.parse(JSON.stringify(prevSession)) as GeneratedSession;
          newSession.mainBlock.bloques[stationIndex].ejercicios[exerciseIndex] = data.newExercise;
          return newSession;
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

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-28">
      
      {/* 1. HEADER DE SESIÓN */}
      <header className="relative pt-8 pb-6 px-6 bg-zinc-800 rounded-b-3xl border-b border-zinc-700 shadow-xl z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-lime-500 uppercase tracking-wider mb-1">
              {currentSession.dayOfWeek} • Semana {currentSession.weekNumber}
            </p>
            <h1 className="text-2xl font-bold text-white leading-tight max-w-[80%]">
              {currentSession.sessionFocus}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">{currentSession.phase}</p>
          </div>
          <div className="bg-zinc-700/50 p-2 rounded-lg">
            <Dumbbell className="w-6 h-6 text-zinc-400" />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <Clock className="w-4 h-4 text-lime-500" />
            <span>{currentSession.summary.duracionEstimada}</span> 
          </div>
          
          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <Dumbbell className="w-4 h-4 text-lime-500" />
            <span>{currentSession.summary.ejerciciosTotales} ejercicios</span>
          </div>
          
          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
            <Target className="w-4 h-4 text-lime-500" />
            <span>RPE {currentSession.trainingParameters.rpeTarget}</span>
          </div>
        </div>

        {/* Músculos trabajados */}
        <div className="mt-4 flex flex-wrap gap-2">
          {currentSession.summary.musculosTrabajos.map((musculo, idx) => (
            <span key={idx} className="text-xs bg-lime-500/10 text-lime-400 px-2 py-1 rounded-full border border-lime-500/20">
              {musculo}
            </span>
          ))}
        </div>
      </header>

      <main className="px-5 py-6 space-y-2">
        
        <SwapTip />

        {/* CONTENIDO EDUCATIVO - Objetivo del día */}
        {currentSession.education && (
          <AccordionSection 
            title="Tu Objetivo de Hoy" 
            icon={Target} 
            defaultOpen={true}
            colorClass="text-lime-400 bg-lime-500/10"
          >
            <div className="space-y-3">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentSession.education.objetivoDelDia}
              </p>
              {currentSession.education.consejoTecnico && (
                <div className="bg-lime-500/5 border border-lime-500/20 rounded-lg p-3">
                  <p className="text-xs text-lime-300">
                    {currentSession.education.consejoTecnico}
                  </p>
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {/* 2. CALENTAMIENTO RAMP */}
        <AccordionSection 
          title="Calentamiento" 
          icon={Flame} 
          defaultOpen={false}
          colorClass="text-orange-400 bg-orange-500/10"
        >
          {currentSession.warmup && currentSession.warmup.length > 0 ? (
            currentSession.warmup.map((ejercicio, ejIdx) => (
              <div key={ejercicio.id || ejIdx} className="bg-zinc-900 rounded-lg p-2 mb-2 last:mb-0">
                <WarmupExerciseRow exercise={ejercicio} />
              </div>
            ))
          ) : (
            <p className="text-zinc-500 text-sm">No hay ejercicios de calentamiento</p>
          )}
        </AccordionSection>

        {/* 3. BLOQUES PRINCIPALES */}
        <AccordionSection 
          title="Bloque Principal" 
          icon={Dumbbell} 
          defaultOpen={true}
          colorClass="text-lime-400 bg-lime-500/10"
        >
          {currentSession.mainBlock.bloques?.map((station, stationIdx) => (
            <div key={stationIdx} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-lime-500/20 rounded-full flex items-center justify-center text-lime-400 font-bold text-sm">
                  {stationIdx + 1}
                </span>
                <span className="text-sm font-medium text-zinc-300">
                  Estación {stationIdx + 1}
                  {station.tipo !== 'simple' && (
                    <span className="ml-2 text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                      {station.tipo}
                    </span>
                  )}
                </span>
              </div>
              
              <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50">
                {station.ejercicios.map((ejercicio, ejIdx) => (
                  <MainExerciseRow 
                    key={ejercicio.id}
                    exercise={ejercicio}
                    onSwap={() => handleSwapExercise(stationIdx, ejIdx, ejercicio)}
                    isSwapping={swappingId === ejercicio.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </AccordionSection>

        {/* 4. BLOQUE DE CORE */}
        {currentSession.coreBlock && (
          <AccordionSection 
            title={currentSession.coreBlock.nombre} 
            icon={Layers3} 
            defaultOpen={false}
            colorClass="text-yellow-400 bg-yellow-500/10"
            badge={`${currentSession.coreBlock.duracionEstimada} min`}
          >
            {currentSession.coreBlock.instrucciones && (
              <p className="text-xs text-zinc-400 mb-3">{currentSession.coreBlock.instrucciones}</p>
            )}
            {currentSession.coreBlock.rondas && (
              <p className="text-xs text-yellow-400 mb-3 font-medium">
                {currentSession.coreBlock.rondas} rondas
              </p>
            )}
            <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800/50">
              {currentSession.coreBlock.ejercicios.map((ejercicio, idx) => (
                <CoreExerciseRow key={ejercicio.id || idx} exercise={ejercicio} />
              ))}
            </div>
          </AccordionSection>
        )}

        {/* 5. VUELTA A LA CALMA */}
        <AccordionSection 
          title={currentSession.cooldown.nombre} 
          icon={Wind} 
          defaultOpen={false}
          colorClass="text-cyan-400 bg-cyan-500/10"
          badge={`${currentSession.cooldown.duracionEstimada} min`}
        >
          {currentSession.cooldown.fases.map((fase, faseIdx) => (
            <div key={faseIdx} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{fase.icono}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {fase.fase}
                </span>
                <span className="text-xs text-zinc-500">{fase.duracion} min</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">{fase.descripcion}</p>
              
              {fase.contenido.ejercicios && (
                <div className="bg-zinc-900 rounded-lg p-2">
                  {fase.contenido.ejercicios.map((ejercicio, ejIdx) => (
                    <StretchExerciseRow key={ejercicio.id || ejIdx} exercise={ejercicio} />
                  ))}
                </div>
              )}
              
              {fase.contenido.instrucciones && !fase.contenido.ejercicios && (
                <p className="text-xs text-zinc-500 italic">{fase.contenido.instrucciones}</p>
              )}
            </div>
          ))}
        </AccordionSection>

        {/* CONTENIDO EDUCATIVO - Ciencia */}
        {currentSession.education?.cienciaDestacada && (
          <AccordionSection 
            title="Ciencia del Día" 
            icon={BookOpen} 
            defaultOpen={false}
            colorClass="text-blue-400 bg-blue-500/10"
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
          <div className="bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20 rounded-xl p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="bg-lime-500/20 p-2 rounded-full">
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
