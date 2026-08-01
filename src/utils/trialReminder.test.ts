import { describe, expect, it } from 'vitest';
import { getTrialReminder, trialReminderCopy } from './trialReminder';

describe('getTrialReminder', () => {
  const now = Date.parse('2026-08-01T12:00:00.000Z');

  it('returns null when more than 3 days remain', () => {
    expect(getTrialReminder('2026-08-10T12:00:00.000Z', now)).toBeNull();
  });

  it('returns reminder within 3 days', () => {
    const r = getTrialReminder('2026-08-03T18:00:00.000Z', now);
    expect(r?.daysLeft).toBe(3);
  });

  it('returns null when already ended', () => {
    expect(getTrialReminder('2026-07-31T12:00:00.000Z', now)).toBeNull();
  });

  it('copy for one day', () => {
    const r = getTrialReminder('2026-08-01T18:00:00.000Z', now);
    expect(r).not.toBeNull();
    expect(trialReminderCopy(r!)).toMatch(/termina hoy/);
  });
});
