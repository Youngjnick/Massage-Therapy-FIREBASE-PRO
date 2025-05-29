import React from "react";

/**
 * ProfileAvatar - React version of the profile avatar in the header.
 * Props:
 *   user: object - user info (photoURL, displayName)
 *   onClick: function - open profile modal
 */
export default function ProfileAvatar({ user, onClick }) {
  const avatarUrl = user?.photoURL || "/default-avatar.png";
  const displayName = user?.displayName || "Profile";
  return (
    <div className="profile-btn" id="profileBtn" tabIndex={0} aria-label="User Profile" style={{marginLeft:"auto", display:"flex", alignItems:"center", cursor:"pointer"}} onClick={onClick}>
      <img
        src={avatarUrl}
        alt={displayName}
        style={{ width: 70, height: 70, borderRadius: "50%" }}
        onError={e => { e.target.src = "/default-avatar.png"; }}
      />
    </div>
  );
}
