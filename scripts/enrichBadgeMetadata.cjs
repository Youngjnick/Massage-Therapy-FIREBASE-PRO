// This script enriches badge metadata in badges.json by improving names and descriptions for badges with missing or generic values.
// Usage: node enrichBadgeMetadata.cjs

const fs = require('fs');
const path = require('path');

const BADGES_PATH = path.join(__dirname, '../public/badges/badges.json');

function isGenericDescription(desc, id) {
  if (!desc) return true;
  const lower = desc.toLowerCase();
  return (
    lower === `earn the ${id.replace(/[-_]/g, ' ')} badge!`.toLowerCase() ||
    lower.startsWith('earn the')
  );
}

function prettifyName(id) {
  // Convert snake_case, kebab-case, or dot.case to Title Case
  return id
    .replace(/[_\-.]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\d+/g, d => ` ${d}`)
    .replace(/\s+/g, ' ')
    .trim();
}

function prettifyDescription(id, name) {
  // Suggest a more descriptive text based on id/name
  if (/streak/i.test(id)) {
    const match = id.match(/(\d+)[-_]?day[_-]?streak/i);
    if (match) {
      return `Maintain a streak for ${match[1]} consecutive days.`;
    }
    if (/streak_\d+/i.test(id)) {
      const n = id.match(/streak_(\d+)/i);
      if (n) return `Achieve a ${n[1]}-day activity streak.`;
    }
    return `Achieve a new streak milestone.`;
  }
  if (/accuracy/i.test(id)) {
    const match = id.match(/accuracy[_-]?(\d+)/i);
    if (match) {
      return `Achieve ${match[1]}% accuracy on a quiz.`;
    }
    return `Demonstrate outstanding accuracy.`;
  }
  if (/collector/i.test(id)) {
    return `Collect multiple unique badges.`;
  }
  if (/quiz/i.test(id)) {
    return `Complete quiz-related achievements.`;
  }
  if (/pro|master|elite|champ|titan|sage|maestro|legend|boss|king|queen|star|ace|adept|apprentice|specialist|conquerer|devotee|monarch|commander|maverick|focus|flow|guru|whisperer|strategist|tactician|summary|welcome|vault|mage|alchemist|pots|dynamo|crammer|hammer|baron|scholar|navigator|dominator|facilitator|sensei|synapse|volume|thorax|treatment|trigger|vital|marrow|breathe|chakra|core|client|digestive|fascial|fast|first|flexor|foot|heart|lower|lymphatic|massage|meridian|muscle|myofascial|nerve|palpation|pathology|qi|sports|spinal|stretch|swedish|therapeutic|ultimate|summary|welcome|trophy/i.test(id)) {
    return `Unlock the ${name} badge by demonstrating excellence in ${name.toLowerCase()}.`;
  }
  return `Unlock the ${name} badge!`;
}

function getDefaultCategory(id, name) {
  if (/streak/i.test(id)) return "Streak";
  if (/quiz|assessment|test/i.test(id)) return "Quiz";
  if (/accuracy|pro|master|elite|champ|titan|sage|maestro|legend|boss|star|ace|adept|apprentice|specialist|conquerer|devotee|monarch|commander|maverick|focus|flow|guru|whisperer|strategist|tactician|summary|vault|mage|alchemist|dynamo|crammer|hammer|baron|scholar|navigator|dominator|facilitator|sensei|synapse|volume|thorax|treatment|trigger|vital|marrow|breathe|chakra|core|client|digestive|fascial|fast|first|flexor|foot|heart|lower|lymphatic|massage|meridian|muscle|myofascial|nerve|palpation|pathology|qi|sports|spinal|stretch|swedish|therapeutic|ultimate|summary|welcome|trophy/i.test(id)) return "Achievement";
  return "General";
}

function getDefaultDifficulty(id, name) {
  if (/100|master|elite|legend|vault|pro|titan|500|200|gold/i.test(id)) return "hard";
  if (/50|90|champ|sage|maestro|specialist|conquerer|devotee|monarch|commander|focus|flow|guru|whisperer|strategist|tactician|summary|mage|alchemist|dynamo|crammer|hammer|baron|scholar|navigator|dominator|facilitator|sensei|synapse|volume|thorax|treatment|trigger|vital|marrow|breathe|chakra|core|client|digestive|fascial|fast|first|flexor|foot|heart|lower|lymphatic|massage|meridian|muscle|myofascial|nerve|palpation|pathology|qi|sports|spinal|stretch|swedish|therapeutic|ultimate|summary|welcome|trophy/i.test(id)) return "medium";
  return "easy";
}

function getDefaultUnlockHint(id, name) {
  if (/streak_(\d+)/i.test(id)) {
    const n = id.match(/streak_(\d+)/i)[1];
    return `Log in or complete a session for ${n} consecutive days.`;
  }
  if (/accuracy_(\d+)/i.test(id)) {
    const n = id.match(/accuracy_(\d+)/i)[1];
    return `Score ${n}% or higher on a quiz.`;
  }
  if (/first_quiz/i.test(id)) return "Complete your first quiz.";
  if (/quiz_thousand_club/i.test(id)) return "Answer 1000 quiz questions.";
  if (/badge_collector/i.test(id)) return "Earn multiple different badges.";
  return `See badge description for details.`;
}

function getDefaultTags(id, name) {
  const tags = [];
  if (/streak/i.test(id)) tags.push("streak");
  if (/quiz/i.test(id)) tags.push("quiz");
  if (/accuracy/i.test(id)) tags.push("accuracy");
  if (/gold/i.test(id)) tags.push("gold");
  if (/pro|master|elite|champ|titan|sage|maestro|legend|boss|star|ace|adept|apprentice|specialist|conquerer|devotee|monarch|commander|maverick|focus|flow|guru|whisperer|strategist|tactician|summary|mage|alchemist|dynamo|crammer|hammer|baron|scholar|navigator|dominator|facilitator|sensei|synapse|volume|thorax|treatment|trigger|vital|marrow|breathe|chakra|core|client|digestive|fascial|fast|first|flexor|foot|heart|lower|lymphatic|massage|meridian|muscle|myofascial|nerve|palpation|pathology|qi|sports|spinal|stretch|swedish|therapeutic|ultimate|summary|welcome|trophy/i.test(id)) tags.push("achievement");
  return tags;
}

function getDefaultThemeColor(id) {
  if (/gold/i.test(id)) return "#FFD700";
  if (/silver/i.test(id)) return "#C0C0C0";
  if (/bronze/i.test(id)) return "#CD7F32";
  return "#4A90E2";
}

function enrichBadges(badges) {
  const today = new Date().toISOString().slice(0, 10);
  return badges.map((badge, i) => {
    let newBadge = { ...badge };
    if (!badge.name || badge.name.trim() === '' || badge.name === badge.id || /\.png$/i.test(badge.name)) {
      newBadge.name = prettifyName(badge.id);
    }
    if (!badge.description || isGenericDescription(badge.description, badge.id)) {
      newBadge.description = prettifyDescription(badge.id, newBadge.name);
    }
    if (!badge.category) newBadge.category = getDefaultCategory(badge.id, badge.name);
    if (!badge.difficulty) newBadge.difficulty = getDefaultDifficulty(badge.id, badge.name);
    if (!badge.date_created) newBadge.date_created = today;
    if (typeof badge.is_limited_time === 'undefined') newBadge.is_limited_time = false;
    if (!badge.unlock_hint) newBadge.unlock_hint = getDefaultUnlockHint(badge.id, badge.name);
    if (typeof badge.display_order === 'undefined') newBadge.display_order = i + 1;
    if (!badge.theme_color) newBadge.theme_color = getDefaultThemeColor(badge.id);
    if (typeof badge.is_active === 'undefined') newBadge.is_active = true;
    if (!badge.tags) newBadge.tags = getDefaultTags(badge.id, badge.name);
    if (!badge.url) newBadge.url = `/badges/${badge.id}`;
    return newBadge;
  });
}

function main() {
  const badges = JSON.parse(fs.readFileSync(BADGES_PATH, 'utf8'));
  const enriched = enrichBadges(badges);
  fs.writeFileSync(BADGES_PATH, JSON.stringify(enriched, null, 2));
  console.log('Badge metadata enrichment complete.');
}

main();
