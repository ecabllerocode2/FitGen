import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import {
  API_ENDPOINTS,
  authenticatedFetchWithRetry,
  humanizeFetchError,
} from '../../config/api';
import { getMesocyclePreviewSessions, normalizeMesocycleForUI } from '../../utils/mesocycleNormalizer';
import {
  finishOnboardingCompletion,
  patchOnboardingCompletion,
  readOnboardingCompletion,
  retryOnboardingCompletion,
} from '../../utils/onboardingCompletion';
import { waitMs } from '../../utils/onboardingFlowLock';
import {
  MIN_ONBOARDING_FLOW_MS,
  MIN_SAVING_DISPLAY_MS,
} from '../../utils/splitGenerationContext';
import MesocycleGenerationLoader from '../MesocycleGenerationLoader';
import {
  AppEyebrow,
  AppFixedFooter,
  AppHero,
  AppPrimaryButton,
  AppShell,
} from '../ui/AppPrimitives';

interface OnboardingCompletionFlowProps {
  user: User;
}

function parseJsonSafe(text: string): Record<string, unknown> | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
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

  // Save profile (if needed) then generate mesocycle. Retries must not require a full wizard redo.
  useEffect(() => {
    if (!completion || completion.saveInFlight || completion.error || completion.mesocycleReady) {
      return;
    }

    patchOnboardingCompletion({ saveInFlight: true });

    const run = async () => {
      try {
        let idToken = await user.getIdToken();

        if (!completion.profileSaved) {
          const saveRes = await authenticatedFetchWithRetry(
            API_ENDPOINTS.USER_PROFILE_SAVE,
            idToken,
            {
              method: 'POST',
              body: JSON.stringify(completion.savePayload),
            },
          );

          const saveText = await saveRes.text();
          const saveData = parseJsonSafe(saveText);
          if (!saveRes.ok) {
            throw new Error(
              (saveData?.error as string) ||
                (saveData?.message as string) ||
                'Error al guardar perfil',
            );
          }

          const savingElapsed = Date.now() - completion.startedAt;
          if (savingElapsed < MIN_SAVING_DISPLAY_MS) {
            await waitMs(MIN_SAVING_DISPLAY_MS - savingElapsed);
          }

          // Persist progress before mesocycle so a reload can resume without re-saving.
          patchOnboardingCompletion({ profileSaved: true, phase: 'generating' });
          idToken = await user.getIdToken(true);
        } else {
          idToken = await user.getIdToken(true);
        }

        const mesoRes = await authenticatedFetchWithRetry(
          API_ENDPOINTS.MESOCYCLE_GENERATE,
          idToken,
          { method: 'POST' },
        );

        const mesoText = await mesoRes.text();
        const mesoData = parseJsonSafe(mesoText);
        if (!mesoRes.ok || !mesoData?.success) {
          throw new Error((mesoData?.error as string) || 'Error al generar mesociclo');
        }

        const normalized = normalizeMesocycleForUI(mesoData.mesocycle ?? mesoData.plan);
        patchOnboardingCompletion({
          mesocycleReady: true,
          saveInFlight: false,
          generatedMesocycle: normalized,
        });
      } catch (err) {
        patchOnboardingCompletion({
          error: humanizeFetchError(err, 'Error al completar el registro'),
          saveInFlight: false,
        });
      }
    };

    void run();
  }, [
    completion?.saveInFlight,
    completion?.profileSaved,
    completion?.mesocycleReady,
    completion?.error,
    user,
  ]);

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
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <p className="text-red-400 mb-6 text-sm">{completion.error}</p>
          <AppPrimaryButton onClick={() => retryOnboardingCompletion()}>
            Reintentar
          </AppPrimaryButton>
        </div>
      </AppShell>
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
      <AppShell>
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <AppHero
            eyebrow="Tu plan"
            title="¡Listo para empezar!"
            body={`${duration} semanas · ${profile.experienceLevel} · ${profile.fitnessGoal}`}
            align="center"
          />

          <div className="w-full max-w-sm mt-10">
            <AppEyebrow>Split · {split}</AppEyebrow>
            <ul className="mt-4 space-y-0">
              {sessions.map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-4 py-3 border-b border-zinc-800/90 last:border-0 text-sm text-zinc-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-500 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <AppFixedFooter>
          <AppPrimaryButton onClick={() => void handleStart()}>Empezar entrenamiento</AppPrimaryButton>
        </AppFixedFooter>
      </AppShell>
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
