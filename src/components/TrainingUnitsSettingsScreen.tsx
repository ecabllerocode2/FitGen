import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Dumbbell } from 'lucide-react';
import WeightUnitToggle from './WeightUnitToggle';
import { useWeightUnit } from '../context/WeightUnitContext';
import { AppEyebrow, AppShell } from './ui/AppPrimitives';

export default function TrainingUnitsSettingsScreen() {
  const navigate = useNavigate();
  const { activeUnit, setActiveUnit, isPersisting } = useWeightUnit();

  return (
    <AppShell className="pb-10">
      <header className="px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 border-b border-zinc-800/90">
        <div className="max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-500/10 ring-1 ring-lime-500/20 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-lime-400" />
            </div>
            <div>
              <AppEyebrow>Unidades de carga</AppEyebrow>
              <h1 className="text-xl font-bold text-white mt-1">Pesos de entrenamiento</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-sm mx-auto w-full space-y-6">
        <section className="rounded-2xl bg-zinc-900/70 ring-1 ring-zinc-800 p-5 space-y-4">
          <div>
            <p className="text-sm text-zinc-300 font-medium">Unidad preferida</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Se aplica a todos los ejercicios de esta y las próximas sesiones hasta que la cambies.
            </p>
          </div>
          <WeightUnitToggle unit={activeUnit} onChange={setActiveUnit} />
          {isPersisting && (
            <p className="text-xs text-zinc-500">Guardando preferencia…</p>
          )}
        </section>

        <p className="text-xs text-zinc-600 leading-relaxed">
          Los pesos se guardan internamente en kilogramos para mantener tu progresión consistente.
        </p>
      </main>
    </AppShell>
  );
}
