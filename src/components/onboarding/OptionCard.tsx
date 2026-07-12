import type { ReactNode } from 'react';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
}

export default function OptionCard({ selected, onClick, title, description, icon }: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all duration-200 active:scale-[0.98] px-4 py-4 ${
        selected
          ? 'border-lime-500/50 bg-lime-500/10 text-white'
          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {icon ? <div className="shrink-0 mt-0.5 text-lime-400/90">{icon}</div> : null}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-[15px] ${selected ? 'text-white' : 'text-zinc-200'}`}>{title}</p>
          {description ? <p className="text-sm text-zinc-500 mt-1 leading-snug">{description}</p> : null}
        </div>
        {selected ? <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-lime-500 mt-2" /> : null}
      </div>
    </button>
  );
}
