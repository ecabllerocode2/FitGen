import { useState } from 'react';
import { X } from 'lucide-react';
import { AppPrimaryButton } from './ui/AppPrimitives';

export type SwapReason = 'unavailable' | 'preference';

interface ExerciseSwapReasonModalProps {
  open: boolean;
  exerciseName: string;
  equipmentTags?: string[];
  showContinuityOption?: boolean;
  onClose: () => void;
  onConfirm: (reason: SwapReason, excludeEquipment: boolean, useAsContinuity: boolean) => void;
  loading?: boolean;
}

export default function ExerciseSwapReasonModal({
  open,
  exerciseName,
  equipmentTags = [],
  showContinuityOption = false,
  onClose,
  onConfirm,
  loading = false,
}: ExerciseSwapReasonModalProps) {
  const [reason, setReason] = useState<SwapReason>('preference');
  const [excludeEquipment, setExcludeEquipment] = useState(true);
  const [useAsContinuity, setUseAsContinuity] = useState(true);

  if (!open) return null;

  const hasEquipment = equipmentTags.length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/70">
      <div
        className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-zinc-800">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-600">Cambiar ejercicio</p>
            <h2 className="text-lg font-semibold text-white mt-1 leading-snug">{exerciseName}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-1 text-zinc-500 hover:text-zinc-200 rounded-full"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700">
            <input
              type="radio"
              name="swap-reason"
              checked={reason === 'unavailable'}
              onChange={() => setReason('unavailable')}
              className="mt-1 accent-lime-500"
            />
            <span>
              <span className="block text-sm font-medium text-white">No está en mi gimnasio</span>
              <span className="block text-xs text-zinc-500 mt-0.5">
                No volver a sugerirlo en futuras sesiones
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800 cursor-pointer hover:border-zinc-700">
            <input
              type="radio"
              name="swap-reason"
              checked={reason === 'preference'}
              onChange={() => setReason('preference')}
              className="mt-1 accent-lime-500"
            />
            <span>
              <span className="block text-sm font-medium text-white">Prefiero otro ejercicio</span>
              <span className="block text-xs text-zinc-500 mt-0.5">Cambiar por uno equivalente</span>
            </span>
          </label>

          {showContinuityOption && (
            <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={useAsContinuity}
                onChange={(e) => setUseAsContinuity(e.target.checked)}
                className="mt-0.5 accent-lime-500"
              />
              <span className="text-xs text-zinc-400 leading-relaxed">
                <span className="block text-sm font-medium text-zinc-200 mb-0.5">
                  Usar este ejercicio en continuidad
                </span>
                Las próximas sesiones de este foco usarán el nuevo ejercicio en lugar del original.
              </span>
            </label>
          )}

          {reason === 'unavailable' && hasEquipment && (
            <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeEquipment}
                onChange={(e) => setExcludeEquipment(e.target.checked)}
                className="mt-0.5 accent-lime-500"
              />
              <span className="text-xs text-zinc-400 leading-relaxed">
                Excluir también ejercicios que usen:{' '}
                <span className="text-zinc-200">{equipmentTags.join(', ')}</span>
              </span>
            </label>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-zinc-400 hover:text-white"
          >
            Cancelar
          </button>
          <AppPrimaryButton
            type="button"
            disabled={loading}
            onClick={() => onConfirm(reason, excludeEquipment, useAsContinuity)}
          >
            {loading ? 'Buscando…' : 'Confirmar cambio'}
          </AppPrimaryButton>
        </div>
      </div>
    </div>
  );
}
