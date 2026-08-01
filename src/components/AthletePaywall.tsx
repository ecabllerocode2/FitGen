import { useEffect, useState, type FC } from 'react';
import type { User } from 'firebase/auth';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  createAthleteSubscription,
  syncAthleteSubscription,
  validateBillingCoupon,
} from '../api/billing';

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
  const [syncing, setSyncing] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payerEmail, setPayerEmail] = useState(user.email ?? '');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    amountMxn: number;
    remaining?: number;
  } | null>(null);
  const endedLabel = formatDate(trialEndsAt);

  const displayAmount = appliedCoupon?.amountMxn ?? amountMxn;
  const hasDiscount = Boolean(appliedCoupon && appliedCoupon.amountMxn < amountMxn);

  const syncAfterReturn = async () => {
    setSyncing(true);
    setLoading(false);
    setError(null);
    try {
      const token = await user.getIdToken();
      const result = await syncAthleteSubscription(token);
      if (result.allowed || result.alreadyActive || result.subscriptionStatus === 'active') {
        window.location.replace('/');
        return;
      }
    } catch (err) {
      console.error('billing sync:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('billing') === 'return') {
      void syncAfterReturn();
    }

    const onPageShow = (event: PageTransitionEvent) => {
      // bfcache restore after Mercado Pago — never keep the button stuck loading
      if (event.persisted) setLoading(false);
      if (params.get('billing') === 'return') void syncAfterReturn();
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.uid]);

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setAppliedCoupon(null);
      setError('Escribe un código de cupón.');
      return;
    }

    setValidatingCoupon(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const result = await validateBillingCoupon(token, code);
      if (!result.valid || !result.amountMxn || !result.code) {
        setAppliedCoupon(null);
        setError(result.error ?? 'Cupón no válido');
        return;
      }
      setAppliedCoupon({
        code: result.code,
        amountMxn: result.amountMxn,
        remaining: result.remaining,
      });
      setCouponInput(result.code);
    } catch (err) {
      setAppliedCoupon(null);
      setError(err instanceof Error ? err.message : 'No se pudo validar el cupón');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setError(null);
  };

  const startCheckout = async () => {
    const email = payerEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Escribe el email con el que vas a pagar en Mercado Pago.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const result = await createAthleteSubscription(token, {
        payerEmail: email,
        couponCode: appliedCoupon?.code || couponInput.trim() || undefined,
      });
      if (result.alreadyActive) {
        window.location.replace('/');
        return;
      }
      if (!result.initPoint) {
        throw new Error('No se recibió el enlace de Mercado Pago');
      }
      window.location.assign(result.initPoint);
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
            {hasDiscount ? (
              <span className="text-2xl font-semibold text-zinc-500 line-through tabular-nums">
                ${amountMxn}
              </span>
            ) : null}
            <span
              className="text-5xl font-extrabold tabular-nums tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              ${displayAmount}
            </span>
            <span className="text-zinc-500 text-sm font-medium">MXN / mes</span>
          </div>
          <p className="text-center text-zinc-400 text-sm mb-6">
            {hasDiscount
              ? `Cupón ${appliedCoupon?.code} aplicado · precio especial mientras tu suscripción esté activa`
              : 'Cancela cuando quieras'}
          </p>

          <ul className="space-y-2 text-sm text-zinc-300 mb-6">
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

          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Email de Mercado Pago
          </label>
          <input
            type="email"
            value={payerEmail}
            onChange={(e) => setPayerEmail(e.target.value)}
            autoComplete="email"
            placeholder="el email con el que pagas en MP"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white placeholder:text-zinc-600 mb-2 focus:outline-none focus:border-lime-500"
          />
          <p className="text-[11px] text-zinc-500 leading-relaxed mb-5">
            Debe ser exactamente el mismo email con el que inicias sesión o pagas en Mercado Pago.
            Si no coincide, MP rechaza el cobro.
          </p>

          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
            Código de cupón <span className="normal-case tracking-normal font-normal">(opcional)</span>
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                if (appliedCoupon) setAppliedCoupon(null);
              }}
              placeholder="Ej. FITGEN125"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-lime-500 uppercase tracking-wide"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={clearCoupon}
                disabled={loading || syncing}
                className="shrink-0 px-3 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:border-zinc-500 disabled:opacity-60"
              >
                Quitar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void applyCoupon()}
                disabled={loading || syncing || validatingCoupon || !couponInput.trim()}
                className="shrink-0 px-3 rounded-xl border border-lime-500/40 text-sm font-semibold text-lime-400 hover:bg-lime-500/10 disabled:opacity-60"
              >
                {validatingCoupon ? '…' : 'Aplicar'}
              </button>
            )}
          </div>
          {appliedCoupon?.remaining != null ? (
            <p className="text-[11px] text-lime-500/80 mb-5">
              Cupón válido · quedan {appliedCoupon.remaining} usos
            </p>
          ) : (
            <p className="text-[11px] text-zinc-600 mb-5">Si tienes un código, aplícalo antes de pagar.</p>
          )}

          {syncing && (
            <p className="text-sm text-lime-400 mb-4 text-center">Confirmando tu pago con Mercado Pago…</p>
          )}

          {error && (
            <p className="text-sm text-red-400 mb-4 text-center leading-relaxed">{error}</p>
          )}

          <button
            type="button"
            onClick={startCheckout}
            disabled={loading || syncing}
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:opacity-60 text-zinc-950 font-extrabold transition"
          >
            {loading || syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {syncing ? 'Confirmando pago…' : 'Abriendo Mercado Pago…'}
              </>
            ) : (
              <>
                Pagar con Mercado Pago
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => void syncAfterReturn()}
            disabled={loading || syncing}
            className="mt-3 w-full rounded-xl border border-zinc-700 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-500 transition disabled:opacity-60"
          >
            Ya pagué — actualizar acceso
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
