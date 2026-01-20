import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type User, signOut, type Auth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { format, differenceInCalendarWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Dumbbell,
    Calendar,
    Activity,
    CheckCircle2,
    Play,
    Zap,
    X,
    Trophy,
    Scale,
} from 'lucide-react';

import InstallPwaBanner from './InstallPwaBanner';
import ProfileMenu from './ProfileMenu';
import LevelUpCelebration from './LevelUpCelebration';
import StatsAndAchievements from './StatsAndAchievements';
// LocationEquipmentForm eliminado - location y equipment ahora vienen del perfil
import ReadinessForm from './ReadinessForm';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { ReadinessData, DayContext } from '../types/session';

// ====================================================================

interface SessionPlan {
    dayOfWeek: string;
    sessionFocus: string;
}
interface Microcycle {
    week: number;
    focus: string;
    intensityRpe: string;
    notes: string;
    sessions: SessionPlan[];
}
interface MesocycleData {
    durationWeeks: number;
    mesocycleGoal: string;
    microcycles: Microcycle[];
}
interface CurrentMesocycleData {
    mesocyclePlan: MesocycleData;
    startDate: string;
    endDate: string | null;
    generationDate: string;
    currentWeek: number;
    progress?: number;
    // Estado posible: 'active', 'evaluation_pending', 'completed'
    status?: string; 
}
interface CurrentSessionData {
    meta?: {
        date: string;
        generatedAt: string;
    };
    completed?: boolean;
}
interface UserProfile {
    profileData?: {
        name: string;
        fitnessGoal?: string;
        [key: string]: unknown;
    };
    plan?: 'free' | 'premium' | 'trial';
    currentMesocycle?: CurrentMesocycleData;
    currentSession?: CurrentSessionData;
    name?: string;
    createdAt?: string;
    lastWorkoutDate?: string;
    _history?: Record<string, unknown>;
}
interface DashboardProps {
    user: User;
    db: Firestore;
    auth: Auth;
}

// PreSessionFeedback ahora es solo ReadinessData
// location y availableEquipment se obtienen del perfil del usuario
type PreSessionFeedback = ReadinessData;

interface LevelUpgradeData {
    upgraded: boolean;
    shouldShowCelebration: boolean;
    celebrationTitle?: string;
    celebrationMessage?: string;
    newLevel?: string;
    previousLevel?: string;
    nextGoal?: string;
    metrics?: {
        completedSessions?: number;
        weeksTraining?: number;
        completionRate?: string;
        progressionRate?: string;
    };
}

// FRASES MOTIVADORAS PARA EL LOADING
const MOTIVATIONAL_QUOTES = [
    "Calibrando cargas...",
    "El dolor es temporal, la gloria es eterna.",
    "Construyendo tu mejor versión...",
    "No pares cuando duela, para cuando termines.",
    "Analizando fatiga muscular...",
    "Hoy es un buen día para superarte.",
    "Preparando la mejor rutina para ti..."
];

// Mensajes variados para días de descanso. Cambian cada vez que el usuario entra a un día de descanso.
const REST_MESSAGES = [
    "El descanso es donde ocurre la adaptación: hoy tu cuerpo se reconstruye y se fortalece.",
    "Hoy toca recuperación — permitir que los tejidos se reparen mejorará tu rendimiento mañana.",
    "No entrenar también es parte del plan: descanso, sueño y nutrición impulsan tus ganancias.",
    "Un día de descanso reduce el riesgo de lesiones y mejora la adaptación a largo plazo.",
    "Movilidad ligera y buen sueño hoy te darán más potencia en la próxima sesión.",
    "Haz menos hoy para poder dar más mañana. Hidrátate, muévete suave y descansa bien.",
    "Permitir recuperación es una estrategia de entrenamiento inteligente—tu cuerpo lo agradecerá.",
    "Descansar hoy aumenta la calidad de tus próximas sesiones. Relaja, recarga y vuelve más fuerte."
];

// ====================================================================
// 2. COMPONENTE MODAL DE FEEDBACK (Inalterado)
// ====================================================================

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: PreSessionFeedback) => void;
    isLoading: boolean;
    isRecovery?: boolean;
}

// Modal de Feedback simplificado - solo pregunta readiness
// location y equipment se obtienen del perfil del usuario
const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, isLoading, isRecovery = false }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-800 p-6 rounded-2xl w-full max-w-md border border-lime-500/30 animate-in zoom-in-95 duration-300 my-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-lime-400 flex items-center gap-2">
                            <Zap className="w-6 h-6" />
                            ¿Cómo te sientes?
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-zinc-300 mb-5 text-sm">
                    {isRecovery ? (
                        "Este feedback nos ayudará a diseñar una sesión de recuperación óptima."
                    ) : (
                        "Tu respuesta ajustará el volumen e intensidad de tu sesión en tiempo real."
                    )}
                </p>

                <ReadinessForm 
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};


// ====================================================================
// 3. COMPONENTE DASHBOARD
// ====================================================================

const Dashboard: React.FC<DashboardProps> = ({ user, db, auth }) => {

    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados para botones de carga y feedback
    const [generatingSession, setGeneratingSession] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    
    // Estados para el modal de celebración de nivel
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);
    const [levelUpData, setLevelUpData] = useState<LevelUpgradeData | null>(null);
    
    // Estado para el modal de estadísticas
    const [showStatsModal, setShowStatsModal] = useState(false);

    const [quoteIndex, setQuoteIndex] = useState(0);
    const [restQuoteIndex, setRestQuoteIndex] = useState<number>(() => Math.floor(Math.random() * REST_MESSAGES.length));
    const prevHasSessionRef = useRef<boolean | null>(null);

    // A. Suscripción a Firestore (Lógica inalterada)
    useEffect(() => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error escuchando Firestore:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user, db]);



    // Efecto para rotar frases (Lógica inalterada)
    useEffect(() => {
        let interval: any;
        if (generatingSession) {
            interval = setInterval(() => {
                setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [generatingSession]);

    // B. Lógica de Tiempo y Estado (ACTUALIZADA con isEvaluationPending)
    const dashboardState = useMemo(() => {
        if (!userProfile?.currentMesocycle) return null;

        const mesocycle = userProfile.currentMesocycle;
        const today = new Date();

        // Defensive: ensure mesocycle has the expected shape
        if (!mesocycle.mesocyclePlan || !Array.isArray(mesocycle.mesocyclePlan.microcycles)) {
            console.warn('Malformed currentMesocycle, treating as no plan:', mesocycle);
            return null;
        }

        let currentWeekCalc = 1;
        if (mesocycle.startDate) {
            const startString = String(mesocycle.startDate).split('T')[0];
            const start = new Date(`${startString}T00:00:00`);
            if (!isNaN(start.getTime())) {
                const weeksDiff = differenceInCalendarWeeks(today, start, { weekStartsOn: 1 });
                currentWeekCalc = weeksDiff + 1;
            } else {
                console.warn('Invalid startDate in mesocycle:', mesocycle.startDate);
            }
        }

        const duration = mesocycle.mesocyclePlan.durationWeeks ?? 4;
        const isFinished = currentWeekCalc > duration;
        
        // **********************************************
        // LÓGICA DE EVALUACIÓN:
        // Es pendiente si el estado lo indica O si el ciclo ya terminó
        // **********************************************
        const isEvaluationPending = mesocycle.status === 'evaluation_pending' || isFinished;


        const todayNameLower = format(today, 'eeee', { locale: es });
        const todayName = todayNameLower.charAt(0).toUpperCase() + todayNameLower.slice(1);
        const weekIndex = Math.min(currentWeekCalc, duration) - 1;
        const currentMicrocycle = mesocycle.mesocyclePlan.microcycles[weekIndex] || null;

        const todaysSession = currentMicrocycle?.sessions.find(
            s => s.dayOfWeek.toLowerCase() === todayNameLower
        );

        // Detectar si el usuario planeó no entrenar hoy (weeklyScheduleContext)
        const weeklySchedule: DayContext[] = (userProfile?.profileData?.weeklyScheduleContext as DayContext[]) || [];
        const todayScheduleEntry = weeklySchedule.find((d: DayContext) => String(d.day).toLowerCase() === todayNameLower);
        const isPlannedRest = todayScheduleEntry ? (todayScheduleEntry.canTrain === false) : false;

        let isSessionReady = false;
        if (userProfile.currentSession && !userProfile.currentSession.completed) {
            // Si hay una sesión guardada y no está completada, consideramos que está lista
            isSessionReady = true;
        }

        return {
            currentWeek: currentWeekCalc,
            duration,
            isFinished,
            todayName,
            currentMicrocycle,
            todaysSession,
            isPlannedRest,
            mesocycleGoal: mesocycle.mesocyclePlan.mesocycleGoal,
            isSessionReady,
            isEvaluationPending // <--- AÑADIDO
        };
    }, [userProfile]);

    // Rotar mensaje de descanso cuando la vista pase a un día de descanso
    useEffect(() => {
        const had = !!prevHasSessionRef.current; // indica si antes teníamos modo entrenamiento
        const isTrainingNow = !!dashboardState?.todaysSession && !dashboardState?.isPlannedRest; // true solo si hay sesión y no es día planificado de descanso
        if (prevHasSessionRef.current === null) {
            // Primera carga: ya inicializamos con un índice aleatorio
        } else if (had && !isTrainingNow) {
            // Cambió de modo entrenamiento a descanso -> rotar mensaje
            setRestQuoteIndex(prev => (prev + 1) % REST_MESSAGES.length);
        }
        prevHasSessionRef.current = isTrainingNow;
    }, [dashboardState?.todaysSession, dashboardState?.isPlannedRest]);

    // C. Acciones
    const userName = userProfile?.profileData?.name || userProfile?.name || 'Atleta';

    const handleLogout = async () => {
        try { await signOut(auth); } catch (e) { console.error(e); }
    };

    const handleNavigateToProfile = () => {
        navigate('/profile-onboarding');
    };

    const handleCreatePlan = async () => {
        setCreatingPlan(true);
        try {
            const token = await user.getIdToken();
            const res = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_GENERATE, token, {
                method: 'POST',
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Error desconocido");
        } catch (error) {
            alert("Error: " + (error as Error).message);
        } finally {
            setCreatingPlan(false);
        }
    };

    // Función modificada para recibir el feedback - Actualizada para API V2
    const handleGenerateSession = useCallback(async (feedback: PreSessionFeedback, _isRecovery: boolean) => {
        setIsFeedbackModalOpen(false); // Cerrar modal primero
        setGeneratingSession(true);
        setQuoteIndex(0);

        try {
            const token = await user.getIdToken();

            // Payload según lo que espera el backend
            // NOTA: location, availableEquipment y homeWeights ya NO se envían
            // El backend los obtiene del perfil del usuario (preferredTrainingLocation, availableEquipment, homeWeights)
            const payload = {
                userId: user.uid, // El backend espera 'userId'
                
                // Índices opcionales
                microcycleIndex: dashboardState?.currentWeek ? dashboardState.currentWeek - 1 : undefined,
                sessionIndex: undefined, // El backend lo determina automáticamente
                
                // Datos de autoregulación (escalas 1-5)
                energyLevel: feedback.energyLevel,
                sorenessLevel: feedback.sorenessLevel,
                sleepQuality: feedback.sleepQuality,
                stressLevel: feedback.stressLevel,
                externalFatigue: feedback.externalFatigue,
                availableTime: feedback.availableTime,
            };

            console.log('📤 Enviando payload V2 al backend:', JSON.stringify(payload, null, 2));
            console.log('🔗 Endpoint:', API_ENDPOINTS.SESSION_GENERATE_V2);

            const res = await authenticatedFetch(API_ENDPOINTS.SESSION_GENERATE_V2, token, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            console.log('📊 Response status:', res.status);
            console.log('📊 Response ok:', res.ok);

            if (!res.ok) {
                const errorText = await res.text();
                console.error('❌ Error del servidor (texto):', errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error('❌ Error del servidor (JSON):', errorJson);
                    console.error('❌ Código de error:', errorJson.code);
                    console.error('❌ Mensaje:', errorJson.error);
                    console.error('❌ Detalles:', errorJson.details);
                    
                    // Mensajes específicos según el código
                    if (errorJson.code === 'CONTEXT_ERROR') {
                        alert(`❌ Error de contexto: ${errorJson.error}\n\nPosibles causas:\n- No se encontró tu perfil en Firestore\n- No hay mesociclo activo\n- No se encontró el catálogo de ejercicios\n\nRevisa la consola del backend para más detalles.`);
                    } else if (errorJson.code === 'NO_ACTIVE_MESOCYCLE') {
                        alert('❌ No hay mesociclo activo. Por favor, genera un mesociclo primero.');
                    } else {
                        alert(`Error ${res.status}: ${errorJson.error || errorJson.message || 'Error desconocido'}\n\nCódigo: ${errorJson.code}`);
                    }
                } catch {
                    alert(`Error ${res.status}: ${errorText || 'Error desconocido'}`);
                }
                return;
            }

            const data = await res.json();
            console.log('✅ Respuesta del servidor:', data);

            if (data.success) {
                console.log("✅ Sesión V2 generada OK:", data.session?.id);
                
                // 🎯 DETECTAR UPGRADE DE NIVEL
                if (data.levelUpgrade?.shouldShowCelebration) {
                    setLevelUpData(data.levelUpgrade);
                    setShowLevelUpModal(true);
                }
            } else {
                console.error('❌ Respuesta no exitosa:', data);
                alert("Error: " + (data.error || "Error desconocido"));
            }
        } catch (error) {
            console.error('❌ Error capturado:', error);
            console.error('❌ Error stack:', (error as Error).stack);
            alert("Error de conexión al generar la sesión: " + (error as Error).message);
        } finally {
            setGeneratingSession(false);
        }
    }, [user, dashboardState]);


    // Nueva función para manejar el envío del modal
    const handleModalSubmit = (feedback: PreSessionFeedback) => {
        // Llamamos a la función principal con el feedback y el modo de recuperación
        handleGenerateSession(feedback, isRecoveryMode);
    };

    // Nueva función para abrir el modal (reemplaza las llamadas directas en los botones)
    const openFeedbackModal = (isRec: boolean) => {
        setIsRecoveryMode(isRec);
        setIsFeedbackModalOpen(true);
    };


    const handleStartWorkout = () => {
        navigate('/workout/today');
    };

    // D. RENDERIZADO

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-white">
                <Activity className="w-10 h-10 text-lime-500 animate-spin mb-4" />
                <p className="text-zinc-400 animate-pulse">Cargando perfil...</p>
            </div>
        );
    }

    // DASHBOARD VACÍO (SIN PLAN) - Lógica inalterada
    if (!dashboardState) {
        return (
            <div className="min-h-screen bg-zinc-900 p-6 flex flex-col items-center justify-center text-center relative">
                <div className="absolute top-6 right-6">
                    <ProfileMenu 
                        userName={userName}
                        onLogout={handleLogout}
                        onNavigateToProfile={handleNavigateToProfile}
                    />
                </div>
                <div className="bg-zinc-800 p-8 rounded-2xl border border-zinc-700 max-w-md w-full">
                    <Dumbbell className="w-16 h-16 text-lime-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">Bienvenido, {userName.split(' ')[0]}</h2>
                    <p className="text-zinc-400 mb-8">Vamos a crear tu plan de 4 semanas.</p>
                    <button
                        onClick={handleCreatePlan}
                        disabled={creatingPlan}
                        className="w-full bg-lime-500 text-zinc-900 px-6 py-4 rounded-xl font-bold hover:bg-lime-400 flex items-center justify-center gap-2"
                    >
                        {creatingPlan ? <Activity className="animate-spin w-5 h-5" /> : "Generar Primer Mesociclo"}
                    </button>
                </div>

                <InstallPwaBanner />
            </div>
        );
    }

    // Desestructuramos el nuevo estado de evaluación
    const { 
        currentWeek, 
        duration, 
        todayName, 
        currentMicrocycle, 
        todaysSession, 
        isPlannedRest,
        mesocycleGoal, 
        isSessionReady, 
        isEvaluationPending // <--- Usamos aquí
    } = dashboardState;

    return (
        <div className="min-h-screen bg-zinc-900 text-white pb-24 relative">

            {/* MODAL DE FEEDBACK */}
            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                onSubmit={handleModalSubmit}
                isLoading={generatingSession}
                isRecovery={isRecoveryMode}
            />

            {/* HEADER - Lógica inalterada */}
            <header className="bg-zinc-800 p-6 rounded-b-3xl shadow-xl mb-6 border-b border-zinc-700 relative">
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Hola, <span className="text-lime-400">{userName.split(' ')[0]}</span></h1>
                        <p className="text-xs text-zinc-400 mt-1 font-medium uppercase"> {mesocycleGoal}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowStatsModal(true)}
                            className="p-2 rounded-lg bg-linear-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group"
                            title="Ver Estadísticas y Logros"
                        >
                            <Trophy className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        </button>
                        <ProfileMenu 
                            userName={userName}
                            onLogout={handleLogout}
                            onNavigateToProfile={handleNavigateToProfile}
                        />
                    </div>
                </div>
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-zinc-300">Semana {currentWeek} / {duration}</span>
                        <span className="text-lime-400">{currentMicrocycle?.focus}</span>
                    </div>
                    <div className="w-full bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-lime-500 h-full transition-all duration-1000" style={{ width: `${Math.min((currentWeek / duration) * 100, 100)}%` }}></div>
                    </div>
                </div>
            </header>

            <main className="px-5 space-y-8">
                {/* CARD PRINCIPAL (Lógica de Evaluación o Sesión) */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-lime-400" />
                        <h2 className="text-lg font-bold uppercase text-zinc-100">{todayName} <span className="text-zinc-500 text-sm font-normal">(Hoy)</span></h2>
                    </div>

                    {isEvaluationPending ? (
                        // 1. EVALUACIÓN PENDIENTE (PRIORIDAD ALTA)
                        <div className="group bg-linear-to-br from-zinc-800 to-zinc-900 border border-blue-500/50 p-6 rounded-2xl relative overflow-hidden shadow-lg shadow-blue-500/20">
                            <h3 className="text-2xl font-bold text-white mb-2 leading-tight">¡Mesociclo Finalizado!</h3>
                            <p className="text-zinc-400 mb-6">Completa la evaluación para que nuestro motor pueda generar tu próximo mesociclo hiper-optimizado.</p>
                            
                            <button
                                onClick={() => navigate('/mesocycle/evaluate')}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <Scale className="w-6 h-6" />
                                Evaluar y Generar Nuevo Plan
                            </button>
                        </div>
                    ) : (
                        // 2. PLAN ACTIVO: Muestra el plan de sesión de hoy o de descanso.
                        (!todaysSession || isPlannedRest) ? (
                            // 2c: Día de Descanso
                            <div className="bg-zinc-800 border border-zinc-700 p-6 rounded-2xl text-center">
                                <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <CheckCircle2 className="w-7 h-7 text-zinc-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Día de Descanso</h3>
                                <p className="text-zinc-400 text-sm mb-4 italic">"{REST_MESSAGES[restQuoteIndex]}"</p>
                                <p className="text-xs text-zinc-400">Aprovecha este día para descansar activamente: camina, realiza movilidad suave, hidrátate y prioriza el sueño.</p>
                            </div>
                        ) : (
                            <div className="group bg-linear-to-br from-zinc-800 to-zinc-900 border border-lime-500/30 p-6 rounded-2xl relative overflow-hidden shadow-lg">

                                {/* --- OVERLAY DE CARGA --- */}
                                {generatingSession && (
                                    <div className="absolute inset-0 z-50 bg-zinc-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-lime-500 blur-xl opacity-20 animate-pulse"></div>
                                            <Dumbbell className="w-16 h-16 text-lime-500 animate-[spin_3s_linear_infinite]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Diseñando Sesión...</h3>
                                        <p key={quoteIndex} className="text-zinc-400 text-sm min-h-10 animate-in slide-in-from-bottom-2 duration-500">
                                            "{MOTIVATIONAL_QUOTES[quoteIndex]}"
                                        </p>
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <span className="inline-block bg-lime-500/10 text-lime-400 text-xs font-bold px-2 py-1 rounded mb-3 border border-lime-500/20">
                                        ENTRENAMIENTO PROGRAMADO
                                    </span>
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{todaysSession.sessionFocus}</h3>

                                    <div className="bg-zinc-900/50 p-3 rounded-lg mb-6 border-l-2 border-zinc-600">
                                        <p className="text-xs text-zinc-300 italic">"{currentMicrocycle?.notes}"</p>
                                    </div>

                                    {isSessionReady ? (
                                        // Botón 2a: Iniciar Sesión Lista
                                        <button
                                            onClick={handleStartWorkout}
                                            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(132,204,22,0.4)] animate-in zoom-in-95 duration-300"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            COMENZAR SESIÓN
                                        </button>
                                    ) : (
                                        // Botón 2b: Generar Sesión
                                        <button
                                            onClick={() => openFeedbackModal(false)}
                                            disabled={generatingSession}
                                            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-zinc-600 hover:border-lime-500/50 hover:text-lime-400 transition-all"
                                        >
                                            <Zap className="w-5 h-5" />
                                            GENERAR RUTINA INTELIGENTE
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </section>

                {/* LISTA SEMANAL - Lógica inalterada */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 px-1">Esta Semana</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {currentMicrocycle?.sessions.map((session, idx) => {
                            const isToday = session.dayOfWeek.toLowerCase() === todayName.toLowerCase();
                            return (
                                <div key={idx} className={`p-4 rounded-xl flex justify-between items-center border ${isToday ? 'bg-lime-500/5 border-lime-500/40' : 'bg-zinc-800 border-zinc-700/50'}`}>
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold uppercase mb-1 ${isToday ? 'text-lime-400' : 'text-zinc-500'}`}>{session.dayOfWeek}</span>
                                        <span className="text-sm font-medium text-zinc-200">{session.sessionFocus}</span>
                                    </div>
                                    {isToday && <div className="h-2 w-2 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.8)]"></div>}
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            {/* 👇 AÑADIDO: Banner de instalación PWA al final */}
            <InstallPwaBanner />
            
            {/* 🎉 Modal de Celebración de Nivel */}
            {levelUpData && (
                <LevelUpCelebration
                    isOpen={showLevelUpModal}
                    onClose={() => setShowLevelUpModal(false)}
                    data={{
                        celebrationTitle: levelUpData.celebrationTitle || '¡Nivel Mejorado!',
                        celebrationMessage: levelUpData.celebrationMessage || 'Has alcanzado un nuevo nivel de entrenamiento',
                        newLevel: levelUpData.newLevel || 'intermedio',
                        previousLevel: levelUpData.previousLevel || 'principiante',
                        nextGoal: levelUpData.nextGoal,
                        metrics: levelUpData.metrics
                    }}
                />
            )}
            
            {/* 📊 Modal de Estadísticas y Logros */}
            {showStatsModal && userProfile && userProfile.createdAt && (
                <StatsAndAchievements
                    userProfile={{
                        createdAt: userProfile.createdAt,
                        lastWorkoutDate: userProfile.lastWorkoutDate,
                        _history: userProfile._history as Record<string, { feedback?: { completedAt?: string } }> | undefined,
                        currentMesocycle: userProfile.currentMesocycle ? {
                            currentWeek: userProfile.currentMesocycle.currentWeek,
                            progress: userProfile.currentMesocycle.progress || 0,
                            mesocyclePlan: userProfile.currentMesocycle.mesocyclePlan,
                            startDate: userProfile.currentMesocycle.startDate,
                        } : undefined,
                        profileData: userProfile.profileData,
                    }}
                    onClose={() => setShowStatsModal(false)}
                />
            )}
        </div>
    );
};

export default Dashboard;