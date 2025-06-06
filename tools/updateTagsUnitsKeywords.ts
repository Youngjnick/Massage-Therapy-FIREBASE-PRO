// @ts-nocheck
/* eslint-disable */
import fs from "fs";
import path from "path";
import minimist from "minimist";
// import natural from "natural";
import nlp from "compromise";

// Master lists (auto-expanded from anatomy.csv)
const muscles = [
  "Biceps Brachii", "Triceps Brachii", "Deltoid", "Pectoralis Major", "Pectoralis Minor", "Latissimus Dorsi",
  "Teres Major", "Teres Minor", "Infraspinatus", "Supraspinatus", "Subscapularis", "Rhomboid Major",
  "Rhomboid Minor", "Levator Scapulae", "Trapezius", "Serratus Anterior", "Serratus Posterior Superior", "Serratus Posterior Inferior",
  "External Oblique", "Internal Oblique", "Transversus Abdominis", "Rectus Abdominis", "Erector Spinae", "Iliocostalis",
  "Longissimus", "Spinalis", "Quadratus Lumborum", "Gluteus Maximus", "Gluteus Medius", "Gluteus Minimus",
  "Piriformis", "Obturator Internus", "Obturator Externus", "Gemellus Superior", "Gemellus Inferior", "Quadratus Femoris",
  "Iliopsoas", "Psoas Major", "Iliacus", "Tensor Fasciae Latae", "Sartorius", "Rectus Femoris",
  "Vastus Lateralis", "Vastus Medialis", "Vastus Intermedius", "Adductor Longus", "Adductor Brevis", "Adductor Magnus",
  "Gracilis", "Pectineus", "Biceps Femoris", "Semitendinosus", "Semimembranosus", "Gastrocnemius",
  "Soleus", "Plantaris", "Tibialis Anterior", "Tibialis Posterior", "Fibularis Longus", "Fibularis Brevis",
  "Extensor Digitorum Longus", "Extensor Hallucis Longus", "Flexor Digitorum Longus", "Flexor Hallucis Longus", "Popliteus", "Abductor Hallucis",
  "Flexor Digitorum Brevis", "Abductor Digiti Minimi", "Flexor Hallucis Brevis", "Adductor Hallucis", "Flexor Digiti Minimi Brevis", "Dorsal Interossei",
  "Plantar Interossei", "Extensor Digitorum Brevis", "Extensor Hallucis Brevis", "Orbicularis Oculi", "Orbicularis Oris", "Buccinator",
  "Masseter", "Temporalis", "Medial Pterygoid", "Lateral Pterygoid", "Sternocleidomastoid", "Scalenes",
  "Platysma", "Mylohyoid", "Digastric", "Stylohyoid", "Geniohyoid", "Omohyoid",
  "Sternohyoid", "Sternothyroid", "Thyrohyoid", "Cricothyroid", "Cricopharyngeus"
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
  "Frontal", "Parietal", "Temporal", "Occipital", "Sphenoid", "Ethmoid", "Nasal", "Lacrimal",
  "Zygomatic", "Maxilla", "Mandible", "Vomer", "Palatine", "Inferior Nasal Concha", "Malleus", "Incus",
  "Stapes", "Hyoid", "Cervical Vertebrae", "Thoracic Vertebrae", "Lumbar Vertebrae", "Sacrum", "Coccyx", "Clavicle",
  "Scapula", "Sternum", "Ribs", "Humerus", "Radius", "Ulna", "Carpals", "Metacarpals",
  "Phalanges (Hand)", "Ilium", "Ischium", "Pubis", "Femur", "Patella", "Tibia", "Fibula",
  "Tarsals", "Metatarsals", "Phalanges (Foot)"
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
  "Heart", "Lungs", "Liver", "Kidneys", "Stomach", "Pancreas", "Spleen", "Intestines",
  "Bladder", "Gallbladder", "Esophagus", "Trachea", "Thyroid", "Parathyroid", "Adrenal Glands", "Ovaries",
  "Testes", "Uterus", "Prostate", "Brain", "Spinal Cord", "Skin", "Eyes", "Ears", "Nose", "Tongue"
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

  // --- ADDED: HISTORY & PEOPLE TAGS ---
  { keyword: "hippocrates", tag: "person_hippocrates" },
  { keyword: "galen", tag: "person_galen" },
  { keyword: "johann mezger", tag: "person_johann_mezger" },
  { keyword: "per henrik ling", tag: "person_per_henrik_ling" },
  { keyword: "charles taylor", tag: "person_charles_taylor" },
  { keyword: "anatripsis", tag: "concept_anatripsis" },
  { keyword: "father of medicine", tag: "title_father_of_medicine" },
  { keyword: "founder", tag: "role_founder", synonyms: ["originator", "creator"] },
  { keyword: "pioneer", tag: "role_pioneer" },
  { keyword: "greek", tag: "history_greek" },
  { keyword: "roman", tag: "history_roman" },
  { keyword: "egypt", tag: "history_egypt" },
  { keyword: "history", tag: "category_history" },
  { keyword: "people", tag: "category_people" },
  { keyword: "ancient", tag: "history_ancient" },
  { keyword: "massage history", tag: "history_massage" },
  { keyword: "historical figure", tag: "category_historical_figure" },
  { keyword: "timeline", tag: "history_timeline" },
  { keyword: "origin", tag: "history_origin" },
  { keyword: "development", tag: "history_development" },
  { keyword: "tradition", tag: "history_tradition" },
  { keyword: "renaissance", tag: "history_renaissance" },
  { keyword: "modern", tag: "history_modern" },
  { keyword: "western", tag: "history_western" },
  { keyword: "eastern", tag: "history_eastern" },
  { keyword: "medical history", tag: "history_medical" },
  { keyword: "scientific massage", tag: "history_scientific_massage" },
  { keyword: "sweden", tag: "history_sweden" },
  { keyword: "china", tag: "history_china" },
  { keyword: "india", tag: "history_india" },
  { keyword: "japan", tag: "history_japan" },
  { keyword: "usa", tag: "history_usa" },
  // --- END ADDED ---

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
  { keyword: "soothing", tag: "concept_soothing" },

  // --- BEGIN HIGHLY GRANULAR TAGS ---
  // Muscles: actions, origins, insertions, innervations
  { keyword: "abduction shoulder", tag: "muscle_action_abduction_shoulder" },
  { keyword: "adduction hip", tag: "muscle_action_adduction_hip" },
  { keyword: "origin supraspinatus", tag: "muscle_origin_supraspinatus" },
  { keyword: "insertion supraspinatus", tag: "muscle_insertion_supraspinatus" },
  { keyword: "innervation supraspinatus", tag: "muscle_innervation_supraspinatus" },
  { keyword: "origin biceps brachii", tag: "muscle_origin_biceps_brachii" },
  { keyword: "insertion biceps brachii", tag: "muscle_insertion_biceps_brachii" },
  { keyword: "innervation biceps brachii", tag: "muscle_innervation_biceps_brachii" },
  // Nerves: roots, branches, plexuses
  { keyword: "nerve root c5", tag: "nerve_root_c5" },
  { keyword: "nerve root l4", tag: "nerve_root_l4" },
  { keyword: "brachial plexus", tag: "nerve_plexus_brachial" },
  { keyword: "sciatic nerve branch", tag: "nerve_branch_sciatic" },
  // Bones: regions, landmarks
  { keyword: "greater trochanter", tag: "bone_landmark_greater_trochanter" },
  { keyword: "lesser trochanter", tag: "bone_landmark_lesser_trochanter" },
  { keyword: "acromion process", tag: "bone_landmark_acromion_process" },
  { keyword: "olecranon process", tag: "bone_landmark_olecranon_process" },
  { keyword: "lateral malleolus", tag: "bone_landmark_lateral_malleolus" },
  { keyword: "medial malleolus", tag: "bone_landmark_medial_malleolus" },
  // Pathologies: subtypes, locations
  { keyword: "tendinitis achilles", tag: "condition_tendinitis_achilles" },
  { keyword: "tendinitis supraspinatus", tag: "condition_tendinitis_supraspinatus" },
  { keyword: "osteoarthritis knee", tag: "condition_osteoarthritis_knee" },
  { keyword: "osteoarthritis hip", tag: "condition_osteoarthritis_hip" },
  { keyword: "herniated disc l4 l5", tag: "condition_herniated_disc_l4_l5" },
  { keyword: "herniated disc c5 c6", tag: "condition_herniated_disc_c5_c6" },
  // Techniques: variations
  { keyword: "effleurage longitudinal", tag: "technique_effleurage_longitudinal" },
  { keyword: "effleurage circular", tag: "technique_effleurage_circular" },
  { keyword: "petrissage kneading", tag: "technique_petrissage_kneading" },
  { keyword: "petrissage wringing", tag: "technique_petrissage_wringing" },
  { keyword: "friction transverse", tag: "technique_friction_transverse" },
  { keyword: "friction circular", tag: "technique_friction_circular" },
  // Assessments: named tests
  { keyword: "phalen's test", tag: "assessment_special_test_phalens" },
  { keyword: "tinel's sign", tag: "assessment_special_test_tinels" },
  { keyword: "ober's test", tag: "assessment_special_test_obers" },
  { keyword: "thomas test", tag: "assessment_special_test_thomas" },
  { keyword: "straight leg raise", tag: "assessment_special_test_slr" },
  { keyword: "drop arm test", tag: "assessment_special_test_drop_arm" },
  // Populations
  { keyword: "athlete", tag: "population_athlete" },
  { keyword: "geriatric", tag: "population_geriatric" },
  { keyword: "pediatric", tag: "population_pediatric" },
  { keyword: "pregnant client", tag: "population_pregnant" },
  { keyword: "post-surgical", tag: "population_post_surgical" },
  // Trigger points
  { keyword: "trigger point upper trapezius", tag: "trigger_point_upper_trapezius" },
  { keyword: "trigger point levator scapulae", tag: "trigger_point_levator_scapulae" },
  { keyword: "trigger point piriformis", tag: "trigger_point_piriformis" },
  // ...add more as needed for each area...
  // --- END HIGHLY GRANULAR TAGS ---
  ...muscleTags,
  ...jointTags,
  ...nerveTags,
  ...boneTags,
  ...arteryTags,
  ...ligamentTags,
  ...organTags,
  { keyword: "scope", tag: "practice_scope" },
  { keyword: "marketing", tag: "business_marketing" },
  { keyword: "billing", tag: "business_billing" },

  // Remove duplicate and generic tags for 'plan' and 'modality'.
  // Only keep one, well-named entry for each:
  { keyword: "plan", tag: "plan_plan" },
  { keyword: "modality", tag: "modality_modality" },
  ...muscleTags,
  ...jointTags,
  ...nerveTags,
  ...boneTags,
  ...arteryTags,
  ...ligamentTags,
  ...organTags,
  { keyword: "scope", tag: "practice_scope" },
  { keyword: "marketing", tag: "business_marketing" },
  { keyword: "billing", tag: "business_billing" },

  // Remove duplicate and generic tags for 'plan' and 'modality'.
  // Only keep one, well-named entry for each:
  { keyword: "plan", tag: "plan_plan" },
  { keyword: "modality", tag: "modality_modality" }
];
// --- TAG NORMALIZATION ---
function normalizeTag(tag) {
  return tag.toLowerCase().replace(/\s+/g, "_");
}

// --- FILTER FOR USEFUL TAGS/KEYWORDS ---
/*
const ALLOWED_TAGS = new Set([
  // Modalities/Techniques
  "modality_massage","modality_swedish","modality_deep_tissue","modality_myofascial","modality_trigger_point","modality_sports","modality_shiatsu","modality_reflexology","modality_ashiatsu","modality_trager","modality_rolfing","modality_tuina","modality_craniosacral","modality_barefoot_massage","modality_gua_sha","modality_polarity_therapy","modality_structural_integration","modality_myofascial_release","modality_soft_tissue","modality_friction_massage","modality_trigger_point_therapy","modality_zone_therapy","modality_thai_massage","modality_chavutti_thirumal",
  // Anatomy/Physiology
  "muscle_trapezius","muscle_deltoid","muscle_pectoralis","muscle_latissimus","muscle_gluteus","muscle_hamstring","muscle_quadriceps","muscle_gastrocnemius","muscle_soleus","muscle_biceps","muscle_triceps","muscle_rhomboid","muscle_levator_scapulae","muscle_sternocleidomastoid","muscle_erector_spinae","muscle_iliopsoas","muscle_adductor","muscle_abductor","muscle_flexor","muscle_extensor",
  "nerve_sciatic_nerve","nerve_median_nerve","nerve_ulnar_nerve","nerve_radial_nerve","nerve_femoral_nerve","nerve_obturator_nerve","nerve_tibial_nerve","nerve_peroneal_nerve","nerve_axillary_nerve","nerve_musculocutaneous_nerve","nerve_phrenic_nerve","nerve_vagus_nerve","nerve_trigeminal_nerve","nerve_facial_nerve","nerve_accessory_nerve","nerve_hypoglossal_nerve",
  // Pathology/Conditions
  "condition_fibromyalgia","condition_cancer","condition_infection","condition_lupus","condition_multiple_sclerosis","condition_acute_injury","condition_pain","condition_tendinitis","condition_scoliosis","condition_kyphosis","condition_soreness","condition_discomfort",
  // Concepts/Exam/Education
  "endangerment_site","assessment_section","plan_section","objective_section","documentation","documentation_soap_note","documentation_soap_notes","documentation_assessment_section","documentation_plan_section","documentation_objective_section","documentation_subjective_section","client_consent","client_experience","client_sensation","client_noshows","client_first_trimester","client_minors","client_presents","client_blood_thinners","client_allergies","client_trauma","exam_mblex","ethics","ethics_consent","ethics_boundary","ethics_informed_consent","ethics_scope_of_practice","ethics_professional","ethics_legal_scope","ethics_documentation","scope_of_practice","informed_consent","absolute_contraindication","local_contraindication","blood_thinners","myofascial_release_technique","gate_control_theory","soap_notes"
]);
*/

// --- TAGS THAT ALLOW LOOSE MATCHING (typo-tolerance, n-gram, etc) ---
/*
const LOOSE_MATCH_TAGS = new Set([
  // General modalities and techniques only
  "modality_massage","modality_swedish","modality_deep_tissue","modality_myofascial","modality_trigger_point","modality_sports","modality_shiatsu","modality_reflexology","modality_ashiatsu","modality_trager","modality_rolfing","modality_tuina","modality_craniosacral","modality_barefoot_massage","modality_gua_sha","modality_polarity_therapy","modality_structural_integration","modality_myofascial_release","modality_soft_tissue","modality_friction_massage","modality_trigger_point_therapy","modality_zone_therapy","modality_thai_massage","modality_chavutti_thirumal",
  "technique_effleurage","technique_petrissage","technique_friction","technique_tapotement","technique_vibration","technique_compression","technique_rocking",
  // Add more if you want loose matching for other general tags
]);
*/

// --- SIMPLE ENGLISH STEMMER ---
// function simpleStem(word) {
//   // Very basic stemming for common suffixes
//   return word
//     .replace(/(ing|ed|es|s)$/i, "")
//     .replace(/(ation|tion|ment|ness|ity|ies)$/i, "");
// }

// --- ADVANCED NLP HELPERS ---
// const TfIdf = natural.TfIdf;
// const stemmer = natural.PorterStemmer;

function getLemmas(text) {
  // Use compromise for lemmatization
  return nlp(text).terms().out("lemma").split(" ");
}

// function getNouns(text) {
//   // Use compromise to extract nouns (key concepts)
//   return nlp(text).nouns().out("array");
// }

// --- FEEDBACK LOOP STUB ---
// In production, this would read/write a JSON or DB of tag usefulness
// function recordTagFeedback(tag, useful) {
//   // Placeholder: implement persistent feedback tracking as needed
// }

// --- STRICT RELEVANCE CHECKER ---
function isRelevantTagOrKeyword(candidate, q, lemmas, stemmedWords, masterSet, keyword) {
  if (typeof candidate !== "string" || !candidate.trim()) {return false;}
  // Only allow if the FULL keyword (not just a substring) appears as a whole word in question/correct/explanations or their synonyms/lemmas
  const fields = [q.question, q.short_explanation, q.long_explanation, q.clinical_application];
  if (typeof q.correct === "string" || typeof q.correct === "number" || typeof q.correct === "boolean") {
    fields.push(String(q.correct));
  }
  // Also check all answers
  if (Array.isArray(q.answers)) {
    for (const ans of q.answers) {
      if (typeof ans === "string") {fields.push(ans);}
    }
  }
  const allText = fields.filter(Boolean).join(" ").toLowerCase();
  // Whole word/phrase match only
  const pattern = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&").replace(/\\s+/g, "\\W+")}\\b`, "i");
  if (pattern.test(allText)) {return true;}
  if (lemmas.includes(keyword)) {return true;}
  if (stemmedWords.includes(stemmer.stem(keyword))) {return true;}
  return false;
}

// --- STRICT AUTO TAGS ---
function autoTagsStrict(q) {
  const tags = [];
  const text = [q.question, q.short_explanation, q.long_explanation, q.clinical_application, q.correct, ...(q.answers||[])].filter(Boolean).join(" ").toLowerCase();
  const lemmas = getLemmas(text);
  const stemmedWords = lemmas.map(w => stemmer.stem(w));
  for (const { keyword, tag, synonyms = [] } of keywordTags) {
    let match = isRelevantTagOrKeyword(tag, q, lemmas, stemmedWords, null, keyword);
    let synonymMatch = false;
    if (!match && synonyms && synonyms.length > 0) {
      synonymMatch = synonyms.some(syn => isRelevantTagOrKeyword(tag, q, lemmas, stemmedWords, null, syn));
    }
    if (match || synonymMatch) {
      tags.push(tag);
    }
  }
  return [...new Set(tags)];
}

// --- BACKUP FILE ---
function backupFile(filePath) {
  const backupPath = filePath + ".bak";
  fs.copyFileSync(filePath, backupPath);
}

// --- POST-PROCESSING CLEANUP ---
function postProcessTagsKeywords(arr, masterSet) {
  // Remove duplicates, substrings, overly generic, too short, or not in master list
  const minLen = 3;
  const generic = new Set(["test","sample","misc","general","other"]);
  let filtered = Array.from(new Set(arr))
    .filter(x => typeof x === "string" && x.length >= minLen && !generic.has(x))
    .filter(x => !arr.some(y => y !== x && y.includes(x))) // remove substrings
    .filter(x => !masterSet || masterSet.has(x));
  return filtered;
}

// --- PROCESS FILE ---
let removedLog = [];

function processFile(filePath, dryRun = false, reviewMode = false) {
  console.log(`[DEBUG] processFile called for: ${filePath}`); // DEBUG
  let changed = false;
  let data = fs.readFileSync(filePath, "utf8");
  let questions;
  try {
    questions = JSON.parse(data);
  } catch (e) {
    console.error(`Could not parse JSON in ${filePath}:`, e);
    return;
  }
  if (!Array.isArray(questions)) {return;}
  console.log(`[DEBUG] Number of questions in file: ${questions.length}`); // DEBUG

  const masterSet = new Set(keywordTags.map(k => normalizeTag(k.tag)));

  for (let q of questions) {
    const oldTags = Array.isArray(q.tags) ? q.tags : [];
    const oldKeywords = Array.isArray(q.keywords) ? q.keywords : [];
    const newTags = autoTagsStrict(q);
    const newKeywords = [...newTags];
    const cleanedTags = postProcessTagsKeywords(newTags, masterSet);
    const cleanedKeywords = postProcessTagsKeywords(newKeywords, masterSet);
    // Log removed tags/keywords
    const removedTags = oldTags.filter(t => !cleanedTags.includes(t));
    const removedKeywords = oldKeywords.filter(k => !cleanedKeywords.includes(k));
    // DEBUG OUTPUT
    console.log(`\n[DEBUG] Processing question: ${q.id || "[no id]"} in ${filePath}`);
    console.log("  Old tags:", oldTags);
    console.log("  Old keywords:", oldKeywords);
    console.log("  New tags:", cleanedTags);
    console.log("  New keywords:", cleanedKeywords);
    if (removedTags.length > 0 || removedKeywords.length > 0) {
      console.log("  Removed tags:", removedTags);
      console.log("  Removed keywords:", removedKeywords);
    }
    const addedTags = cleanedTags.filter(t => !oldTags.includes(t));
    const addedKeywords = cleanedKeywords.filter(k => !oldKeywords.includes(k));
    if (addedTags.length > 0 || addedKeywords.length > 0) {
      console.log("  Added tags:", addedTags);
      console.log("  Added keywords:", addedKeywords);
    }
    if (removedTags.length > 0 || removedKeywords.length > 0) {
      removedLog.push({
        id: q.id,
        question: q.question,
        removedTags,
        removedKeywords,
        file: filePath
      });
    }
    if (reviewMode) {
      reviewOutput.push({
        id: q.id,
        question: q.question,
        oldTags,
        oldKeywords,
        newTags: cleanedTags,
        newKeywords: cleanedKeywords,
        file: filePath
      });
    } else {
      q.tags = cleanedTags;
      q.keywords = cleanedKeywords;
      changed = true;
    }
  }
  if (!reviewMode && changed) {
    if (!dryRun) {
      backupFile(filePath);
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2), "utf8");
      console.log(`✔ Updated and backed up: ${filePath}`);
    } else {
      console.log(`(Dry run) Would update: ${filePath}`);
    }
  }
}

function processFilesWithProgress(fileList, dryRun = false, reviewMode = false) {
  console.log(`[DEBUG] processFilesWithProgress called for ${fileList.length} files`); // DEBUG
  const total = fileList.length;
  fileList.forEach((filePath, idx) => {
    const percent = ((idx + 1) / total * 100).toFixed(1);
    console.log(`Processing file ${idx + 1} of ${total} (${percent}%) - ${filePath}`);
    processFile(filePath, dryRun, reviewMode);
  });
  if (reviewMode) {
    fs.writeFileSync(path.join(__dirname, "review_tags_keywords.json"), JSON.stringify(reviewOutput, null, 2));
    console.log("Review mode: Proposed tags/keywords written to tools/review_tags_keywords.json");
  }
  if (removedLog.length > 0) {
    fs.writeFileSync(path.join(__dirname, "removed_tags_keywords.json"), JSON.stringify(removedLog, null, 2));
    console.log("Removed tags/keywords written to tools/removed_tags_keywords.json");
  }
}

// Recursively get all .json files in a directory
function getAllJsonFiles(dir) {
  let results = [];
  for (const file of fs.readdirSync(dir)) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      results = results.concat(getAllJsonFiles(filePath));
    } else if (file.endsWith(".json")) {
      results.push(filePath);
    }
  }
  return results;
}

// --- CLI ---
console.log("[DEBUG] Script started");

if (process.argv[1] && process.argv[1].endsWith("updateTagsUnitsKeywords.js")) {
  console.log("[DEBUG] CLI entry point hit");
  const argv = minimist(process.argv.slice(2));
  console.log("[DEBUG] CLI argv:", argv);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let target = '';
  const dryRun = argv["dry-run"] || false;
  const reviewMode = argv["review"] || false;
  let reviewOutput = [];

  // Update the default questions folder path
  /*
  const DEFAULT_QUESTIONS_PATH = "src/data/questions";
  */

  // Use command-line argument if provided, otherwise use the default path
  // Always resolve to absolute path
  const rawTargetPath = argv.file || argv.folder || process.argv[2] || "src/data/questions";
  const targetPath = path.resolve(rawTargetPath);
  console.log("[DEBUG] targetPath (absolute):", targetPath);

  if (!fs.existsSync(targetPath)) {
    console.error(`Target file or folder does not exist: ${targetPath}`);
    process.exit(1);
  }

  if (fs.existsSync(targetPath)) {
    if (fs.statSync(targetPath).isDirectory()) {
      console.log(`Processing folder: ${targetPath} ${dryRun ? "(dry run)" : ""}${reviewMode ? " (review mode)" : ""}`);
      const allFiles = getAllJsonFiles(targetPath);
      processFilesWithProgress(allFiles, dryRun, reviewMode);
    } else {
      console.log(`Processing file: ${targetPath} ${dryRun ? "(dry run)" : ""}${reviewMode ? " (review mode)" : ""}`);
      processFile(targetPath, dryRun, reviewMode);
      if (reviewMode) {
        fs.writeFileSync(path.join(__dirname, "review_tags_keywords.json"), JSON.stringify(reviewOutput, null, 2));
        console.log("Review mode: Proposed tags/keywords written to tools/review_tags_keywords.json");
      }
    }
  } else {
    console.error("Target file or folder does not exist:", targetPath);
    process.exit(1);
  }
}

export { keywordTags };