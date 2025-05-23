import fs from "fs";
import path from "path";
import minimist from "minimist";

// Master lists
const muscles = [
  "trapezius", "deltoid", "pectoralis", "latissimus", "gluteus", "hamstring", "quadriceps",
  "gastrocnemius", "soleus", "biceps", "triceps", "rhomboid", "levator scapulae",
  "sternocleidomastoid", "erector spinae", "iliopsoas", "adductor", "abductor", "flexor", "extensor"
  // ...add more as needed
];

const joints = [
  "joint", "synarthrotic", "amphiarthrotic", "diarthrotic", "fibrous joint", "cartilaginous joint",
  "synovial joint", "hinge joint", "ball and socket", "pivot joint", "saddle joint", "condyloid joint", "plane joint"
  // ...add more as needed
];

const nerves = [
  "sciatic nerve", "median nerve", "ulnar nerve", "radial nerve", "femoral nerve", "obturator nerve",
  "tibial nerve", "peroneal nerve", "axillary nerve", "musculocutaneous nerve", "phrenic nerve",
  "vagus nerve", "trigeminal nerve", "facial nerve", "accessory nerve", "hypoglossal nerve"
  // ...add more as needed
];

const bones = [
  "femur", "tibia", "fibula", "humerus", "radius", "ulna", "scapula", "clavicle", "sternum",
  "patella", "pelvis", "sacrum", "coccyx", "vertebra", "skull", "mandible", "maxilla", "ribs"
  // ...add more as needed
];

const arteries = [
  "aorta", "carotid artery", "brachial artery", "radial artery", "ulnar artery",
  "femoral artery", "popliteal artery", "posterior tibial artery", "dorsalis pedis artery"
  // ...add more as needed
];

const ligaments = [
  "anterior cruciate ligament", "posterior cruciate ligament", "medial collateral ligament",
  "lateral collateral ligament", "patellar ligament", "deltoid ligament"
  // ...add more as needed
];

const organs = [
  "heart", "lungs", "liver", "kidneys", "stomach", "pancreas", "spleen", "intestines", "bladder"
  // ...add more as needed
];

// Auto-generate keywordTags for muscles and joints
const muscleTags = muscles.map(muscle => ({
  keyword: muscle,
  tag: `muscle_${muscle.replace(/\s+/g, "_").toLowerCase()}`
}));

const jointTags = joints.map(joint => ({
  keyword: joint,
  tag: `joint_${joint.replace(/\s+/g, "_").toLowerCase()}`
}));

const nerveTags = nerves.map(nerve => ({
  keyword: nerve,
  tag: `nerve_${nerve.replace(/\s+/g, "_").toLowerCase()}`
}));

const boneTags = bones.map(bone => ({
  keyword: bone,
  tag: `bone_${bone.replace(/\s+/g, "_").toLowerCase()}`
}));

const arteryTags = arteries.map(artery => ({
  keyword: artery,
  tag: `artery_${artery.replace(/\s+/g, "_").toLowerCase()}`
}));

const ligamentTags = ligaments.map(ligament => ({
  keyword: ligament,
  tag: `ligament_${ligament.replace(/\s+/g, "_").toLowerCase()}`
}));

const organTags = organs.map(organ => ({
  keyword: organ,
  tag: `organ_${organ.replace(/\s+/g, "_").toLowerCase()}`
}));

// --- CONFIGURABLE KEYWORDS FOR AUTO-TAGGING ---
const keywordTags = [
  // Modalities & Techniques
  { keyword: "massage", tag: "modality_massage" },
  { keyword: "swedish", tag: "modality_swedish" },
  { keyword: "deep tissue", tag: "modality_deep_tissue" },
  { keyword: "myofascial", tag: "modality_myofascial" },
  { keyword: "trigger point", tag: "modality_trigger_point" },
  { keyword: "sports", tag: "modality_sports" },
  { keyword: "shiatsu", tag: "modality_shiatsu" },
  { keyword: "reflexology", tag: "modality_reflexology" },
  { keyword: "ashiatsu", tag: "modality_ashiatsu" },
  { keyword: "trager", tag: "modality_trager" },
  { keyword: "rolfing", tag: "modality_rolfing" },
  { keyword: "tui na", tag: "modality_tuina" },
  { keyword: "craniosacral", tag: "modality_craniosacral" },
  { keyword: "lymphatic drainage", tag: "modality_lymphatic_drainage" },
  { keyword: "connective tissue massage", tag: "modality_ctm" },
  { keyword: "aromatherapy", tag: "modality_aromatherapy" },
  { keyword: "thai", tag: "modality_thai" },
  { keyword: "chavutti", tag: "modality_chavutti" },
  { keyword: "acupressure", tag: "modality_acupressure" },
  { keyword: "soft tissue massage", tag: "modality_soft_tissue_massage" },

  // 7 Classic Massage Techniques
  { keyword: "effleurage", tag: "technique_effleurage" },
  { keyword: "petrissage", tag: "technique_petrissage" },
  { keyword: "friction", tag: "technique_friction" },
  { keyword: "tapotement", tag: "technique_tapotement" },
  { keyword: "vibration", tag: "technique_vibration" },
  { keyword: "compression", tag: "technique_compression" },
  { keyword: "rocking", tag: "technique_rocking" },

  // Additional Techniques
  { keyword: "fulling", tag: "technique_fulling" },
  { keyword: "wringing", tag: "technique_wringing" },
  { keyword: "skin rolling", tag: "technique_skin_rolling" },
  { keyword: "cross fiber", tag: "technique_cross_fiber" },
  { keyword: "circular friction", tag: "technique_circular_friction" },
  { keyword: "transverse friction", tag: "technique_transverse_friction" },
  { keyword: "static friction", tag: "technique_static_friction" },
  { keyword: "palmar kneading", tag: "technique_palmar_kneading" },
  { keyword: "thumb kneading", tag: "technique_thumb_kneading" },
  { keyword: "cupping", tag: "technique_cupping" },
  { keyword: "hacking", tag: "technique_hacking" },
  { keyword: "beating", tag: "technique_beating" },
  { keyword: "pounding", tag: "technique_pounding" },
  { keyword: "tapping", tag: "technique_tapping" },

  // Anatomy
  { keyword: "muscle", tag: "anatomy_muscle", synonyms: ["my/o", "myo"] },
  { keyword: "joint", tag: "anatomy_joint" },
  { keyword: "bone", tag: "anatomy_bone", synonyms: ["oste/o", "osteo"] },
  { keyword: "fascia", tag: "anatomy_fascia" },
  { keyword: "nerve", tag: "anatomy_nerve", synonyms: ["neur/o", "neuro"] },
  { keyword: "artery", tag: "anatomy_artery" },
  { keyword: "organ", tag: "anatomy_organ" },
  { keyword: "soap", tag: "assessment_soap" },
  { keyword: "gate", tag: "theory_gate_control" },
  { keyword: "pressure", tag: "technique_pressure" },
  { keyword: "membrane", tag: "anatomy_membrane" },
  { keyword: "cells", tag: "anatomy_cells" },
  { keyword: "nucleus", tag: "anatomy_nucleus" },
  { keyword: "cytoplasm", tag: "anatomy_cytoplasm" },
  { keyword: "protein", tag: "anatomy_protein" },
  { keyword: "organelle", tag: "anatomy_organelle" },
  { keyword: "tissues", tag: "anatomy_tissues" },
  { keyword: "muscles", tag: "anatomy_muscles" },
  { keyword: "bones", tag: "anatomy_bones" },
  { keyword: "spine", tag: "anatomy_spine" },
  { keyword: "nervous", tag: "anatomy_nervous_system" },
  { keyword: "organs", tag: "anatomy_organs" },
  { keyword: "connective tissue", tag: "anatomy_connective_tissue" },
  { keyword: "muscle contraction", tag: "anatomy_muscle_contraction" },
  { keyword: "blood flow", tag: "anatomy_blood_flow" },

  // Pathology/Conditions
  { keyword: "pain", tag: "condition_pain", synonyms: ["ache", "soreness", "discomfort"] },
  { keyword: "fibromyalgia", tag: "condition_fibromyalgia" },
  { keyword: "tendinitis", tag: "condition_tendinitis" },
  { keyword: "scoliosis", tag: "condition_scoliosis" },
  { keyword: "kyphosis", tag: "condition_kyphosis" },
  { keyword: "cancer", tag: "condition_cancer" },

  // Purpose/Effect
  { keyword: "relaxation", tag: "purpose_relaxation", synonyms: ["relax", "calm", "soothing"] },
  { keyword: "stress", tag: "purpose_stress", synonyms: ["tension", "anxiety"] },
  { keyword: "healing", tag: "purpose_healing", synonyms: ["recover", "recovery", "restoration"] },
  { keyword: "benefit", tag: "purpose_benefit" },
  { keyword: "pain relief", tag: "purpose_pain_relief" },

  // People/Founders
  { keyword: "elizabeth dicke", tag: "founder_elizabeth_dicke" },
  { keyword: "ida rolf", tag: "founder_ida_rolf" },

  // Exam/Education
  { keyword: "mblex", tag: "exam_mblex" },
  { keyword: "assessment", tag: "exam_assessment", synonyms: ["evaluate", "evaluation", "examination"] },
  { keyword: "terminology", tag: "exam_terminology" },

  // Ethics/Professionalism
  { keyword: "ethics", tag: "ethics" },
  { keyword: "consent", tag: "ethics_consent", synonyms: ["permission", "agreement"] },
  { keyword: "boundary", tag: "ethics_boundary", synonyms: ["boundaries", "limits"] },

  // Indications/Contraindications
  { keyword: "indication", tag: "indication", synonyms: ["indications", "indicated"] },
  { keyword: "contraindication", tag: "contraindication", synonyms: ["contraindications", "contraindicated"] },

  // Client Experience
  { keyword: "client", tag: "client", synonyms: ["patient", "recipient"] },
  { keyword: "sensation", tag: "client_sensation" },

  // General Concepts
  { keyword: "immune", tag: "system_immune" },
  { keyword: "bacteria", tag: "microbiology_bacteria" },
  { keyword: "fungi", tag: "microbiology_fungi" },
  { keyword: "cytology", tag: "science_cytology" },
  { keyword: "homeostasis", tag: "physiology_homeostasis" },
  { keyword: "organization", tag: "science_organization" },
  { keyword: "balance", tag: "concept_balance" },
  { keyword: "integration", tag: "concept_integration" },
  { keyword: "matrix", tag: "anatomy_matrix" },
  { keyword: "membrane potential", tag: "anatomy_membrane_potential" },
  { keyword: "plasma membrane", tag: "anatomy_plasma_membrane" },
  { keyword: "cytosol", tag: "anatomy_cytosol" },
  { keyword: "ribosomes", tag: "anatomy_ribosomes" },
  { keyword: "dna", tag: "anatomy_dna" },
  { keyword: "genetic material", tag: "anatomy_genetic_material" },
  { keyword: "component", tag: "anatomy_component" },
  { keyword: "histology", tag: "science_histology" },
  { keyword: "eukaryotic", tag: "biology_eukaryotic" },
  { keyword: "prokaryotes", tag: "biology_prokaryotes" },
  { keyword: "organisms", tag: "biology_organisms" },
  { keyword: "red blood", tag: "anatomy_red_blood" },
  { keyword: "antigen", tag: "immunology_antigen" },
  { keyword: "antigens", tag: "immunology_antigens" },
  { keyword: "antibodies", tag: "immunology_antibodies" },
  { keyword: "immune system", tag: "system_immune" },
  { keyword: "digestive", tag: "system_digestive" },
  { keyword: "brain", tag: "anatomy_brain" },
  { keyword: "sleep", tag: "physiology_sleep" },
  { keyword: "glucose", tag: "biochemistry_glucose" },
  { keyword: "levels", tag: "biochemistry_levels" },
  { keyword: "kidneys", tag: "anatomy_kidneys" },
  { keyword: "concentration", tag: "biochemistry_concentration" },

  // Massage/Bodywork
  { keyword: "ayurveda", tag: "modality_ayurveda" },
  { keyword: "ayurvedic", tag: "modality_ayurvedic" },
  { keyword: "indian", tag: "modality_indian" },
  { keyword: "thirumal", tag: "modality_thirumal" },
  { keyword: "chavutti thirumal", tag: "modality_chavutti_thirumal" },
  { keyword: "barefoot", tag: "technique_barefoot" },
  { keyword: "gua sha", tag: "modality_gua_sha" },
  { keyword: "polarity therapy", tag: "modality_polarity_therapy" },
  { keyword: "craniosacral therapy", tag: "modality_craniosacral_therapy" },
  { keyword: "structural integration", tag: "modality_structural_integration" },
  { keyword: "myofascial release", tag: "modality_myofascial_release" },
  { keyword: "soft tissue", tag: "modality_soft_tissue" },
  { keyword: "effleurage petrissage", tag: "technique_effleurage_petrissage" },
  { keyword: "friction massage", tag: "technique_friction_massage" },
  { keyword: "trigger point therapy", tag: "modality_trigger_point_therapy" },
  { keyword: "zone therapy", tag: "modality_zone_therapy" },
  { keyword: "reflex point", tag: "anatomy_reflex_point" },
  { keyword: "plantarflexion", tag: "movement_plantarflexion" },
  { keyword: "oils", tag: "modality_oils" },
  { keyword: "herbal oils", tag: "modality_herbal_oils" },
  { keyword: "marma", tag: "anatomy_marma" },
  { keyword: "mentastics", tag: "modality_mentastics" },
  { keyword: "meridians", tag: "anatomy_meridians" },
  { keyword: "zones", tag: "anatomy_zones" },
  { keyword: "energy channels", tag: "anatomy_energy_channels" },
  { keyword: "tsubo", tag: "anatomy_tsubo" },
  { keyword: "thai massage", tag: "modality_thai_massage" },
  { keyword: "barefoot massage", tag: "modality_barefoot_massage" },
  { keyword: "massage therapist", tag: "role_massage_therapist" },
  { keyword: "massage therapy", tag: "modality_massage_therapy" },
  { keyword: "massage techniques", tag: "modality_massage_techniques" },
  { keyword: "massage system", tag: "modality_massage_system" },
  { keyword: "massage school", tag: "education_massage_school" },
  { keyword: "massage licensure", tag: "education_massage_licensure" },
  { keyword: "massage adaptation", tag: "modality_massage_adaptation" },
  { keyword: "massage contraindication", tag: "modality_massage_contraindication" },
  { keyword: "massage consideration", tag: "modality_massage_consideration" },
  { keyword: "massage plan", tag: "modality_massage_plan" },
  { keyword: "massage stroke", tag: "technique_massage_stroke" },
  { keyword: "massage style", tag: "modality_massage_style" },
  { keyword: "massage business", tag: "business_massage" },
  { keyword: "massage should avoided", tag: "modality_massage_should_avoided" },
  { keyword: "massage generally contraindicated", tag: "modality_massage_generally_contraindicated" },

  // Ethics/Practice
  { keyword: "informed consent", tag: "ethics_informed_consent" },
  { keyword: "scope of practice", tag: "ethics_scope_of_practice" },
  { keyword: "professional ethics", tag: "ethics_professional" },
  { keyword: "legal scope", tag: "ethics_legal_scope" },
  { keyword: "documentation", tag: "ethics_documentation" },
  { keyword: "soap note", tag: "documentation_soap_note" },
  { keyword: "soap notes", tag: "documentation_soap_notes" },
  { keyword: "assessment section", tag: "documentation_assessment_section" },
  { keyword: "plan section", tag: "documentation_plan_section" },
  { keyword: "objective section", tag: "documentation_objective_section" },
  { keyword: "subjective section", tag: "documentation_subjective_section" },
  { keyword: "client records", tag: "documentation_client_records" },
  { keyword: "client consent", tag: "ethics_client_consent" },
  { keyword: "client experience", tag: "client_experience" },
  { keyword: "client sensation", tag: "client_sensation" },
  { keyword: "client noshows", tag: "client_noshows" },
  { keyword: "client lupus", tag: "condition_lupus" },
  { keyword: "client fibromyalgia", tag: "condition_fibromyalgia" },
  { keyword: "client multiple sclerosis", tag: "condition_multiple_sclerosis" },
  { keyword: "client undergoing cancer", tag: "condition_cancer" },
  { keyword: "client presents", tag: "client_presents" },
  { keyword: "client first trimester", tag: "client_first_trimester" },
  { keyword: "client minors", tag: "client_minors" },
  { keyword: "client blood thinners", tag: "client_blood_thinners" },
  { keyword: "client allergies", tag: "client_allergies" },
  { keyword: "client trauma", tag: "client_trauma" },

  // Other Useful
  { keyword: "plant cells", tag: "anatomy_plant_cells" },
  { keyword: "animal cells", tag: "anatomy_animal_cells" },
  { keyword: "originates", tag: "concept_originates" },
  { keyword: "originated", tag: "concept_originated" },
  { keyword: "origin", tag: "concept_origin" },
  { keyword: "insertion", tag: "concept_insertion" },
  { keyword: "insert", tag: "concept_insert" },
  { keyword: "assists", tag: "concept_assists" },
  { keyword: "assisted", tag: "concept_assisted" },
  { keyword: "focus", tag: "concept_focus" },
  { keyword: "focuses", tag: "concept_focuses" },
  { keyword: "targeted", tag: "concept_targeted" },
  { keyword: "localized", tag: "concept_localized" },
  { keyword: "localized contraindication", tag: "condition_localized_contraindication" },
  { keyword: "acute injury", tag: "condition_acute_injury" },
  { keyword: "stage acute", tag: "condition_stage_acute" },
  { keyword: "endangerment site", tag: "anatomy_endangerment_site" },
  { keyword: "caution", tag: "concept_caution" },
  { keyword: "thinners", tag: "concept_thinners" },
  { keyword: "blood thinners", tag: "concept_blood_thinners" },
  { keyword: "injury", tag: "condition_injury" },
  { keyword: "injuries", tag: "condition_injuries" },
  { keyword: "ache", tag: "condition_ache" },
  { keyword: "soreness", tag: "condition_soreness" },
  { keyword: "discomfort", tag: "condition_discomfort" },
  { keyword: "recover", tag: "concept_recover" },
  { keyword: "recovery", tag: "concept_recovery" },
  { keyword: "restoration", tag: "concept_restoration" },
  { keyword: "tension", tag: "concept_tension" },
  { keyword: "anxiety", tag: "concept_anxiety" },
  { keyword: "calm", tag: "concept_calm" },
  { keyword: "soothing", tag: "concept_soothing" }
  // ...add more as you see fit!
];

// --- TAG NORMALIZATION ---
function normalizeTag(tag) {
  return tag.toLowerCase().replace(/\s+/g, "_");
}

// --- AUTO-TAGGING ---
function autoTags(questionText) {
  const tags = [];
  const text = questionText.toLowerCase();
  for (const { keyword, tag, synonyms = [] } of keywordTags) {
    if (text.includes(keyword) || synonyms.some(syn => text.includes(syn))) {
      tags.push(tag);
    }
  }
  return tags;
}

// --- PROCESS FILE ---
function processFile(filePath, dryRun = false) {
  let changed = false;
  let data = fs.readFileSync(filePath, "utf8");
  let questions;
  try {
    questions = JSON.parse(data);
  } catch (e) {
    console.error(`Could not parse JSON in ${filePath}:`, e);
    return;
  }
  if (!Array.isArray(questions)) return;

  for (let q of questions) {
    let originalTags = Array.isArray(q.tags) ? q.tags.slice() : [];
    let tags = originalTags.map(normalizeTag);

    // --- SET UNIT FROM SUBFOLDER ---
    if (!q.unit || typeof q.unit !== "string" || !q.unit.trim()) {
      // Get the path from the topic folder to the file, minus .json
      const topicFolder = path.basename(path.dirname(path.dirname(filePath)));
      const relativePath = path.relative(path.join(__dirname, "questions", topicFolder), filePath);
      const unitPath = path.dirname(relativePath) !== "."
        ? path.join(path.dirname(relativePath), path.basename(filePath, ".json"))
        : path.basename(filePath, ".json");
      q.unit = unitPath.replace(/\\/g, "/"); // Normalize for cross-platform
      changed = true;
      console.log(`  [${q.id}] Unit field set from nested path: ${q.unit}`);
    }
    // --- END BLOCK ---

    // Always add a base tag for the topic/unit if not present
    if (q.unit) {
      const baseTag = normalizeTag(q.unit);
      if (!tags.includes(baseTag)) tags.push(baseTag);
    }

    // Auto-tagging based on question text
    if (q.question) {
      for (const tag of autoTags(q.question)) {
        if (!tags.includes(tag)) tags.push(tag);
      }
    }

    // Remove duplicates
    tags = [...new Set(tags)];

    if (JSON.stringify(tags) !== JSON.stringify(originalTags)) {
      // Only update the tags property, leave all other fields as-is
      q.tags = tags;
      changed = true;
      console.log(`  [${q.id}] Tags updated:`, tags);
    }
  }

  if (changed) {
    if (!dryRun) {
      backupFile(filePath);
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), "utf8");
      console.log(`✔ Updated and backed up: ${filePath}`);
    } else {
      console.log(`(Dry run) Would update: ${filePath}`);
    }
  }
}

// --- RECURSIVE FOLDER WALK ---
function processFolder(folder, dryRun = false) {
  const files = fs.readdirSync(folder);
  for (const file of files) {
    const filePath = path.join(folder, file);
    if (fs.statSync(filePath).isDirectory()) {
      processFolder(filePath, dryRun);
    } else if (file.toLowerCase().endsWith(".json")) {
      processFile(filePath, dryRun);
    }
  }
}

// --- CLI ---
const argv = minimist(process.argv.slice(2));
const target = argv.file || argv.folder || "questions";
const dryRun = argv["dry-run"] || false;

if (fs.existsSync(target)) {
  if (fs.statSync(target).isDirectory()) {
    console.log(`Processing folder: ${target} ${dryRun ? "(dry run)" : ""}`);
    processFolder(target, dryRun);
  } else {
    console.log(`Processing file: ${target} ${dryRun ? "(dry run)" : ""}`);
    processFile(target, dryRun);
  }
} else {
  console.error("Target file or folder does not exist:", target);
  process.exit(1);
}