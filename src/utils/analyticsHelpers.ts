// src/utils/analyticsHelpers.ts
import { TimelineEvent, LeaderboardUser } from '../types/analytics';

/**
 * Calculate the user's badge earning timeline from all events.
 */
export function getUserTimeline(events: TimelineEvent[], userId: string): TimelineEvent[] {
  return events.filter(e => e.userId === userId).sort((a, b) => new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime());
}

/**
 * Calculate the user's longest badge streak (consecutive days with a badge earned).
 */
export function getUserStreak(events: TimelineEvent[], userId: string): number {
  const userEvents = getUserTimeline(events, userId);
  const days = Array.from(new Set(userEvents.map(e => new Date(e.earnedAt).toDateString())))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let maxStreak = 0, curStreak = 0;
  for (let i = 0; i < days.length; i++) {
    if (i === 0) {
      curStreak = 1;
    } else {
      const prev = new Date(days[i-1]);
      const curr = new Date(days[i]);
      if ((curr.getTime() - prev.getTime())/86400000 === 1) curStreak++;
      else curStreak = 1;
    }
    if (curStreak > maxStreak) maxStreak = curStreak;
  }
  return maxStreak;
}

/**
 * Get the user's leaderboard rank and points.
 */
export function getUserLeaderboardInfo(leaderboard: LeaderboardUser[], userId: string): { rank: number|null, points: number } {
  const userEntry = leaderboard.find(u => u.id === userId);
  return {
    points: userEntry?.points || 0,
    rank: userEntry ? leaderboard.findIndex(u => u.id === userId) + 1 : null
  };
}
