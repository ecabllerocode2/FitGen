type Point = { value: number | null; label?: string };

function finiteValues(points: Point[]): number[] {
  return points.map((p) => p.value).filter((v): v is number => v != null && Number.isFinite(v));
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value * 10) / 10);
}

/** Simple bar chart for session volume (or any series). */
export function AdminBarChart({
  points,
  color = '#a3e635',
  height = 120,
  emptyLabel = 'Sin datos',
}: {
  points: Point[];
  color?: string;
  height?: number;
  emptyLabel?: string;
}) {
  const values = finiteValues(points);
  if (values.length === 0) {
    return <p className="text-xs text-zinc-600 py-8 text-center">{emptyLabel}</p>;
  }

  const max = Math.max(...values, 1);
  const barWidth = Math.max(8, Math.min(28, Math.floor(280 / points.length)));

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1.5 min-w-full" style={{ height }}>
        {points.map((p, i) => {
          const v = p.value;
          const h = v != null && max > 0 ? Math.max(4, (v / max) * (height - 16)) : 0;
          return (
            <div key={i} className="flex flex-col items-center justify-end gap-1 flex-1 min-w-[10px]">
              <span className="text-[9px] text-zinc-600 tabular-nums leading-none">
                {v != null ? formatTick(v) : '—'}
              </span>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: h,
                  maxWidth: barWidth,
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

/** Dual-line chart: prescribed vs actual average loads per session. */
export function AdminDualLineChart({
  prescribed,
  actual,
  height = 140,
  emptyLabel = 'Sin datos de carga',
}: {
  prescribed: Point[];
  actual: Point[];
  height?: number;
  emptyLabel?: string;
}) {
  const n = Math.max(prescribed.length, actual.length);
  if (n < 2) {
    return <p className="text-xs text-zinc-600 py-8 text-center">{emptyLabel}</p>;
  }

  const all = [...finiteValues(prescribed), ...finiteValues(actual)];
  if (all.length < 2) {
    return <p className="text-xs text-zinc-600 py-8 text-center">{emptyLabel}</p>;
  }

  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const pad = range * 0.08;
  const yMin = min - pad;
  const yMax = max + pad;
  const yRange = yMax - yMin;

  const width = 320;
  const chartH = height - 8;
  const step = n > 1 ? width / (n - 1) : width;

  const toPoints = (series: Point[]) =>
    series
      .map((p, i) => {
        if (p.value == null) return null;
        const x = i * step;
        const y = chartH - ((p.value - yMin) / yRange) * chartH;
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(' ');

  const prescribedPts = toPoints(prescribed);
  const actualPts = toPoints(actual);

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <line x1="0" y1={chartH} x2={width} y2={chartH} stroke="#27272a" strokeWidth="1" />
        {prescribedPts && (
          <polyline fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinejoin="round" points={prescribedPts} />
        )}
        {actualPts && (
          <polyline fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinejoin="round" points={actualPts} />
        )}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-1">
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="h-1.5 w-3 rounded-full bg-sky-400" /> Prescrito
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
          <span className="h-1.5 w-3 rounded-full bg-lime-400" /> Usado
        </span>
      </div>
      <div className="flex justify-between text-[9px] text-zinc-600 tabular-nums mt-1">
        <span>{formatTick(yMin)}</span>
        <span>{formatTick(yMax)} kg</span>
      </div>
    </div>
  );
}
