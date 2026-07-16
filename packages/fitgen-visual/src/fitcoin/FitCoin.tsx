import type { FitCoinVariant } from '../types';
import { FitCoinSvg } from './FitCoinSvg';
import { FitCoinZdogCanvas } from './FitCoinZdog';

type FitCoinProps = {
  size?: number;
  variant?: FitCoinVariant;
  className?: string;
  spin?: boolean;
};

/** Unified FitCoin — SVG for UI chips, Zdog canvas for hero. */
export default function FitCoin({
  size = 20,
  variant = 'ui',
  className,
  spin = true,
}: FitCoinProps) {
  if (variant === 'hero') {
    return <FitCoinZdogCanvas size={size} spin={spin} className={className} />;
  }
  return <FitCoinSvg size={size} className={className} />;
}

export { FitCoinSvg, FitCoinZdogCanvas };
