export type MesocyclePhase = 'acumulacion' | 'intensificacion' | 'deload' | string;

export interface MesocyclePhaseCopy {
  title: string;
  shortLabel: string;
  explanation: string;
}

const PHASE_COPY: Record<string, MesocyclePhaseCopy> = {
  acumulacion: {
    title: 'Acumulación (más volumen)',
    shortLabel: 'Acumulación',
    explanation:
      'Semana de construir trabajo: más series y volumen para adaptar el músculo, con intensidad aún controlada.',
  },
  intensificacion: {
    title: 'Intensificación (más carga)',
    shortLabel: 'Intensificación',
    explanation:
      'Semana de subir la exigencia: cargas más altas o menos RIR; el volumen se estabiliza o baja un poco para priorizar intensidad.',
  },
  deload: {
    title: 'Descarga (recuperación)',
    shortLabel: 'Descarga',
    explanation:
      'Semana de bajar volumen (~50%) para recuperarte. El peso baja a propósito y el RIR sube: mantén peso y reps prescritos; no compenses cargando más ni yendo al fallo.',
  },
};

export function getMesocyclePhaseCopy(
  phase?: MesocyclePhase | null,
  fallbackFocus?: string | null,
): MesocyclePhaseCopy {
  const key = String(phase ?? '').toLowerCase().trim();
  if (PHASE_COPY[key]) return PHASE_COPY[key];

  if (fallbackFocus && String(fallbackFocus).trim()) {
    return {
      title: String(fallbackFocus),
      shortLabel: String(fallbackFocus),
      explanation: 'Objetivo de esta semana dentro de tu periodización.',
    };
  }

  return {
    title: 'Mesociclo activo',
    shortLabel: 'Mesociclo',
    explanation: 'Sigue el plan semanal; volumen e intensidad cambian según la fase.',
  };
}

export function isDeloadPhase(phase?: string | null): boolean {
  return String(phase ?? '').toLowerCase().trim() === 'deload';
}

/** In-session cue so athletes don't "make up" the lighter prescribed load. */
export function getDeloadSessionCue(rirTarget?: number | null): string {
  const rirLabel =
    rirTarget != null && !Number.isNaN(Number(rirTarget))
      ? `~RIR ${Number(rirTarget)}`
      : '~RIR 3';
  return `Descarga: usa el peso prescrito, mismas reps, para en ${rirLabel}. No busques PR ni series al fallo.`;
}
