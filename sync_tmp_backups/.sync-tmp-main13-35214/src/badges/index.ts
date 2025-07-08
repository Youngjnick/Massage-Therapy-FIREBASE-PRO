// Load badge metadata from public/badges/badges.json
export interface Badge {
  id: string;
  name: string;
  description: string;
  image: string;
  criteria: string;
  awarded?: boolean;
}

export const getBadges = async (): Promise<Badge[]> => {
  try {
    const url = `${import.meta.env.BASE_URL}badges/badges.json`;
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
    throw e;
  }
};

export const awardBadge = async (): Promise<void> => {
  // No-op for local badge images
};

export const createBadge = async (): Promise<void> => {
  // No-op for local badge images
};