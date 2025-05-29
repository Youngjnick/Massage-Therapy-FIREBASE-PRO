const badges = [
  {
    id: "SOAP_star_basic",
    name: "SOAP Star Basic",
    description: "Complete 10 SOAP-related questions with 80%+ accuracy"
  },
  {
    id: "accuracy_100",
    name: "Accuracy 100",
    description: "Score 100% on any quiz",
    type: "performance",
    tier: "gold",
    progress: { current: 0, required: 1 },
    date_earned: null,
    times_earned: 0,
    icon: "accuracy_100.png",
    animation: "glow",
    requires: ["first_quiz"],
    hidden: false,
    reward: { type: "coupon", value: "10% off" },
    expires_in_days: null,
    notification: "Congrats! You unlocked the {name} badge!",
    next_badges: ["accuracy_pro", "accuracy_master"],
    rarity: "epic",
    personal_message: "You did it, {username}! This badge is yours.",
    points: 100,
    xp: 250,
    renewable: true,
    shareable: true,
    share_message: "I just earned the {name} badge on Massage Therapy Smart Study!",
    customizable: true,
    customization_options: ["color", "emoji"],
    global_earned_count: 0,
    collection: "Performance",
    collection_bonus: { points: 500, reward: "Exclusive Avatar" }
  },
  {
    id: "first_quiz",
    name: "First Quiz",
    description: "Complete your very first quiz — the journey begins!",
    icon: "first_quiz.png"
  },
  {
    id: "badge_collector_2",
    name: "Badge Collector 2",
    description: "Earn 25 different badges",
    icon: "badge_collector_2.png"
  },
  {
    id: "reflexology_regent",
    name: "Reflexology Regent",
    description: "Score high on reflexology knowledge and practice.",
    icon: "reflexology_regent.png"
  },
  {
    id: "streak_3",
    name: "Consistency Spark",
    description: "Complete 3 sessions in 3 consecutive days.",
    icon: "streak_3.png"
  },
  {
    id: "streak_100",
    name: "Unstoppable",
    description: "100-day streak — no misses.",
    icon: "streak_100.png"
  }
];
export default badges;
