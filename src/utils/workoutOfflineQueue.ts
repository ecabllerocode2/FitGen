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
const PROGRESS_PREFIX = 'fitgen.workout.progress.';
const QUEUE_KEY = 'fitgen.workout.completeQueue';
const MAX_QUEUE = 5;

export type WorkoutPhaseCheckpoint =
  | 'warmup'
  | 'main'
  | 'core'
  | 'cooldown'
  | 'rest'
  | 'complete';

export interface WorkoutProgressCheckpoint {
  sessionId: string;
  startedAt: string;
  currentPhase: WorkoutPhaseCheckpoint;
  showPhaseIntro: boolean;
  isResting: boolean;
  restSeconds: number;
  remainingRestSeconds: number;
  /** Wall-clock epoch ms when the current rest should hit 0 (null if paused / not resting). */
  restEndsAt?: number | null;
  isPaused: boolean;
  soundEnabled: boolean;
  warmupIndex: number;
  mainStationIndex: number;
  mainExerciseIndex: number;
  mainSetNumber: number;
  coreIndex: number;
  cooldownPhaseIndex: number;
  cooldownExerciseIndex: number;
  weightOverrides: Record<string, number>;
  savedAt: string;
}

function logsKey(sessionId: string) {
  return `${LOGS_PREFIX}${sessionId}`;
}

function progressKey(sessionId: string) {
  return `${PROGRESS_PREFIX}${sessionId}`;
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

export function saveWorkoutProgress(sessionId: string, progress: WorkoutProgressCheckpoint) {
  if (!sessionId) return;
  try {
    localStorage.setItem(progressKey(sessionId), JSON.stringify(progress));
  } catch {
    // Ignore quota errors.
  }
}

export function loadWorkoutProgress(sessionId: string): WorkoutProgressCheckpoint | null {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem(progressKey(sessionId));
    return raw ? (JSON.parse(raw) as WorkoutProgressCheckpoint) : null;
  } catch {
    return null;
  }
}

export function clearWorkoutProgress(sessionId: string) {
  if (sessionId) {
    localStorage.removeItem(progressKey(sessionId));
  }
}

export function clearWorkoutPersistence(sessionId: string) {
  if (sessionId) {
    localStorage.removeItem(logsKey(sessionId));
    localStorage.removeItem(progressKey(sessionId));
  }
}
