// --- DEDUPLICATION AND TYPE-SAFE EXPORTS BELOW ---
// Remove all duplicate function declarations for badge checkers. Only one export per function name, using the most type-safe and up-to-date version.
// All badge checkers should use the BadgeUser interface and nullish coalescing for safety.

export function checkUnlock_test(/* userStats, ... */) {
  // Always unlock for E2E or test users
  return true;
}

export interface BadgeUser {
  last_quiz_score?: number;
  total_quizzes?: number;
  badges?: Record<string, unknown>;
  current_streak_days?: number;
  questionsAnswered?: number;
  bookmarks?: unknown[];
  total_questions_answered?: number;
  correctAnswers?: Record<string, number>;
  completedTopics?: string[];
  streaksWithPerfectScores?: number;
  questionsAnsweredToday?: number;
  totalQuizzes?: number;
  uid?: string;
  firstLogin?: boolean;
  firstSession?: boolean;
  // Add other known properties as needed
  [key: string]: unknown;
}

// --- Badge check functions (deduplicated, type-safe) ---
// --- Badge metadata for easier updates and config-driven logic ---
export interface BadgeConditionMeta {
  key: string;
  label: string;
  description: string;
  threshold?: number;
  topic?: string;
  property?: string;
  logicType?: 'threshold' | 'topic' | 'custom';
  customCheck?: (user: BadgeUser) => boolean;
  category?: string; // Added for UI grouping
}

export const BADGE_CONDITIONS_META: BadgeConditionMeta[] = [
  {
    key: 'accuracy_100',
    label: '100% Accuracy',
    description: 'Score 100% on a quiz',
    threshold: 100,
    property: 'last_quiz_score',
    logicType: 'threshold',
    category: 'Performance',
  },
  {
    key: 'first_quiz',
    label: 'First Quiz',
    description: 'Complete your first quiz',
    threshold: 1,
    property: 'total_quizzes',
    logicType: 'threshold',
    category: 'Milestones',
  },
  {
    key: 'streak_3',
    label: '3-Day Streak',
    description: 'Achieve a 3-day quiz streak',
    threshold: 3,
    property: 'current_streak_days',
    logicType: 'threshold',
    category: 'Streaks',
  },
  {
    key: 'fast_learner',
    label: 'Fast Learner',
    description: 'Answer 10 questions',
    threshold: 10,
    property: 'questionsAnswered',
    logicType: 'threshold',
    category: 'Participation',
  },
  {
    key: 'first_steps',
    label: 'First Steps',
    description: 'Answer your first question',
    threshold: 1,
    property: 'questionsAnswered',
    logicType: 'threshold',
    category: 'Participation',
  },
  {
    key: 'SOAP_star_basic',
    label: 'SOAP Star Basic',
    description: '10 correct SOAP Notes answers or complete SOAP Notes topic',
    threshold: 10,
    property: 'soapNotes',
    topic: 'SOAP Notes',
    logicType: 'custom',
    category: 'Special Topics',
    customCheck: (user: BadgeUser) => {
      const correctAnswers = (user.correctAnswers ?? {}) as Record<string, number>;
      const completedTopics = (user.completedTopics ?? []) as string[];
      return (correctAnswers.soapNotes ?? 0) >= 10 || completedTopics.includes('SOAP Notes');
    },
  },
  // ...add more badge metadata with categories as needed...
];

/**
 * Utility to get badge progress for threshold-based badges.
 * Returns { current, needed, percent } or null if not applicable.
 */
export function getBadgeProgress(badgeKey: string, user: BadgeUser): { current: number, needed: number, percent: number } | null {
  const meta = BADGE_CONDITIONS_META.find(b => b.key === badgeKey);
  if (!meta || typeof meta.threshold !== 'number' || !meta.property) return null;
  const value = (user[meta.property] ?? 0);
  if (typeof value !== 'number') return null;
  const current = value;
  const needed = meta.threshold;
  const percent = Math.min(100, Math.round((current / needed) * 100));
  return { current, needed, percent };
}

/**
 * Generic badge unlock checker that uses BADGE_CONDITIONS_META config.
 * Falls back to customCheck if logicType is 'custom'.
 */
export function checkBadgeUnlockByKey(key: string, user: BadgeUser): boolean {
  const meta = BADGE_CONDITIONS_META.find(b => b.key === key);
  if (!meta) return false;
  if (meta.logicType === 'custom' && meta.customCheck) {
    return meta.customCheck(user);
  }
  if (meta.logicType === 'topic' && meta.topic) {
    return ((user.completedTopics ?? []) as string[]).includes(meta.topic);
  }
  if (meta.logicType === 'threshold' && meta.property && typeof meta.threshold === 'number') {
    // @ts-ignore
    return (user[meta.property] ?? 0) >= meta.threshold;
  }
  return false;
}

/**
 * Unlocks the '100% Accuracy' badge if the user's last quiz score is 100 or higher.
 * @param user BadgeUser
 * @returns boolean
 */
export function checkUnlock_accuracy_100(user: BadgeUser): boolean { return (user.last_quiz_score ?? 0) >= 100; }

/**
 * Unlocks the 'First Quiz' badge if the user has completed at least one quiz.
 * @param user BadgeUser
 * @returns boolean
 */
export function checkUnlock_first_quiz(user: BadgeUser): boolean { return (user.total_quizzes ?? 0) >= 1; }

/**
 * Unlocks the '3-Day Streak' badge if the user has a streak of 3 days or more.
 * @param user BadgeUser
 * @returns boolean
 */
export function checkUnlock_streak_3(user: BadgeUser): boolean { return (user.current_streak_days ?? 0) >= 3; }

/**
 * Unlocks the 'SOAP Star Basic' badge if the user has 10 correct SOAP Notes answers or completed the SOAP Notes topic.
 * @param user BadgeUser
 * @returns boolean
 */
export function checkUnlock_SOAP_star_basic(user: BadgeUser): boolean {
  const correctAnswers = (user.correctAnswers ?? {}) as Record<string, number>;
  const completedTopics = (user.completedTopics ?? []) as string[];
  return (correctAnswers.soapNotes ?? 0) >= 10 || completedTopics.includes("SOAP Notes");
}
export function checkUnlock_accuracy_90(user: BadgeUser) { return (user.last_quiz_score ?? 0) >= 90; }
export function checkUnlock_accuracy_master(user: BadgeUser) { return (user.last_quiz_score ?? 0) >= 95; }
export function checkUnlock_accuracy_master_gold(user: BadgeUser) { return (user.last_quiz_score ?? 0) >= 98; }
export function checkUnlock_accuracy_pro(user: BadgeUser) { return (user.last_quiz_score ?? 0) >= 90; }
export function checkUnlock_accuracy_pro_gold(user: BadgeUser) { return (user.last_quiz_score ?? 0) >= 95; }
export function checkUnlock_accuracy_top_10(user: BadgeUser) { return (user.last_quiz_score ?? 0) >= 85; }
export function checkUnlock_accuracy_top_10_gold(user: BadgeUser) { return (user.last_quiz_score ?? 0) >= 90; }
export function checkUnlock_anatomy_ace_arm(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 10; }
export function checkUnlock_assessment_ace_1(user: BadgeUser) { return (user.total_quizzes ?? 0) >= 10; }
export function checkUnlock_badge_collector(user: BadgeUser) { return Object.keys(user.badges || {}).length >= 10; }
export function checkUnlock_badge_collector_2(user: BadgeUser) { return Object.keys(user.badges || {}).length >= 25; }
export function checkUnlock_badge_vault_complete(user: BadgeUser) { return Object.keys(user.badges || {}).length >= 50; }
export function checkUnlock_bone_baron_small(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 20; }
export function checkUnlock_bookmarked(user: BadgeUser) { return (user.bookmarks || []).length >= 1; }
export function checkUnlock_brain_boss_elite_green(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 50; }
export function checkUnlock_brain_boss_elite_white(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 50; }
export function checkUnlock_breathe_easy_gold(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 50; }
export function checkUnlock_chakra_alchemist(user: BadgeUser) { return (user.correctAnswers?.chakras ?? 0) >= 10; }
export function checkUnlock_chakra_alchemist_2(user: BadgeUser) { return (user.correctAnswers?.chakras ?? 0) >= 20; }
export function checkUnlock_chakra_alchemist_3(user: BadgeUser) { return (user.correctAnswers?.chakras ?? 0) >= 30; }
export function checkUnlock_circulatory_commander(user: BadgeUser) { return (user.correctAnswers?.cardiovascular ?? 0) >= 20; }
export function checkUnlock_client_whisperer(user: BadgeUser) { return (user.correctAnswers?.ethics ?? 0) >= 15 || (user.streaksWithPerfectScores ?? 0) >= 3; }
export function checkUnlock_crammer_hammer(user: BadgeUser) { return (user.questionsAnsweredToday ?? 0) >= 100; }
export function checkUnlock_deep_tissue_devotee(user: BadgeUser) { return (user.correctAnswers?.deepTissue ?? 0) >= 20 || ((user.completedTopics ?? []) as string[]).includes("Deep Tissue"); }
export function checkUnlock_foot_focus(user: BadgeUser) { return (user.correctAnswers?.footMuscles ?? 0) >= 20; }
export function checkUnlock_lower_limb_legend_basic(user: BadgeUser) { return (user.correctAnswers?.lowerLimb ?? 0) >= 30; }
export function checkUnlock_massage_maverick_chakras(user: BadgeUser) { return ((user.completedTopics ?? []) as string[]).includes("Chakras"); }
export function checkUnlock_muscle_monarch(user: BadgeUser) { return (user.correctAnswers?.muscleGroups ?? 0) >= 50; }
export function checkUnlock_neuro_dominator(user: BadgeUser) { return (user.correctAnswers?.neuroanatomy ?? 0) >= 50; }
export function checkUnlock_palpation_pro(user: BadgeUser) { return (user.correctAnswers?.palpation ?? 0) >= 30; }
export function checkUnlock_palpation_pro_2(user: BadgeUser) { return (user.correctAnswers?.palpation ?? 0) >= 60; }
export function checkUnlock_pathology_apprentice(user: BadgeUser) { return (user.correctAnswers?.pathology ?? 0) >= 10; }
export function checkUnlock_pathology_adept(user: BadgeUser) { return (user.correctAnswers?.pathology ?? 0) >= 30; }
export function checkUnlock_pathology_pro(user: BadgeUser) { return (user.correctAnswers?.pathology ?? 0) >= 50; }
export function checkUnlock_stretch_specialist(user: BadgeUser) { return (user.correctAnswers?.stretching ?? 0) >= 10; }
export function checkUnlock_stretch_specialist_2(user: BadgeUser) { return (user.correctAnswers?.stretching ?? 0) >= 30; }
export function checkUnlock_synapse_sage(user: BadgeUser) { return (user.correctAnswers?.nervousSystem ?? 0) >= 50; }
export function checkUnlock_core_control(user: BadgeUser) { return (user.correctAnswers?.coreMuscles ?? 0) >= 20; }
export function checkUnlock_core_control_gold(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 20; }
export function checkUnlock_cortical_commander(user: BadgeUser) { return (user.correctAnswers?.neuroanatomy ?? 0) >= 30; }
export function checkUnlock_cryotherapy_conquerer(user: BadgeUser) { return (user.correctAnswers?.cryotherapy ?? 0) >= 10; }
export function checkUnlock_fascial_flowmaster(user: BadgeUser) { return (user.correctAnswers?.fascia ?? 0) >= 30; }
export function checkUnlock_fast_learner(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 10; }
export function checkUnlock_first_steps(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 1; }
export function checkUnlock_flexor_signal_master_no_bkg(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 30; }
export function checkUnlock_heart_throb_gold(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 30; }
export function checkUnlock_heart_throb(user: BadgeUser) { return (user.correctAnswers?.cardiovascular ?? 0) >= 25; }
export function checkUnlock_lymphatic_legend(user: BadgeUser) { return (user.correctAnswers?.lymphaticSystem ?? 0) >= 20; }
export function checkUnlock_marrow_mage(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 10; }
export function checkUnlock_myofascial_maestro_chest(user: BadgeUser) { return (user.correctAnswers?.chestFascia ?? 0) >= 15; }
export function checkUnlock_myofascial_maestro_fascia(user: BadgeUser) { return (user.correctAnswers?.fascia ?? 0) >= 60; }
export function checkUnlock_nerve_navigator(user: BadgeUser) { return (user.correctAnswers?.nerves ?? 0) >= 40; }
export function checkUnlock_qi_flow_facilitator(user: BadgeUser) { return ((user.completedTopics ?? []) as string[]).includes("Qi") || (user.correctAnswers?.qiConcepts ?? 0) >= 10; }
export function checkUnlock_quiz_thousand_club(user: BadgeUser) { return (user.total_questions_answered ?? 0) >= 1000; }
export function checkUnlock_shiatsu_sensei(user: BadgeUser) { return ((user.completedTopics ?? []) as string[]).includes("Shiatsu") && (user.totalQuizzes ?? 0) >= 3; }
export function checkUnlock_skeletal_scholar(user: BadgeUser) { return (user.correctAnswers?.skeletalSystem ?? 0) >= 30; }
export function checkUnlock_skeletal_scholar_2(user: BadgeUser) { return (user.correctAnswers?.skeletalSystem ?? 0) >= 60; }
export function checkUnlock_spinal_elite(user: BadgeUser) { return (user.correctAnswers?.spine ?? 0) >= 40; }
export function checkUnlock_sports_recovery_ace_ice(user: BadgeUser) { return (user.correctAnswers?.sportsRecovery ?? 0) >= 10; }
export function checkUnlock_streak_20(user: BadgeUser) { return (user.current_streak_days ?? 0) >= 20; }
export function checkUnlock_streak_200(user: BadgeUser) { return (user.current_streak_days ?? 0) >= 200; }
export function checkUnlock_streak_5(user: BadgeUser) { return (user.current_streak_days ?? 0) >= 5; }
export function checkUnlock_streak_50(user: BadgeUser) { return (user.current_streak_days ?? 0) >= 50; }
export function checkUnlock_streak_500(user: BadgeUser) { return (user.current_streak_days ?? 0) >= 500; }
export function checkUnlock_summary(user: BadgeUser) { return (user.questionsAnswered ?? 0) >= 10; }
export function checkUnlock_swedish_specialist(user: BadgeUser) { return ((user.completedTopics ?? []) as string[]).includes("Swedish Massage") && (user.totalQuizzes ?? 0) >= 3; }
export function checkUnlock_swedish_specialist_basic(user: BadgeUser) { return ((user.completedTopics ?? []) as string[]).includes("Swedish Massage"); }
export function checkUnlock_therapeutic_titan_1(user: BadgeUser) { return (user.correctAnswers?.therapeuticPrinciples ?? 0) >= 15; }
export function checkUnlock_therapeutic_titan_2(user: BadgeUser) { return (user.correctAnswers?.therapeuticPrinciples ?? 0) >= 30; }
export function checkUnlock_therapeutic_titan_3(user: BadgeUser) { return (user.correctAnswers?.therapeuticPrinciples ?? 0) >= 50; }
export function checkUnlock_thorax_titan(user: BadgeUser) { return (user.correctAnswers?.thorax ?? 0) >= 25; }
export function checkUnlock_thorax_titan_2(user: BadgeUser) { return (user.correctAnswers?.thorax ?? 0) >= 50; }