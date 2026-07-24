import { FitCoin as VisualFitCoin } from '@fitgen/visual';

type FitCoinIconProps = {
  className?: string;
  size?: number;
};

/** Flat SVG FitCoin for UI chips (never 3D canvas). */
export default function FitCoinIcon({ className = '', size = 20 }: FitCoinIconProps) {
  return <VisualFitCoin size={size} variant="ui" className={className} />;
}
