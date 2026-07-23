import { getAuth } from 'firebase/auth';
import { API_ENDPOINTS, authenticatedFetch } from '../config/api';
import type { WeightUnit } from './weightUnits';

export async function persistWeightUnitPreference(unit: WeightUnit): Promise<void> {
  const token = await getAuth().currentUser?.getIdToken();
  if (!token) return;

  const res = await authenticatedFetch(API_ENDPOINTS.USER_PROFILE_SAVE, token, {
    method: 'POST',
    body: JSON.stringify({
      action: 'profile_metadata_update',
      profileData: { weightUnit: unit },
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? 'No se pudo guardar la unidad de peso');
  }
}
