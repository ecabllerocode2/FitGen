import { useMemo } from 'react';
import { Calendar, Flame, TrendingUp, Award, Dumbbell, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AvatarAppearance, AvatarGender, AvatarStartingBuild } from '@fitgen/visual';
import {
  AvatarPreview,
  FitCoin,
  AVATAR_STAGE_LABELS,
  AVATAR_STAGE_THRESHOLDS,
  computeAvatarProgressStage,
  nextAvatarStageThreshold,
  sessionsUntilNextAvatarStage,
} from '@fitgen/visual';
import { formatFitCoins } from '../../utils/gamificationDisplay';
import AvatarStartingBuildPicker, { AvatarEvolutionPreview } from '../avatar/AvatarStartingBuildPicker';

type HubHomeTabProps = {
  athleteName: string;
  fitCoins: number;
  seasonPoints: number;
  totalSessions: number;
  currentStreak: number;
  weeksCompleted: number;
  mesocyclesCompleted: number;
  activeDays: number;
  lastSessionDate: Date | null;
  motivationalMessage: string;
  currentWeekMessage: string;
  previousWeekMessage: string;
  mesocycleWeekDone: number;
  mesocycleWeekPlanned: number;
  avatarBaseStage: number;
  avatarAppearance: AvatarAppearance;
  avatarGender: AvatarGender;
  avatarStartingBuild: AvatarStartingBuild | null;
  onSaveAvatarStartingBuild: (build: AvatarStartingBuild) => void | Promise<void>;
  savingAvatar?: boolean;
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
  lastSessionDate,
  motivationalMessage,
  currentWeekMessage,
  previousWeekMessage,
  mesocycleWeekDone,
  mesocycleWeekPlanned,
  avatarBaseStage,
  avatarAppearance,
  avatarGender,
  avatarStartingBuild,
  onSaveAvatarStartingBuild,
  savingAvatar = false,
  nextGoal,
  onGoAchievements,
  onGoSeason,
}: HubHomeTabProps) {
  const progressStage = useMemo(
    () => computeAvatarProgressStage(totalSessions),
    [totalSessions],
  );
  const sessionsToNext = sessionsUntilNextAvatarStage(totalSessions);
  const nextThreshold = nextAvatarStageThreshold(totalSessions);
  const needsAvatarPick = !avatarStartingBuild;

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-lime-500/25 bg-gradient-to-br from-lime-500/15 via-zinc-900 to-zinc-950 p-5">
        <div className="pointer-events-none absolute -top-12 right-0 h-32 w-32 rounded-full bg-lime-400/10 blur-3xl" />

        <div className="flex items-start gap-4">
          <AvatarPreview
            appearance={avatarAppearance}
            completedSessions={totalSessions}
            baseStage={avatarBaseStage}
            size={100}
            showLabel
            showProgressHint
            className="shrink-0"
          />
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-lime-400/90 font-semibold">
              Bienvenido a tu GYM
            </p>
            <h3 className="text-2xl font-bold text-white mt-2">{athleteName.split(' ')[0]}</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Tu avatar evoluciona con cada sesión completada.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-lime-500/20 bg-zinc-950/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <FitCoin size={16} variant="ui" />
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

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1 font-semibold">
              Evolución del avatar
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Etapa {progressStage + 1} de 5 · {AVATAR_STAGE_LABELS[progressStage]}
            </p>
            {progressStage < 4 && nextThreshold != null && sessionsToNext != null && (
              <p className="text-xs text-lime-400/80 mt-2">
                {sessionsToNext === 0
                  ? '¡Estás a punto de ver un nuevo cambio!'
                  : `Faltan ${sessionsToNext} sesión${sessionsToNext === 1 ? '' : 'es'} para la siguiente etapa (${nextThreshold} total)`}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-1">
          {AVATAR_STAGE_THRESHOLDS.map((threshold, index) => {
            const reached = totalSessions >= threshold;
            const isCurrent = index === progressStage;
            return (
              <div key={threshold} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    reached ? 'bg-lime-500' : 'bg-zinc-800'
                  } ${isCurrent ? 'ring-1 ring-lime-400/50' : ''}`}
                />
                <p className="text-[8px] text-zinc-600 text-center mt-1 tabular-nums">{threshold}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1 font-semibold">
            {needsAvatarPick ? 'Elige tu cuerpo actual' : 'Tu punto de partida'}
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {needsAvatarPick
              ? 'Selecciona cómo te ves hoy. Tu avatar mejorará gradualmente con cada sesión.'
              : 'Puedes cambiar tu punto de partida si aún no has avanzado mucho.'}
          </p>
        </div>

        <AvatarStartingBuildPicker
          gender={avatarGender}
          value={avatarStartingBuild}
          onChange={onSaveAvatarStartingBuild}
          disabled={savingAvatar}
          compact={!needsAvatarPick}
        />

        {avatarStartingBuild && (
          <AvatarEvolutionPreview gender={avatarGender} startingBuild={avatarStartingBuild} />
        )}
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
        {mesocycleWeekPlanned > 0 && (
          <p className="text-xs text-lime-400/90 mt-4 pt-4 border-t border-zinc-800">
            Semana del mesociclo: {mesocycleWeekDone} de {mesocycleWeekPlanned}{' '}
            {mesocycleWeekPlanned === 1 ? 'sesión' : 'sesiones'}
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
            Semana del mesociclo
          </p>
          <p className="text-sm text-zinc-400">{currentWeekMessage}</p>
        </div>
      )}

      {previousWeekMessage && (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/40 px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-2">
            Semana anterior
          </p>
          <p className="text-sm text-zinc-500">{previousWeekMessage}</p>
        </div>
      )}

      {totalSessions === 0 && (
        <div className="text-center py-8 rounded-2xl border border-dashed border-zinc-800">
          <Dumbbell className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Tu GYM te espera</h3>
          <p className="text-sm text-zinc-500 px-6">
            Completa tu primera sesión para ganar FitCoins y ver tu avatar evolucionar
          </p>
        </div>
      )}
    </div>
  );
}
