import { getBaseUrl } from '../utils/getBaseUrl';

export interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  image: string;
  awarded: boolean;
}

// Load badge metadata from public/badges/badges.json
export const getBadges = async (): Promise<Badge[]> => {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    try {
      const url = `${getBaseUrl()}badges/badges.json`;
      console.log('[DEBUG] Fetching badges.json from:', url);
      const res = await window.fetch(url);
      if (!res.ok) {
        console.error('[DEBUG] Failed to load badge metadata:', res.status, res.statusText);
        throw new Error('Failed to load badge metadata');
      }
      const json = await res.json();
      console.log('[DEBUG] badges.json loaded:', json);
      return json;
    } catch (e) {
      console.error('[DEBUG] Error fetching badges.json:', e);
      return [];
    }
  }
  // SSR or test fallback
  return [];
};

export const awardBadge = async (): Promise<void> => {
  // No-op for local badge images
};

export const createBadge = async (): Promise<void> => {
  // No-op for local badge images
};