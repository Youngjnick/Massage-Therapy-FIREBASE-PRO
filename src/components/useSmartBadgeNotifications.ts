import { useEffect, useState } from "react";
import {
  BADGE_CONDITIONS_META,
  checkBadgeUnlockByKey,
  getBadgeProgress,
  BadgeUser,
} from "../data/badgeConditions";

interface SmartNotification {
  badgeKey: string;
  label: string;
  message: string;
  icon?: string;
}

export function useSmartBadgeNotifications(user: BadgeUser) {
  const [notification, setNotification] = useState<SmartNotification | null>(
    null,
  );

  useEffect(() => {
    // Check for badges that are almost unlocked (e.g., 80-99% progress)
    for (const badge of BADGE_CONDITIONS_META) {
      if (
        badge.logicType === "threshold" &&
        badge.property &&
        typeof badge.threshold === "number"
      ) {
        const progress = getBadgeProgress(badge.key, user);
        if (
          progress &&
          progress.percent >= 80 &&
          progress.percent < 100 &&
          !checkBadgeUnlockByKey(badge.key, user)
        ) {
          setNotification({
            badgeKey: badge.key,
            label: badge.label,
            message: `You're almost there! Only ${progress.needed - progress.current} more to unlock this badge.`,
            icon: `/badges/${badge.key}.png`,
          });
          break;
        }
      }
    }
  }, [user]);

  return [notification, setNotification] as const;
}
