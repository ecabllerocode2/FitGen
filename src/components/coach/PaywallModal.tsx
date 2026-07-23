interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  plan: string;
}

export default function PaywallModal({ open, onClose, plan }: PaywallModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-lime-500/80">Premium</p>
        <h2 className="text-xl font-bold mt-2">Más clientes, más impacto</h2>
        <p className="text-sm text-zinc-400 mt-3">
          Tu plan {plan === 'free' ? 'gratuito' : 'actual'} incluye hasta 3 asientos lifetime.
          Premium desbloquea hasta 50 clientes, branding en tarjetas compartibles y alertas completas.
        </p>
        <p className="text-xs text-zinc-500 mt-4">
          La pasarela de pago llegará pronto. Mientras tanto, contáctanos para activar Premium manualmente.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-zinc-800 py-3 text-sm font-medium text-zinc-200"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
