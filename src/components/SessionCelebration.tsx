import { useMemo, useRef, useState } from 'react';
import { Download, Share2, Sparkles } from 'lucide-react';
import { AppPrimaryButton, AppShell } from './ui/AppPrimitives';
import { downloadPngFromElement, sharePngFromElement } from '../utils/shareCard';

export interface SessionCelebrationData {
  sessionFocus: string;
  durationLabel: string;
  exerciseCount: number;
  totalSets: number;
  muscles?: string[];
}

const PHRASES = [
  'La constancia construye lo que la motivación inicia.',
  'Hoy diste un paso más hacia tu mejor versión.',
  'Cada sesión cuenta. Esta también.',
  'El progreso no grita, pero se nota.',
  'Entrenaste con intención. Eso es lo que importa.',
  'Tu yo del futuro te lo agradece.',
];

interface SessionCelebrationProps {
  data: SessionCelebrationData;
  onDone: () => void;
}

export default function SessionCelebration({ data, onDone }: SessionCelebrationProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<'download' | 'share' | null>(null);
  const phrase = useMemo(() => PHRASES[Math.floor(Math.random() * PHRASES.length)], []);

  const muscleLine =
    data.muscles && data.muscles.length > 0
      ? data.muscles.slice(0, 4).join(' · ')
      : null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setBusy('download');
    try {
      await downloadPngFromElement(cardRef.current, `fitgen-${Date.now()}.png`);
    } catch {
      alert('No se pudo generar la imagen. Intenta de nuevo.');
    } finally {
      setBusy(null);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    setBusy('share');
    try {
      await sharePngFromElement(
        cardRef.current,
        'FitGen — Sesión completada',
        `Completé mi sesión de ${data.sessionFocus} con FitGen.`,
      );
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        alert('No se pudo compartir. Prueba descargar la imagen.');
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell className="justify-center">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-sm mx-auto w-full">
        <div
          ref={cardRef}
          className="w-full rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-lime-500/80">
              FitGen
            </span>
            <Sparkles className="w-4 h-4 text-lime-500/60" />
          </div>

          <p className="text-2xl font-bold text-white leading-snug mb-2">¡Sesión completada!</p>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">{phrase}</p>

          <div className="h-px bg-zinc-800 mb-5" />

          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-600 mb-1">Hoy</p>
          <p className="text-lg font-semibold text-white mb-4">{data.sessionFocus}</p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl bg-zinc-900/80 ring-1 ring-zinc-800/80 px-3 py-3 text-center">
              <p className="text-lg font-bold text-lime-400 tabular-nums">{data.durationLabel}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">duración</p>
            </div>
            <div className="rounded-2xl bg-zinc-900/80 ring-1 ring-zinc-800/80 px-3 py-3 text-center">
              <p className="text-lg font-bold text-white tabular-nums">{data.exerciseCount}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">ejercicios</p>
            </div>
            <div className="rounded-2xl bg-zinc-900/80 ring-1 ring-zinc-800/80 px-3 py-3 text-center">
              <p className="text-lg font-bold text-white tabular-nums">{data.totalSets}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">series</p>
            </div>
          </div>

          {muscleLine && (
            <p className="text-xs text-zinc-500 text-center leading-relaxed">{muscleLine}</p>
          )}
        </div>

        <div className="w-full mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-3.5 text-sm font-medium text-zinc-200 hover:border-zinc-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {busy === 'download' ? 'Generando…' : 'Descargar PNG'}
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={busy !== null}
              className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-3.5 text-sm font-medium text-zinc-200 hover:border-zinc-700 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              {busy === 'share' ? 'Abriendo…' : 'Compartir'}
            </button>
          </div>
          <AppPrimaryButton onClick={onDone}>Listo</AppPrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}
