import { useState, useEffect, useMemo, type FC } from 'react';

// Importaciones de Firebase (Separando funciones y tipos)
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, type User, type Auth } from 'firebase/auth'; 
import { getFirestore, doc, onSnapshot, type Firestore, type DocumentData } from 'firebase/firestore'; 

// Importación de Componentes (Asegúrate de que existan, aunque sean stubs)
import AuthLayout from './components/AuthLayout';
import ProfileOnboarding from './components/ProfileOnboarding';
import Dashboard from './components/Dashboard';

// ====================================================================
// TIPOS Y ESTADOS
// ====================================================================

// Estados del usuario en la base de datos (Firestore)
type UserStatus = 'pending_onboarding' | 'pending_approval' | 'approved'; 
type AppStatus = 'unauthenticated' | 'loading_profile' | UserStatus; 

/**
 * 💡 CORRECCIÓN EN TIPADO: Añadimos las propiedades necesarias para el Dashboard.
 */
export interface UserProfile extends DocumentData {
    status: UserStatus;
    onboardingData?: any; 
    name?: string; // Nombre del usuario
    fitnessGoal?: string; // Meta de fitness
    plan?: 'free' | 'premium'; // Plan del usuario
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
// FUNCIÓN DE CONFIGURACIÓN DE FIREBASE (Lectura de .env)
// ====================================================================

const getFirebaseConfig = () => {
    
    // Usamos el prefijo VITE_ para las variables de entorno de Vite
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const appId = import.meta.env.VITE_FIREBASE_APP_ID;

    // Si falta CUALQUIERA de las 4 claves principales, retornamos null
    if (!apiKey || !authDomain || !projectId || !appId) {
        return null;
    }

    // Retorna la configuración mínima requerida
    return {
        apiKey,
        authDomain,
        projectId,
        appId,
    };
};


// ====================================================================
// COMPONENTE PRINCIPAL APP
// ====================================================================

const App: FC = () => {
    // ----------------------------------------------------
    // ESTADOS GLOBALES
    // ----------------------------------------------------
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [authServices, setAuthServices] = useState<{ auth: Auth, db: Firestore } | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false); 
    const [globalError, setGlobalError] = useState<string | null>(null);

    // ----------------------------------------------------
    // EFECTO 1: Inicialización de Firebase y Auth Listener (CRÍTICO)
    // ----------------------------------------------------
    useEffect(() => {
        const firebaseConfig = getFirebaseConfig();

        if (!firebaseConfig) {
            setGlobalError("Error CRÍTICO: Las variables de Firebase no están disponibles. Asegúrate de que el archivo .env esté en la carpeta raíz y el servidor de desarrollo haya sido reiniciado.");
            setIsAuthReady(true);
            return;
        }

        let unsubscribeAuth: () => void;

        try {
            const app = initializeApp(firebaseConfig as any);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuthServices({ auth: authInstance, db: dbInstance });

            // Listener de Autenticación
            unsubscribeAuth = onAuthStateChanged(authInstance, async (authUser) => {
                setUser(authUser);
                setIsAuthReady(true);
            });

        } catch (e) {
            console.error("Error al inicializar Firebase (Runtime):", e);
            setGlobalError(`ERROR CRÍTICO: Fallo al inicializar Firebase. Revise el formato de las claves del .env. Mensaje de error: ${(e as Error).message}`);
            setIsAuthReady(true);
            return () => {}; 
        }

        // Limpieza del Listener
        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
        };

    }, []); 

    // ====================================================
// EFECTO 2: Carga del Perfil de Usuario (Firestore)
// ====================================================
useEffect(() => {
    let unsubscribeProfile: () => void | undefined;

    if (user && authServices?.db) {
        const userDocRef = doc(authServices.db, 'users', user.uid);
        
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnapshot) => {
            
            if (!docSnapshot.exists()) {
                console.log(`Documento de perfil no encontrado. Forzando onboarding.`);
                setUserProfile({ status: 'pending_onboarding' as UserStatus });
                return; 
            }
            
            // Si el documento EXISTE, cargamos los datos.
            const rawData = docSnapshot.data() as DocumentData;
            
            // 💡 CORRECCIÓN CRÍTICA: Desanidamos profileData
            const profileData: UserProfile = {
                // 1. Tomamos los campos de la raíz (status, plan, etc.)
                ...rawData,
                // 2. Sobreescribimos con los campos anidados dentro de profileData
                //    Esto "sube" name, fitnessGoal, etc., al nivel superior del UserProfile.
                ...(rawData.profileData || {}),
                // 3. Aseguramos que el status exista
                status: rawData.status as UserStatus || 'pending_onboarding'
            };


            // 1. Si existe y tiene status, lo usamos
            if (profileData.status) {
                setUserProfile(profileData);
            } else {
                // Si existe pero le falta status (datos corruptos/incompletos), forzamos el onboarding
                console.warn(`Perfil encontrado pero incompleto. Forzando onboarding.`);
                setUserProfile({ status: 'pending_onboarding' as UserStatus });
            }

            // 3. Chequeo de la Custom Claim (Simulación de Aprobación Admin)
            const tokenResult = await user.getIdTokenResult();
            const isApprovedByAdmin = tokenResult.claims.role === 'approved';

            if (isApprovedByAdmin) {
                 setUserProfile(prev => ({ 
                    // Aseguramos que la data previa (name, goal, etc.) se mantenga
                    ...(prev as UserProfile || {}), 
                    status: 'approved' as UserStatus 
                 }));
            }
            
        }, (error) => {
            console.error("Error al leer el perfil de Firestore (red/permisos):", error);
            setGlobalError("Error al cargar la información de tu perfil."); 
        });

    } else {
        setUserProfile(null);
    }

    // Limpieza del Listener de Firestore
    return () => {
        if (unsubscribeProfile) unsubscribeProfile();
    };
}, [user, authServices]);


    // ----------------------------------------------------
    // LÓGICA DE NAVEGACIÓN (Renderizado)
    // ----------------------------------------------------

    const currentStatus: AppStatus = useMemo(() => {
        if (!isAuthReady) return 'unauthenticated'; 
        if (!user) return 'unauthenticated';       
        if (!userProfile) return 'loading_profile'; 
        return userProfile.status;                 
    }, [isAuthReady, user, userProfile]);

    // Manejo de Errores Globales (Pantalla Roja)
    if (globalError) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-8 bg-red-900 text-white text-center">
                <p className='text-xl font-semibold'>⛔ Error Crítico:</p>
                <p className='mt-4 text-sm max-w-lg'>{globalError}</p>
            </div>
        );
    }

    // Loader Inicial (Mientras Firebase Auth se inicializa)
    if (!isAuthReady || currentStatus === 'loading_profile') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-900">
                <svg className="animate-spin h-8 w-8 text-lime-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="ml-3 text-lime-400 font-medium">Verificando sesión y cargando perfil...</p>
            </div>
        );
    }

    // --- RENDERIZADO PRINCIPAL BASADO EN EL ESTADO ---
    
    // 1. No autenticado (Login/Registro)
    if (currentStatus === 'unauthenticated' && authServices) {
        const handleAuthSuccess = () => { console.log("Autenticación exitosa."); }; 
        return <AuthLayout 
        onAuthSuccess={handleAuthSuccess} 
        auth={authServices.auth}/>;
    }

    // 2. Onboarding Requerido
    if (currentStatus === 'pending_onboarding' && user && authServices?.db) {
        return <ProfileOnboarding 
            user={user} 
            db={authServices.db} 
        />;
    }

    // 3. Pendiente de Aprobación
    if (currentStatus === 'pending_approval' && user) {
        return <PendingAccessView user={user} />;
    }

    // 4. Aprobado (Acceso Total)
    if (currentStatus === 'approved' && user && userProfile && authServices) {
        // 💡 Las props que se pasan aquí (userProfile, auth, db) son las que 
        // DashboardProps debe declarar.
        return <Dashboard 
            user={user} 
            db={authServices.db}
            auth={authServices.auth}
            
        />;
    }

    // Fallback:
    return (
        <div className="flex items-center justify-center h-screen p-4 bg-orange-700 text-white text-center">
            <p className='text-xl font-semibold'>Error de Flujo Desconocido.</p>
        </div>
    );
};

export default App;