// Tests for special topic and custom logic badge conditions (e.g., SOAP Star, customCheck badges)
import {
  checkUnlock_SOAP_star_basic,
  checkUnlock_deep_tissue_devotee,
  checkUnlock_chakra_alchemist,
  checkUnlock_chakra_alchemist_2,
  checkUnlock_chakra_alchemist_3,
  checkUnlock_massage_maverick_chakras,
  checkBadgeUnlockByKey,
} from './badgeConditions';

describe('Special Topic & Custom Badge Conditions', () => {
  describe('SOAP Star Basic', () => {
    it('returns true for 10+ soapNotes or completed topic', () => {
      expect(checkUnlock_SOAP_star_basic({ correctAnswers: { soapNotes: 10 } })).toBe(true);
      expect(checkUnlock_SOAP_star_basic({ completedTopics: ["SOAP Notes"] })).toBe(true);
      expect(checkUnlock_SOAP_star_basic({ correctAnswers: { soapNotes: 5 }, completedTopics: [] })).toBe(false);
    });
  });

  describe('Deep Tissue Devotee', () => {
    it('returns true for 20+ deepTissue or completed topic', () => {
      expect(checkUnlock_deep_tissue_devotee({ correctAnswers: { deepTissue: 20 } })).toBe(true);
      expect(checkUnlock_deep_tissue_devotee({ completedTopics: ["Deep Tissue"] })).toBe(true);
      expect(checkUnlock_deep_tissue_devotee({ correctAnswers: { deepTissue: 10 }, completedTopics: [] })).toBe(false);
    });
  });

  describe('Chakra Alchemist', () => {
    it('returns true for correctAnswers.chakras >= 10/20/30', () => {
      expect(checkUnlock_chakra_alchemist({ correctAnswers: { chakras: 10 } })).toBe(true);
      expect(checkUnlock_chakra_alchemist_2({ correctAnswers: { chakras: 20 } })).toBe(true);
      expect(checkUnlock_chakra_alchemist_3({ correctAnswers: { chakras: 30 } })).toBe(true);
      expect(checkUnlock_chakra_alchemist({ correctAnswers: { chakras: 9 } })).toBe(false);
    });
  });

  describe('Massage Maverick Chakras', () => {
    it('returns true if completedTopics includes "Chakras"', () => {
      expect(checkUnlock_massage_maverick_chakras({ completedTopics: ["Chakras"] })).toBe(true);
      expect(checkUnlock_massage_maverick_chakras({ completedTopics: [] })).toBe(false);
    });
  });

  describe('checkBadgeUnlockByKey for custom badges', () => {
    it('returns true for SOAP_star_basic with correctAnswers', () => {
      expect(checkBadgeUnlockByKey('SOAP_star_basic', { correctAnswers: { soapNotes: 10 } })).toBe(true);
    });
    it('returns true for SOAP_star_basic with completedTopics', () => {
      expect(checkBadgeUnlockByKey('SOAP_star_basic', { completedTopics: ["SOAP Notes"] })).toBe(true);
    });
    it('returns false for SOAP_star_basic with insufficient data', () => {
      expect(checkBadgeUnlockByKey('SOAP_star_basic', { correctAnswers: { soapNotes: 5 }, completedTopics: [] })).toBe(false);
    });
  });
});
