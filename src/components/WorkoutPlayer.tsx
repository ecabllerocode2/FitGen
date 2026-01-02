// ...existing code...
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
  Loader2,
  Activity,
  Zap
} from 'lucide-react';

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;

  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=1&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=0`;
};

interface Exercise {
  id: string;
  name: string;
  instructions?: string;
  description?: string; 
  durationOrReps?: string;
  sets?: number;
  targetReps?: string;
  targetRIR?: number;  // ⭐ NUEVO V5
  loadProgression?: string;  // ⭐ NUEVO V5
  technique?: string;  // ⭐ NUEVO V5: standard, tempo_3-0-3, rest_pause
  rpe?: number;
  notes?: string;
  imageUrl?: string | null;
  url?: string;
  equipment?: string;
  suggestedLoad?: string;
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
  coreBlocks: Block[];
  cooldown: { exercises: Exercise[] };
  completed?: boolean; 
  feedback?: Feedback;  
}

interface WorkoutPlayerProps {
  session: SessionData;
}

type WorkoutStep = {
  type: 'warmup' | 'exercise' |
  'rest' | 'cooldown' | 'core';
  data?: Exercise;
  blockIndex?: number;
  exerciseIndex?: number;
  setIndex?: number;
  totalSets?: number;
  restSeconds?: number;
  isSuperset?: boolean;
};

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ session }) => {
    const [sorenessLevel, setSorenessLevel] = useState<number>(1); // 1-10, 1 por defecto
  const navigate = useNavigate();
  const auth = getAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workoutSteps, setWorkoutSteps] = useState<WorkoutStep[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionRPE, setSessionRPE] = useState<number>(7); 
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState<number>(5); // 1-10, 5 por defecto
  const [isSaving, setIsSaving] = useState(false); 

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  // \u2b50 NUEVO V5: Estado para capturar rendimiento por ejercicio
  const [exercisesPerformance, setExercisesPerformance] = useState<Record<string, Array<{
    set: number;
    reps: number;
    rir: number;
    load: string;
  }>>>({});
  
  // \u2b50 NUEVO V5: Modal para capturar datos de la serie
  const [showSetModal, setShowSetModal] = useState(false);
  const [currentSetData, setCurrentSetData] = useState<{
    exerciseId: string;
    exerciseName: string;
    setNumber: number;
    targetReps?: string;
    targetRIR?: number;
    suggestedLoad?: string;
  } | null>(null);
  const [setReps, setSetReps] = useState<string>('');
  const [setRIR, setSetRIR] = useState<string>('2');
  const [setLoad, setSetLoad] = useState<string>('');

  useEffect(() => {
    if (session?.feedback) { 
        setSessionRPE(session.feedback.rpe);
        setSessionNotes(session.feedback.notes);
    }
  }, [session?.feedback]);
  
  useEffect(() => {
    if (!session || !session.warmup || !session.mainBlocks || !session.cooldown || !session.coreBlocks) {
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
    
    // C. Bloques de CORE 
    session.coreBlocks.forEach((block, bIdx) => {
        const coreBlockOffset = session.mainBlocks.length; 
        
        if (block.blockType === 'station') {
          block.exercises.forEach((ex, exIdx) => {
            const totalSets = ex.sets || 3;
            for (let s = 1; s <= totalSets; s++) {
              steps.push({ type: 'core', data: ex, blockIndex: coreBlockOffset + bIdx, exerciseIndex: exIdx, setIndex: s, totalSets, isSuperset: false }); 
              if (s < 
                totalSets) steps.push({ type: 'rest', restSeconds: block.restBetweenSetsSec });
            }
            if (exIdx < block.exercises.length - 1) steps.push({ type: 'rest', restSeconds: block.restBetweenExercisesSec });
          });
        } else {
          const maxSets = Math.max(...block.exercises.map(e => e.sets ||
            3));
          for (let s = 1; s <= maxSets; s++) {
            block.exercises.forEach((ex, exIdx) => {
               if ((ex.sets || 3) >= s) {
                 steps.push({ type: 'core', data: ex, blockIndex: coreBlockOffset + bIdx, exerciseIndex: exIdx, setIndex: s, totalSets: 
                  ex.sets || 3, isSuperset: true });
                 if (exIdx < block.exercises.length - 1 && block.restBetweenExercisesSec > 0) {
                     steps.push({ type: 'rest', restSeconds: block.restBetweenExercisesSec });
                 }
               }
            });
            if (s < maxSets) steps.push({ type: 'rest', restSeconds: block.restBetweenSetsSec });
          }
        }
    });
    
    // D. Cooldown
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const currentStep = workoutSteps[currentStepIndex];
    
    // \u2b50 NUEVO V5: Capturar datos de rendimiento después de cada serie de ejercicio principal
    const isMainExercise = (currentStep.type === 'exercise' || currentStep.type === 'core') && currentStep.data;
    
    if (isMainExercise && currentStep.data) {
      const exercise = currentStep.data;
      // Solo capturar en ejercicios con series definidas (no calentamiento/cooldown)
      if (exercise.sets && exercise.sets > 0) {
        setCurrentSetData({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          setNumber: currentStep.setIndex || 1,
          targetReps: exercise.targetReps,
          targetRIR: exercise.targetRIR,
          suggestedLoad: exercise.suggestedLoad || exercise.equipment
        });
        setSetReps('');
        setSetRIR(exercise.targetRIR?.toString() || '2');
        setSetLoad(exercise.suggestedLoad || '');
        setShowSetModal(true);
        return; // Detener la navegación hasta que se capture el dato
      }
    }
    
    // Continuar normalmente si no hay que capturar datos
    proceedToNextStep();
  };
  
  const proceedToNextStep = () => {
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
  
  // \u2b50 NUEVO V5: Guardar datos de la serie y continuar
  const handleSaveSetData = () => {
    if (!currentSetData) return;
    
    const repsNum = parseInt(setReps);
    const rirNum = parseInt(setRIR);
    
    if (isNaN(repsNum) || repsNum < 0) {
      alert('Por favor ingresa un número válido de repeticiones');
      return;
    }
    
    if (isNaN(rirNum) || rirNum < 0 || rirNum > 10) {
      alert('RIR debe estar entre 0 y 10');
      return;
    }
    
    const newSetRecord = {
      set: currentSetData.setNumber,
      reps: repsNum,
      rir: rirNum,
      load: setLoad || 'Peso Corporal'
    };
    
    setExercisesPerformance(prev => ({
      ...prev,
      [currentSetData.exerciseId]: [
        ...(prev[currentSetData.exerciseId] || []),
        newSetRecord
      ]
    }));
    
    setShowSetModal(false);
    setCurrentSetData(null);
    proceedToNextStep();
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
        
        // \u2b50 NUEVO V5: Formatear datos de rendimiento para el backend
        const formattedPerformance = Object.entries(exercisesPerformance).map(([exerciseId, sets]) => ({
          exerciseId,
          actualSets: sets
        }));
        
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/session/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            sessionFeedback: {
              rpe: sessionRPE,
              notes: sessionNotes,
              energyLevel: energyLevel,
              sorenessLevel: sorenessLevel
            },
            exercisesPerformance: formattedPerformance  // \u2b50 NUEVO V5
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
  
  // \u2b50 NUEVO V5: Modal para capturar datos de la serie
  const SetCaptureModal = () => {
    if (!showSetModal || !currentSetData) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-zinc-800 p-6 rounded-2xl w-full max-w-md border border-lime-500/30">
          <h3 className="text-xl font-bold text-lime-400 mb-2 flex items-center gap-2">
            <Dumbbell className="w-6 h-6" />
            Serie {currentSetData.setNumber} Completada
          </h3>
          <p className="text-zinc-300 text-sm mb-1">{currentSetData.exerciseName}</p>
          {currentSetData.targetReps && (
            <p className="text-zinc-500 text-xs mb-4">
              \ud83c\udfaf Objetivo: {currentSetData.targetReps} reps | RIR {currentSetData.targetRIR || 2}
            </p>
          )}
          
          <div className="space-y-4">
            {/* Repeticiones */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                ¿Cuántas repeticiones hiciste?
              </label>
              <input
                type="number"
                value={setReps}
                onChange={(e) => setSetReps(e.target.value)}
                placeholder="Ej: 12"
                min="0"
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white text-lg font-bold focus:ring-lime-500 focus:border-lime-500"
                autoFocus
              />
            </div>
            
            {/* RIR */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                RIR - ¿Cuántas más podías hacer?
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(rir => (
                  <button
                    key={rir}
                    type="button"
                    onClick={() => setSetRIR(rir.toString())}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      setRIR === rir.toString()
                        ? 'bg-lime-500 text-zinc-900'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {rir}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                0 = Fallo muscular | 5 = Muy fácil
              </p>
            </div>
            
            {/* Carga */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                ¿Qué carga usaste? (opcional)
              </label>
              <input
                type="text"
                value={setLoad}
                onChange={(e) => setSetLoad(e.target.value)}
                placeholder={currentSetData.suggestedLoad || "Ej: 20kg, Banda Roja, Peso Corporal"}
                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-lime-500 focus:border-lime-500"
              />
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setShowSetModal(false);
                setCurrentSetData(null);
              }}
              className="flex-1 bg-zinc-700 text-white py-3 rounded-xl font-bold hover:bg-zinc-600"
            >
              Saltar
            </button>
            <button
              onClick={handleSaveSetData}
              disabled={!setReps}
              className="flex-1 bg-lime-500 text-zinc-900 py-3 rounded-xl font-bold hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar y Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }; 
  
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
                              <p className="text-zinc-300 text-sm italic mt-1">Notas: {session.feedback.notes ||
                                'No se registraron notas.'}</p>
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
                      <div className="mt-4 flex justify-center gap-1 mb-6">
                          {[...Array(10)].map((_, i) => (
                              <div key={i} className={`h-1 w-full rounded-full ${i + 1 <= sessionRPE 
                                ? 'bg-lime-500' : 'bg-zinc-700'}`}></div>
                          ))}
                      </div>
                      <label className="block text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wide mt-6">
                          ¿Cómo estuvo tu energía?
                      </label>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-zinc-500">Bajísima</span>
                        <span className="text-2xl font-bold text-cyan-400">{energyLevel}</span> 
                        <span className="text-xs text-zinc-500">Altísima</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1" 
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(Number(e.target.value))}
                        className="w-full h-2 bg-cyan-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <div className="mt-4 flex justify-center gap-1 mb-6">
                          {[...Array(10)].map((_, i) => (
                              <div key={i} className={`h-1 w-full rounded-full ${i + 1 <= energyLevel 
                                ? 'bg-cyan-400' : 'bg-zinc-700'}`}></div>
                          ))}
                      </div>
                      <label className="block text-sm font-bold text-zinc-300 mb-4 uppercase tracking-wide mt-6">
                          ¿Cómo estuvo tu dolor muscular?
                      </label>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-zinc-500">Sin dolor</span>
                        <span className="text-2xl font-bold text-pink-400">{sorenessLevel}</span> 
                        <span className="text-xs text-zinc-500">Dolor máximo</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1" 
                        value={sorenessLevel}
                        onChange={(e) => setSorenessLevel(Number(e.target.value))}
                        className="w-full h-2 bg-pink-700 rounded-lg appearance-none cursor-pointer accent-pink-400"
                      />
                      <div className="mt-4 flex justify-center gap-1">
                          {[...Array(10)].map((_, i) => (
                              <div key={i} className={`h-1 w-full rounded-full ${i + 1 <= sorenessLevel 
                                ? 'bg-pink-400' : 'bg-zinc-700'}`}></div>
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
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-lime-500 min-h-20"
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
                         <div className="absolute inset-0 rounded-full border-8 border-lime-500 border-t-transparent animate-spin-slow" style={{ animationDuration: '4s' }}></div>
              
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
                 <p className="text-zinc-300 font-medium">{workoutSteps[currentStepIndex + 1]?.data?.name ||
                  "Fin"}</p>
             </div>
        </div>
    );
  }

  // === VISTA DE EJERCICIO ===
  const exercise = currentStep.data!;
  const isMainExercise = currentStep.type === 'exercise' || currentStep.type === 'core';
  
  const getBlockTitle = (type: WorkoutStep['type'], blockIndex: number | undefined) => {
      switch(type) {
          case 'warmup': return 'Calentamiento';
          case 'cooldown': return 'Vuelta a la Calma';
          case 'exercise': return `Bloque Principal ${blockIndex! + 1}`;
          case 'core': return `Bloque Core`;
          default: return 'Rutina';
      }
  };
  
  const mediaUrl = exercise.url || exercise.imageUrl;
  const finalEmbedUrl = mediaUrl ? getYoutubeEmbedUrl(mediaUrl) : null;

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
        
        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between bg-zinc-900/95 backdrop-blur z-20 sticky top-0">
            <button onClick={handlePrevious} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-lime-500 uppercase tracking-wider">
                    {getBlockTitle(currentStep.type, currentStep.blockIndex)}
                </span>
                {isMainExercise && <span className="text-zinc-400 text-xs">Serie {currentStep.setIndex} de {currentStep.totalSets}</span>}
            </div>
            <div className="w-9 h-9"></div>
        </div>

        <div className="h-1 w-full bg-zinc-800">
            <div className="h-full bg-lime-500 transition-all duration-500" style={{ width: `${((currentStepIndex) / workoutSteps.length) * 100}%` }}></div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32">
            {/* --- ZONA VISUAL CORREGIDA --- */}
            <div className="relative w-full aspect-video 
              bg-zinc-950 mb-6 overflow-hidden shadow-inner border-b border-zinc-800">
                {finalEmbedUrl ?
                (
                    <iframe
                        src={finalEmbedUrl}
                        title={exercise.name}
                        className="w-full h-full" 
                        // Permisos actualizados para asegurar la reproducción automática
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: 0 }}
                        frameBorder="0"
                    />
                ) 
                : exercise.imageUrl ?
                (
                    <img 
                        src={exercise.imageUrl} 
                        alt={exercise.name} 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col text-zinc-700 bg-zinc-900">
                        <Dumbbell className="w-16 h-16 mb-2 opacity-20" />
                        <span className="text-xs uppercase tracking-widest opacity-40 font-medium">Sin Demostración</span>
                    </div>
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none"></div>
            </div>

            <div className="px-6">
                <h1 className="text-2xl font-bold text-white 
                  mb-2 leading-tight">{exercise.name}</h1>
            
                {exercise.description && (
                    <div className="mb-6 p-4 bg-zinc-800/50 rounded-xl border-l-4 border-lime-500">
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            {exercise.description}
                        </p>
                    </div>
                )}

                {isMainExercise ?
                (
                    <div className="bg-linear-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 border border-zinc-700 shadow-lg mb-6">
                        <div className="grid grid-cols-2 gap-6 text-center divide-x divide-zinc-700">
                            <div>
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Meta</p>
                                <p className="text-3xl font-black text-white">{exercise.targetReps || "Fallo"}</p>
                                <p className="text-xs text-zinc-400 mt-1">Repeticiones</p>
                                {exercise.targetRIR !== undefined && (
                                  <div className="mt-2 inline-flex items-center gap-1 bg-lime-500/10 px-2 py-1 rounded text-xs text-lime-400 border border-lime-500/30">
                                    <Activity className="w-3 h-3" />
                                    <span className="font-bold">RIR {exercise.targetRIR}</span>
                                  </div>
                                )}
                            </div>
                            <div className="pl-6 flex flex-col justify-center items-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Carga Sugerida</p>
                                <p className="text-sm font-bold text-lime-400 leading-tight mt-1">
                                    {exercise.suggestedLoad || exercise.equipment ||
                                      "Peso Corporal / Tu Equipo"}
                                </p>
                                {exercise.technique && exercise.technique !== 'standard' && (
                                  <div className="mt-2 inline-flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded text-xs text-purple-400 border border-purple-500/30">
                                    <Zap className="w-3 h-3" />
                                    <span className="font-bold">
                                      {exercise.technique === 'tempo_3-0-3' ? 'Tempo 3-0-3' : exercise.technique === 'rest_pause' ? 'Rest-Pause' : exercise.technique}
                                    </span>
                                  </div>
                                )}
                            </div>
                        </div>
                        {exercise.notes && (
                            <div className="mt-4 pt-4 border-t border-zinc-700/50">
                                <div className="flex items-start gap-2 text-xs text-zinc-300 bg-zinc-950/30 p-3 rounded-lg">
                                  <Info className="w-4 h-4 text-lime-500 shrink-0 mt-0.5" />
                                    <span>{exercise.notes}</span>
                                </div>
                            </div>
                        )}
                      </div>
                ) : (
                    <div className="mb-6 flex items-center gap-3 text-zinc-400 bg-zinc-800/30 p-3 rounded-xl border border-zinc-700/50">
                      <Clock className="w-5 h-5 text-lime-500" />
                        <span className="font-mono text-lg text-white">{exercise.durationOrReps ||
                          "A criterio"}</span>
                    </div>
                )}

                {exercise.instructions && <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{exercise.instructions}</p>}
                
            </div>
        </div>

        {/* Footer Fijo */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-zinc-900 border-t border-zinc-800 z-30">
            <button 
                onClick={handleNext}
                className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-2xl shadow-lg shadow-lime-500/20 
                  flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
                <Check className="w-6 h-6" />
                {currentStepIndex === workoutSteps.length - 1 ?
                  'TERMINAR SESIÓN' : 'LISTO / SIGUIENTE'}
            </button>
        </div>

        {/* \u2b50 NUEVO V5: Modal de captura de datos */}
        <SetCaptureModal />

    </div>
  );
};

export default WorkoutPlayer;