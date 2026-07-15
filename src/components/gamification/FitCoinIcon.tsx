type FitCoinIconProps = {
  className?: string;
  size?: number;
};

export default function FitCoinIcon({ className = '', size = 20 }: FitCoinIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" fill="url(#fitcoin-gradient)" />
      <circle cx="12" cy="12" r="8.5" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
      <path
        d="M8.5 12.2c0-2.1 1.6-3.4 3.5-3.4 1.6 0 2.7.9 2.7 2.2 0 1.3-1 2-2.6 2.4-1.5.4-2.1.8-2.1 1.7 0 .8.7 1.3 1.8 1.3 1.1 0 2-.5 2.6-1.2"
        stroke="#1a2e05"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M12 8.2V7M12 17v-1.2" stroke="#1a2e05" strokeWidth="1.6" strokeLinecap="round" />
      <defs>
        <linearGradient id="fitcoin-gradient" x1="4" y1="4" x2="20" y2="20">
          <stop stopColor="#d9f99d" />
          <stop offset="0.55" stopColor="#a3e635" />
          <stop offset="1" stopColor="#84cc16" />
        </linearGradient>
      </defs>
    </svg>
  );
}
