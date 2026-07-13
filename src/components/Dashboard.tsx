import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { type User, signOut, type Auth } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { format, differenceInCalendarWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Trophy,
    X,
} from 'lucide-react';

import InstallPwaBanner from './InstallPwaBanner';
import ProfileMenu from './ProfileMenu';
import LevelUpCelebration from './LevelUpCelebration';
import StatsAndAchievements from './StatsAndAchievements';
import MesocycleGenerationLoader from './MesocycleGenerationLoader';
import {
    DashboardEyebrow,
    DashboardHero,
    DashboardIconButton,
    DashboardLoading,
    DashboardPrimaryButton,
    DashboardProgress,
    DashboardShell,
    SessionGeneratingOverlay,
    WeekSessionList,
} from './dashboard/DashboardPrimitives';
// LocationEquipmentForm eliminado - location y equipment ahora vienen del perfil
import ReadinessForm from './ReadinessForm';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { ReadinessData, DayContext } from '../types/session';
import { MIN_SESSION_GENERATION_DISPLAY_MS, waitMs } from '../utils/sessionGenerationContext';
import { markSessionReviewed } from '../utils/sessionReviewContext';

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
    id?: string;
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
    plan?: 'free';
    planStatus?: string;
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

// Mensajes para días de descanso.
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
        <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col">
            <div className="px-6 pt-[max(1.25rem,env(safe-area-inset-top))] flex justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-white transition-colors"
                    aria-label="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <div className="max-w-sm mx-auto pt-2">
                    <p className="text-[15px] text-zinc-500 leading-relaxed mb-6 text-center">
                        {isRecovery
                            ? 'Tu respuesta define una sesión de recuperación óptima.'
                            : 'Ajustamos volumen e intensidad según tu estado.'}
                    </p>
                    <ReadinessForm onSubmit={onSubmit} onBack={onClose} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
};


// ====================================================================
// 3. COMPONENTE DASHBOARD
// ====================================================================

const Dashboard: React.FC<DashboardProps> = ({ user, db, auth }) => {

    const navigate = useNavigate();
    const location = useLocation();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileUpdateNotice, setProfileUpdateNotice] = useState<string | null>(null);

    // Estados para botones de carga y feedback
    const [generatingSession, setGeneratingSession] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [planApiDone, setPlanApiDone] = useState(false);
    const [planLoaderDone, setPlanLoaderDone] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    
    // Estados para el modal de celebración de nivel
    const [showLevelUpModal, setShowLevelUpModal] = useState(false);
    const [pendingPreflightNav, setPendingPreflightNav] = useState(false);
    const [levelUpData, setLevelUpData] = useState<LevelUpgradeData | null>(null);
    
    // Estado para el modal de estadísticas
    const [showStatsModal, setShowStatsModal] = useState(false);
    
    // Estados para el modal de explicación del plan (NUEVO)
    const [showPlanExplanationModal, setShowPlanExplanationModal] = useState(false);
    const [planExplanationData, setPlanExplanationData] = useState<any>(null);    
    
    const [viewWeekIndex, setViewWeekIndex] = useState(0);

    // Ref para el scroll del carrusel (legacy desktop — mobile usa selector)
    const carouselRef = useRef<HTMLDivElement>(null);
    
    const [restQuoteIndex, setRestQuoteIndex] = useState<number>(() => Math.floor(Math.random() * REST_MESSAGES.length));
    const prevHasSessionRef = useRef<boolean | null>(null);
    const sessionGenerationStartedAt = useRef<number>(0);

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

    useEffect(() => {
        const notice = (location.state as { profileUpdate?: { message?: string } } | null)?.profileUpdate?.message;
        if (notice) {
            setProfileUpdateNotice(notice);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

    useEffect(() => {
        if (!creatingPlan || !planApiDone || !planLoaderDone) return;
        setCreatingPlan(false);
        setPlanApiDone(false);
        setPlanLoaderDone(false);
        if (planExplanationData) {
            setTimeout(() => setShowPlanExplanationModal(true), 300);
        }
    }, [creatingPlan, planApiDone, planLoaderDone, planExplanationData]);

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
            isEvaluationPending, // <--- AÑADIDO
            allMicrocycles: mesocycle.mesocyclePlan.microcycles // <--- AÑADIDO para vista de mesociclo completo
        };
    }, [userProfile]);

    useEffect(() => {
        if (dashboardState?.currentWeek) {
            setViewWeekIndex(dashboardState.currentWeek - 1);
        }
    }, [dashboardState?.currentWeek]);

    const weekDaysForView = useMemo(() => {
        if (!dashboardState?.allMicrocycles?.length) return [];
        const micro = dashboardState.allMicrocycles[viewWeekIndex];
        if (!micro) return [];
        const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
        const isViewingCurrentWeek = viewWeekIndex + 1 === dashboardState.currentWeek;
        const todayLower = dashboardState.todayName.toLowerCase();

        return dayNames.map((day) => {
            const session = micro.sessions.find((s) => s.dayOfWeek.toLowerCase() === day);
            return {
                day,
                sessionFocus: session?.sessionFocus,
                isToday: isViewingCurrentWeek && day === todayLower,
                isDone: Boolean((session as { generated?: boolean } | undefined)?.generated),
            };
        });
    }, [dashboardState, viewWeekIndex]);

    // Scroll automático a la semana actual en el carrusel desktop
    useEffect(() => {
        if (carouselRef.current && dashboardState?.currentWeek) {
            const weekIndex = dashboardState.currentWeek - 1;
            const weekCards = carouselRef.current.children;
            if (weekCards[weekIndex]) {
                setTimeout(() => {
                    weekCards[weekIndex].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
                }, 100);
            }
        }
    }, [dashboardState?.currentWeek]);

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
        setPlanApiDone(false);
        setPlanLoaderDone(false);
        
        try {
            const token = await user.getIdToken();
            
            const res = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_GENERATE, token, {
                method: 'POST',
            });
            
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Error desconocido");
            
            if (data.plan && data.plan.metadata && data.plan.metadata.planRationale) {
                setPlanExplanationData(data.plan.metadata.planRationale);
            }

            setPlanApiDone(true);
        } catch (error) {
            setCreatingPlan(false);
            setPlanApiDone(false);
            setPlanLoaderDone(false);
            alert("Error: " + (error as Error).message);
        }
    };

    // Función modificada para recibir el feedback - Actualizada para API V2
    const handleGenerateSession = useCallback(async (feedback: PreSessionFeedback, _isRecovery: boolean) => {
        setIsFeedbackModalOpen(false);
        setGeneratingSession(true);
        sessionGenerationStartedAt.current = Date.now();

        try {
            const token = await user.getIdToken();

            // Payload según lo que espera el backend
            // NOTA: location, availableEquipment y homeWeights ya NO se envían
            // El backend los obtiene del perfil del usuario (preferredTrainingLocation, availableEquipment, homeWeights)
            // Incluir zona horaria local para que el backend pueda determinar correctamente el día del usuario
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
            const payload = {
                userId: user.uid, // El backend espera 'userId'
                timezone,
                
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

            const elapsed = Date.now() - sessionGenerationStartedAt.current;
            if (elapsed < MIN_SESSION_GENERATION_DISPLAY_MS) {
                await waitMs(MIN_SESSION_GENERATION_DISPLAY_MS - elapsed);
            }

            if (data.success) {
                console.log("✅ Sesión V2 generada OK:", data.session?.id);

                // 🎯 DETECTAR UPGRADE DE NIVEL
                if (data.levelUpgrade?.shouldShowCelebration) {
                    setLevelUpData(data.levelUpgrade);
                    setShowLevelUpModal(true);
                    setPendingPreflightNav(true);
                } else {
                    navigate('/workout/today', { state: { preflight: true }, replace: true });
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
    }, [user, dashboardState, navigate]);


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
        const sessionId = userProfile?.currentSession?.id as string | undefined;
        if (sessionId) markSessionReviewed(sessionId);
        navigate('/workout/player');
    };

    const handleReviewWorkout = () => {
        navigate('/workout/today', { state: { preflight: false } });
    };

    // D. RENDERIZADO

    if (loading) {
        return <DashboardLoading />;
    }
    
    // Overlay de carga para generación de plan
    if (creatingPlan) {
        const profileForLoader = {
            fitnessGoal: userProfile?.profileData?.fitnessGoal,
            trainingAgeMonths: userProfile?.profileData?.trainingAgeMonths as number | undefined,
            experienceLevel: userProfile?.profileData?.experienceLevel as string | undefined,
            trainingDaysPerWeek: userProfile?.profileData?.trainingDaysPerWeek as number | undefined,
            weeklyScheduleContext: userProfile?.profileData?.weeklyScheduleContext as DayContext[] | undefined,
            preferredTrainingDays: userProfile?.profileData?.preferredTrainingDays as string[] | undefined,
            injuriesOrLimitations: userProfile?.profileData?.injuriesOrLimitations as string[] | undefined,
            age: userProfile?.profileData?.age as number | undefined,
        };

        return (
            <MesocycleGenerationLoader
                title="Diseñando tu mesociclo"
                profile={profileForLoader}
                onSequenceComplete={() => setPlanLoaderDone(true)}
            />
        );
    }

    // DASHBOARD VACÍO (SIN PLAN)
    if (!dashboardState) {
        const needsPlan = userProfile?.planStatus === 'needs_regeneration';
        return (
            <DashboardShell>
                <header className="px-6 pt-[max(1.25rem,env(safe-area-inset-top))] flex justify-end">
                    <ProfileMenu
                        userName={userName}
                        onLogout={handleLogout}
                        onNavigateToProfile={handleNavigateToProfile}
                    />
                </header>
                <div className="flex-1 flex flex-col items-center justify-center px-8">
                    <DashboardHero
                        eyebrow="Bienvenido"
                        title={userName.split(' ')[0]}
                        body={
                            needsPlan
                                ? 'Tu perfil está actualizado. Genera un nuevo mesociclo para continuar entrenando.'
                                : 'Aún no tienes un mesociclo activo. Generemos tu primer bloque de entrenamiento.'
                        }
                    >
                        <DashboardPrimaryButton onClick={handleCreatePlan} disabled={creatingPlan}>
                            Crear mi plan
                        </DashboardPrimaryButton>
                    </DashboardHero>
                </div>
                <div className="px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <InstallPwaBanner />
                </div>
            </DashboardShell>
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

    const totalWeeks = dashboardState.allMicrocycles?.length ?? duration;
    const canPrevWeek = viewWeekIndex > 0;
    const canNextWeek = viewWeekIndex < totalWeeks - 1;

    return (
        <DashboardShell>
            {generatingSession && <SessionGeneratingOverlay />}

            <FeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={() => setIsFeedbackModalOpen(false)}
                onSubmit={handleModalSubmit}
                isLoading={generatingSession}
                isRecovery={isRecoveryMode}
            />

            <header className="px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 shrink-0">
                {profileUpdateNotice ? (
                    <div className="mb-4 px-4 py-3 rounded-xl border border-lime-500/30 bg-lime-500/10 text-sm text-zinc-300 leading-relaxed">
                        {profileUpdateNotice}
                        <button
                            type="button"
                            onClick={() => setProfileUpdateNotice(null)}
                            className="block mt-2 text-xs text-lime-400/80 hover:text-lime-400"
                        >
                            Entendido
                        </button>
                    </div>
                ) : null}
                <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="min-w-0">
                        <DashboardEyebrow>
                            Semana {currentWeek} · {mesocycleGoal}
                        </DashboardEyebrow>
                        <h1 className="text-xl font-bold text-white mt-2 truncate">
                            {userName.split(' ')[0]}
                        </h1>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                        <DashboardIconButton
                            onClick={() => setShowStatsModal(true)}
                            title="Estadísticas y logros"
                        >
                            <Trophy className="w-4 h-4" />
                        </DashboardIconButton>
                        <ProfileMenu
                            userName={userName}
                            onLogout={handleLogout}
                            onNavigateToProfile={handleNavigateToProfile}
                        />
                    </div>
                </div>
                <DashboardProgress
                    value={(currentWeek / duration) * 100}
                    label={currentMicrocycle?.focus ?? 'Mesociclo activo'}
                    meta={`${currentWeek} / ${duration}`}
                />
            </header>

            <main className="flex-1 flex flex-col min-h-0 px-6">
                <section className="flex-1 flex items-center justify-center py-4 min-h-0">
                    {isEvaluationPending ? (
                        <DashboardHero
                            eyebrow="Mesociclo completo"
                            title="Hora de evaluar"
                            body="Tu feedback calibra el volumen del próximo bloque dentro de MEV–MRV."
                        >
                            <DashboardPrimaryButton onClick={() => navigate('/mesocycle/evaluate')}>
                                Evaluar y generar plan
                            </DashboardPrimaryButton>
                        </DashboardHero>
                    ) : !todaysSession || isPlannedRest ? (
                        <DashboardHero
                            eyebrow={`${todayName} · Recuperación`}
                            title="Día de descanso"
                            body={REST_MESSAGES[restQuoteIndex]}
                        />
                    ) : (
                        <DashboardHero
                            eyebrow={`${todayName} · Hoy`}
                            title={todaysSession.sessionFocus}
                            body={currentMicrocycle?.notes}
                        >
                            {isSessionReady ? (
                                <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
                                    <DashboardPrimaryButton onClick={handleStartWorkout}>
                                        Entrenar
                                    </DashboardPrimaryButton>
                                    <DashboardPrimaryButton variant="ghost" onClick={handleReviewWorkout}>
                                        Revisar rutina
                                    </DashboardPrimaryButton>
                                </div>
                            ) : (
                                <DashboardPrimaryButton
                                    variant="ghost"
                                    onClick={() => openFeedbackModal(false)}
                                    disabled={generatingSession}
                                >
                                    Generar rutina
                                </DashboardPrimaryButton>
                            )}
                        </DashboardHero>
                    )}
                </section>

                {!isEvaluationPending && weekDaysForView.length > 0 && (
                    <section className="md:hidden shrink-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <div className="flex items-center justify-between max-w-sm mx-auto mb-3">
                            <button
                                type="button"
                                disabled={!canPrevWeek}
                                onClick={() => setViewWeekIndex((w) => Math.max(0, w - 1))}
                                className="p-2 text-zinc-500 hover:text-white disabled:opacity-25 transition-colors"
                                aria-label="Semana anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="text-center">
                                <DashboardEyebrow>Tu semana</DashboardEyebrow>
                                <p className="text-sm font-semibold text-zinc-300 mt-1">
                                    Semana {viewWeekIndex + 1}
                                    {viewWeekIndex + 1 === currentWeek ? (
                                        <span className="text-lime-500/80 font-normal"> · activa</span>
                                    ) : null}
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={!canNextWeek}
                                onClick={() =>
                                    setViewWeekIndex((w) => Math.min(totalWeeks - 1, w + 1))
                                }
                                className="p-2 text-zinc-500 hover:text-white disabled:opacity-25 transition-colors"
                                aria-label="Semana siguiente"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <WeekSessionList days={weekDaysForView} />

                        <div className="flex justify-center gap-1 mt-4">
                            {Array.from({ length: totalWeeks }).map((_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    aria-label={`Ir a semana ${i + 1}`}
                                    onClick={() => setViewWeekIndex(i)}
                                    className={`h-1 rounded-full transition-all duration-300 ${
                                        i === viewWeekIndex
                                            ? 'w-5 bg-lime-500'
                                            : 'w-1 bg-zinc-800 hover:bg-zinc-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Vista desktop: calendario expandido */}
                <section className="hidden md:block shrink-0 pb-8">
                    <div
                        ref={carouselRef}
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {dashboardState.allMicrocycles?.map((microcycle: Microcycle, weekIdx: number) => {
                            const isCurrentWeekCard = weekIdx + 1 === currentWeek;
                            const dayNames = [
                                'lunes',
                                'martes',
                                'miércoles',
                                'jueves',
                                'viernes',
                                'sábado',
                                'domingo',
                            ];
                            const rows = dayNames.map((day) => {
                                const session = microcycle.sessions.find(
                                    (s) => s.dayOfWeek.toLowerCase() === day,
                                );
                                return {
                                    day,
                                    sessionFocus: session?.sessionFocus,
                                    isToday:
                                        isCurrentWeekCard && day === todayName.toLowerCase(),
                                    isDone: Boolean(
                                        (session as { generated?: boolean } | undefined)?.generated,
                                    ),
                                };
                            });

                            return (
                                <div
                                    key={weekIdx}
                                    className={`rounded-2xl p-4 border ${
                                        isCurrentWeekCard
                                            ? 'border-lime-500/30 bg-lime-500/5'
                                            : 'border-zinc-800 bg-zinc-900/30'
                                    }`}
                                >
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
                                        Semana {weekIdx + 1}
                                    </p>
                                    <p className="text-sm font-semibold text-zinc-300 mb-3">
                                        {microcycle.focus}
                                    </p>
                                    <WeekSessionList days={rows} />
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <div className="px-6 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                <InstallPwaBanner />
            </div>
            {/* 🎉 Modal de Celebración de Nivel */}
            {levelUpData && (
                <LevelUpCelebration
                    isOpen={showLevelUpModal}
                    onClose={() => {
                        setShowLevelUpModal(false);
                        if (pendingPreflightNav) {
                            setPendingPreflightNav(false);
                            navigate('/workout/today', { state: { preflight: true }, replace: true });
                        }
                    }}
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
            
            {/* 📋 Modal de Explicación del Plan (NUEVO) */}
            {showPlanExplanationModal && planExplanationData && (
                <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
                    <div className="px-6 pt-[max(1.25rem,env(safe-area-inset-top))] flex justify-end shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowPlanExplanationModal(false)}
                            className="p-2 text-zinc-500 hover:text-white transition-colors"
                            aria-label="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <div className="max-w-sm mx-auto">
                            <DashboardEyebrow>Tu plan</DashboardEyebrow>
                            <h2 className="text-3xl font-bold text-white mt-4 mb-8 leading-tight">
                                {planExplanationData.splitType}
                            </h2>

                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-2">
                                        Objetivo
                                    </p>
                                    <p className="text-lg font-semibold text-zinc-200">
                                        {planExplanationData.phaseGoal}
                                    </p>
                                    <p className="text-[15px] text-zinc-400 mt-2 leading-relaxed">
                                        {planExplanationData.goalRationale}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-2">
                                        Estrategia
                                    </p>
                                    <p className="text-[15px] text-zinc-400 leading-relaxed">
                                        {planExplanationData.splitRationale}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-2">
                                        Volumen · {planExplanationData.baseVolume} series/sem
                                    </p>
                                    <p className="text-[15px] text-zinc-400 leading-relaxed">
                                        {planExplanationData.volumeRationale}
                                    </p>
                                </div>

                                {planExplanationData.specialConsiderations?.length > 0 && (
                                    <div className="border-t border-zinc-800 pt-6">
                                        <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Notas
                                        </p>
                                        <ul className="space-y-2">
                                            {planExplanationData.specialConsiderations.map(
                                                (note: string, idx: number) => (
                                                    <li
                                                        key={idx}
                                                        className="text-[15px] text-zinc-400 leading-relaxed"
                                                    >
                                                        {note}
                                                    </li>
                                                ),
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shrink-0">
                        <DashboardPrimaryButton onClick={() => setShowPlanExplanationModal(false)}>
                            Empezar
                        </DashboardPrimaryButton>
                    </div>
                </div>
            )}
        </DashboardShell>
    );
};

export default Dashboard;