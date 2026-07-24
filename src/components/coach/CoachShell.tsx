import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Users, Home, UserPlus, LogOut } from 'lucide-react';
import { auth } from '../../firebase';

interface CoachShellProps {
  children: ReactNode;
  title?: string;
  /** Wider content for rich client dashboards */
  wide?: boolean;
}

export default function CoachShell({ children, title, wide = false }: CoachShellProps) {
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const nav = [
    { to: '/coach', label: 'Inicio', icon: Home },
    { to: '/coach/invite', label: 'Invitar', icon: UserPlus },
    { to: '/coach/clients', label: 'Clientes', icon: Users },
  ];

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 text-white flex flex-col lg:flex-row overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 shrink-0 border-r border-zinc-800/80 bg-zinc-950/95">
        <div className="px-5 py-5 border-b border-zinc-800/80">
          <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80">FitGen Coach</p>
          {title && <h1 className="text-lg font-bold mt-2 truncate text-white">{title}</h1>}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/coach' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'bg-lime-500/10 text-lime-400'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5 text-xs text-zinc-400 hover:text-red-400 hover:border-zinc-700 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Saliendo…' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {/* Mobile header */}
        <header className="lg:hidden border-b border-zinc-800 px-4 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80">FitGen Coach</p>
            {title && <h1 className="text-xl font-bold mt-1 truncate">{title}</h1>}
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="shrink-0 flex items-center gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-red-400 hover:border-zinc-700 transition-colors disabled:opacity-50"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <main
          className={`flex-1 min-h-0 overflow-y-auto overscroll-y-contain touch-pan-y scrollbar-hide px-4 py-6 pb-28 lg:pb-8 lg:px-8 w-full mx-auto ${
            wide ? 'max-w-7xl' : 'max-w-lg lg:max-w-3xl'
          }`}
        >
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden border-t border-zinc-800 px-2 py-2 flex justify-around bg-zinc-900/80">
          {nav.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || (to !== '/coach' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-xs ${
                  active ? 'text-lime-400' : 'text-zinc-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
