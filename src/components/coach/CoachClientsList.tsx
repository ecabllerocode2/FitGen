import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, ChevronRight } from 'lucide-react';
import { fetchCoachClients } from '../../api/coach';
import type { CoachClientSummary } from '../../types/coach';
import CoachShell from './CoachShell';

interface CoachClientsListProps {
  user: User;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  onboarding_client: 'Esperando coach',
  onboarding_coach: 'Configurar plan',
  invited: 'Invitado',
  released: 'Archivado',
};

export default function CoachClientsList({ user }: CoachClientsListProps) {
  const [clients, setClients] = useState<CoachClientSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = await user.getIdToken();
        setClients(await fetchCoachClients(token));
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [user]);

  return (
    <CoachShell title="Clientes">
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {clients.length === 0 ? (
        <p className="text-sm text-zinc-500 text-center py-12">Aún no tienes clientes. Invita al primero.</p>
      ) : (
        <ul className="space-y-3">
          {clients.map((client) => (
            <li key={client.athleteId}>
              <Link
                to={`/coach/clients/${client.athleteId}`}
                className={`block rounded-xl border p-4 hover:border-zinc-700 transition-colors ${
                  client.isTrainingNow
                    ? 'border-lime-500/40 bg-lime-500/5'
                    : 'border-zinc-800 bg-zinc-900/60'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{client.name}</p>
                      {client.isTrainingNow && (
                        <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wide text-lime-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
                          En vivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {client.fitnessGoal ?? 'Sin objetivo'} · {STATUS_LABELS[client.status] ?? client.status}
                    </p>
                    {client.isTrainingNow && client.currentSessionFocus && (
                      <p className="text-[11px] text-lime-400/80 mt-1 truncate">
                        {client.currentSessionFocus}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 mt-1" />
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {client.hasMesocycle ? (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-lime-500/80">
                      <Activity className="w-3 h-3" />
                      Plan activo
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wide text-amber-400/80">Pendiente setup</span>
                  )}
                  {client.checkinDue && (
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide ${
                        client.checkinOverdue ? 'text-red-400' : 'text-amber-300'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      {client.checkinOverdue ? 'Check-in atrasado' : 'Pedir check-in'}
                    </span>
                  )}
                </div>

                {client.lastSessionAt && (
                  <p className="text-[11px] text-zinc-600 mt-2">
                    Última sesión: {new Date(client.lastSessionAt).toLocaleDateString('es')}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </CoachShell>
  );
}
