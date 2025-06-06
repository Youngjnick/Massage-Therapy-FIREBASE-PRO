// --- analyticsUtils.ts ---
// Utility functions for analytics modal (timeline, streaks, leaderboard)

import { TimelineEvent, LeaderboardUser } from '../types/analytics';

export function getUserTimeline(events: TimelineEvent[], userId: string): TimelineEvent[] {
  return events.filter(e => e.userId === userId).sort((a, b) => new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime());
}

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

export function getUserRank(leaderboard: LeaderboardUser[], userId: string): number | null {
  const idx = leaderboard.findIndex(u => u.id === userId);
  return idx >= 0 ? idx + 1 : null;
}

export function getUserPoints(leaderboard: LeaderboardUser[], userId: string): number {
  return leaderboard.find(u => u.id === userId)?.points || 0;
}
