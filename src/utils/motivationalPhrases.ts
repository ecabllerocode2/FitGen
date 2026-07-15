/** Motivational copy — no emojis anywhere in this list. */
export const MOTIVATIONAL_PHRASES = [
  'La constancia construye lo que la motivación inicia.',
  'Cada sesión te acerca a tu mejor versión.',
  'El progreso no grita, pero se nota.',
  'Entrenaste con intención. Eso es lo que importa.',
  'Tu yo del futuro te lo agradece.',
  'No se trata de ser el mejor, sino de ser mejor que ayer.',
  'Tu único límite eres tú mismo.',
  'El progreso es progreso, sin importar qué tan pequeño.',
  'Los campeones se forjan cuando nadie está mirando.',
  'El dolor de hoy es la fuerza de mañana.',
  'La disciplina es elegir entre lo que quieres ahora y lo que quieres más.',
  'Una sesión más es una victoria más.',
  'La repetición crea maestría.',
  'Hoy invertiste en ti. Eso no se negocia.',
  'La fuerza llega después de la resistencia, no antes.',
  'Cada repetición cuenta en el balance de tu progreso.',
  'El cuerpo responde a lo que haces con frecuencia, no a lo que haces una vez.',
  'Entrenar es un acto de respeto hacia ti mismo.',
  'La constancia vence al talento cuando el talento no entrena.',
  'Lo que haces hoy define lo que puedes hacer mañana.',
  'Pequeños avances suman resultados grandes.',
  'La adaptación ocurre cuando sales de tu zona cómoda.',
  'Tu rutina de hoy es tu ventaja de mañana.',
  'El esfuerzo honesto siempre deja huella.',
  'No necesitas motivación perfecta, necesitas empezar.',
  'Cada sesión completada es evidencia de tu compromiso.',
  'La mejor versión de ti se construye sesión a sesión.',
  'El descanso también entrena, pero hoy entrenaste.',
  'Tu constancia habla más fuerte que cualquier excusa.',
  'El gimnasio premia a quien vuelve.',
  'Hoy elegiste avanzar. Eso ya te diferencia.',
  'La fuerza mental se entrena igual que la física.',
  'Un día difícil entrenado vale más que un día fácil omitido.',
  'Tu progreso es real aunque no lo veas todavía en el espejo.',
  'La excelencia es un hábito, no un evento.',
  'Cada serie es un voto por la persona que quieres ser.',
  'Lo que sostienes en el tiempo es lo que realmente cambia.',
  'Entrenar es apostar por tu salud a largo plazo.',
  'Hoy sumaste otra página a tu historia de progreso.',
  'La paciencia y la constancia son tus mejores aliadas.',
  'Tu capacidad crece cuando no te rindes.',
  'El trabajo silencioso produce resultados visibles.',
  'Mereces el cuerpo fuerte que estás construyendo.',
  'La repetición con propósito transforma.',
  'Hoy hiciste lo necesario. Mañana puedes hacerlo mejor.',
  'La consistencia es la forma más honesta de progresar.',
  'Tu esfuerzo de hoy ya está trabajando para ti.',
  'Entrenar no es castigo, es inversión.',
  'La mejor rutina es la que completas.',
  'Tu meta está más cerca que la sesión pasada.',
  'La fuerza se gana en los días en que no apetece entrenar.',
];

export function pickMotivationalPhrase(seed?: number): string {
  if (seed != null && Number.isFinite(seed)) {
    const idx = Math.abs(Math.floor(seed)) % MOTIVATIONAL_PHRASES.length;
    return MOTIVATIONAL_PHRASES[idx];
  }
  return MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)];
}

export function pickMotivationalPhraseForDate(isoDate?: string): string {
  if (!isoDate) return pickMotivationalPhrase();
  const day = new Date(isoDate).getDate();
  return pickMotivationalPhrase(day);
}
