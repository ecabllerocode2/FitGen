import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { API_BASE_URL, API_ENDPOINTS, authenticatedFetch } from '../../config/api';
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
  AlertCircle,
  Check,
  Info,
  BookOpen,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type { GeneratedSession } from '../../types/session';
import ExerciseSwapReasonModal, { type SwapReason } from '../ExerciseSwapReasonModal';
import {
  AppEyebrow,
  AppFixedFooter,
  AppHero,
  AppOptionButton,
  AppPrimaryButton,
  AppProgress,
  AppShell,
} from '../ui/AppPrimitives';

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
  pumpQuality: number;
  sorenessTiming: 'no llegó a doler' | 'sanó a tiempo' | 'aún dolía al entrenar de nuevo';
  perceivedWorkload: number;
  jointPain: boolean;
  jointPainZone?: string;
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
    pesoSugerido?: number | null;
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
  const [step, setStep] = useState(0);
  const [pumpQuality, setPumpQuality] = useState(3);
  const [sorenessTiming, setSorenessTiming] = useState<SessionFeedback['sorenessTiming']>('sanó a tiempo');
  const [perceivedWorkload, setPerceivedWorkload] = useState(3);
  const [jointPain, setJointPain] = useState(false);
  const [jointPainZone, setJointPainZone] = useState('');

  const steps = ['Pump', 'Recuperación', 'Carga'];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / (steps.length + (jointPain ? 1 : 0) + 1)) * 100;

  const handleSubmit = () => {
    onSubmit({
      pumpQuality,
      sorenessTiming,
      perceivedWorkload,
      jointPain,
      jointPainZone: jointPain ? jointPainZone : undefined,
    });
  };

  const handleNext = () => {
    if (step < 2) setStep((s) => s + 1);
    else handleSubmit();
  };

  return (
    <AppShell>
      <div className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4">
        <div className="max-w-sm mx-auto">
          <AppProgress value={Math.min(100, progress + step * 10)} label="Post-sesión" meta={`${step + 1} / 3`} />
        </div>
      </div>

      <div className="flex-1 px-6 flex flex-col justify-center max-w-sm mx-auto w-full">
        {step === 0 && (
          <>
            <AppEyebrow>Pump muscular</AppEyebrow>
            <h2 className="text-2xl font-bold text-white mt-4 mb-8">¿Qué tan bombeado quedó el músculo?</h2>
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <AppOptionButton key={v} selected={pumpQuality === v} onClick={() => setPumpQuality(v)} compact>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold tabular-nums text-lime-400/90 w-6">{v}</span>
                    <span className="text-sm">{v === 1 ? 'Casi nada' : v === 5 ? 'Máximo pump' : `Nivel ${v}`}</span>
                  </div>
                </AppOptionButton>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <AppEyebrow>DOMS</AppEyebrow>
            <h2 className="text-2xl font-bold text-white mt-4 mb-8">¿Cómo fue el dolor entre sesiones?</h2>
            <div className="flex flex-col gap-2">
              {([
                ['no llegó a doler', 'No llegó a doler'],
                ['sanó a tiempo', 'Sanó a tiempo'],
                ['aún dolía al entrenar de nuevo', 'Aún dolía al entrenar'],
              ] as const).map(([value, label]) => (
                <AppOptionButton key={value} selected={sorenessTiming === value} onClick={() => setSorenessTiming(value)}>
                  <span className="text-sm">{label}</span>
                </AppOptionButton>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <AppEyebrow>Dificultad</AppEyebrow>
            <h2 className="text-2xl font-bold text-white mt-4 mb-4">¿Cómo de dura fue la sesión?</h2>
            <p className="text-sm text-zinc-500 mb-6">1 = muy fácil · 5 = al límite</p>
            <div className="flex flex-col gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((v) => (
                <AppOptionButton key={v} selected={perceivedWorkload === v} onClick={() => setPerceivedWorkload(v)} compact>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold tabular-nums text-lime-400/90 w-6">{v}</span>
                    <span className="text-sm">Nivel {v}</span>
                  </div>
                </AppOptionButton>
              ))}
            </div>
            <label className="flex items-center gap-3 text-sm text-zinc-400 py-3 border-t border-zinc-800">
              <input
                type="checkbox"
                checked={jointPain}
                onChange={(e) => setJointPain(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950"
              />
              Tuve dolor articular
            </label>
            {jointPain && (
              <input
                type="text"
                value={jointPainZone}
                onChange={(e) => setJointPainZone(e.target.value)}
                placeholder="Zona (ej. hombro)"
                className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-lime-500/50"
              />
            )}
          </>
        )}
      </div>

      <AppFixedFooter>
        <div className="max-w-sm mx-auto space-y-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300 py-2"
            >
              Anterior
            </button>
          )}
          <AppPrimaryButton onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : isLast ? 'Finalizar sesión' : 'Continuar'}
          </AppPrimaryButton>
        </div>
      </AppFixedFooter>
    </AppShell>
  );
};

// ==================== PHASE INTRO SCREEN ====================

interface PhaseIntroScreenProps {
  phase: 'warmup' | 'main' | 'core' | 'cooldown';
  explanation?: PhaseExplanation;
  onContinue: () => void;
}

const PHASE_INTRO_COPY: Record<
  'warmup' | 'main' | 'core' | 'cooldown',
  { eyebrow: string; subtitle: string; accent: string }
> = {
  warmup: {
    eyebrow: 'Calentamiento',
    subtitle: 'Activa articulaciones y prepara el sistema nervioso.',
    accent: 'from-orange-500/12',
  },
  main: {
    eyebrow: 'Bloque principal',
    subtitle: 'El trabajo de hoy. Prioriza técnica y control.',
    accent: 'from-lime-500/12',
  },
  core: {
    eyebrow: 'Core',
    subtitle: 'Estabilidad y transferencia al resto del entrenamiento.',
    accent: 'from-yellow-500/10',
  },
  cooldown: {
    eyebrow: 'Enfriamiento',
    subtitle: 'Baja la frecuencia cardíaca y recupera movilidad.',
    accent: 'from-cyan-500/10',
  },
};

const PhaseIntroScreen: React.FC<PhaseIntroScreenProps> = ({ phase, explanation, onContinue }) => {
  const copy = PHASE_INTRO_COPY[phase];
  const title = explanation?.fase || copy.eyebrow;
  const body = explanation?.explicacion || copy.subtitle;

  return (
    <AppShell>
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${copy.accent} via-transparent to-transparent pointer-events-none`} />
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-72 h-72 bg-lime-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <AppHero eyebrow="Siguiente fase" title={title} body={body} align="center" />
      </div>
      <AppFixedFooter>
        <AppPrimaryButton onClick={onContinue}>
          <span className="flex items-center justify-center gap-2">
            <Play className="w-5 h-5" />
            Comenzar
          </span>
        </AppPrimaryButton>
      </AppFixedFooter>
    </AppShell>
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
    requiresRir?: boolean;
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
     if (pendingLogContext.requiresRir || pendingLogContext.isLastSet) {
        if (!rir && rir !== '0') {
            alert('Por favor indica el RIR de la serie.');
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

            {(pendingLogContext.requiresRir || pendingLogContext.isLastSet) && (
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
    <div className="flex flex-col items-center justify-between h-full py-8 px-6">
      <div className="text-center w-full max-w-sm">
        <AppEyebrow>Descanso</AppEyebrow>
        <p className="text-sm text-zinc-500 mt-3">Recupera antes de la siguiente serie</p>
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
  isBodyweight?: boolean;
  prescribedWeightKg?: number | null;
  onPrescribedWeightChange?: (kg: number | null) => void;
  onSwap?: () => void;
  isSwapping?: boolean;
}

function parsePrescribedKg(ex: FlexibleExercise): number | null {
  const fromField = (ex as any).prescribedLoadKg ?? (ex as any).suggestedLoadKg ?? ex.prescripcion?.pesoSugerido;
  if (typeof fromField === 'number' && !Number.isNaN(fromField)) return fromField;
  const peso = ex.peso;
  if (!peso || peso === 'Exploratorio') return null;
  const match = String(peso).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
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
  onDismissAlarm,
  isBodyweight = false,
  prescribedWeightKg = null,
  onPrescribedWeightChange,
  onSwap,
  isSwapping = false,
}) => {
  const [showDescription, setShowDescription] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<'peso' | null>(null);
  const [localWeight, setLocalWeight] = useState('');
  
  const name = getExerciseName(exercise);
  const corrections = getExerciseCorrections(exercise);
  const description = getExerciseDescription(exercise);
  const reps = getExerciseReps(exercise);
  const parsedWeight = parsePrescribedKg(exercise);
  const weight = exercise.peso ?? (parsedWeight != null ? `${parsedWeight} kg` : undefined);
  const isExploratory = weight === 'Exploratorio' || (exercise as any).loadMode === 'exploratory';
  const duracion = exercise.duracion || exercise.tiempo;

  useEffect(() => {
    const initial = prescribedWeightKg ?? parsedWeight;
    setLocalWeight(initial != null ? String(initial) : '');
  }, [exercise.id, prescribedWeightKg, parsedWeight]);

  const phaseLabels: Record<string, string> = {
    warmup: 'Calentamiento',
    main: 'Principal',
    core: 'Core',
    cooldown: 'Enfriamiento',
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onExit} className="p-2 -ml-2 rounded-full hover:bg-zinc-800/80 transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
          
          <div className="flex items-center gap-2">
            {type === 'warmup' && onSwap && (
              <button
                type="button"
                onClick={onSwap}
                disabled={isSwapping}
                className="p-2 rounded-full hover:bg-zinc-800/80 transition-colors disabled:opacity-50"
                aria-label="Cambiar ejercicio de calentamiento"
              >
                <RefreshCw className={`w-4 h-4 text-zinc-500 ${isSwapping ? 'animate-spin' : ''}`} />
              </button>
            )}
            {isTimedExercise && totalDurationSeconds > 0 && (
              <CircularTimer
                totalSeconds={totalDurationSeconds}
                remainingSeconds={remainingSeconds}
                size="small"
                isPaused={isPaused}
              />
            )}
            <button onClick={onToggleSound} className="p-2 rounded-full hover:bg-zinc-800/80 transition-colors">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-500" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </button>
          </div>
        </div>

        <AppEyebrow>{phaseLabels[type] ?? ''}</AppEyebrow>
        {setNumber && totalSets ? (
          <p className="text-xs text-zinc-600 mt-2 tabular-nums">
            Serie {setNumber} de {totalSets}
          </p>
        ) : null}
      </header>

      <div className="flex-1 flex flex-col px-5 overflow-y-auto">
        <div className="w-full shrink-0 rounded-2xl overflow-hidden ring-1 ring-zinc-800/80 bg-zinc-900/40">
          <AnimatedExerciseImage 
            imageUrl1={getExerciseImage(exercise)}
            imageUrl2={getExerciseImage2(exercise)}
            exerciseName={name}
          />
        </div>

        <div className="mt-6 flex-1 flex flex-col min-h-0">
          <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">{name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
            {duracion ? (
              <span className="text-3xl font-bold text-lime-400 tabular-nums">{duracion}</span>
            ) : reps && reps !== '-' ? (
              <span className="text-3xl font-bold text-lime-400 tabular-nums">{reps}</span>
            ) : null}

            {type === 'main' && !isTimedExercise && !isBodyweight ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={localWeight}
                  onChange={(e) => {
                    setLocalWeight(e.target.value);
                    const n = parseFloat(e.target.value);
                    onPrescribedWeightChange?.(Number.isNaN(n) ? null : n);
                  }}
                  placeholder="kg"
                  className="w-24 bg-zinc-900/80 border border-zinc-700 rounded-xl px-3 py-2 text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-lime-500/50"
                />
                <span className="text-lg text-zinc-500">kg</span>
                {isExploratory && (
                  <button type="button" onClick={() => setActiveTooltip('peso')} className="p-1">
                    <Info className="w-4 h-4 text-zinc-600" />
                  </button>
                )}
              </div>
            ) : weight ? (
              <button
                onClick={() => setActiveTooltip('peso')}
                className="text-xl font-semibold text-zinc-300"
              >
                {weight}
              </button>
            ) : null}
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
      <div className="px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shrink-0">
        <div className="flex items-center gap-3 max-w-sm mx-auto">
          <button
            onClick={onPauseToggle}
            className="w-14 h-14 bg-zinc-900 ring-1 ring-zinc-800 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            {isPaused ? <Play className="w-6 h-6 text-white" /> : <Pause className="w-6 h-6 text-white" />}
          </button>
          
          <button
            onClick={onComplete}
            className="flex-1 bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Check className="w-5 h-5" />
            {type === 'main' && setNumber ? `Serie ${setNumber}` : 'Completar'}
          </button>
        </div>
      </div>

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
        title={weight === 'Exploratorio' ? 'Peso exploratorio' : 'Peso prescrito'}
        content={weight === 'Exploratorio' 
          ? 'Elige un peso que te permita completar las repeticiones con buena técnica. El sistema aprenderá de tu desempeño para las próximas sesiones.'
          : 'Peso calculado según tu historial para alcanzar la intensidad objetivo de hoy.'}
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

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ session: initialSession, onComplete, onExit }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState(initialSession);
  const [swappingWarmup, setSwappingWarmup] = useState(false);
  const [swapTarget, setSwapTarget] = useState<{
    exerciseId: string;
    name: string;
    equipment: string[];
  } | null>(null);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);
  
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
  const [weightOverrides, setWeightOverrides] = useState<Record<string, number>>({});
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

  const handleWeightOverride = useCallback((exerciseId: string, kg: number | null) => {
    setWeightOverrides((prev) => {
      if (kg == null) {
        const next = { ...prev };
        delete next[exerciseId];
        return next;
      }
      return { ...prev, [exerciseId]: kg };
    });
  }, []);

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

      const overrideKg = ex.id ? weightOverrides[ex.id] : undefined;
      const placeholderWeight = overrideKg != null
        ? String(overrideKg)
        : ex.peso ?? (parsePrescribedKg(ex) != null ? String(parsePrescribedKg(ex)) : undefined);

      setPendingLogContext({
         exerciseName: getExerciseName(ex),
         isBodyweight: isBodyweightExercise(ex),
         isLastSet: isLastSet,
         requiresRir: true,
         isTimed,
         defaultReps: isTimed ? (duration as number) : (parseInt(getExerciseReps(ex).toString()) || 0),
         weightPlaceholder: placeholderWeight
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
  }, [currentExercise, startRest, getMainBlocks, weightOverrides]);

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

  const handleWarmupSwapRequest = useCallback(() => {
    if (currentExercise?.type !== 'warmup') return;
    const ex = currentExercise.exercise;
    setSwapTarget({
      exerciseId: ex.id,
      name: getExerciseName(ex),
      equipment: Array.isArray(ex.equipo) ? ex.equipo : [],
    });
  }, [currentExercise]);

  const handleConfirmWarmupSwap = async (reason: SwapReason, excludeEquipment: boolean) => {
    if (!swapTarget) return;
    setSwappingWarmup(true);
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('Error de autenticación');
      const token = await user.getIdToken();
      const response = await authenticatedFetch(API_ENDPOINTS.SESSION_SWAP_WARMUP, token, {
        method: 'POST',
        body: JSON.stringify({
          exerciseIdToReplace: swapTarget.exerciseId,
          reason,
          excludeEquipment,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'No se encontró alternativa');
      }
      if (data.session) {
        setSession(data.session as GeneratedSession);
        const updated = (data.session as GeneratedSession).warmup?.[warmupIndex] as FlexibleExercise | undefined;
        if (updated) {
          setCurrentExercise({ type: 'warmup', exercise: updated });
        }
      }
      setSwapTarget(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al cambiar ejercicio');
    } finally {
      setSwappingWarmup(false);
    }
  };

  const handleFinishSession = async (feedback: SessionFeedback) => {
    setIsSubmittingSession(true);
    try {
       const user = getAuth().currentUser;
       if (!user) throw new Error("No user authenticated");
       
       const token = await user.getIdToken();
       
       const buildExercisePerformance = (ex: FlexibleExercise, logs: SetLog[]) => ({
         exerciseId: ex.id,
         exerciseName: getExerciseName(ex),
         sets: logs.map((log, idx) => ({
           setNumber: idx + 1,
           reps: log.reps,
           load: log.weight === undefined || log.weight === null ? null : log.weight,
           rir: log.rir === undefined || log.rir === null ? 2 : log.rir,
           rpe: log.rir !== undefined && log.rir !== null ? 10 - log.rir : 8,
           completed: true
         }))
       });

       let exercises: any[] = [];

       if (Array.isArray(session.mainBlock) && (session.mainBlock as any[])[0]?.exerciseId) {
         exercises = (session.mainBlock as any[])
           .map((ex: any) => {
             const logs = exerciseLogs[ex.exerciseId] || [];
             return logs.length ? buildExercisePerformance({ id: ex.exerciseId, nombre: ex.exerciseName } as FlexibleExercise, logs) : null;
           })
           .filter(Boolean);
       } else {
         const mainBlocks = (session.mainBlock as any)?.bloques || [];
         exercises = mainBlocks.flatMap((station: any) => {
           const ejercicios = station.ejercicios || [];
           return ejercicios.map((ex: FlexibleExercise) => {
             const logs = exerciseLogs[ex.id] || [];
             return logs.length ? buildExercisePerformance(ex, logs) : null;
           }).filter(Boolean);
         });
       }

       const payload = {
         sessionFeedback: feedback,
         performanceData: { exercises }
       };

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
         throw new Error(errorData.error || 'Failed to save session');
       }
       
       const result = await response.json();

       if (result.weeklyAdjustment && Object.keys(result.weeklyAdjustment).length > 0) {
         const msgs = Object.entries(result.weeklyAdjustment)
           .map(([m, a]: [string, any]) => `${m}: ${a.message}`)
           .join('\n');
         alert(`Ajuste semanal aplicado:\n${msgs}`);
       }

       if (result.requiresEvaluation) {
         alert('Tu mesociclo terminó. Completa la evaluación en el inicio.');
       }
       
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
    <>
    <AppShell>
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
          isBodyweight={isBodyweightExercise(currentExercise.exercise)}
          prescribedWeightKg={
            currentExercise.exercise.id
              ? weightOverrides[currentExercise.exercise.id] ?? parsePrescribedKg(currentExercise.exercise)
              : null
          }
          onPrescribedWeightChange={(kg) => {
            if (currentExercise.exercise.id) {
              handleWeightOverride(currentExercise.exercise.id, kg);
            }
          }}
          onSwap={currentExercise.type === 'warmup' ? handleWarmupSwapRequest : undefined}
          isSwapping={swappingWarmup}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin">
            <RotateCcw className="w-8 h-8 text-lime-500" />
          </div>
        </div>
      )}
    </AppShell>

    <ExerciseSwapReasonModal
      open={swapTarget !== null}
      exerciseName={swapTarget?.name ?? ''}
      equipmentTags={swapTarget?.equipment ?? []}
      onClose={() => setSwapTarget(null)}
      onConfirm={handleConfirmWarmupSwap}
      loading={swappingWarmup}
    />
    </>
  );
};

export default WorkoutPlayer;
