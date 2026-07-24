import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchCoachClientDetail,
  saveClientTrainingProfile,
  releaseClient,
  addClientNote,
  coachSwapExercise,
} from '../../api/coach';
import type { CoachClientDetail } from '../../types/coach';
import CoachShell from './CoachShell';
import CoachTrainingProfileForm from './CoachTrainingProfileForm';

interface CoachClientDetailPageProps {
  user: User;
}

export default function CoachClientDetailPage({ user }: CoachClientDetailPageProps) {
  const { athleteId } = useParams<{ athleteId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<CoachClientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [swapId, setSwapId] = useState('');

  const load = async () => {
    if (!athleteId) return;
    const token = await user.getIdToken();
    setClient(await fetchCoachClientDetail(token, athleteId));
  };

  useEffect(() => {
    void load().catch((err) => setError((err as Error).message));
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

  return (
    <CoachShell title={(profile?.name as string) ?? 'Cliente'}>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {client && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            <div className="rounded-xl border border-zinc-800 p-3">
              <p className="text-zinc-500 text-xs">Adherencia 7d</p>
              <p className="text-xl font-bold">{client.metrics.adherence7}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 p-3">
              <p className="text-zinc-500 text-xs">Adherencia 28d</p>
              <p className="text-xl font-bold">{client.metrics.adherence28}</p>
            </div>
          </div>

          {client.insights.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold mb-2">Consejos para asesorar</h2>
              <div className="space-y-2">
                {client.insights.map((insight) => (
                  <div key={insight.id} className="rounded-xl border border-zinc-800 p-3 text-sm">
                    <p className="font-medium text-zinc-200">{insight.title}</p>
                    <p className="text-zinc-500 mt-1">{insight.message}</p>
                    <p className="text-lime-400/80 text-xs mt-2">{insight.suggestion}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {needsSetup && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold mb-3">Configuración técnica</h2>
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
                    await saveClientTrainingProfile(token, athleteId, data as unknown as Record<string, unknown>, generateMesocycle);
                    await load();
                  } catch (err) {
                    setError((err as Error).message);
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </section>
          )}

          {client.currentSession && !client.currentSession.completed && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold mb-2">Sesión activa</h2>
              <p className="text-xs text-zinc-500 mb-2">{client.currentSession.sessionFocus}</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm"
                  placeholder="ID ejercicio a reemplazar"
                  value={swapId}
                  onChange={(e) => setSwapId(e.target.value)}
                />
                <button
                  type="button"
                  className="rounded-lg bg-zinc-800 px-3 text-xs"
                  onClick={() =>
                    void (async () => {
                      if (!swapId.trim()) return;
                      const token = await user.getIdToken();
                      await coachSwapExercise(token, athleteId, {
                        exerciseIdToReplace: swapId.trim(),
                        reason: 'preference',
                      });
                      setSwapId('');
                      await load();
                    })()
                  }
                >
                  Swap
                </button>
              </div>
            </section>
          )}

          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-2">Notas</h2>
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
            className="w-full rounded-xl border border-red-500/30 text-red-400 py-3 text-sm"
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
