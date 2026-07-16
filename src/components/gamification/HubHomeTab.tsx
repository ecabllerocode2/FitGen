import { Calendar, Flame, TrendingUp, Award, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AvatarAppearance } from '@fitgen/visual';
import { AvatarPreview, FitCoin } from '@fitgen/visual';
import { formatFitCoins } from '../../utils/gamificationDisplay';

type HubHomeTabProps = {
  athleteName: string;
  fitCoins: number;
  seasonPoints: number;
  totalSessions: number;
  currentStreak: number;
  weeksCompleted: number;
  mesocyclesCompleted: number;
  activeDays: number;
  thisWeekCount: number;
  lastSessionDate: Date | null;
  motivationalMessage: string;
  currentWeekMessage: string;
  avatarBaseStage: number;
  avatarAppearance: AvatarAppearance;
  onAvatarAppearanceChange: (next: AvatarAppearance) => void;
  nextGoal: {
    title: string;
    description: string;
    progress?: number;
    target?: number;
    icon: React.ReactNode;
  } | null;
  onGoAchievements: () => void;
  onGoSeason: () => void;
};

export default function HubHomeTab({
  athleteName,
  fitCoins,
  seasonPoints,
  totalSessions,
  currentStreak,
  weeksCompleted,
  mesocyclesCompleted,
  activeDays,
  thisWeekCount,
  lastSessionDate,
  motivationalMessage,
  currentWeekMessage,
  avatarBaseStage,
  avatarAppearance,
  onAvatarAppearanceChange,
  nextGoal,
  onGoAchievements,
  onGoSeason,
}: HubHomeTabProps) {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-lime-500/25 bg-gradient-to-br from-lime-500/15 via-zinc-900 to-zinc-950 p-5">
        <div className="pointer-events-none absolute -top-12 right-0 h-32 w-32 rounded-full bg-lime-400/10 blur-3xl" />

        <div className="flex items-start gap-4">
          <AvatarPreview
            appearance={avatarAppearance}
            completedSessions={totalSessions}
            baseStage={avatarBaseStage}
            size={120}
            showLabel
            className="shrink-0"
          />
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-lime-400/90 font-semibold">
              Bienvenido a tu arena
            </p>
            <h3 className="text-2xl font-bold text-white mt-2">{athleteName.split(' ')[0]}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Tu avatar evoluciona con cada sesión. Arrastra para rotarlo.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-center gap-1 pt-1">
            <FitCoin size={52} variant="hero" spin />
            <span className="text-[9px] uppercase tracking-wider text-lime-400/80 font-semibold">FitCoin</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-lime-500/20 bg-zinc-950/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <FitCoin size={18} />
              <span className="text-[10px] uppercase tracking-wider text-lime-400 font-semibold">FitCoins</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums mt-2">{formatFitCoins(fitCoins)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">Moneda para cosméticos</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Puntos temporada</p>
            <p className="text-3xl font-bold text-white tabular-nums mt-2">{formatFitCoins(seasonPoints)}</p>
            <button
              type="button"
              onClick={onGoSeason}
              className="text-[10px] text-lime-400/90 mt-1 hover:text-lime-300"
            >
              Ver temporada →
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-semibold">
          Personaliza tu avatar
        </p>
        <AvatarPreview
          appearance={avatarAppearance}
          completedSessions={totalSessions}
          baseStage={avatarBaseStage}
          size={88}
          showLabel={false}
          showCustomizer
          onAppearanceChange={onAvatarAppearanceChange}
        />
        <p className="text-[10px] text-zinc-600 mt-3 text-center">
          Vista previa local · se guardará en tu perfil en una fase posterior
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 mb-3">Lifetime</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-5xl font-bold text-white tabular-nums leading-none">{totalSessions}</p>
            <p className="text-sm text-zinc-400 mt-2">sesiones completadas</p>
          </div>
          {lastSessionDate && (
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Última</p>
              <p className="text-sm text-zinc-300 mt-1 capitalize">
                {format(lastSessionDate, 'd MMM', { locale: es })}
              </p>
            </div>
          )}
        </div>
        {thisWeekCount > 0 && (
          <p className="text-xs text-lime-400/90 mt-4 pt-4 border-t border-zinc-800">
            {thisWeekCount} {thisWeekCount === 1 ? 'sesión' : 'sesiones'} esta semana
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Racha', value: `${currentStreak}d`, icon: Flame },
          { label: 'Semanas perfectas', value: weeksCompleted, icon: Calendar },
          { label: 'Mesociclos', value: mesocyclesCompleted, icon: Award },
          { label: 'Días activo', value: activeDays, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <Icon className="w-4 h-4 text-lime-500/70 mb-3" />
            <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {nextGoal && totalSessions > 0 && (
        <button
          type="button"
          onClick={onGoAchievements}
          className="w-full rounded-2xl border border-lime-500/20 bg-lime-500/5 px-4 py-4 text-left hover:bg-lime-500/10 transition-colors"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-500/80 mb-2">
            Próximo logro
          </p>
          <div className="flex items-start gap-3">
            <div className="text-lime-400 shrink-0">{nextGoal.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white">{nextGoal.title}</p>
              <p className="text-sm text-zinc-500 mt-1">{nextGoal.description}</p>
              {nextGoal.progress != null && nextGoal.target ? (
                <div className="mt-3">
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime-500"
                      style={{
                        width: `${Math.min(100, (nextGoal.progress / nextGoal.target) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2 tabular-nums">
                    {nextGoal.progress} / {nextGoal.target}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </button>
      )}

      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-4 py-4">
        <p className="text-sm text-zinc-300 leading-relaxed italic">{motivationalMessage}</p>
      </div>

      {currentWeekMessage && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">Esta semana</p>
          <p className="text-sm text-zinc-400">{currentWeekMessage}</p>
        </div>
      )}

      {totalSessions === 0 && (
        <div className="text-center py-8 rounded-2xl border border-dashed border-zinc-800">
          <Dumbbell className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Tu arena te espera</h3>
          <p className="text-sm text-zinc-500 px-6">
            Completa tu primera sesión para ganar FitCoins y desbloquear logros
          </p>
        </div>
      )}
    </div>
  );
}
