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
      'Semana de bajar volumen (~50%) para recuperarte, consolidar adaptaciones y llegar fresco al siguiente bloque.',
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
