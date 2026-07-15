import type { ReactNode } from 'react';
import {
  Trophy,
  Calendar,
  Flame,
  Star,
  TrendingUp,
  Dumbbell,
  Crown,
  Medal,
  Target,
  Layers,
  Zap,
  Award,
  Sparkles,
} from 'lucide-react';

const ACHIEVEMENT_ICONS: Record<string, ReactNode> = {
  'first-session': <Dumbbell className="w-7 h-7" />,
  'first-week': <Calendar className="w-7 h-7" />,
  'first-month': <Trophy className="w-7 h-7" />,
  'streak-7': <Flame className="w-7 h-7" />,
  'streak-14': <Flame className="w-7 h-7" />,
  'streak-30': <Flame className="w-7 h-7" />,
  'streak-60': <Flame className="w-7 h-7" />,
  dedication: <Star className="w-7 h-7" />,
  warrior: <Medal className="w-7 h-7" />,
  legend: <Crown className="w-7 h-7" />,
  consistency: <TrendingUp className="w-7 h-7" />,
  'sessions-75': <Target className="w-7 h-7" />,
  'sessions-100': <Sparkles className="w-7 h-7" />,
  'sessions-150': <Medal className="w-7 h-7" />,
  'sessions-200': <Award className="w-7 h-7" />,
  'sessions-365': <Sparkles className="w-7 h-7" />,
  'sessions-500': <Sparkles className="w-7 h-7" />,
  'sessions-1000': <Crown className="w-7 h-7" />,
  'weeks-perfect-4': <Calendar className="w-7 h-7" />,
  'weeks-perfect-12': <Calendar className="w-7 h-7" />,
  'weeks-perfect-26': <Calendar className="w-7 h-7" />,
  'weeks-perfect-52': <Calendar className="w-7 h-7" />,
  'mesocycle-1': <Layers className="w-7 h-7" />,
  'mesocycle-3': <Layers className="w-7 h-7" />,
  'mesocycle-6': <Layers className="w-7 h-7" />,
  'mesocycle-12': <Layers className="w-7 h-7" />,
  'level-intermediate': <Zap className="w-7 h-7" />,
  'level-advanced': <Zap className="w-7 h-7" />,
};

export function achievementIcon(id: string): ReactNode {
  return ACHIEVEMENT_ICONS[id] ?? <Trophy className="w-7 h-7" />;
}
