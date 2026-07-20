import { Calendar, Trophy, Sparkles } from 'lucide-react';
import FitCoinIcon from './FitCoinIcon';
import {
  FITCOIN_EARN_HINTS,
  formatFitCoins,
  formatSeasonLabel,
  seasonDaysRemaining,
} from '../../utils/gamificationDisplay';

type HubSeasonTabProps = {
  seasonId: string;
  seasonPoints: number;
  seasonSessions: number;
  seasonWeeksPerfect: number;
  fitCoins: number;
};

export default function HubSeasonTab({
  seasonId,
  seasonPoints,
  seasonSessions,
  seasonWeeksPerfect,
  fitCoins,
}: HubSeasonTabProps) {
  const daysLeft = seasonDaysRemaining(seasonId);
  const seasonLabel = formatSeasonLabel(seasonId);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-zinc-900 to-zinc-950 p-5">
        <div className="pointer-events-none absolute -top-8 -right-6 h-28 w-28 rounded-full bg-violet-400/10 blur-2xl" />
        <div className="flex items-center gap-2 text-violet-300">
          <Calendar className="w-4 h-4" />
          <p className="text-[10px] uppercase tracking-[0.22em] font-semibold">Temporada activa</p>
        </div>
        <h3 className="text-2xl font-bold text-white mt-2 capitalize">{seasonLabel}</h3>
        {daysLeft != null && (
          <p className="text-sm text-zinc-400 mt-1">
            {daysLeft === 0 ? 'Cierra hoy' : `${daysLeft} días restantes`} para sumar puntos
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-violet-500/15 bg-zinc-950/50 px-4 py-3">
            <div className="flex items-center gap-2 text-violet-300">
              <Trophy className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-wider font-semibold">Puntos</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums mt-2">{formatFitCoins(seasonPoints)}</p>
          </div>
          <div className="rounded-xl border border-lime-500/15 bg-zinc-950/50 px-4 py-3">
            <div className="flex items-center gap-2 text-lime-400">
              <FitCoinIcon size={16} />
              <span className="text-[10px] uppercase tracking-wider font-semibold">FitCoins</span>
            </div>
            <p className="text-3xl font-bold text-white tabular-nums mt-2">{formatFitCoins(fitCoins)}</p>
            <p className="text-[10px] text-zinc-500 mt-1">No expiran entre temporadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-2xl font-bold text-white tabular-nums">{seasonSessions}</p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">Sesiones en temporada</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <p className="text-2xl font-bold text-white tabular-nums">{seasonWeeksPerfect}</p>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">Semanas perfectas</p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-lime-400" />
          <h4 className="text-sm font-semibold text-white">Cómo ganar recompensas</h4>
        </div>
        <div className="space-y-2">
          {FITCOIN_EARN_HINTS.map((row) => (
            <div
              key={row.action}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2.5"
            >
              <span className="text-sm text-zinc-300">{row.action}</span>
              <div className="flex items-center gap-3 shrink-0 text-xs tabular-nums">
                {row.fitCoins !== '—' && (
                  <span className="text-lime-400 font-semibold">{row.fitCoins} FC</span>
                )}
                <span className="text-violet-300 font-semibold">{row.points} pts</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-zinc-500 mt-3 leading-relaxed">
          FitCoins (FC) son tu moneda para marcos y plantillas. Los puntos de temporada definen tu posición en el ranking.
        </p>
      </div>
    </div>
  );
}
