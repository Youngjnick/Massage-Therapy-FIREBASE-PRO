import type { Badge } from './badgeHelpers';

/**
 * Maps a user's earned badge IDs to full badge objects from the master list.
 * @param {string[]} earnedBadgeIds - Array of badge IDs the user has earned
 * @param {Badge[]} allBadges - Array of all badge objects
 * @returns {Badge[]} Array of badge objects with an added `earned: true` property
 */
export function mapUserBadgesToObjects(earnedBadgeIds: string[], allBadges: Badge[]): Badge[] {
  if (!Array.isArray(earnedBadgeIds) || !Array.isArray(allBadges)) { return []; }
  return allBadges.map(badge => ({
    ...badge,
    earned: earnedBadgeIds.includes(badge.id)
  }));
}

// Example usage:
// import badges from '../data/badges.js';
// const userBadges = mapUserBadgesToObjects(['accuracy_100', 'first_quiz'], badges);
// (Do not assign to window/appState; use context/hooks)
