import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth'; 
import { Scale, Loader2, CheckCircle2, AlertTriangle, ChevronLeft } from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import MesocycleGenerationLoader from './MesocycleGenerationLoader';
import type { MesocycleGenerationProfile } from '../utils/splitGenerationContext';

// ====================================================================
// TIPOS ESTRUCTURALES
// ====================================================================

interface Option {
    value: string | number;
    label: string;
}
// ... (Otros tipos y constantes de opciones, omitidos para brevedad) ...

interface DifficultyOption extends Option {
    value: number;
}

interface PainOption extends Option {
    value: string;
}

interface MesocycleEvaluateProps {
    user: User;
    profileData?: Record<string, unknown>;
}

// ====================================================================
// CONFIGURACIÓN DE LAS PREGUNTAS ESTRUCTURADAS (Resto de constantes sin cambios)
// ====================================================================
const DIFFICULTY_OPTIONS: DifficultyOption[] = [
    { value: 1, label: 'Muy fácil (Pude hacer más)' },
    { value: 2, label: 'Fácil (Cómodo)' },
    { value: 3, label: 'Justo (El punto ideal)' },
    { value: 4, label: 'Difícil (Muy cerca del fallo)' },
    { value: 5, label: 'Extremo (Demasiado, me agoté)' },
];

const PAIN_OPTIONS: PainOption[] = [
    { value: 'none', label: 'Ninguna' },
    { value: 'knees', label: 'Rodillas' },
    { value: 'shoulders', label: 'Hombros' },
    { value: 'lower_back', label: 'Espalda Baja' },
    { value: 'elbows', label: 'Codos' },
];

const NEXT_GOAL_OPTIONS: Option[] = [
    { value: 'Ganancia Muscular', label: 'Ganancia Muscular (Mantener)' },
    { value: 'Pérdida de Grasa', label: 'Pérdida de Grasa' },
    { value: 'Fuerza Máxima', label: 'Fuerza Máxima' },
    { value: 'Resistencia', label: 'Resistencia / Fitness General' },
];

// --- CORRECCIÓN APLICADA AQUÍ: Se recibe y usa 'user' de props ---
const MesocycleEvaluate: React.FC<MesocycleEvaluateProps> = ({ user, profileData }) => {
    const navigate = useNavigate();
    // ... (Estados sin cambios)
    const [difficultyScore, setDifficultyScore] = useState<number | null>(null);
    const [painAreas, setPainAreas] = useState<string[]>(['none']);
    const [nextGoalPreference, setNextGoalPreference] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'evaluating' | 'generating' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [generateApiDone, setGenerateApiDone] = useState(false);
    const [loaderSequenceDone, setLoaderSequenceDone] = useState(false);
    
    // ... (isBusy y isFormIncomplete sin cambios)
    const isBusy = useMemo(() => 
        status === 'evaluating' || status === 'generating', 
        [status]
    );

    const isFormIncomplete = difficultyScore === null;

    useEffect(() => {
        if (status !== 'generating' || !generateApiDone || !loaderSequenceDone) return;
        setStatus('success');
        const timer = setTimeout(() => navigate('/'), 1500);
        return () => clearTimeout(timer);
    }, [status, generateApiDone, loaderSequenceDone, navigate]);
    // ... (handlePainSelect sin cambios)
    const handlePainSelect = (value: string) => {
        setPainAreas(prevAreas => {
            if (value === 'none') {
                return ['none'];
            }

            const areasWithoutNone = prevAreas.filter(p => p !== 'none');
            
            if (areasWithoutNone.includes(value)) {
                const newAreas = areasWithoutNone.filter(p => p !== value);
                return newAreas.length === 0 ? ['none'] : newAreas;
            } else {
                return [...areasWithoutNone, value];
            }
        });
    };
    
    // --- FUNCIÓN CENTRAL: LLAMA A EVALUAR Y LUEGO A GENERAR ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (isFormIncomplete) { 
            setError('Por favor, selecciona una dificultad para continuar.');
            return;
        }

        const painPayload = painAreas.includes('none') ? [] : painAreas;
        const token = await user.getIdToken();

        try {
            setGenerateApiDone(false);
            setLoaderSequenceDone(false);
            // ----------------------------------------------------
            // 1. LLAMADA DE EVALUACIÓN (/api/mesocycle/evaluate)
            // ----------------------------------------------------
            setStatus('evaluating');
            
            const evaluationResponse = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_EVALUATE, token, {
                method: 'POST',
                body: JSON.stringify({
                    difficultyScore,
                    painAreas: painPayload,
                    nextGoalPreference,
                    notes
                }),
            });

            // **********************************************
            // MANEJO ROBUSTO DE ERRORES EN EVALUACIÓN
            // **********************************************
            if (!evaluationResponse.ok) {
                let errorMessage = 'Fallo desconocido al procesar la evaluación.';
                try {
                    // Intenta leer el JSON si está presente
                    const errorData = await evaluationResponse.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    // Si el JSON falla (ej. cuerpo vacío, HTML de error), lee el texto crudo
                    const text = await evaluationResponse.text();
                    errorMessage = `Error de red. Respuesta no válida del servidor. Código: ${evaluationResponse.status}.`;
                    console.error("Respuesta fallida cruda:", text.substring(0, 200));
                }
                throw new Error(errorMessage);
            }
            
            // Leemos la respuesta JSON del endpoint /evaluate
            await evaluationResponse.json(); 


            // ----------------------------------------------------
            // 2. LLAMADA DE GENERACIÓN (/api/mesocycle/generate)
            // ----------------------------------------------------
            setStatus('generating');
            setLoaderSequenceDone(false);
            const generationResponse = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_GENERATE, token, {
                method: 'POST',
            });
            // El endpoint de generación usará la data de evaluación almacenada en Firestore

            // **********************************************
            // MANEJO ROBUSTO DE ERRORES EN GENERACIÓN
            // **********************************************
            if (!generationResponse.ok) {
                let errorMessage = 'Fallo desconocido al generar el nuevo mesociclo.';
                try {
                    const errorData = await generationResponse.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch {
                    const text = await generationResponse.text();
                    errorMessage = `Error de red. Respuesta no válida del servidor durante la generación. Código: ${generationResponse.status}.`;
                    console.error("Respuesta fallida cruda:", text.substring(0, 200));
                }
                throw new Error(errorMessage);
            }
            
            setGenerateApiDone(true);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setError((err as Error).message || 'Ocurrió un error inesperado. Intenta de nuevo.');
        }
    };

    // ... (El resto del componente JSX queda sin cambios)
    // --- UI DE ESTADO (Carga y Éxito) ---
    if (isBusy) {
        const loaderProfile: MesocycleGenerationProfile = {
            fitnessGoal: (profileData?.fitnessGoal as string) ?? 'Hipertrofia',
            trainingAgeMonths: profileData?.trainingAgeMonths as number | undefined,
            experienceLevel: profileData?.experienceLevel as MesocycleGenerationProfile['experienceLevel'],
            trainingDaysPerWeek: profileData?.trainingDaysPerWeek as number | undefined,
            weeklyScheduleContext: profileData?.weeklyScheduleContext as MesocycleGenerationProfile['weeklyScheduleContext'],
            injuriesOrLimitations: profileData?.injuriesOrLimitations as string[] | undefined,
        };

        return (
            <MesocycleGenerationLoader
                title={status === 'evaluating' ? 'Evaluando tu mesociclo' : 'Generando tu próximo bloque'}
                subtitle={
                    status === 'evaluating'
                        ? 'Analizando dificultad, molestias y progreso del ciclo anterior…'
                        : 'Aplicando los ajustes de volumen a tu nuevo mesociclo…'
                }
                profile={loaderProfile}
                phase={status === 'evaluating' ? 'saving' : 'generating'}
                evaluationMode={status === 'generating'}
                onSequenceComplete={() => setLoaderSequenceDone(true)}
            />
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center justify-center p-6">
                <CheckCircle2 className="w-16 h-16 text-lime-400 mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Nuevo mesociclo listo!</h2>
                <p className="text-zinc-400 text-center mb-6">Tu próximo bloque ya está generado con los ajustes de volumen.</p>
                <button onClick={() => navigate('/')} className="bg-lime-500 text-zinc-900 font-bold px-6 py-3 rounded-xl">
                    Ir al Dashboard
                </button>
            </div>
        );
    }
    
    // --- UI PRINCIPAL (Formulario) ---
    return (
        <div className="min-h-screen bg-zinc-900 text-white p-5">
            <header className="mb-8">
                <button type="button" onClick={() => navigate('/')} className="text-zinc-400 hover:text-white flex items-center mb-4">
                    <ChevronLeft className="w-5 h-5" />
                    Volver al Dashboard
                </button>
                <h1 className="text-3xl font-bold text-lime-400 flex items-center gap-2">
                    <Scale className="w-7 h-7" />
                    Evaluación de Mesociclo
                </h1>
                <p className="text-zinc-400 mt-2">Tu feedback es vital. Úsalo para mejorar la calidad y personalización de tu próximo plan.</p>
            </header>

            {error && (
                <div className="bg-red-900/50 border border-red-500/50 p-3 rounded-xl flex items-center gap-3 mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-200">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* PREGUNTA 1: DIFICULTAD GLOBAL */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">1. Dificultad del Mesociclo</h2>
                    <p className="text-zinc-400 mb-3">En promedio, ¿cómo sentiste la dificultad y el volumen de las últimas 4 semanas?</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {DIFFICULTY_OPTIONS.map((option: DifficultyOption) => (
                            <button
                                key={option.value}
                                type="button" 
                                onClick={() => setDifficultyScore(option.value)}
                                className={`p-4 rounded-xl text-left transition-all ${
                                    difficultyScore === option.value 
                                    ? 'bg-lime-500 text-zinc-900 shadow-lg shadow-lime-500/20' 
                                    : 'bg-zinc-800 border border-zinc-700/50 hover:bg-zinc-700'
                                }`}
                            >
                                <span className="font-bold text-lg">{option.value} / 5</span>
                                <p className="text-sm">{option.label}</p>
                            </button>
                        ))}
                    </div>
                </section>

                {/* PREGUNTA 2: ÁREAS DE DOLOR/MOLESTIA */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">2. Molestias y Limitaciones</h2>
                    <p className="text-zinc-400 mb-3">¿Experimentaste dolor persistente o molestias que te obligaron a cambiar ejercicios?</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {PAIN_OPTIONS.map((option: PainOption) => (
                            <button
                                key={option.value}
                                type="button" 
                                onClick={() => handlePainSelect(option.value)}
                                className={`p-3 rounded-xl text-center transition-all ${
                                    painAreas.includes(option.value) 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-zinc-800 border border-zinc-700/50 hover:bg-zinc-700 text-zinc-300'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* PREGUNTA 3: OBJETIVO FUTURO */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">3. ¿Cambiar tu Enfoque?</h2>
                    <p className="text-zinc-400 mb-3">Selecciona el objetivo si deseas cambiarlo del que tenías.</p>
                    <select
                        value={nextGoalPreference}
                        onChange={(e) => setNextGoalPreference(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700/50 text-white p-3 rounded-xl focus:ring-lime-500 focus:border-lime-500"
                    >
                        <option value="">Mantener mi objetivo actual...</option>
                        {NEXT_GOAL_OPTIONS.map((option: Option) => (
                            <option key={option.value} value={String(option.value)}>{option.label}</option>
                        ))}
                    </select>
                </section>
                
                {/* PREGUNTA 4: NOTAS LIBRES */}
                <section>
                    <h2 className="text-xl font-semibold mb-4">4. Notas (Opcional)</h2>
                    <p className="text-zinc-400 mb-3">Cualquier observación adicional.</p>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-800 border border-zinc-700/50 text-white p-3 rounded-xl resize-none focus:ring-lime-500 focus:border-lime-500"
                        placeholder="Escribe aquí..."
                    />
                </section>

                {/* BOTÓN DE ENVÍO */}
                <button
                    type="submit"
                    disabled={isFormIncomplete || isBusy} 
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                        isFormIncomplete
                        ? 'bg-zinc-600 text-zinc-400 cursor-not-allowed'
                        : 'bg-lime-500 hover:bg-lime-400 text-zinc-900 shadow-lime-500/20 active:scale-98'
                    }`}
                >
                    {isBusy ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {status === 'evaluating' ? 'Evaluando...' : 'Generando...'}
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-6 h-6" />
                            Finalizar Evaluación y Generar Nuevo Plan
                        </>
                    )}
                </button>
            </form>

            <div className="h-10"></div>
        </div>
    );
};

export default MesocycleEvaluate;