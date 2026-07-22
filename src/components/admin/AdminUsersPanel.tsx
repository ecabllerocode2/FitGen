import { useEffect, useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, RefreshCw, Users, Activity, CalendarCheck, Trophy, ChevronRight } from 'lucide-react';
import { fetchAdminUsersOverview, type AdminUserRow, type AdminUsersOverview } from '../../api/admin';
import AdminUserDetailView from './AdminUserDetailView';

type AdminUsersPanelProps = {
  authToken: string;
  onClose: () => void;
};

function formatLastSession(iso: string | null): string {
  if (!iso) return 'Sin sesiones';
  try {
    const date = parseISO(iso);
    return `${format(date, 'd MMM yyyy, HH:mm', { locale: es })} · ${formatDistanceToNow(date, { addSuffix: true, locale: es })}`;
  } catch {
    return iso;
  }
}

export default function AdminUsersPanel({ authToken, onClose }: AdminUsersPanelProps) {
  const [data, setData] = useState<AdminUsersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchAdminUsersOverview(authToken);
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [authToken]);

  const summary = data?.summary;

  return (
    <div className="fixed inset-0 bg-zinc-950/95 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-zinc-950 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92dvh] overflow-hidden flex flex-col">
        {!selectedUser && (
          <div className="shrink-0 px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 border-b border-zinc-800">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 -ml-2 text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="p-2 text-zinc-500 hover:text-lime-400 transition-colors disabled:opacity-40"
                title="Actualizar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-white mt-2">Panel de usuarios</h2>
            <p className="text-xs text-zinc-500 mt-1">
              Solo administrador · toca un usuario para ver estadísticas
            </p>
          </div>
        )}

        {selectedUser ? (
          <div className="pt-[max(0.75rem,env(safe-area-inset-top))] flex flex-col flex-1 min-h-0">
            <AdminUserDetailView
              authToken={authToken}
              user={selectedUser}
              onBack={() => setSelectedUser(null)}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {loading && !data && (
              <p className="text-sm text-zinc-500 py-10 text-center">Cargando usuarios…</p>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={Users} label="Usuarios" value={String(summary.totalUsers)} />
                <StatCard icon={Activity} label="Hoy" value={String(summary.activeToday)} accent />
                <StatCard icon={CalendarCheck} label="Semana" value={String(summary.activeThisWeek)} />
                <StatCard icon={Trophy} label="Sesiones" value={String(summary.totalSessions)} />
              </div>
            )}

            {summary && (
              <p className="text-[11px] text-zinc-600">
                Promedio {summary.averageSessions} sesiones/usuario · {summary.approved} aprobados ·{' '}
                {summary.pendingApproval} pendientes
              </p>
            )}

            {data?.users && (
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] gap-3 px-4 py-2.5 bg-zinc-900/80 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                  <span>Estado</span>
                  <span>Usuario</span>
                  <span className="hidden sm:block">Última sesión</span>
                  <span className="text-right">Stats</span>
                </div>
                <ul className="divide-y divide-zinc-800/80">
                  {data.users.map((user: AdminUserRow) => (
                    <li key={user.uid}>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user)}
                        className="w-full grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_1fr_auto] gap-3 px-4 py-3 items-start text-left hover:bg-zinc-900/70 transition-colors group"
                      >
                        <div className="pt-1.5" title={user.trainedToday ? 'Entrenó hoy' : 'Sin sesión hoy'}>
                          <span
                            className={`block h-2.5 w-2.5 rounded-full ${
                              user.trainedToday
                                ? 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.6)]'
                                : 'bg-zinc-700'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-lime-300 transition-colors">
                            {user.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">{user.email ?? '—'}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5 sm:hidden">
                            {formatLastSession(user.lastSessionAt)}
                          </p>
                        </div>
                        <div className="hidden sm:block min-w-0">
                          <p className="text-xs text-zinc-400">{formatLastSession(user.lastSessionAt)}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5 capitalize">
                            {user.status.replace('_', ' ')}
                          </p>
                        </div>
                        <div className="flex items-start gap-1 justify-end">
                          <div className="text-right text-[10px] text-zinc-500 tabular-nums leading-relaxed">
                            <p>{user.totalSessions} ses.</p>
                            <p>
                              {user.fitCoins} FC · racha {user.currentStreak}d
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-lime-400 mt-0.5 shrink-0 transition-colors" />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data?.generatedAt && (
              <p className="text-[10px] text-zinc-700 text-center pb-2">
                Actualizado {format(parseISO(data.generatedAt), 'HH:mm:ss', { locale: es })}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-3 py-3">
      <div className="flex items-center gap-1.5 text-zinc-500">
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-lime-400' : ''}`} />
        <span className="text-[9px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className={`text-2xl font-bold tabular-nums mt-1 ${accent ? 'text-lime-400' : 'text-white'}`}>{value}</p>
    </div>
  );
}
