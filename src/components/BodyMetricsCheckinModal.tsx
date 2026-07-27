import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { submitBodyCheckin } from '../api/bodyMetrics';
import type { BodyMetricKind } from '../types/bodyMetrics';
import { AppPrimaryButton } from './ui/AppPrimitives';

interface BodyMetricsCheckinModalProps {
  open: boolean;
  authToken: string;
  kind?: BodyMetricKind;
  initialWeightKg?: number | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function BodyMetricsCheckinModal({
  open,
  authToken,
  kind = 'light',
  initialWeightKg,
  onClose,
  onSaved,
}: BodyMetricsCheckinModalProps) {
  const [weightKg, setWeightKg] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [hipCm, setHipCm] = useState('');
  const [armCm, setArmCm] = useState('');
  const [thighCm, setThighCm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setWeightKg(initialWeightKg != null ? String(initialWeightKg) : '');
    setWaistCm('');
    setHipCm('');
    setArmCm('');
    setThighCm('');
    setError(null);
  }, [open, initialWeightKg]);

  if (!open) return null;

  const isFull = kind === 'full';

  const handleSubmit = async () => {
    setError(null);
    const weight = parseFloat(weightKg);
    const waist = waistCm ? parseFloat(waistCm) : undefined;

    if (!Number.isFinite(weight) || weight < 30) {
      setError('Ingresa un peso válido (kg).');
      return;
    }
    if (!isFull && (!waist || !Number.isFinite(waist))) {
      setError('La cintura es obligatoria en el check-in quincenal.');
      return;
    }

    setSubmitting(true);
    try {
      await submitBodyCheckin(authToken, {
        weightKg: weight,
        waistCm: waist,
        hipCm: hipCm ? parseFloat(hipCm) : undefined,
        armCm: armCm ? parseFloat(armCm) : undefined,
        thighCm: thighCm ? parseFloat(thighCm) : undefined,
        kind,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-lime-500/80 font-semibold">
              {isFull ? 'Check-in completo' : 'Check-in quincenal'}
            </p>
            <h2 className="text-lg font-bold text-white mt-1">
              {isFull ? 'Peso y medidas' : 'Peso y cintura'}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {isFull
                ? 'Peso obligatorio. Cintura, cadera, brazo y muslo ayudan a ver progreso real entre bloques.'
                : 'Toma ~20 segundos. Puedes omitirlo y hacerlo después desde tu progreso.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-500 hover:text-zinc-200"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-zinc-400">Peso (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-lime-500 focus:outline-none"
              placeholder="75"
            />
          </label>

          <label className="block">
            <span className="text-xs text-zinc-400">
              Cintura (cm){!isFull ? ' *' : ' (opcional)'}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={waistCm}
              onChange={(e) => setWaistCm(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white focus:border-lime-500 focus:outline-none"
              placeholder="82"
            />
          </label>

          {isFull ? (
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'hipCm', label: 'Cadera', value: hipCm, set: setHipCm },
                { key: 'armCm', label: 'Brazo', value: armCm, set: setArmCm },
                { key: 'thighCm', label: 'Muslo', value: thighCm, set: setThighCm },
              ].map((field) => (
                <label key={field.key} className="block">
                  <span className="text-[10px] text-zinc-500">{field.label}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-sm text-white focus:border-lime-500 focus:outline-none"
                  />
                </label>
              ))}
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-5 flex flex-col gap-2">
          <AppPrimaryButton onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Guardando…' : 'Guardar check-in'}
          </AppPrimaryButton>
          <button
            type="button"
            onClick={onClose}
            className="py-2 text-sm text-zinc-500 hover:text-zinc-300"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
