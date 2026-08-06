import { Flame, Target, Sparkles, Footprints, Leaf } from 'lucide-react';

export interface CoachingBriefItem {
  id: string;
  type: 'body_composition' | 'muscle_priority' | 'focus_area' | 'finisher' | 'strategy';
  title: string;
  message: string;
  muscle?: string;
}

export interface SessionCoachingBriefData {
  bodyCompositionGoal?: string;
  items: CoachingBriefItem[];
}

const ICONS = {
  body_composition: Flame,
  muscle_priority: Target,
  focus_area: Target,
  finisher: Footprints,
  strategy: Sparkles,
};

export default function SessionCoachingBrief({ brief }: { brief?: SessionCoachingBriefData | null }) {
  if (!brief?.items?.length) return null;

  return (
    <div className="mb-6 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-lime-400" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-400/90">
          Por qué esta sesión
        </p>
      </div>
      {brief.items.map((item) => {
        const Icon = item.id === 'deload_week' ? Leaf : ICONS[item.type] ?? Sparkles;
        const accent =
          item.id === 'deload_week'
            ? 'border-amber-500/30 bg-amber-500/10'
            : item.type === 'finisher'
              ? 'border-sky-500/25 bg-sky-500/10'
              : item.type === 'muscle_priority'
                ? 'border-lime-500/25 bg-lime-500/10'
                : 'border-zinc-800 bg-zinc-900/60';

        return (
          <div key={item.id} className={`rounded-xl border px-4 py-3 ${accent}`}>
            <div className="flex items-start gap-3">
              <Icon
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  item.id === 'deload_week' ? 'text-amber-300' : 'text-lime-400/90'
                }`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.message}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
