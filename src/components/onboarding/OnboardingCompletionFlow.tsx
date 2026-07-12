import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { API_ENDPOINTS, authenticatedFetch } from '../../config/api';
import { getMesocyclePreviewSessions, normalizeMesocycleForUI } from '../../utils/mesocycleNormalizer';
import {
  finishOnboardingCompletion,
  patchOnboardingCompletion,
  readOnboardingCompletion,
} from '../../utils/onboardingCompletion';
import { waitMs } from '../../utils/onboardingFlowLock';
import {
  MIN_ONBOARDING_FLOW_MS,
  MIN_SAVING_DISPLAY_MS,
} from '../../utils/splitGenerationContext';
import MesocycleGenerationLoader from '../MesocycleGenerationLoader';

interface OnboardingCompletionFlowProps {
  user: User;
}

export default function OnboardingCompletionFlow({ user }: OnboardingCompletionFlowProps) {
  const navigate = useNavigate();
  const [, bump] = useState(0);

  useEffect(() => {
    const sync = () => bump((n) => n + 1);
    window.addEventListener('fitgen-onboarding-flow', sync);
    return () => window.removeEventListener('fitgen-onboarding-flow', sync);
  }, []);

  const completion = readOnboardingCompletion();

  useEffect(() => {
    if (!completion || completion.profileSaved || completion.saveInFlight || completion.error) {
      return;
    }

    patchOnboardingCompletion({ saveInFlight: true });

    const run = async () => {
      try {
        const idToken = await user.getIdToken();
        const saveRes = await authenticatedFetch(API_ENDPOINTS.USER_PROFILE_SAVE, idToken, {
          method: 'POST',
          body: JSON.stringify(completion.savePayload),
        });

        const saveText = await saveRes.text();
        const saveData = saveText ? JSON.parse(saveText) : null;
        if (!saveRes.ok) {
          throw new Error(saveData?.error || saveData?.message || 'Error al guardar perfil');
        }

        const savingElapsed = Date.now() - completion.startedAt;
        if (savingElapsed < MIN_SAVING_DISPLAY_MS) {
          await waitMs(MIN_SAVING_DISPLAY_MS - savingElapsed);
        }

        patchOnboardingCompletion({ profileSaved: true, saveInFlight: false, phase: 'generating' });

        await user.getIdToken(true);

        const mesoRes = await authenticatedFetch(API_ENDPOINTS.MESOCYCLE_GENERATE, idToken, {
          method: 'POST',
        });

        const mesoText = await mesoRes.text();
        const mesoData = mesoText ? JSON.parse(mesoText) : null;
        if (!mesoRes.ok || !mesoData?.success) {
          throw new Error(mesoData?.error || 'Error al generar mesociclo');
        }

        const normalized = normalizeMesocycleForUI(mesoData.mesocycle ?? mesoData.plan);
        patchOnboardingCompletion({
          mesocycleReady: true,
          generatedMesocycle: normalized,
        });
      } catch (err) {
        patchOnboardingCompletion({ error: (err as Error).message, saveInFlight: false });
      }
    };

    void run();
  }, [completion?.saveInFlight, completion?.profileSaved, completion?.error, user]);

  useEffect(() => {
    if (!completion || completion.phase !== 'generating') return;
    if (!completion.mesocycleReady || !completion.loaderSequenceDone) return;

    const goToPreview = async () => {
      const elapsed = Date.now() - completion.startedAt;
      if (elapsed < MIN_ONBOARDING_FLOW_MS) {
        await waitMs(MIN_ONBOARDING_FLOW_MS - elapsed);
      }
      patchOnboardingCompletion({ phase: 'preview' });
    };

    void goToPreview();
  }, [
    completion?.phase,
    completion?.mesocycleReady,
    completion?.loaderSequenceDone,
    completion?.startedAt,
  ]);

  const handleStart = async () => {
    finishOnboardingCompletion();
    await user.getIdToken(true);
    navigate('/', { replace: true });
  };

  if (!completion) {
    return null;
  }

  if (completion.error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-red-400 mb-4">{completion.error}</p>
        <button
          type="button"
          onClick={() => {
            finishOnboardingCompletion();
            window.location.reload();
          }}
          className="bg-lime-500 text-zinc-900 font-bold px-6 py-3 rounded-xl"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (completion.phase === 'preview' && completion.generatedMesocycle) {
    const meso = completion.generatedMesocycle as Record<string, unknown>;
    const sessions = getMesocyclePreviewSessions(completion.generatedMesocycle);
    const duration =
      (meso.durationWeeks as number | undefined) ??
      ((meso.mesocyclePlan as { durationWeeks?: number } | undefined)?.durationWeeks);
    const split = (meso.splitType as string | undefined) ?? 'Personalizado';
    const profile = completion.generationProfile;

    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8 text-lime-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">¡Tu plan está listo!</h1>
          <p className="text-zinc-400 text-sm mb-8 max-w-xs">
            Mesociclo de {duration} semanas · {profile.experienceLevel} · {profile.fitnessGoal}
          </p>

          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left mb-6">
            <p className="text-xs font-bold text-lime-400 uppercase tracking-wider mb-3">
              Split: {split}
            </p>
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
            className="w-full max-w-sm mx-auto block bg-lime-500 text-zinc-900 font-bold py-4 rounded-xl hover:bg-lime-400 transition"
          >
            Empezar entrenamiento
          </button>
        </div>
      </div>
    );
  }

  const loaderPhase = completion.phase === 'saving' ? 'saving' : 'generating';

  return (
    <MesocycleGenerationLoader
      phase={loaderPhase}
      profile={completion.generationProfile}
      onSequenceComplete={
        loaderPhase === 'generating'
          ? () => patchOnboardingCompletion({ loaderSequenceDone: true })
          : undefined
      }
    />
  );
}
