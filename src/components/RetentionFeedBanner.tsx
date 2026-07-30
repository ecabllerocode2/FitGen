import { Sparkles } from 'lucide-react';
import type { RetentionMilestone } from '../types/gamification';

interface RetentionFeedBannerProps {
  items: RetentionMilestone[];
  onDismiss?: (id: string) => void;
}

export default function RetentionFeedBanner({ items, onDismiss }: RetentionFeedBannerProps) {
  const unread = items.filter((item) => !item.readAt);
  if (!unread.length) return null;

  const latest = unread[unread.length - 1];

  return (
    <div className="rounded-2xl border border-lime-500/25 bg-lime-500/5 p-4 mb-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-lime-500/15 p-2 text-lime-300">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-lime-200">{latest.title}</p>
          <p className="text-sm text-zinc-300 mt-1 leading-snug">{latest.body}</p>
          {unread.length > 1 && (
            <p className="text-[10px] text-zinc-500 mt-2">
              +{unread.length - 1} actualización{unread.length > 2 ? 'es' : ''} más
            </p>
          )}
        </div>
        {onDismiss && latest.id ? (
          <button
            type="button"
            onClick={() => onDismiss(latest.id)}
            className="text-[10px] uppercase tracking-wide text-zinc-500 hover:text-zinc-300 shrink-0"
          >
            OK
          </button>
        ) : null}
      </div>
    </div>
  );
}
