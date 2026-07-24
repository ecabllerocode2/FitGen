import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Copy, Check } from 'lucide-react';
import { createCoachInvite } from '../../api/coach';
import CoachShell from './CoachShell';
import PaywallModal from './PaywallModal';

interface CoachInvitePageProps {
  user: User;
}

export default function CoachInvitePage({ user }: CoachInvitePageProps) {
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const fullUrl = joinUrl ? `${window.location.origin}${joinUrl}` : null;

  const handleCreate = async () => {
    setError(null);
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const result = await createCoachInvite(token);
      setJoinUrl(result.invite.joinPath);
    } catch (err) {
      const e = err as Error & { requiresPremium?: boolean };
      if (e.requiresPremium) {
        setShowPaywall(true);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!fullUrl) return;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CoachShell title="Invitar cliente">
      <p className="text-sm text-zinc-400 mb-6">
        Genera un enlace único. Tu cliente se registra con datos personales; tú completas la configuración técnica.
      </p>

      {!joinUrl ? (
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={loading}
          className="w-full rounded-xl bg-lime-500 text-zinc-900 font-semibold py-4 hover:bg-lime-400 disabled:opacity-50"
        >
          {loading ? 'Generando…' : 'Generar enlace de invitación'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 break-all text-sm text-zinc-300">
            {fullUrl}
          </div>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-700 py-3 text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : 'Copiar enlace'}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} plan="free" />
    </CoachShell>
  );
}
