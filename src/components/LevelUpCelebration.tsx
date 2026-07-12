import { useEffect, useState, useMemo } from 'react';
import { Trophy, TrendingUp, Target, X, Zap } from 'lucide-react';
import { AppEyebrow, AppPrimaryButton } from './ui/AppPrimitives';

const generateConfettiParticles = () => {
  const colors = ['#84cc16', '#a3e635', '#fbbf24', '#71717a'];
  return Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));
};

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    celebrationTitle: string;
    celebrationMessage: string;
    newLevel: string;
    previousLevel: string;
    nextGoal?: string;
    metrics?: {
      completedSessions?: number;
      weeksTraining?: number;
      completionRate?: string;
      progressionRate?: string;
    };
  };
}

export default function LevelUpCelebration({ isOpen, onClose, data }: LevelUpCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiParticles = useMemo(() => generateConfettiParticles(), []);

  useEffect(() => {
    if (!isOpen) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-zinc-950/95 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative bg-zinc-950 border-t sm:border border-zinc-800 w-full max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 z-10"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiParticles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 animate-confetti rounded-full"
                style={{
                  left: `${particle.left}%`,
                  top: '-8px',
                  backgroundColor: particle.color,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: `${particle.duration}s`,
                }}
              />
            ))}
          </div>
        )}

        <div className="px-8 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
          <div className="w-14 h-14 rounded-full bg-lime-500/10 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-7 h-7 text-lime-500" />
          </div>

          <AppEyebrow>Subiste de nivel</AppEyebrow>
          <h2 className="text-2xl font-bold text-white mt-4 mb-3 leading-tight">{data.celebrationTitle}</h2>

          <div className="flex items-center justify-center gap-3 text-sm mb-5">
            <span className="text-zinc-600 line-through uppercase">{data.previousLevel}</span>
            <Zap className="w-4 h-4 text-lime-500" />
            <span className="text-lime-400 font-bold uppercase">{data.newLevel}</span>
          </div>

          <p className="text-[15px] text-zinc-400 leading-relaxed mb-8">{data.celebrationMessage}</p>

          {data.metrics && (
            <div className="grid grid-cols-2 gap-px bg-zinc-800 rounded-xl overflow-hidden mb-8">
              {data.metrics.completedSessions !== undefined && (
                <div className="bg-zinc-950 p-4">
                  <TrendingUp className="w-4 h-4 text-lime-500/70 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white tabular-nums">{data.metrics.completedSessions}</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">Sesiones</div>
                </div>
              )}
              {data.metrics.weeksTraining !== undefined && (
                <div className="bg-zinc-950 p-4">
                  <Trophy className="w-4 h-4 text-lime-500/70 mx-auto mb-2" />
                  <div className="text-xl font-bold text-white tabular-nums">{data.metrics.weeksTraining}</div>
                  <div className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1">Semanas</div>
                </div>
              )}
            </div>
          )}

          {data.nextGoal && (
            <div className="text-left border-t border-zinc-800 pt-6 mb-8">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-lime-500/70 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    Próximo objetivo
                  </p>
                  <p className="text-sm text-zinc-400">{data.nextGoal}</p>
                </div>
              </div>
            </div>
          )}

          <AppPrimaryButton onClick={onClose}>Continuar entrenando</AppPrimaryButton>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti linear forwards; }
      `}</style>
    </div>
  );
}
