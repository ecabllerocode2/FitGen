import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { acceptJoinInvite, lookupJoinInvite } from '../../api/coach';
import { parseJoinTokenFromPath } from '../../utils/joinInvite';
import { AppFixedFooter, AppHero, AppPrimaryButton, AppShell } from '../ui/AppPrimitives';
import AvatarStartingBuildPicker from '../avatar/AvatarStartingBuildPicker';
import type { AvatarStartingBuild } from '@fitgen/visual';
import { saveAvatarStartingBuild } from '../../utils/avatarAppearanceStorage';

interface JoinOnboardingProps {
  user: User;
}

const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro'] as const;
const INJURY_OPTIONS = ['Hombro', 'Rodilla', 'Espalda Baja', 'Muñeca'] as const;

export default function JoinOnboarding({ user }: JoinOnboardingProps) {
  const { token: routeToken } = useParams<{ token: string }>();
  const location = useLocation();
  const token = routeToken ?? parseJoinTokenFromPath(location.pathname);
  const navigate = useNavigate();
  const [coachName, setCoachName] = useState('');
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user.displayName ?? '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [injuries, setInjuries] = useState<string[]>([]);
  const [avatarStartingBuild, setAvatarStartingBuild] = useState<AvatarStartingBuild | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    void lookupJoinInvite(token)
      .then((data) => setCoachName(data.coach.publicName))
      .catch((err) => setError((err as Error).message));
  }, [token]);

  const canContinue = () => {
    if (step === 0) {
      return (
        name.trim() &&
        age &&
        parseInt(age) >= 13 &&
        gender &&
        weight &&
        height
      );
    }
    return avatarStartingBuild !== '';
  };

  const handleSubmit = async () => {
    if (!token) {
      setError('Enlace de invitación inválido. Pide un nuevo enlace a tu coach.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const idToken = await user.getIdToken();
      await acceptJoinInvite(idToken, token, {
        name: name.trim(),
        age: parseInt(age),
        gender,
        heightCm: parseInt(height),
        initialWeight: parseFloat(weight),
        currentWeightKg: parseFloat(weight),
        injuriesOrLimitations: injuries,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        avatarStartingBuild: avatarStartingBuild || undefined,
      });
      if (avatarStartingBuild) {
        saveAvatarStartingBuild(avatarStartingBuild, user.uid);
      }
      await user.getIdToken(true);
      navigate('/waiting-coach', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell className="h-[100dvh] overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-6 py-8 pb-32">
        <div className="max-w-sm mx-auto w-full">
        <AppHero
          eyebrow={coachName ? `Invitación de ${coachName}` : 'FitGen'}
          title={step === 0 ? 'Datos personales' : 'Tu avatar'}
          body={
            step === 0
              ? 'Solo lo básico. Tu coach completará objetivo, días y configuración técnica.'
              : 'Elige tu punto de partida visual.'
          }
        />

        {step === 0 && (
          <div className="space-y-4 mt-6">
            <input
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
              placeholder="Edad"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
            <select
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Género</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
              placeholder="Peso (kg)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <input
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3"
              placeholder="Estatura (cm)"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <div>
              <p className="text-xs text-zinc-500 mb-2">Lesiones que conozcas (opcional)</p>
              <div className="flex flex-wrap gap-2">
                {INJURY_OPTIONS.map((inj) => (
                  <button
                    key={inj}
                    type="button"
                    onClick={() =>
                      setInjuries((prev) =>
                        prev.includes(inj) ? prev.filter((i) => i !== inj) : [...prev, inj],
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs ${
                      injuries.includes(inj) ? 'bg-amber-500/10 text-amber-300' : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {inj}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-6">
            <AvatarStartingBuildPicker
              gender={gender === 'Femenino' ? 'female' : 'male'}
              value={avatarStartingBuild || null}
              onChange={setAvatarStartingBuild}
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
        </div>
      </div>

      <AppFixedFooter>
        {step < 1 ? (
          <AppPrimaryButton
            onClick={() => {
              if (!canContinue()) {
                setError('Completa todos los campos.');
                return;
              }
              setError(null);
              setStep(1);
            }}
          >
            Continuar
          </AppPrimaryButton>
        ) : (
          <AppPrimaryButton disabled={loading || !canContinue()} onClick={() => void handleSubmit()}>
            {loading ? 'Enviando…' : 'Unirme a mi coach'}
          </AppPrimaryButton>
        )}
      </AppFixedFooter>
    </AppShell>
  );
}
