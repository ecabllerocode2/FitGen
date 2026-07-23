import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { AlertTriangle, UserPlus } from 'lucide-react';
import { fetchCoachMe } from '../../api/coach';
import type { CoachProfile } from '../../types/coach';
import CoachShell from './CoachShell';
import PaywallModal from './PaywallModal';

interface CoachHomeProps {
  user: User;
}

export default function CoachHome({ user }: CoachHomeProps) {
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [summary, setSummary] = useState<{
    activeClientCount: number;
    seatsConsumedLifetime: number;
    seatLimit: number;
    alerts: Array<{ athleteId: string; athleteName: string; title: string; message: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const token = await user.getIdToken();
        const data = await fetchCoachMe(token);
        setCoach(data.coach);
        setSummary(data.summary);
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [user]);

  const seatsUsed = summary?.seatsConsumedLifetime ?? 0;
  const seatLimit = summary?.seatLimit ?? 3;
  const atLimit = seatsUsed >= seatLimit;

  return (
    <CoachShell title={`Hola, ${coach?.displayName ?? 'Coach'}`}>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs text-zinc-500">Clientes activos</p>
          <p className="text-2xl font-bold mt-1">{summary?.activeClientCount ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs text-zinc-500">Asientos usados</p>
          <p className="text-2xl font-bold mt-1">
            {seatsUsed}/{seatLimit}
          </p>
          {coach?.plan === 'free' && (
            <p className="text-[10px] text-zinc-600 mt-1">Lifetime en plan free</p>
          )}
        </div>
      </div>

      <Link
        to={atLimit ? '#' : '/coach/invite'}
        onClick={(e) => {
          if (atLimit) {
            e.preventDefault();
            setShowPaywall(true);
          }
        }}
        className={`flex items-center justify-center gap-2 w-full rounded-xl py-4 font-semibold mb-6 ${
          atLimit
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            : 'bg-lime-500 text-zinc-900 hover:bg-lime-400'
        }`}
      >
        <UserPlus className="w-5 h-5" />
        Invitar cliente
      </Link>

      {summary?.alerts && summary.alerts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Alertas del día
          </h2>
          <div className="space-y-2">
            {summary.alerts.map((alert) => (
              <Link
                key={`${alert.athleteId}-${alert.title}`}
                to={`/coach/clients/${alert.athleteId}`}
                className="block rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
              >
                <p className="text-sm font-medium text-amber-200">{alert.athleteName}</p>
                <p className="text-xs text-zinc-400 mt-1">{alert.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <Link
        to="/coach/clients"
        className="block text-center text-sm text-lime-400 hover:text-lime-300"
      >
        Ver todos los clientes →
      </Link>

      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} plan={coach?.plan ?? 'free'} />
    </CoachShell>
  );
}
