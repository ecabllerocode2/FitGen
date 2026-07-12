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

const DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const MAX_TRAINING_DAYS = 6;

/** ms por paso en la pantalla de carga — tiempo para leer cada decisión */
export const GENERATION_STEP_MS = 3800;
export const GENERATION_FINISH_HOLD_MS = 2000;

const SPLIT_LABELS: Record<string, string> = {
  Full_Body: 'Full Body',
  Torso_Pierna: 'Torso / Pierna',
  Torso_Pierna_ondulado: 'Torso / Pierna ondulado',
  Hibrido_PHUL: 'PHUL (Fuerza + Hipertrofia)',
  Push_Pull_Legs: 'Push / Pull / Legs',
};

const SPLIT_TEMPLATES: Record<
  string,
  { sessionFocus: string; muscles: string[]; patterns: string[] }[]
> = {
  Full_Body: [
    {
      sessionFocus: 'Full Body A',
      muscles: ['Pecho', 'Espalda', 'Cuádriceps', 'Hombro', 'Core'],
      patterns: ['Empuje_H', 'Traccion_V', 'Rodilla', 'Empuje_V', 'Core'],
    },
    {
      sessionFocus: 'Full Body B',
      muscles: ['Espalda', 'Pecho', 'Isquiotibiales', 'Glúteos', 'Bíceps', 'Tríceps'],
      patterns: ['Traccion_H', 'Empuje_V', 'Cadera', 'Traccion_V', 'Core'],
    },
    {
      sessionFocus: 'Full Body C',
      muscles: ['Cuádriceps', 'Pecho', 'Espalda', 'Hombro', 'Pantorrillas'],
      patterns: ['Rodilla', 'Empuje_H', 'Traccion_H', 'Empuje_V', 'Core'],
    },
  ],
  Torso_Pierna: [
    {
      sessionFocus: 'Torso (Empuje)',
      muscles: ['Pecho', 'Hombro', 'Tríceps'],
      patterns: ['Empuje_H', 'Empuje_V'],
    },
    {
      sessionFocus: 'Pierna (Dominante Rodilla)',
      muscles: ['Cuádriceps', 'Glúteos', 'Pantorrillas'],
      patterns: ['Rodilla'],
    },
    {
      sessionFocus: 'Torso (Tracción)',
      muscles: ['Espalda', 'Bíceps', 'Hombro'],
      patterns: ['Traccion_H', 'Traccion_V'],
    },
    {
      sessionFocus: 'Pierna (Dominante Cadera)',
      muscles: ['Isquiotibiales', 'Glúteos', 'Pantorrillas'],
      patterns: ['Cadera'],
    },
  ],
  Torso_Pierna_ondulado: [
    {
      sessionFocus: 'Torso (Empuje — volumen alto)',
      muscles: ['Pecho', 'Hombro', 'Tríceps'],
      patterns: ['Empuje_H', 'Empuje_V'],
    },
    {
      sessionFocus: 'Pierna (Completa)',
      muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas'],
      patterns: ['Rodilla', 'Cadera'],
    },
    {
      sessionFocus: 'Torso (Tracción — volumen alto)',
      muscles: ['Espalda', 'Bíceps', 'Hombro'],
      patterns: ['Traccion_H', 'Traccion_V'],
    },
  ],
  Hibrido_PHUL: [
    {
      sessionFocus: 'Upper (Fuerza)',
      muscles: ['Pecho', 'Espalda', 'Hombro'],
      patterns: ['Empuje_H', 'Traccion_H'],
    },
    {
      sessionFocus: 'Lower (Fuerza)',
      muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'],
      patterns: ['Rodilla', 'Cadera'],
    },
    {
      sessionFocus: 'Upper (Hipertrofia)',
      muscles: ['Pecho', 'Espalda', 'Bíceps', 'Tríceps', 'Hombro'],
      patterns: ['Empuje_H', 'Traccion_V', 'Empuje_V'],
    },
    {
      sessionFocus: 'Lower (Hipertrofia)',
      muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas'],
      patterns: ['Rodilla', 'Cadera'],
    },
    {
      sessionFocus: 'Full Body Accesorios',
      muscles: ['Core', 'Bíceps', 'Tríceps'],
      patterns: ['Core', 'Empuje_V'],
    },
  ],
  Push_Pull_Legs: [
    {
      sessionFocus: 'Push',
      muscles: ['Pecho', 'Hombro', 'Tríceps'],
      patterns: ['Empuje_H', 'Empuje_V'],
    },
    {
      sessionFocus: 'Pull',
      muscles: ['Espalda', 'Bíceps', 'Hombro'],
      patterns: ['Traccion_H', 'Traccion_V'],
    },
    {
      sessionFocus: 'Legs',
      muscles: ['Cuádriceps', 'Isquiotibiales', 'Glúteos', 'Pantorrillas'],
      patterns: ['Rodilla', 'Cadera'],
    },
  ],
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

const SHORT_DAY: Record<string, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom',
};

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

export function estimateGenerationDisplayMs(stepCount: number): number {
  return stepCount * GENERATION_STEP_MS + GENERATION_FINISH_HOLD_MS;
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

function isLegTemplate(template: { patterns: string[] }) {
  return template.patterns.some((p) => p === 'Rodilla' || p === 'Cadera');
}

function isLegSession(session: { patterns: string[]; sessionFocus: string }) {
  if (/pierna|legs|lower\s*\(/i.test(session.sessionFocus)) return true;
  if (/full body|push|pull|torso|upper/i.test(session.sessionFocus)) return false;
  const hasLeg = session.patterns.some((p) => p === 'Rodilla' || p === 'Cadera');
  const hasUpper = session.patterns.some(
    (p) => p === 'Empuje_H' || p === 'Empuje_V' || p === 'Traccion_H' || p === 'Traccion_V',
  );
  return hasLeg && !hasUpper;
}

function dominantPattern(patterns: string[]) {
  return patterns[0] ?? 'General';
}

function orderTemplates(
  templates: { sessionFocus: string; muscles: string[]; patterns: string[] }[],
  count: number,
) {
  const needed = Math.min(count, templates.length);
  const pool = [...templates];
  const ordered: typeof templates = [];

  for (let i = 0; i < needed; i += 1) {
    if (!pool.length) break;
    const prev = ordered[ordered.length - 1];
    const prevPattern = prev ? dominantPattern(prev.patterns) : null;
    const prevLeg = prev ? isLegTemplate(prev) : false;

    let pickIdx = pool.findIndex(
      (t) => dominantPattern(t.patterns) !== prevPattern && !(prevLeg && isLegTemplate(t)),
    );
    if (pickIdx === -1) {
      pickIdx = pool.findIndex((t) => dominantPattern(t.patterns) !== prevPattern);
    }
    if (pickIdx === -1) pickIdx = 0;

    ordered.push(pool[pickIdx]);
    pool.splice(pickIdx, 1);
  }

  while (ordered.length < needed && templates.length) {
    ordered.push(templates[ordered.length % templates.length]);
  }

  return ordered.length ? ordered : templates.slice(0, needed);
}

export interface WeeklySessionPreview {
  day: string;
  dayShort: string;
  sessionFocus: string;
  patterns: string[];
}

export function buildWeeklyPlanPreview(
  profile: MesocycleGenerationProfile,
  splitType: string,
  trainingDays: number,
): WeeklySessionPreview[] {
  const templates = SPLIT_TEMPLATES[splitType] ?? SPLIT_TEMPLATES.Full_Body;
  const scheduleContext = profile.weeklyScheduleContext ?? [];

  const trainableDays = DAY_ORDER.filter((day) => {
    const ctx = scheduleContext.find((s) => s.day === day);
    return ctx ? ctx.canTrain !== false : true;
  });

  const selectedDays = trainableDays.slice(0, trainingDays);
  const orderedTemplates =
    trainingDays === 1
      ? [templates[0]]
      : orderTemplates(templates, trainingDays);

  return selectedDays.map((day, index) => {
    const template = orderedTemplates[index % orderedTemplates.length];
    return {
      day,
      dayShort: SHORT_DAY[day] ?? day.slice(0, 3),
      sessionFocus: template.sessionFocus,
      patterns: template.patterns,
    };
  });
}

export interface PersonalizedDecision {
  id: string;
  label: string;
  value: string;
  rationale: string;
}

export interface GenerationScienceStep {
  id: string;
  title: string;
  detail: string;
  relatedDecisionId?: string;
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
  weeklyPlan: WeeklySessionPreview[];
  restDays: number;
  decisions: PersonalizedDecision[];
  steps: GenerationScienceStep[];
  estimatedDisplayMs: number;
}

function countMuscleFrequency(sessions: WeeklySessionPreview[]) {
  const freq: Record<string, number> = {};
  const templates = sessions.map((s) => {
    const match = Object.values(SPLIT_TEMPLATES)
      .flat()
      .find((t) => t.sessionFocus === s.sessionFocus);
    return match?.muscles ?? [];
  });
  for (const muscles of templates) {
    for (const m of muscles) {
      freq[m] = (freq[m] ?? 0) + 1;
    }
  }
  return freq;
}

function buildPersonalizedDecisions(input: {
  goal: string;
  experienceLevel: ExperienceLevelLabel;
  trainingDays: number;
  requestedDays: number;
  splitType: string;
  splitLabel: string;
  durationWeeks: number;
  volumeFactor: number;
  calendarDays: string[];
  injuries: string[];
  weeklyPlan: WeeklySessionPreview[];
}): PersonalizedDecision[] {
  const decisions: PersonalizedDecision[] = [];
  const sessions = input.weeklyPlan;

  const hasRodilla = sessions.some((s) => s.patterns.includes('Rodilla'));
  const hasCadera = sessions.some((s) => s.patterns.includes('Cadera'));
  const legSessions = sessions.filter((s) => isLegSession(s)).length;

  const pushSessions = sessions.filter((s) =>
    s.patterns.some((p) => p === 'Empuje_H' || p === 'Empuje_V'),
  ).length;
  const pullSessions = sessions.filter((s) =>
    s.patterns.some((p) => p === 'Traccion_H' || p === 'Traccion_V'),
  ).length;

  const muscleFreq = countMuscleFrequency(sessions);
  const pechoFreq = muscleFreq.Pecho ?? 0;
  const espaldaFreq = muscleFreq.Espalda ?? 0;

  let consecutiveLeg = false;
  for (let i = 1; i < sessions.length; i += 1) {
    if (isLegSession(sessions[i - 1]) && isLegSession(sessions[i])) {
      consecutiveLeg = true;
      break;
    }
  }

  const calendarIndex = sessions.map((s) => DAY_ORDER.indexOf(s.day));
  let consecutiveCalendarLeg = false;
  for (let i = 1; i < calendarIndex.length; i += 1) {
    const dayGap = calendarIndex[i] - calendarIndex[i - 1];
    if (dayGap === 1 && isLegSession(sessions[i - 1]) && isLegSession(sessions[i])) {
      consecutiveCalendarLeg = true;
      break;
    }
  }

  const restDays = 7 - sessions.length;

  if (hasRodilla && hasCadera) {
    decisions.push({
      id: 'leg_coverage',
      label: 'Cobertura de pierna',
      value: 'Rodilla + Cadera',
      rationale:
        legSessions >= 2
          ? `${legSessions} sesiones de pierna: cuádriceps/isquios distribuidos en patrones rodilla y cadera.`
          : input.splitType === 'Torso_Pierna_ondulado'
            ? '1 sesión de pierna completa con ambos patrones en el mismo día.'
            : 'Patrones rodilla y cadera repartidos en tu semana.',
    });
  } else if (input.splitType === 'Full_Body') {
    decisions.push({
      id: 'leg_coverage',
      label: 'Cobertura de pierna',
      value: 'Integrada en Full Body',
      rationale:
        'Cada sesión mezcla tren superior e inferior; rodilla y cadera rotan entre Full Body A/B/C.',
    });
  } else {
    decisions.push({
      id: 'leg_coverage',
      label: 'Cobertura de pierna',
      value: hasRodilla ? 'Dominante rodilla' : 'Dominante cadera',
      rationale: 'Con tus días disponibles priorizamos el patrón más eficiente para repartir volumen.',
    });
  }

  decisions.push({
    id: 'push_pull',
    label: 'Balance empuje / tracción',
    value: `${pushSessions} empuje · ${pullSessions} tracción`,
    rationale:
      Math.abs(pushSessions - pullSessions) <= 1
        ? 'Equilibrio entre empuje y tracción en tu calendario para evitar desbalances de postura.'
        : 'Ajustado a tu split: más volumen donde el plan lo requiere sin sacrificar el antagonista.',
  });

  if (input.goal === 'Fuerza') {
    decisions.push({
      id: 'strength_freq',
      label: 'Frecuencia para fuerza',
      value: `Pecho ${pechoFreq}× · Espalda ${espaldaFreq}× / sem`,
      rationale:
        pechoFreq >= 2 && espaldaFreq >= 2
          ? 'Compuestos principales 2+ veces/semana — alineado con la evidencia de frecuencia en fuerza (Pelland et al.).'
          : input.trainingDays <= 3
            ? 'Con 3 días usamos Full Body para repetir estímulo en sentadilla, press y tirón cada semana.'
            : 'Frecuencia optimizada dentro de tus días disponibles.',
    });
  } else {
    decisions.push({
      id: 'hypertrophy_freq',
      label: 'Distribución de frecuencia',
      value: `${input.trainingDays} sesiones · volumen como prioridad`,
      rationale:
        'A igual volumen semanal, la frecuencia extra no es el driver principal de hipertrofia; priorizamos repartir series de forma sostenible.',
    });
  }

  decisions.push({
    id: 'consecutive_legs',
    label: 'Días consecutivos de pierna',
    value: consecutiveCalendarLeg ? 'Detectado en calendario — mitigado' : 'Evitados',
    rationale: consecutiveCalendarLeg
      ? 'Tu calendario concentra días seguidos; el orden de sesiones alterna torso/pierna cuando es posible.'
      : consecutiveLeg
        ? 'Reordenamos plantillas para no encadenar dos sesiones de pierna dedicada.'
        : `Orden optimizado en: ${sessions.map((s) => s.dayShort).join(' → ')}.`,
  });

  decisions.push({
    id: 'weekly_rest',
    label: 'Descanso semanal',
    value: `${restDays} día${restDays !== 1 ? 's' : ''} de recuperación`,
    rationale:
      input.requestedDays > MAX_TRAINING_DAYS
        ? `Capacitamos a ${MAX_TRAINING_DAYS} sesiones aunque pediste ${input.requestedDays}: el descanso mejora adaptación y reduce fatiga acumulada.`
        : restDays >= 1
          ? 'Al menos un día sin entrenar para permitir supercompensación (consenso Sports Medicine Open 2023).'
          : 'Máxima frecuencia posible dentro de límites de recuperación.',
  });

  if (input.experienceLevel === 'Novato') {
    decisions.push({
      id: 'novice_recovery',
      label: 'Recuperación de novato',
      value: `Volumen ×${input.volumeFactor} · ${input.durationWeeks} semanas`,
      rationale:
        'Mesociclo más largo y volumen inicial conservador (80 % del MEV base): tu carga absoluta genera menos fatiga relativa y necesitas más práctica técnica.',
    });
  } else if (input.experienceLevel === 'Avanzado') {
    decisions.push({
      id: 'advanced_block',
      label: 'Bloque avanzado',
      value: `Volumen ×${input.volumeFactor} · ${input.durationWeeks} semanas`,
      rationale:
        'Mesociclo más corto e intensivo con mayor techo de volumen (115 % MRV escalado) y deload cada 4 semanas.',
    });
  }

  if (input.injuries.length > 0) {
    decisions.push({
      id: 'safety',
      label: 'Perfil de seguridad',
      value: input.injuries.join(', '),
      rationale:
        'Excluimos o sustituimos patrones de riesgo y priorizamos máquinas en las primeras 2 semanas si aplica.',
    });
  }

  return decisions;
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
  const splitLabel = getSplitLabel(splitType);
  const calendarDays = resolveCalendarDays(profile);
  const injuries = (profile.injuriesOrLimitations ?? []).filter(
    (i) => i && i !== 'Ninguna',
  );
  const durationWeeks = DURATION_BY_LEVEL[experienceLevel] ?? 5;
  const volumeFactor = VOLUME_FACTOR[experienceLevel] ?? 1.0;
  const weeklyPlan = buildWeeklyPlanPreview(profile, splitType, trainingDays);

  const decisions = buildPersonalizedDecisions({
    goal,
    experienceLevel,
    trainingDays,
    requestedDays,
    splitType,
    splitLabel,
    durationWeeks,
    volumeFactor,
    calendarDays,
    injuries,
    weeklyPlan,
  });

  const steps: GenerationScienceStep[] = [
    {
      id: 'profile',
      title: 'Analizando tu perfil',
      detail: `Nivel ${experienceLevel} · objetivo ${goal} · ${trainingDays} sesiones en ${calendarDays.length ? calendarDays.map((d) => SHORT_DAY[d] ?? d).join(', ') : 'tu calendario'}.`,
    },
    {
      id: 'split',
      title: 'Seleccionando arquitectura del split',
      detail: `${splitLabel} es la estructura óptima para ${trainingDays} días y tu objetivo.`,
      relatedDecisionId: goal === 'Fuerza' ? 'strength_freq' : 'hypertrophy_freq',
    },
    {
      id: 'leg_coverage',
      title: 'Verificando cobertura de pierna',
      detail: decisions.find((d) => d.id === 'leg_coverage')?.rationale ?? '',
      relatedDecisionId: 'leg_coverage',
    },
    {
      id: 'push_pull',
      title: 'Balanceando empuje y tracción',
      detail: decisions.find((d) => d.id === 'push_pull')?.rationale ?? '',
      relatedDecisionId: 'push_pull',
    },
    {
      id: 'schedule',
      title: 'Ordenando sesiones en tu calendario',
      detail: decisions.find((d) => d.id === 'consecutive_legs')?.rationale ?? '',
      relatedDecisionId: 'consecutive_legs',
    },
    {
      id: 'rest',
      title: 'Programando descanso y recuperación',
      detail: decisions.find((d) => d.id === 'weekly_rest')?.rationale ?? '',
      relatedDecisionId: 'weekly_rest',
    },
  ];

  if (experienceLevel === 'Novato') {
    steps.push({
      id: 'novice',
      title: 'Ajustando recuperación de novato',
      detail: decisions.find((d) => d.id === 'novice_recovery')?.rationale ?? '',
      relatedDecisionId: 'novice_recovery',
    });
  }

  if (goal === 'Fuerza') {
    steps.splice(3, 0, {
      id: 'strength_freq',
      title: 'Optimizando frecuencia para fuerza',
      detail: decisions.find((d) => d.id === 'strength_freq')?.rationale ?? '',
      relatedDecisionId: 'strength_freq',
    });
  }

  steps.push({
    id: 'volume',
    title: 'Calculando volumen semanal (MEV → MRV)',
    detail: `Factor ×${volumeFactor} sobre landmarks base. El volumen por músculo es la variable dominante del plan.`,
  });

  steps.push({
    id: 'rir',
    title: 'Diseñando progresión de RIR',
    detail: `RIR ondulante durante ${durationWeeks - 1} semanas de acumulación + deload en semana ${durationWeeks}.`,
  });

  if (injuries.length > 0) {
    steps.push({
      id: 'safety',
      title: 'Aplicando perfil de seguridad',
      detail: decisions.find((d) => d.id === 'safety')?.rationale ?? '',
      relatedDecisionId: 'safety',
    });
  }

  steps.push({
    id: 'finalize',
    title: 'Finalizando tu mesociclo',
    detail: 'Empaquetando split, volumen, progresión y calendario en tu plan personalizado.',
  });

  return {
    goal,
    experienceLevel,
    trainingDays,
    requestedDays: requestedDays > MAX_TRAINING_DAYS ? requestedDays : undefined,
    splitType,
    splitLabel,
    durationWeeks,
    volumeFactor,
    calendarDays,
    injuries,
    weeklyPlan,
    restDays: 7 - weeklyPlan.length,
    decisions,
    steps,
    estimatedDisplayMs: estimateGenerationDisplayMs(steps.length),
  };
}

/** Espera hasta cumplir el tiempo mínimo de lectura de la pantalla de carga. */
export function waitForGenerationDisplay(minMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, minMs));
}
