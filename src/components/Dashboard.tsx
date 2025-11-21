import React, { useState, useEffect, useMemo } from 'react';
import { type User, signOut, type Auth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { format, differenceInCalendarWeeks, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Dumbbell,
    Calendar,
    Activity,
    CheckCircle2,
    Play,
    LogOut,
    Zap
} from 'lucide-react';

// 👇 IMPORTACIÓN NUEVA
import InstallPwaBanner from './InstallPwaBanner';

// ====================================================================
// 1. DEFINICIÓN DE TIPOS (Igual que antes)
// ====================================================================

interface SessionPlan {
    dayOfWeek: string;
    sessionFocus: string;
}
// ... (MANTENEMOS TUS INTERFACES EXACTAMENTE IGUAL) ...
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
// 2. COMPONENTE DASHBOARD
// ====================================================================

const Dashboard: React.FC<DashboardProps> = ({ user, db, auth }) => {

    const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Estados para botones de carga
    const [generatingSession, setGeneratingSession] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    // A. Suscripción a Firestore
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

    // Efecto para rotar frases
    useEffect(() => {
        let interval: any;
        if (generatingSession) {
            interval = setInterval(() => {
                setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [generatingSession]);

    // B. Lógica de Tiempo y Estado
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
        const todayNameLower = format(today, 'eeee', { locale: es });
        const todayName = todayNameLower.charAt(0).toUpperCase() + todayNameLower.slice(1);
        const weekIndex = Math.min(currentWeekCalc, duration) - 1;
        const currentMicrocycle = mesocycle.mesocyclePlan.microcycles[weekIndex] || null;

        const todaysSession = currentMicrocycle?.sessions.find(
            s => s.dayOfWeek.toLowerCase() === todayNameLower
        );

        let isSessionReady = false;
        if (userProfile.currentSession?.meta?.date) {
            const sessionDate = parseISO(userProfile.currentSession.meta.date);
            if (isSameDay(sessionDate, today)) {
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
            isSessionReady 
        };
    }, [userProfile]);

    // C. Acciones
    const userName = userProfile?.profileData?.name || userProfile?.name || 'Atleta';

    const handleLogout = async () => {
        try { await signOut(auth); } catch (e) { console.error(e); }
    };

    const handleCreatePlan = async () => {
        setCreatingPlan(true);
        try {
            const token = await user.getIdToken();
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

    const handleGenerateSession = async (isRecovery: boolean = false) => {
        setGeneratingSession(true);
        setQuoteIndex(0); 

        try {
            const token = await user.getIdToken();
            const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/session/generate`;

            const contextFocus = isRecovery
                ? 'Recuperación Activa'
                : dashboardState?.todaysSession?.sessionFocus;

            const payload = {
                userId: user.uid,
                date: new Date().toISOString(),
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
                console.log("Sesión generada OK");
            } else {
                alert("Error: " + data.error);
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión.");
        } finally {
            setGeneratingSession(false);
        }
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

    // DASHBOARD VACÍO (SIN PLAN)
    if (!dashboardState) {
        return (
            <div className="min-h-screen bg-zinc-900 p-6 flex flex-col items-center justify-center text-center relative">
                <button onClick={handleLogout} className="absolute top-6 right-6 p-2 bg-zinc-800 rounded-full text-zinc-400">
                    <LogOut className="w-5 h-5" />
                </button>
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
                
                {/* 👇 AÑADIDO: Banner PWA aquí también por si el usuario es nuevo */}
                <InstallPwaBanner /> 
            </div>
        );
    }

    const { currentWeek, duration, todayName, currentMicrocycle, todaysSession, mesocycleGoal, isSessionReady } = dashboardState;

    return (
        <div className="min-h-screen bg-zinc-900 text-white pb-24 relative"> {/* relative para posicionar banner */}

            {/* HEADER */}
            <header className="bg-zinc-800 p-6 rounded-b-3xl shadow-xl mb-6 border-b border-zinc-700 relative">
                <div className="flex justify-between items-start mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Hola, <span className="text-lime-400">{userName.split(' ')[0]}</span></h1>
                        <p className="text-xs text-zinc-400 mt-1 font-medium uppercase"> {mesocycleGoal}</p>
                    </div>
                    <button onClick={handleLogout} className="p-2 bg-zinc-700/50 rounded-full text-zinc-400"><LogOut className="w-4 h-4" /></button>
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
                {/* CARD PRINCIPAL */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-lime-400" />
                        <h2 className="text-lg font-bold uppercase text-zinc-100">{todayName} <span className="text-zinc-500 text-sm font-normal">(Hoy)</span></h2>
                    </div>

                    {todaysSession ? (
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
                                    <button
                                        onClick={handleStartWorkout}
                                        className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(132,204,22,0.4)] animate-in zoom-in-95 duration-300"
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        COMENZAR SESIÓN
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleGenerateSession(false)}
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
                        <div className="bg-zinc-800 border border-zinc-700 p-6 rounded-2xl text-center">
                            <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center mb-4 mx-auto">
                                <CheckCircle2 className="w-7 h-7 text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Día de Descanso</h3>
                            <p className="text-zinc-400 text-sm mb-6">El músculo crece cuando descansas.</p>
                            <button onClick={() => handleGenerateSession(true)} disabled={generatingSession} className="w-full bg-zinc-700 text-white py-3 rounded-xl text-sm">
                                {generatingSession ? 'Generando...' : 'Generar Movilidad (Opcional)'}
                            </button>
                        </div>
                    )}
                </section>

                {/* LISTA SEMANAL */}
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