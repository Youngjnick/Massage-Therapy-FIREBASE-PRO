// --- 3. BADGES SETUP ---
import badges from "../data/badges.js";
import * as badgeFns from "../data/generated_badge_conditions.js";

badges.forEach(badge => {
  const fnName = "checkUnlock_" + badge.id.replace(/[-\s%]/g, "_");
  badge.condition = badgeFns[fnName] || (() => false);
});

export { badges };

// TODO: Implement badge modal display
export function showBadgeModal(badge) {
  // Implementation goes here
}

export function checkBadgeUnlock(badge, userData) {
  const earned = userData.badges?.[badge.id]?.unlocked;
  if (earned) {return true;}

  if (badge.streak_days_required && userData.current_streak_days >= badge.streak_days_required) {
    return true;
  }

  if (badge.id === "first_quiz") {return userData.total_quizzes >= 1;}
  if (badge.id === "quiz_thousand_club") {return userData.total_questions_answered >= 1000;}

  return false;
}

// TODO: Implement badge checking logic
// Accepts userStats object and returns array of unlocked badge ids
export function checkBadges(user) {
  // Use the same logic as src/utils/badges.js for consistency
  const unlocked = [];
  for (const badge of badges) {
    const fnName = "checkUnlock_" + badge.id.replace(/[-\s%]/g, "_");
    if (typeof badgeFns[fnName] === "function") {
      try {
        if (badgeFns[fnName](user)) { unlocked.push(badge.id); }
      } catch (e) {
        console.error(`Error checking badge ${badge.id}:`, e);
      }
    }
  }
  return unlocked;
}

function showNotification(title, message, icon) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <img src="${icon}" alt="Badge Icon">
    <div>
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Example Usage:
showNotification("Badge Unlocked!", "You earned the 'Quiz Master' badge!", "/badges/quiz_master.png");

export { showNotification };