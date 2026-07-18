import type { SessionCelebrationData } from '../components/SessionCelebration';

export interface SetLog {
  reps: number;
  weight: number | null;
  rir?: number | null;
}

export type ExerciseLogs = Record<string, SetLog[]>;

export interface PendingCompletion {
  clientCompletionId: string;
  sessionId: string;
  payload: Record<string, unknown>;
  celebrationFallback: SessionCelebrationData;
  queuedAt: string;
}

const LOGS_PREFIX = 'fitgen.workout.logs.';
const QUEUE_KEY = 'fitgen.workout.completeQueue';
const MAX_QUEUE = 5;

function logsKey(sessionId: string) {
  return `${LOGS_PREFIX}${sessionId}`;
}

export function saveExerciseLogs(sessionId: string, logs: ExerciseLogs) {
  if (!sessionId) return;
  try {
    localStorage.setItem(logsKey(sessionId), JSON.stringify(logs));
  } catch {
    // Ignore quota errors — session can still finish online.
  }
}

export function loadExerciseLogs(sessionId: string): ExerciseLogs | null {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem(logsKey(sessionId));
    return raw ? (JSON.parse(raw) as ExerciseLogs) : null;
  } catch {
    return null;
  }
}

export function getCompletionQueue(): PendingCompletion[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as PendingCompletion[]) : [];
  } catch {
    return [];
  }
}

function writeCompletionQueue(queue: PendingCompletion[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
}

export function enqueueCompletion(item: PendingCompletion) {
  const queue = getCompletionQueue().filter((q) => q.clientCompletionId !== item.clientCompletionId);
  queue.push(item);
  writeCompletionQueue(queue);
}

export function removeFromQueue(clientCompletionId: string) {
  writeCompletionQueue(getCompletionQueue().filter((q) => q.clientCompletionId !== clientCompletionId));
}

export function clearWorkoutPersistence(sessionId: string) {
  if (sessionId) {
    localStorage.removeItem(logsKey(sessionId));
  }
}
