export function getExperienceLevelFromMonths(months: number): 'Novato' | 'Intermedio' | 'Avanzado' {
  if (months < 6) return 'Novato';
  if (months <= 24) return 'Intermedio';
  return 'Avanzado';
}

export const TRAINING_AGE_OPTIONS = [
  { months: 3, label: 'Menos de 6 meses', hint: 'Empezando en el gym' },
  { months: 12, label: '6 meses – 1 año', hint: 'Base sólida' },
  { months: 18, label: '1 – 2 años', hint: 'Entrenamiento constante' },
  { months: 36, label: '2 – 4 años', hint: 'Experiencia avanzada' },
  { months: 60, label: 'Más de 4 años', hint: 'Atleta veterano' },
] as const;
