export type BodyMetricKind = 'light' | 'full';

export interface BodyMetricEntry {
  id: string;
  recordedAt: string;
  weightKg?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  armCm?: number | null;
  thighCm?: number | null;
  source?: string;
  kind?: BodyMetricKind;
}

export interface BodyCheckinStatus {
  due: boolean;
  overdue: boolean;
  daysSince: number | null;
  daysUntilDue: number;
  kind: 'light' | 'full';
  lastCheckinAt: string | null;
  nextCheckinDueAt: string | null;
}

export interface BodyMetricsCheckinPayload {
  weightKg: number;
  waistCm?: number;
  hipCm?: number;
  armCm?: number;
  thighCm?: number;
  kind?: BodyMetricKind;
}
