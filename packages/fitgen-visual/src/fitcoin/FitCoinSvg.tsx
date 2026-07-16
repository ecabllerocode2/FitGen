import type { SVGProps } from 'react';

type FitCoinSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

/** Flat SVG FitCoin — dumbbell emblem for UI (16–32px). */
export function FitCoinSvg({ size = 24, className, ...rest }: FitCoinSvgProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...rest}
    >
      <defs>
        <linearGradient id="fg-coin-rim" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D9F99D" />
          <stop offset="0.5" stopColor="#A3E635" />
          <stop offset="1" stopColor="#65A30D" />
        </linearGradient>
        <linearGradient id="fg-coin-face" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ECFCCB" />
          <stop offset="1" stopColor="#BEF264" />
        </linearGradient>
        <linearGradient id="fg-dumbbell" x1="10" y1="16" x2="22" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3F6212" />
          <stop offset="1" stopColor="#1A2E05" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#fg-coin-face)" stroke="url(#fg-coin-rim)" strokeWidth="2.5" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="#84CC16" strokeWidth="0.75" opacity="0.5" />
      {/* Dumbbell */}
      <rect x="9" y="14.5" width="14" height="3" rx="1.5" fill="url(#fg-dumbbell)" />
      <rect x="7" y="12" width="3.5" height="8" rx="1" fill="url(#fg-dumbbell)" />
      <rect x="21.5" y="12" width="3.5" height="8" rx="1" fill="url(#fg-dumbbell)" />
      <rect x="5.5" y="13" width="2" height="6" rx="0.75" fill="#365314" />
      <rect x="24.5" y="13" width="2" height="6" rx="0.75" fill="#365314" />
    </svg>
  );
}
