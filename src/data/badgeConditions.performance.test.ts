// Tests for performance-related badge conditions (accuracy, streaks, etc.)
import {
  checkUnlock_accuracy_100,
  checkUnlock_accuracy_90,
  checkUnlock_accuracy_master,
  checkUnlock_accuracy_master_gold,
  checkUnlock_accuracy_pro,
  checkUnlock_accuracy_pro_gold,
  checkUnlock_accuracy_top_10,
  checkUnlock_accuracy_top_10_gold,
  checkUnlock_streak_3,
  checkUnlock_streak_5,
  checkUnlock_streak_20,
  checkUnlock_streak_50,
  checkUnlock_streak_200,
  checkUnlock_streak_500,
  getBadgeProgress,
} from './badgeConditions';

describe('Performance Badge Conditions', () => {
  describe('Accuracy Badges', () => {
    it.each([
      [{ last_quiz_score: 100 }, true],
      [{ last_quiz_score: 99 }, false],
    ])('checkUnlock_accuracy_100 returns %s for %j', (input, expected) => {
      expect(checkUnlock_accuracy_100(input)).toBe(expected);
    });
    it('checkUnlock_accuracy_90', () => {
      expect(checkUnlock_accuracy_90({ last_quiz_score: 90 })).toBe(true);
      expect(checkUnlock_accuracy_90({ last_quiz_score: 89 })).toBe(false);
    });
    it('checkUnlock_accuracy_master', () => {
      expect(checkUnlock_accuracy_master({ last_quiz_score: 95 })).toBe(true);
      expect(checkUnlock_accuracy_master({ last_quiz_score: 94 })).toBe(false);
    });
    it('checkUnlock_accuracy_master_gold', () => {
      expect(checkUnlock_accuracy_master_gold({ last_quiz_score: 98 })).toBe(true);
      expect(checkUnlock_accuracy_master_gold({ last_quiz_score: 97 })).toBe(false);
    });
    it('checkUnlock_accuracy_pro', () => {
      expect(checkUnlock_accuracy_pro({ last_quiz_score: 90 })).toBe(true);
      expect(checkUnlock_accuracy_pro({ last_quiz_score: 89 })).toBe(false);
    });
    it('checkUnlock_accuracy_pro_gold', () => {
      expect(checkUnlock_accuracy_pro_gold({ last_quiz_score: 95 })).toBe(true);
      expect(checkUnlock_accuracy_pro_gold({ last_quiz_score: 94 })).toBe(false);
    });
    it('checkUnlock_accuracy_top_10', () => {
      expect(checkUnlock_accuracy_top_10({ last_quiz_score: 85 })).toBe(true);
      expect(checkUnlock_accuracy_top_10({ last_quiz_score: 84 })).toBe(false);
    });
    it('checkUnlock_accuracy_top_10_gold', () => {
      expect(checkUnlock_accuracy_top_10_gold({ last_quiz_score: 90 })).toBe(true);
      expect(checkUnlock_accuracy_top_10_gold({ last_quiz_score: 89 })).toBe(false);
    });
  });

  describe('Streak Badges', () => {
    it('checkUnlock_streak_3', () => {
      expect(checkUnlock_streak_3({ current_streak_days: 3 })).toBe(true);
      expect(checkUnlock_streak_3({ current_streak_days: 2 })).toBe(false);
    });
    it('checkUnlock_streak_5', () => {
      expect(checkUnlock_streak_5({ current_streak_days: 5 })).toBe(true);
      expect(checkUnlock_streak_5({ current_streak_days: 4 })).toBe(false);
    });
    it('checkUnlock_streak_20', () => {
      expect(checkUnlock_streak_20({ current_streak_days: 20 })).toBe(true);
      expect(checkUnlock_streak_20({ current_streak_days: 19 })).toBe(false);
    });
    it('checkUnlock_streak_50', () => {
      expect(checkUnlock_streak_50({ current_streak_days: 50 })).toBe(true);
      expect(checkUnlock_streak_50({ current_streak_days: 49 })).toBe(false);
    });
    it('checkUnlock_streak_200', () => {
      expect(checkUnlock_streak_200({ current_streak_days: 200 })).toBe(true);
      expect(checkUnlock_streak_200({ current_streak_days: 199 })).toBe(false);
    });
    it('checkUnlock_streak_500', () => {
      expect(checkUnlock_streak_500({ current_streak_days: 500 })).toBe(true);
      expect(checkUnlock_streak_500({ current_streak_days: 499 })).toBe(false);
    });
  });

  describe('getBadgeProgress', () => {
    it('returns correct progress for accuracy_100', () => {
      expect(getBadgeProgress('accuracy_100', { last_quiz_score: 50 })).toEqual({ current: 50, needed: 100, percent: 50 });
    });
    it('returns correct progress for streak badges', () => {
      expect(getBadgeProgress('streak_3', { current_streak_days: 2 })).toEqual({ current: 2, needed: 3, percent: 67 });
    });
  });
});
