import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Users, Home, UserPlus } from 'lucide-react';

interface CoachShellProps {
  children: ReactNode;
  title?: string;
}

export default function CoachShell({ children, title }: CoachShellProps) {
  const location = useLocation();
  const nav = [
    { to: '/coach', label: 'Inicio', icon: Home },
    { to: '/coach/invite', label: 'Invitar', icon: UserPlus },
    { to: '/coach/clients', label: 'Clientes', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="border-b border-zinc-800 px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80">FitGen Coach</p>
        {title && <h1 className="text-xl font-bold mt-1">{title}</h1>}
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">{children}</main>

      <nav className="border-t border-zinc-800 px-2 py-2 flex justify-around bg-zinc-900/80">
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
  );
}
