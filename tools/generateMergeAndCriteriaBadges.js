import fs from "fs";
import path from "path";

// --- CONFIG ---
const BADGES_DIR = path.join(process.cwd(), "badges");
const OUTPUT_JSON = path.join(process.cwd(), "badgescriteria.json");
const OUTPUT_JS = path.join(process.cwd(), "badgescriteria.js");
// Optional: merge in extra criteria from a JSON file
const EXTRA_CRITERIA_FILE = path.join(process.cwd(), "badgesCriteriaToAdd.json");

// --- Badge Descriptions ---
const badgeDescriptions = {
  SOAP_star_basic: "Complete 10 SOAP-related questions with 80%+ accuracy",
  accuracy_100: "Score 100% on any quiz",
  accuracy_90: "Maintain 90%+ accuracy over 5 quizzes",
  accuracy_master: "Maintain 90%+ accuracy across 100 questions",
  accuracy_pro: "Score 95%+ on 10 different quizzes",
  accuracy_pro_gold: "Maintain 95%+ accuracy for 30 days",
  "accuracy_top_10%": "Be in the top 10% for accuracy globally",
  "anatomy-ace-arm": "Score 90%+ on 20 arm anatomy questions",
  assessment_ace_1: "Complete 20 clinical assessment questions with 85%+ accuracy",
  "badge collector": "Earn 10 different badges",
  badge_collector_2: "Earn 25 different badges",
  badge_vault_complete: "Unlock all badges in the app",
  bone_baron_small: "Score 80%+ on 20 skeletal system questions",
  bookmarked: "Bookmark 10 questions for later review",
  brain_boss_gold: "Master all nervous system quizzes (90%+ on 40 questions)",
  breathe_easy_gold: "Complete 20 respiratory anatomy questions with 85%+ accuracy",
  chakra_alchemist: "Answer 10 chakra-related questions correctly",
  chakra_alchemist_2: "Score 90%+ on 25 chakra-related questions",
  chakra_alchemist_open: "Open all chakra badge tiers",
  chakra_alchemist_pots: "Answer all chakra + meridian crossover questions",
  client_whisperer: "Score 85%+ on ethics and communication questions (30+ total)",
  comeback_kid: "Regain a 7-day streak after missing 3+ days",
  core_control: "Answer 20 trunk/core anatomy questions with 80%+ accuracy",
  core_control_gold: "Score 90%+ on core muscles and stabilizers (40 questions)",
  crammer_hammer: "Complete 100 questions in one session",
  cranial_champion: "Answer 10 cranial nerve questions correctly",
  cranial_champion_2: "Answer 25 cranial nerve questions with 90%+ accuracy",
  deep_tissue_devotee: "Score 90%+ on 20 deep tissue technique questions",
  digestive_dynamo: "Answer 20 GI system questions with 85%+ accuracy",
  fascial_flowmaster: "Answer 25 myofascial-related questions with 90%+ accuracy",
  fast_learner: "Reach 80%+ accuracy on a new topic within 10 questions",
  first_quiz: "Complete your first quiz",
  first_steps: "Reach your first 3-day quiz streak",
  foot_focus: "Answer 20 foot anatomy or reflexology questions with 85%+ accuracy",
  "heart-throb-gold": "Score 95%+ on cardiovascular questions (30+)",
  "heart-throb": "Answer 15 circulatory system questions correctly",
  lower_limb_legend_basic: "Score 80%+ on 20 lower limb questions",
  lymphatic_legend: "Answer 15 lymphatic questions with 90%+ accuracy",
  massage_maverick_chakras: "Master chakra + energetic therapy questions",
  meridian_mapper: "Answer 15 meridian-related questions correctly",
  modality_monarch_gold: "Score 90%+ on 40 modality technique questions",
  muscle_monarch: "Answer 50 muscle action or innervation questions",
  myofascial_maestro_chest: "Score 85%+ on 20 chest myofascial questions",
  myofascial_maestro_fascia: "Complete all fascia-related question sets",
  nerve_navigator: "Answer 20 nerve innervation questions correctly",
  neuro_dominator: "Score 90%+ on 30+ neuroanatomy questions",
  palpation_pro: "Answer 15 palpation technique questions with 85%+ accuracy",
  palpation_pro_2: "Master all palpation quizzes with 90%+ accuracy",
  pathology_adept: "Score 80%+ on 25 pathology questions",
  pathology_adept_3: "Complete 3 pathology levels with 85%+ accuracy each",
  pathology_apprentice: "Answer 10 pathology questions correctly",
  pathology_pro: "Answer 50 pathology questions with 90%+ accuracy",
  perfect_run: "Get 100% on a full 50-question quiz",
  qi_flow_facilitator: "Answer 15 questions on energy flow or qi concepts",
  quiz_thousand_club: "Answer 1000 questions total",
  reflexology_regent: "Score 85%+ on 20 reflexology questions",
  sanitation_specialist: "Answer 15 questions on hygiene and sanitation correctly",
  shiatsu_sensei: "Answer 20 shiatsu/acupressure questions with 90%+ accuracy",
  "skeletal-scholar": "Master 30+ skeletal system questions with 90%+ accuracy",
  spinal_elite: "Answer 20 spinal anatomy or nerve questions correctly",
  sports_recovery_ace_ice: "Score 85%+ on sports massage or ice treatment questions",
  streak_100: "Reach a 100-day quiz streak",
  streak_20: "Reach a 20-day quiz streak",
  streak_200: "Reach a 200-day quiz streak",
  streak_50: "Reach a 50-day quiz streak",
  streak_500: "Reach a 500-day quiz streak",
  streak_day_3: "Quiz 3 days in a row",
  streak_day_7: "Quiz 7 days in a row",
  "stretch-specialist_2": "Answer 20 stretch-related technique questions",
  stretch_specialist: "Score 85%+ on stretch techniques",
  summary: "Complete 50 summary-style questions across multiple categories",
  swedish_specialist: "Answer 20 Swedish technique questions with 85%+ accuracy",
  swedish_specialist_basic: "Score 80%+ on 10 Swedish massage questions",
  swedish_specialist_pro: "Master all Swedish massage quizzes (90%+ total)",
  therapeutic_titan_1: "Score 85%+ on 25 therapeutic strategy questions",
  therapeutic_titan_2: "Score 90%+ on 40 therapeutic strategy questions",
  thorax_titan: "Score 80%+ on thorax-related anatomy questions",
  thorax_titan_2: "Score 90%+ on thoracic region questions (30+)",
  treatment_strategist_pink: "Answer 20 treatment planning questions",
  treatment_strategist_purple: "Master all treatment planning questions",
  treatment_tactician: "Answer 30 treatment strategy questions with 85%+ accuracy",
  trigger_champ: "Answer 20 trigger point therapy questions",
  ultimate_anatomy: "Answer 100 different anatomy questions with 90%+ accuracy",
  vital_volume: "Score 85%+ on respiratory volume questions",
  welcome: "Log in for the first time"
};

// --- 1. Read badge image files ---
const files = fs.readdirSync(BADGES_DIR);
const baseBadges = files
  .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
  .map(f => {
    const id = f.replace(/\.(png|jpg|jpeg)$/i, "");
    const name = id.replace(/[_\-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const description = badgeDescriptions[id] || "";
    return { id, name, description };
  });

// --- 2. Optionally merge in extra criteria ---
let extraCriteria = [];
if (fs.existsSync(EXTRA_CRITERIA_FILE)) {
  try {
    extraCriteria = JSON.parse(fs.readFileSync(EXTRA_CRITERIA_FILE, "utf-8"));
  } catch (e) {
    console.warn("Could not parse extra criteria file:", e);
  }
}
const criteriaMap = {};
extraCriteria.forEach(c => { if (c && c.id) {criteriaMap[c.id] = c;} });

// --- 3. Merge badges ---
const merged = baseBadges.map(badge => {
  const c = criteriaMap[badge.id];
  if (c) {
    const { title, ...rest } = c;
    return {
      id: badge.id,
      name: title || badge.name,
      description: c.description || badge.description || "",
      ...rest
    };
  }
  return badge;
});

// Add any extra criteria badges not in baseBadges
extraCriteria.forEach(c => {
  if (c && c.id && !merged.find(b => b.id === c.id)) {
    const { title, ...rest } = c;
    merged.push({
      id: c.id,
      name: title || c.id,
      description: c.description || "",
      ...rest
    });
  }
});

// Prefer the badge with more keys (more detailed)
const badgeMap = {};
merged.forEach(b => {
  if (!badgeMap[b.id] || Object.keys(b).length > Object.keys(badgeMap[b.id]).length) {
    badgeMap[b.id] = b;
  }
});
const finalBadges = Object.values(badgeMap);

// --- 4. Write output ---
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(finalBadges, null, 2), "utf8");
console.log(`badgescriteria.json generated with ${finalBadges.length} badges.`);

let jsOutput = "const badges = " + JSON.stringify(finalBadges, null, 2) + ";\nexport default badges;\n";
fs.writeFileSync(OUTPUT_JS, jsOutput, "utf8");
console.log(`badgescriteria.js generated with ${finalBadges.length} badges.`);