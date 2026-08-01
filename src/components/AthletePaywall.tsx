import { useState, type FC } from 'react';
import type { User } from 'firebase/auth';
import { ArrowRight, Loader2 } from 'lucide-react';
import { createAthleteSubscription } from '../api/billing';

type Props = {
  user: User;
  trialEndsAt?: string | null;
  amountMxn?: number;
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

/**
 * Full-screen paywall for independent athletes after the 14-day trial.
 */
const AthletePaywall: FC<Props> = ({ user, trialEndsAt, amountMxn = 249 }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endedLabel = formatDate(trialEndsAt);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const result = await createAthleteSubscription(token);
      if (result.alreadyActive) {
        window.location.reload();
        return;
      }
      if (!result.initPoint) {
        throw new Error('No se recibió el enlace de Mercado Pago');
      }
      window.location.href = result.initPoint;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo abrir Mercado Pago. Inténtalo de nuevo.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md">
        <p className="text-[10px] uppercase tracking-[0.25em] text-lime-500/80 mb-3 text-center">
          Suscripción
        </p>
        <h1
          className="text-3xl font-bold text-center leading-tight mb-3"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          Tu prueba gratis terminó
        </h1>
        <p className="text-zinc-400 text-center text-sm leading-relaxed mb-8">
          {endedLabel
            ? `El acceso gratuito venció el ${endedLabel}. `
            : 'El acceso gratuito de 14 días ya venció. '}
          Suscríbete con Mercado Pago para seguir entrenando con FitGen.
        </p>

        <div className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 ring-1 ring-white/5">
          <div className="flex items-baseline justify-center gap-2 mb-1">
            <span
              className="text-5xl font-extrabold tabular-nums tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              ${amountMxn}
            </span>
            <span className="text-zinc-500 text-sm font-medium">MXN / mes</span>
          </div>
          <p className="text-center text-zinc-400 text-sm mb-6">Cancela cuando quieras</p>

          <ul className="space-y-2 text-sm text-zinc-300 mb-8">
            {[
              'Plan adaptativo según cómo llegas al gym',
              'Arena, progreso y avatar',
              'Sesiones y mesociclos sin límite',
            ].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-lime-400 shrink-0">✓</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-sm text-red-400 mb-4 text-center leading-relaxed">{error}</p>
          )}

          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:opacity-60 text-zinc-950 font-extrabold transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Abriendo Mercado Pago…
              </>
            ) : (
              <>
                Pagar con Mercado Pago
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6 leading-relaxed">
          Si te invita un coach, usa tu enlace /join/… — este cobro es solo para atletas independientes.
        </p>
      </div>
    </div>
  );
};

export default AthletePaywall;
