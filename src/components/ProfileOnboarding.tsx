import React, { useState, useMemo } from 'react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore'; 
import { 
  Dumbbell, 
  Calendar, 
  Activity, 
  Scale, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  Info
} from 'lucide-react';

// --- TIPOS Y CONSTANTES ---

interface EquipmentDetail {
    key: string; 
    name: string;
    imagePath: string;
    description: string;
    isWeightBased: boolean;
    weightOptions?: number[]; 
}

// Lista detallada de equipo que el usuario puede tener en casa
const homeEquipmentList: EquipmentDetail[] = [
    {
        key: 'mancuernas',
        name: 'Mancuernas (Dumbbells)',
        imagePath: '/man_cuernas.jpeg', 
        description: 'Pesos libres esenciales.',
        isWeightBased: true,
        weightOptions: [2, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 30, 35, 40],
    },
    {
        key: 'ketlebells',
        name: 'Pesas Rusas (Kettlebells)',
        imagePath: '/ketlebells.jpeg',
        description: 'Herramienta versátil para potencia y cardio.',
        isWeightBased: true,
        weightOptions: [4, 6, 8, 12, 16, 20, 24, 28, 32],
    },
    {
        key: 'barra-dominadas',
        name: 'Barra de Dominadas',
        imagePath: '/barra_pullup.jpeg', 
        description: 'Fundamental para espalda y bíceps.',
        isWeightBased: false,
    },
    {
        key: 'mini-bands',
        name: 'Mini Bandas de Resistencia',
        imagePath: '/mini_bands.jpeg',
        description: 'Bandas de loop para glúteos y activación.',
        isWeightBased: false,
    },
    {
        key: 'handle-bands',
        name: 'Bandas Elásticas con Asas',
        imagePath: '/handle_bands.jpeg',
        description: 'Alternativa a las mancuernas.',
        isWeightBased: false,
    },
    {
        key: 'foam-roller',
        name: 'Rodillo de Espuma',
        imagePath: '/foam_roller.jpeg',
        description: 'Para recuperación y movilidad.',
        isWeightBased: false,
    },
    {
        key: 'barra-pesos',
        name: 'Barra de Pesos Libres',
        imagePath: '/barra_pesos.jpeg',
        description: 'Barra larga (Olímpica o estándar).',
        isWeightBased: true,
        weightOptions: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100], // Discos totales aprox
    },
    {
        key: 'banco',
        name: 'Banco de Pesas',
        imagePath: '/bench.jpeg',
        description: 'Banco plano o ajustable para press.',
        isWeightBased: false,
    }
];

const trainingLocationOptions = [
    'Gimnasio (Máquinas y Pesos Libres)',
    'En Casa (Con Equipo Limitado)',
    'En Casa (Solo Peso Corporal)',
];

const goals = [
    'Ganancia Muscular', 
    'Pérdida de Grasa / Definición', 
    'Fuerza',
    'Salud General / Mantenimiento'
];

const experienceLevels = [
    { value: 'Principiante', label: 'Principiante (0-1 año)', desc: 'Prioridad: Técnica y hábito.' },
    { value: 'Intermedio', label: 'Intermedio (1-3 años)', desc: 'Prioridad: Carga progresiva.' },
    { value: 'Avanzado', label: 'Avanzado (3+ años)', desc: 'Prioridad: Especialización e intensidad.' }
];

const genderOptions = ['Masculino', 'Femenino', 'Prefiero no decir'];

interface DayContext {
    day: string;
    canTrain: boolean;
    externalLoad: 'none' | 'low' | 'medium' | 'high' | 'extreme'; 
}

const DAYS_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

interface ProfileOnboardingProps {
  user: User;
  db: Firestore;
}

const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ user }) => {
    // --- ESTADOS ---
     // Para futura paginación si quisieras, hoy todo en 1
    
    // Personal
    const [name, setName] = useState(user.displayName || '');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState(''); 
    const [height, setHeight] = useState(''); 
    const [weight, setWeight] = useState('');
    
    // Perfil Fitness
    const [goal, setGoal] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [focusArea, setFocusArea] = useState(''); 
    const [injuries, setInjuries] = useState(''); 

    // Logística
    const [trainingLocation, setTrainingLocation] = useState('');
    const [homeEquipmentSelections, setHomeEquipmentSelections] = useState<string[]>([]);
    const [weeklySchedule, setWeeklySchedule] = useState<DayContext[]>(
        DAYS_ORDER.map(d => ({ day: d, canTrain: false, externalLoad: 'none' }))
    );

    // UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- HELPERS ---

    const updateDayContext = (day: string, field: keyof DayContext, value: any) => {
        setWeeklySchedule(prev => prev.map(d => d.day === day ? { ...d, [field]: value } : d));
    };

    const trainingDaysCount = useMemo(() => weeklySchedule.filter(d => d.canTrain).length, [weeklySchedule]);

    const handleDetailedEquipmentChange = (equipmentName: string, weightVal?: number | null) => {
        const baseKey = equipmentName;
        // Si es un peso específico: "Mancuernas (Dumbbells) (10kg)"
        // Si es el item base: "Mancuernas (Dumbbells)"
        const keyToAdd = weightVal ? `${equipmentName} (${weightVal}kg)` : equipmentName;
        
        setHomeEquipmentSelections(prev => {
            const exists = prev.includes(keyToAdd);
            if (exists) {
                return prev.filter(item => item !== keyToAdd);
            } else {
                // Si selecciono un peso, aseguro que el padre también esté (opcional, pero bueno para lógica)
                if (weightVal && !prev.includes(baseKey)) {
                    return [...prev, baseKey, keyToAdd];
                }
                return [...prev, keyToAdd];
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!BACKEND_URL) {
            setError("Error técnico: Falta configuración del servidor (VITE_BACKEND_URL).");
            setIsLoading(false);
            return;
        }

        // VALIDACIONES
        if (!name || !age || !weight || !height || !gender || !goal || !experienceLevel || !trainingLocation) {
            setError("Por favor completa todos los campos obligatorios.");
            setIsLoading(false);
            return;
        }

        if (trainingDaysCount === 0) {
            setError("Debes seleccionar al menos 1 día para entrenar.");
            setIsLoading(false);
            return;
        }

        let finalEquipment: string[] = [];
        if (trainingLocation === 'En Casa (Con Equipo Limitado)') {
            if (homeEquipmentSelections.length === 0) {
                setError("Selecciona qué equipo tienes en casa.");
                setIsLoading(false);
                return;
            }
            finalEquipment = [trainingLocation, ...homeEquipmentSelections];
        } else {
            finalEquipment = [trainingLocation];
        }

        try {
            const idToken = await user.getIdToken();
            const preferredDaysList = weeklySchedule.filter(d => d.canTrain).map(d => d.day);

            const payload = {
                userId: user.uid,
                userEmail: user.email,
                profileData: {
                    name: name.trim(),
                    age: parseInt(age),
                    gender,
                    heightCm: parseInt(height),
                    initialWeight: parseFloat(weight),
                    fitnessGoal: goal,
                    experienceLevel,
                    focusArea: focusArea || 'General',
                    injuriesOrLimitations: injuries || 'Ninguna',
                    trainingDaysPerWeek: trainingDaysCount,
                    preferredTrainingDays: preferredDaysList,
                    weeklyScheduleContext: weeklySchedule,
                    availableEquipment: finalEquipment,
                    location: trainingLocation,
                    dateCompleted: new Date().toISOString()
                }
            };

            const res = await fetch(`${BACKEND_URL}/api/profile/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al guardar perfil.");

            // Éxito: Recargar o redirigir (lo maneja el padre usualmente, o navegación aquí)
            window.location.reload(); 

        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex justify-center items-start pt-10 pb-20 px-4">
            <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
                
                {/* Header */}
                <div className="bg-zinc-800/50 p-8 border-b border-zinc-800 text-center">
                    <div className="w-16 h-16 bg-lime-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserIcon className="w-8 h-8 text-lime-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Configuración del Atleta</h1>
                    <p className="text-zinc-400 text-sm max-w-md mx-auto">
                        Para diseñar un plan de nivel élite, necesitamos conocer tu contexto, equipo y limitaciones.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-10">
                    
                    {/* 1. DATOS BIOMÉTRICOS */}
                    <section>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <Activity className="w-5 h-5 text-lime-500" /> 
                            Datos Biométricos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Nombre</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none" placeholder="Tu nombre" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Edad</label>
                                        <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none" placeholder="Años" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">Género</label>
                                        <select value={gender} onChange={e => setGender(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none">
                                            <option value="">Seleccionar</option>
                                            {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Peso (kg)</label>
                                    <div className="relative">
                                        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none pl-10" placeholder="75.5" />
                                        <Scale className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">Estatura (cm)</label>
                                    <div className="relative">
                                        <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none pl-10" placeholder="175" />
                                        <Activity className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. PERFIL DE ENTRENAMIENTO */}
                    <section className="border-t border-zinc-800 pt-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <Dumbbell className="w-5 h-5 text-lime-500" /> 
                            Perfil de Entrenamiento
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Objetivo Principal</label>
                                <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none">
                                    <option value="">Selecciona tu meta</option>
                                    {goals.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Nivel de Experiencia</label>
                                <select value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none">
                                    <option value="">Selecciona tu nivel</option>
                                    {experienceLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                                {experienceLevel && (
                                    <p className="text-xs text-lime-400 mt-2 ml-1">
                                        {experienceLevels.find(l => l.value === experienceLevel)?.desc}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Áreas de Enfoque (Opcional)</label>
                                <input type="text" value={focusArea} onChange={e => setFocusArea(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none" placeholder="Ej: Glúteos, Hombros, Pectoral..." />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-red-400 mb-1">Lesiones o Limitaciones</label>
                                <textarea value={injuries} onChange={e => setInjuries(e.target.value)} rows={2} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-red-500 focus:outline-none" placeholder="Ej: Dolor en rodilla izquierda al saltar, no puedo hacer press militar..." />
                            </div>
                        </div>
                    </section>

                    {/* 3. CONTEXTO SEMANAL (EL CEREBRO) */}
                    <section className="border-t border-zinc-800 pt-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-2">
                            <Calendar className="w-5 h-5 text-lime-500" /> 
                            Planificación Inteligente
                        </h3>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-6 flex gap-3 items-start">
                            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-200">
                                El algoritmo ajustará la intensidad basándose en tu vida diaria. Si tienes un trabajo físico o juegas fútbol el sábado, márcalo como "Carga Alta/Extrema" para que el entrenador te dé descanso previo.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {weeklySchedule.map((dayCtx) => (
                                <div key={dayCtx.day} className={`group p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${dayCtx.canTrain ? 'bg-zinc-800 border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.1)]' : 'bg-zinc-900 border-zinc-800 opacity-70 hover:opacity-100'}`}>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="relative flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id={`check-${dayCtx.day}`}
                                                checked={dayCtx.canTrain}
                                                onChange={(e) => updateDayContext(dayCtx.day, 'canTrain', e.target.checked)}
                                                className="peer w-6 h-6 bg-zinc-700 border-zinc-600 rounded text-lime-500 focus:ring-lime-500 cursor-pointer"
                                            />
                                        </div>
                                        <label htmlFor={`check-${dayCtx.day}`} className="cursor-pointer">
                                            <p className={`font-bold ${dayCtx.canTrain ? 'text-white' : 'text-zinc-500'}`}>{dayCtx.day}</p>
                                            <p className="text-xs text-zinc-500">{dayCtx.canTrain ? 'Día de Entrenamiento' : 'Descanso'}</p>
                                        </label>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Carga Externa</label>
                                        <select 
                                            value={dayCtx.externalLoad}
                                            onChange={(e) => updateDayContext(dayCtx.day, 'externalLoad', e.target.value)}
                                            className={`text-xs p-2 rounded-lg border focus:outline-none cursor-pointer ${
                                                dayCtx.externalLoad === 'none' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' :
                                                dayCtx.externalLoad === 'low' ? 'bg-blue-900/30 border-blue-800 text-blue-300' :
                                                dayCtx.externalLoad === 'medium' ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300' :
                                                dayCtx.externalLoad === 'high' ? 'bg-orange-900/30 border-orange-800 text-orange-300' :
                                                'bg-red-900/30 border-red-800 text-red-300 font-bold'
                                            }`}
                                        >
                                            <option value="none">Baja (Oficina/Casa)</option>
                                            <option value="low">Leve (Caminatas)</option>
                                            <option value="medium">Media (Trabajo de pie)</option>
                                            <option value="high">Alta (Trabajo físico)</option>
                                            <option value="extreme">Extrema (Partido/Competición)</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. EQUIPAMIENTO */}
                    <section className="border-t border-zinc-800 pt-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <Scale className="w-5 h-5 text-lime-500" /> 
                            Lugar y Equipo
                        </h3>
                        
                        <div className="mb-6">
                            <label className="block text-xs font-medium text-zinc-400 mb-2">¿Dónde entrenarás?</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {trainingLocationOptions.map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setTrainingLocation(opt)}
                                        className={`p-3 rounded-lg border text-sm font-medium transition-all text-left ${trainingLocation === opt ? 'bg-lime-500/10 border-lime-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {trainingLocation === 'En Casa (Con Equipo Limitado)' && (
                            <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700/50">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-lime-500" /> 
                                    Inventario Detallado
                                </h4>
                                <p className="text-xs text-zinc-400 mb-4">Marca exactamente lo que tienes. Si tienes mancuernas, selecciona los pesos para que la IA te diga "Usa las de 10kg".</p>
                                
                                <div className="space-y-3">
                                    {homeEquipmentList.map((item) => {
                                        const isSelected = homeEquipmentSelections.some(s => s.startsWith(item.name));
                                        
                                        return (
                                            <div key={item.key} className={`p-4 rounded-lg border transition-all ${isSelected ? 'bg-zinc-800 border-lime-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                                                <div className="flex items-start gap-4">
                                                    {/* Imagen con fallback */}
                                                    <div className="w-12 h-12 bg-zinc-950 rounded-lg shrink-0 overflow-hidden border border-zinc-700">
                                                        <img 
                                                            src={item.imagePath} 
                                                            alt={item.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => e.currentTarget.style.display = 'none'}
                                                        />
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <input 
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => handleDetailedEquipmentChange(item.name, null)}
                                                                className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-lime-500 focus:ring-lime-500"
                                                            />
                                                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}>{item.name}</span>
                                                        </div>
                                                        <p className="text-xs text-zinc-500 mb-3">{item.description}</p>

                                                        {/* Selector de Pesos */}
                                                        {isSelected && item.isWeightBased && item.weightOptions && (
                                                            <div className="mt-3 pt-3 border-t border-zinc-700/50 animate-in slide-in-from-top-2">
                                                                <p className="text-xs text-lime-400 font-bold mb-2 uppercase tracking-wider">Pesos disponibles (kg):</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {item.weightOptions.map(w => {
                                                                        const wKey = `${item.name} (${w}kg)`;
                                                                        const wSelected = homeEquipmentSelections.includes(wKey);
                                                                        return (
                                                                            <button
                                                                                key={w}
                                                                                type="button"
                                                                                onClick={() => handleDetailedEquipmentChange(item.name, w)}
                                                                                className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                                                                                    wSelected 
                                                                                    ? 'bg-lime-500 text-zinc-900 font-bold border-lime-500' 
                                                                                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                                                                }`}
                                                                            >
                                                                                {w}kg
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ERROR & SUBMIT */}
                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Guardando Perfil...' : 'Generar Plan Maestro'}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ProfileOnboarding;