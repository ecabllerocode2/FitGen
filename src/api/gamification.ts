import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type {
  GamificationSummary,
  LeaderboardResponse,
  ShopCatalogResponse,
} from '../types/gamification';

function normalizeGamificationSummary(payload: unknown): GamificationSummary | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (!raw.counters || typeof raw.counters !== 'object') return null;

  return {
    success: raw.success === true,
    counters: raw.counters as GamificationSummary['counters'],
    avatar: (raw.avatar as GamificationSummary['avatar']) ?? {
      baseStage: 0,
      equippedFrameId: null,
      equippedCelebrationId: null,
      equippedShareTemplateId: null,
    },
    achievements: (raw.achievements as GamificationSummary['achievements']) ?? [],
    achievementSections: raw.achievementSections as GamificationSummary['achievementSections'],
    unlockedCount: Number(raw.unlockedCount ?? 0),
    nextAchievement: (raw.nextAchievement as GamificationSummary['nextAchievement']) ?? null,
    preferences: raw.preferences as GamificationSummary['preferences'],
    inventory: raw.inventory as GamificationSummary['inventory'],
    updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export async function fetchGamificationSummary(token: string): Promise<GamificationSummary | null> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.GAMIFICATION_SUMMARY, token, {
      method: 'GET',
    });

    if (!response.ok) {
      console.warn('fetchGamificationSummary failed:', response.status);
      return null;
    }

    return normalizeGamificationSummary(await response.json());
  } catch (err) {
    console.warn('fetchGamificationSummary error:', err);
    return null;
  }
}

export async function fetchLeaderboard(token: string): Promise<LeaderboardResponse | null> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.GAMIFICATION_LEADERBOARD, token, {
      method: 'GET',
    });
    if (!response.ok) return null;
    return (await response.json()) as LeaderboardResponse;
  } catch (err) {
    console.warn('fetchLeaderboard error:', err);
    return null;
  }
}

export async function optInLeaderboard(
  token: string,
  payload: { showInLeaderboard: boolean; publicDisplayName?: string },
): Promise<boolean> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.GAMIFICATION_OPT_IN, token, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchShopCatalog(token: string): Promise<ShopCatalogResponse | null> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.SHOP_CATALOG, token, { method: 'GET' });
    if (!response.ok) return null;
    return (await response.json()) as ShopCatalogResponse;
  } catch {
    return null;
  }
}

export async function purchaseShopItem(
  token: string,
  itemId: string,
): Promise<{ success: boolean; fitCoinsBalance?: number }> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.SHOP_PURCHASE, token, {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
    if (!response.ok) return { success: false };
    const data = await response.json();
    return { success: true, fitCoinsBalance: data.fitCoinsBalance };
  } catch {
    return { success: false };
  }
}

export async function equipShopItem(token: string, itemId: string): Promise<boolean> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.GAMIFICATION_EQUIP, token, {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function redeemPremiumWithFitCoins(
  token: string,
): Promise<{ success: boolean; premiumExpiresAt?: string; fitCoinsBalance?: number }> {
  try {
    const response = await authenticatedFetch(API_ENDPOINTS.SHOP_REDEEM_PREMIUM, token, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!response.ok) return { success: false };
    const data = await response.json();
    return {
      success: true,
      premiumExpiresAt: data.premiumExpiresAt,
      fitCoinsBalance: data.fitCoinsBalance,
    };
  } catch {
    return { success: false };
  }
}
