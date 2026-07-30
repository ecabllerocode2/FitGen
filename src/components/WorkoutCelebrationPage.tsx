import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import SessionCelebration, { type SessionCelebrationData } from './SessionCelebration';
import { fetchShareBranding } from '../api/coach';
import AchievementUnlockModal, {
  consumePendingAchievementUnlocks,
} from './gamification/AchievementUnlockModal';
import RetentionMilestoneModal, {
  consumePendingRetentionMilestones,
} from './gamification/RetentionMilestoneModal';
import RewardsEarnedCelebration, {
  consumePendingRewardsDelta,
} from './gamification/RewardsEarnedCelebration';
import type { GamificationAchievementUnlock, GamificationDelta, RetentionMilestone } from '../types/gamification';

const STORAGE_KEY = 'fitgen.pendingCelebration';

export interface PendingCelebration {
  data: SessionCelebrationData;
  archivedSessionId?: string | null;
}

function readPendingCelebration(): PendingCelebration | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCelebration;
  } catch {
    return null;
  }
}

export function storePendingCelebration(payload: PendingCelebration) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPendingCelebration() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export default function WorkoutCelebrationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rewardsDelta, setRewardsDelta] = useState<GamificationDelta | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [achievementUnlocks, setAchievementUnlocks] = useState<GamificationAchievementUnlock[]>(
    () => consumePendingAchievementUnlocks(),
  );
  const [retentionMilestones, setRetentionMilestones] = useState<RetentionMilestone[]>(
    () => consumePendingRetentionMilestones(),
  );

  const [footerText, setFooterText] = useState<string | undefined>(undefined);

  useEffect(() => {
    void (async () => {
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const branding = await fetchShareBranding(token);
        setFooterText(branding.footerText);
      } catch {
        setFooterText('Entrenamiento completado con FitGen');
      }
    })();
  }, []);

  useEffect(() => {
    const delta = consumePendingRewardsDelta();
    if (!delta) return;
    setRewardsDelta(delta);
    setShowRewards((delta.seasonPointsEarned ?? 0) > 0 || (delta.fitCoinsEarned ?? 0) > 0);
  }, []);

  const statePayload = (location.state as PendingCelebration | null) ?? null;
  const payload = statePayload ?? readPendingCelebration();

  useEffect(() => {
    if (!payload) {
      navigate('/', { replace: true });
    }
  }, [payload, navigate]);

  if (!payload) return null;

  const previousSeasonPoints = Math.max(
    0,
    (rewardsDelta?.newSeasonPointsTotal ?? 0) - (rewardsDelta?.seasonPointsEarned ?? 0),
  );
  const previousFitCoins = Math.max(
    0,
    (rewardsDelta?.newFitCoinsTotal ?? 0) - (rewardsDelta?.fitCoinsEarned ?? 0),
  );

  return (
    <>
      {showRewards ? (
        <RewardsEarnedCelebration
          open={showRewards}
          delta={rewardsDelta}
          previousSeasonPoints={previousSeasonPoints}
          previousFitCoins={previousFitCoins}
          onContinue={() => setShowRewards(false)}
        />
      ) : (
        <SessionCelebration
          data={payload.data}
          footerText={footerText}
          archivedSessionId={payload.archivedSessionId}
          onDone={() => {
            clearPendingCelebration();
            navigate('/', { replace: true });
          }}
        />
      )}
      <AchievementUnlockModal
        achievements={achievementUnlocks}
        open={!showRewards && achievementUnlocks.length > 0 && retentionMilestones.length === 0}
        onClose={() => setAchievementUnlocks([])}
      />
      <RetentionMilestoneModal
        milestones={retentionMilestones}
        open={!showRewards && retentionMilestones.length > 0}
        onClose={() => setRetentionMilestones([])}
      />
    </>
  );
}
