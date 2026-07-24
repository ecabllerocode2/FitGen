import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchCoachClientDetail,
  saveClientTrainingProfile,
  releaseClient,
  addClientNote,
} from '../../api/coach';
import type { CoachClientDashboardData } from '../../types/coachDashboard';
import CoachShell from './CoachShell';
import CoachTrainingProfileForm from './CoachTrainingProfileForm';
import CoachClientDashboard from './dashboard/CoachClientDashboard';

interface CoachClientDetailPageProps {
  user: User;
}

export default function CoachClientDetailPage({ user }: CoachClientDetailPageProps) {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<CoachClientDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const load = async () => {
    if (!athleteId) return;
    const token = await user.getIdToken();
    setClient(await fetchCoachClientDetail(token, athleteId));
  };

  useEffect(() => {
    void load().catch((err) => setError((err as Error).message));
    const interval = window.setInterval(() => {
      void load().catch(() => undefined);
    }, 45000);
    return () => window.clearInterval(interval);
  }, [user, athleteId]);

  if (!athleteId) return null;
  if (!client && !error) {
    return (
      <CoachShell title="Cliente">
        <p className="text-zinc-500 text-sm">Cargando…</p>
      </CoachShell>
    );
  }

  const profile = client?.profileData as Record<string, unknown> | undefined;
  const needsSetup = !client?.profileCompleteness?.readyForMesocycle;
  const clientName = (profile?.name as string) ?? 'Cliente';

  return (
    <CoachShell title={clientName}>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {client && (
        <>
          <CoachClientDashboard client={client} />

          {needsSetup && (
            <section className="mt-8 border-t border-zinc-800 pt-6">
              <button
                type="button"
                onClick={() => setShowSetup((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-semibold text-zinc-200 mb-3"
              >
                Configuración técnica pendiente
                <span className="text-xs text-lime-400">{showSetup ? 'Ocultar' : 'Mostrar'}</span>
              </button>
              {showSetup && (
                <CoachTrainingProfileForm
                  initial={{
                    fitnessGoal: profile?.fitnessGoal as never,
                    trainingAgeMonths: profile?.trainingAgeMonths as number,
                    weeklyScheduleContext: profile?.weeklyScheduleContext as never,
                    focusArea: profile?.focusArea as never,
                    bodyCompositionGoal: profile?.bodyCompositionGoal as never,
                    musclePriorities: profile?.musclePriorities as never,
                    injuriesOrLimitations: profile?.injuriesOrLimitations as string[],
                  }}
                  loading={saving}
                  onSubmit={async (data, generateMesocycle) => {
                    setSaving(true);
                    setError(null);
                    try {
                      const token = await user.getIdToken();
                      await saveClientTrainingProfile(
                        token,
                        athleteId,
                        data as unknown as Record<string, unknown>,
                        generateMesocycle,
                      );
                      await load();
                      setShowSetup(false);
                    } catch (err) {
                      setError((err as Error).message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                />
              )}
            </section>
          )}

          <section className="mt-8 border-t border-zinc-800 pt-6">
            <h2 className="text-sm font-semibold mb-2 text-zinc-200">Notas privadas</h2>
            <div className="space-y-2 mb-3">
              {(client.notes ?? []).map((note) => (
                <div key={note.id} className="rounded-lg bg-zinc-900 p-3 text-sm text-zinc-300">
                  {note.text}
                  <p className="text-[10px] text-zinc-600 mt-1">
                    {new Date(note.createdAt).toLocaleString('es')}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Nueva nota…"
              />
              <button
                type="button"
                className="rounded-lg bg-lime-500/10 text-lime-400 px-3 text-xs"
                onClick={() =>
                  void (async () => {
                    if (!noteText.trim()) return;
                    const token = await user.getIdToken();
                    await addClientNote(token, athleteId, noteText.trim());
                    setNoteText('');
                    await load();
                  })()
                }
              >
                Guardar
              </button>
            </div>
          </section>

          <button
            type="button"
            className="w-full mt-8 rounded-xl border border-red-500/30 text-red-400 py-3 text-sm"
            onClick={() =>
              void (async () => {
                if (!confirm('¿Archivar cliente? El asiento free no se recupera.')) return;
                const token = await user.getIdToken();
                await releaseClient(token, athleteId);
                navigate('/coach/clients');
              })()
            }
          >
            Archivar cliente
          </button>
        </>
      )}
    </CoachShell>
  );
}
