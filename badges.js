const badges = [
	{
		id: "SOAP_star_basic",
		name: "SOAP Star Basic",
		description: "Complete 10 SOAP-related questions with 80%+ accuracy",
	},
	{
		id: "accuracy_100",
		name: "Accuracy 100",
		description: "Score 100% on any quiz",
		type: "performance", // Badge Types & Categories
		tier: "gold", // Badge Levels or Tiers
		progress: { current: 0, required: 1 }, // Progress Tracking
		date_earned: null, // Date Earned & History
		times_earned: 0, // Date Earned & History
		icon: "accuracy_100.png", // Visuals & Animations
		animation: "glow", // Visuals & Animations
		requires: ["first_quiz"], // Dependencies/Unlock Conditions
		hidden: false, // Hidden/Secret Badges
		reward: { type: "coupon", value: "10% off" }, // Reward Actions
		expires_in_days: null, // Badge Expiry
		notification: "Congrats! You unlocked the {name} badge!", // Custom Notification
		next_badges: ["accuracy_pro", "accuracy_master"], // Badge Progression Paths
		rarity: "epic", // Badge Rarity
		personal_message: "You did it, {username}! This badge is yours.", // Personalized Message
		points: 100, // Badge Points / XP
		xp: 250, // Badge XP
		renewable: true, // Badge Expiry & Renewal
		shareable: true, // Badge Sharing
		share_message: "I just earned the {name} badge on Massage Therapy Smart Study!", // Share Message
		customizable: true, // Badge Customization
		customization_options: ["color", "emoji"], // Customization Options
		global_earned_count: 0, // Badge Analytics
		on_progress: (user, progress) => { /* custom logic */ }, // Progress Hooks
		collection: "Performance", // Badge Collections
		collection_bonus: { points: 500, reward: "Exclusive Avatar" }, // Collection Bonus
	},
	{
		id: "accuracy_90",
		name: "Accuracy 90",
		description: "Maintain 90%+ accuracy over 5 quizzes",
	},
	{
		id: "accuracy_master",
		name: "Accuracy Master",
		description: "Maintain 90%+ accuracy across 100 questions",
	},
	{
		id: "accuracy_pro",
		name: "Accuracy Pro",
		description: "Score 95%+ on 10 different quizzes",
	},
	{
		id: "accuracy_pro_gold",
		name: "Accuracy Pro Gold",
		description: "Maintain 95%+ accuracy for 30 days",
	},
	{
		id: "accuracy_top_10%",
		name: "Accuracy Top 10%",
		description: "Be in the top 10% for accuracy globally",
	},
	{
		id: "anatomy-ace-arm",
		name: "Anatomy Ace Arm",
		description: "Score 90%+ on 20 arm anatomy questions",
	},
	{
		id: "assessment_ace_1",
		name: "Assessment Ace 1",
		description: "Complete 20 clinical assessment questions with 85%+ accuracy",
	},
	{
		id: "badge collector",
		name: "Badge Collector",
		description: "Earn 10 different badges",
	},
	{
		id: "badge_collector_2",
		name: "Badge Collector 2",
		description: "Earn 25 different badges",
		tagline: "Collect 'em all!",
		unlock_logic: "Earn 25 different badges.",
		category: "Achievements",
	},
	{
		id: "badge_vault_complete",
		name: "Badge Vault Complete",
		description: "Unlock all badges in the app",
	},
	{
		id: "bone_baron_small",
		name: "Bone Baron Small",
		description: "Score 80%+ on 20 skeletal system questions",
	},
	{
		id: "bookmarked",
		name: "Bookmarked",
		description: "Bookmark 10 questions for later review",
	},
	{
		id: "brain_boss_gold",
		name: "Brain Boss Gold",
		description: "Master all nervous system quizzes (90%+ on 40 questions)",
	},
	{
		id: "breathe_easy_gold",
		name: "Breathe Easy Gold",
		description: "Complete 20 respiratory anatomy questions with 85%+ accuracy",
	},
	{
		id: "chakra_alchemist",
		name: "Chakra Alchemist",
		description: "Master the energetic systems and chakra theory.",
		tagline: "Energy aligned and activated.",
		unlock_logic: "Answer 10 chakra-related questions correctly.",
		category: "Energy Systems",
	},
	{
		id: "chakra_alchemist_2",
		name: "Chakra Alchemist 2",
		description: "Score 90%+ on 25 chakra-related questions",
	},
	{
		id: "chakra_alchemist_open",
		name: "Chakra Alchemist Open",
		description: "Open all chakra badge tiers",
	},
	{
		id: "chakra_alchemist_pots",
		name: "Chakra Alchemist Pots",
		description: "Answer all chakra + meridian crossover questions",
	},
	{
		id: "client_whisperer",
		name: "Client Whisperer",
		description: "Score 85%+ on ethics and communication questions (30+ total)",
	},
	{
		id: "comeback_kid",
		name: "Comeback Kid",
		description: "Regain a 7-day streak after missing 3+ days",
	},
	{
		id: "core_control",
		name: "Core Control",
		description: "Answer 20 trunk/core anatomy questions with 80%+ accuracy",
	},
	{
		id: "core_control_gold",
		name: "Core Control Gold",
		description: "Score 90%+ on core muscles and stabilizers (40 questions)",
	},
	{
		id: "crammer_hammer",
		name: "Crammer Hammer",
		description: "Complete 100 questions in one session",
	},
	{
		id: "cranial_champion",
		name: "Cranial Champion",
		description: "Answer 10 cranial nerve questions correctly",
	},
	{
		id: "cranial_champion_2",
		name: "Cranial Champion 2",
		description: "Answer 25 cranial nerve questions with 90%+ accuracy",
	},
	{
		id: "deep_tissue_devotee",
		name: "Deep Tissue Devotee",
		description: "Score 90%+ on 20 deep tissue technique questions",
	},
	{
		id: "digestive_dynamo",
		name: "Digestive Dynamo",
		description: "Master anatomy and function of the digestive system.",
		tagline: "Digest the details!",
		unlock_logic: "Score 85%+ on digestive anatomy questions.",
		category: "Anatomy",
	},
	{
		id: "fascial_flowmaster",
		name: "Fascial Flowmaster",
		description: "Answer 25 myofascial-related questions with 90%+ accuracy",
	},
	{
		id: "fast_learner",
		name: "Fast Learner",
		description: "Reach 80%+ accuracy on a new topic within 10 questions",
	},
	{
		id: "first_quiz",
		name: "First Quiz",
		description: "Complete your very first quiz — the journey begins!",
		tagline: "Welcome to the journey.",
		unlock_logic: "Complete your first quiz.",
		category: "Milestone",
	},
	{
		id: "first_steps",
		name: "First Steps",
		description: "Reach your first 3-day quiz streak",
	},
	{
		id: "foot_focus",
		name: "Foot Focus",
		description: "Answer 20 foot anatomy or reflexology questions with 85%+ accuracy",
	},
	{
		id: "heart-throb-gold",
		name: "Heart Throb Gold",
		description: "Score 95%+ on cardiovascular questions (30+)",
	},
	{
		id: "heart-throb",
		name: "Heart Throb",
		description: "Answer 15 circulatory system questions correctly",
	},
	{
		id: "lower_limb_legend_basic",
		name: "Lower Limb Legend Basic",
		description: "Score 80%+ on 20 lower limb questions",
	},
	{
		id: "lymphatic_legend",
		name: "Lymphatic Legend",
		description: "Answer 15 lymphatic questions with 90%+ accuracy",
	},
	{
		id: "massage_maverick_chakras",
		name: "Massage Maverick Chakras",
		description: "Master chakra + energetic therapy questions",
	},
	{
		id: "meridian_mapper",
		name: "Meridian Mapper",
		description: "Answer 15 meridian-related questions correctly",
	},
	{
		id: "modality_monarch_gold",
		name: "Modality Monarch Gold",
		description: "Score 90%+ on 40 modality technique questions",
	},
	{
		id: "muscle_monarch",
		name: "Muscle Monarch",
		description: "Answer 50 muscle action or innervation questions",
	},
	{
		id: "myofascial_maestro_chest",
		name: "Myofascial Maestro Chest",
		description: "Score 85%+ on 20 chest myofascial questions",
	},
	{
		id: "myofascial_maestro_fascia",
		name: "Myofascial Maestro Fascia",
		description: "Complete all fascia-related question sets",
	},
	{
		id: "nerve_navigator",
		name: "Nerve Navigator",
		description: "Answer 20 nerve innervation questions correctly",
	},
	{
		id: "neuro_dominator",
		name: "Neuro Dominator",
		description: "Score 90%+ on 30+ neuroanatomy questions",
	},
	{
		id: "palpation_pro",
		name: "Palpation Pro",
		description: "Answer 15 palpation technique questions with 85%+ accuracy",
	},
	{
		id: "palpation_pro_2",
		name: "Palpation Pro 2",
		description: "Master all palpation quizzes with 90%+ accuracy",
	},
	{
		id: "pathology_adept",
		name: "Pathology Adept",
		description: "Score 80%+ on 25 pathology questions",
	},
	{
		id: "pathology_adept_3",
		name: "Pathology Adept 3",
		description: "Complete 3 pathology levels with 85%+ accuracy each",
	},
	{
		id: "pathology_apprentice",
		name: "Pathology Apprentice",
		description: "Answer 10 pathology questions correctly",
	},
	{
		id: "pathology_pro",
		name: "Pathology Pro",
		description: "Answer 50 pathology questions with 90%+ accuracy",
	},
	{
		id: "perfect_run",
		name: "Perfect Run",
		description: "Get 100% on a full 50-question quiz",
	},
	{
		id: "qi_flow_facilitator",
		name: "Qi Flow Facilitator",
		description: "Answer 15 questions on energy flow or qi concepts",
	},
	{
		id: "quiz_thousand_club",
		name: "Quiz Thousand Club",
		description: "Answer 1000 questions total",
	},
	{
		id: "reflexology_regent",
		name: "Reflexology Regent",
		description: "Score high on reflexology knowledge and practice.",
		unlock_logic: "Master reflexology zone-based questions.",
		tagline: "Feet tell all.",
		unlock_logic: "Master reflexology zone-based questions.",
		category: "Modalities",
		group: "Modality Mastery",           // Badge group/quest
		set_id: "modality_set_001",          // Set/quest ID
		xp_reward: 200,                      // XP for earning
		rarity: "uncommon",                  // Rarity for analytics
		progress_max: 20,                    // For progress tracking (e.g. 20 questions)
		progress_current: 13,                // User's current progress
		tier: "silver",                      // For tiered badges (bronze/silver/gold)
		visual_progression: {                // Visual cues for tier/repeats
			glow_on_repeat: true,
			tier_color: "silver"
		},
		available_from: "2025-05-01",        // Time-limited challenge
		available_until: "2025-06-01",
		mastery_topic_id: "reflexology",     // For mastery map view
		suggested_based_on_topic: true,      // For smart badge suggestions
		closest_to_unlock: false,            // For smart suggestion engine
		earned_count_global: 421,            // Analytics: how many users earned
		earned_count_user: 1,                // Analytics: how many times user earned
		unlock_logic: "Score 85%+ on 20 reflexology questions.",
		notification: "Congrats! Reflexology Regent unlocked!",
		reward: { type: "avatar", value: "reflexology_crown" }
	},
	{
		id: "sanitation_specialist",
		name: "Sanitation Specialist",
		description: "Answer 15 questions on hygiene and sanitation correctly",
	},
	{
		id: "shiatsu_sensei",
		name: "Shiatsu Sensei",
		description: "Answer 20 shiatsu/acupressure questions with 90%+ accuracy",
	},
	{
		id: "skeletal-scholar",
		name: "Skeletal Scholar",
		description: "Master 30+ skeletal system questions with 90%+ accuracy",
	},
	{
		id: "spinal_elite",
		name: "Spinal Elite",
		description: "Answer 20 spinal anatomy or nerve questions correctly",
	},
	{
		id: "sports_recovery_ace_ice",
		name: "Sports Recovery Ace Ice",
		description: "Score 85%+ on sports massage or ice treatment questions",
	},
	{
		id: "streak_100",
		name: "Streak 100",
		description: "Reach a 100-day quiz streak",
	},
	{
		id: "streak_20",
		name: "Streak 20",
		description: "Reach a 20-day quiz streak",
	},
	{
		id: "streak_200",
		name: "Streak 200",
		description: "Reach a 200-day quiz streak",
	},
	{
		id: "streak_50",
		name: "Streak 50",
		description: "Reach a 50-day quiz streak",
	},
	{
		id: "streak_500",
		name: "Streak 500",
		description: "Reach a 500-day quiz streak",
	},
	{
		id: "streak_day_3",
		name: "Streak Day 3",
		description: "Quiz 3 days in a row",
	},
	{
		id: "streak_day_7",
		name: "Streak Day 7",
		description: "Quiz 7 days in a row",
	},
	{
		id: "stretch-specialist_2",
		name: "Stretch Specialist 2",
		description: "Answer 20 stretch-related technique questions",
	},
	{
		id: "stretch_specialist",
		name: "Stretch Specialist",
		description: "Score 85%+ on stretch techniques",
	},
	{
		id: "summary",
		name: "Summary",
		description: "Complete 50 summary-style questions across multiple categories",
	},
	{
		id: "swedish_specialist",
		name: "Swedish Specialist",
		description: "Answer 20 Swedish technique questions with 85%+ accuracy",
	},
	{
		id: "swedish_specialist_basic",
		name: "Swedish Specialist Basic",
		description: "Score 80%+ on 10 Swedish massage questions",
	},
	{
		id: "swedish_specialist_pro",
		name: "Swedish Specialist Pro",
		description: "Master all Swedish massage quizzes (90%+ total)",
	},
	{
		id: "therapeutic_titan_1",
		name: "Therapeutic Titan 1",
		description: "Score 85%+ on 25 therapeutic strategy questions",
	},
	{
		id: "therapeutic_titan_2",
		name: "Therapeutic Titan 2",
		description: "Score 90%+ on 40 therapeutic strategy questions",
	},
	{
		id: "thorax_titan",
		name: "Thorax Titan",
		description: "Score 80%+ on thorax-related anatomy questions",
	},
	{
		id: "thorax_titan_2",
		name: "Thorax Titan 2",
		description: "Score 90%+ on thoracic region questions (30+)",
	},
	{
		id: "treatment_strategist_pink",
		name: "Treatment Strategist Pink",
		description: "Answer 20 treatment planning questions",
	},
	{
		id: "treatment_strategist_purple",
		name: "Treatment Strategist Purple",
		description: "Master all treatment planning questions",
	},
	{
		id: "treatment_tactician",
		name: "Treatment Tactician",
		description: "Answer 30 treatment strategy questions with 85%+ accuracy",
	},
	{
		id: "trigger_champ",
		name: "Trigger Champ",
		description: "Excel in identifying and treating trigger points.",
		tagline: "Hit the right point every time.",
		unlock_logic: "Identify 20 trigger points correctly.",
		category: "Techniques",
	},
	{
		id: "ultimate_anatomy",
		name: "Ultimate Anatomy",
		description: "Answer 100 different anatomy questions with 90%+ accuracy",
	},
	{
		id: "vital_volume",
		name: "Vital Volume",
		description: "Score 85%+ on respiratory volume questions",
	},
	{
		id: "welcome",
		name: "Welcome",
		description: "Start your learning journey by completing your first quiz.",
		tagline: "Your path begins here.",
		unlock_logic: "Log in and complete one activity.",
		category: "Milestone",
	},
	{
		id: "streak_3",
		title: "Consistency Spark",
		streak_days_required: 3,
		description: "Complete 3 sessions in 3 consecutive days.",
		tagline: "Just getting warmed up!",
		badge_level: 1,
	},
	{
		id: "streak_5",
		title: "Momentum Builder",
		streak_days_required: 5,
		description: "Complete 5 sessions in 5 consecutive days.",
		tagline: "You're on fire!",
		badge_level: 2,
	},
	{
		id: "streak_10",
		title: "Daily Dynamo",
		streak_days_required: 10,
		description: "Complete 10 sessions over 10 straight days.",
		tagline: "Tenacious tempo!",
		badge_level: 3,
	},
	{
		id: "streak_20",
		title: "Focused Flame",
		streak_days_required: 20,
		description: "Maintain a 20-day streak.",
		tagline: "This flame doesn’t flicker.",
		badge_level: 4,
	},
	{
		id: "streak_50",
		title: "Master of Habit",
		streak_days_required: 50,
		description: "50 consecutive days of engagement.",
		tagline: "Daily discipline achieved.",
		badge_level: 5,
	},
	{
		id: "streak_100",
		title: "Unstoppable",
		streak_days_required: 100,
		description: "100-day streak — no misses.",
		tagline: "Triple digits. Unshakable.",
		badge_level: 6,
	},
	{
		id: "streak_200",
		title: "Legendary Flow",
		streak_days_required: 200,
		description: "Maintain a 200-day streak.",
		tagline: "Legendary rhythm unlocked.",
		badge_level: 7,
	},
	{
		id: "streak_500",
		title: "Eternal Flame",
		streak_days_required: 500,
		description: "500 days in a row.",
		tagline: "The streak of immortals.",
		badge_level: 8,
	},
	{
		id: "streak_3",
		title: "Consistency Spark",
		streak_days_required: 3,
		description: "Complete 3 sessions in 3 consecutive days.",
		tagline: "Just getting warmed up!",
		image_id: "streak_3",
		repeatable: true,
		forgiveness_grace_days: 0,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 1,
			message: "🔥 You're 1 day away from earning the Streak 3 badge!",
		},
	},
	{
		id: "streak_5",
		title: "Momentum Builder",
		streak_days_required: 5,
		description: "Complete 5 sessions in 5 consecutive days.",
		tagline: "You're on fire!",
		image_id: "streak_5",
		repeatable: true,
		forgiveness_grace_days: 0,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 2,
			message: "🔥 Keep it up! You're 2 days from the Streak 5 badge!",
		},
	},
	{
		id: "streak_10",
		title: "Daily Dynamo",
		streak_days_required: 10,
		description: "Complete 10 sessions over 10 straight days.",
		tagline: "Tenacious tempo!",
		image_id: "streak_10",
		repeatable: true,
		forgiveness_grace_days: 0,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 3,
			message: "⚡ Almost there! Just 3 more days to Streak 10!",
		},
	},
	{
		id: "streak_20",
		title: "Focused Flame",
		streak_days_required: 20,
		description: "Maintain a 20-day streak.",
		tagline: "This flame doesn’t flicker.",
		image_id: "streak_20",
		repeatable: true,
		forgiveness_grace_days: 1,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 5,
			message: "🔥 You're on track! 5 days left to earn Streak 20!",
		},
	},
	{
		id: "streak_50",
		title: "Master of Habit",
		streak_days_required: 50,
		description: "50 consecutive days of engagement.",
		tagline: "Daily discipline achieved.",
		image_id: "streak_50",
		repeatable: true,
		forgiveness_grace_days: 1,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 7,
			message: "💪 You're just 1 week from Streak 50!",
		},
	},
	{
		id: "streak_100",
		title: "Unstoppable",
		streak_days_required: 100,
		description: "100-day streak — no misses.",
		tagline: "Triple digits. Unshakable.",
		image_id: "streak_100",
		repeatable: true,
		forgiveness_grace_days: 2,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 10,
			message: "🚀 10 more days and you’ll unlock the Streak 100 badge!",
		},
	},
	{
		id: "streak_200",
		title: "Legendary Flow",
		streak_days_required: 200,
		description: "Maintain a 200-day streak.",
		tagline: "Legendary rhythm unlocked.",
		image_id: "streak_200",
		repeatable: true,
		forgiveness_grace_days: 4,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 20,
			message: "🌟 Only 20 days left to claim the Streak 200 badge!",
		},
	},
	{
		id: "streak_500",
		title: "Eternal Flame",
		streak_days_required: 500,
		description: "500 days in a row.",
		tagline: "The streak of immortals.",
		image_id: "streak_500",
		repeatable: true,
		forgiveness_grace_days: 10,
		visual_progression: { glow_on_repeat: true, threshold: 2 },
		smart_notifications: {
			trigger_days_before: 30,
			message: "🔥 You're within reach! 30 days until Streak 500!",
		},
	},
	{
		id: "streak_3x5",
		title: "Consistency Crusher",
		description: "Earn the Streak 3 badge five times.",
		tagline: "Mini-streak master!",
		image_id: "streak_3x5",
		unlock_condition: { base_badge: "streak_3", times_earned_required: 5 },
		visual_progression: { pulsating_flame: true, tier_color: "silver" },
	},
	{
		id: "streak_10x3",
		title: "Streak 10: Triple Threat",
		description: "Earn the Streak 10 badge three times.",
		tagline: "You keep coming back for more!",
		image_id: "streak_10x3",
		unlock_condition: { base_badge: "streak_10", times_earned_required: 3 },
		visual_progression: { pulsating_flame: true, tier_color: "gold" },
	},
	{
		id: "streak_20x3",
		title: "Focused Flame x3",
		description: "Earn the Streak 20 badge three times.",
		tagline: "Three perfect 20s? Now you’re blazing.",
		image_id: "streak_20x3",
		unlock_condition: { base_badge: "streak_20", times_earned_required: 3 },
		visual_progression: { pulsating_flame: true, tier_color: "platinum" },
	},
	{
		id: "streak_50x2",
		title: "Habitual Hero",
		description: "Earn the Streak 50 badge twice.",
		tagline: "Built different.",
		image_id: "streak_50x2",
		unlock_condition: { base_badge: "streak_50", times_earned_required: 2 },
		visual_progression: { aura: true, tier_color: "emerald" },
	},
]; // <-- badges array ends here
export default badges;