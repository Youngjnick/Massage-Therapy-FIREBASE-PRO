import type { Badge } from "./utils/badgeHelpers";
import type { Question } from "./utils/index";
import { getAllBadges } from "./utils/badgeHelpers";
import { mapUserBadgesToObjects } from "./utils/mapUserBadgesToObjects";
import { fetchQuestions } from "./firebase/helpersFirebase";

export interface AppState {
  questions?: Question[];
  badges?: Badge[];
  bookmarks?: string[];
  [key: string]: unknown;
}

const appState: AppState = {};

if (typeof window !== "undefined") {
  window.appState = appState;
  window.fetchQuestions = fetchQuestions;
}

export async function setUserBadges(earnedBadgeIds: string[]): Promise<void> {
  if (typeof window === "undefined" || !window.appState) return;
  const badges = await getAllBadges();
  window.appState.badges = mapUserBadgesToObjects(earnedBadgeIds, badges);
}

export default appState;
