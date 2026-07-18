import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import MesocycleGenerationLoader from './MesocycleGenerationLoader';
import LevelUpCelebration from './LevelUpCelebration';
import AchievementUnlockModal from './gamification/AchievementUnlockModal';
import type { GamificationAchievementUnlock } from '../types/gamification';
import type { MesocycleGenerationProfile } from '../utils/splitGenerationContext';
import {
  AppBackButton,
  AppEyebrow,
  AppFixedFooter,
  AppHero,
  AppOptionButton,
  AppPrimaryButton,
  AppProgress,
  AppScaleRow,
  AppShell,
} from './ui/AppPrimitives';

interface Option {
  value: string | number;
  label: string;
}

interface PainOption extends Option {
  value: string;
}

interface MesocycleEvaluateProps {
  user: User;
  profileData?: Record<string, unknown>;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Muy fácil — pude hacer más',
  2: 'Fácil — cómodo',
  3: 'Justo — el punto ideal',
  4: 'Difícil — cerca del fallo',
  5: 'Extremo — demasiado, me agoté',
};

const PAIN_OPTIONS: PainOption[] = [
  { value: 'none', label: 'Ninguna' },
  { value: 'knees', label: 'Rodillas' },
  { value: 'shoulders', label: 'Hombros' },
  { value: 'lower_back', label: 'Espalda baja' },
  { value: 'elbows', label: 'Codos' },
];

const NEXT_GOAL_OPTIONS: Option[] = [
  { value: 'body:Ganar_Musculo', label: 'Ganar músculo' },
  { value: 'body:Perder_Grasa', label: 'Perder grasa' },
  { value: 'fitness:Fuerza', label: 'Fuerza máxima' },
  { value: 'fitness:Hipertrofia', label: 'Hipertrofia (volumen)' },
];

const STEPS = [
  { eyebrow: 'Dificultad', title: '¿Cómo fue el bloque?', body: 'Promedio de las últimas 4 semanas.' },
  { eyebrow: 'Molestias', title: '¿Alguna limitación?', body: 'Dolor que te obligó a cambiar ejercicios.' },
  { eyebrow: 'Medidas', title: 'Check-in completo', body: 'Peso obligatorio. Cintura y otras medidas opcionales.' },
  { eyebrow: 'Objetivo', title: '¿Cambiar enfoque?', body: 'Opcional — mantén el actual si quieres.' },
  { eyebrow: 'Notas', title: 'Algo más que debamos saber?', body: 'Opcional.' },
];

export default function MesocycleEvaluate({ user, profileData }: MesocycleEvaluateProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [difficultyScore, setDifficultyScore] = useState<number | null>(null);
  const [painAreas, setPainAreas] = useState<string[]>(['none']);
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [hipCm, setHipCm] = useState('');
  const [armCm, setArmCm] = useState('');
  const [thighCm, setThighCm] = useState('');
  const [nextGoalPreference, setNextGoalPreference] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'evaluating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loaderSequenceDone, setLoaderSequenceDone] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{
    celebrationTitle: string;
    celebrationMessage: string;
    newLevel: string;
    previousLevel: string;
  } | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [achievementUnlocks, setAchievementUnlocks] = useState<GamificationAchievementUnlock[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);

  const isBusy = status === 'evaluating';
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  useEffect(() => {
    const initial =
      (profileData?.currentWeightKg as number | undefined) ??
      (profileData?.initialWeight as number | undefined);
    if (initial != null) setWeightKg(String(initial));
  }, [profileData]);

  useEffect(() => {
    if (status !== 'evaluating' || !loaderSequenceDone) return;
    setStatus('success');
  }, [status, loaderSequenceDone]);

  const handlePainSelect = (value: string) => {
    setPainAreas((prevAreas) => {
      if (value === 'none') return ['none'];
      const areasWithoutNone = prevAreas.filter((p) => p !== 'none');
      if (areasWithoutNone.includes(value)) {
        const newAreas = areasWithoutNone.filter((p) => p !== value);
        return newAreas.length === 0 ? ['none'] : newAreas;
      }
      return [...areasWithoutNone, value];
    });
  };

  const handleSubmit = async () => {
    setError(null);
    if (difficultyScore === null) {
      setError('Selecciona una dificultad para continuar.');
      setStep(0);
      return;
    }

    const weight = parseFloat(weightKg);
    if (!Number.isFinite(weight) || weight < 30) {
      setError('Ingresa tu peso actual (kg) en el paso de medidas.');
      setStep(2);
      return;
    }

    const painPayload = painAreas.includes('none') ? [] : painAreas;
    const token = await user.getIdToken();

    try {
      setLoaderSequenceDone(false);
      setStatus('evaluating');

      const evaluationResponse = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_EVALUATE, token, {
        method: 'POST',
        body: JSON.stringify({
          difficultyScore,
          painAreas: painPayload,
          nextGoalPreference,
          notes,
          bodyMetrics: {
            weightKg: weight,
            waistCm: waistCm ? parseFloat(waistCm) : null,
            hipCm: hipCm ? parseFloat(hipCm) : null,
            armCm: armCm ? parseFloat(armCm) : null,
            thighCm: thighCm ? parseFloat(thighCm) : null,
          },
        }),
      });

      if (!evaluationResponse.ok) {
        let errorMessage = 'Fallo al procesar la evaluación.';
        try {
          const errorData = await evaluationResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Error del servidor. Código: ${evaluationResponse.status}.`;
        }
        throw new Error(errorMessage);
      }

      const evaluationData = await evaluationResponse.json();
      if (evaluationData.gamificationDelta?.newAchievements?.length) {
        setAchievementUnlocks(evaluationData.gamificationDelta.newAchievements);
        setShowAchievementModal(true);
      }
      if (evaluationData.levelUpgrade?.shouldShowCelebration) {
        setLevelUpData(evaluationData.levelUpgrade);
        setShowLevelUpModal(true);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError((err as Error).message || 'Ocurrió un error inesperado.');
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 0 && difficultyScore === null) {
      setError('Selecciona una dificultad.');
      return;
    }
    if (step === 2) {
      const weight = parseFloat(weightKg);
      if (!Number.isFinite(weight) || weight < 30) {
        setError('Ingresa tu peso actual (kg).');
        return;
      }
    }
    if (isLast) void handleSubmit();
    else setStep((s) => s + 1);
  };

  if (isBusy) {
    const loaderProfile: MesocycleGenerationProfile = {
      fitnessGoal: (profileData?.fitnessGoal as string) ?? 'Hipertrofia',
      trainingAgeMonths: profileData?.trainingAgeMonths as number | undefined,
      experienceLevel: profileData?.experienceLevel as MesocycleGenerationProfile['experienceLevel'],
      trainingDaysPerWeek: profileData?.trainingDaysPerWeek as number | undefined,
      weeklyScheduleContext: profileData?.weeklyScheduleContext as MesocycleGenerationProfile['weeklyScheduleContext'],
      injuriesOrLimitations: profileData?.injuriesOrLimitations as string[] | undefined,
    };

    return (
      <MesocycleGenerationLoader
        title="Evaluando tu mesociclo"
        subtitle="Analizando dificultad, medidas y progreso del ciclo anterior…"
        profile={loaderProfile}
        phase="generating"
        evaluationMode
        onSequenceComplete={() => setLoaderSequenceDone(true)}
      />
    );
  }

  if (status === 'success') {
    return (
      <>
        <AppShell>
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <AppHero
              eyebrow="Mesociclo"
              title="¡Nuevo bloque listo!"
              body="Tu plan ya incluye los ajustes de volumen según tu feedback y medidas."
            />
          </div>
          <AppFixedFooter>
            <AppPrimaryButton onClick={() => navigate('/')}>Ir al dashboard</AppPrimaryButton>
          </AppFixedFooter>
        </AppShell>

        {showLevelUpModal && levelUpData && (
          <LevelUpCelebration
            isOpen={showLevelUpModal}
            onClose={() => setShowLevelUpModal(false)}
            data={{
              celebrationTitle: levelUpData.celebrationTitle,
              celebrationMessage: levelUpData.celebrationMessage,
              newLevel: levelUpData.newLevel,
              previousLevel: levelUpData.previousLevel,
            }}
          />
        )}
        <AchievementUnlockModal
          achievements={achievementUnlocks}
          open={showAchievementModal}
          onClose={() => setShowAchievementModal(false)}
        />
      </>
    );
  }

  const current = STEPS[step];

  return (
    <AppShell>
      <div className="px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <AppBackButton onClick={() => (step > 0 ? setStep((s) => s - 1) : navigate('/'))} />
            <span className="text-[10px] text-zinc-600 tabular-nums">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <AppProgress value={progress} label="Evaluación" />
        </div>
      </div>

      <div className="flex-1 px-6 overflow-y-auto pb-32">
        <div className="max-w-sm mx-auto">
          <AppEyebrow>{current.eyebrow}</AppEyebrow>
          <h1 className="text-2xl font-bold text-white mt-4 mb-2 leading-tight">{current.title}</h1>
          <p className="text-[15px] text-zinc-500 mb-8">{current.body}</p>

          {error ? (
            <div className="mb-6 flex items-start gap-2 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          {step === 0 && (
            <AppScaleRow
              value={difficultyScore ?? 0}
              onChange={(v) => setDifficultyScore(v)}
              labels={DIFFICULTY_LABELS}
            />
          )}

          {step === 1 && (
            <div className="grid grid-cols-2 gap-2">
              {PAIN_OPTIONS.map((option) => (
                <AppOptionButton
                  key={option.value}
                  selected={painAreas.includes(option.value)}
                  onClick={() => handlePainSelect(option.value)}
                  compact
                >
                  <span className="text-sm font-medium">{option.label}</span>
                </AppOptionButton>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-zinc-400">Peso (kg) *</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-lime-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-zinc-400">Cintura (cm)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white focus:border-lime-500 focus:outline-none"
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Cadera', value: hipCm, set: setHipCm },
                  { label: 'Brazo', value: armCm, set: setArmCm },
                  { label: 'Muslo', value: thighCm, set: setThighCm },
                ].map((field) => (
                  <label key={field.label} className="block">
                    <span className="text-[10px] text-zinc-500">{field.label}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm text-white focus:border-lime-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              <AppOptionButton selected={nextGoalPreference === ''} onClick={() => setNextGoalPreference('')}>
                <span className="text-sm">Mantener mi objetivo actual</span>
              </AppOptionButton>
              {NEXT_GOAL_OPTIONS.map((option) => (
                <AppOptionButton
                  key={option.value}
                  selected={nextGoalPreference === String(option.value)}
                  onClick={() => setNextGoalPreference(String(option.value))}
                >
                  <span className="text-sm">{option.label}</span>
                </AppOptionButton>
              ))}
            </div>
          )}

          {step === 4 && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 text-white p-4 rounded-xl resize-none focus:border-lime-500/50 focus:outline-none text-[15px] leading-relaxed"
              placeholder="Observaciones, sensaciones, cambios de vida…"
            />
          )}
        </div>
      </div>

      <AppFixedFooter>
        <AppPrimaryButton onClick={handleNext}>
          {isLast ? 'Finalizar y generar plan' : 'Continuar'}
        </AppPrimaryButton>
      </AppFixedFooter>
    </AppShell>
  );
}
