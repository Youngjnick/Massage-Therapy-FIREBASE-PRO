import React, { useState } from "react";
import {
  BADGE_CONDITIONS_META,
  checkBadgeUnlockByKey,
  getBadgeProgress,
  BadgeUser,
} from "../data/badgeConditions";
import SmartBadgeNotification from "./SmartBadgeNotification";
import { useSmartBadgeNotifications } from "./useSmartBadgeNotifications";

interface BadgeListProps {
  user: BadgeUser;
}

// Patch: Add difficulty to BadgeConditionMeta for richer grouping
interface BadgeConditionMetaWithDifficulty {
  key: string;
  label: string;
  description: string;
  threshold?: number;
  topic?: string;
  property?: string;
  logicType?: "threshold" | "topic" | "custom";
  customCheck?: (user: BadgeUser) => boolean;
  category?: string;
  difficulty?: string;
}

// Use BADGE_CONDITIONS_META as BadgeConditionMetaWithDifficulty[]
const BADGE_META: BadgeConditionMetaWithDifficulty[] =
  BADGE_CONDITIONS_META as BadgeConditionMetaWithDifficulty[];

// Group badges by category using a new 'category' field in the config
const getGroupedBadges = (badges: typeof BADGE_CONDITIONS_META) => {
  const groups: Record<string, typeof BADGE_CONDITIONS_META> = {};
  badges.forEach((badge) => {
    const category = badge.category || "Other";
    if (!groups[category]) groups[category] = [];
    groups[category].push(badge);
  });
  return groups;
};

export const BadgeList: React.FC<BadgeListProps> = ({ user }) => {
  const [notification, setNotification] = useSmartBadgeNotifications(user);
  const [difficulty, setDifficulty] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Filter badges by difficulty and search
  const filtered = BADGE_META.filter((badge) => {
    if (difficulty && badge.difficulty !== difficulty) return false;
    if (
      search &&
      !badge.label.toLowerCase().includes(search.toLowerCase()) &&
      !(
        badge.description &&
        badge.description.toLowerCase().includes(search.toLowerCase())
      )
    )
      return false;
    return true;
  });
  const groups = getGroupedBadges(filtered);

  // Collect all unique difficulties for filter bar
  const difficulties = Array.from(
    new Set(BADGE_META.map((b) => b.difficulty).filter(Boolean)),
  );

  return (
    <div>
      {notification && (
        <SmartBadgeNotification
          badgeLabel={notification.label}
          message={notification.message}
          icon={notification.icon}
          onClose={() => setNotification(null)}
        />
      )}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 16,
          alignItems: "center",
        }}
      >
        <label>
          Difficulty:
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="">All</option>
            {difficulties.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <input
          type="text"
          placeholder="Search badges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 4,
            borderRadius: 4,
            border: "1px solid #ccc",
            minWidth: 180,
          }}
        />
      </div>
      {Object.entries(groups).map(([category, badges]) => (
        <div key={category} style={{ marginBottom: 32 }}>
          <h3>{category}</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {badges
              .filter((badge) => checkBadgeUnlockByKey(badge.key, user))
              .map((badge) => (
                <li
                  key={badge.key}
                  style={{
                    marginBottom: 16,
                    background: "#e8f5e9",
                    padding: 8,
                    borderRadius: 6,
                  }}
                >
                  <strong>{badge.label}</strong>: {badge.description}
                  <span style={{ marginLeft: 8 }}>✅ Unlocked</span>
                </li>
              ))}
          </ul>
          <details>
            <summary style={{ cursor: "pointer", color: "#888" }}>
              Show locked badges
            </summary>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {badges
                .filter((badge) => !checkBadgeUnlockByKey(badge.key, user))
                .map((badge) => {
                  const progress = getBadgeProgress(badge.key, user);
                  return (
                    <li
                      key={badge.key}
                      style={{
                        marginBottom: 16,
                        background: "#fff3e0",
                        padding: 8,
                        borderRadius: 6,
                      }}
                    >
                      <strong>{badge.label}</strong>: {badge.description}
                      <span style={{ marginLeft: 8 }}>🔒 Locked</span>
                      {progress && (
                        <div style={{ fontSize: 12, color: "#888" }}>
                          Progress: {progress.current} / {progress.needed} (
                          {progress.percent}%)
                          <div
                            style={{
                              background: "#eee",
                              borderRadius: 4,
                              height: 8,
                              width: 120,
                              marginTop: 2,
                            }}
                          >
                            <div
                              style={{
                                background: "#ff9800",
                                width: `${progress.percent}%`,
                                height: "100%",
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </details>
        </div>
      ))}
    </div>
  );
};

// --- Badge notification automation example ---
export function notifyBadgeEarned(badgeKey: string) {
  if (window.Notification && Notification.permission === "granted") {
    const badge = BADGE_CONDITIONS_META.find((b) => b.key === badgeKey);
    if (badge) {
      new Notification("Badge Unlocked!", {
        body: `You earned the badge: ${badge.label}`,
        icon: "/public/badges/" + badge.key + ".png",
      });
    }
  }
}

// --- Admin badge editing stub (for future expansion) ---
export function updateBadgeMeta(
  key: string,
  updates: Partial<(typeof BADGE_CONDITIONS_META)[0]>,
) {
  // In a real app, this would update the config in a database or admin panel
  // Here, just a placeholder for future admin UI
  const badge = BADGE_CONDITIONS_META.find((b) => b.key === key);
  if (badge) Object.assign(badge, updates);
}
