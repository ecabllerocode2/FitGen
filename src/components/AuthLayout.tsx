import { useState, type FC } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  type Auth 
} from 'firebase/auth';

// Definición de las Props que recibe de App.tsx
interface AuthLayoutProps {
  onAuthSuccess: () => void; 
  auth: Auth; // Instancia de Auth de Firebase
}

const AuthLayout: FC<AuthLayoutProps> = ({ auth }) => {
    const [isLogin, setIsLogin] = useState(true); // true para Login, false para Registro
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                // Lógica de Login
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Lógica de Registro
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // Si tiene éxito, App.tsx detecta el cambio en el estado del usuario automáticamente.
            // No necesitamos llamar a onAuthSuccess aquí, el listener en App.tsx lo maneja.

        } catch (e) {
            const firebaseError = e as any;
            let errorMessage = "Ocurrió un error desconocido. Inténtalo de nuevo.";

            // Mapeo de errores comunes de Firebase
            if (firebaseError.code) {
                switch (firebaseError.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        errorMessage = "Credenciales inválidas. Verifica tu email y contraseña.";
                        break;
                    case 'auth/email-already-in-use':
                        errorMessage = "Este correo ya está registrado. Intenta iniciar sesión.";
                        break;
                    case 'auth/weak-password':
                        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
                        break;
                    default:
                        errorMessage = `Error de Firebase: ${firebaseError.code.replace('auth/', '')}`;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-white p-4">
            <div className="w-full max-w-sm bg-zinc-800 p-8 rounded-xl shadow-2xl">
                <h1 className="text-3xl font-bold mb-6 text-lime-400 text-center">
                    {isLogin ? 'Iniciar Sesión' : 'Registrarme'}
                </h1>
                
                {error && (
                    <div className="p-3 mb-4 text-sm font-medium text-red-100 bg-red-600 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white"
                            placeholder="tu@correo.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg focus:ring-lime-500 focus:border-lime-500 text-white"
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-lime-500 text-zinc-900 font-bold py-3 px-4 rounded-lg transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-400 flex items-center justify-center"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-5 w-5 text-zinc-900 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            isLogin ? 'Acceder' : 'Crear Cuenta'
                        )}
                    </button>
                </form>

                {/* Alternar Login/Registro */}
                <p className="text-center text-sm mt-6 text-zinc-400">
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                    <button 
                        type="button"
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError(null); // Limpiar error al cambiar de vista
                        }}
                        className="ml-2 font-semibold text-lime-400 hover:text-lime-300 transition duration-150"
                    >
                        {isLogin ? 'Regístrate' : 'Iniciar Sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthLayout;