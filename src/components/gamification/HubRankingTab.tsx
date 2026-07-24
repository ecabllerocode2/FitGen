import { useEffect, useState } from 'react';
import { Crown, Lock, Users } from 'lucide-react';
import { fetchLeaderboard, optInLeaderboard } from '../../api/gamification';
import type { LeaderboardResponse } from '../../types/gamification';
import { formatFitCoins, formatSeasonLabel } from '../../utils/gamificationDisplay';

type HubRankingTabProps = {
  authToken: string;
  seasonPoints: number;
  seasonId: string;
};

export default function HubRankingTab({ authToken, seasonPoints, seasonId }: HubRankingTabProps) {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [optedIn, setOptedIn] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchLeaderboard(authToken).then((data) => {
      if (cancelled || !data) {
        setLoading(false);
        return;
      }
      setBoard(data);
      setOptedIn(data.showInLeaderboard);
      setDisplayName(data.publicDisplayName ?? '');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authToken, seasonId, seasonPoints]);

  const handleOptIn = async (next: boolean) => {
    setSaving(true);
    const ok = await optInLeaderboard(authToken, {
      showInLeaderboard: next,
      publicDisplayName: displayName.trim() || undefined,
    });
    if (ok) {
      setOptedIn(next);
      const refreshed = await fetchLeaderboard(authToken);
      if (refreshed) setBoard(refreshed);
    }
    setSaving(false);
  };

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
            Compite cada mes con puntos de esfuerzo — no importa si eres principiante o avanzado.
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
            <p className="text-xs text-zinc-300 mt-1 capitalize">{formatSeasonLabel(seasonId)}</p>
          </div>
        </div>
        {board?.myRank ? (
          <p className="text-sm text-amber-300 mt-4">Tu posición actual: #{board.myRank}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-zinc-900 p-2 text-zinc-500">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Aparecer en el ranking</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Por privacidad estás oculto hasta que actives tu perfil público.
            </p>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nombre público"
              className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleOptIn(!optedIn)}
              className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-200"
            >
              {optedIn ? 'Ocultarme del ranking' : 'Unirme al ranking'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 text-center py-6">Cargando ranking…</p>
      ) : board?.entries?.length ? (
        <div className="rounded-2xl border border-zinc-800 overflow-hidden">
          {board.entries.slice(0, 20).map((entry) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80 last:border-b-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-amber-300 tabular-nums w-6">#{entry.rank}</span>
                <span className="text-sm text-white truncate">{entry.displayName}</span>
              </div>
              <span className="text-sm font-semibold text-violet-300 tabular-nums">
                {formatFitCoins(entry.seasonPoints)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-zinc-900 p-2 text-zinc-500">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Aún no hay participantes visibles</p>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Sé de los primeros en activar tu perfil público y sumar puntos esta temporada.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
