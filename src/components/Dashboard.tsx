import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Scale,
    BatteryCharging,
    X,
    ChevronDown,
} from 'lucide-react';

import InstallPwaBanner from './InstallPwaBanner';
import ProfileMenu from './ProfileMenu';

// ====================================================================
// 1. DEFINICIÓN DE TIPOS
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
        [key: string]: any;
    };
    plan?: 'free' | 'premium' | 'trial';
    currentMesocycle?: CurrentMesocycleData;
    currentSession?: CurrentSessionData;
    name?: string;
}
interface DashboardProps {
    user: User;
    db: Firestore;
    auth: Auth;
}

interface PreSessionFeedback {
    energyLevel: number; // Escala 1-5
    sorenessLevel: number; // Escala 1-5
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

const scaleOptions = [
    { value: 5, label: '5 - Fantástico/Nada' },
    { value: 4, label: '4 - Muy Bien/Leve' },
    { value: 3, label: '3 - Normal/Moderado' },
    { value: 2, label: '2 - Cansado/Alto' },
    { value: 1, label: '1 - Exhausto/Incapacitante' },
];


const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, isLoading, isRecovery = false }) => {
    const [energyLevel, setEnergyLevel] = useState(3);
    const [sorenessLevel, setSorenessLevel] = useState(3);

    // Resetear estados al abrir
    useEffect(() => {
        if (isOpen) {
            setEnergyLevel(3);
            setSorenessLevel(3);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ energyLevel, sorenessLevel });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-zinc-800 p-6 rounded-2xl w-full max-w-md border border-lime-500/30 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-lime-400 flex items-center gap-2">
                        <Zap className="w-6 h-6" />
                        Chequeo Pre-Sesión
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-zinc-300 mb-6 text-sm">
                    {isRecovery ? (
                        "Tu plan de hoy es de Movilidad. Este feedback nos ayudará a priorizar la recuperación más adecuada."
                    ) : (
                        "Tu respuesta ajustará el peso, series y repeticiones de HOY en tiempo real."
                    )}
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nivel de Energía */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                            <BatteryCharging className="w-4 h-4 text-lime-500" /> Nivel de Energía <span className="text-xs text-zinc-500">(1=Exhausto, 5=Fantástico)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={energyLevel}
                                onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                                required
                                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white appearance-none focus:ring-lime-500 focus:border-lime-500"
                            >
                                {scaleOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label.split('/')[0].trim()}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Dolor Muscular */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
                            <Scale className="w-4 h-4 text-lime-500" /> Dolor Muscular / Agujetas <span className="text-xs text-zinc-500">(1=Nada, 5=Incapacitante)</span>
                        </label>
                        <div className="relative">
                            <select
                                value={sorenessLevel}
                                onChange={(e) => setSorenessLevel(parseInt(e.target.value))}
                                required
                                className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white appearance-none focus:ring-lime-500 focus:border-lime-500"
                            >
                                {scaleOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label.split('/')[1].trim()}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-lime-500 text-zinc-900 font-bold py-3 px-4 rounded-xl transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-400 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Activity className="animate-spin w-5 h-5" />
                        ) : (
                            'Confirmar y Generar Rutina'
                        )}
                    </button>
                </form>
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

    const [quoteIndex, setQuoteIndex] = useState(0);

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

        let currentWeekCalc = 1;
        if (mesocycle.startDate) {
            const startString = mesocycle.startDate.split('T')[0];
            const start = new Date(`${startString}T00:00:00`);
            if (isNaN(start.getTime())) return null;
            const weeksDiff = differenceInCalendarWeeks(today, start, { weekStartsOn: 1 });
            currentWeekCalc = weeksDiff + 1;
        }

        const duration = mesocycle.mesocyclePlan.durationWeeks;
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

        let isSessionReady = false;
        if (userProfile.currentSession?.meta?.date) {
            const sessionDateStr = userProfile.currentSession.meta.date.split('T')[0];
            const todayStr = format(today, 'yyyy-MM-dd');
            
            if (sessionDateStr === todayStr) {
                isSessionReady = true;
            }
        }

        return {
            currentWeek: currentWeekCalc,
            duration,
            isFinished,
            todayName,
            currentMicrocycle,
            todaysSession,
            mesocycleGoal: mesocycle.mesocyclePlan.mesocycleGoal,
            isSessionReady,
            isEvaluationPending // <--- AÑADIDO
        };
    }, [userProfile]);

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
            // Asumiendo que el endpoint de generación de plan es el mismo
            const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/mesocycle/generate`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Error desconocido");
        } catch (error) {
            alert("Error: " + (error as Error).message);
        } finally {
            setCreatingPlan(false);
        }
    };

    // Función modificada para recibir el feedback
    const handleGenerateSession = useCallback(async (feedback: PreSessionFeedback, isRecovery: boolean) => {
        setIsFeedbackModalOpen(false); // Cerrar modal primero
        setGeneratingSession(true);
        setQuoteIndex(0);

        try {
            const token = await user.getIdToken();
            const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/session/generate`;

            const todayDate = format(new Date(), 'yyyy-MM-dd');

            // El foco de la sesión se basa en el día programado (todaysSession) o 'Recuperación Activa'
            const contextFocus = isRecovery
                ? 'Recuperación Activa'
                : dashboardState?.todaysSession?.sessionFocus;

            const payload = {
                userId: user.uid,
                date: todayDate, // Usamos la fecha de HOY
                realTimeFeedback: feedback,
                isRecovery: isRecovery,
                contextFocus: contextFocus
            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                console.log("Sesión generada OK con feedback:", feedback);
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión al generar la sesión.");
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
                    <ProfileMenu 
                        userName={userName}
                        onLogout={handleLogout}
                        onNavigateToProfile={handleNavigateToProfile}
                    />
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
                        <div className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border border-blue-500/50 p-6 rounded-2xl relative overflow-hidden shadow-lg shadow-blue-500/20">
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
                        todaysSession ? (
                            <div className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border border-lime-500/30 p-6 rounded-2xl relative overflow-hidden shadow-lg">

                                {/* --- OVERLAY DE CARGA --- */}
                                {generatingSession && (
                                    <div className="absolute inset-0 z-50 bg-zinc-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 bg-lime-500 blur-xl opacity-20 animate-pulse"></div>
                                            <Dumbbell className="w-16 h-16 text-lime-500 animate-[spin_3s_linear_infinite]" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Diseñando Sesión...</h3>
                                        <p key={quoteIndex} className="text-zinc-400 text-sm min-h-[40px] animate-in slide-in-from-bottom-2 duration-500">
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
                        ) : (
                            // 2c: Día de Descanso
                            <div className="bg-zinc-800 border border-zinc-700 p-6 rounded-2xl text-center">
                                <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                                    <CheckCircle2 className="w-7 h-7 text-zinc-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Día de Descanso</h3>
                                <p className="text-zinc-400 text-sm mb-6">El músculo crece cuando descansas.</p>
                                <button
                                    onClick={() => openFeedbackModal(true)}
                                    disabled={generatingSession}
                                    className="w-full bg-zinc-700 text-white py-3 rounded-xl text-sm"
                                >
                                    {generatingSession ? 'Generando...' : 'Generar Movilidad (Opcional)'}
                                </button>
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
        </div>
    );
};

export default Dashboard;