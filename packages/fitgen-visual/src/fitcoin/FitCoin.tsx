import type { FitCoinVariant } from '../types';
import { FitCoinSvg } from './FitCoinSvg';

type FitCoinProps = {
  size?: number;
  variant?: FitCoinVariant;
  className?: string;
};

/** Flat SVG FitCoin for all UI sizes. */
export default function FitCoin({ size = 20, variant = 'ui', className }: FitCoinProps) {
  const resolvedSize = variant === 'hero' ? Math.max(size, 48) : size;
  return <FitCoinSvg size={resolvedSize} className={className} />;
}

export { FitCoinSvg };
