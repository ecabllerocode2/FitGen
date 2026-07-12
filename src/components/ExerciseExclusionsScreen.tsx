import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import { AppEyebrow, AppPrimaryButton, AppShell } from './ui/AppPrimitives';

export interface ExerciseExclusion {
  exerciseId: string;
  nombre: string;
  reason?: string;
  excludedAt?: string;
  equipmentTags?: string[];
}

export interface ExercisePreferences {
  excluded?: ExerciseExclusion[];
  unavailableEquipment?: string[];
}

interface ExerciseExclusionsScreenProps {
  exercisePreferences?: ExercisePreferences;
  onPreferencesUpdated?: (prefs: ExercisePreferences) => void;
}

export default function ExerciseExclusionsScreen({
  exercisePreferences,
  onPreferencesUpdated,
}: ExerciseExclusionsScreenProps) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<ExercisePreferences>(exercisePreferences ?? { excluded: [], unavailableEquipment: [] });
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const excluded = prefs.excluded ?? [];
  const equipment = prefs.unavailableEquipment ?? [];

  const handleRestoreExercise = async (exerciseId: string) => {
    setRestoringId(exerciseId);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error('Sesión expirada');
      const res = await authenticatedFetch(API_ENDPOINTS.EXERCISE_PREFERENCES, token, {
        method: 'POST',
        body: JSON.stringify({ action: 'restore', exerciseId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Error al restaurar');
      setPrefs(data.exercisePreferences);
      onPreferencesUpdated?.(data.exercisePreferences);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo restaurar');
    } finally {
      setRestoringId(null);
    }
  };

  const handleRestoreEquipment = async (tag: string) => {
    setRestoringId(`eq:${tag}`);
    try {
      const token = await getAuth().currentUser?.getIdToken();
      if (!token) throw new Error('Sesión expirada');
      const res = await authenticatedFetch(API_ENDPOINTS.EXERCISE_PREFERENCES, token, {
        method: 'POST',
        body: JSON.stringify({ action: 'restore', equipment: tag }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Error al restaurar');
      setPrefs(data.exercisePreferences);
      onPreferencesUpdated?.(data.exercisePreferences);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'No se pudo restaurar');
    } finally {
      setRestoringId(null);
    }
  };

  const isEmpty = excluded.length === 0 && equipment.length === 0;

  return (
    <AppShell className="pb-10">
      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-4 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-200 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver
        </button>
        <AppEyebrow>Configuración</AppEyebrow>
        <h1 className="text-2xl font-bold text-white mt-3">Ejercicios excluidos</h1>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Ejercicios o equipos que marcaste como no disponibles en tu gimnasio.
        </p>
      </header>

      <main className="px-6 py-6 max-w-sm mx-auto w-full space-y-8">
        {isEmpty ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            No tienes exclusiones guardadas. Puedes excluir ejercicios al cambiarlos en el calentamiento o bloque principal.
          </p>
        ) : null}

        {excluded.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-zinc-600 mb-3">Por ejercicio</h2>
            <ul className="space-y-2">
              {excluded.map((row) => (
                <li
                  key={row.exerciseId}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{row.nombre}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {row.reason === 'unavailable' ? 'No disponible en gimnasio' : row.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={restoringId === row.exerciseId}
                    onClick={() => handleRestoreExercise(row.exerciseId)}
                    className="shrink-0 flex items-center gap-1 text-xs text-lime-400 hover:text-lime-300 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {equipment.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-wider text-zinc-600 mb-3">Equipo no disponible</h2>
            <ul className="space-y-2">
              {equipment.map((tag) => (
                <li
                  key={tag}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800"
                >
                  <p className="text-sm text-white">{tag}</p>
                  <button
                    type="button"
                    disabled={restoringId === `eq:${tag}`}
                    onClick={() => handleRestoreEquipment(tag)}
                    className="shrink-0 flex items-center gap-1 text-xs text-lime-400 hover:text-lime-300 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Restaurar
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AppPrimaryButton type="button" onClick={() => navigate('/')}>
          Ir al inicio
        </AppPrimaryButton>
      </main>
    </AppShell>
  );
}
