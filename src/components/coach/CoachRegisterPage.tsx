import { useState } from 'react';
import type { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { registerCoach } from '../../api/coach';
import { AppPrimaryButton, AppShell } from '../ui/AppPrimitives';

interface CoachRegisterPageProps {
  user: User;
}

export default function CoachRegisterPage({ user }: CoachRegisterPageProps) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user.displayName ?? '');
  const [publicName, setPublicName] = useState(user.displayName ?? '');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await user.getIdToken();
      await registerCoach(token, { displayName: displayName.trim(), publicName: publicName.trim(), bio });
      await user.getIdToken(true);
      navigate('/coach', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80 mb-2">FitGen Coach</p>
        <h1 className="text-2xl font-bold mb-2">Configura tu perfil</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Supervisa clientes con el motor de FitGen. Tú defines la dirección; el sistema hace el trabajo técnico.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-zinc-400">Nombre para mostrar</span>
            <input
              className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-400">Nombre público (branding)</span>
            <input
              className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white"
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-400">Bio corta</span>
            <textarea
              className="mt-1 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white min-h-[80px]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <AppPrimaryButton type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Empezar como coach'}
          </AppPrimaryButton>
        </form>
      </div>
    </AppShell>
  );
}
