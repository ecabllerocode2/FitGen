import { useState, useMemo, useEffect } from 'react';
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
  { value: 'Ganancia Muscular', label: 'Ganancia muscular' },
  { value: 'Pérdida de Grasa', label: 'Pérdida de grasa' },
  { value: 'Fuerza Máxima', label: 'Fuerza máxima' },
  { value: 'Resistencia', label: 'Resistencia / fitness general' },
];

const STEPS = [
  { eyebrow: 'Dificultad', title: '¿Cómo fue el bloque?', body: 'Promedio de las últimas 4 semanas.' },
  { eyebrow: 'Molestias', title: '¿Alguna limitación?', body: 'Dolor que te obligó a cambiar ejercicios.' },
  { eyebrow: 'Objetivo', title: '¿Cambiar enfoque?', body: 'Opcional — mantén el actual si quieres.' },
  { eyebrow: 'Notas', title: 'Algo más que debamos saber?', body: 'Opcional.' },
];

export default function MesocycleEvaluate({ user, profileData }: MesocycleEvaluateProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [difficultyScore, setDifficultyScore] = useState<number | null>(null);
  const [painAreas, setPainAreas] = useState<string[]>(['none']);
  const [nextGoalPreference, setNextGoalPreference] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'evaluating' | 'generating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [generateApiDone, setGenerateApiDone] = useState(false);
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

  const isBusy = useMemo(() => status === 'evaluating' || status === 'generating', [status]);
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  useEffect(() => {
    if (status !== 'generating' || !generateApiDone || !loaderSequenceDone) return;
    setStatus('success');
  }, [status, generateApiDone, loaderSequenceDone]);

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

    const painPayload = painAreas.includes('none') ? [] : painAreas;
    const token = await user.getIdToken();

    try {
      setGenerateApiDone(false);
      setLoaderSequenceDone(false);
      setStatus('evaluating');

      const evaluationResponse = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_EVALUATE, token, {
        method: 'POST',
        body: JSON.stringify({
          difficultyScore,
          painAreas: painPayload,
          nextGoalPreference,
          notes,
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

      setStatus('generating');
      setLoaderSequenceDone(false);
      const generationResponse = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_GENERATE, token, {
        method: 'POST',
      });

      if (!generationResponse.ok) {
        let errorMessage = 'Fallo al generar el nuevo mesociclo.';
        try {
          const errorData = await generationResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `Error del servidor. Código: ${generationResponse.status}.`;
        }
        throw new Error(errorMessage);
      }

      setGenerateApiDone(true);
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
        title={status === 'evaluating' ? 'Evaluando tu mesociclo' : 'Generando tu próximo bloque'}
        subtitle={
          status === 'evaluating'
            ? 'Analizando dificultad, molestias y progreso del ciclo anterior…'
            : 'Aplicando los ajustes de volumen a tu nuevo mesociclo…'
        }
        profile={loaderProfile}
        phase={status === 'evaluating' ? 'saving' : 'generating'}
        evaluationMode={status === 'generating'}
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
              body="Tu plan ya incluye los ajustes de volumen según tu feedback."
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

          {step === 3 && (
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
