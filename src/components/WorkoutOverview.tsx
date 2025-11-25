import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Layers3, // Nuevo ícono para Core
} from 'lucide-react';

// --- TIPOS (Actualizados para incluir Core) ---

interface Exercise {
  id: string;
  name: string;
  instructions?: string;
  durationOrReps?: string; // Para warmup/cooldown
  sets?: number;           // Para main blocks
  targetReps?: string;     // Para main blocks
  rpe?: number;
  notes?: string;
  imageUrl?: string | null;
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
  coreBlocks?: Block[]; // <--- ¡NUEVO! Bloques dedicados al Core
  cooldown: { exercises: Exercise[] };
  meta?: any;
}

interface WorkoutOverviewProps {
  session: SessionData;
}

// --- SUB-COMPONENTE: ACORDEÓN (Inalterado) ---
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
  // CAMBIO CLAVE: Cambiar el estado inicial a 'defaultOpen' (que ahora es false)
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

// --- SUB-COMPONENTE: FILA DE EJERCICIO (Inalterado) ---
const ExerciseRow = ({ exercise, isSimple = false }: { exercise: Exercise, isSimple?: boolean }) => (
  <div className="flex items-start gap-4 py-3 border-b border-zinc-800 last:border-0">
    {/* Placeholder de Imagen */}
    <div className="w-16 h-16 bg-zinc-700 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
        {exercise.imageUrl ? (
             <img src={exercise.imageUrl} alt={exercise.name} className="w-full h-full object-cover" />
        ) : (
             <Dumbbell className="w-6 h-6 text-zinc-500 opacity-50" />
        )}
    </div>
    
    <div className="flex-1 min-w-0">
      <h4 className="text-zinc-100 font-semibold text-sm leading-tight mb-1 truncate pr-2">
        {exercise.name}
      </h4>
      
      {isSimple ? (
        // Vista para Calentamiento/Cooldown
        <p className="text-xs text-zinc-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {exercise.durationOrReps || "A criterio"}
        </p>
      ) : (
        // Vista para Bloques Principales
        <div className="flex flex-wrap items-center gap-3 mt-1">
           <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
             <Layers className="w-3 h-3 text-lime-500" />
             <span className="font-bold">{exercise.sets}</span> Series
           </div>
           <div className="flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-300 border border-zinc-700">
             <Repeat className="w-3 h-3 text-lime-500" />
             <span className="font-bold">{exercise.targetReps}</span> Reps
           </div>
        </div>
      )}

      {exercise.notes && (
        <p className="text-xs text-zinc-500 mt-2 italic flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {exercise.notes}
        </p>
      )}
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---
const WorkoutOverview: React.FC<WorkoutOverviewProps> = ({ session }) => {
  const navigate = useNavigate();

  const handleStartSession = () => {
    console.log("Iniciando sesión...");
    navigate('/workout/player'); 
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-28">
      
      {/* 1. HEADER DE SESIÓN (Inalterado) */}
      <header className="relative pt-8 pb-6 px-6 bg-zinc-800 rounded-b-3xl border-b border-zinc-700 shadow-xl z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
             <p className="text-xs font-bold text-lime-500 uppercase tracking-wider mb-1">Sesión de Hoy</p>
             <h1 className="text-2xl font-bold text-white leading-tight max-w-[80%]">
               {session.sessionGoal || "Entrenamiento Personalizado"}
             </h1>
          </div>
          <div className="bg-zinc-700/50 p-2 rounded-lg">
            <Dumbbell className="w-6 h-6 text-zinc-400" />
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-zinc-400">
           <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
             <Clock className="w-4 h-4 text-lime-500" />
             {/* Duración Dinámica */}
             <span>{session.estimatedDurationMin || 60} min</span> 
           </div>
           
           <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-700/50">
             <Activity className={`w-4 h-4 ${
                 session.intensityLevel?.includes('Alta') ? 'text-red-500' : 
                 session.intensityLevel?.includes('Baja') ? 'text-blue-400' : 'text-orange-500'
             }`} />
             {/* Intensidad Dinámica */}
             <span>{session.intensityLevel || "Media"}</span>
           </div>
        </div>
      </header>

      <main className="px-5 py-6 space-y-2">
        
        {/* 2. CALENTAMIENTO (defaultOpen=false) */}
        <AccordionSection 
          title="Calentamiento" 
          icon={Flame} 
          defaultOpen={false} // Cambiado a False
          colorClass="text-orange-400 bg-orange-500/10"
        >
          {session.warmup.exercises.map((ex, idx) => (
            <ExerciseRow key={idx} exercise={ex} isSimple={true} />
          ))}
        </AccordionSection>

        {/* 3. BLOQUES PRINCIPALES */}
        {session.mainBlocks.map((block, index) => {
            const isComplex = block.blockType === 'superset' || block.blockType === 'circuit';
            const blockTitle = isComplex 
                ? `Bloque ${index + 1} (${block.blockType === 'superset' ? 'Superserie' : 'Circuito'})` 
                : `Bloque ${index + 1}`;

            return (
              <AccordionSection 
                key={`main-${index}`} 
                title={blockTitle} 
                icon={Dumbbell} 
                defaultOpen={false} // Cambiado a False
                colorClass={isComplex ? "text-purple-400 bg-purple-500/10" : "text-lime-400 bg-lime-500/10"}
              >
                <div className="relative">
                  {/* Línea visual para conectar ejercicios si es Superserie/Circuito */}
                  {isComplex && (
                    <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-zinc-700 rounded-full z-0"></div>
                  )}
                  
                  {block.exercises.map((ex, idx) => (
                    <div key={idx} className="relative z-10 bg-zinc-900 mb-3 last:mb-0 rounded-xl p-2 border border-zinc-800/50 shadow-sm">
                       <ExerciseRow exercise={ex} />
                    </div>
                  ))}
                </div>
                
                {/* Footer del Bloque (Descansos) */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500 bg-zinc-950/30 p-2 rounded-lg border border-zinc-800 border-dashed">
                   <Clock className="w-3.5 h-3.5" />
                   <span>Descanso entre series: <strong className="text-zinc-300">{block.restBetweenSetsSec}s</strong></span>
                </div>
              </AccordionSection>
            );
        })}

        {/* 4. BLOQUE DE CORE (NUEVO) */}
        {session.coreBlocks && session.coreBlocks.length > 0 && (
            <AccordionSection 
                title="Bloque de Core" 
                icon={Layers3} // Usamos un ícono dedicado para Core
                defaultOpen={false} // Cerrado por defecto
                colorClass="text-yellow-400 bg-yellow-500/10"
            >
                {session.coreBlocks.map((block, index) => (
                    <div key={`core-${index}`} className="relative mb-4">
                        <p className="text-xs text-zinc-400 font-medium mb-2">Rutina de Estabilidad {index + 1}</p>
                        {block.exercises.map((ex, idx) => (
                           <div key={idx} className="relative z-10 bg-zinc-900 mb-3 last:mb-0 rounded-xl p-2 border border-zinc-800/50 shadow-sm">
                               <ExerciseRow exercise={ex} />
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

        {/* 5. VUELTA A LA CALMA (defaultOpen=false) */}
        <AccordionSection 
          title="Vuelta a la Calma" 
          icon={Wind} 
          defaultOpen={false} // Cambiado a False
          colorClass="text-cyan-400 bg-cyan-500/10"
        >
          {session.cooldown.exercises.map((ex, idx) => (
            <ExerciseRow key={idx} exercise={ex} isSimple={true} />
          ))}
        </AccordionSection>

      </main>

      {/* 6. STICKY FOOTER - BOTÓN DE INICIO (Inalterado) */}
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