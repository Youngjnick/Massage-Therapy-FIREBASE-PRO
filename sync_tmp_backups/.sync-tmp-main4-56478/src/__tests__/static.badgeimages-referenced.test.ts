import fs from 'fs';
import path from 'path';

declare const process: any;

describe('All badge images are referenced in badges.json', () => {
  const badgeJsonPath = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'public/badges/badges.json');
  const badgeDir = path.join((typeof process !== 'undefined' ? process.cwd() : '.'), 'public/badges/');
  const badges = JSON.parse(fs.readFileSync(badgeJsonPath, 'utf8'));
  const badgeImages = fs.readdirSync(badgeDir).filter(f => f.endsWith('.png'));

  it('should reference all badge images in badges.json, or be explicitly allowed as extra', () => {
    const referenced = new Set(badges.map((b: any) => b.image));
    // List of known extra badge image filenames not yet referenced in badges.json
    const allowedExtras = [
      'badge_test.png',
      'summary.png',
      '10_day_streak.png',
      '3_day_streak.png',
      '5_day_streak.png',
      '7_day_streak.png',
      'accuracy_90.png',
      'accuracy_master.png',
      'accuracy_pro_basic.png',
      'accuracy_pro_gold.png',
      'accuracy_top_10_basic.png',
      'accuracy_top_10_gold.png',
      'anatomy_ace_arm.png',
      'assessment_ace_basic.png',
      'badge_collector_basic.png',
      'badge_collector_elite.png',
      'badge_vault_complete.png',
      'bone_baron_small.png',
      'bookmarked.png',
      'brain_boss_elite_basic.png',
      'brain_boss_elite_green.png',
      'breathe_easy_basic.png',
      'chakra_alchemist_2.png',
      'chakra_alchemist_3.png',
      'chakra_alchemist_basic.png',
      'circulatory_commander.png',
      'client_whisperer.png',
      'core_control_basic.png',
      'core_control_gold.png',
      'cortical_commander.png',
      'crammer_hammer.png',
      'cryotherapy_conquerer.png',
      'deep_tissue_devotee.png',
      'digestive_dynamo.png',
      'fascial_flowmaster.png',
      'fast_learner.png',
      'first_steps.png',
      'flexor_signal_master_no_bkg.png',
      'foot_focus.png',
      'heart-throb-gold.png',
      'heart-throb_basic.png',
      'lower_limb_legend_basic.png',
      'lymphatic_legend.png',
      'marrow_mage.png',
      'massage_maverick_.png',
      'meridian_mapper.png',
      'muscle_monarch.png',
      'myofascial_maestro_2.png',
      'myofascial_maestro_basic.png',
      'nerve_navigator.png',
      'neuro_dominator.png',
      'palpation_pro.png',
      'pathology_adept.png',
      'pathology_apprentice.png',
      'pathology_pro.png',
      'qi_flow_facilitator.png',
      'quiz_crusher.png',
      'quiz_thousand_club.png',
      'reflexology_regent.png',
      'shiatsu_sensei.png',
      'skeletal-scholar_basic.png',
      'skeletal_scholar_2.png',
      'soap_star_basic.png',
      'spinal_elite.png',
      'sports_recovery_ace_ice.png',
      'streak_10.png',
      'streak_100.png',
      'streak_20.png',
      'streak_200.png',
      'streak_3.png',
      'streak_5.png',
      'streak_50.png',
      'streak_500.png',
      'streak_x3_3.png',
      'stretch_specialist.png',
      'swedish_specialist.png',
      'synapse_sage.png',
      'therapeutic_titan_2.png',
      'therapeutic_titan_3.png',
      'therapeutic_titan_basic.png',
      'thorax_titan_2.png',
      'thorax_titan_basic.png',
      'treatment_strategist_2.png',
      'treatment_strategist_basic.png',
      'treatment_strategist_gold.png',
      'treatment_tactician.png',
      'trigger_champ.png',
      'ultimate_anatomy.png',
      'vital_volume.png',
      'welcome.png',
      'icon-512x512.png',
      'fallback.png', // allow fallback image
    ];
    badgeImages.forEach(img => {
      if (!referenced.has(img) && !allowedExtras.includes(img)) {
        throw new Error(`Badge image '${img}' is not referenced in badges.json and not in allowedExtras.`);
      }
    });
  });
});
