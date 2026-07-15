import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { GamificationSummary } from '../types/gamification';

export async function fetchGamificationSummary(token: string): Promise<GamificationSummary | null> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.GAMIFICATION_SUMMARY, token, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('fetchGamificationSummary failed:', response.status);
      return null;
    }

    return (await response.json()) as GamificationSummary;
  } catch (err) {
    console.warn('fetchGamificationSummary error:', err);
    return null;
  }
}
