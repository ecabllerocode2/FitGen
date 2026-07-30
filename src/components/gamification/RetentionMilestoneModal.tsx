import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, X } from 'lucide-react';
import type { RetentionMilestone } from '../../types/gamification';
import { AppPrimaryButton } from '../ui/AppPrimitives';

interface RetentionMilestoneModalProps {
  milestones: RetentionMilestone[];
  open: boolean;
  onClose: () => void;
}

export default function RetentionMilestoneModal({
  milestones,
  open,
  onClose,
}: RetentionMilestoneModalProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, milestones]);

  const current = milestones[index] ?? null;
  if (!open || !current) return null;

  const hasNext = index < milestones.length - 1;
  const Icon = current.type === 'e1rm_gain' ? TrendingUp : Sparkles;

  return (
    <div className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-4 bg-zinc-950/90">
      <div className="w-full max-w-sm rounded-2xl border border-lime-400/30 bg-gradient-to-b from-lime-500/10 to-zinc-950 shadow-2xl overflow-hidden">
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
            <Icon className="w-4 h-4" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold">Tu progreso</p>
          </div>

          <h3 className="text-xl font-bold text-white leading-snug">{current.title}</h3>
          <p className="text-sm text-zinc-300 mt-3 leading-relaxed">{current.body}</p>

          {milestones.length > 1 && (
            <p className="text-[10px] text-zinc-600 mt-4 tabular-nums">
              {index + 1} / {milestones.length}
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
            {hasNext ? 'Siguiente' : '¡Vamos!'}
          </AppPrimaryButton>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = 'fitgen.pendingRetentionMilestones';

export function storePendingRetentionMilestones(milestones: RetentionMilestone[]) {
  if (!milestones.length) return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
}

export function consumePendingRetentionMilestones(): RetentionMilestone[] {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
