// import * as badgeConditions from "../data/generated_badge_conditions.js";
// import badges from "../data/badges.js";

// Use runtime fetch of badges.json for all badge data
export async function getAllBadges() {
  const resp = await fetch("/badges/badges.json");
  if (!resp.ok) throw new Error("Failed to load badges.json");
  return await resp.json();
}

export function getBadgeIconPath(badge) {
  if (!badge) return '/badges/SOAP_star_basic.png';
  let icon = badge.icon || badge.id;
  if (!icon) return '/badges/SOAP_star_basic.png';
  icon = icon.toLowerCase().replace(/[-\s]+/g, "_");
  if (!icon.endsWith(".png")) {icon += ".png";}
  // If the icon is missing or default, use SOAP_star_basic.png (case-sensitive)
  if (icon === "default.png" || !icon || !/\.png$/.test(icon)) {icon = "SOAP_star_basic.png";}
  return `/badges/${icon}`;
}

// Optionally, remove checkBadges if badge conditions are not used anymore
// export function checkBadges(user) {
//   const unlocked = [];
//   for (const badge of badges) {
//     const fnName = "checkUnlock_" + badge.id.replace(/-/g, "_").replace(/\s/g, "_");
//     if (typeof badgeConditions[fnName] === "function") {
//       try {
//         if (badgeConditions[fnName](user)) {unlocked.push(badge.id);}
//       } catch (e) {
//         console.error(`Error checking badge ${badge.id}:`, e);
//       }
//     }
//   }
//   return unlocked;
// }
