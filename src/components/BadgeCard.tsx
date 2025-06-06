import React from "react";
import { getBadgeIconPath, Badge } from "../utils/badgeHelpers";
import styles from "./BadgeCard.module.css";

export interface BadgeCardProps {
  badge: Badge;
  onShowDetails?: (badge: Badge) => void;
  className?: string;
}

const BadgeCard: React.FC<BadgeCardProps> = React.memo(function BadgeCard({
  badge,
  onShowDetails,
  className,
}) {
  return (
    <div
      role="checkbox"
      tabIndex={0}
      aria-label={typeof badge.name === 'string' ? badge.name : String(badge.id)}
      aria-checked={badge.earned ? "true" : "false"}
      aria-describedby={`badge-desc-${badge.id}`}
      data-testid={`badge-${badge.earned ? "earned" : "unearned"}-${badge.id}`}
      className={[
        styles.badgeCard,
        badge.earned ? styles.badgeEarned : styles.badgeUnearned,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          onShowDetails && onShowDetails(badge);
        }
      }}
      onClick={() => onShowDetails && onShowDetails(badge)}
      aria-roledescription="badge"
      title={typeof badge.description === 'string' ? badge.description : (typeof badge.name === 'string' ? badge.name : String(badge.id))}
    >
      <img
        src={getBadgeIconPath(badge) || (typeof badge.image === 'string' ? badge.image : undefined) || "/badges/default.png"}
        alt={typeof badge.name === 'string' ? badge.name : badge.id}
        className={styles.badgeImg}
        data-testid={`badge-img-${badge.id}`}
      />
      <span className={styles.badgeName}>{typeof badge.name === 'string' ? badge.name : badge.id}</span>
      <span className="sr-only" data-testid={`badge-status-${badge.id}`}>
        {badge.earned ? "Earned" : "Not earned"}
      </span>
      <span id={`badge-desc-${badge.id}`} className="sr-only">
        {typeof badge.description === 'string' ? badge.description : ""}
      </span>
      <span className="sr-only" data-testid={`badge-label-${badge.id}`}>
        {typeof badge.name === 'string' ? badge.name : badge.id}
      </span>
    </div>
  );
});

export default BadgeCard;
