/** Wraps v3 flat mesocycle from API into shape expected by Dashboard. */
export function normalizeMesocycleForUI(raw: any) {
  if (!raw) return null;
  if (raw.mesocyclePlan?.microcycles) return raw;

  const microcycles = raw.microcycles ?? [];
  return {
    ...raw,
    mesocyclePlan: {
      durationWeeks: raw.durationWeeks ?? microcycles.length,
      mesocycleGoal: raw.goal ?? raw.mesocycleGoal ?? 'Hipertrofia',
      splitType: raw.splitType,
      microcycles,
    },
  };
}

export function getMesocyclePreviewSessions(mesocycle: any): string[] {
  const micro = mesocycle?.microcycles?.[0] ?? mesocycle?.mesocyclePlan?.microcycles?.[0];
  if (!micro?.sessions) return [];
  return micro.sessions
    .filter((s: any) => !s.isRestDay && s.sessionFocus !== 'Descanso')
    .map((s: any) => `${s.dayOfWeek}: ${s.sessionFocus}`);
}
