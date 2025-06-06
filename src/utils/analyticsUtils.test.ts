import { getUserTimeline, getUserStreak, getUserRank, getUserPoints } from './analyticsUtils';

describe('analyticsUtils', () => {
  const events = [
    { badgeId: 'a', userId: 'u1', earnedAt: '2025-06-01T10:00:00Z' },
    { badgeId: 'b', userId: 'u1', earnedAt: '2025-06-02T10:00:00Z' },
    { badgeId: 'c', userId: 'u1', earnedAt: '2025-06-04T10:00:00Z' },
    { badgeId: 'd', userId: 'u2', earnedAt: '2025-06-01T10:00:00Z' },
    { badgeId: 'e', userId: 'u2', earnedAt: '2025-06-02T10:00:00Z' },
  ];
  const leaderboard = [
    { id: 'u2', points: 50 },
    { id: 'u1', points: 100 },
    { id: 'u3', points: 10 },
  ];

  it('getUserTimeline returns sorted timeline for user', () => {
    const timeline = getUserTimeline(events, 'u1');
    expect(timeline.length).toBe(3);
    expect(timeline[0].badgeId).toBe('a');
    expect(timeline[2].badgeId).toBe('c');
  });

  it('getUserStreak returns correct max streak', () => {
    expect(getUserStreak(events, 'u1')).toBe(2); // 2 consecutive days
    expect(getUserStreak(events, 'u2')).toBe(2);
    expect(getUserStreak(events, 'u3')).toBe(0);
  });

  it('getUserRank returns correct rank', () => {
    expect(getUserRank(leaderboard, 'u1')).toBe(2);
    expect(getUserRank(leaderboard, 'u2')).toBe(1);
    expect(getUserRank(leaderboard, 'u3')).toBe(3);
    expect(getUserRank(leaderboard, 'u4')).toBeNull();
  });

  it('getUserPoints returns correct points', () => {
    expect(getUserPoints(leaderboard, 'u1')).toBe(100);
    expect(getUserPoints(leaderboard, 'u2')).toBe(50);
    expect(getUserPoints(leaderboard, 'u3')).toBe(10);
    expect(getUserPoints(leaderboard, 'u4')).toBe(0);
  });
});
