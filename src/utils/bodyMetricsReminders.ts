import type { BodyCheckinStatus } from '../types/bodyMetrics';

export function bodyCheckinBannerMessage(status: BodyCheckinStatus): string {
  if (status.overdue) {
    return 'Tu check-in quincenal está pendiente. Toma 20 segundos: peso y cintura.';
  }
  if (status.due) {
    return 'Check-in quincenal disponible — registra peso y cintura para ajustar tu progreso.';
  }
  if (status.daysUntilDue <= 3) {
    return `Próximo check-in en ${status.daysUntilDue} día${status.daysUntilDue === 1 ? '' : 's'}.`;
  }
  return '';
}

export function shouldShowBodyCheckinBanner(status: BodyCheckinStatus | null | undefined): boolean {
  if (!status) return true;
  return status.due || status.overdue;
}
