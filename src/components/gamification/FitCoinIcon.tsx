import { FitCoin as VisualFitCoin } from '@fitgen/visual';

type FitCoinIconProps = {
  className?: string;
  size?: number;
  variant?: 'ui' | 'hero';
  spin?: boolean;
};

/** Back-compat wrapper — delegates to @fitgen/visual FitCoin (dumbbell emblem). */
export default function FitCoinIcon({
  className = '',
  size = 20,
  variant = 'ui',
  spin = true,
}: FitCoinIconProps) {
  return <VisualFitCoin size={size} variant={variant} className={className} spin={spin} />;
}
