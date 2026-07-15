import { Crown, Lock, Users } from 'lucide-react';
import { formatFitCoins } from '../../utils/gamificationDisplay';

type HubRankingTabProps = {
  seasonPoints: number;
  seasonId: string;
};

export default function HubRankingTab({ seasonPoints, seasonId }: HubRankingTabProps) {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 p-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_55%)]" />
        <div className="relative">
          <div className="mx-auto w-14 h-14 rounded-2xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center text-amber-300 mb-4">
            <Crown className="w-7 h-7" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-amber-400/90 font-semibold">
            Ranking global
          </p>
          <h3 className="text-2xl font-bold text-white mt-2">Liga FitGen</h3>
          <p className="text-sm text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Compite cada mes con puntos de esfuerzo — no importa si eres principiante o avanzado. Misma regla para todos.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">Tus puntos ahora</p>
            <p className="text-3xl font-bold text-white tabular-nums mt-1">{formatFitCoins(seasonPoints)}</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-right">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Temporada</p>
            <p className="text-xs text-zinc-300 mt-1 capitalize">{seasonId.replace('-', ' · ')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-zinc-900 p-2 text-zinc-500">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Ranking en camino</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              La Fase 3 activará el top 50 mensual, ligas Bronze/Silver/Gold y tu posición en tiempo real. Sigue sumando puntos — se guardan en tu temporada actual.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-zinc-900 p-2 text-zinc-500">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Opt-in de privacidad</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Podrás elegir si apareces con tu nombre público. Por defecto estarás oculto hasta que lo actives.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-lime-500/15 bg-lime-500/5 px-4 py-3">
        <p className="text-sm text-lime-300/90 leading-relaxed">
          Tip: completa sesiones con feedback y cierra semanas perfectas para maximizar puntos antes de fin de mes.
        </p>
      </div>
    </div>
  );
}
