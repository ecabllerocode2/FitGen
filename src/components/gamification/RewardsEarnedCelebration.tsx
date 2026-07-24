import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import { FitCoin } from '@fitgen/visual';
import type { GamificationDelta } from '../../types/gamification';
import { formatFitCoins } from '../../utils/gamificationDisplay';
import { AppPrimaryButton } from '../ui/AppPrimitives';

const CONFETTI_COLORS = ['#84cc16', '#a3e635', '#fbbf24', '#c084fc', '#38bdf8'];

function generateConfetti(count = 28) {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 1.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 4 + Math.random() * 4,
  }));
}

function useAnimatedNumber(target: number, durationMs = 1200, active = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = Math.max(0, target - Math.max(target * 0.35, 8));
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, active]);

  return value;
}

type RewardsEarnedCelebrationProps = {
  open: boolean;
  delta: GamificationDelta | null;
  previousSeasonPoints?: number;
  previousFitCoins?: number;
  onContinue: () => void;
};

export default function RewardsEarnedCelebration({
  open,
  delta,
  previousSeasonPoints = 0,
  previousFitCoins = 0,
  onContinue,
}: RewardsEarnedCelebrationProps) {
  const confetti = useMemo(() => generateConfetti(), [open, delta?.seasonPointsEarned]);

  const targetSeasonPoints = delta?.newSeasonPointsTotal ?? previousSeasonPoints + (delta?.seasonPointsEarned ?? 0);
  const targetFitCoins = delta?.newFitCoinsTotal ?? previousFitCoins + (delta?.fitCoinsEarned ?? 0);
  const animatedSeasonPoints = useAnimatedNumber(targetSeasonPoints, 1300, open);
  const animatedFitCoins = useAnimatedNumber(targetFitCoins, 1300, open);

  if (!open || !delta) return null;

  const earnedPoints = delta.seasonPointsEarned ?? 0;
  const earnedCoins = delta.fitCoinsEarned ?? 0;
  const hasRewards = earnedPoints > 0 || earnedCoins > 0;

  return (
    <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center bg-zinc-950/92 p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-lime-500/25 bg-gradient-to-b from-lime-500/10 via-zinc-950 to-zinc-950 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="absolute rounded-full animate-confetti"
              style={{
                left: `${piece.left}%`,
                top: '-10px',
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
              }}
            />
          ))}
        </div>

        <div className="relative px-6 pt-8 pb-6">
          <div className="flex items-center justify-center gap-2 text-lime-300 mb-3">
            <Sparkles className="w-4 h-4" />
            <p className="text-[10px] uppercase tracking-[0.24em] font-semibold">Recompensas ganadas</p>
            <Sparkles className="w-4 h-4" />
          </div>

          <h2 className="text-2xl font-bold text-white text-center">
            {hasRewards ? '¡Sigue sumando!' : 'Sesión registrada'}
          </h2>
          <p className="text-sm text-zinc-400 text-center mt-2 leading-relaxed">
            Tu esfuerzo cuenta para el ranking y tu economía de FitCoins.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-violet-300">
                <Trophy className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Puntos</span>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums mt-2">{formatFitCoins(animatedSeasonPoints)}</p>
              {earnedPoints > 0 && (
                <p className="text-xs text-violet-300 font-semibold mt-1 tabular-nums">+{formatFitCoins(earnedPoints)}</p>
              )}
            </div>

            <div className="rounded-2xl border border-lime-500/20 bg-lime-500/10 px-4 py-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-lime-300">
                <FitCoin size={16} variant="ui" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">FitCoins</span>
              </div>
              <p className="text-3xl font-bold text-white tabular-nums mt-2">{formatFitCoins(animatedFitCoins)}</p>
              {earnedCoins > 0 && (
                <p className="text-xs text-lime-300 font-semibold mt-1 tabular-nums">+{formatFitCoins(earnedCoins)}</p>
              )}
            </div>
          </div>

          {delta.breakdown?.length ? (
            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 space-y-2">
              {delta.breakdown.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-zinc-300">{row.label}</span>
                  <div className="flex items-center gap-2 tabular-nums text-xs font-semibold">
                    {row.fitCoins > 0 && <span className="text-lime-400">+{row.fitCoins} FC</span>}
                    {row.points > 0 && <span className="text-violet-300">+{row.points} pts</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {delta.weeklyCapHit ? (
            <p className="text-[11px] text-amber-300/90 mt-4 text-center">
              Alcanzaste el tope semanal de puntos. Sigue entrenando para FitCoins y logros.
            </p>
          ) : null}

          <div className="mt-6">
            <AppPrimaryButton onClick={onContinue}>Continuar</AppPrimaryButton>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(0, 110vh, 0) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  );
}

export const REWARDS_DELTA_STORAGE_KEY = 'fitgen.pendingRewardsDelta';

export function storePendingRewardsDelta(delta: GamificationDelta) {
  sessionStorage.setItem(REWARDS_DELTA_STORAGE_KEY, JSON.stringify(delta));
}

export function consumePendingRewardsDelta(): GamificationDelta | null {
  try {
    const raw = sessionStorage.getItem(REWARDS_DELTA_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(REWARDS_DELTA_STORAGE_KEY);
    return JSON.parse(raw) as GamificationDelta;
  } catch {
    return null;
  }
}
