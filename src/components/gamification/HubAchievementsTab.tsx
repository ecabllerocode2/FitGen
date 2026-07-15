import { CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  target?: number;
  milestone?: boolean;
};

type AchievementSection = {
  category: string;
  label: string;
  achievements: Achievement[];
  nextLocked: Achievement | null;
};

function AchievementProgressBar({
  progress,
  target,
  unlocked,
}: {
  progress?: number;
  target?: number;
  unlocked: boolean;
}) {
  if (!target || progress == null || unlocked) return null;
  return (
    <div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-lime-500 transition-all duration-500"
          style={{ width: `${Math.min(100, (progress / target) * 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-500 mt-2 tabular-nums">
        {progress} / {target}
      </p>
    </div>
  );
}

type HubAchievementsTabProps = {
  achievementSections: AchievementSection[];
  unlockedCount: number;
  totalCount: number;
};

export default function HubAchievementsTab({
  achievementSections,
  unlockedCount,
  totalCount,
}: HubAchievementsTabProps) {
  if (!achievementSections.length) {
    return (
      <p className="text-sm text-zinc-500 py-8 text-center">
        Conecta para cargar tus logros desde el servidor.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 flex items-center justify-between">
        <p className="text-sm text-zinc-400">Progreso total de logros</p>
        <p className="text-sm font-bold text-lime-400 tabular-nums">
          {unlockedCount}/{totalCount}
        </p>
      </div>

      {achievementSections.map((section) => {
        const unlockedInSection = section.achievements.filter((a) => a.unlocked);
        const lockedInSection = section.achievements.filter((a) => !a.unlocked);
        return (
          <section key={section.category} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-white">{section.label}</h3>
              <span className="text-[10px] text-zinc-600 tabular-nums">
                {unlockedInSection.length}/{section.achievements.length}
              </span>
            </div>

            {section.nextLocked && (
              <div className="rounded-xl border border-lime-500/15 bg-lime-500/5 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-lime-500/70 mb-2">
                  Siguiente en {section.label.toLowerCase()}
                </p>
                <div className="flex items-start gap-3">
                  <div className="text-lime-400 shrink-0">{section.nextLocked.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{section.nextLocked.title}</p>
                    <p className="text-xs text-zinc-500 mt-1 mb-3">{section.nextLocked.description}</p>
                    <AchievementProgressBar
                      progress={section.nextLocked.progress}
                      target={section.nextLocked.target}
                      unlocked={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {unlockedInSection.length > 0 && (
              <div className="space-y-2">
                {unlockedInSection.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                      achievement.milestone
                        ? 'border-lime-400/30 bg-lime-500/10'
                        : 'border-lime-500/25 bg-lime-500/5'
                    }`}
                  >
                    <div className="text-lime-400 shrink-0 mt-0.5">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white text-sm">{achievement.title}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{achievement.description}</p>
                      {achievement.unlockedDate && (
                        <p className="text-[10px] text-lime-500/70 mt-2">
                          {format(parseISO(achievement.unlockedDate), 'd MMM yyyy', { locale: es })}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-lime-500 shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            )}

            {lockedInSection.slice(0, section.nextLocked ? 2 : 4).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
              >
                <div className="text-zinc-600 shrink-0 mt-0.5">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-zinc-300 text-sm">{achievement.title}</h4>
                  <p className="text-xs text-zinc-600 mt-0.5 mb-2">{achievement.description}</p>
                  <AchievementProgressBar
                    progress={achievement.progress}
                    target={achievement.target}
                    unlocked={achievement.unlocked}
                  />
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
