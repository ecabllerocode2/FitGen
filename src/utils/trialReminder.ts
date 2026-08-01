const MS_PER_DAY = 24 * 60 * 60 * 1000;
const REMINDER_WITHIN_DAYS = 3;

export type TrialReminder = {
  daysLeft: number;
  endsAt: string;
  endLabel: string;
};

function formatEndDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return '';
  }
}

/**
 * Soft trial reminder only when the free period is nearly over (≤3 days left).
 * Returns null when outside the window, expired, or missing data.
 */
export function getTrialReminder(
  trialEndsAt: string | null | undefined,
  nowMs: number = Date.now(),
): TrialReminder | null {
  if (!trialEndsAt) return null;
  const endMs = new Date(trialEndsAt).getTime();
  if (!Number.isFinite(endMs)) return null;

  const msLeft = endMs - nowMs;
  if (msLeft <= 0) return null;

  const daysLeft = Math.ceil(msLeft / MS_PER_DAY);
  if (daysLeft > REMINDER_WITHIN_DAYS) return null;

  return {
    daysLeft,
    endsAt: trialEndsAt,
    endLabel: formatEndDate(trialEndsAt),
  };
}

export function trialReminderCopy(reminder: TrialReminder): string {
  if (reminder.daysLeft <= 1) {
    return reminder.endLabel
      ? `Tu prueba gratis termina hoy (${reminder.endLabel}). Suscríbete para no perder tu plan.`
      : 'Tu prueba gratis termina hoy. Suscríbete para no perder tu plan.';
  }
  return reminder.endLabel
    ? `Tu prueba gratis termina en ${reminder.daysLeft} días (${reminder.endLabel}).`
    : `Tu prueba gratis termina en ${reminder.daysLeft} días.`;
}

function dismissStorageKey(userId: string, endsAt: string): string {
  return `fitgen_trial_notice_${userId}_${endsAt}`;
}

/** Dismiss for 24h so the last day can surface again. */
export function isTrialReminderDismissed(
  userId: string,
  endsAt: string,
  nowMs: number = Date.now(),
): boolean {
  try {
    const raw = localStorage.getItem(dismissStorageKey(userId, endsAt));
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && until > nowMs;
  } catch {
    return false;
  }
}

export function dismissTrialReminder(userId: string, endsAt: string, nowMs: number = Date.now()): void {
  try {
    localStorage.setItem(dismissStorageKey(userId, endsAt), String(nowMs + MS_PER_DAY));
  } catch {
    // ignore quota / private mode
  }
}

export function shouldShowTrialReminder(options: {
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
  lifetimeAccess?: boolean;
  athleteOrigin?: string | null;
  userId?: string;
  nowMs?: number;
}): TrialReminder | null {
  const {
    subscriptionStatus,
    trialEndsAt,
    lifetimeAccess,
    athleteOrigin,
    userId,
    nowMs = Date.now(),
  } = options;

  if (lifetimeAccess) return null;
  if (athleteOrigin === 'coached') return null;
  if (subscriptionStatus !== 'trialing') return null;

  const reminder = getTrialReminder(trialEndsAt, nowMs);
  if (!reminder) return null;
  if (userId && isTrialReminderDismissed(userId, reminder.endsAt, nowMs)) return null;
  return reminder;
}
