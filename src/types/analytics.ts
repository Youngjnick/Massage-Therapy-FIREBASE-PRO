// Shared analytics types for badge analytics, timeline, leaderboard, etc.

export interface TimelineEvent {
  badgeId: string;
  badgeName?: string;
  userId: string;
  earnedAt: string;
}

export interface LeaderboardUser {
  id: string;
  points?: number;
  name?: string;
  displayName?: string;
  email?: string;
  badges?: unknown[];
  [key: string]: unknown;
}

export interface QuizHistoryItem {
  date: number;
  total: number;
  correct: number;
  incorrect: number;
  unanswered?: number;
  score?: number;
  streak?: number;
}

export interface MasteryHistoryItem {
  date: number;
  avgMastery: number;
}
