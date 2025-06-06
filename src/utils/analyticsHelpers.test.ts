// src/utils/analyticsHelpers.test.ts
import { getUserTimeline, getUserStreak, getUserLeaderboardInfo } from './analyticsHelpers';

describe('analyticsHelpers', () => {
  const userId = 'user1';
  const events = [
    { badgeId: 'b1', badgeName: 'Badge 1', userId, earnedAt: '2025-06-01T10:00:00Z' },
    { badgeId: 'b2', badgeName: 'Badge 2', userId, earnedAt: '2025-06-02T10:00:00Z' },
    { badgeId: 'b3', badgeName: 'Badge 3', userId, earnedAt: '2025-06-03T10:00:00Z' },
    { badgeId: 'b4', badgeName: 'Badge 4', userId: 'user2', earnedAt: '2025-06-01T10:00:00Z' },
    { badgeId: 'b5', badgeName: 'Badge 5', userId, earnedAt: '2025-06-05T10:00:00Z' },
  ];
  const leaderboard = [
    { id: 'user2', points: 50 },
    { id: 'user1', points: 100 },
    { id: 'user3', points: 30 },
  ];

  it('getUserTimeline returns sorted timeline for user', () => {
    const timeline = getUserTimeline(events, userId);
    expect(timeline.length).toBe(4);
    expect(timeline[0].badgeId).toBe('b1');
    expect(timeline[3].badgeId).toBe('b5');
  });

  it('getUserStreak returns correct longest streak', () => {
    expect(getUserStreak(events, userId)).toBe(3);
    expect(getUserStreak(events, 'user2')).toBe(1);
  });

  it('getUserLeaderboardInfo returns correct rank and points', () => {
    const info = getUserLeaderboardInfo(leaderboard, userId);
    expect(info.points).toBe(100);
    expect(info.rank).toBe(2);
    const info2 = getUserLeaderboardInfo(leaderboard, 'user3');
    expect(info2.rank).toBe(3);
    expect(info2.points).toBe(30);
    const info3 = getUserLeaderboardInfo(leaderboard, 'notfound');
    expect(info3.rank).toBeNull();
    expect(info3.points).toBe(0);
  });
});
