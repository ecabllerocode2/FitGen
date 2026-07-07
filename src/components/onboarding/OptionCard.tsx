import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

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
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${
        selected
          ? 'border-lime-500 bg-lime-500/10 shadow-[0_0_20px_rgba(132,204,22,0.15)]'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="shrink-0 mt-0.5 text-lime-400">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className={`font-bold ${selected ? 'text-white' : 'text-zinc-200'}`}>{title}</p>
          {description && <p className="text-sm text-zinc-500 mt-1">{description}</p>}
        </div>
        {selected && (
          <div className="shrink-0 w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center">
            <Check className="w-4 h-4 text-zinc-900" strokeWidth={3} />
          </div>
        )}
      </div>
    </button>
  );
}
