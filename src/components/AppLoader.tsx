import { useEffect, useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import App from '../App';
import LandingPage from './LandingPage';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

// Guardia/Loader de la app: decide qué mostrar según modo PWA y auth
const AppLoader = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Detectar modo de visualización (PWA instalada)
  const isStandalone = useMemo(() => {
    const mql = window.matchMedia?.('(display-mode: standalone)');
    const isIOSStandalone = (window.navigator as any)?.standalone === true; // iOS Safari
    return Boolean(mql?.matches) || isIOSStandalone;
  }, []);

  // Escuchar cambios del display-mode
  useEffect(() => {
    const mql = window.matchMedia?.('(display-mode: standalone)');
    const listener = (e: MediaQueryListEvent) => {
      // Si cambia, recargar la página o manejar el cambio, pero por simplicidad, ignorar ya que useMemo no cambia
      console.log('Display mode changed:', e.matches);
    };
    try {
      mql?.addEventListener?.('change', listener);
      return () => mql?.removeEventListener?.('change', listener);
    } catch {
      return () => {};
    }
  }, []);

  // Escuchar autenticación (sin duplicar lógica de App)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const showAppDirectly = useMemo(() => {
    // 1) Instalado (standalone): ir directo a App (Login/Dashboard dentro)
    if (isStandalone) return true;
    // 2) Navegador con sesión activa: ir a App
    if (authReady && user) return true;
    return false; // 3) Tráfico nuevo en navegador: mostrar Landing
  }, [isStandalone, authReady, user]);

  // Pequeño loader mientras resolvemos auth para evitar parpadeos
  if (!isStandalone && !authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-900">
        <svg className="animate-spin h-8 w-8 text-lime-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>
    );
  }

  if (showAppDirectly) {
    // App maneja AuthLayout / Dashboard / Onboarding internamente
    return <App />;
  }

  // Modo navegador sin sesión: rutas mínimas para Landing y Auth
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      {/* App se encargará de renderizar AuthLayout al estar sin sesión */}
      <Route path="/login" element={<App />} />
      <Route path="/register" element={<App />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
};

export default AppLoader;
