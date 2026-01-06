import { useState, useEffect, useMemo, type FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importaciones de Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type User, type Auth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, type Firestore, type DocumentData } from 'firebase/firestore';

// Importación de Componentes
import AuthLayout from './components/AuthLayout';
import ProfileOnboarding from './components/ProfileOnboarding';
import Dashboard from './components/Dashboard';
import WorkoutOverview from './components/WorkoutOverview';
import WorkoutPlayer from './components/WorkoutPlayer';
import MesocycleEvaluate from './components/MesocycleEvaluate';

// ====================================================================
// TIPOS Y ESTADOS
// ====================================================================

type UserStatus = 'pending_onboarding' | 'pending_approval' | 'approved';
type AppStatus = 'unauthenticated' | 'loading_profile' | UserStatus;

export interface UserProfile extends DocumentData {
    status: UserStatus;
    onboardingData?: any;
    name?: string;
    fitnessGoal?: string;
    plan?: 'free' | 'premium';
    currentSession?: any;
    currentMesocycle?: any; // Añadido para evitar errores de tipo en el guard de ruta
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
        weeklyScheduleContext: any[]; // Usaremos 'any[]' aquí para simplicidad de App
        availableEquipment: string[];
        location: string;
        [key: string]: any;
    };
}

// ====================================================================
// VISTAS DE ESTADO (PENDING ACCESS)
// ====================================================================

const PendingAccessView: FC<{ user: User }> = ({ user }) => {
    const simulateApproval = async () => {
        try {
            console.log("Simulando aprobación... forzando refresco de token.");
            await user.getIdTokenResult(true);
            window.location.reload();
        } catch (e) {
            console.error("Error al forzar refresco de token (simulación):", e);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-zinc-900 text-white">
            <div className="bg-zinc-800 p-8 rounded-xl shadow-2xl max-w-sm border border-zinc-700">
                <svg className="w-16 h-16 mx-auto mb-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h2 className="text-2xl font-bold mb-2">Acceso Pendiente de Aprobación</h2>
                <p className="text-zinc-400 mb-6">
                    ¡Gracias por completar tu perfil! Tu solicitud ha sido enviada.
                </p>
                <button
                    onClick={simulateApproval}
                    className="w-full bg-lime-500 text-zinc-900 font-bold py-3 px-4 rounded-lg hover:bg-lime-400 transition duration-150"
                >
                    Recargar Estado (Simular Aprobación)
                </button>
            </div>
        </div>
    );
};

// ====================================================================
// FUNCIÓN DE CONFIGURACIÓN DE FIREBASE
// ====================================================================

// ====================================================================
// COMPONENTE PRINCIPAL APP
// ====================================================================

const App: FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [authServices, setAuthServices] = useState<{ auth: Auth, db: Firestore } | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);

    // EFECTO 1: Escuchar el estado de autenticación
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (authUser) => {
            setUser(authUser);
            setIsAuthReady(true);
        });
        
        // Setear los servicios de Firebase disponibles desde firebase.ts
        setAuthServices({ 
            auth: firebaseAuth as Auth, 
            db: firebaseDb as Firestore 
        });
        
        return () => unsubscribeAuth();
    }, []);

    // EFECTO 2: Carga del Perfil
    useEffect(() => {
        let unsubscribeProfile: () => void | undefined;
        if (user && authServices?.db) {
            const userDocRef = doc(authServices.db, 'users', user.uid);
            unsubscribeProfile = onSnapshot(userDocRef, async (docSnapshot) => {
                if (!docSnapshot.exists()) {
                    setUserProfile({ status: 'pending_onboarding' as UserStatus });
                    return;
                }
                const rawData = docSnapshot.data() as DocumentData;
                const profileData: UserProfile = {
                    ...rawData,
                    ...(rawData.profileData || {}),
                    status: rawData.status as UserStatus || 'pending_onboarding'
                };

                if (profileData.status) {
                    setUserProfile(profileData);
                } else {
                    setUserProfile({ status: 'pending_onboarding' as UserStatus });
                }

                try {
                    const tokenResult = await user.getIdTokenResult();
                    if (tokenResult.claims.role === 'approved') {
                        setUserProfile(prev => ({ ...(prev as UserProfile || {}), status: 'approved' as UserStatus }));
                    }
                } catch (e) { console.error(e); }

            }, (error) => {
                console.error("Error perfil:", error);
                setGlobalError("Error al cargar perfil.");
            });
        } else {
            setUserProfile(null);
        }
        return () => { if (unsubscribeProfile) unsubscribeProfile(); };
    }, [user, authServices]);

    // Lógica de Estado
    const currentStatus: AppStatus = useMemo(() => {
        if (!isAuthReady) return 'unauthenticated';
        if (!user) return 'unauthenticated';
        if (!userProfile) return 'loading_profile';
        return userProfile.status;
    }, [isAuthReady, user, userProfile]);

    // --- RENDERIZADO ---

    if (globalError) {
        return <div className="h-screen flex items-center justify-center bg-red-900 text-white">{globalError}</div>;
    }

    if (!isAuthReady || currentStatus === 'loading_profile') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900">
                <svg className="animate-spin h-8 w-8 text-lime-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </div>
        );
    }

    if (currentStatus === 'unauthenticated' && authServices) {
        return <AuthLayout onAuthSuccess={() => { }} auth={authServices.auth} />;
    }

    if (currentStatus === 'pending_onboarding' && user && authServices?.db) {
        return <ProfileOnboarding user={user} db={authServices.db} />;
    }

    if (currentStatus === 'pending_approval' && user) {
        return <PendingAccessView user={user} />;
    }

    // 4. APROBADO: CONFIGURACIÓN DE RUTAS
    if (currentStatus === 'approved' && user && userProfile && authServices) {
        if (!userProfile.currentMesocycle && window.location.pathname !== '/') {
            return <Navigate to="/" replace />;
        }
        return (
            <Routes>
                {/* 1. DASHBOARD (Home) */}
                <Route path="/" element={
                    <Dashboard
                        user={user}
                        db={authServices.db}
                        auth={authServices.auth}
                    />
                } />

                <Route path="/profile-onboarding" element={
                    <ProfileOnboarding
                        user={user}
                        db={authServices.db}
                        initialData={userProfile} />
                } />

                {/* 2. VISTA GENERAL DE ENTRENAMIENTO (Resumen) */}
                <Route path="/workout/today" element={
                    userProfile?.currentSession ? (
                        <WorkoutOverview session={userProfile.currentSession as any} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                } />

                {/* 3. PLAYER DE ENTRENAMIENTO (Paso a paso) */}
                <Route path="/workout/player" element={
                    userProfile?.currentSession ? (
                        <WorkoutPlayer session={userProfile.currentSession as any} />
                    ) : (
                        <Navigate to="/" replace />
                    )
                } />

                {/* 4. VISTA DE EVALUACIÓN DEL MESOCICLO */}
                <Route path="/mesocycle/evaluate" element={
                    userProfile?.currentMesocycle ? ( // Se requiere que exista un mesociclo para evaluar
                        <MesocycleEvaluate
                            user={user} // Propiedad 'user' pasada y con tipo corregido
                        />
                    ) : (
                        // Si no hay plan, regresa al dashboard
                        <Navigate to="/" replace />
                    )
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }

    return <div className="flex items-center justify-center h-screen bg-zinc-900 text-white">Estado desconocido</div>;
};

export default App;