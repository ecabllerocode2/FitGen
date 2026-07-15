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
} from 'lucide-react';

const ACHIEVEMENT_ICONS: Record<string, ReactNode> = {
  'first-session': <Dumbbell className="w-7 h-7" />,
  'first-week': <Calendar className="w-7 h-7" />,
  'first-month': <Trophy className="w-7 h-7" />,
  'streak-7': <Flame className="w-7 h-7" />,
  dedication: <Star className="w-7 h-7" />,
  warrior: <Medal className="w-7 h-7" />,
  legend: <Crown className="w-7 h-7" />,
  consistency: <TrendingUp className="w-7 h-7" />,
};

export function achievementIcon(id: string): ReactNode {
  return ACHIEVEMENT_ICONS[id] ?? <Trophy className="w-7 h-7" />;
}
