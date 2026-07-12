import { useState, useMemo, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Zap,
  Calendar,
  Shield,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../../config/api';
import type { FitnessGoal, FocusArea, DayOfWeek, ExternalLoad } from '../../types/session';
import { TRAINING_AGE_OPTIONS, getExperienceLevelFromMonths } from '../../utils/experienceLevel';
import { getMesocyclePreviewSessions, normalizeMesocycleForUI } from '../../utils/mesocycleNormalizer';
import {
  endOnboardingFlowLock,
  readOnboardingFlowData,
  readPendingMesocycle,
  startOnboardingFlowLock,
  waitMs,
  writeOnboardingFlowData,
  writePendingMesocycle,
  clearPendingMesocycle,
} from '../../utils/onboardingFlowLock';
import { MIN_ONBOARDING_FLOW_MS, MIN_SAVING_DISPLAY_MS } from '../../utils/splitGenerationContext';
import MesocycleGenerationLoader from '../MesocycleGenerationLoader';
import StepProgress from './StepProgress';
import OptionCard from './OptionCard';

const TOTAL_STEPS = 5;

const GOALS: { value: FitnessGoal; title: string; desc: string }[] = [
  { value: 'Hipertrofia', title: 'Hipertrofia', desc: 'Volumen progresivo, 8–12 reps, estilo RP' },
  { value: 'Fuerza', title: 'Fuerza', desc: 'Cargas pesadas, 3–6 reps, levantamientos clave' },
];

const FOCUS_OPTIONS: { value: FocusArea; label: string }[] = [
  { value: 'General', label: 'Balanceado' },
  { value: 'Tren_Superior', label: 'Tren superior' },
  { value: 'Tren_Inferior', label: 'Tren inferior' },
  { value: 'Core', label: 'Core' },
];

const INJURY_OPTIONS = ['Hombro', 'Rodilla', 'Espalda Baja', 'Muñeca'] as const;
const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro'] as const;

const DAYS: { key: DayOfWeek; short: string }[] = [
  { key: 'Lunes', short: 'L' },
  { key: 'Martes', short: 'M' },
  { key: 'Miércoles', short: 'X' },
  { key: 'Jueves', short: 'J' },
  { key: 'Viernes', short: 'V' },
  { key: 'Sábado', short: 'S' },
  { key: 'Domingo', short: 'D' },
];

const DAY_PRESETS: Record<number, number[]> = {
  3: [0, 2, 4],
  4: [0, 1, 3, 5],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

interface DaySchedule {
  day: DayOfWeek;
  canTrain: boolean;
  externalLoad: ExternalLoad;
}

interface UserProfileInitial {
  profileData?: {
    name?: string;
    age?: number;
    gender?: string;
    heightCm?: number;
    initialWeight?: number;
    fitnessGoal?: string;
    trainingAgeMonths?: number;
    injuriesOrLimitations?: string[] | string;
    focusArea?: string;
    trainingDaysPerWeek?: number;
    preferredTrainingDays?: string[];
    weeklyScheduleContext?: DaySchedule[];
  };
}

interface OnboardingWizardProps {
  user: User;
  db: Firestore;
  initialData?: UserProfileInitial;
}

type Phase = 'wizard' | 'saving' | 'generating' | 'preview';

export default function OnboardingWizard({ user, initialData }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const isEditMode = Boolean(initialData?.profileData?.name);
  const restoredFlow = readOnboardingFlowData();

  const [step, setStep] = useState(0);
  const [phase, setPhaseState] = useState<Phase>(() => {
    if (restoredFlow?.phase) return restoredFlow.phase;
    return 'wizard';
  });
  const [error, setError] = useState<string | null>(null);
  const [generatedMesocycle, setGeneratedMesocycle] = useState<any>(null);
  const [pendingMesocycle, setPendingMesocycleState] = useState<any>(() => readPendingMesocycle());
  const [loaderSequenceDone, setLoaderSequenceDoneState] = useState(
    () => restoredFlow?.loaderSequenceDone ?? false,
  );

  const setPhase = (next: Phase) => {
    setPhaseState(next);
    if (next === 'saving' || next === 'generating' || next === 'preview') {
      writeOnboardingFlowData({ phase: next });
    }
  };

  const setPendingMesocycle = (meso: any) => {
    setPendingMesocycleState(meso);
    if (meso) writePendingMesocycle(meso);
    else clearPendingMesocycle();
  };

  const setLoaderSequenceDone = (done: boolean) => {
    setLoaderSequenceDoneState(done);
    writeOnboardingFlowData({ loaderSequenceDone: done });
  };

  const [goal, setGoal] = useState<FitnessGoal | ''>('');
  const [trainingAgeMonths, setTrainingAgeMonths] = useState(18);
  const [selectedDays, setSelectedDays] = useState<Set<DayOfWeek>>(new Set());
  const [injuries, setInjuries] = useState<string[]>([]);
  const [focusArea, setFocusArea] = useState<FocusArea>('General');
  const [name, setName] = useState(user.displayName || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  useEffect(() => {
    const p = initialData?.profileData;
    if (!p) return;
    if (p.fitnessGoal) setGoal(p.fitnessGoal as FitnessGoal);
    if (p.trainingAgeMonths) setTrainingAgeMonths(p.trainingAgeMonths);
    if (p.name) setName(p.name);
    if (p.age) setAge(String(p.age));
    if (p.gender) setGender(p.gender);
    if (p.initialWeight) setWeight(String(p.initialWeight));
    if (p.heightCm) setHeight(String(p.heightCm));
    if (p.focusArea) setFocusArea(p.focusArea as FocusArea);
    if (p.injuriesOrLimitations) {
      const list = Array.isArray(p.injuriesOrLimitations)
        ? p.injuriesOrLimitations
        : [p.injuriesOrLimitations];
      setInjuries(list.filter((i) => i && i !== 'Ninguna'));
    }
    if (p.weeklyScheduleContext?.length) {
      setSelectedDays(new Set(p.weeklyScheduleContext.filter((d) => d.canTrain).map((d) => d.day)));
    } else if (p.preferredTrainingDays?.length) {
      setSelectedDays(new Set(p.preferredTrainingDays as DayOfWeek[]));
    }
  }, [initialData]);

  useEffect(() => {
    if (phase !== 'generating' || !pendingMesocycle || !loaderSequenceDone) return;

    const goToPreview = async () => {
      const flow = readOnboardingFlowData();
      const startedAt = flow?.startedAt ?? Date.now();
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_ONBOARDING_FLOW_MS) {
        await waitMs(MIN_ONBOARDING_FLOW_MS - elapsed);
      }

      setGeneratedMesocycle(pendingMesocycle);
      setPendingMesocycle(null);
      setLoaderSequenceDone(false);
      setPhase('preview');
    };

    void goToPreview();
  }, [phase, pendingMesocycle, loaderSequenceDone]);

  const experienceLevel = useMemo(
    () => getExperienceLevelFromMonths(trainingAgeMonths),
    [trainingAgeMonths],
  );

  const weeklySchedule = useMemo<DaySchedule[]>(
    () =>
      DAYS.map(({ key }) => ({
        day: key,
        canTrain: selectedDays.has(key),
        externalLoad: 'none' as ExternalLoad,
      })),
    [selectedDays],
  );

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const applyPreset = (count: 3 | 4 | 5 | 6) => {
    const indices = DAY_PRESETS[count];
    setSelectedDays(new Set(indices.map((i) => DAYS[i].key)));
  };

  const canContinue = (): boolean => {
    switch (step) {
      case 0:
        return goal !== '';
      case 1:
        return trainingAgeMonths > 0;
      case 2:
        return selectedDays.size >= 2 && selectedDays.size <= 6;
      case 3:
        return true;
      case 4:
        return (
          name.trim().length > 0 &&
          !!age &&
          parseInt(age) >= 15 &&
          parseInt(age) <= 100 &&
          !!gender &&
          !!weight &&
          parseFloat(weight) >= 30 &&
          !!height &&
          parseInt(height) >= 120
        );
      default:
        return false;
    }
  };

  const stepError = (): string | null => {
    if (step === 2) {
      if (selectedDays.size < 2) return 'Selecciona al menos 2 días de entrenamiento.';
      if (selectedDays.size > 6) return 'Máximo 6 días por semana.';
    }
    if (step === 4) {
      if (!name.trim()) return 'Ingresa tu nombre.';
      if (!age || parseInt(age) < 15) return 'Ingresa una edad válida (15+).';
      if (!gender) return 'Selecciona tu género.';
      if (!weight) return 'Ingresa tu peso.';
      if (!height) return 'Ingresa tu estatura.';
    }
    return null;
  };

  const handleNext = () => {
    const err = stepError();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else {
      startOnboardingFlowLock('saving');
      void finishOnboarding();
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 0) setStep((s) => s - 1);
  };

  const finishOnboarding = async () => {
    setPhase('saving');
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const preferredDaysList = weeklySchedule.filter((d) => d.canTrain).map((d) => d.day);

      const payload = {
        userId: user.uid,
        userEmail: user.email,
        action: isEditMode ? 'profile_update_and_invalidate_plan' : 'initial_onboarding_complete',
        profileData: {
          name: name.trim(),
          age: parseInt(age),
          gender,
          heightCm: parseInt(height),
          initialWeight: parseFloat(weight),
          fitnessGoal: goal,
          trainingAgeMonths,
          injuriesOrLimitations: injuries.length ? injuries : [],
          focusArea,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          trainingDaysPerWeek: selectedDays.size,
          preferredTrainingDays: preferredDaysList,
          weeklyScheduleContext: weeklySchedule,
          dateCompleted: new Date().toISOString(),
        },
      };

      const saveRes = await authenticatedFetch(API_ENDPOINTS.USER_PROFILE_SAVE, idToken, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const saveText = await saveRes.text();
      const saveData = saveText ? JSON.parse(saveText) : null;
      if (!saveRes.ok) {
        throw new Error(saveData?.error || saveData?.message || 'Error al guardar perfil');
      }

      await user.getIdToken(true);

      if (isEditMode) {
        endOnboardingFlowLock();
        navigate('/', { replace: true });
        return;
      }

      await waitMs(MIN_SAVING_DISPLAY_MS);

      setPhase('generating');
      setLoaderSequenceDone(false);
      setPendingMesocycle(null);

      const mesoRes = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_GENERATE, idToken, {
        method: 'POST',
      });

      const mesoText = await mesoRes.text();
      const mesoData = mesoText ? JSON.parse(mesoText) : null;
      if (!mesoRes.ok || !mesoData?.success) {
        throw new Error(mesoData?.error || 'Error al generar mesociclo');
      }

      const normalized = normalizeMesocycleForUI(mesoData.mesocycle ?? mesoData.plan);
      setPendingMesocycle(normalized);
    } catch (err) {
      endOnboardingFlowLock();
      setError((err as Error).message);
      setPhase('wizard');
      setStep(TOTAL_STEPS - 1);
    }
  };

  const handleStart = async () => {
    endOnboardingFlowLock();
    await user.getIdToken(true);
    navigate('/', { replace: true });
  };

  const generationProfile = useMemo(
    () => ({
      fitnessGoal: goal || 'Hipertrofia',
      trainingAgeMonths,
      experienceLevel,
      trainingDaysPerWeek: selectedDays.size,
      weeklyScheduleContext: weeklySchedule,
      injuriesOrLimitations: injuries,
      age: age ? parseInt(age) : undefined,
    }),
    [goal, trainingAgeMonths, experienceLevel, selectedDays.size, weeklySchedule, injuries, age],
  );

  // --- Generating screen ---
  if (phase === 'generating' || phase === 'saving') {
    return (
      <MesocycleGenerationLoader
        phase={phase}
        profile={generationProfile}
        onSequenceComplete={
          phase === 'generating' ? () => setLoaderSequenceDone(true) : undefined
        }
      />
    );
  }

  // --- Preview screen ---
  if (phase === 'preview' && generatedMesocycle) {
    const sessions = getMesocyclePreviewSessions(generatedMesocycle);
    const duration = generatedMesocycle.durationWeeks ?? generatedMesocycle.mesocyclePlan?.durationWeeks;
    const split = generatedMesocycle.splitType ?? 'Personalizado';

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8 text-lime-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">¡Tu plan está listo!</h1>
          <p className="text-zinc-400 text-sm mb-8 max-w-xs">
            Mesociclo de {duration} semanas · {experienceLevel} · {goal}
          </p>

          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left mb-6">
            <p className="text-xs font-bold text-lime-400 uppercase tracking-wider mb-3">Split: {split}</p>
            <ul className="space-y-2">
              {sessions.map((line) => (
                <li key={line} className="text-sm text-zinc-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 pb-8 safe-area-bottom">
          <button
            type="button"
            onClick={() => void handleStart()}
            className="w-full bg-lime-500 hover:bg-lime-400 text-zinc-900 font-bold text-lg py-4 rounded-2xl transition-all shadow-[0_0_24px_rgba(132,204,22,0.35)]"
          >
            Empezar
          </button>
        </div>
      </div>
    );
  }

  // --- Wizard steps ---
  const stepTitles = [
    '¿Cuál es tu objetivo?',
    '¿Cuánta experiencia tienes?',
    '¿Qué días entrenas?',
    '¿Algo que debamos saber?',
    'Datos rápidos',
  ];

  const stepSubtitles = [
    'Elige el enfoque de tu mesociclo',
    'Calculamos tu nivel automáticamente',
    'Toca los días que vas al gym',
    'Opcional — ajustamos ejercicios por seguridad',
    'Solo lo necesario para tu prescripción',
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 text-zinc-400 hover:text-white transition"
              aria-label="Atrás"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <span className="text-xs text-zinc-500 font-medium">
            {step + 1} / {TOTAL_STEPS}
          </span>
          <div className="w-9" />
        </div>
        <StepProgress current={step} total={TOTAL_STEPS} />
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="max-w-md mx-auto" key={step}>
          <h1 className="text-2xl font-bold text-white mb-1">{stepTitles[step]}</h1>
          <p className="text-sm text-zinc-500 mb-6">{stepSubtitles[step]}</p>

          {/* Step 0: Goal */}
          {step === 0 && (
            <div className="space-y-3">
              {GOALS.map((g) => (
                <OptionCard
                  key={g.value}
                  selected={goal === g.value}
                  onClick={() => setGoal(g.value)}
                  title={g.title}
                  description={g.desc}
                  icon={g.value === 'Hipertrofia' ? <Dumbbell className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                />
              ))}
            </div>
          )}

          {/* Step 1: Experience */}
          {step === 1 && (
            <div className="space-y-3">
              {TRAINING_AGE_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.months}
                  selected={trainingAgeMonths === opt.months}
                  onClick={() => setTrainingAgeMonths(opt.months)}
                  title={opt.label}
                  description={opt.hint}
                />
              ))}
              <div className="mt-4 p-4 rounded-xl bg-lime-500/10 border border-lime-500/20 text-center">
                <p className="text-xs text-zinc-400">Tu nivel calculado</p>
                <p className="text-lg font-bold text-lime-400">{experienceLevel}</p>
              </div>
            </div>
          )}

          {/* Step 2: Days */}
          {step === 2 && (
            <div>
              <div className="flex gap-2 mb-6">
                {([3, 4, 5, 6] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => applyPreset(n)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${
                      selectedDays.size === n
                        ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {n} días
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {DAYS.map(({ key, short }) => {
                  const active = selectedDays.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={`aspect-square rounded-2xl font-bold text-sm transition-all active:scale-95 ${
                        active
                          ? 'bg-lime-500 text-zinc-900 shadow-[0_0_16px_rgba(132,204,22,0.4)]'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-600'
                      }`}
                    >
                      {short}
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-sm text-zinc-500">
                <Calendar className="w-4 h-4 inline mr-1 -mt-0.5" />
                {selectedDays.size} día{selectedDays.size !== 1 ? 's' : ''} seleccionado{selectedDays.size !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Step 3: Body */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-3 flex items-center gap-1">
                  <Shield className="w-4 h-4" /> Lesiones o molestias
                </p>
                <div className="flex flex-wrap gap-2">
                  {INJURY_OPTIONS.map((injury) => (
                    <button
                      key={injury}
                      type="button"
                      onClick={() =>
                        setInjuries((prev) =>
                          prev.includes(injury) ? prev.filter((i) => i !== injury) : [...prev, injury],
                        )
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                        injuries.includes(injury)
                          ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {injury}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setInjuries([])}
                  className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Ninguna →
                </button>
              </div>

              <div>
                <p className="text-xs font-medium text-zinc-400 mb-3">Área de enfoque (opcional)</p>
                <div className="grid grid-cols-2 gap-2">
                  {FOCUS_OPTIONS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFocusArea(f.value)}
                      className={`py-3 px-3 rounded-xl text-sm font-medium border transition ${
                        focusArea === f.value
                          ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Biometrics */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nombre</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-lime-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Edad</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="28"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-lime-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Peso (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="75"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-lime-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Estatura (cm)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="175"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-lime-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Género</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-3 rounded-xl text-sm font-medium border transition ${
                        gender === g
                          ? 'bg-lime-500/20 border-lime-500 text-lime-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="p-4 pb-8 border-t border-zinc-900 bg-zinc-950/90 backdrop-blur">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue()}
            className="w-full bg-lime-500 hover:bg-lime-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 font-bold text-lg py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            {step === TOTAL_STEPS - 1 ? (isEditMode ? 'Guardar cambios' : 'Crear mi plan') : 'Continuar'}
            {step < TOTAL_STEPS - 1 && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
