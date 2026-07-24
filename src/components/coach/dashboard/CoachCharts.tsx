type ChartPoint = { value: number | null; label?: string };

function finiteValues(points: ChartPoint[]): number[] {
  return points.map((p) => p.value).filter((v): v is number => v != null && Number.isFinite(v));
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value * 10) / 10);
}

export function CoachBarChart({
  points,
  color = '#a3e635',
  height = 120,
  emptyLabel = 'Sin datos aún',
}: {
  points: ChartPoint[];
  color?: string;
  height?: number;
  emptyLabel?: string;
}) {
  const values = finiteValues(points);
  if (values.length === 0) {
    return <p className="text-xs text-zinc-600 py-10 text-center">{emptyLabel}</p>;
  }

  const max = Math.max(...values, 1);

  return (
    <div className="w-full">
      <div className="flex items-end gap-1.5 w-full" style={{ height }}>
        {points.map((p, i) => {
          const v = p.value;
          const h = v != null && max > 0 ? Math.max(4, (v / max) * (height - 18)) : 0;
          return (
            <div key={i} className="flex flex-col items-center justify-end gap-1 flex-1 min-w-0">
              <span className="text-[9px] text-zinc-600 tabular-nums leading-none">
                {v != null ? formatTick(v) : '—'}
              </span>
              <div
                className="w-full max-w-[28px] rounded-t-md"
                style={{
                  height: h,
                  backgroundColor: v != null ? color : '#3f3f46',
                  opacity: v != null ? 0.9 : 0.3,
                }}
                title={p.label ? `${p.label}: ${v ?? '—'}` : String(v ?? '—')}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CoachSparkline({
  points,
  color = '#a3e635',
  height = 64,
  emptyLabel = 'Sin check-ins',
}: {
  points: ChartPoint[];
  color?: string;
  height?: number;
  emptyLabel?: string;
}) {
  const values = finiteValues(points);
  if (values.length < 2) {
    return <p className="text-xs text-zinc-600 py-8 text-center">{emptyLabel}</p>;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 0.1);
  const w = 280;
  const pad = 4;
  const coords = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(' ')}
      />
    </svg>
  );
}
