import type { ReactNode } from 'react';

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-x-hidden">
      {children}
    </div>
  );
}

export function DashboardEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
      {children}
    </p>
  );
}

export function DashboardProgress({
  value,
  label,
  meta,
}: {
  value: number;
  label?: string;
  meta?: string;
}) {
  return (
    <div>
      <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-lime-500 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {(label || meta) && (
        <div className="flex justify-between items-center mt-2.5 gap-3">
          {label ? (
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              {label}
            </span>
          ) : (
            <span />
          )}
          {meta ? (
            <span className="text-[10px] font-medium text-zinc-600 tabular-nums shrink-0">
              {meta}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function DashboardHero({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <DashboardEyebrow>{eyebrow}</DashboardEyebrow>
      <h2 className="text-3xl sm:text-4xl font-bold text-white leading-[1.12] mt-5 mb-4">
        {title}
      </h2>
      {body ? (
        <p className="text-[15px] text-zinc-400 leading-relaxed max-w-[18rem] mx-auto">
          {body}
        </p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}

export function DashboardPrimaryButton({
  children,
  onClick,
  disabled,
  variant = 'lime',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'lime' | 'ghost';
}) {
  const base =
    'w-full max-w-sm mx-auto block font-bold py-4 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed';
  const styles =
    variant === 'lime'
      ? 'bg-lime-500 hover:bg-lime-400 text-zinc-900'
      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700';

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function DashboardIconButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-2.5 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
    >
      {children}
    </button>
  );
}

const DAY_SHORT: Record<string, string> = {
  lunes: 'Lun',
  martes: 'Mar',
  miércoles: 'Mié',
  jueves: 'Jue',
  viernes: 'Vie',
  sábado: 'Sáb',
  domingo: 'Dom',
};

export interface WeekDayRow {
  day: string;
  sessionFocus?: string;
  isToday?: boolean;
  isDone?: boolean;
}

export function WeekSessionList({ days }: { days: WeekDayRow[] }) {
  return (
    <ul className="space-y-0 w-full max-w-sm mx-auto">
      {days.map((row) => (
        <li
          key={row.day}
          className={`flex items-center gap-4 py-3 border-b border-zinc-800/90 last:border-0 ${
            row.isToday ? 'text-lime-400' : ''
          }`}
        >
          <span
            className={`text-xs font-bold w-8 shrink-0 tabular-nums ${
              row.isToday ? 'text-lime-500' : 'text-zinc-500'
            }`}
          >
            {DAY_SHORT[row.day.toLowerCase()] ?? row.day.slice(0, 3)}
          </span>
          <span
            className={`text-sm font-medium leading-snug flex-1 text-left ${
              row.sessionFocus ? 'text-zinc-100' : 'text-zinc-600'
            }`}
          >
            {row.sessionFocus ?? 'Descanso'}
          </span>
          {row.isDone ? <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" /> : null}
        </li>
      ))}
    </ul>
  );
}

export function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-xs mb-8">
          <DashboardProgress value={28} label="Cargando" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">Preparando tu espacio</h1>
        <p className="text-sm text-zinc-500 text-center mt-2">Un momento…</p>
      </div>
      <div className="pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center">
        <span className="w-1 h-1 rounded-full bg-lime-500/50 animate-pulse" />
      </div>
    </DashboardShell>
  );
}

export function SessionGeneratingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex flex-col overflow-hidden">
      <div className="px-6 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full w-2/5 bg-lime-500 animate-pulse" />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-4">
          Sesión de hoy
        </p>
        <h2 className="text-2xl font-bold text-white mb-3">Diseñando tu rutina</h2>
        <p className="text-[15px] text-zinc-400 max-w-[16rem] leading-relaxed">{message}</p>
      </div>
      <div className="pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center">
        <span className="w-1 h-1 rounded-full bg-lime-500/50 animate-pulse" />
      </div>
    </div>
  );
}
