// --- 3. BADGES SETUP ---
import { getAllBadges, Badge } from "../utils/badgeHelpers";
import type { User } from "firebase/auth";
import { BadgeUser } from "../data/badgeConditions";
import * as badgeFns from "../data/badgeConditions";

// TODO: Implement badge modal display
export function showBadgeModal(): void {
  // Implementation goes here
}

export function checkBadgeUnlock(badge: Badge, userData: BadgeUser): boolean {
  // Type guard for userData.badges
  const badgeMap = (userData.badges && typeof userData.badges === 'object') ? userData.badges as Record<string, { unlocked?: boolean }> : {};
  const earned = badgeMap[badge.id]?.unlocked;
  if (earned) {
    return true;
  }
  // Type guard for streak_days_required and current_streak_days
  if (
    typeof badge.streak_days_required === 'number' &&
    typeof userData.current_streak_days === 'number' &&
    userData.current_streak_days >= badge.streak_days_required
  ) {
    return true;
  }
  if (badge.id === "first_quiz") {
    return (userData.total_quizzes ?? 0) >= 1;
  }
  if (badge.id === "quiz_thousand_club") {
    return (userData.total_questions_answered ?? 0) >= 1000;
  }
  return false;
}

// Accepts userStats object and returns array of unlocked badge ids
export async function checkBadges(user: User): Promise<string[]> {
  const badges = await getAllBadges();
  const unlocked: string[] = [];
  for (const badge of badges) {
    const fnName = "checkUnlock_" + badge.id.replace(/[-\s%]/g, "_");
    const fn = (badgeFns as Record<string, unknown>)[fnName];
    if (typeof fn === "function") {
      try {
        if ((fn as (u: User) => boolean)(user)) {
          unlocked.push(badge.id);
        }
      } catch (e) {
        console.error(`Error checking badge ${badge.id}:`, e);
      }
    }
  }
  return unlocked;
}

function showNotification(title: string, message: string, icon: string): void {
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
showNotification(
  "Badge Unlocked!",
  "You earned the 'Quiz Master' badge!",
  "/badges/quiz_crusher.png",
);

export { showNotification };
