import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth'; 
import { 
  ChevronLeft, 
  Check, 
  Clock, 
  Dumbbell, 
  Info,
  Trophy,
  MessageSquare,
  Loader2 
} from 'lucide-react';

// --- 1. HELPER PARA YOUTUBE (Fuera del componente) ---
// Convierte cualquier link de YT en un embed limpio, mudo y en bucle.
const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  
  // Regex potente que detecta ID en youtu.be, watch?v=, embed/, etc.
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;

  if (!videoId) return null;

  // Parámetros CLAVE para que funcione como un GIF de fondo:
  // autoplay=1: Iniciar solo.
  // mute=1: OBLIGATORIO para que Chrome/Safari permitan el autoplay.
  // loop=1 + playlist={id}: Truco necesario para loopear un solo video.
  // controls=0: Sin barra de reproducción.
  // playsinline=1: Para que en iPhone no se abra en pantalla completa.
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=0`;
};

// --- TIPOS ACTUALIZADOS ---
interface Exercise {
  id: string;
  name: string;
  instructions?: string;
  description?: string; 
  durationOrReps?: string;
  sets?: number;
  targetReps?: string;
  rpe?: number;
  notes?: string;
  imageUrl?: string | null;
  url?: string; // <--- URL del video de YouTube
  equipment?: string;
}

interface Block {
  blockType: 'station' | 'superset' | 'circuit';
  restBetweenSetsSec: number;
  restBetweenExercisesSec: number;
  exercises: Exercise[];
}

interface Feedback { 
    rpe: number;
    notes: string;
    completedAt: string;
}

interface SessionData {
  sessionGoal: string;
  estimatedDurationMin: number;
  warmup: { exercises: Exercise[] };
  mainBlocks: Block[];
  cooldown: { exercises: Exercise[] };
  completed?: boolean; 
  feedback?: Feedback;  
}

interface WorkoutPlayerProps {
  session: SessionData;
}

type WorkoutStep = {
  type: 'warmup' | 'exercise' | 'rest' | 'cooldown';
  data?: Exercise;
  blockIndex?: number;
  exerciseIndex?: number;
  setIndex?: number;
  totalSets?: number;
  restSeconds?: number;
  isSuperset?: boolean;
};

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ session }) => {
  const navigate = useNavigate();
  const auth = getAuth(); 
  
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workoutSteps, setWorkoutSteps] = useState<WorkoutStep[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  // Estados para el Feedback Final
  const [sessionRPE, setSessionRPE] = useState<number>(7); 
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false); 

  // Estado del Timer
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  // --- VALIDACIÓN INICIAL ---
  useEffect(() => {
    if (session?.feedback) { 
        setSessionRPE(session.feedback.rpe);
        setSessionNotes(session.feedback.notes);
    }
  }, [session?.feedback]); 

  // 1. PREPARACIÓN DE LA LISTA DE PASOS
  useEffect(() => {
    if (!session || !session.warmup || !session.mainBlocks || !session.cooldown) {
        setWorkoutSteps([]);
        return;
    }

    const steps: WorkoutStep[] = [];

    // A. Calentamiento
    session.warmup.exercises.forEach(ex => {
      steps.push({ type: 'warmup', data: ex });
    });

    // B. Bloques Principales
    session.mainBlocks.forEach((block, bIdx) => {
      if (block.blockType === 'station') {
        block.exercises.forEach((ex, exIdx) => {
          const totalSets = ex.sets || 3;
          for (let s = 1; s <= totalSets; s++) {
            steps.push({ type: 'exercise', data: ex, blockIndex: bIdx, exerciseIndex: exIdx, setIndex: s, totalSets, isSuperset: false });
            if (s < totalSets) steps.push({ type: 'rest', restSeconds: block.restBetweenSetsSec });
          }
           if (exIdx < block.exercises.length - 1) steps.push({ type: 'rest', restSeconds: block.restBetweenExercisesSec });
        });
      } else {
        const maxSets = Math.max(...block.exercises.map(e => e.sets || 3));
        for (let s = 1; s <= maxSets; s++) {
          block.exercises.forEach((ex, exIdx) => {
             if ((ex.sets || 3) >= s) {
               steps.push({ type: 'exercise', data: ex, blockIndex: bIdx, exerciseIndex: exIdx, setIndex: s, totalSets: ex.sets || 3, isSuperset: true });
               if (exIdx < block.exercises.length - 1 && block.restBetweenExercisesSec > 0) {
                    steps.push({ type: 'rest', restSeconds: block.restBetweenExercisesSec });
               }
             }
          });
          if (s < maxSets) steps.push({ type: 'rest', restSeconds: block.restBetweenSetsSec });
        }
      }
    });

    // C. Cooldown
    session.cooldown.exercises.forEach(ex => {
      steps.push({ type: 'cooldown', data: ex });
    });

    setWorkoutSteps(steps);
  }, [session]);

  // --- TIMER ---
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleNext(); 
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const addTime = (sec: number) => setTimeLeft(prev => prev + sec);
  const skipTimer = () => { setTimerActive(false); handleNext(); };

  // --- NAVEGACIÓN ---
  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex >= workoutSteps.length) {
      setIsFinished(true); 
    } else {
      setCurrentStepIndex(nextIndex);
      const nextStep = workoutSteps[nextIndex];
      if (nextStep.type === 'rest' && nextStep.restSeconds) {
        setTimeLeft(nextStep.restSeconds);
        setTimerActive(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setTimerActive(false);
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
        if(confirm("¿Salir del entrenamiento sin guardar?")) navigate(-1);
    }
  };

  // --- GUARDADO DE SESIÓN ---
  const handleSaveFeedback = async () => {
    setIsSaving(true);
    try {
        const user = auth.currentUser;
        if (!user) throw new Error("Usuario no autenticado");

        const token = await user.getIdToken();
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/session/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sessionFeedback: {
                    rpe: sessionRPE,
                    notes: sessionNotes
                }
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || "Error al guardar sesión");
        }

        navigate('/'); 

    } catch (error) {
        console.error(error);
        alert("Error al guardar: " + (error as Error).message);
        setIsSaving(false);
    }
  };

  // --- RENDERIZADO PRINCIPAL ---
  
  if (!session) return <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white">Cargando datos de sesión...</div>;
    
  const currentStep = workoutSteps[currentStepIndex]; 
  
  // === VISTA FINAL: FEEDBACK O MENSAJE DE COMPLETED ===
  if (isFinished) {
      if (session.completed === true) {
          return (
              <div className="min-h-screen bg-zinc-900 flex flex-col p-6 animate-in fade-in duration-300 text-center">
                  <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                          <Check className="w-10 h-10 text-emerald-400" />
                      </div>
                      <h1 className="text-3xl font-bold text-white mb-2">¡Sesión ya Registrada!</h1>
                      <p className="text-zinc-400 mb-8 text-sm">
                          Tu feedback ya fue enviado. ¡Es hora de descansar!
                      </p>
                      {session.feedback && (
                          <div className="w-full bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 text-left">
                              <p className="text-zinc-400 text-xs uppercase font-bold mb-2">Feedback Enviado:</p>
                              <p className="text-white text-lg font-mono">RPE: {session.feedback.rpe}/10</p>
                              <p className="text-zinc-300 text-sm italic mt-1">Notas: {session.feedback.notes || 'No se registraron notas.'}</p>
                          </div>
                      )}
                  </div>
                  <div className="mt-6">
                      <button 
                          onClick={() => navigate('/')}
                          className="w-full bg-lime-500 text-zinc-900 font-bold py-4 rounded-xl hover:bg-lime-400 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                      >
                          VOLVER AL DASHBOARD
                      </button>
                  </div>
              </div>
          );
      }
      return (
          <div className="min-h-screen bg-zinc-900 flex flex-col p-6 animate-in fade-in duration-300">
              
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-lime-500/20 rounded-full flex items-center justify-center mb-6 border border-lime-500 shadow-[0_0_30px_rgba(132,204,22,0.3)]">
                      <Trophy className="w-10 h-10 text-lime-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">¡Sesión Terminada!</h1>
                  <p className="text-zinc-400 mb-8 text-sm">Tu esfuerzo de hoy construye el éxito de mañana.</p>
                  
                  <div className="w-full bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700 mb-6">
                      <label className="block text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wide">
                          ¿Qué tan difícil fue? (RPE)
                      </label>
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-zinc-500">Muy Fácil</span>
                        <span className="text-2xl font-bold text-lime-400">{sessionRPE}</span> 
                        <span className="text-xs text-zinc-500">Fallo Muscular</span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1" 
                        value={sessionRPE}
                        onChange={(e) => setSessionRPE(Number(e.target.value))}
                        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
                      />
                      <div className="mt-4 flex justify-center gap-1">
                          {[...Array(10)].map((_, i) => (
                              <div key={i} className={`h-1 w-full rounded-full ${i + 1 <= sessionRPE ? 'bg-lime-500' : 'bg-zinc-700'}`}></div>
                          ))}
                      </div>
                  </div>

                  <div className="w-full bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700">
                      <label className="flex items-center gap-2 text-sm font-bold text-zinc-300 mb-3 uppercase tracking-wide">
                          <MessageSquare className="w-4 h-4 text-zinc-400" />
                          Notas de la sesión (Opcional)
                      </label>
                      <textarea 
                          value={sessionNotes}
                          onChange={(e) => setSessionNotes(e.target.value)}
                          placeholder="¿Alguna molestia? ¿Subiste peso en algún ejercicio?"
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-lime-500 min-h-[80px]"
                      />
                  </div>
              </div>

              <div className="mt-6">
                <button 
                    onClick={handleSaveFeedback}
                    disabled={isSaving}
                    className="w-full bg-lime-500 text-zinc-900 font-bold py-4 rounded-xl hover:bg-lime-400 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            GUARDANDO...
                        </>
                    ) : (
                        "GUARDAR PROGRESO"
                    )}
                </button>
              </div>
          </div>
      );
  }

  if (!currentStep) {
      return <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-white">Preparando rutina...</div>;
  }
  
  const isRest = currentStep.type === 'rest';

  // === VISTA DE DESCANSO ===
  if (isRest) {
    return (
        <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
             <div className="absolute inset-0 bg-lime-500/5 animate-pulse z-0"></div>
             <div className="relative z-10 text-center">
                 <h2 className="text-zinc-400 text-sm uppercase tracking-widest mb-8">Recuperación</h2>
                 <div className="relative mb-10">
                     <div className="w-64 h-64 rounded-full border-8 border-zinc-800 flex items-center justify-center relative bg-zinc-900">
                         <div className="absolute inset-0 rounded-full border-8 border-lime-500 border-t-transparent animate-spin-slow" style={{ animationDuration: `${currentStep.restSeconds}s` }}></div>
                         <span className="text-6xl font-black text-white font-mono tabular-nums">
                             {formatTime(timeLeft)}
                         </span>
                     </div>
                 </div>
                 <div className="flex gap-4 justify-center">
                     <button onClick={() => addTime(30)} className="px-6 py-3 bg-zinc-800 rounded-full text-white font-bold border border-zinc-700">+30s</button>
                     <button onClick={skipTimer} className="px-6 py-3 bg-lime-500 rounded-full text-zinc-900 font-bold active:scale-95">Saltar</button>
                 </div>
             </div>
             <div className="absolute bottom-10 left-0 right-0 text-center opacity-60">
                 <p className="text-xs text-zinc-500 mb-1">Siguiente:</p>
                 <p className="text-zinc-300 font-medium">{workoutSteps[currentStepIndex + 1]?.data?.name || "Fin"}</p>
             </div>
        </div>
    );
  }

  // === VISTA DE EJERCICIO ===
  const exercise = currentStep.data!;
  const isMainExercise = currentStep.type === 'exercise';

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
        
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-zinc-900/95 backdrop-blur z-20 sticky top-0">
            <button onClick={handlePrevious} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-lime-500 uppercase tracking-wider">
                    {currentStep.type === 'warmup' ? 'Calentamiento' : currentStep.type === 'cooldown' ? 'Vuelta a la Calma' : `Bloque ${currentStep.blockIndex! + 1}`}
                </span>
                {isMainExercise && <span className="text-zinc-400 text-xs">Serie {currentStep.setIndex} de {currentStep.totalSets}</span>}
            </div>
            <div className="w-9 h-9"></div>
        </div>

        <div className="h-1 w-full bg-zinc-800">
            <div className="h-full bg-lime-500 transition-all duration-500" style={{ width: `${((currentStepIndex) / workoutSteps.length) * 100}%` }}></div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
            {/* --- ZONA VISUAL (VIDEO > IMAGEN > FALLBACK) --- */}
            {/* aspect-video mantiene el ratio 16:9 perfecto */}
            <div className="relative w-full aspect-video bg-zinc-950 mb-6 overflow-hidden shadow-inner border-b border-zinc-800">
                {exercise.url ? (
                    // CASO 1: VIDEO YOUTUBE
                    <iframe
                        src={getYoutubeEmbedUrl(exercise.url) || ''}
                        title={exercise.name}
                        // pointer-events-none asegura que el usuario no pause el video al tocar la pantalla
                        className="w-full h-full pointer-events-none" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: 0 }}
                    />
                ) : exercise.imageUrl ? (
                    // CASO 2: IMAGEN
                    <img 
                        src={exercise.imageUrl} 
                        alt={exercise.name} 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    // CASO 3: SIN NADA
                    <div className="w-full h-full flex items-center justify-center flex-col text-zinc-700 bg-zinc-900">
                        <Dumbbell className="w-16 h-16 mb-2 opacity-20" />
                        <span className="text-xs uppercase tracking-widest opacity-40 font-medium">Sin Demostración</span>
                    </div>
                )}
                {/* Overlay sutil */}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none"></div>
            </div>

            <div className="px-6">
                <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{exercise.name}</h1>
                
                {exercise.description && (
                    <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border-l-4 border-lime-500">
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            {exercise.description}
                        </p>
                    </div>
                )}

                {isMainExercise ? (
                    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 border border-zinc-700 shadow-lg mb-6">
                        <div className="grid grid-cols-2 gap-6 text-center divide-x divide-zinc-700">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Meta</p>
                                <p className="text-3xl font-black text-white">{exercise.targetReps || "Fallo"}</p>
                                <p className="text-xs text-zinc-400 mt-1">Repeticiones</p>
                            </div>
                            <div className="pl-6 flex flex-col justify-center items-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Usar</p>
                                {/* AQUÍ SE MUESTRA EL EQUIPO ESPECÍFICO QUE MANDÓ EL BACKEND */}
                                <p className="text-sm font-bold text-lime-400 leading-tight mt-1">
                                    {exercise.equipment || "Peso Corporal / Tu Equipo"}
                                </p>
                            </div>
                        </div>
                        
                        {/* NOTAS EXTRA (TEMPO, RPE) */}
                        {exercise.notes && (
                            <div className="mt-4 pt-4 border-t border-zinc-700/50">
                                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-zinc-950/30 p-3 rounded-lg">
                                    <Info className="w-4 h-4 text-lime-500 flex-shrink-0 mt-0.5" />
                                    <span>{exercise.notes}</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Vista simple para Warmup/Cool
                    <div className="mb-6 flex items-center gap-3 text-zinc-400 bg-zinc-800/30 p-3 rounded-xl border border-zinc-700/50">
                        <Clock className="w-5 h-5 text-lime-500" />
                        <span className="font-mono text-lg text-white">{exercise.durationOrReps || "A criterio"}</span>
                    </div>
                )}

                {exercise.instructions && <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{exercise.instructions}</p>}
                {exercise.notes && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-100 italic">{exercise.notes}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Footer Fijo */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-zinc-900 border-t border-zinc-800 z-30">
            <button 
                onClick={handleNext}
                className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-2xl shadow-lg shadow-lime-500/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
                <Check className="w-6 h-6" />
                {currentStepIndex === workoutSteps.length - 1 ? 'TERMINAR SESIÓN' : 'LISTO / SIGUIENTE'}
            </button>
        </div>

    </div>
  );
};

export default WorkoutPlayer;