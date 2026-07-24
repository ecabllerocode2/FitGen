import { format, parseISO, lastDayOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatSeasonLabel(seasonId: string | null | undefined): string {
  if (!seasonId) return 'Temporada actual';
  const match = /^(\d{4})-(\d{2})$/.exec(seasonId);
  if (!match) return seasonId;
  const date = parseISO(`${match[1]}-${match[2]}-01`);
  return format(date, 'MMMM yyyy', { locale: es });
}

export function seasonDaysRemaining(seasonId: string | null | undefined): number | null {
  if (!seasonId) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(seasonId);
  if (!match) return null;
  const monthStart = parseISO(`${match[1]}-${match[2]}-01`);
  const monthEnd = lastDayOfMonth(monthStart);
  const today = new Date();
  if (today > monthEnd) return 0;
  const diff = Math.ceil((monthEnd.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, diff);
}

export function formatFitCoins(amount: number): string {
  return amount.toLocaleString('es-MX');
}

export const FITCOIN_EARN_HINTS = [
  { action: 'Completar sesión (≥80% volumen)', fitCoins: '+2', points: '+10' },
  { action: 'Readiness pre-entreno', fitCoins: '—', points: '+2' },
  { action: 'Feedback post-entreno', fitCoins: '—', points: '+2' },
  { action: 'Récord e1RM propio', fitCoins: '—', points: '+5' },
  { action: 'Semana perfecta', fitCoins: '+5', points: '+25' },
  { action: 'Mesociclo evaluado (≥75%)', fitCoins: '+15', points: '+50' },
] as const;
