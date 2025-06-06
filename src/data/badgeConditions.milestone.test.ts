// Tests for milestone and participation badge conditions (first quiz, fast learner, etc.)
import {
  checkUnlock_first_quiz,
  checkUnlock_fast_learner,
  checkUnlock_first_steps,
  checkBadgeUnlockByKey,
  getBadgeProgress,
} from './badgeConditions';

describe('Milestone & Participation Badge Conditions', () => {
  describe('First Quiz', () => {
    it('checkUnlock_first_quiz', () => {
      expect(checkUnlock_first_quiz({ total_quizzes: 1 })).toBe(true);
      expect(checkUnlock_first_quiz({ total_quizzes: 0 })).toBe(false);
    });
  });

  describe('Fast Learner', () => {
    it('checkUnlock_fast_learner', () => {
      expect(checkUnlock_fast_learner({ questionsAnswered: 10 })).toBe(true);
      expect(checkUnlock_fast_learner({ questionsAnswered: 9 })).toBe(false);
    });
    it('checkUnlock_first_steps', () => {
      expect(checkUnlock_first_steps({ questionsAnswered: 1 })).toBe(true);
      expect(checkUnlock_first_steps({ questionsAnswered: 0 })).toBe(false);
    });
  });

  describe('checkBadgeUnlockByKey', () => {
    it('works for config-driven badges', () => {
      expect(checkBadgeUnlockByKey('accuracy_100', { last_quiz_score: 100 })).toBe(true);
      expect(checkBadgeUnlockByKey('first_quiz', { total_quizzes: 0 })).toBe(false);
      expect(checkBadgeUnlockByKey('streak_3', { current_streak_days: 2 })).toBe(false);
      expect(checkBadgeUnlockByKey('fast_learner', { questionsAnswered: 10 })).toBe(true);
    });
    it('returns false for unknown badge key', () => {
      expect(checkBadgeUnlockByKey('nonexistent_badge', { whatever: 1 })).toBe(false);
    });
  });

  describe('getBadgeProgress', () => {
    it('returns correct progress for fast_learner', () => {
      expect(getBadgeProgress('fast_learner', { questionsAnswered: 5 })).toEqual({ current: 5, needed: 10, percent: 50 });
    });
    it('returns 0 progress for missing user data', () => {
      expect(getBadgeProgress('fast_learner', {})).toEqual({ current: 0, needed: 10, percent: 0 });
    });
  });
});
