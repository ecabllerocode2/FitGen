import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Trophy, X } from 'lucide-react';
import type { GamificationAchievementUnlock } from '../../types/gamification';
import { isMilestoneAchievement } from '../../types/gamification';
import { achievementIcon } from '../../utils/achievementIcons';
import { AppPrimaryButton } from '../ui/AppPrimitives';

interface AchievementUnlockModalProps {
  achievements: GamificationAchievementUnlock[];
  open: boolean;
  onClose: () => void;
}

export default function AchievementUnlockModal({
  achievements,
  open,
  onClose,
}: AchievementUnlockModalProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, achievements]);

  const current = achievements[index] ?? null;
  const isMilestone = current ? isMilestoneAchievement(current.id) || current.milestone : false;

  const title = useMemo(() => {
    if (!current) return '';
    return isMilestone ? '¡Hito desbloqueado!' : '¡Logro desbloqueado!';
  }, [current, isMilestone]);

  if (!open || !current) return null;

  const hasNext = index < achievements.length - 1;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-zinc-950/90">
      <div
        className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${
          isMilestone
            ? 'border-lime-400/40 bg-gradient-to-b from-lime-500/10 to-zinc-950'
            : 'border-zinc-800 bg-zinc-950'
        }`}
      >
        <div className="px-6 pt-6 pb-4 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-200"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-lime-400 mb-4">
            {isMilestone ? <Sparkles className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold">{title}</p>
          </div>

          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 rounded-2xl p-3 ${
                isMilestone ? 'bg-lime-500/15 text-lime-300' : 'bg-zinc-900 text-lime-400'
              }`}
            >
              {achievementIcon(current.id)}
            </div>
            <div className="min-w-0 pt-1">
              <h3 className="text-xl font-bold text-white leading-snug">{current.title}</h3>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{current.description}</p>
            </div>
          </div>

          {achievements.length > 1 && (
            <p className="text-[10px] text-zinc-600 mt-4 tabular-nums">
              {index + 1} / {achievements.length}
            </p>
          )}
        </div>

        <div className="px-6 pb-6">
          <AppPrimaryButton
            onClick={() => {
              if (hasNext) setIndex((i) => i + 1);
              else onClose();
            }}
          >
            {hasNext ? 'Siguiente logro' : 'Continuar'}
          </AppPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function storePendingAchievementUnlocks(
  achievements: GamificationAchievementUnlock[],
) {
  if (!achievements.length) return;
  sessionStorage.setItem(
    'fitgen.pendingAchievementUnlocks',
    JSON.stringify(achievements),
  );
}

export function consumePendingAchievementUnlocks(): GamificationAchievementUnlock[] {
  const raw = sessionStorage.getItem('fitgen.pendingAchievementUnlocks');
  if (!raw) return [];
  sessionStorage.removeItem('fitgen.pendingAchievementUnlocks');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
