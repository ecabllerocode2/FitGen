import { useState, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

export function AppShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-x-hidden ${className}`}>
      {children}
    </div>
  );
}

export function AppEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{children}</p>
  );
}

export function AppProgress({
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
            <span className="text-[10px] font-medium text-zinc-600 tabular-nums shrink-0">{meta}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function AppHero({
  eyebrow,
  title,
  body,
  children,
  align = 'center',
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children?: ReactNode;
  align?: 'center' | 'left';
}) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`w-full max-w-sm ${alignClass}`}>
      <AppEyebrow>{eyebrow}</AppEyebrow>
      <h2 className="text-3xl sm:text-4xl font-bold text-white leading-[1.12] mt-5 mb-4">{title}</h2>
      {body ? (
        <p
          className={`text-[15px] text-zinc-400 leading-relaxed ${align === 'center' ? 'max-w-[18rem] mx-auto' : ''}`}
        >
          {body}
        </p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}

export function AppPrimaryButton({
  children,
  onClick,
  disabled,
  variant = 'lime',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'lime' | 'ghost';
  type?: 'button' | 'submit';
}) {
  const base =
    'w-full max-w-sm mx-auto block font-bold py-4 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed';
  const styles =
    variant === 'lime'
      ? 'bg-lime-500 hover:bg-lime-400 text-zinc-900'
      : 'bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-zinc-700';

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function AppIconButton({
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

export function AppBackButton({ onClick, label = 'Volver' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-zinc-500 hover:text-zinc-200 transition-colors text-sm"
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

export function AppFixedFooter({ children }: { children: ReactNode }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent">
      {children}
    </div>
  );
}

export function AppOptionButton({
  selected,
  onClick,
  children,
  compact,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-200 active:scale-[0.98] ${
        compact ? 'px-4 py-3' : 'px-4 py-4'
      } ${
        selected
          ? 'border-lime-500/50 bg-lime-500/10 text-white'
          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
      }`}
    >
      {children}
    </button>
  );
}

export function AppScaleRow({
  value,
  onChange,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  labels?: Record<number, string>;
}) {
  return (
    <div className="flex flex-col gap-2">
      {[5, 4, 3, 2, 1].map((n) => (
        <AppOptionButton key={n} selected={value === n} onClick={() => onChange(n)} compact>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tabular-nums text-lime-400/90 w-6 shrink-0">{n}</span>
            <span className="text-sm leading-snug">{labels?.[n] ?? `Nivel ${n}`}</span>
          </div>
        </AppOptionButton>
      ))}
    </div>
  );
}

export function AppAccordion({
  title,
  count,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-zinc-800/90">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-sm font-semibold text-zinc-200">{title}</span>
          {count !== undefined ? (
            <span className="text-[10px] text-zinc-600 tabular-nums">· {count}</span>
          ) : null}
          {badge ? (
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">· {badge}</span>
          ) : null}
        </div>
        <span className="text-zinc-600 text-sm shrink-0 ml-3">{open ? '−' : '+'}</span>
      </button>
      {open ? <div className="pb-5">{children}</div> : null}
    </div>
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
          className={`flex items-center gap-4 py-3 border-b border-zinc-800/90 last:border-0`}
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

export function AppLoading({ title = 'Preparando tu espacio', subtitle = 'Un momento…' }: { title?: string; subtitle?: string }) {
  return (
    <AppShell>
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-xs mb-8">
          <AppProgress value={28} label="Cargando" />
        </div>
        <h1 className="text-2xl font-bold text-white text-center">{title}</h1>
        <p className="text-sm text-zinc-500 text-center mt-2">{subtitle}</p>
      </div>
      <div className="pb-[max(2rem,env(safe-area-inset-bottom))] flex justify-center">
        <span className="w-1 h-1 rounded-full bg-lime-500/50 animate-pulse" />
      </div>
    </AppShell>
  );
}

export { SessionGeneratingOverlay } from '../SessionGeneratingOverlay';

/* Dashboard aliases */
export const DashboardShell = AppShell;
export const DashboardEyebrow = AppEyebrow;
export const DashboardProgress = AppProgress;
export const DashboardHero = AppHero;
export const DashboardPrimaryButton = AppPrimaryButton;
export const DashboardIconButton = AppIconButton;
export const DashboardLoading = AppLoading;
