import { Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SessionShareCard from '../SessionShareCard';
import type { ShareCardData } from '../../utils/shareCard';

type HistoryItem = {
  id: string;
  sessionFocus: string;
  completedAt: string | null;
  shareData: ShareCardData;
  completedLabel: string | null;
};

type HubSessionsTabProps = {
  loading: boolean;
  items: HistoryItem[];
};

export default function HubSessionsTab({ loading, items }: HubSessionsTabProps) {
  if (loading) {
    return <p className="text-sm text-zinc-500 py-8 text-center">Cargando historial…</p>;
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-10 text-center">
        <Trophy className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">
          Aún no hay sesiones. Completa un entrenamiento y crea tu primera tarjeta compartible.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400 leading-relaxed">
        Tus sesiones recientes. Personaliza la tarjeta con foto, elige Feed o Story y comparte tu progreso.
      </p>
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden p-4 space-y-4"
        >
          <div>
            <p className="text-sm font-semibold text-white">{item.sessionFocus}</p>
            {item.completedLabel && (
              <p className="text-xs text-zinc-500 mt-0.5 capitalize">{item.completedLabel}</p>
            )}
          </div>
          <SessionShareCard data={item.shareData} showPhotoOptions showAspectToggle compact />
        </article>
      ))}
    </div>
  );
}

export function buildSessionHistoryItem(
  item: {
    id: string;
    sessionFocus: string;
    completedAt: string | null;
  },
  shareData: ShareCardData,
  completed: Date | null,
): HistoryItem {
  return {
    id: item.id,
    sessionFocus: item.sessionFocus ?? 'Entrenamiento',
    completedAt: item.completedAt,
    shareData,
    completedLabel: completed
      ? format(completed, 'EEEE d MMM · HH:mm', { locale: es })
      : null,
  };
}
