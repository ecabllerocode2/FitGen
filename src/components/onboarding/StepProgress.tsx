interface StepProgressProps {
  current: number;
  total: number;
}

export default function StepProgress({ current, total }: StepProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i < current ? 'bg-lime-500' : i === current ? 'bg-lime-500/60' : 'bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );
}
