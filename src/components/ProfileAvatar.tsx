import React from "react";
import type { User } from "firebase/auth";
import type { JSX } from "react";

// Helper to safely get env vars in Vite or Jest
function getEnv(key: string, fallback: string): string {
  try {
    if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.JEST_WORKER_ID
    )
      return fallback;
    if (
      typeof import.meta !== "undefined" &&
      import.meta.env &&
      key in import.meta.env
    ) {
      return String(import.meta.env[key]);
    }
  } catch {}
  if (typeof process !== "undefined" && process.env && key in process.env) {
    return String(process.env[key]);
  }
  return fallback;
}

/**
 * ProfileAvatar - React version of the profile avatar in the header.
 * Props:
 *   user: object - user info (photoURL, displayName)
 *   onClick: function - open profile modal
 */
export default function ProfileAvatar({
  user,
  onClick,
}: {
  user: User | null;
  onClick: () => void;
}): JSX.Element {
  const avatarUrl =
    user?.photoURL || `${getEnv("BASE_URL", "/")}default_avatar.png`;
  const displayName = user?.displayName || "Profile";
  return (
    <div
      className="profile-btn"
      id="profileBtn"
      tabIndex={0}
      aria-label="User Profile"
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <img
        src={avatarUrl}
        alt={displayName}
        style={{ width: 70, height: 70, borderRadius: "50%" }}
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          e.currentTarget.src = `${getEnv("BASE_URL", "/")}default_avatar.png`;
        }}
      />
    </div>
  );
}
