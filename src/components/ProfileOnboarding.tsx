import React, { useState, useMemo, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
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
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { 
  ExternalLoad, 
  FitnessGoal, 
  ExperienceLevel as ExpLevel,
  FocusArea as FocusAreaType,
  InjuryType,
  DayOfWeek
} from '../types/session';

// --- TIPOS Y CONSTANTES (Sin Modificación) ---

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

// Opciones de objetivo según la API V2
const goals: { value: FitnessGoal; label: string; desc: string }[] = [
    { value: 'Hipertrofia', label: 'Hipertrofia (Ganancia Muscular)', desc: 'Rangos medios (6-12 reps), descansos medios' },
    { value: 'Fuerza', label: 'Fuerza Máxima', desc: 'Rangos bajos (3-6 reps), descansos largos' },
    { value: 'Resistencia', label: 'Resistencia Muscular', desc: 'Rangos altos (12-20 reps), descansos cortos' },
    { value: 'Perdida_Grasa', label: 'Pérdida de Grasa / Definición', desc: 'Circuitos, descansos cortos, mayor densidad' }
];

const experienceLevels: { value: ExpLevel; label: string; desc: string }[] = [
    { value: 'Principiante', label: 'Principiante (0-12 meses)', desc: 'Menos volumen, ejercicios simples, tempo controlado.' },
    { value: 'Intermedio', label: 'Intermedio (1-3 años)', desc: 'Volumen y complejidad media.' },
    { value: 'Avanzado', label: 'Avanzado (3+ años)', desc: 'Mayor volumen, técnicas avanzadas, ejercicios complejos.' }
];

const genderOptions = ['Masculino', 'Femenino', 'Otro'];

// Opciones de área de enfoque según la API V2
const focusAreaOptions: { value: FocusAreaType; label: string }[] = [
    { value: 'General', label: 'General (Balanceado)' },
    { value: 'Tren_Superior', label: 'Tren Superior (Pecho, Espalda, Hombros, Brazos)' },
    { value: 'Tren_Inferior', label: 'Tren Inferior (Piernas y Glúteos)' },
    { value: 'Core', label: 'Core (Énfasis en trabajo abdominal)' }
];

// Opciones de lesiones según la API V2
const injuryOptions: InjuryType[] = [
    'Ninguna',
    'Hombro',
    'Rodilla',
    'Espalda Baja',
    'Muñeca',
    'Cuello',
    'Cadera',
    'Tobillo',
    'Codo'
];

interface DayContextLocal {
    day: DayOfWeek;
    canTrain: boolean;
    externalLoad: ExternalLoad; 
}

const DAYS_ORDER: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// 📌 Interfaz para la precarga (la estructura que viene de Firestore)
interface UserProfile {
    profileData?: {
        name: string;
        age: number;
        gender: string;
        heightCm: number;
        initialWeight: number;
        fitnessGoal: string;
        experienceLevel: string;
        focusArea: string;
        injuriesOrLimitations: string;
        trainingDaysPerWeek: number;
        preferredTrainingDays: string[];
        weeklyScheduleContext: DayContextLocal[];
        homeEquipment: string[];
        hasHomeEquipment: boolean;
        [key: string]: any;
    };
    name?: string; 
    [key: string]: any;
}

interface ProfileOnboardingProps {
  user: User;
  db: Firestore;
  initialData?: UserProfile; // <-- Prop para precargar datos en edición
}

const ProfileOnboarding: React.FC<ProfileOnboardingProps> = ({ user, initialData }) => {
    // --- ESTADOS ---

    const navigate = useNavigate();
    
    // Personal
    const [name, setName] = useState(user.displayName || '');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState(''); 
    const [height, setHeight] = useState(''); 
    const [weight, setWeight] = useState('');
    
    // Perfil Fitness
    const [goal, setGoal] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('');
    const [focusArea, setFocusArea] = useState<FocusAreaType>('General'); 
    const [injuries, setInjuries] = useState<InjuryType>('Ninguna'); 

    // Logística
    const [hasHomeEquipment, setHasHomeEquipment] = useState(false); // Si tiene equipo en casa
    const [homeEquipmentSelections, setHomeEquipmentSelections] = useState<string[]>([]);
    const [weeklySchedule, setWeeklySchedule] = useState<DayContextLocal[]>(
        // Inicializar 'externalLoad' en 'none' como valor por defecto
        DAYS_ORDER.map(d => ({ day: d, canTrain: false, externalLoad: 'none' as ExternalLoad })) 
    );

    // UI
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

    // 📌 EFECTO PARA PRE-CARGAR DATOS EN MODO EDICIÓN
    useEffect(() => {
        // Solo carga si initialData existe Y tiene el objeto profileData completo (modo edición)
        if (!initialData || !initialData.profileData) return;
        
        const profile = initialData.profileData;
        
        // 1. Cargar Datos Biométricos
        if (profile.name) setName(profile.name);
        if (profile.age) setAge(String(profile.age));
        if (profile.gender) setGender(profile.gender);
        if (profile.heightCm) setHeight(String(profile.heightCm));
        if (profile.initialWeight) setWeight(String(profile.initialWeight));

        // 2. Cargar Perfil de Entrenamiento
        if (profile.fitnessGoal) setGoal(profile.fitnessGoal);
        if (profile.experienceLevel) setExperienceLevel(profile.experienceLevel);
        if (profile.focusArea) setFocusArea(profile.focusArea as FocusAreaType);
        if (profile.injuriesOrLimitations) setInjuries(profile.injuriesOrLimitations as InjuryType);

        // 3. Cargar Equipo en Casa
        if (profile.homeEquipment && profile.homeEquipment.length > 0) {
            setHasHomeEquipment(true);
            setHomeEquipmentSelections(profile.homeEquipment);
        }
        
        // 4. Cargar Contexto Semanal
        if (profile.weeklyScheduleContext && profile.weeklyScheduleContext.length === DAYS_ORDER.length) {
             // Mapeamos para asegurar que el orden sea correcto y manejamos el tipado
             const sortedSchedule: DayContextLocal[] = DAYS_ORDER.map(dayName => 
                 profile.weeklyScheduleContext.find(d => d.day === dayName) || 
                 { day: dayName, canTrain: false, externalLoad: 'none' as ExternalLoad } // Fallback seguro
             );
            setWeeklySchedule(sortedSchedule);
        }

    }, [initialData]);

    // --- HELPERS ---

    const updateDayContext = (day: string, field: keyof DayContextLocal, value: any) => {
        setWeeklySchedule(prev => prev.map(d => d.day === day ? { ...d, [field]: value } : d));
    };

    const trainingDaysCount = useMemo(() => weeklySchedule.filter(d => d.canTrain).length, [weeklySchedule]);
    
    // NUEVO: Verifica que todos los días tengan una carga externa seleccionada.
    const areAllLoadsSelected = useMemo(() => {
        return weeklySchedule.every(d => d.externalLoad !== undefined);
    }, [weeklySchedule]);


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
        setValidationErrors({});
        setIsLoading(true);

        // VALIDACIONES CON MARCADO VISUAL
        const errors: Record<string, boolean> = {};
        let firstErrorField: string | null = null;

        if (!name || name.trim() === '') {
            errors.name = true;
            if (!firstErrorField) firstErrorField = 'name';
        }
        if (!age || parseInt(age) < 15 || parseInt(age) > 100) {
            errors.age = true;
            if (!firstErrorField) firstErrorField = 'age';
        }
        if (!weight || parseFloat(weight) < 30 || parseFloat(weight) > 300) {
            errors.weight = true;
            if (!firstErrorField) firstErrorField = 'weight';
        }
        if (!height || parseInt(height) < 120 || parseInt(height) > 250) {
            errors.height = true;
            if (!firstErrorField) firstErrorField = 'height';
        }
        if (!gender) {
            errors.gender = true;
            if (!firstErrorField) firstErrorField = 'gender';
        }
        if (!goal) {
            errors.goal = true;
            if (!firstErrorField) firstErrorField = 'goal';
        }
        if (!experienceLevel) {
            errors.experienceLevel = true;
            if (!firstErrorField) firstErrorField = 'experienceLevel';
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setError("Por favor completa todos los campos obligatorios marcados en rojo.");
            setIsLoading(false);
            
            // Scroll al primer campo con error
            if (firstErrorField) {
                const element = document.getElementById(`field-${firstErrorField}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => element.focus(), 500);
                }
            }
            return;
        }
        
        // VALIDACIÓN DE CARGA EXTERNA
        if (!areAllLoadsSelected) {
            setError("Debes especificar la carga externa (Actividad diaria) para **todos** los días de la semana (Lunes a Domingo).");
            setIsLoading(false);
            // Scroll a la sección de schedule
            const scheduleSection = document.getElementById('weekly-schedule-section');
            if (scheduleSection) {
                scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        if (trainingDaysCount === 0) {
            setError("Debes seleccionar al menos 1 día para entrenar.");
            setIsLoading(false);
            const scheduleSection = document.getElementById('weekly-schedule-section');
            if (scheduleSection) {
                scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }
        
        // Validar que los días de entrenamiento sean entre 2 y 6
        if (trainingDaysCount < 2 || trainingDaysCount > 6) {
            setError("Debes seleccionar entre 2 y 6 días de entrenamiento por semana.");
            setIsLoading(false);
            const scheduleSection = document.getElementById('weekly-schedule-section');
            if (scheduleSection) {
                scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        // Equipo en casa es opcional
        let finalEquipment: string[] = [];
        if (hasHomeEquipment) {
            if (homeEquipmentSelections.length === 0) {
                setError("Indicaste que tienes equipo en casa. Por favor selecciona cuál o desmarca la opción.");
                setIsLoading(false);
                return;
            }
            finalEquipment = homeEquipmentSelections;
        }
        
        // 📌 NUEVA LÓGICA: Determinar si es modo edición
        const isEditMode = initialData && initialData.profileData; 
        // Define la acción para el backend
        const actionType = isEditMode 
            ? 'profile_update_and_invalidate_plan' 
            : 'initial_onboarding_complete';


        try {
            const idToken = await user.getIdToken();
            const preferredDaysList = weeklySchedule.filter(d => d.canTrain).map(d => d.day);

            const payload = {
                userId: user.uid,
                userEmail: user.email,
                // 📌 CAMBIO CLAVE: Incluir la acción para el backend
                action: actionType, 
                profileData: {
                    name: name.trim(),
                    age: parseInt(age),
                    gender,
                    heightCm: parseInt(height),
                    initialWeight: parseFloat(weight),
                    fitnessGoal: goal as FitnessGoal,
                    experienceLevel: experienceLevel as ExpLevel,
                    focusArea: (focusArea || 'General') as FocusAreaType,
                    injuriesOrLimitations: injuries || 'Ninguna',
                    trainingDaysPerWeek: trainingDaysCount,
                    preferredTrainingDays: preferredDaysList,
                    weeklyScheduleContext: weeklySchedule,
                    availableEquipment: finalEquipment, // ⚠️ Campo requerido por el backend
                    hasHomeEquipment, // Boolean para saber si tiene equipo en casa
                    dateCompleted: new Date().toISOString()
                }
            };

            console.log('📤 Enviando payload al backend:', JSON.stringify(payload, null, 2));

            const res = await authenticatedFetch(API_ENDPOINTS.USER_PROFILE_SAVE, idToken, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            
            if (!res.ok) {
                console.error('❌ Error del servidor:', data);
                console.error('📊 Status:', res.status);
                console.error('📦 Payload enviado (JSON):');
                console.error(JSON.stringify(payload, null, 2));
                console.error('📋 ProfileData específico:');
                console.error(JSON.stringify(payload.profileData, null, 2));
                
                // Verificar campos específicos
                console.error('🔍 Verificación de campos:');
                console.error('- userId:', payload.userId);
                console.error('- userEmail:', payload.userEmail);
                console.error('- action:', payload.action);
                console.error('- profileData existe:', !!payload.profileData);
                if (payload.profileData) {
                    console.error('  - name:', payload.profileData.name);
                    console.error('  - age:', payload.profileData.age);
                    console.error('  - gender:', payload.profileData.gender);
                    console.error('  - heightCm:', payload.profileData.heightCm);
                    console.error('  - initialWeight:', payload.profileData.initialWeight);
                    console.error('  - fitnessGoal:', payload.profileData.fitnessGoal);
                    console.error('  - experienceLevel:', payload.profileData.experienceLevel);
                    console.error('  - focusArea:', payload.profileData.focusArea);
                    console.error('  - injuriesOrLimitations:', payload.profileData.injuriesOrLimitations);
                    console.error('  - trainingDaysPerWeek:', payload.profileData.trainingDaysPerWeek);
                    console.error('  - preferredTrainingDays:', payload.profileData.preferredTrainingDays);
                    console.error('  - weeklyScheduleContext:', payload.profileData.weeklyScheduleContext);
                    console.error('  - availableEquipment:', payload.profileData.availableEquipment);
                    console.error('  - hasHomeEquipment:', payload.profileData.hasHomeEquipment);
                }
                
                throw new Error(data.error || "Error al guardar perfil.");
            }

            console.log('✅ Perfil guardado exitosamente:', data);
            
            // Éxito: Recargar o redirigir (App.tsx detectará el cambio de estado/invalidez del plan)
            window.location.reload();

            navigate('/', { replace: true });

        } catch (err) {
            console.error(err);
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper para obtener clases de error
    const getInputClasses = (fieldName: string, baseClasses: string) => {
        if (validationErrors[fieldName]) {
            return `${baseClasses} border-red-500 ring-2 ring-red-500/50`;
        }
        return baseClasses;
    };

    // Determinar si el botón debe estar deshabilitado
    const isSubmitDisabled = isLoading || !areAllLoadsSelected;
    
    // Mensaje para el botón si está deshabilitado
    let disabledButtonText = 'Generar Plan Maestro';
    if (isLoading) {
        disabledButtonText = 'Guardando Perfil...';
    } else if (!areAllLoadsSelected) {
        disabledButtonText = 'Selecciona la Carga Externa de todos los días';
    }
    
    
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
                    
                    {/* 1. DATOS BIOMÉTRICOS (Sin Modificación) */}
                    <section>
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <Activity className="w-5 h-5 text-lime-500" /> 
                            Datos Biométricos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                                        Nombre {validationErrors.name && <span className="text-red-400">*Requerido</span>}
                                    </label>
                                    <input 
                                        id="field-name"
                                        type="text" 
                                        value={name} 
                                        onChange={e => {
                                            setName(e.target.value);
                                            if (validationErrors.name) {
                                                setValidationErrors(prev => ({ ...prev, name: false }));
                                            }
                                        }} 
                                        className={getInputClasses('name', 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none')} 
                                        placeholder="Tu nombre" 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                                            Edad {validationErrors.age && <span className="text-red-400">*Requerido</span>}
                                        </label>
                                        <input 
                                            id="field-age"
                                            type="number" 
                                            value={age} 
                                            onChange={e => {
                                                setAge(e.target.value);
                                                if (validationErrors.age) {
                                                    setValidationErrors(prev => ({ ...prev, age: false }));
                                                }
                                            }} 
                                            className={getInputClasses('age', 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none')} 
                                            placeholder="Años" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                                            Género {validationErrors.gender && <span className="text-red-400">*Requerido</span>}
                                        </label>
                                        <select 
                                            id="field-gender"
                                            value={gender} 
                                            onChange={e => {
                                                setGender(e.target.value);
                                                if (validationErrors.gender) {
                                                    setValidationErrors(prev => ({ ...prev, gender: false }));
                                                }
                                            }} 
                                            className={getInputClasses('gender', 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none')}
                                        >
                                            <option value="">Seleccionar</option>
                                            {genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                                        Peso (kg) {validationErrors.weight && <span className="text-red-400">*Requerido</span>}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            id="field-weight"
                                            type="number" 
                                            value={weight} 
                                            onChange={e => {
                                                setWeight(e.target.value);
                                                if (validationErrors.weight) {
                                                    setValidationErrors(prev => ({ ...prev, weight: false }));
                                                }
                                            }} 
                                            className={getInputClasses('weight', 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none pl-10')} 
                                            placeholder="75.5" 
                                        />
                                        <Scale className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                                        Estatura (cm) {validationErrors.height && <span className="text-red-400">*Requerido</span>}
                                    </label>
                                    <div className="relative">
                                        <input 
                                            id="field-height"
                                            type="number" 
                                            value={height} 
                                            onChange={e => {
                                                setHeight(e.target.value);
                                                if (validationErrors.height) {
                                                    setValidationErrors(prev => ({ ...prev, height: false }));
                                                }
                                            }} 
                                            className={getInputClasses('height', 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none pl-10')} 
                                            placeholder="175" 
                                        />
                                        <Activity className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. PERFIL DE ENTRENAMIENTO (Sin Modificación) */}
                    <section className="border-t border-zinc-800 pt-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                            <Dumbbell className="w-5 h-5 text-lime-500" /> 
                            Perfil de Entrenamiento
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Objetivo Principal {validationErrors.goal && <span className="text-red-400">*Requerido</span>}
                                </label>
                                <select 
                                    id="field-goal"
                                    value={goal} 
                                    onChange={e => {
                                        setGoal(e.target.value);
                                        if (validationErrors.goal) {
                                            setValidationErrors(prev => ({ ...prev, goal: false }));
                                        }
                                    }} 
                                    className={getInputClasses('goal', 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none')}
                                >
                                    <option value="">Selecciona tu meta</option>
                                    {goals.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Nivel de Experiencia {validationErrors.experienceLevel && <span className="text-red-400">*Requerido</span>}
                                </label>
                                <select 
                                    id="field-experienceLevel"
                                    value={experienceLevel} 
                                    onChange={e => {
                                        setExperienceLevel(e.target.value);
                                        if (validationErrors.experienceLevel) {
                                            setValidationErrors(prev => ({ ...prev, experienceLevel: false }));
                                        }
                                    }} 
                                    className={getInputClasses('experienceLevel', 'w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none')}
                                >
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1">Área de Enfoque</label>
                                <select value={focusArea} onChange={e => setFocusArea(e.target.value as FocusAreaType)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-lime-500 focus:outline-none">
                                    <option value="">Selecciona un enfoque</option>
                                    {focusAreaOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                                <p className="text-xs text-zinc-500 mt-2 ml-1">Define qué área del cuerpo priorizar.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-red-400 mb-1">Lesiones o Limitaciones</label>
                                <select value={injuries} onChange={e => setInjuries(e.target.value as InjuryType)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:border-red-500 focus:outline-none">
                                    {injuryOptions.map(inj => <option key={inj} value={inj}>{inj}</option>)}
                                </select>
                                <p className="text-xs text-zinc-500 mt-2 ml-1">El algoritmo evitará ejercicios que afecten esta zona.</p>
                            </div>
                        </div>
                    </section>

                    {/* 3. CONTEXTO SEMANAL (EL CEREBRO) - MODIFICADO */}
                    <section id="weekly-schedule-section" className="border-t border-zinc-800 pt-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-2">
                            <Calendar className="w-5 h-5 text-lime-500" /> 
                            Planificación Inteligente
                        </h3>
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-4 flex gap-3 items-start">
                            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-blue-200">
                                El algoritmo ajustará la intensidad basándose en tu vida diaria. Si tienes un trabajo físico o juegas fútbol el sábado, márcalo como "Carga Alta/Extrema" para que el entrenador te dé descanso previo.
                            </p>
                        </div>
                        
                        {/* NUEVA NOTA OBLIGATORIA */}
                        <div className={`p-3 rounded-lg mb-6 flex gap-2 items-start ${areAllLoadsSelected ? 'bg-lime-500/10 border border-lime-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                             <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${areAllLoadsSelected ? 'text-lime-400' : 'text-red-400'}`} />
                            <p className={`text-xs font-medium ${areAllLoadsSelected ? 'text-lime-200' : 'text-red-200'}`}>
                                **Atención:** Debes seleccionar una **Carga Externa** para **TODOS** los días (Lunes a Domingo), entrenes o no.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {weeklySchedule.map((dayCtx) => (
                                <div key={dayCtx.day} className={`group p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between ${dayCtx.canTrain ? 'bg-zinc-800 border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.1)]' : 'bg-zinc-900 border-zinc-800 opacity-70 hover:opacity-100'}`}>
                                    
                                    {/* Contenedor del Checkbox y Día */}
                                    <div className="flex items-center gap-4 w-full sm:w-auto"> 
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

                                    {/* Contenedor del Select - Ajustado para móvil */}
                                    <div className="mt-3 sm:mt-0 flex flex-col items-start sm:items-end min-w-[150px]"> 
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Carga Externa</label>
                                        <select 
                                            value={dayCtx.externalLoad}
                                            onChange={(e) => updateDayContext(dayCtx.day, 'externalLoad', e.target.value as ExternalLoad)}
                                            className={`text-xs p-2 rounded-lg border focus:outline-none cursor-pointer w-full sm:w-auto ${
                                                dayCtx.externalLoad === 'none' ? 'bg-zinc-800 border-zinc-700 text-zinc-400' :
                                                dayCtx.externalLoad === 'light' ? 'bg-blue-900/30 border-blue-800 text-blue-300' :
                                                dayCtx.externalLoad === 'moderate' ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300' :
                                                'bg-orange-900/30 border-orange-800 text-orange-300'
                                            }`}
                                        >
                                            <option value="none">Sin carga (Oficina/Casa)</option>
                                            <option value="light">Ligera (Caminatas, yoga)</option>
                                            <option value="moderate">Moderada (Deportes recreativos)</option>
                                            <option value="heavy">Alta (Partido, trabajo físico)</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 4. EQUIPAMIENTO EN CASA (OPCIONAL) */}
                    <section className="border-t border-zinc-800 pt-8">
                        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-2">
                            <Scale className="w-5 h-5 text-lime-500" /> 
                            Equipo Adicional en Casa
                        </h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            Puedes decidir dónde entrenar antes de cada sesión. Si tienes equipo en casa, especifícalo aquí para tener más opciones.
                        </p>
                        
                        <div className="mb-6">
                            <label className="flex items-center gap-3 p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800 transition-all">
                                <input 
                                    type="checkbox"
                                    checked={hasHomeEquipment}
                                    onChange={(e) => {
                                        setHasHomeEquipment(e.target.checked);
                                        if (!e.target.checked) {
                                            setHomeEquipmentSelections([]);
                                        }
                                    }}
                                    className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-lime-500 focus:ring-lime-500"
                                />
                                <div>
                                    <p className="text-white font-medium">Tengo equipo de entrenamiento en casa</p>
                                    <p className="text-xs text-zinc-500">Marca si cuentas con mancuernas, bandas, barras, etc.</p>
                                </div>
                            </label>
                        </div>

                        {hasHomeEquipment && (
                            <div className="bg-zinc-800/30 p-6 rounded-xl border border-zinc-700/50 animate-in slide-in-from-top-4">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-lime-500" /> 
                                    Inventario Detallado de Tu Equipo
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
                        disabled={isSubmitDisabled} 
                        className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(132,204,22,0.3)] hover:shadow-[0_0_30px_rgba(132,204,22,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {disabledButtonText}
                    </button>

                </form>
            </div>
        </div>
    );
};

export default ProfileOnboarding;