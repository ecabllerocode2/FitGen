import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { API_BASE_URL } from '../../config/api';
import { 
  Play, 
  Pause, 
  SkipForward, 
  X, 
  Volume2, 
  VolumeX,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Clock,
  Target,
  AlertCircle,
  Check,
  Flame,
  Wind,
  Layers3,
  RotateCcw,
  Info,
  BookOpen,
  Sparkles
} from 'lucide-react';
import type { GeneratedSession } from '../../types/session';

// ==================== AUDIO UTILITIES ====================

let audioContext: AudioContext | null = null;
let alarmInterval: ReturnType<typeof setInterval> | null = null;
let activeOscillators: OscillatorNode[] = [];
let activeGainNodes: GainNode[] = [];

// ==================== DATA TYPES ====================

interface SetLog {
  weight: number | null;
  reps: number;
  rir?: number; // Only for last set
}

interface ExerciseLogs {
  [exerciseId: string]: SetLog[];
}

interface SessionFeedback {
  rpe: number;
  energyLevel: number;
  sorenessLevel: number;
  notes: string;
}

// ==================== AUDIO UTILITIES ====================

const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const playTickSound = () => {
  try {
    const ctx = initAudioContext();
    if (!ctx) return;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  } catch (error) {
    console.warn('Error playing tick sound:', error);
  }
};

const playAlarmSound = () => {
  try {
    // CRÍTICO: Limpiar cualquier alarma existente antes de crear una nueva
    stopAlarmSound();
    
    const ctx = initAudioContext();
    if (!ctx) return;
    
    const playBeep = (frequency: number, duration: number, delay: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.01);
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime + delay + duration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + delay + duration);
      
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + duration);
      
      // Guardar referencias para poder detenerlos después
      activeOscillators.push(oscillator);
      activeGainNodes.push(gainNode);
      
      // Limpiar referencias cuando terminen naturalmente
      oscillator.onended = () => {
        const oscIdx = activeOscillators.indexOf(oscillator);
        const gainIdx = activeGainNodes.indexOf(gainNode);
        if (oscIdx > -1) activeOscillators.splice(oscIdx, 1);
        if (gainIdx > -1) activeGainNodes.splice(gainIdx, 1);
      };
    };
    
    const playAlarmSequence = () => {
      playBeep(1200, 0.15, 0);
      playBeep(1500, 0.15, 0.2);
      playBeep(1200, 0.15, 0.4);
    };
    
    playAlarmSequence();
    alarmInterval = setInterval(playAlarmSequence, 1000);
  } catch (error) {
    console.warn('Error playing alarm sound:', error);
  }
};

const stopAlarmSound = () => {
  // Detener el interval
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  
  // Detener todos los oscillators activos inmediatamente
  activeOscillators.forEach(osc => {
    try {
      osc.stop();
      osc.disconnect();
    } catch (e) {
      // El oscillator ya terminó, ignorar
    }
  });
  
  // Silenciar todos los gainNodes activos
  activeGainNodes.forEach(gain => {
    try {
      gain.gain.setValueAtTime(0, audioContext?.currentTime || 0);
      gain.disconnect();
    } catch (e) {
      // Ya desconectado, ignorar
    }
  });
  
  // Limpiar arrays
  activeOscillators = [];
  activeGainNodes = [];
};

// ==================== TIPOS ====================

type WorkoutPhase = 'warmup' | 'main' | 'core' | 'cooldown' | 'rest' | 'complete';

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
  equipo?: string[] | string;
  imageUrl?: string;
  imageUrl2?: string;
  imagenUrl?: string;
  url_img_0?: string;
  url_img_1?: string;
  duracion?: string;
  instrucciones?: string;
  tiempo?: string;
  prescripcion?: {
    series?: number;
    reps?: number | string;
    repsOTiempo?: string;
    descanso?: number;
    rirObjetivo?: number;
    rpeObjetivo?: number;
    tempo?: string;
    tipo?: string;
  };
  notas?: string;
  parteCuerpo?: string;
  fase?: string;
}

interface PhaseExplanation {
  fase: string;
  icono: string;
  explicacion: string;
  ciencia?: string;
}

interface CurrentExercise {
  type: 'warmup' | 'main' | 'core' | 'cooldown';
  exercise: FlexibleExercise;
  setNumber?: number;
  totalSets?: number;
  stationIndex?: number;
  exerciseIndex?: number;
}

interface NextExerciseInfo {
  name: string;
  imageUrl?: string;
  equipment?: string[];
}

// ==================== HELPERS ====================

const isBodyweightExercise = (ex: FlexibleExercise): boolean => {
  if (ex.prescripcion?.tipo && ex.prescripcion.tipo.toLowerCase().includes('bodyweight')) return true;
  if (ex.equipo) {
     if (Array.isArray(ex.equipo)) {
        if (ex.equipo.some(e => e.toLowerCase().includes('bodyweight') || e.toLowerCase().includes('corporal'))) return true;
        if (ex.equipo.length === 0 || (ex.equipo.length === 1 && ex.equipo[0] === 'Check')) return false; // 'Check' sometimes used for none? Assuming no.
     } else if (typeof ex.equipo === 'string') {
        if (ex.equipo.toLowerCase().includes('bodyweight') || ex.equipo.toLowerCase().includes('corporal') || ex.equipo.toLowerCase() === 'none') return true;
     }
  }
  if (ex.peso && typeof ex.peso === 'string' && (ex.peso.toLowerCase().includes('corporal') || ex.peso.toLowerCase().includes('bodyweight'))) return true;
  return false;
};

const getExerciseName = (ex: FlexibleExercise): string => {
  return ex.nombre || ex.name || 'Ejercicio';
};

const getExerciseImage = (ex: FlexibleExercise): string | undefined => {
  return ex.imageUrl || ex.imagenUrl || ex.url_img_0;
};

const getExerciseImage2 = (ex: FlexibleExercise): string | undefined => {
  return ex.imageUrl2 || ex.url_img_1;
};

const getExerciseSets = (ex: FlexibleExercise): number => {
  return ex.sets || ex.prescripcion?.series || 1;
};

const getExerciseReps = (ex: FlexibleExercise): string | number => {
  return ex.reps || ex.prescripcion?.reps || ex.prescripcion?.repsOTiempo || '-';
};

const getExerciseRest = (ex: FlexibleExercise): number => {
  const rest = ex.descanso || ex.prescripcion?.descanso;
  return typeof rest === 'string' ? parseInt(rest) || 60 : rest || 60;
};

const getExerciseCorrections = (ex: FlexibleExercise): string[] => {
  if (ex.correcciones && Array.isArray(ex.correcciones)) {
    return ex.correcciones;
  }
  if (ex.notasTecnicas && typeof ex.notasTecnicas === 'string') {
    return ex.notasTecnicas.split(' | ');
  }
  return [];
};

const getExerciseDescription = (ex: FlexibleExercise): string | undefined => {
  return ex.descripcion || ex.instrucciones;
};

// Detectar si el ejercicio tiene duración en tiempo (no reps)
const getExerciseDurationInSeconds = (ex: FlexibleExercise): number | null => {
  const duracion = ex.duracion || ex.tiempo || ex.prescripcion?.repsOTiempo;
  if (!duracion || typeof duracion !== 'string') return null;
  
  // Patrones: "3-5 min", "40s", "30 segundos", "2 minutos", etc.
  const minMatch = duracion.match(/(\d+)(?:-\d+)?\s*min/i);
  if (minMatch) {
    return parseInt(minMatch[1]) * 60;
  }
  
  const secMatch = duracion.match(/(\d+)\s*s(?:eg|egundos)?/i);
  if (secMatch) {
    return parseInt(secMatch[1]);
  }
  
  return null;
};

// ==================== CIRCULAR TIMER ====================

interface CircularTimerProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: 'small' | 'large';
  isPaused?: boolean;
}

const CircularTimer: React.FC<CircularTimerProps> = ({ 
  totalSeconds, 
  remainingSeconds, 
  size = 'large',
  isPaused = false
}) => {
  const radius = size === 'large' ? 90 : 24;
  const strokeWidth = size === 'large' ? 8 : 3;
  const circumference = 2 * Math.PI * radius;
  const progress = (remainingSeconds / totalSeconds) * circumference;
  
  const getColor = () => {
    if (remainingSeconds <= 3) return '#ef4444';
    if (remainingSeconds <= 10) return '#f97316';
    return '#84cc16';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}`;
  };

  const svgSize = (radius + strokeWidth) * 2;

  return (
    <div className={`relative flex items-center justify-center ${size === 'large' ? 'w-52 h-52' : 'w-16 h-16'}`}>
      <svg width={svgSize} height={svgSize} className="transform -rotate-90">
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="transparent"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-linear"
          style={{ filter: `drop-shadow(0 0 ${size === 'large' ? '10px' : '4px'} ${getColor()})` }}
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className={`font-bold tabular-nums ${size === 'large' ? 'text-5xl' : 'text-sm'}`}
          style={{ color: getColor() }}
        >
          {formatTime(remainingSeconds)}
        </span>
        {size === 'large' && (
          <span className="text-xs text-zinc-400 mt-1">
            {isPaused ? 'PAUSADO' : 'segundos'}
          </span>
        )}
      </div>
    </div>
  );
};

// ==================== ANIMATED EXERCISE IMAGE ====================

interface AnimatedExerciseImageProps {
  imageUrl1?: string;
  imageUrl2?: string;
  exerciseName: string;
}

const AnimatedExerciseImage: React.FC<AnimatedExerciseImageProps> = ({
  imageUrl1,
  imageUrl2,
  exerciseName
}) => {
  const [showFirst, setShowFirst] = useState(true);
  
  useEffect(() => {
    // Si no hay segunda imagen, no animar
    if (!imageUrl1 || !imageUrl2) return;
    
    const interval = setInterval(() => {
      setShowFirst(prev => !prev);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [imageUrl1, imageUrl2]);

  const currentImage = showFirst ? imageUrl1 : (imageUrl2 || imageUrl1);
  const hasAnimation = imageUrl1 && imageUrl2;

  return (
    <div className="relative w-full aspect-video bg-zinc-800 rounded-2xl overflow-hidden">
      {currentImage ? (
        <>
          <img 
            src={currentImage} 
            alt={exerciseName}
            className="w-full h-full object-contain transition-opacity duration-500"
          />
          {hasAnimation && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors ${showFirst ? 'bg-lime-500' : 'bg-zinc-500'}`} />
              <div className={`w-2 h-2 rounded-full transition-colors ${!showFirst ? 'bg-lime-500' : 'bg-zinc-500'}`} />
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Dumbbell className="w-16 h-16 text-zinc-600" />
        </div>
      )}
    </div>
  );
};

// ==================== INFO TOOLTIP ====================

interface InfoTooltipProps {
  title: string;
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ title, content, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div 
        className="relative bg-zinc-800 border border-zinc-700 rounded-2xl p-5 max-w-sm w-full animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-lime-500/20 rounded-full flex items-center justify-center">
            <Info className="w-4 h-4 text-lime-400" />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{content}</p>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 rounded-xl transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

// ==================== SESSION FEEDBACK FORM ====================

interface SessionFeedbackFormProps {
  onSubmit: (feedback: SessionFeedback) => void;
  isSubmitting: boolean;
}

const SessionFeedbackForm: React.FC<SessionFeedbackFormProps> = ({ onSubmit, isSubmitting }) => {
  const [rpe, setRpe] = useState(5);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rpe,
      energyLevel: energy,
      sorenessLevel: soreness,
      notes
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-white mb-6">Resumen de la Sesión</h2>
      
      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            RPE de la Sesión (1-10)
          </label>
          <div className="flex items-center gap-4">
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={rpe}
              onChange={(e) => setRpe(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-lime-500"
            />
            <span className="text-xl font-bold text-lime-500 w-8 text-center">{rpe}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {rpe < 4 ? 'Muy suave' : rpe < 7 ? 'Moderado' : rpe < 9 ? 'Intenso' : 'Máximo esfuerzo'}
          </p>
        </div>

        <div>
           <label className="block text-sm font-medium text-zinc-400 mb-2">
            Nivel de Energía (1-5)
          </label>
          <div className="flex justify-between px-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setEnergy(v)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  energy === v ? 'bg-blue-500 text-white scale-110' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
           <label className="block text-sm font-medium text-zinc-400 mb-2">
            Nivel de Dolor Muscular (1-5)
          </label>
          <div className="flex justify-between px-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSoreness(v)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  soreness === v ? 'bg-red-500 text-white scale-110' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Notas adicionales
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none h-24"
            placeholder="¿Algo que destacar?"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-lime-500 text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
             <span>Guardando...</span>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Finalizar Sesión
            </>
          )}
        </button>
      </form>
    </div>
  );
};

// ==================== PHASE INTRO SCREEN ====================

interface PhaseIntroScreenProps {
  phase: 'warmup' | 'main' | 'core' | 'cooldown';
  explanation?: PhaseExplanation;
  onContinue: () => void;
}

const PhaseIntroScreen: React.FC<PhaseIntroScreenProps> = ({ phase, explanation, onContinue }) => {
  const getPhaseInfo = () => {
    switch (phase) {
      case 'warmup':
        return {
          title: 'Calentamiento RAMP',
          icon: '🔥',
          color: 'from-orange-500/20 to-orange-600/10',
          borderColor: 'border-orange-500/30',
          textColor: 'text-orange-400'
        };
      case 'main':
        return {
          title: 'Bloque Principal',
          icon: '💪',
          color: 'from-lime-500/20 to-lime-600/10',
          borderColor: 'border-lime-500/30',
          textColor: 'text-lime-400'
        };
      case 'core':
        return {
          title: 'Entrenamiento de Core',
          icon: '🧱',
          color: 'from-yellow-500/20 to-yellow-600/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400'
        };
      case 'cooldown':
        return {
          title: 'Enfriamiento',
          icon: '🧘',
          color: 'from-cyan-500/20 to-cyan-600/10',
          borderColor: 'border-cyan-500/30',
          textColor: 'text-cyan-400'
        };
    }
  };

  const info = getPhaseInfo();
  const icon = explanation?.icono || info.icon;

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6">
      <div className={`w-full max-w-md bg-linear-to-b ${info.color} border ${info.borderColor} rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}>
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-zinc-800/80 rounded-full flex items-center justify-center text-4xl animate-bounce">
            {icon}
          </div>
        </div>

        {/* Title */}
        <h1 className={`text-2xl font-bold text-center mb-4 ${info.textColor}`}>
          {explanation?.fase || info.title}
        </h1>

        {/* Explanation */}
        {explanation?.explicacion && (
          <p className="text-zinc-300 text-sm leading-relaxed text-center mb-4">
            {explanation.explicacion}
          </p>
        )}

        {/* Science fact */}
        {explanation?.ciencia && (
          <div className="bg-zinc-800/50 rounded-xl p-3 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Dato científico</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {explanation.ciencia}
            </p>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Play className="w-5 h-5" />
          ¡COMENZAR!
        </button>
      </div>
    </div>
  );
};

// ==================== REST SCREEN ====================

interface RestScreenProps {
  restSeconds: number;
  remainingSeconds: number;
  nextExercise?: NextExerciseInfo;
  isPaused: boolean;
  onSkip: () => void;
  onPauseToggle: () => void;
  alarmActive: boolean;
  onDismissAlarm: () => void;
  pendingLogContext: {
    isBodyweight: boolean;
    isLastSet: boolean;
    isTimed?: boolean;
    exerciseName: string;
    defaultReps: number;
    weightPlaceholder?: string;
  } | null;
  onLogSubmit: (data: SetLog) => void;
}

const RestScreen: React.FC<RestScreenProps> = ({
  restSeconds,
  remainingSeconds,
  nextExercise,
  isPaused,
  onSkip,
  onPauseToggle,
  alarmActive,
  onDismissAlarm,
  pendingLogContext,
  onLogSubmit
}) => {
  const [weight, setWeight] = useState<string>('');
  const [reps, setReps] = useState<string>(pendingLogContext?.defaultReps?.toString() || '');
  const [rir, setRir] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // If there is no pending context, consider submitted (for non-main exercises)
  useEffect(() => {
    if (!pendingLogContext) setHasSubmitted(true);
    else setHasSubmitted(false);
  }, [pendingLogContext]);

  const validateAndSubmit = () => {
     if (!pendingLogContext) return true;
     
     if (!reps && reps !== '0') {
         alert('Por favor indica las repeticiones.');
         return false;
     }

     // Para ejercicios temporizados validamos que el valor sea un entero en segundos
     if (pendingLogContext.isTimed && !/^\d+$/.test(reps)) {
        alert('Por favor indica la duración en segundos (solo números).');
        return false;
     }

     const repsNum = parseInt(reps);
     
     let weightNum: number | null = null;
     if (!pendingLogContext.isBodyweight) {
        if (!weight && weight !== '0') {
            alert('Por favor indica el peso usado.');
            return false;
        }
        weightNum = parseFloat(weight);
     }

     let rirNum: number | undefined = undefined;
     if (pendingLogContext.isLastSet) {
        if (!rir && rir !== '0') {
            alert('Por favor indica el RIR de la última serie.');
            return false;
        }
        rirNum = parseInt(rir);
     }

     onLogSubmit({
       reps: repsNum,
       weight: weightNum,
       rir: rirNum
     });
     setHasSubmitted(true);
     return true;
  };

  const handleSkip = () => {
    if (!hasSubmitted && pendingLogContext) {
       if (confirm('¿Deseas guardar los datos antes de continuar?')) {
          if (validateAndSubmit()) {
             onSkip();
          }
       } else {
         // User ignored logging?
         // Requirement says "debe salir un formulario que recupere los datos". Implies mandatory.
         // But allow skip if really wanted? I will enforce it for now or rely on validateAndSubmit.
         if (validateAndSubmit()) onSkip(); // Try to submit whatever is there? No.
       }
    } else {
       onSkip();
    }
  };

  const handleDismiss = () => {
     if (!hasSubmitted && pendingLogContext) {
        if (validateAndSubmit()) {
           onDismissAlarm();
        }
     } else {
        onDismissAlarm();
     }
  };

  const renderLogForm = () => {
     if (hasSubmitted || !pendingLogContext) return null;

     return (
        <div className="w-full max-w-xs bg-zinc-800/90 border border-zinc-700 rounded-xl p-4 my-2 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="text-sm font-bold text-lime-400 mb-3 text-center uppercase tracking-wider">
               Registro de Serie
            </h4>
            
            <div className="flex gap-3 mb-3">
               {!pendingLogContext.isBodyweight && (
                 <div className="flex-1">
                   <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">Peso</label>
                   <input 
                     type="number" 
                     value={weight}
                     onChange={e => setWeight(e.target.value)}
                     className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center text-white font-mono focus:border-lime-500 outline-none"
                     placeholder={pendingLogContext.weightPlaceholder || "kg"}
                   />
                 </div>
               )}
               <div className="flex-1">
                   <label className="text-[10px] text-zinc-400 uppercase font-bold mb-1 block">{pendingLogContext?.isTimed ? 'Duración (segundos)' : 'Reps'}</label>
                   <input 
                     type="number" 
                     value={reps}
                     onChange={e => setReps(e.target.value)}
                     className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-center text-white font-mono focus:border-lime-500 outline-none"
                     placeholder={pendingLogContext?.isTimed ? 'segundos' : '0'}
                   />
                   {pendingLogContext?.isTimed && (
                     <p className="text-[10px] text-zinc-500 mt-1">Introduce la duración en segundos (ej. 40). El servidor extrae el número automáticamente.</p>
                   )}
               </div>
            </div>

            {pendingLogContext.isLastSet && (
               <div className="mb-3">
                   <div className="flex items-center justify-between mb-2">
                     <label className="text-[10px] text-zinc-400 uppercase font-bold">RIR (Reservas)</label>
                     <span className="text-[10px] text-zinc-500 italic">¿Cuántas más podías?</span>
                   </div>
                   
                   {/* Botones de RIR visuales */}
                   <div className="grid grid-cols-6 gap-1.5 mb-2">
                     {[0, 1, 2, 3, 4, 5].map(value => (
                       <button
                         key={value}
                         type="button"
                         onClick={() => setRir(value.toString())}
                         className={`py-2 rounded-lg text-xs font-bold transition-all ${
                           rir === value.toString()
                             ? 'bg-lime-500 text-zinc-900 scale-105'
                             : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                         }`}
                       >
                         {value}
                       </button>
                     ))}
                   </div>
                   
                   {/* Tooltips educativos según RIR seleccionado */}
                   <div className="text-[10px] text-zinc-400 leading-relaxed">
                     {rir === '0' && '💥 Fallo muscular - No podías hacer ni 1 rep más'}
                     {rir === '1' && '😤 Muy cerca del fallo - 1 rep más máximo'}
                     {rir === '2' && '✅ Óptimo para hipertrofia - 2 reps en reserva'}
                     {rir === '3' && '😊 Controlado - 3 reps más fácilmente'}
                     {rir === '4' && '😌 Moderado - 4 reps en el tanque'}
                     {rir === '5' && '🟢 Ligero - 5+ reps más posibles'}
                     {!rir && '👆 Selecciona cuántas repeticiones más podrías haber hecho'}
                   </div>
                   
                   {/* RPE auto-calculado */}
                   {rir && (
                     <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30 flex items-center justify-between">
                       <span className="text-[10px] text-blue-400">RPE estimado:</span>
                       <span className="text-sm font-bold text-blue-300">{10 - parseInt(rir)}</span>
                     </div>
                   )}
               </div>
            )}

            <button 
               onClick={() => validateAndSubmit()}
               className="w-full bg-lime-500/20 hover:bg-lime-500/30 text-lime-400 border border-lime-500/50 rounded-lg py-2 text-xs font-bold uppercase transition-colors"
            >
               Guardar Datos
            </button>
        </div>
     );
  };

  return (
    <div className="flex flex-col items-center justify-between h-full py-6 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-1">Descanso</h2>
        <p className="text-zinc-400 text-sm">Recupera el aliento</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <CircularTimer 
          totalSeconds={restSeconds}
          remainingSeconds={remainingSeconds}
          size="large"
          isPaused={isPaused}
        />
        {renderLogForm()}
      </div>

      {alarmActive && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-pulse">
          <div className="text-center">
            <div className="w-24 h-24 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Check className="w-12 h-12 text-zinc-900" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">¡Tiempo!</h3>
            <button
              onClick={() => {
                stopAlarmSound();
                handleDismiss();
              }}
              className="bg-lime-500 text-zinc-900 font-bold px-8 py-4 rounded-2xl text-lg active:scale-95 transition-transform"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      )}

      {nextExercise && !alarmActive && (
        <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Siguiente</p>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-zinc-700 rounded-lg overflow-hidden shrink-0">
              {nextExercise.imageUrl ? (
                <img 
                  src={nextExercise.imageUrl} 
                  alt={nextExercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-zinc-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">{nextExercise.name}</h4>
              {nextExercise.equipment && nextExercise.equipment.length > 0 && (
                <p className="text-xs text-zinc-400 truncate">
                  {nextExercise.equipment.slice(0, 2).join(', ')}
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-500" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={onPauseToggle}
          className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center active:scale-95 transition-transform"
        >
          {isPaused ? <Play className="w-6 h-6 text-white" /> : <Pause className="w-6 h-6 text-white" />}
        </button>
        <button
          onClick={handleSkip}
          className="bg-lime-500 text-zinc-900 font-bold px-6 py-3 rounded-xl flex items-center gap-2 active:scale-95 transition-transform"
        >
          <SkipForward className="w-5 h-5" />
          Saltar
        </button>
      </div>
    </div>
  );
};

// ==================== EXERCISE SCREEN ====================

interface ExerciseScreenProps {
  exercise: FlexibleExercise;
  type: 'warmup' | 'main' | 'core' | 'cooldown';
  setNumber?: number;
  totalSets?: number;
  isPaused: boolean;
  remainingSeconds: number;
  totalDurationSeconds: number;
  isTimedExercise: boolean;
  onComplete: () => void;
  onPauseToggle: () => void;
  onExit: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  alarmActive: boolean;
  onDismissAlarm: () => void;
}

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({
  exercise,
  type,
  setNumber,
  totalSets,
  isPaused,
  remainingSeconds,
  totalDurationSeconds,
  isTimedExercise,
  onComplete,
  onPauseToggle,
  onExit,
  soundEnabled,
  onToggleSound,
  alarmActive,
  onDismissAlarm
}) => {
  const [showDescription, setShowDescription] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<'tempo' | 'rir' | 'peso' | null>(null);
  
  const name = getExerciseName(exercise);
  const corrections = getExerciseCorrections(exercise);
  const description = getExerciseDescription(exercise);
  const reps = getExerciseReps(exercise);
  const weight = exercise.peso;
  const tempo = exercise.tempo || exercise.prescripcion?.tempo;
  const rir = exercise.rirTarget ?? exercise.prescripcion?.rirObjetivo;
  const duracion = exercise.duracion || exercise.tiempo;

  const getTypeColor = () => {
    switch (type) {
      case 'warmup': return 'text-orange-400';
      case 'main': return 'text-lime-400';
      case 'core': return 'text-yellow-400';
      case 'cooldown': return 'text-cyan-400';
      default: return 'text-white';
    }
  };

  const getTypeIcon = () => {
    switch (type) {
      case 'warmup': return <Flame className="w-4 h-4" />;
      case 'main': return <Dumbbell className="w-4 h-4" />;
      case 'core': return <Layers3 className="w-4 h-4" />;
      case 'cooldown': return <Wind className="w-4 h-4" />;
      default: return <Dumbbell className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'warmup': return 'Calentamiento';
      case 'main': return 'Principal';
      case 'core': return 'Core';
      case 'cooldown': return 'Enfriamiento';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-800/50 shrink-0">
        <button onClick={onExit} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
        
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-medium ${getTypeColor()}`}>
            {getTypeIcon()}
            {getTypeLabel()}
          </span>
          {setNumber && totalSets && (
            <span className="text-xs bg-lime-500/20 text-lime-400 px-2 py-1 rounded-full font-bold">
              Serie {setNumber}/{totalSets}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Timer pequeño solo para ejercicios de tiempo */}
          {isTimedExercise && totalDurationSeconds > 0 && (
            <CircularTimer
              totalSeconds={totalDurationSeconds}
              remainingSeconds={remainingSeconds}
              size="small"
              isPaused={isPaused}
            />
          )}
          <button onClick={onToggleSound} className="p-2 rounded-full hover:bg-zinc-700 transition-colors">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 py-3 overflow-y-auto">
        {/* Image - más compacta */}
        <div className="w-full shrink-0">
          <AnimatedExerciseImage 
            imageUrl1={getExerciseImage(exercise)}
            imageUrl2={getExerciseImage2(exercise)}
            exerciseName={name}
          />
        </div>

        {/* Exercise info */}
        <div className="mt-4 flex-1 flex flex-col min-h-0">
          {/* Name - con más espacio */}
          <h1 className="text-xl font-bold text-white leading-tight mb-3">{name}</h1>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Duración o Reps */}
            {duracion ? (
              <div className="flex items-center gap-1.5 bg-lime-500/10 border border-lime-500/30 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-lime-400" />
                <span className="text-sm font-bold text-lime-400">{duracion}</span>
              </div>
            ) : reps && reps !== '-' && (
              <div className="flex items-center gap-1.5 bg-lime-500/10 border border-lime-500/30 px-3 py-1.5 rounded-lg">
                <Target className="w-4 h-4 text-lime-400" />
                <span className="text-sm font-bold text-lime-400">{reps}</span>
                <span className="text-xs text-lime-400/70">reps</span>
              </div>
            )}
            
            {weight && (
              <button
                onClick={() => setActiveTooltip('peso')}
                className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
              >
                <Dumbbell className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-blue-400">{weight}</span>
                {weight === 'Exploratorio' && (
                  <div className="w-4 h-4 bg-blue-500/30 rounded-full flex items-center justify-center ml-1">
                    <Info className="w-2.5 h-2.5 text-blue-400" />
                  </div>
                )}
              </button>
            )}
            
            {tempo && (
              <button
                onClick={() => setActiveTooltip('tempo')}
                className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg hover:bg-purple-500/20 transition-colors"
              >
                <Clock className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-400">Tempo {tempo}</span>
                <div className="w-4 h-4 bg-purple-500/30 rounded-full flex items-center justify-center ml-1">
                  <Info className="w-2.5 h-2.5 text-purple-400" />
                </div>
              </button>
            )}
            
            {rir !== null && rir !== undefined && (
              <button
                onClick={() => setActiveTooltip('rir')}
                className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition-colors"
              >
                <span className="text-xs font-bold text-orange-400">RIR {rir}</span>
                <div className="w-4 h-4 bg-orange-500/30 rounded-full flex items-center justify-center ml-1">
                  <Info className="w-2.5 h-2.5 text-orange-400" />
                </div>
              </button>
            )}
          </div>

          {/* Description toggle */}
          {description && (
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 mb-3 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span>Cómo realizar el ejercicio</span>
              {showDescription ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          {/* Description content */}
          {showDescription && description && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 mb-3 animate-in slide-in-from-top-2 duration-200">
              <p className="text-sm text-zinc-300 leading-relaxed">{description}</p>
            </div>
          )}

          {/* Corrections */}
          {corrections.length > 0 && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Puntos clave
                </span>
              </div>
              <ul className="space-y-1.5">
                {corrections.slice(0, 3).map((correction, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{correction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 bg-linear-to-t from-zinc-900 to-transparent shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onPauseToggle}
            className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            {isPaused ? <Play className="w-6 h-6 text-white" /> : <Pause className="w-6 h-6 text-white" />}
          </button>
          
          <button
            onClick={onComplete}
            className="flex-1 bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)]"
          >
            <Check className="w-5 h-5" />
            {type === 'main' && setNumber ? `COMPLETAR SERIE ${setNumber}` : 'COMPLETAR'}
          </button>
        </div>
      </div>

      {/* Alarm Modal for timed exercises */}
      {(() => {
        console.log('🔔 Modal render check:', { alarmActive, isTimedExercise, shouldShow: alarmActive && isTimedExercise });
        return null;
      })()}
      {alarmActive && isTimedExercise && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="text-center bg-zinc-800 p-8 rounded-3xl border-2 border-lime-500 shadow-2xl">
            <div className="w-24 h-24 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Check className="w-12 h-12 text-zinc-900" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">¡Ejercicio Completado!</h3>
            <p className="text-zinc-400 mb-6">El tiempo ha finalizado</p>
            <button
              onClick={() => {
                console.log('👆 CONTINUAR clicked');
                stopAlarmSound();
                onDismissAlarm();
              }}
              className="bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold px-10 py-5 rounded-2xl text-xl active:scale-95 transition-all shadow-[0_0_30px_rgba(132,204,22,0.5)]"
            >
              CONTINUAR
            </button>
          </div>
        </div>
      )}

      {/* Tooltips */}
      <InfoTooltip
        title="¿Qué es el Tempo?"
        content="El tempo indica la velocidad de cada fase del movimiento. Por ejemplo, 4-2-2-1 significa: 4 segundos bajando (excéntrica), 2 segundos de pausa abajo, 2 segundos subiendo (concéntrica), 1 segundo de pausa arriba. Controlar el tempo aumenta el tiempo bajo tensión y mejora las ganancias musculares."
        isOpen={activeTooltip === 'tempo'}
        onClose={() => setActiveTooltip(null)}
      />
      
      <InfoTooltip
        title="¿Qué es el RIR?"
        content="RIR significa 'Reps In Reserve' (repeticiones en reserva). Indica cuántas repeticiones más podrías hacer antes del fallo muscular. Un RIR de 3 significa que debes terminar la serie cuando sientas que podrías hacer 3 reps más. Esto ayuda a controlar la intensidad y evitar el sobreentrenamiento."
        isOpen={activeTooltip === 'rir'}
        onClose={() => setActiveTooltip(null)}
      />
      
      <InfoTooltip
        title={weight === 'Exploratorio' ? 'Peso Exploratorio' : 'Peso Prescrito'}
        content={weight === 'Exploratorio' 
          ? 'En tu primer intento de este ejercicio, tú eliges el peso inicial. Busca un peso que te permita completar todas las repeticiones con la técnica correcta, sintiendo que podrías hacer las repeticiones en reserva (RIR) indicadas. El sistema aprenderá de tu desempeño para prescribir el peso exacto en futuras sesiones.'
          : `El sistema ha calculado este peso basándose en tu historial de desempeño previo. Este peso te permitirá alcanzar el RIR objetivo mientras mantienes una progresión segura y efectiva.`}
        isOpen={activeTooltip === 'peso'}
        onClose={() => setActiveTooltip(null)}
      />
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

interface WorkoutPlayerProps {
  session: GeneratedSession;
  onComplete?: () => void;
  onExit?: () => void;
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ session, onComplete, onExit }) => {
  const navigate = useNavigate();
  
  const [currentPhase, setCurrentPhase] = useState<WorkoutPhase>('warmup');
  const [currentExercise, setCurrentExercise] = useState<CurrentExercise | null>(null);
  const [isResting, setIsResting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPhaseIntro, setShowPhaseIntro] = useState(true);
  
  const [restSeconds, setRestSeconds] = useState(0);
  const [remainingRestSeconds, setRemainingRestSeconds] = useState(0);
  const [exerciseRemainingSeconds, setExerciseRemainingSeconds] = useState(0);
  const [exerciseTotalSeconds, setExerciseTotalSeconds] = useState(0);
  const [alarmActive, setAlarmActive] = useState(false);
  
  const [warmupIndex, setWarmupIndex] = useState(0);
  const [mainStationIndex, setMainStationIndex] = useState(0);
  const [mainExerciseIndex, setMainExerciseIndex] = useState(0);
  const [mainSetNumber, setMainSetNumber] = useState(1);
  const [coreIndex, setCoreIndex] = useState(0);
  const [cooldownPhaseIndex, setCooldownPhaseIndex] = useState(0);
  const [cooldownExerciseIndex, setCooldownExerciseIndex] = useState(0);

  // Logging state
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [pendingLogContext, setPendingLogContext] = useState<RestScreenProps['pendingLogContext']>(null);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioInitialized = useRef(false);

  // Get phase explanation from education
  const getPhaseExplanation = useCallback((phase: WorkoutPhase): PhaseExplanation | undefined => {
    const education = session.education as any;
    if (!education?.fasesExplicadas) return undefined;
    
    const phaseMap: Record<string, string> = {
      'warmup': 'Calentamiento RAMP',
      'main': 'Bloque Principal',
      'core': 'Entrenamiento de Core',
      'cooldown': 'Enfriamiento'
    };
    
    const phaseName = phaseMap[phase];
    return education.fasesExplicadas.find((f: PhaseExplanation) => 
      f.fase.toLowerCase().includes(phaseName?.toLowerCase() || '') ||
      phaseName?.toLowerCase().includes(f.fase.toLowerCase())
    );
  }, [session]);

  // Initialize audio on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!audioInitialized.current) {
        initAudioContext();
        audioInitialized.current = true;
      }
    };
    
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Get main block data safely
  const getMainBlocks = useCallback(() => {
    const mainBlock = session.mainBlock as any;
    return mainBlock?.bloques || mainBlock?.estaciones || [];
  }, [session]);

  // Get next exercise info
  const getNextExerciseInfo = useCallback((): NextExerciseInfo | undefined => {
    const mainBlocks = getMainBlocks();
    
    if (currentPhase === 'warmup') {
      const nextIdx = warmupIndex + 1;
      if (session.warmup && nextIdx < session.warmup.length) {
        const next = session.warmup[nextIdx] as FlexibleExercise;
        return {
          name: getExerciseName(next),
          imageUrl: getExerciseImage(next),
          equipment: []
        };
      }
      if (mainBlocks[0]?.ejercicios?.[0]) {
        const next = mainBlocks[0].ejercicios[0] as FlexibleExercise;
        return {
          name: getExerciseName(next),
          imageUrl: getExerciseImage(next),
          equipment: Array.isArray(next.equipo) ? next.equipo : []
        };
      }
    }
    
    if (currentPhase === 'main') {
      const currentStation = mainBlocks[mainStationIndex];
      const currentEx = currentStation?.ejercicios?.[mainExerciseIndex] as FlexibleExercise;
      const totalSets = getExerciseSets(currentEx);
      
      if (mainSetNumber < totalSets) {
        return {
          name: getExerciseName(currentEx),
          imageUrl: getExerciseImage(currentEx),
          equipment: Array.isArray(currentEx?.equipo) ? currentEx.equipo : []
        };
      }
      
      const nextExIdx = mainExerciseIndex + 1;
      if (currentStation && nextExIdx < currentStation.ejercicios.length) {
        const next = currentStation.ejercicios[nextExIdx] as FlexibleExercise;
        return {
          name: getExerciseName(next),
          imageUrl: getExerciseImage(next),
          equipment: Array.isArray(next.equipo) ? next.equipo : []
        };
      }
      
      const nextStationIdx = mainStationIndex + 1;
      if (nextStationIdx < mainBlocks.length) {
        const next = mainBlocks[nextStationIdx].ejercicios[0] as FlexibleExercise;
        return {
          name: getExerciseName(next),
          imageUrl: getExerciseImage(next),
          equipment: Array.isArray(next.equipo) ? next.equipo : []
        };
      }
      
      if (session.coreBlock?.ejercicios?.[0]) {
        const next = session.coreBlock.ejercicios[0] as unknown as FlexibleExercise;
        return {
          name: getExerciseName(next),
          imageUrl: getExerciseImage(next),
          equipment: []
        };
      }
    }
    
    if (currentPhase === 'core') {
      const nextIdx = coreIndex + 1;
      if (session.coreBlock?.ejercicios && nextIdx < session.coreBlock.ejercicios.length) {
        const next = session.coreBlock.ejercicios[nextIdx] as unknown as FlexibleExercise;
        return {
          name: getExerciseName(next),
          imageUrl: getExerciseImage(next),
          equipment: []
        };
      }
    }
    
    return undefined;
  }, [currentPhase, warmupIndex, mainStationIndex, mainExerciseIndex, mainSetNumber, coreIndex, session, getMainBlocks]);

  // Rest timer
  useEffect(() => {
    if (!isResting || isPaused || alarmActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingRestSeconds(prev => {
        if (prev <= 1) {
          if (soundEnabled) playAlarmSound();
          setAlarmActive(true);
          return 0;
        }
        if (prev <= 11 && prev > 1 && soundEnabled) playTickSound();
        return prev - 1;
      });
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isResting, isPaused, alarmActive, soundEnabled]);

  // Exercise timer (for timed exercises)
  useEffect(() => {
    if (isResting || isPaused || !currentExercise || exerciseTotalSeconds <= 0) {
      if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current);
      return;
    }

    exerciseTimerRef.current = setInterval(() => {
      setExerciseRemainingSeconds(prev => {
        if (prev <= 1) {
          console.log('⏰ Exercise timer finished! Setting alarm active...');
          if (soundEnabled) playAlarmSound();
          setAlarmActive(true);
          return 0;
        }
        if (prev <= 11 && prev > 1 && soundEnabled) playTickSound();
        return prev - 1;
      });
    }, 1000);

    return () => { if (exerciseTimerRef.current) clearInterval(exerciseTimerRef.current); };
  }, [isResting, isPaused, currentExercise, exerciseTotalSeconds, soundEnabled]);

  // Setup exercise timer when exercise changes
  useEffect(() => {
    if (!currentExercise) return;
    
    const duration = getExerciseDurationInSeconds(currentExercise.exercise);
    if (duration && duration > 0) {
      setExerciseTotalSeconds(duration);
      setExerciseRemainingSeconds(duration);
      // Para ejercicios temporizados, empezar en pausa para que el usuario haga clic en PLAY
      setIsPaused(true);
      console.log('⏱️ Timed exercise detected - starting PAUSED. User must click PLAY to start.');
    } else {
      setExerciseTotalSeconds(0);
      setExerciseRemainingSeconds(0);
      // Para ejercicios por repeticiones, no pausar
      setIsPaused(false);
    }
  }, [currentExercise]);

  // Initialize first exercise
  useEffect(() => {
    const mainBlocks = getMainBlocks();
    
    if (session.warmup && session.warmup.length > 0) {
      setCurrentExercise({
        type: 'warmup',
        exercise: session.warmup[0] as FlexibleExercise
      });
      setCurrentPhase('warmup');
      setShowPhaseIntro(true);
    } else if (mainBlocks[0]?.ejercicios?.[0]) {
      const firstEx = mainBlocks[0].ejercicios[0] as FlexibleExercise;
      setCurrentExercise({
        type: 'main',
        exercise: firstEx,
        setNumber: 1,
        totalSets: getExerciseSets(firstEx),
        stationIndex: 0,
        exerciseIndex: 0
      });
      setCurrentPhase('main');
      setShowPhaseIntro(true);
    }
  }, [session, getMainBlocks]);

  const startRest = useCallback((seconds: number) => {
    setRestSeconds(seconds);
    setRemainingRestSeconds(seconds);
    setIsResting(true);
    setAlarmActive(false);
  }, []);

  const endRest = useCallback(() => {
    stopAlarmSound();
    setIsResting(false);
    setAlarmActive(false);
    setPendingLogContext(null);
  }, []);

  const advanceToNext = useCallback(() => {
    const mainBlocks = getMainBlocks();
    
    if (currentPhase === 'warmup') {
      const nextIdx = warmupIndex + 1;
      if (session.warmup && nextIdx < session.warmup.length) {
        setWarmupIndex(nextIdx);
        setCurrentExercise({
          type: 'warmup',
          exercise: session.warmup[nextIdx] as FlexibleExercise
        });
      } else {
        if (mainBlocks[0]?.ejercicios?.[0]) {
          const firstEx = mainBlocks[0].ejercicios[0] as FlexibleExercise;
          setCurrentPhase('main');
          setShowPhaseIntro(true);
          setMainStationIndex(0);
          setMainExerciseIndex(0);
          setMainSetNumber(1);
          setCurrentExercise({
            type: 'main',
            exercise: firstEx,
            setNumber: 1,
            totalSets: getExerciseSets(firstEx),
            stationIndex: 0,
            exerciseIndex: 0
          });
        } else if (session.coreBlock?.ejercicios?.[0]) {
          setCurrentPhase('core');
          setShowPhaseIntro(true);
          setCoreIndex(0);
          setCurrentExercise({
            type: 'core',
            exercise: session.coreBlock.ejercicios[0] as unknown as FlexibleExercise
          });
        } else {
          setCurrentPhase('complete');
        }
      }
    } else if (currentPhase === 'main') {
      const currentStation = mainBlocks[mainStationIndex];
      const currentEx = currentStation?.ejercicios?.[mainExerciseIndex] as FlexibleExercise;
      const totalSets = getExerciseSets(currentEx);
      
      if (mainSetNumber < totalSets) {
        const newSetNumber = mainSetNumber + 1;
        setMainSetNumber(newSetNumber);
        setCurrentExercise({
          type: 'main',
          exercise: currentEx,
          setNumber: newSetNumber,
          totalSets,
          stationIndex: mainStationIndex,
          exerciseIndex: mainExerciseIndex
        });
      } else {
        const nextExIdx = mainExerciseIndex + 1;
        if (currentStation && nextExIdx < currentStation.ejercicios.length) {
          const nextEx = currentStation.ejercicios[nextExIdx] as FlexibleExercise;
          setMainExerciseIndex(nextExIdx);
          setMainSetNumber(1);
          setCurrentExercise({
            type: 'main',
            exercise: nextEx,
            setNumber: 1,
            totalSets: getExerciseSets(nextEx),
            stationIndex: mainStationIndex,
            exerciseIndex: nextExIdx
          });
        } else {
          const nextStationIdx = mainStationIndex + 1;
          if (nextStationIdx < mainBlocks.length) {
            const nextStation = mainBlocks[nextStationIdx];
            const nextEx = nextStation.ejercicios[0] as FlexibleExercise;
            setMainStationIndex(nextStationIdx);
            setMainExerciseIndex(0);
            setMainSetNumber(1);
            setCurrentExercise({
              type: 'main',
              exercise: nextEx,
              setNumber: 1,
              totalSets: getExerciseSets(nextEx),
              stationIndex: nextStationIdx,
              exerciseIndex: 0
            });
          } else {
            if (session.coreBlock?.ejercicios?.[0]) {
              setCurrentPhase('core');
              setShowPhaseIntro(true);
              setCoreIndex(0);
              setCurrentExercise({
                type: 'core',
                exercise: session.coreBlock.ejercicios[0] as unknown as FlexibleExercise
              });
            } else if (session.cooldown?.fases?.[0]?.contenido?.ejercicios?.[0]) {
              setCurrentPhase('cooldown');
              setShowPhaseIntro(true);
              setCooldownPhaseIndex(0);
              setCooldownExerciseIndex(0);
              setCurrentExercise({
                type: 'cooldown',
                exercise: session.cooldown.fases[0].contenido.ejercicios[0] as FlexibleExercise
              });
            } else {
              setCurrentPhase('complete');
            }
          }
        }
      }
    } else if (currentPhase === 'core') {
      const nextIdx = coreIndex + 1;
      if (session.coreBlock?.ejercicios && nextIdx < session.coreBlock.ejercicios.length) {
        setCoreIndex(nextIdx);
        setCurrentExercise({
          type: 'core',
          exercise: session.coreBlock.ejercicios[nextIdx] as unknown as FlexibleExercise
        });
      } else {
        // Buscar la primera fase del cooldown que tenga ejercicios
        let foundCooldownExercise = false;
        if (session.cooldown?.fases) {
          for (let phaseIdx = 0; phaseIdx < session.cooldown.fases.length; phaseIdx++) {
            const fase = session.cooldown.fases[phaseIdx];
            const ejercicios = fase.contenido?.ejercicios;
            if (ejercicios && Array.isArray(ejercicios) && ejercicios.length > 0) {
              setCurrentPhase('cooldown');
              setShowPhaseIntro(true);
              setCooldownPhaseIndex(phaseIdx);
              setCooldownExerciseIndex(0);
              setCurrentExercise({
                type: 'cooldown',
                exercise: ejercicios[0] as FlexibleExercise
              });
              foundCooldownExercise = true;
              break;
            }
          }
        }
        if (!foundCooldownExercise) {
          setCurrentPhase('complete');
        }
      }
    } else if (currentPhase === 'cooldown') {
      const currentCooldownPhase = session.cooldown?.fases?.[cooldownPhaseIndex];
      const exercises = currentCooldownPhase?.contenido?.ejercicios;
      
      if (exercises && Array.isArray(exercises) && cooldownExerciseIndex + 1 < exercises.length) {
        const nextIdx = cooldownExerciseIndex + 1;
        setCooldownExerciseIndex(nextIdx);
        setCurrentExercise({
          type: 'cooldown',
          exercise: exercises[nextIdx] as FlexibleExercise
        });
      } else {
        // Buscar la siguiente fase que tenga ejercicios
        let foundNextPhase = false;
        if (session.cooldown?.fases) {
          for (let phaseIdx = cooldownPhaseIndex + 1; phaseIdx < session.cooldown.fases.length; phaseIdx++) {
            const nextPhase = session.cooldown.fases[phaseIdx];
            const nextExercises = nextPhase.contenido?.ejercicios;
            if (nextExercises && Array.isArray(nextExercises) && nextExercises.length > 0) {
              setCooldownPhaseIndex(phaseIdx);
              setCooldownExerciseIndex(0);
              setCurrentExercise({
                type: 'cooldown',
                exercise: nextExercises[0] as FlexibleExercise
              });
              foundNextPhase = true;
              break;
            }
          }
        }
        if (!foundNextPhase) {
          setCurrentPhase('complete');
        }
      }
    }
  }, [currentPhase, warmupIndex, mainStationIndex, mainExerciseIndex, mainSetNumber, coreIndex, cooldownPhaseIndex, cooldownExerciseIndex, session, getMainBlocks]);

  const handleLogSubmit = useCallback((data: SetLog) => {
    if (!currentExercise || !currentExercise.exercise.id) return;
    
    setExerciseLogs(prev => {
      const exId = currentExercise.exercise.id;
      const currentLogs = prev[exId] || [];
      return {
        ...prev,
        [exId]: [...currentLogs, data]
      };
    });
  }, [currentExercise]);

  const handleCompleteExercise = useCallback(() => {
    if (!currentExercise) return;
    
    // Stop any alarm that might be playing (from timed exercise)
    stopAlarmSound();
    
    let restTime = 60;
    const mainBlocks = getMainBlocks();
    
    if (currentExercise.type === 'main') {
      const ex = currentExercise.exercise;
      restTime = getExerciseRest(ex);
      
      const totalSets = currentExercise.totalSets || getExerciseSets(ex);
      const isLastSet = currentExercise.setNumber === totalSets;

      const duration = getExerciseDurationInSeconds(ex);
      const isTimed = !!(duration && duration > 0);

      setPendingLogContext({
         exerciseName: getExerciseName(ex),
         isBodyweight: isBodyweightExercise(ex),
         isLastSet: isLastSet,
         isTimed,
         defaultReps: isTimed ? (duration as number) : (parseInt(getExerciseReps(ex).toString()) || 0),
         weightPlaceholder: ex.peso
      });

      if (currentExercise.setNumber === totalSets) {
        const station = mainBlocks[currentExercise.stationIndex || 0];
        restTime = station?.descansoEntreEjercicios || 60;
      }
    } else if (currentExercise.type === 'core') {
      restTime = currentExercise.exercise.prescripcion?.descanso || 20;
    } else if (currentExercise.type === 'warmup') {
      restTime = 15;
    } else {
      restTime = 30;
    }
    
    startRest(restTime);
  }, [currentExercise, startRest, getMainBlocks]);

  const handleDismissAlarm = useCallback(() => {
    stopAlarmSound();
    setAlarmActive(false);
    endRest();
    advanceToNext();
  }, [endRest, advanceToNext]);

  const handleSkipRest = useCallback(() => {
    stopAlarmSound();
    endRest();
    advanceToNext();
  }, [endRest, advanceToNext]);

  const handleExit = useCallback(() => {
    stopAlarmSound();
    if (onExit) {
      onExit();
    } else {
      navigate(-1);
    }
  }, [navigate, onExit]);

  const handlePhaseIntroContinue = useCallback(() => {
    setShowPhaseIntro(false);
  }, []);

  const handleFinishSession = async (feedback: SessionFeedback) => {
    setIsSubmittingSession(true);
    try {
       const user = auth.currentUser;
       if (!user) throw new Error("No user authenticated");
       
       const token = await user.getIdToken();
       
       const mainBlocks = (session.mainBlock as any)?.bloques || [];
       
       // Construir el payload según la estructura API V2
       const exercises = mainBlocks.flatMap((station: any) => {
         const ejercicios = station.ejercicios || [];
         return ejercicios.map((ex: FlexibleExercise) => {
           const logs = exerciseLogs[ex.id] || [];
           return {
             exerciseId: ex.id,
             exerciseName: getExerciseName(ex),
             sets: logs.map((log, idx) => ({
               setNumber: idx + 1,
               reps: log.reps,
               load: log.weight === undefined || log.weight === null ? null : log.weight,
               rir: log.rir === undefined || log.rir === null ? 0 : log.rir,
               rpe: log.rir !== undefined && log.rir !== null ? 10 - log.rir : 7, // RPE = 10 - RIR
               completed: true
             }))
           };
         }).filter((ex: any) => ex.sets.length > 0); // Solo ejercicios con sets registrados
       });

       // Payload V2 para /session/complete
       const payload = {
         firebaseUid: user.uid,
         sessionId: session.id,
         performanceData: {
           completedAt: new Date().toISOString(),
           readinessPreSession: feedback.energyLevel || 7, // Usar del feedback si está disponible
           painAreas: [], // Si tuviéramos esta info del feedback pre-sesión
           exercises
         }
       };

       console.log('📤 Enviando payload de sesión completada (V2):', JSON.stringify(payload, null, 2));

       const response = await fetch(`${API_BASE_URL}/api/session/complete`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify(payload)
       });

       if (!response.ok) {
         const errorData = await response.json();
         console.error('❌ Error del servidor:', errorData);
         throw new Error(errorData.error || 'Failed to save session');
       }
       
       const result = await response.json();
       console.log('✅ Sesión guardada exitosamente:', result);
       
       if (onComplete) onComplete();
       else navigate('/');

    } catch (error) {
        console.error('Error saving session:', error);
        alert('Error al guardar sesión: ' + (error as Error).message);
    } finally {
        setIsSubmittingSession(false);
    }
  };

  // Show phase intro screen
  if (showPhaseIntro && currentPhase !== 'complete' && currentPhase !== 'rest') {
    return (
      <PhaseIntroScreen
        phase={currentPhase as 'warmup' | 'main' | 'core' | 'cooldown'}
        explanation={getPhaseExplanation(currentPhase)}
        onContinue={handlePhaseIntroContinue}
      />
    );
  }

  if (currentPhase === 'complete') {
    return (
      <SessionFeedbackForm 
        onSubmit={handleFinishSession}
        isSubmitting={isSubmittingSession}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {isResting ? (
        <RestScreen
          restSeconds={restSeconds}
          remainingSeconds={remainingRestSeconds}
          nextExercise={getNextExerciseInfo()}
          isPaused={isPaused}
          onSkip={handleSkipRest}
          onPauseToggle={() => setIsPaused(!isPaused)}
          alarmActive={alarmActive}
          onDismissAlarm={handleDismissAlarm}
          pendingLogContext={pendingLogContext}
          onLogSubmit={handleLogSubmit}
        />
      ) : currentExercise ? (
        <ExerciseScreen
          exercise={currentExercise.exercise}
          type={currentExercise.type}
          setNumber={currentExercise.setNumber}
          totalSets={currentExercise.totalSets}
          isPaused={isPaused}
          remainingSeconds={exerciseRemainingSeconds}
          totalDurationSeconds={exerciseTotalSeconds}
          isTimedExercise={exerciseTotalSeconds > 0}
          onComplete={handleCompleteExercise}
          onPauseToggle={() => setIsPaused(!isPaused)}
          onExit={handleExit}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          alarmActive={alarmActive}
          onDismissAlarm={handleDismissAlarm}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin">
            <RotateCcw className="w-8 h-8 text-lime-500" />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlayer;
