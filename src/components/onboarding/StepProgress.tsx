interface StepProgressProps {
  current: number;
  total: number;
}

export default function StepProgress({ current, total }: StepProgressProps) {
  const value = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div>
      <div className="h-px bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-lime-500 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600 mt-2.5 tabular-nums">
        Paso {current + 1} de {total}
      </p>
    </div>
  );
}
