import React, { useState, useEffect, useMemo } from 'react';
// Eliminada la importación de useNavigate para evitar el crash de enrutamiento
import { type User, signOut, type Auth } from 'firebase/auth';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { format, differenceInCalendarWeeks, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { 
    Dumbbell, 
    Calendar, 
    Activity, 
    AlertCircle, 
    CheckCircle2, 
    Play, 
    RefreshCw, 
    Trophy,
    LogOut,
    Zap 
} from 'lucide-react'; 

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
    status?: string;
}

interface UserProfile {
    profileData?: {
        name: string;
        fitnessGoal?: string;
        [key: string]: any;
    };
    plan?: 'free' | 'premium' | 'trial'; 
    currentMesocycle?: CurrentMesocycleData; 
    name?: string; 
}

interface DashboardProps {
  user: User;
  db: Firestore;
  auth: Auth; 
  // Opcional: Si el componente padre maneja la navegación, se podría pasar una prop:
  // onStartWorkout: () => void; 
}

// ====================================================================
// 2. COMPONENTE DASHBOARD
// ====================================================================

const Dashboard: React.FC<DashboardProps> = ({ user, db, auth }) => {
    // ELIMINADO: const navigate = useNavigate();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    
    const [generatingSession, setGeneratingSession] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);

    // ----------------------------------------------------------------
    // A. Suscripción a Firestore en Tiempo Real
    // ----------------------------------------------------------------
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

    // ----------------------------------------------------------------
    // B. Lógica de Tiempo y Estado (Memoizado)
    // ----------------------------------------------------------------
    const dashboardState = useMemo(() => {
        // 1. Si no hay perfil o mesociclo, retornamos null inmediatamente
        if (!userProfile?.currentMesocycle) return null;

        const mesocycle = userProfile.currentMesocycle;
        const today = new Date();
        
        let currentWeekCalc = 1;
        if (mesocycle.startDate) {
            
            const startString = mesocycle.startDate.split('T')[0];
            const start = new Date(`${startString}T00:00:00`); 

            // ✅ CRÍTICO: Comprobación de fecha válida para prevenir crash.
            if (isNaN(start.getTime())) { 
                console.error("Dato corrupto: mesocycle.startDate no es una fecha válida.");
                return null;
            }

            // weekStartsOn: 1 (Lunes)
            const weeksDiff = differenceInCalendarWeeks(today, start, { weekStartsOn: 1 });
            currentWeekCalc = weeksDiff + 1; 
        }

        const duration = mesocycle.mesocyclePlan.durationWeeks;
        const isFinished = currentWeekCalc > duration;
        
        const todayNameLower = format(today, 'eeee', { locale: es });
        const todayName = todayNameLower.charAt(0).toUpperCase() + todayNameLower.slice(1);

        const weekIndex = Math.min(currentWeekCalc, duration) - 1;
        // Uso de || null para asegurar que el valor sea null si es undefined/out-of-bounds
        const currentMicrocycle = mesocycle.mesocyclePlan.microcycles[weekIndex] || null;

        const todaysSession = currentMicrocycle?.sessions.find(
            s => s.dayOfWeek.toLowerCase() === todayNameLower
        );

        return {
            currentWeek: currentWeekCalc,
            duration,
            isFinished,
            todayName,
            currentMicrocycle,
            todaysSession,
            mesocycleGoal: mesocycle.mesocyclePlan.mesocycleGoal
        };
    }, [userProfile]); 

    // ----------------------------------------------------------------
    // C. Helpers: Nombre de Usuario y Logout
    // ----------------------------------------------------------------
    
    const userName = userProfile?.profileData?.name || userProfile?.name || 'Atleta';

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    // ----------------------------------------------------------------
    // D. Manejadores de API (Completados con tu lógica original)
    // ----------------------------------------------------------------

    const handleCreatePlan = async () => {
        setCreatingPlan(true);
        try {
            const token = await user.getIdToken();
            const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/mesocycle/generate`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Error desconocido");
            
        } catch (error) {
            console.error(error);
            alert("Error al crear el plan: " + (error as Error).message);
        } finally {
            setCreatingPlan(false);
        }
    };

    const handleGenerateSession = async (isRecovery: boolean = false) => {
        setGeneratingSession(true);
        try {
            const token = await user.getIdToken();
            const endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/session/generate`;
            
            // Se mantiene el uso de optional chaining para seguridad
            const contextFocus = isRecovery 
                ? 'Recuperación Activa, Estiramientos y Movilidad' 
                : dashboardState?.todaysSession?.sessionFocus;

            const payload = {
                userId: user.uid,
                date: new Date().toISOString(),
                isRecovery: isRecovery,
                contextFocus: contextFocus
            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            
            if (data.success) {
                // Aquí iría la lógica de navegación (ej: navigate('/workout/today');)
                console.log("Sesión generada:", data);
                alert("✅ ¡Sesión lista! (Lógica de redirección pendiente)");
            } else {
                alert("Error: " + data.error);
            }

        } catch (error) {
            console.error(error);
            alert("Error de conexión con el servidor.");
        } finally {
            setGeneratingSession(false);
        }
    };

    // ELIMINADO: const handleGoToWorkout = () => { navigate('/workout/today'); };

    // ----------------------------------------------------------------
    // E. RENDERIZADO
    // ----------------------------------------------------------------

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-white">
                <Activity className="w-10 h-10 text-lime-500 animate-spin mb-4" />
                <p className="text-zinc-400 animate-pulse">Cargando tu entrenamiento...</p>
            </div>
        );
    }

    // --- CASO 1: USUARIO SIN PLAN / DATOS CORRUPTOS ---
    if (!dashboardState) { 
        return (
            <div className="min-h-screen bg-zinc-900 p-6 flex flex-col items-center justify-center text-center relative">
                <button 
                    onClick={handleLogout}
                    className="absolute top-6 right-6 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                >
                    <LogOut className="w-5 h-5" />
                </button>

                <div className="bg-zinc-800 p-8 rounded-2xl shadow-2xl border border-zinc-700 max-w-md w-full">
                    <Dumbbell className="w-16 h-16 text-lime-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-bold text-white mb-2">¡Hola, {userName.split(' ')[0]}!</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Ya tenemos tu perfil. Ahora es momento de que nuestra IA diseñe tu plan de 4 semanas.
                    </p>
                    <button 
                        onClick={handleCreatePlan}
                        disabled={creatingPlan}
                        className="w-full bg-lime-500 text-zinc-900 px-6 py-4 rounded-xl font-bold hover:bg-lime-400 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {creatingPlan ? (
                            <>
                                <Activity className="animate-spin w-5 h-5" />
                                Diseñando Plan...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5" />
                                Generar Mi Primer Mesociclo
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // --- CASO 2: DASHBOARD PRINCIPAL ---
    const { 
        currentWeek, 
        duration, 
        isFinished, 
        todayName, 
        currentMicrocycle, 
        todaysSession, 
        mesocycleGoal 
    } = dashboardState;

    return (
        <div className="min-h-screen bg-zinc-900 text-white pb-24"> 
            
            {/* 1. HEADER */}
            <header className="bg-zinc-800 p-6 rounded-b-3xl shadow-xl mb-6 border-b border-zinc-700 relative overflow-hidden">
                {/* Decoración */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-lime-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="flex justify-between items-start mb-5 relative z-10">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Hola, <span className="text-lime-400">{userName.split(' ')[0]}</span>
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1 font-medium uppercase tracking-wide">
                            Objetivo: {mesocycleGoal}
                        </p>
                    </div>
                    
                    {/* Área de Acciones de Usuario (Logout + Plan) */}
                    <div className="flex flex-col items-end gap-2">
                        <button 
                            onClick={handleLogout}
                            className="p-2 bg-zinc-700/50 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-600 transition-colors"
                            aria-label="Cerrar Sesión"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                        
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                            userProfile?.plan === 'premium' 
                                ? 'bg-lime-500/20 text-lime-400 border-lime-500/50' 
                                : 'bg-zinc-700 text-zinc-400 border-zinc-600'
                        }`}>
                            {userProfile?.plan === 'premium' ? 'PRO' : 'FREE'}
                        </span>
                    </div>
                </div>

                {/* Barra de Progreso */}
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-700/50 backdrop-blur-sm relative z-10">
                    <div className="flex justify-between text-sm mb-2 font-medium">
                        <span className="text-zinc-300">Semana {currentWeek} <span className="text-zinc-500">/ {duration}</span></span>
                        <span className="text-lime-400">{currentMicrocycle?.focus}</span>
                    </div>
                    <div className="w-full bg-zinc-700 h-2.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-lime-500 h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(132,204,22,0.5)]" 
                            style={{ width: `${Math.min((currentWeek / duration) * 100, 100)}%` }}
                        ></div>
                    </div>
                    {isFinished && (
                        <div className="mt-3 flex items-center gap-2 text-yellow-400 text-xs font-bold bg-yellow-400/10 p-2 rounded-lg">
                            <Trophy className="w-4 h-4" />
                            <span>¡Ciclo Completado! Realiza tu evaluación final.</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="px-5 space-y-8">
                
                {/* 2. CARD PRINCIPAL: ACCIÓN DE HOY */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-lime-400" />
                        <h2 className="text-lg font-bold uppercase tracking-wide text-zinc-100">
                            {todayName} <span className="text-zinc-500 text-sm normal-case font-normal">(Hoy)</span>
                        </h2>
                    </div>

                    {todaysSession ? (
                        // --- OPCIÓN A: HAY ENTRENAMIENTO ---
                        <div className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border border-lime-500/30 p-6 rounded-2xl relative overflow-hidden shadow-lg hover:shadow-lime-900/10 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Dumbbell className="w-32 h-32 text-lime-500 rotate-12" />
                            </div>
                            
                            <div className="relative z-10">
                                <span className="inline-block bg-lime-500/10 text-lime-400 text-xs font-bold px-2 py-1 rounded mb-3 border border-lime-500/20">
                                    ENTRENAMIENTO PROGRAMADO
                                </span>
                                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                                    {todaysSession.sessionFocus}
                                </h3>
                                
                                <div className="flex items-center gap-4 text-sm text-zinc-400 mb-5">
                                    <span className="flex items-center gap-1">
                                        <Activity className="w-4 h-4 text-lime-500" />
                                        RPE: <span className="text-white">{currentMicrocycle?.intensityRpe}</span>
                                    </span>
                                </div>

                                <div className="bg-zinc-900/50 p-3 rounded-lg mb-6 border-l-2 border-zinc-600">
                                    <p className="text-xs text-zinc-300 italic line-clamp-2">
                                        "{currentMicrocycle?.notes}"
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleGenerateSession(false)}
                                    disabled={generatingSession}
                                    className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-lime-500/20 active:scale-95"
                                >
                                    {generatingSession ? (
                                        <Activity className="animate-spin w-5 h-5" />
                                    ) : (
                                        <>
                                            <Play className="w-5 h-5 fill-current" />
                                            GENERAR & EMPEZAR
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        // --- OPCIÓN B: DÍA DE DESCANSO ---
                        <div className="bg-zinc-800 border border-zinc-700 p-6 rounded-2xl text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5"></div> 
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center mb-4 shadow-inner">
                                    <CheckCircle2 className="w-7 h-7 text-zinc-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Día de Descanso</h3>
                                <p className="text-zinc-400 text-sm mb-6 max-w-xs mx-auto">
                                    El descanso es cuando el músculo crece. Hoy no tienes pesas programadas.
                                </p>
                                
                                <div className="w-full p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-5">
                                    <p className="text-xs text-yellow-200 flex items-center justify-center gap-2 font-medium">
                                        <AlertCircle className="w-4 h-4" />
                                        Recomendación: Camina o haz estiramientos.
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleGenerateSession(true)}
                                    disabled={generatingSession}
                                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-3.5 rounded-xl text-sm transition-colors border border-zinc-600"
                                >
                                    {generatingSession ? 'Generando...' : 'Generar Sesión de Movilidad (Opcional)'}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* 3. VISTA DE LA SEMANA (Microciclo) */}
                <section>
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 px-1">
                        Planificación Semanal
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        {currentMicrocycle?.sessions.map((session, idx) => {
                            const isToday = session.dayOfWeek.toLowerCase() === todayName.toLowerCase();
                            return (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-xl flex justify-between items-center border transition-all ${
                                        isToday 
                                        ? 'bg-lime-500/5 border-lime-500/40 shadow-md shadow-lime-900/10' 
                                        : 'bg-zinc-800 border-zinc-700/50'
                                    }`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold uppercase mb-1 ${
                                            isToday ? 'text-lime-400' : 'text-zinc-500'
                                        }`}>
                                            {session.dayOfWeek} {isToday && '• HOY'}
                                        </span>
                                        <span className="text-sm font-medium text-zinc-200">
                                            {session.sessionFocus}
                                        </span>
                                    </div>
                                    
                                    <div className={`h-3 w-3 rounded-full border ${
                                        isToday 
                                        ? 'bg-lime-500 border-lime-400 shadow-[0_0_8px_rgba(132,204,22,0.6)]' 
                                        : 'bg-zinc-700 border-zinc-600'
                                    }`}></div> 
                                </div>
                            );
                        })}
                        
                        {(!currentMicrocycle?.sessions || currentMicrocycle.sessions.length === 0) && (
                            <p className="text-zinc-500 text-sm italic text-center py-4">
                                No hay sesiones visibles para esta semana.
                            </p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;