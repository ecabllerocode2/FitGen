import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { fetchAdminUserDashboard } from '../../api/admin';
import { isAdminUser } from '../../constants/admin';
import type { CoachClientDashboardData } from '../../types/coachDashboard';
import CoachClientDashboard from './dashboard/CoachClientDashboard';
import CoachShell from './CoachShell';

interface CoachAdminUserDetailPageProps {
  user: User;
}

export default function CoachAdminUserDetailPage({ user }: CoachAdminUserDetailPageProps) {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [client, setClient] = useState<CoachClientDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!athleteId) return;
    const token = await user.getIdToken();
    setClient(await fetchAdminUserDashboard(token, athleteId));
  }, [athleteId, user]);

  useEffect(() => {
    void load().catch((err) => setError((err as Error).message));
    const interval = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 45000);
    return () => window.clearInterval(interval);
  }, [load]);

  if (!isAdminUser(user.uid)) {
    return <Navigate to="/coach" replace />;
  }

  if (!athleteId) return null;

  const profile = client?.profileData as Record<string, unknown> | undefined;
  const clientName = (profile?.name as string) ?? 'Usuario';

  if (!client && !error) {
    return (
      <CoachShell title="Usuario" wide userUid={user.uid}>
        <p className="text-zinc-500 text-sm">Cargando…</p>
      </CoachShell>
    );
  }

  return (
    <CoachShell title={clientName} wide userUid={user.uid}>
      <Link
        to="/coach/admin/users"
        className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Todos los usuarios
      </Link>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {client && <CoachClientDashboard client={client} />}
    </CoachShell>
  );
}
