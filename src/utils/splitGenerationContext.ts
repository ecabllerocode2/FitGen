import type { FitnessGoal } from '../types/session';
import { getExperienceLevelFromMonths } from './experienceLevel';

export type ExperienceLevelLabel = 'Novato' | 'Intermedio' | 'Avanzado';

export interface MesocycleGenerationProfile {
  fitnessGoal?: FitnessGoal | string;
  trainingAgeMonths?: number;
  experienceLevel?: ExperienceLevelLabel | string;
  trainingDaysPerWeek?: number;
  preferredTrainingDays?: string[];
  weeklyScheduleContext?: { day: string; canTrain?: boolean }[];
  injuriesOrLimitations?: string[];
  age?: number;
}

const MAX_TRAINING_DAYS = 6;

const SPLIT_LABELS: Record<string, string> = {
  Full_Body: 'Full Body',
  Torso_Pierna: 'Torso / Pierna',
  Torso_Pierna_ondulado: 'Torso / Pierna ondulado',
  Hibrido_PHUL: 'PHUL (Fuerza + Hipertrofia)',
  Push_Pull_Legs: 'Push / Pull / Legs',
};

const DURATION_BY_LEVEL: Record<ExperienceLevelLabel, number> = {
  Novato: 6,
  Intermedio: 5,
  Avanzado: 4,
};

const VOLUME_FACTOR: Record<ExperienceLevelLabel, number> = {
  Novato: 0.8,
  Intermedio: 1.0,
  Avanzado: 1.15,
};

/** Espejo del motor backend — solo para UI de carga. */
export function selectSplitType(
  trainingDays: number,
  goal: string,
  experienceLevel: ExperienceLevelLabel,
): string {
  const days = Math.min(Math.max(trainingDays, 1), MAX_TRAINING_DAYS);

  if (days <= 2) return 'Full_Body';

  if (goal === 'Fuerza') {
    if (days === 3) return 'Full_Body';
    if (days === 4 || days === 5) return 'Hibrido_PHUL';
    return 'Push_Pull_Legs';
  }

  if (days === 3) {
    return experienceLevel === 'Novato' ? 'Full_Body' : 'Torso_Pierna_ondulado';
  }
  if (days === 4) return 'Torso_Pierna';
  if (days === 5) return 'Hibrido_PHUL';
  return 'Push_Pull_Legs';
}

export function getSplitLabel(splitType: string): string {
  return SPLIT_LABELS[splitType] ?? splitType.replace(/_/g, ' ');
}

function resolveTrainingDays(profile: MesocycleGenerationProfile): number {
  const fromProfile = profile.trainingDaysPerWeek;
  if (fromProfile && fromProfile > 0) {
    return Math.min(fromProfile, MAX_TRAINING_DAYS);
  }
  const schedule =
    profile.weeklyScheduleContext?.filter((d) => d.canTrain !== false) ??
    profile.preferredTrainingDays ??
    [];
  return Math.min(Math.max(schedule.length, 1), MAX_TRAINING_DAYS);
}

function resolveCalendarDays(profile: MesocycleGenerationProfile): string[] {
  if (profile.weeklyScheduleContext?.length) {
    return profile.weeklyScheduleContext.filter((d) => d.canTrain !== false).map((d) => d.day);
  }
  return profile.preferredTrainingDays ?? [];
}

export interface GenerationScienceStep {
  id: string;
  title: string;
  detail: string;
}

export interface GenerationScienceContext {
  goal: string;
  experienceLevel: ExperienceLevelLabel;
  trainingDays: number;
  requestedDays?: number;
  splitType: string;
  splitLabel: string;
  durationWeeks: number;
  volumeFactor: number;
  calendarDays: string[];
  injuries: string[];
  steps: GenerationScienceStep[];
}

export function buildGenerationScienceContext(
  profile: MesocycleGenerationProfile,
): GenerationScienceContext {
  const goal = (profile.fitnessGoal as string) || 'Hipertrofia';
  const experienceLevel = (
    profile.experienceLevel
      ? profile.experienceLevel
      : getExperienceLevelFromMonths(profile.trainingAgeMonths ?? 12)
  ) as ExperienceLevelLabel;
  const requestedDays = profile.trainingDaysPerWeek ?? resolveTrainingDays(profile);
  const trainingDays = resolveTrainingDays(profile);
  const splitType = selectSplitType(trainingDays, goal, experienceLevel);
  const calendarDays = resolveCalendarDays(profile);
  const injuries = (profile.injuriesOrLimitations ?? []).filter(
    (i) => i && i !== 'Ninguna',
  );
  const durationWeeks = DURATION_BY_LEVEL[experienceLevel] ?? 5;
  const volumeFactor = VOLUME_FACTOR[experienceLevel] ?? 1.0;

  const frequencyNote =
    goal === 'Fuerza'
      ? 'Priorizamos ≥2 estímulos/semana en compuestos principales (evidencia Pelland et al. sobre frecuencia y fuerza).'
      : 'Distribuimos volumen en frecuencia práctica; a igual volumen semanal, la frecuencia extra no es el driver principal de hipertrofia (meta-análisis Yue, Barroso, Pelland).';

  const steps: GenerationScienceStep[] = [
    {
      id: 'profile',
      title: 'Perfil y nivel de experiencia',
      detail: `Nivel ${experienceLevel} · mesociclo de ${durationWeeks} semanas · factor de volumen ×${volumeFactor} sobre MEV/MRV base.`,
    },
    {
      id: 'split',
      title: 'Arquitectura del split',
      detail: `${getSplitLabel(splitType)} para ${trainingDays} sesión${trainingDays !== 1 ? 'es' : ''}/semana y objetivo ${goal}. ${frequencyNote}`,
    },
    {
      id: 'volume',
      title: 'Landmarks de volumen semanal',
      detail:
        'Series directas por músculo de MEV → MRV según tu nivel. El volumen semanal es la variable dominante de hipertrofia en nuestro modelo (DDS §5.3).',
    },
    {
      id: 'rir',
      title: 'Periodización de intensidad (RIR)',
      detail:
        'RIR objetivo ondula semana a semana (más lejos al inicio, más cerca del límite al final). Modelo alineado con autorregulación por repeticiones en reserva, no %1RM fijo.',
    },
    {
      id: 'schedule',
      title: 'Calendario y orden de sesiones',
      detail:
        calendarDays.length > 0
          ? `Sesiones en: ${calendarDays.join(', ')}. Evitamos el mismo patrón dominante en días consecutivos cuando es posible.`
          : 'Asignamos sesiones a tus días disponibles evitando patrones repetidos en días seguidos.',
    },
    {
      id: 'deload',
      title: 'Deload planificado',
      detail: `Semana ${durationWeeks}: volumen ~50 % y RIR más conservador para disipar fatiga acumulada (consenso Sports Medicine Open 2023).`,
    },
  ];

  if (injuries.length > 0) {
    steps.push({
      id: 'safety',
      title: 'Perfil de seguridad',
      detail: `Ajustamos patrones y ejercicios por: ${injuries.join(', ')}. Semanas 1–2 más conservadoras si aplica.`,
    });
  }

  if (requestedDays > MAX_TRAINING_DAYS) {
    steps.push({
      id: 'cap',
      title: 'Recuperación semanal',
      detail: `Solicitaste ${requestedDays} días; programamos ${MAX_TRAINING_DAYS} sesiones + descanso. Entrenar 7 días seguidos no mejora adaptación y eleva riesgo de fatiga.`,
    });
  }

  return {
    goal,
    experienceLevel,
    trainingDays,
    requestedDays: requestedDays > MAX_TRAINING_DAYS ? requestedDays : undefined,
    splitType,
    splitLabel: getSplitLabel(splitType),
    durationWeeks,
    volumeFactor,
    calendarDays,
    injuries,
    steps,
  };
}
