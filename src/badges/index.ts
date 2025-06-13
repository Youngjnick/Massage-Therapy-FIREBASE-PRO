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
      // Use getBaseUrl for correct asset path
      const { getBaseUrl } = await import('../utils/getBaseUrl');
      const res = await window.fetch(`${getBaseUrl()}badges/badges.json`);
      if (!res.ok) throw new Error('Failed to load badge metadata');
      return await res.json();
    } catch {
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