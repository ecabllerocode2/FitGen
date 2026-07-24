import { useState } from 'react';
import type { FitnessGoal, FocusArea, DayOfWeek, MusclePriority, BodyCompositionGoal } from '../../types/session';
import { TRAINING_AGE_OPTIONS } from '../../utils/experienceLevel';

const GOALS: FitnessGoal[] = ['Hipertrofia', 'Fuerza'];
const BODY_OPTIONS: BodyCompositionGoal[] = ['Mantener', 'Perder_Grasa', 'Ganar_Musculo'];
const MUSCLES = ['Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas', 'Core'];
const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const INJURIES = ['Hombro', 'Rodilla', 'Espalda Baja', 'Muñeca'];

export interface TrainingProfileFormState {
  fitnessGoal: FitnessGoal;
  trainingAgeMonths: number;
  trainingDaysPerWeek: number;
  weeklyScheduleContext: Array<{ day: DayOfWeek; canTrain: boolean; externalLoad: string }>;
  focusArea: FocusArea;
  bodyCompositionGoal: BodyCompositionGoal;
  musclePriorities: MusclePriority[];
  injuriesOrLimitations: string[];
}

interface CoachTrainingProfileFormProps {
  initial?: Partial<TrainingProfileFormState>;
  mode?: 'setup' | 'edit';
  onSubmit: (data: TrainingProfileFormState, generateMesocycle: boolean) => Promise<void>;
  loading?: boolean;
}

export default function CoachTrainingProfileForm({
  initial,
  mode = 'setup',
  onSubmit,
  loading = false,
}: CoachTrainingProfileFormProps) {
  const [goal, setGoal] = useState<FitnessGoal>(initial?.fitnessGoal ?? 'Hipertrofia');
  const [trainingAgeMonths, setTrainingAgeMonths] = useState(initial?.trainingAgeMonths ?? 18);
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(
    () => new Set((initial?.weeklyScheduleContext ?? []).filter((d) => d.canTrain).map((d) => d.day)),
  );
  const [focusArea] = useState<FocusArea>(initial?.focusArea ?? 'General');
  const [bodyCompositionGoal, setBodyCompositionGoal] = useState<BodyCompositionGoal>(
    initial?.bodyCompositionGoal ?? 'Mantener',
  );
  const [musclePriorities, setMusclePriorities] = useState<MusclePriority[]>(initial?.musclePriorities ?? []);
  const [injuries, setInjuries] = useState<string[]>(initial?.injuriesOrLimitations ?? []);

  const weeklyScheduleContext = DAYS.map((day) => {
    const existing = initial?.weeklyScheduleContext?.find((d) => d.day === day);
    return {
      day,
      canTrain: selectedDays.has(day),
      externalLoad: existing?.externalLoad ?? 'ninguna',
    };
  });

  const buildPayload = (): TrainingProfileFormState => ({
    fitnessGoal: goal,
    trainingAgeMonths,
    trainingDaysPerWeek: selectedDays.size,
    weeklyScheduleContext,
    focusArea,
    bodyCompositionGoal,
    musclePriorities,
    injuriesOrLimitations: injuries,
  });

  const toggleMuscle = (muscle: string) => {
    setMusclePriorities((prev) => {
      const exists = prev.find((m) => m.muscle === muscle);
      if (exists) return prev.filter((m) => m.muscle !== muscle);
      if (prev.length >= 2) return prev;
      return [...prev, { muscle, intensity: 'moderate' as const }];
    });
  };

  const isSetup = mode === 'setup';

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(buildPayload(), isSetup);
      }}
    >
      <section>
        <p className="text-xs text-zinc-500 mb-2">Objetivo</p>
        <div className="flex gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              className={`flex-1 rounded-lg py-2 text-sm ${goal === g ? 'bg-lime-500/10 text-lime-400 ring-1 ring-lime-500/30' : 'bg-zinc-900 text-zinc-500'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs text-zinc-500 mb-2">Experiencia (meses)</p>
        <select
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
          value={trainingAgeMonths}
          onChange={(e) => setTrainingAgeMonths(Number(e.target.value))}
        >
          {TRAINING_AGE_OPTIONS.map((opt) => (
            <option key={opt.months} value={opt.months}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      <section>
        <p className="text-xs text-zinc-500 mb-2">Días de entrenamiento</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() =>
                setSelectedDays((prev) => {
                  const next = new Set(prev);
                  if (next.has(day)) next.delete(day);
                  else next.add(day);
                  return next;
                })
              }
              className={`w-10 h-10 rounded-full text-xs ${selectedDays.has(day) ? 'bg-lime-500 text-zinc-900' : 'bg-zinc-900 text-zinc-500'}`}
            >
              {day.slice(0, 1)}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-zinc-600 mt-2">
          {selectedDays.size} día{selectedDays.size === 1 ? '' : 's'} seleccionado{selectedDays.size === 1 ? '' : 's'}
        </p>
      </section>

      <section>
        <p className="text-xs text-zinc-500 mb-2">Énfasis muscular (máx. 2)</p>
        <div className="flex flex-wrap gap-2">
          {MUSCLES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMuscle(m)}
              className={`px-3 py-1 rounded-full text-xs ${musclePriorities.some((p) => p.muscle === m) ? 'bg-lime-500/10 text-lime-400' : 'bg-zinc-900 text-zinc-500'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs text-zinc-500 mb-2">Lesiones / limitaciones</p>
        <div className="flex flex-wrap gap-2">
          {INJURIES.map((inj) => (
            <button
              key={inj}
              type="button"
              onClick={() =>
                setInjuries((prev) =>
                  prev.includes(inj) ? prev.filter((i) => i !== inj) : [...prev, inj],
                )
              }
              className={`px-3 py-1 rounded-full text-xs ${injuries.includes(inj) ? 'bg-amber-500/10 text-amber-300' : 'bg-zinc-900 text-zinc-500'}`}
            >
              {inj}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs text-zinc-500 mb-2">Composición corporal</p>
        <select
          className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
          value={bodyCompositionGoal}
          onChange={(e) => setBodyCompositionGoal(e.target.value as BodyCompositionGoal)}
        >
          {BODY_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o.replace('_', ' ')}
            </option>
          ))}
        </select>
      </section>

      {!isSetup && (
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Los cambios se aplican con las mismas reglas que cuando el atleta edita su perfil: el mesociclo
          activo se adapta (remap de días, seguridad o regeneración parcial) sin perder historial.
        </p>
      )}

      <button
        type="submit"
        disabled={loading || selectedDays.size < 2}
        className="w-full rounded-xl bg-lime-500 text-zinc-900 font-semibold py-4 disabled:opacity-50"
      >
        {loading
          ? 'Guardando…'
          : isSetup
            ? 'Guardar y generar mesociclo'
            : 'Guardar cambios en el plan'}
      </button>
    </form>
  );
}
