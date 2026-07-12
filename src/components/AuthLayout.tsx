import { useState, type FC } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup,
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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [passwordTouched, setPasswordTouched] = useState(false);

    const passwordRules = (pw: string) => {
        return {
            length: pw.length >= 8,
            upper: /[A-Z]/.test(pw),
            lower: /[a-z]/.test(pw),
            number: /[0-9]/.test(pw),
            special: /[^A-Za-z0-9]/.test(pw),
        };
    };

    const passwordStrengthScore = (pw: string) => {
        const rules = Object.values(passwordRules(pw));
        return rules.filter(Boolean).length; // 0..5
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (e) {
            const firebaseError = e as any;
            let errorMessage = 'Error con Google Sign-In. Intenta de nuevo.';
            if (firebaseError.code === 'auth/popup-closed-by-user') errorMessage = 'Has cerrado la ventana antes de completar el inicio con Google.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isLogin) {
                // Lógica de Login
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Validaciones locales antes de mandar a Firebase
                const rules = passwordRules(password);
                if (!Object.values(rules).every(Boolean)) {
                    setError('La contraseña no cumple los requisitos mínimos. Revisa las indicaciones.');
                    setIsLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Las contraseñas no coinciden.');
                    setIsLoading(false);
                    return;
                }

                // Registro
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // Si tiene éxito, App.tsx detecta el cambio en el estado del usuario automáticamente.
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
                        errorMessage = "La contraseña es débil. Asegúrate de seguir las indicaciones.";
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
        <div className="flex items-center justify-center min-h-[100dvh] bg-zinc-950 text-white p-6">
            <div className="w-full max-w-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 text-center mb-6">
                    FitGen
                </p>
                <h1 className="text-2xl font-bold text-white text-center mb-8">
                    {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
                </h1>
                
                {error && (
                    <div className="p-3 mb-6 text-sm text-red-300 bg-red-950/50 border border-red-900/50 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Botón Google */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full bg-white text-zinc-900 font-semibold py-3.5 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 mr-3">
                            <path fill="#fbbc05" d="M43.6 20.5H42V20H24v8h11.3C34.1 33 29.6 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6-6C34.1 6.9 29.3 5 24 5 12.3 5 3 14.3 3 26s9.3 21 21 21c10.5 0 19.2-7.5 20.9-17.5 0.1-0.4 0.1-0.8 0.1-1.5 0-1-0.1-1.4-0.3-2.5z"/>
                            <path fill="#518ef8" d="M6.3 14.8l6.6 4.8C14.6 16.4 19 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6-6C34.1 6.9 29.3 5 24 5 17.3 5 11.4 8.4 6.3 14.8z"/>
                            <path fill="#28b446" d="M24 43c5.6 0 10.8-1.9 15-5.1l-7-5.9C29.9 33.6 27 35 24 35c-5.6 0-10.1-3-12.7-7.5l-6.6 5C6.8 37.8 14.9 43 24 43z"/>
                            <path fill="#f14336" d="M43.6 20.5H42V20H24v8h11.3c-1 2.8-3 5.2-5.4 6.9-0.1 0.1-0.3 0.2-0.4 0.3l7 5.9c1.7-1.4 3.1-3.2 4.3-5.3C46.3 29.9 48 26.1 48 24c0-1-0.1-1.4-0.3-2.5z"/>
                        </svg>
                        {isLoading ? 'Procesando...' : (isLogin ? 'Acceder con Google' : 'Registrarme con Google')}
                    </button>

                    <hr className="border-zinc-800 my-6" />

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-lime-500/50 focus:outline-none text-white"
                                placeholder="tu@correo.com"
                            />
                            <p className="text-xs text-zinc-400 mt-2">Usa tu email profesional o personal. Te enviaremos notificaciones relacionadas con tu progreso.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setPasswordTouched(true); }}
                                required
                                className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-lime-500/50 focus:outline-none text-white"
                                placeholder={isLogin ? 'Tu contraseña' : 'Mínimo 8 caracteres, mezcla letras y números'}
                            />

                            {/* Indicador de fuerza */}
                            <div className="mt-3">
                                <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-200 ${passwordStrengthScore(password) >= 4 ? 'bg-lime-500' : passwordStrengthScore(password) >= 2 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${(passwordStrengthScore(password) / 5) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs mt-2 text-zinc-400">Consejo: una contraseña segura tiene al menos 8 caracteres, mayúsculas, minúsculas, números y símbolos. <span className="font-medium">Puntuación: {passwordStrengthScore(password)}/5</span></p>

                                {/* Lista de checks */}
                                {passwordTouched && (
                                    <ul className="mt-2 text-sm space-y-1">
                                        {Object.entries(passwordRules(password)).map(([key, ok]) => (
                                            <li key={key} className={`flex items-center ${ok ? 'text-lime-300' : 'text-zinc-500'}`}>
                                                <span className={`inline-block w-4 h-4 mr-2 ${ok ? 'bg-lime-400 rounded-sm' : 'bg-zinc-600 rounded-sm'}`} />
                                                {key === 'length' ? 'Al menos 8 caracteres' : key === 'upper' ? 'Incluye mayúscula' : key === 'lower' ? 'Incluye minúscula' : key === 'number' ? 'Incluye número' : 'Incluye símbolo'}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Confirmar contraseña</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl focus:border-lime-500/50 focus:outline-none text-white"
                                    placeholder="Repite tu contraseña"
                                />
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="text-xs text-red-400 mt-2">Las contraseñas no coinciden.</p>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || (!isLogin && passwordStrengthScore(password) < 4)}
                            className="w-full bg-lime-500 text-zinc-900 font-bold py-3.5 px-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-lime-400 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-zinc-900 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                isLogin ? 'Acceder' : 'Crear Cuenta'
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-8">
                    <div className="flex items-center justify-center gap-2 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                        <button
                            type="button"
                            onClick={() => { setIsLogin(true); setError(null); }}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${isLogin ? 'bg-lime-500 text-zinc-900' : 'text-zinc-500'}`}
                        >
                            Acceder
                        </button>
                        <button
                            type="button"
                            onClick={() => { setIsLogin(false); setError(null); }}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition ${!isLogin ? 'bg-lime-500 text-zinc-900' : 'text-zinc-500'}`}
                        >
                            Registrarme
                        </button>
                    </div>

                    <p className="text-center text-xs mt-4 text-zinc-600 leading-relaxed">
                        {isLogin ? 'Introduce tus credenciales para continuar.' : 'Crea una cuenta para guardar tu progreso.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;