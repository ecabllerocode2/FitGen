import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Link } from 'react-router-dom';
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
                className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {client.fitnessGoal ?? 'Sin objetivo'} · {STATUS_LABELS[client.status] ?? client.status}
                    </p>
                  </div>
                  {client.hasMesocycle ? (
                    <span className="text-[10px] uppercase tracking-wide text-lime-500/80">Plan activo</span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wide text-amber-400/80">Pendiente</span>
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
