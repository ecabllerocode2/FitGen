import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import SessionCelebration, { type SessionCelebrationData } from './SessionCelebration';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import { elementToPngDataUrl } from '../utils/shareCard';

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
  const uploadedRef = useRef(false);

  const statePayload = (location.state as PendingCelebration | null) ?? null;
  const payload = statePayload ?? readPendingCelebration();

  useEffect(() => {
    if (!payload) {
      navigate('/', { replace: true });
    }
  }, [payload, navigate]);

  useEffect(() => {
    if (!payload?.archivedSessionId || uploadedRef.current) return;

    const uploadCard = async () => {
      const card = document.querySelector('[data-celebration-card]') as HTMLElement | null;
      if (!card) return;

      uploadedRef.current = true;
      try {
        const user = getAuth().currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        const imageBase64 = await elementToPngDataUrl(card);
        await authenticatedFetch(API_ENDPOINTS.SESSION_CELEBRATION_CARD, token, {
          method: 'POST',
          body: JSON.stringify({
            archivedSessionId: payload.archivedSessionId,
            imageBase64,
          }),
        });
      } catch (err) {
        console.warn('No se pudo guardar tarjeta de celebración:', err);
      }
    };

    const timer = window.setTimeout(uploadCard, 600);
    return () => window.clearTimeout(timer);
  }, [payload?.archivedSessionId]);

  if (!payload) return null;

  return (
    <SessionCelebration
      data={payload.data}
      onDone={() => {
        clearPendingCelebration();
        navigate('/', { replace: true });
      }}
    />
  );
}
